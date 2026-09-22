"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function normalizeGeneratedText(value) {
  if (value === null || value === undefined) return "";

  let text = String(value).trim();

  if (!text) return "";

  text = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  if ((text.startsWith("{") && text.endsWith("}")) || (text.startsWith("[") && text.endsWith("]"))) {
    try {
      const parsed = JSON.parse(text);

      if (typeof parsed === "string") return normalizeGeneratedText(parsed);

      if (Array.isArray(parsed)) {
        const firstString = parsed.find((item) => typeof item === "string" && item.trim());
        if (firstString) return normalizeGeneratedText(firstString);
      }

      if (parsed && typeof parsed === "object") {
        const firstValue = Object.values(parsed).find(
          (item) => typeof item === "string" && item.trim()
        );

        if (firstValue) return normalizeGeneratedText(firstValue);
      }
    } catch (error) {
      // Ignore JSON parse failures and fall back to the raw text.
    }
  }

  return text
    .replace(/\\n/g, "\n")
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/`+/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^['\"]|['\"]$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Used for the improvement tip (stays consistent)
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
    temperature: 0.2,
  },
});

// Used for quiz questions (higher temperature = different questions each time)
const quizModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
    temperature: 1.0,
  },
});

// Retry helper for Gemini 503 errors
async function generateContentWithRetry(
  prompt,
  retries = 3,
  delay = 2000,
  selectedModel = model
) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await selectedModel.generateContent(prompt);
    } catch (error) {
      const retryable =
        error.status === 503 ||
        error.message?.includes("503") ||
        error.message?.includes("overloaded");

      if (retryable && i < retries) {
        await new Promise((resolve) =>
          setTimeout(resolve, delay * (i + 1))
        );
      } else {
        throw error;
      }
    }
  }
}

export async function generateQuiz() {
  const { userId } = await auth();

  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: {
      id: true,
      industry: true,
      skills: true,
    },
  });

  if (!user) throw new Error("User not found");

  // Get questions from the last 3 quizzes so we don't repeat them
  const pastAssessments = await db.assessment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 3,
    select: { questions: true },
  });

  const previousQuestions = pastAssessments
    .flatMap((a) => (Array.isArray(a.questions) ? a.questions : []))
    .map((q) => q.question)
    .filter(Boolean)
    .slice(0, 30);

  const prompt = `
Generate 10 technical interview questions for a ${
    user.industry
  } professional${
    user.skills?.length
      ? ` with expertise in ${user.skills.join(", ")}`
      : ""
  }.

Each question should be multiple choice with 4 options.
Cover a different mix of topics and difficulty levels each time.
${
  previousQuestions.length
    ? `
Do NOT repeat or rephrase any of these questions that were already asked:
${previousQuestions.map((q) => `- ${q}`).join("\n")}
`
    : ""
}
Return ONLY JSON:

{
 "questions":[
  {
   "question":"string",
   "options":["string","string","string","string"],
   "correctAnswer":"string",
   "explanation":"string"
  }
 ]
}
`;

  try {
    const result = await generateContentWithRetry(prompt, 3, 2000, quizModel);

    const text = result.response.text();

    const cleanedText = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const quiz = JSON.parse(cleanedText);

    if (
      !Array.isArray(quiz.questions) ||
      quiz.questions.length !== 10 ||
      quiz.questions.some(
        (question) =>
          !question.question ||
          !Array.isArray(question.options) ||
          question.options.length !== 4 ||
          !question.correctAnswer ||
          !question.explanation
      )
    ) {
      throw new Error("Gemini returned an invalid quiz shape");
    }

    return quiz.questions;
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw new Error("Failed to generate quiz questions");
  }
}

export async function saveQuizResult(questions, answers, score) {
  const { userId } = await auth();

  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const questionResults = questions.map((q, index) => ({
    question: normalizeGeneratedText(q.question),
    answer: normalizeGeneratedText(q.correctAnswer),
    userAnswer: normalizeGeneratedText(answers[index]),
    isCorrect: normalizeGeneratedText(q.correctAnswer) === normalizeGeneratedText(answers[index]),
    explanation: normalizeGeneratedText(q.explanation),
  }));

  const wrongAnswers = questionResults.filter((q) => !q.isCorrect);

  let improvementTip = null;

  if (wrongAnswers.length > 0) {
    const wrongQuestionsText = wrongAnswers
      .map(
        (q) =>
          `Question:${q.question}
Correct:${q.answer}
User:${q.userAnswer}`
      )
      .join("\n\n");

    const improvementPrompt = `
The user needs improvement in ${user.industry}.

Questions:

${wrongQuestionsText}

Give a short learning suggestion under 2 sentences.
`;

    try {
      const tipResult = await generateContentWithRetry(improvementPrompt);

      improvementTip = normalizeGeneratedText(tipResult.response.text());
    } catch (error) {
      console.error("Error generating improvement tip:", error);
    }
  }

  try {
    const assessment = await db.assessment.create({
      data: {
        userId: user.id,
        quizScore: score,
        questions: questionResults,
        category: "Technical",
        improvementTip,
      },
    });

    return assessment;
  } catch (error) {
    console.error("Error saving quiz result:", error);

    throw new Error("Failed to save quiz result");
  }
}

export async function getAssessments() {
  const { userId } = await auth();

  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    return await db.assessment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });
  } catch (error) {
    console.error("Error fetching assessments:", error);

    throw new Error("Failed to fetch assessments");
  }
}
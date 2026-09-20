"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

export const generateAIInsights = async (industry) => {
  const prompt = `
          Analyze the current state of the ${industry} industry and provide insights in ONLY the following JSON format without any additional notes or explanations:
          {
            "salaryRanges": [
              { "role": "string", "min": number, "max": number, "median": number, "location": "string" }
            ],
            "growthRate": number,
            "demandLevel": "High" | "Medium" | "Low",
            "topSkills": ["skill1", "skill2"],
            "marketOutlook": "Positive" | "Neutral" | "Negative",
            "keyTrends": ["trend1", "trend2"],
            "recommendedSkills": ["skill1", "skill2"]
          }
          
          IMPORTANT: Return ONLY the JSON. No additional text, notes, or markdown formatting.
          Include at least 5 common roles for salary ranges.
          Growth rate should be a percentage.
          Include at least 5 skills and trends.
        `;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();
  const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

  return JSON.parse(cleanedText);
};

export async function getCareerProfiles() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: {
      id: true,
      industry: true,
      careerProfiles: {
        orderBy: { updatedAt: "desc" },
        select: { id: true, name: true, industry: true },
      },
    },
  });

  if (!user) throw new Error("User not found");

  // Existing accounts get their original profile the first time they use this feature.
  if (!user.careerProfiles.length && user.industry) {
    const profile = await db.careerProfile.upsert({
      where: { userId_industry: { userId: user.id, industry: user.industry } },
      update: {},
      create: {
        userId: user.id,
        name: user.industry.split("-").at(-1)?.replace(/-/g, " ") || "Career Profile",
        industry: user.industry,
        skills: [],
      },
      select: { id: true, name: true, industry: true },
    });
    return [profile];
  }

  return user.careerProfiles;
}

export async function getIndustryInsights(profileId) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: {
      industryInsight: true,
      careerProfiles: true,
    },
  });

  if (!user) throw new Error("User not found");

  const profile = profileId
    ? user.careerProfiles.find((item) => item.id === profileId)
    : user.careerProfiles[0];
  const industry = profile?.industry || user.industry;
  if (!industry) throw new Error("Career profile not found");

  const existingInsight = await db.industryInsight.findUnique({
    where: { industry },
  });

  // If no insights exist, generate them for this industry.
  if (!existingInsight) {
    const insights = await generateAIInsights(industry);

    const industryInsight = await db.industryInsight.create({
      data: {
        industry,
        ...insights,
        nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return industryInsight;
  }

  return existingInsight;
}

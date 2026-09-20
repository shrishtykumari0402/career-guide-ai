"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { generateAIInsights } from "./dashboard";

// Retry helper for transient Gemini 503s
async function generateAIInsightsWithRetry(industry, retries = 2, delay = 1000) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await generateAIInsights(industry);
    } catch (err) {
      const is503 = err.message?.includes("503") || err.message?.includes("overloaded");
      if (is503 && i < retries) {
        await new Promise((r) => setTimeout(r, delay * (i + 1)));
        continue;
      }
      throw err;
    }
  }
}

export async function updateUser(data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    const existingIndustryInsight = await db.industryInsight.findUnique({
      where: { industry: data.industry },
    });

    // AI insights — best-effort. If Gemini fails, insights stays null
    // and the transaction below just skips creating an industryInsight.
    let insights = null;
    if (!existingIndustryInsight) {
      try {
        insights = await generateAIInsightsWithRetry(data.industry);
      } catch (aiError) {
        console.error("Gemini insights failed (non-fatal):", aiError.message);
        insights = null;
      }
    }

    // Start a transaction to handle both operations
    const result = await db.$transaction(
      async (tx) => {
        // First check if industry exists
        let industryInsight = await tx.industryInsight.findUnique({
          where: {
            industry: data.industry,
          },
        });

        // If industry doesn't exist, create it with default values
        if (!industryInsight && insights) {
          industryInsight = await tx.industryInsight.create({
            data: {
              industry: data.industry,
              ...insights,
              nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
          });
        }

        // Keep the legacy user fields for existing features while storing each track separately.
        const updatedUser = await tx.user.update({
          where: {
            id: user.id,
          },
          data: {
            industry: data.industry,
            experience: data.experience,
            bio: data.bio,
            skills: data.skills,
          },
        });

        const profile = await tx.careerProfile.upsert({
          where: {
            userId_industry: {
              userId: user.id,
              industry: data.industry,
            },
          },
          update: {
            name: data.profileName || data.subIndustry || data.industry,
            experience: data.experience,
            bio: data.bio,
            skills: data.skills,
          },
          create: {
            userId: user.id,
            name: data.profileName || data.subIndustry || data.industry,
            industry: data.industry,
            experience: data.experience,
            bio: data.bio,
            skills: data.skills,
          },
        });

        return { updatedUser, industryInsight, profile };
      },
      {
        timeout: 10000, // default: 5000
      }
    );

    revalidatePath("/");
    return { success: true, user: result.updatedUser, profile: result.profile };
  } catch (error) {
    console.error("Error updating user and industry:", error.message);
    throw new Error("Failed to update profile");
  }
}

export async function getUserOnboardingStatus() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
      select: {
        industry: true,
        careerProfiles: { select: { id: true } },
      },
    });

    return {
      isOnboarded: !!user?.industry || (user?.careerProfiles?.length ?? 0) > 0,
    };
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    throw new Error("Failed to check onboarding status");
  }
}
import { redirect } from "next/navigation";
import { industries } from "@/data/industries";
import OnboardingForm from "./_components/onboarding-form";
import { getUserOnboardingStatus } from "@/actions/user";

export default async function OnboardingPage({ searchParams }) {
  // Check if user is already onboarded
  const { isOnboarded } = await getUserOnboardingStatus();

  const isNewProfile = (await searchParams)?.new === "1";

  if (isOnboarded && !isNewProfile) {
    redirect("/dashboard");
  }

  return (
    <main>
      <OnboardingForm industries={industries} isNewProfile={isNewProfile} />
    </main>
  );
}

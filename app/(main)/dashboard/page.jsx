import { getCareerProfiles, getIndustryInsights } from "@/actions/dashboard";
import DashboardView from "./_component/dashboard-view";
import { getUserOnboardingStatus } from "@/actions/user";
import { redirect } from "next/navigation";

export default async function DashboardPage({ searchParams }) {
  const { isOnboarded } = await getUserOnboardingStatus();

  // If not onboarded, redirect to onboarding page
  // Skip this check if already on the onboarding page
  if (!isOnboarded) {
    redirect("/onboarding");
  }

  const profiles = await getCareerProfiles();
  const selectedProfileId = (await searchParams)?.profileId || profiles[0]?.id;
  const activeProfile = profiles.find((profile) => profile.id === selectedProfileId) || profiles[0];
  const insights = await getIndustryInsights(activeProfile?.id);

  return (
    <div className="container mx-auto">
      <DashboardView insights={insights} profiles={profiles} activeProfile={activeProfile} />
    </div>
  );
}

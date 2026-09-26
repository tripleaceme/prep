import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { VerifyBanner } from "@/components/VerifyBanner";
import { callApi } from "@/lib/api";
import { readSession } from "@/lib/session";
import { assetUrl } from "@/lib/profileActions";

interface ProfileResponse {
  profile: {
    display_name: string | null;
    avatar_url: string | null;
    email: string;
    onboarded: boolean;
    verified: boolean;
  } | null;
}

export default async function DashLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await readSession();
  if (!session) redirect("/login");

  let displayName = session.email.split("@")[0];
  let email = session.email;
  let avatar: string | null = null;
  let needsOnboarding = false;
  // Assume verified when go54 is unreachable — nagging someone about an email
  // they may well have confirmed is worse than missing the banner for a load.
  let verified = true;

  try {
    const { profile } = await callApi<ProfileResponse>("profile", {
      userId: session.userId,
    });
    if (profile) {
      displayName = profile.display_name?.trim() || displayName;
      email = profile.email || email;
      avatar = await assetUrl(profile.avatar_url);
      needsOnboarding = !profile.onboarded;
      verified = profile.verified;
    }
  } catch {
    // go54 unreachable — fall back to the email handle rather than blocking
    // the whole app on a profile lookup.
  }

  // Outside the try: redirect() signals by throwing.
  if (needsOnboarding) redirect("/onboarding");

  /*
    A fixed shell: the document itself never scrolls.

    The whole app is exactly one viewport tall, and anything longer scrolls
    inside its own region rather than stretching the page. That makes the
    sidebar permanently reachable, keeps a screen's header where you left it,
    and — the reason it is done here rather than page by page — means a page
    that grows past the viewport degrades into an inner scroll instead of
    silently pushing the layout off the bottom.

    Pages are still expected to fit. This is the floor, not the plan.
  */
  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar displayName={displayName} avatar={avatar} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {verified ? null : <VerifyBanner email={email} />}
        {/* min-h-0 is what lets this shrink inside the flex parent; without
            it a flex child refuses to go below its content height and the
            overflow moves back out to the document. */}
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}

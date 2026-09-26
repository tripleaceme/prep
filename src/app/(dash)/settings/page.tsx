import { redirect } from "next/navigation";
import { callApi } from "@/lib/api";
import { readSession } from "@/lib/session";
import { assetUrl } from "@/lib/profileActions";
import { ApiKeyPanel } from "./ApiKeyPanel";
import { ProfilePanel } from "./ProfilePanel";
import { LanguageSelect } from "@/components/LanguageSelect";

export const metadata = { title: "Settings" };

interface ProfileResponse {
  profile: {
    email: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export default async function SettingsPage() {
  const session = await readSession();
  if (!session) redirect("/login");

  let name = session.email.split("@")[0];
  let avatar: string | null = null;
  let email = session.email;

  try {
    const { profile } = await callApi<ProfileResponse>("profile", {
      userId: session.userId,
    });
    if (profile) {
      name = profile.display_name?.trim() || name;
      email = profile.email || email;
      avatar = await assetUrl(profile.avatar_url);
    }
  } catch {
    // Settings still loads with what the session knows; saving surfaces any
    // real error.
  }

  return (
    <main className="mx-auto max-w-[1180px] px-6 py-8 lg:px-10">
      <h1 className="text-[28px] font-bold">Settings</h1>

      {/* Side by side from the large breakpoint up. `items-start` matters:
          without it the two panels stretch to match, so the key panel growing
          when a key is saved would drag the profile panel taller with it. */}
      <div className="mt-6 grid items-start gap-5 lg:grid-cols-2">
        <ProfilePanel initialName={name} initialAvatar={avatar} email={email} />

        <div className="space-y-5">
          <ApiKeyPanel />

          <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-6">
            <h2 className="text-lg font-bold">Language</h2>
            <div className="mt-4">
              <LanguageSelect />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

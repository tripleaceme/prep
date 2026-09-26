import { redirect } from "next/navigation";
import { callApi } from "@/lib/api";
import { readSession } from "@/lib/session";
import { assetUrl } from "@/lib/profileActions";
import { ApiKeyPanel } from "./ApiKeyPanel";
import { ProfilePanel } from "./ProfilePanel";
import { DeletePanel } from "./DeletePanel";
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

      {/* Two columns throughout. The panels stretch to match their row, so
          each pair ends level however much content it holds — a card that
          stops short of its neighbour reads as unfinished rather than as
          simply having less to say.

          Language and Delete share the second row because neither justifies
          the full width, and pairing them means the destructive action is
          never the widest thing on the page. */}
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <ProfilePanel initialName={name} initialAvatar={avatar} email={email} />
        <ApiKeyPanel />

        <section className="flex h-full flex-col rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="text-lg font-bold">Language</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">
            Changes the interface and the language your interviewer speaks.
          </p>
          <div className="mt-auto pt-5">
            <LanguageSelect />
          </div>
        </section>

        <DeletePanel />
      </div>
    </main>
  );
}

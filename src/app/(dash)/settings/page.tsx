import { redirect } from "next/navigation";
import { callApi } from "@/lib/api";
import { readSession } from "@/lib/session";
import { assetUrl } from "@/lib/profileActions";
import { ApiKeyPanel } from "./ApiKeyPanel";
import { ProfilePanel } from "./ProfilePanel";

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
    <main className="mx-auto max-w-[760px] px-6 py-10 lg:px-10">
      <h1 className="text-[30px] font-bold">Settings</h1>
      <div className="mt-8 space-y-6">
        <ProfilePanel initialName={name} initialAvatar={avatar} email={email} />
        <ApiKeyPanel />
      </div>
    </main>
  );
}

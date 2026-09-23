import { ApiKeyPanel } from "./ApiKeyPanel";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-[760px] px-6 py-10 lg:px-10">
      <h1 className="text-[30px] font-bold">Settings</h1>
      <p className="mt-2 text-[var(--text-muted)]">
        Prep has no credits to manage. The only thing it needs from you is a key.
      </p>
      <div className="mt-8">
        <ApiKeyPanel />
      </div>
    </main>
  );
}

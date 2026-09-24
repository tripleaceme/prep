"use client";

import { useRef, useState } from "react";
import {
  Briefcase,
  FileText,
  Loader2,
  Sparkles,
  Upload,
  User,
} from "lucide-react";
import { InterviewRunner } from "@/components/interview/InterviewRunner";
import { startInterview } from "@/lib/interviewActions";
import { readDocument } from "@/lib/readDocument";

type Source = "role" | "job_post" | "cv";

const SOURCES: { value: Source; label: string; hint: string; icon: typeof User }[] = [
  {
    value: "role",
    label: "Type a role",
    hint: "Name the job you're interviewing for",
    icon: User,
  },
  {
    value: "job_post",
    label: "Paste a job post",
    hint: "We pull the skills straight from it",
    icon: Briefcase,
  },
  {
    value: "cv",
    label: "Use my CV",
    hint: "Get grilled on your real experience",
    icon: FileText,
  },
];

const STAGES = [
  { value: "recruiter_screen", label: "Recruiter screen" },
  { value: "technical", label: "Technical" },
  { value: "advanced_technical", label: "Advanced technical" },
];

const inputClass =
  "w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3.5 outline-none placeholder:text-[var(--text-faint)] focus:border-[var(--brand-bright)]";

export function InterviewSetup() {
  const [source, setSource] = useState<Source>("role");
  const [roleTitle, setRoleTitle] = useState("");
  const [jobPost, setJobPost] = useState("");
  const [cvText, setCvText] = useState("");
  const [cvName, setCvName] = useState("");
  const [focus, setFocus] = useState("");
  const [stage, setStage] = useState("technical");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<{
    id: string;
    roleTitle?: string;
    jobDescription?: string;
  } | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    try {
      const text = await readDocument(file);
      setCvText(text);
      setCvName(file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't read that file.");
    }
  }

  const ready =
    (source === "role" && roleTitle.trim().length > 1) ||
    (source === "job_post" && jobPost.trim().length > 40) ||
    (source === "cv" && cvText.trim().length > 40);

  async function begin() {
    if (!ready || busy) return;
    setBusy(true);
    setError(null);

    const jobDescription =
      source === "job_post"
        ? jobPost.trim()
        : source === "cv"
          ? `The candidate's CV:\n${cvText.trim()}`
          : undefined;

    const outcome = await startInterview({
      kind: "ai",
      source,
      role_title: roleTitle.trim() || undefined,
      job_description: jobDescription,
      focus: focus.trim() || undefined,
      stage,
    });

    if ("error" in outcome) {
      setError(outcome.error);
      setBusy(false);
      return;
    }

    setSession({
      id: outcome.id,
      roleTitle: roleTitle.trim() || undefined,
      jobDescription,
    });
  }

  if (session) {
    return (
      <InterviewRunner
        interviewId={session.id}
        title="AI Interview"
        setup={{
          kind: "ai",
          roleTitle: session.roleTitle,
          jobDescription: session.jobDescription,
          focus: focus.trim() || undefined,
          stage: STAGES.find((s) => s.value === stage)?.label,
        }}
      />
    );
  }

  return (
    <main className="mx-auto max-w-[1000px] px-6 py-10 lg:px-10">
      <h1 className="text-[36px] font-bold leading-tight">
        Practice a real interview — for the role you want.
      </h1>
      <p className="mt-4 max-w-[68ch] leading-relaxed text-[var(--text-muted)]">
        Type a role, paste a job post, or upload your CV. You&apos;ll be
        interviewed out loud, then given an honest report on what you actually
        know.
      </p>

      <div className="mt-9 grid gap-8 lg:grid-cols-[1fr_300px]">
        <div>
          <div className="grid gap-3 sm:grid-cols-3">
            {SOURCES.map((option) => {
              const Icon = option.icon;
              const selected = source === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSource(option.value)}
                  className={[
                    "rounded-[var(--radius)] border px-4 py-4 text-left transition-colors",
                    selected
                      ? "border-[var(--brand-bright)] bg-[var(--brand-dim)]"
                      : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)]",
                  ].join(" ")}
                >
                  <Icon
                    className={
                      selected
                        ? "size-5 text-[var(--brand-bright)]"
                        : "size-5 text-[var(--text-muted)]"
                    }
                  />
                  <span className="mt-3 block font-semibold">{option.label}</span>
                  <span className="mt-1 block text-sm text-[var(--text-muted)]">
                    {option.hint}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-6">
            {source === "role" ? (
              <>
                <label htmlFor="role" className="mb-2 block font-semibold">
                  What role are you interviewing for?
                </label>
                <input
                  id="role"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  placeholder="e.g. Analytics Engineer, Data Engineer, BI Analyst"
                  className={inputClass}
                />
              </>
            ) : null}

            {source === "job_post" ? (
              <>
                <label htmlFor="jd" className="mb-2 block font-semibold">
                  Paste the job post
                </label>
                <textarea
                  id="jd"
                  value={jobPost}
                  onChange={(e) => setJobPost(e.target.value)}
                  rows={10}
                  placeholder="Paste the full job description here — we'll pull out the skills and responsibilities and build the interview around them."
                  className={`${inputClass} resize-y`}
                />
                <p className="mt-2 text-sm text-[var(--text-faint)]">
                  The more you paste, the sharper the questions.
                </p>
              </>
            ) : null}

            {source === "cv" ? (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.txt,.md,application/pdf,text/plain"
                  className="sr-only"
                  onChange={(e) => onFile(e.target.files?.[0])}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="grid w-full place-items-center rounded-[var(--radius)] border border-dashed border-[var(--border-strong)] px-6 py-12 transition-colors hover:bg-[var(--surface-2)]"
                >
                  <Upload className="size-6 text-[var(--brand-bright)]" />
                  <span className="mt-4 font-semibold">
                    {cvName || "Drop your CV here or click to browse"}
                  </span>
                  <span className="mt-1 text-sm text-[var(--text-faint)]">
                    PDF or TXT — max 5MB, read in your browser
                  </span>
                </button>
                {cvText ? (
                  <p className="mt-3 text-sm text-[var(--brand-bright)]">
                    Read {cvText.split(/\s+/).length.toLocaleString()} words.
                  </p>
                ) : null}
              </>
            ) : null}

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="stage" className="mb-2 block font-semibold">
                  Interview stage
                </label>
                <select
                  id="stage"
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  className={inputClass}
                >
                  {STAGES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="focus" className="mb-2 block font-semibold">
                  Anything to focus on?{" "}
                  <span className="font-normal text-[var(--text-faint)]">
                    (optional)
                  </span>
                </label>
                <input
                  id="focus"
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
                  placeholder="e.g. dbt and dimensional modelling"
                  className={inputClass}
                />
              </div>
            </div>

            {error ? (
              <p role="alert" className="mt-5 text-sm text-[var(--danger)]">
                {error}
              </p>
            ) : null}

            <button
              type="button"
              onClick={begin}
              disabled={!ready || busy}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius)] bg-[var(--brand)] px-6 py-3.5 font-semibold text-white transition-colors hover:bg-[var(--brand-hover)] disabled:cursor-not-allowed disabled:bg-[var(--surface-3)] disabled:text-[var(--text-faint)]"
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              {busy ? "Setting up…" : "Generate my interview"}
            </button>
          </div>
        </div>

        <aside className="h-fit rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-6">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-[var(--text-faint)]">
            WHAT HAPPENS NEXT
          </p>
          <ol className="mt-5 space-y-5">
            {[
              "The model reads the role and generates questions tailored to it.",
              "Your interviewer asks them one at a time, out loud.",
              "You get an honest report at the end — and it's saved to My Reports.",
            ].map((line, i) => (
              <li key={line} className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[var(--brand-dim)] text-xs font-bold text-[var(--brand-bright)]">
                  {i + 1}
                </span>
                <span className="text-sm leading-relaxed text-[var(--text-muted)]">
                  {line}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-6 border-t border-[var(--border)] pt-5 text-xs leading-relaxed text-[var(--text-faint)]">
            Your CV and answers are sent straight from this browser to Google
            using your own key. We store only the report.
          </p>
        </aside>
      </div>
    </main>
  );
}

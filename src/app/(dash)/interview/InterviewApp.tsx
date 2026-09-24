"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  callInteraction,
  callInteractionJson,
  MissingKeyError,
} from "@/lib/gemini/client";
import {
  PERSONA_NAMES,
  PERSONA_VOICES,
  speak,
  stopSpeaking,
} from "@/lib/gemini/speech";
import {
  buildAiReviewInstruction,
  buildAiSystemInstruction,
  buildModifyPrompt,
  buildSimulatePrompt,
  FIRST_QUESTION_PROMPT,
  REVIEW_PROMPT,
  scoreFromReview,
  tierToUnderstanding,
  type AiInterviewConfig,
  type ReviewJson,
  type Track,
} from "@/lib/gemini/prompts";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { jdToHtml } from "@/lib/jdToHtml";
import { completeInterview, startInterview } from "@/lib/interviewActions";
import { HistoryRail, type HistoryEntry } from "./HistoryRail";

/** Legacy defaults, unchanged. */
const MAX_QUESTIONS = 8;
const LEVELS = ["Recruiter screen", "Level 1", "Level 2"];
const DIFFICULTIES = ["Easy", "Medium", "Hard"] as const;
const DURATIONS = [15, 30, 45, 60];

interface Turn {
  role: "interviewer" | "candidate";
  text: string;
}

function tierClass(tier: string): string {
  const t = (tier || "").toLowerCase();
  if (t.includes("strong")) return "tier-strong";
  if (t.includes("working")) return "tier-working";
  return "tier-surface";
}

export function InterviewApp({ history }: { history: HistoryEntry[] }) {
  const router = useRouter();

  /* ---- Screen 1: job description ------------------------------------- */
  const [screen, setScreen] = useState(1);
  const [tab, setTab] = useState<"paste" | "simulate">("paste");
  const [jdPaste, setJdPaste] = useState("");
  const [sim, setSim] = useState({
    title: "",
    company: "",
    industry: "",
    location: "",
    hint: "",
  });
  const [simulatedJd, setSimulatedJd] = useState("");
  const [jdModify, setJdModify] = useState("");
  const [simBusy, setSimBusy] = useState(false);
  const [modifyBusy, setModifyBusy] = useState(false);

  /* ---- Screen 2: configuration --------------------------------------- */
  const [track, setTrack] = useState<Track>("technical");
  const [level, setLevel] = useState(LEVELS[0]);
  const [difficulty, setDifficulty] =
    useState<(typeof DIFFICULTIES)[number]>("Medium");
  const [duration, setDuration] = useState(30);
  const [addressAs, setAddressAs] = useState("");
  const [timing, setTiming] = useState<"immediate" | "end">("immediate");

  /* ---- Screen 3: the session ----------------------------------------- */
  const [question, setQuestion] = useState("");
  const [thinking, setThinking] = useState(false);
  const [answer, setAnswer] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);

  /* ---- Screen 4: feedback -------------------------------------------- */
  const [review, setReview] = useState<ReviewJson | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [savedReportId, setSavedReportId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [needsKey, setNeedsKey] = useState(false);
  // Drawer state below 1024px; above it the rail is permanent and this is inert.
  const [historyOpen, setHistoryOpen] = useState(false);

  // The interviewer is cast when the session starts, not while rendering —
  // Math.random() during render is impure and would re-roll on every pass.
  const [persona, setPersona] = useState(PERSONA_NAMES[0]);
  const interviewIdRef = useRef<string | null>(null);
  const previousIdRef = useRef<string | null>(null);
  const configRef = useRef<AiInterviewConfig | null>(null);

  const { supported, listening, transcript, start, stop, reset } =
    useSpeechRecognition();

  // Voice writes into the same box you can type in, so a mis-transcription is
  // editable before sending. Adjusting during render rather than in an effect.
  const [appliedTranscript, setAppliedTranscript] = useState("");
  if (transcript !== appliedTranscript) {
    setAppliedTranscript(transcript);
    if (transcript) setAnswer(transcript);
  }

  const jobDescription = tab === "paste" ? jdPaste.trim() : simulatedJd;

  /* ---- Countdown ------------------------------------------------------ */
  useEffect(() => {
    if (screen !== 3 || secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [screen, secondsLeft]);

  const fail = useCallback((err: unknown) => {
    stopSpeaking();
    if (err instanceof MissingKeyError) {
      setNeedsKey(true);
      return;
    }
    setError(err instanceof Error ? err.message : "Something went wrong.");
  }, []);

  /* ---- Screen 1 actions ---------------------------------------------- */
  async function simulate() {
    setSimBusy(true);
    setError(null);
    try {
      const { text } = await callInteraction(
        buildSimulatePrompt({
          title: sim.title.trim() || "Analytics Engineer",
          company: sim.company.trim(),
          industry: sim.industry.trim() || "technology",
          location: sim.location.trim(),
          hint: sim.hint.trim(),
        }),
      );
      setSimulatedJd(text);
    } catch (err) {
      fail(err);
    }
    setSimBusy(false);
  }

  async function modify() {
    const instruction = jdModify.trim();
    if (!instruction || !simulatedJd) return;
    setModifyBusy(true);
    setError(null);
    try {
      const { text } = await callInteraction(
        buildModifyPrompt(simulatedJd, instruction),
      );
      setSimulatedJd(text);
      setJdModify("");
    } catch (err) {
      fail(err);
    }
    setModifyBusy(false);
  }

  function continueFromJd() {
    if (!jobDescription) {
      setError(
        tab === "paste"
          ? "Paste a job description to continue."
          : "Simulate a job description first.",
      );
      return;
    }
    setError(null);
    setScreen(2);
  }

  /* ---- Screen 2 → 3 --------------------------------------------------- */
  const ask = useCallback(
    async (input: string, config: AiInterviewConfig) => {
      setThinking(true);
      setError(null);
      try {
        const result = await callInteraction(input, {
          systemInstruction: buildAiSystemInstruction(config),
          previousId: previousIdRef.current,
        });
        previousIdRef.current = result.id;
        setQuestion(result.text);
        setQuestionNumber((n) => n + 1);
        setTurns((t) => [...t, { role: "interviewer", text: result.text }]);
        void speak(result.text, PERSONA_VOICES[config.personaName]);
      } catch (err) {
        fail(err);
      }
      setThinking(false);
    },
    [fail],
  );

  async function startSession() {
    const cast = PERSONA_NAMES[Math.floor(Math.random() * PERSONA_NAMES.length)];
    setPersona(cast);

    const config: AiInterviewConfig = {
      jobDescription,
      track,
      level,
      difficulty,
      duration,
      addressAs: addressAs.trim(),
      timing,
      personaName: cast,
    };
    configRef.current = config;

    setError(null);
    const outcome = await startInterview({
      kind: "ai",
      source: tab === "paste" ? "job_post" : "role",
      role_title: sim.title.trim() || undefined,
      job_description: jobDescription,
      stage: track === "technical" ? level : "business",
      focus: `${track} · ${difficulty} · ${duration} min`,
    });

    if ("error" in outcome) {
      setError(outcome.error);
      return;
    }
    interviewIdRef.current = outcome.id;

    setScreen(3);
    setSecondsLeft(duration * 60);
    void ask(FIRST_QUESTION_PROMPT, config);
  }

  /* ---- Screen 3 actions ---------------------------------------------- */
  function submitAnswer() {
    const text = answer.trim();
    const config = configRef.current;
    if (!text || thinking || !config) return;

    stop();
    stopSpeaking();
    const next = [...turns, { role: "candidate" as const, text }];
    setTurns(next);
    setAnswer("");
    reset();

    if (questionNumber >= MAX_QUESTIONS) {
      void endInterview(next);
      return;
    }
    void ask(text, config);
  }

  const endInterview = useCallback(
    async (finalTurns: Turn[]) => {
      const config = configRef.current;
      if (!config) return;

      stop();
      stopSpeaking();
      setScreen(4);
      setReviewing(true);
      setError(null);

      try {
        const { data } = await callInteractionJson<ReviewJson>(REVIEW_PROMPT, {
          systemInstruction: buildAiReviewInstruction(config),
          previousId: previousIdRef.current,
        });
        setReview(data);

        if (interviewIdRef.current) {
          const saved = await completeInterview({
            interview_id: interviewIdRef.current,
            question_count: questionNumber,
            report: {
              overall_score: scoreFromReview(data),
              understanding: tierToUnderstanding(data.overall ?? "surface"),
              summary: data.summary ?? "",
              strengths: data.strengths ?? [],
              knowledge_gaps: data.perQuestion ?? [],
              topics_to_review: data.toReview ?? [],
              transcript: finalTurns,
            },
          });
          if ("reportId" in saved) setSavedReportId(saved.reportId);
          // Refreshes the rail so the finished session appears in history.
          router.refresh();
        }
      } catch (err) {
        fail(err);
      }
      setReviewing(false);
    },
    [fail, questionNumber, router, stop],
  );

  // Time's up ends the session exactly as the End button does.
  useEffect(() => {
    if (screen === 3 && secondsLeft === 0 && configRef.current && turns.length) {
      void endInterview(turns);
    }
    // Only the countdown hitting zero should trigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, screen]);

  useEffect(() => () => stopSpeaking(), []);

  if (needsKey) {
    return (
      <div className="app">
        <div className="screen" style={{ paddingTop: 60 }}>
          <div className="eyebrow">AI key needed</div>
          <h2 className="screen-title">Add your Gemini key to start.</h2>
          <p className="screen-sub">
            Prep runs the interview from your browser using your own key, which
            is why it stays free. Google&apos;s free tier is enough for practice.
          </p>
          <div className="btn-row">
            <Link className="btn btn-primary" href="/settings">
              Add your key
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const minutes = Math.floor(Math.max(secondsLeft, 0) / 60);
  const seconds = Math.max(secondsLeft, 0) % 60;
  const timer = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <>
      <div className="app">
        <div className="topbar">
          <button
            type="button"
            className="history-toggle"
            aria-label="Past sessions"
            onClick={() => setHistoryOpen(true)}
          >
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M4 6h16M4 12h16M4 18h10"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <div className="steps-track">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={[
                  "dot",
                  step < screen ? "done" : "",
                  step === screen ? "current" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              />
            ))}
          </div>
        </div>

        {error ? <div className="error-banner">{error}</div> : null}

        {/* ---------------- Screen 1: job description ---------------- */}
        {screen === 1 ? (
          <section className="screen">
            <div className="eyebrow">Step 1 of 4</div>
            <h2 className="screen-title">What role are you preparing for?</h2>
            <p className="screen-sub">
              Paste a real job posting, or simulate one and Prep will draft it
              for you.
            </p>

            <div className="tab-row">
              <button
                type="button"
                className={`tab-opt${tab === "paste" ? " selected" : ""}`}
                onClick={() => setTab("paste")}
              >
                Paste your own
              </button>
              <button
                type="button"
                className={`tab-opt${tab === "simulate" ? " selected" : ""}`}
                onClick={() => setTab("simulate")}
              >
                Simulate one
              </button>
            </div>

            {tab === "paste" ? (
              <div className="field">
                <label htmlFor="jdPaste">Job description</label>
                <textarea
                  id="jdPaste"
                  className="jd-textarea"
                  value={jdPaste}
                  onChange={(e) => setJdPaste(e.target.value)}
                  placeholder="Paste the job description here…"
                />
              </div>
            ) : !simulatedJd ? (
              <div>
                <div className="field">
                  <label htmlFor="simTitle">Job title</label>
                  <input
                    id="simTitle"
                    type="text"
                    value={sim.title}
                    onChange={(e) => setSim({ ...sim, title: e.target.value })}
                    placeholder="e.g. Senior Analytics Engineer"
                  />
                </div>
                <div className="field">
                  <label htmlFor="simCompany">Company name (optional)</label>
                  <input
                    id="simCompany"
                    type="text"
                    value={sim.company}
                    onChange={(e) => setSim({ ...sim, company: e.target.value })}
                    placeholder="Leave blank to let Prep invent one"
                  />
                </div>
                <div className="field">
                  <label htmlFor="simIndustry">Industry</label>
                  <input
                    id="simIndustry"
                    type="text"
                    value={sim.industry}
                    onChange={(e) =>
                      setSim({ ...sim, industry: e.target.value })
                    }
                    placeholder="e.g. Fintech, FMCG, e-commerce"
                  />
                </div>
                <div className="field">
                  <label htmlFor="simLocation">Location (optional)</label>
                  <input
                    id="simLocation"
                    type="text"
                    value={sim.location}
                    onChange={(e) =>
                      setSim({ ...sim, location: e.target.value })
                    }
                    placeholder="e.g. Lagos, Remote"
                  />
                </div>
                <div className="field">
                  <label htmlFor="simHint">Anything else? (optional)</label>
                  <textarea
                    id="simHint"
                    value={sim.hint}
                    onChange={(e) => setSim({ ...sim, hint: e.target.value })}
                    placeholder="Rough idea of responsibilities, seniority, tools…"
                    style={{ minHeight: 70 }}
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={simulate}
                  disabled={simBusy}
                >
                  {simBusy ? "Simulating…" : "Simulate job description"}
                </button>
              </div>
            ) : (
              <div>
                <h3 className="jd-title">
                  {(sim.title.trim() || "Analytics Engineer") +
                    (sim.company.trim() ? ` at ${sim.company.trim()}` : "")}
                </h3>
                <div
                  className="jd-content"
                  // jdToHtml escapes everything before adding tags.
                  dangerouslySetInnerHTML={{ __html: jdToHtml(simulatedJd) }}
                />
                <div className="field" style={{ marginTop: 24 }}>
                  <input
                    type="text"
                    value={jdModify}
                    onChange={(e) => setJdModify(e.target.value)}
                    placeholder="Want changes? Describe them, e.g. 'more senior, add dbt'"
                  />
                </div>
                <div className="btn-row" style={{ marginTop: 0 }}>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={modify}
                    disabled={modifyBusy || !jdModify.trim()}
                  >
                    {modifyBusy ? "Updating…" : "Modify"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setSimulatedJd("")}
                  >
                    Edit details
                  </button>
                </div>
              </div>
            )}

            <div className="btn-row">
              <button
                type="button"
                className="btn btn-primary"
                onClick={continueFromJd}
              >
                Continue
              </button>
            </div>
          </section>
        ) : null}

        {/* ---------------- Screen 2: configuration ---------------- */}
        {screen === 2 ? (
          <section className="screen">
            <div className="eyebrow">Step 2 of 4</div>
            <h2 className="screen-title">Configure the interview.</h2>
            <p className="screen-sub">
              The industry is taken from the job description. Choose the track,
              how hard it should be, and how long you have.
            </p>

            <div className="field-grid">
              <div className="field">
                <label htmlFor="trackSelect">Track</label>
                <select
                  id="trackSelect"
                  value={track}
                  onChange={(e) => setTrack(e.target.value as Track)}
                >
                  <option value="technical">Technical</option>
                  <option value="business">Business</option>
                </select>
              </div>

              {track === "technical" ? (
                <div className="field">
                  <label htmlFor="levelSelect">Interview level</label>
                  <select
                    id="levelSelect"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                  >
                    {LEVELS.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="field">
                <label htmlFor="difficultySelect">Difficulty</label>
                <select
                  id="difficultySelect"
                  value={difficulty}
                  onChange={(e) =>
                    setDifficulty(e.target.value as (typeof DIFFICULTIES)[number])
                  }
                >
                  {DIFFICULTIES.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="durationSelect">Duration</label>
                <select
                  id="durationSelect"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                >
                  {DURATIONS.map((value) => (
                    <option key={value} value={value}>
                      {value} minutes
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="timingSelect">Feedback timing</label>
                <select
                  id="timingSelect"
                  value={timing}
                  onChange={(e) =>
                    setTiming(e.target.value as "immediate" | "end")
                  }
                >
                  <option value="immediate">After each answer</option>
                  <option value="end">At the end of the session</option>
                </select>
                <div className="hint">
                  {timing === "immediate"
                    ? "Spoken feedback in the interviewer's voice, right after you answer."
                    : "A written report once the interview is over."}
                </div>
              </div>
            </div>

            <div className="field">
              <label htmlFor="nameInput">
                What should the interviewer call you? (optional)
              </label>
              <input
                id="nameInput"
                type="text"
                value={addressAs}
                onChange={(e) => setAddressAs(e.target.value)}
                placeholder="Your name"
              />
            </div>

            <div className="btn-row">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setScreen(1)}
              >
                Back
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={startSession}
              >
                Start Interview
              </button>
            </div>
          </section>
        ) : null}

        {/* ---------------- Screen 3: the session ---------------- */}
        {screen === 3 ? (
          <section className="screen">
            <div className="session-card">
              <div className="session-top-minimal">
                <span className="q-counter">Question {questionNumber || 1}</span>
                <div
                  className={`session-timer${secondsLeft < 120 ? " low" : ""}`}
                >
                  {timer}
                </div>
              </div>

              <div className={`current-message${thinking ? " thinking" : ""}`}>
                {thinking ? `${persona} is thinking…` : question}
              </div>

              {!thinking && question ? (
                <div className="answer-box">
                  <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        submitAnswer();
                      }
                    }}
                    placeholder={
                      supported
                        ? "Tap to speak, or type your answer…"
                        : "Type your answer…"
                    }
                  />
                  <div className="answer-actions">
                    {supported ? (
                      <button
                        type="button"
                        className={`btn btn-ghost${listening ? " mic-toggle-recording" : ""}`}
                        onClick={() => (listening ? stop() : start())}
                      >
                        {listening ? "Listening… tap to stop" : "Tap to speak"}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={submitAnswer}
                      disabled={!answer.trim()}
                    >
                      Submit answer
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="btn-row">
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => void endInterview(turns)}
              >
                End Interview
              </button>
            </div>
          </section>
        ) : null}

        {/* ---------------- Screen 4: feedback ---------------- */}
        {screen === 4 ? (
          <section className="screen">
            <div className="eyebrow">Session complete</div>
            <h2 className="screen-title">Here&apos;s what to work on.</h2>

            {reviewing ? (
              <div className="loading-line">
                <div className="spinner" />
                Reviewing your answers…
              </div>
            ) : null}

            {review ? (
              <>
                <div className={`tier-badge ${tierClass(review.overall)}`}>
                  Overall: {review.overall} knowledge
                </div>
                <p className="screen-sub">{review.summary}</p>

                {(review.perQuestion ?? []).map((item, i) => (
                  <div className="qa-card" key={i}>
                    <div className={`qa-tier ${tierClass(item.tier)}`}>
                      {item.tier}
                    </div>
                    <div className="q">{item.question}</div>
                    <div className="note">{item.note}</div>
                  </div>
                ))}

                {(review.toReview ?? []).length ? (
                  <div style={{ marginTop: 8 }}>
                    <label style={{ marginBottom: 10 }}>
                      Concepts to review
                    </label>
                    <ul className="review-list">
                      {review.toReview.map((concept, i) => (
                        <li key={i}>{concept}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </>
            ) : null}

            <div className="btn-row">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setScreen(1);
                  setReview(null);
                  setTurns([]);
                  setQuestion("");
                  setQuestionNumber(0);
                  setSavedReportId(null);
                  previousIdRef.current = null;
                  interviewIdRef.current = null;
                }}
              >
                Practice again
              </button>
              {savedReportId ? (
                <Link
                  className="btn btn-ghost"
                  href={`/reports/${savedReportId}`}
                >
                  Open saved report
                </Link>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>

      <HistoryRail
        entries={history}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />
    </>
  );
}

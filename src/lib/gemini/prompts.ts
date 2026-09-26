/**
 * System instructions for the interviewer and the reviewer.
 *
 * Ported from legacy/app.html and extended: the original only knew about a job
 * description, while Mock Interview tracks describe a domain instead. Both end
 * up as the same shape of instruction so one runner drives both.
 */

import { getTrack, type TrackSlug } from "@/lib/tracks";
import { interviewInstruction, type Lang } from "@/lib/i18n/dictionary";

export interface InterviewSetup {
  kind: "ai" | "mock";
  /** Mock only. */
  track?: TrackSlug;
  /** AI only — a pasted job post, a typed role, or CV text. */
  jobDescription?: string;
  roleTitle?: string;
  focus?: string;
  stage?: string;
  personaName: string;
  personaRole: string;
  /** Feedback after each answer, or only at the end. */
  timing?: "immediate" | "end";
  /** Interface language. The interview follows it. */
  lang?: Lang;
}

const SHARED_STYLE = [
  "Ask one interview question at a time, in character, conversational and concise (2-4 sentences max).",
  "Do not answer your own questions.",
  "Do not use markdown formatting — your words are read aloud.",
].join(" ");

function feedbackRule(timing: "immediate" | "end"): string {
  return timing === "immediate"
    ? "After the candidate answers, first give brief (1-2 sentence) spoken feedback rating their answer as Surface, Working, or Strong knowledge, then ask your next question in the same reply."
    : "After the candidate answers, simply ask your next question. Do not give feedback yet.";
}

export function buildSystemInstruction(setup: InterviewSetup): string {
  const timing = setup.timing ?? "immediate";

  if (setup.kind === "mock" && setup.track) {
    const track = getTrack(setup.track);
    if (!track) throw new Error(`Unknown track: ${setup.track}`);

    return [
      `You are ${setup.personaName}, a ${setup.personaRole} conducting a mock technical interview focused on ${track.name}.`,
      `This interview exists to test ${track.examines}.`,
      `Cover these areas across the interview: ${track.topics.join(", ")}.`,
      `Ask roughly ${track.questions} questions in total.`,
      "Push past textbook definitions. When an answer is generic, follow up with a concrete scenario and ask what they would actually do.",
      SHARED_STYLE,
      feedbackRule(timing),
      interviewInstruction(setup.lang ?? "en"),
    ].join(" ");
  }

  const role = setup.roleTitle?.trim();
  const jd = setup.jobDescription?.trim();

  return [
    `You are ${setup.personaName}, a ${setup.personaRole} conducting a mock interview${role ? ` for a ${role} role` : ""}.`,
    jd ? `Here is the job description:\n${jd}\n` : "",
    "Base your questions on the responsibilities, tools and seniority this role actually demands.",
    setup.stage ? `Interview stage: ${setup.stage}.` : "",
    setup.focus ? `The candidate asked you to focus on: ${setup.focus}.` : "",
    SHARED_STYLE,
    feedbackRule(timing),
    interviewInstruction(setup.lang ?? "en"),
  ]
    .filter(Boolean)
    .join(" ");
}

export const FIRST_QUESTION_PROMPT =
  "Begin the interview now. Greet the candidate briefly by name if you know it, then ask your first question.";

export interface ReviewJson {
  overall: "Surface" | "Working" | "Strong";
  summary: string;
  strengths?: string[];
  perQuestion: { question: string; tier: string; note: string }[];
  toReview: string[];
}

export function buildReviewInstruction(setup: InterviewSetup): string {
  const subject =
    setup.kind === "mock" && setup.track
      ? `${getTrack(setup.track)?.name ?? "technical"} interview`
      : `interview${setup.roleTitle ? ` for a ${setup.roleTitle} role` : ""}`;

  return [
    `You are now an interview coach reviewing the mock ${subject} that just took place.`,
    "Base your evaluation only on what the candidate actually said.",
    "Be honest: an answer that named the right concept without explaining it is Surface, not Working.",
  ].join(" ");
}

export const REVIEW_PROMPT = [
  "The interview is now over. Respond with ONLY valid JSON, no markdown fences, in this exact shape:",
  '{"overall":"Surface"|"Working"|"Strong",',
  '"summary":"one or two sentence overall summary",',
  '"strengths":["what they genuinely did well"],',
  '"perQuestion":[{"question":"...","tier":"Surface"|"Working"|"Strong","note":"one sentence note"}],',
  '"toReview":["concept 1","concept 2"]}',
  "Base every tier on whether the candidate showed surface recognition, working knowledge, or strong understanding of each topic.",
].join("\n");

/** Maps the model's tier word onto the value stored in the database. */
export function tierToUnderstanding(
  tier: string,
): "surface" | "working" | "strong" {
  const t = tier.toLowerCase();
  if (t.includes("strong")) return "strong";
  if (t.includes("working")) return "working";
  return "surface";
}

/** A rough score so the readiness bar has something to move on. */
export function scoreFromReview(review: ReviewJson): number {
  const weights = { surface: 35, working: 68, strong: 92 } as const;
  const perQuestion = review.perQuestion ?? [];
  if (!perQuestion.length) return weights[tierToUnderstanding(review.overall)];

  const total = perQuestion.reduce(
    (sum, item) => sum + weights[tierToUnderstanding(item.tier)],
    0,
  );
  return Math.round(total / perQuestion.length);
}

/* ------------------------------------------------------------------------ */
/* AI Interview — the original flow, ported verbatim from legacy/app.html.   */
/*                                                                          */
/* Kept separate from the Mock Interview builders above because the wording  */
/* here was tuned against real sessions. Changing it changes the interviewer.*/
/* ------------------------------------------------------------------------ */

export type Track = "business" | "technical";

export interface AiInterviewConfig {
  jobDescription: string;
  track: Track;
  /** Applies to both tracks: a business interview has stages too. */
  level: string;
  difficulty: "Easy" | "Medium" | "Hard";
  /** Minutes. */
  duration: number;
  /** What the interviewer should call the candidate. Optional. */
  addressAs: string;
  timing: "immediate" | "end";
  personaName: string;
  /** Interface language. The interview follows it, not just the buttons. */
  lang: Lang;
}

/** The interviewer's job title, by track — as in the original. */
export const PERSONA_ROLES: Record<Track, string> = {
  technical: "Senior Data Engineer",
  business: "Senior Product Manager",
};

export function buildAiSystemInstruction(config: AiInterviewConfig): string {
  const role = PERSONA_ROLES[config.track];
  const levelLine = `Interview stage: ${config.level}. `;
  const addressLine = config.addressAs
    ? `Address the candidate as ${config.addressAs}. `
    : "";

  return (
    `You are ${config.personaName}, a ${role} conducting a mock ${config.track} interview. ` +
    `Job description:\n${config.jobDescription}\n\n` +
    // Asking the user for the industry was redundant: it is already stated or
    // plainly implied by the posting, and the model reads it more reliably
    // than someone typing it a second time.
    "Work out the industry from the job description yourself, and ground your questions in how data is actually used in it. " +
    levelLine +
    (config.track === "technical"
      ? "Base your technical questions on the tools and technologies actually mentioned or implied in the job description. "
      : "") +
    `Difficulty: ${config.difficulty}. ` +
    addressLine +
    "Ask one interview question at a time, in character, conversational and concise (2-4 sentences max). " +
    "Do not answer your own questions. Do not use markdown formatting. " +
    (config.timing === "immediate"
      ? "After the candidate answers, first give brief (1-2 sentence) spoken feedback rating their answer as Surface, Working, or Strong knowledge, then ask your next question in the same reply."
      : "After the candidate answers, simply ask your next question. Do not give feedback yet.") +
    interviewInstruction(config.lang)
  );
}

export function buildAiReviewInstruction(config: AiInterviewConfig): string {
  return (
    `You are now an interview coach reviewing the mock ${config.track} interview that just took place ` +
    "for the role in the job description above. Base your evaluation only on what the candidate actually said." +
    interviewInstruction(config.lang) +
    // The report is parsed as JSON, so the keys and the tier words must stay
    // English even when the prose around them is translated.
    " The JSON keys and the tier values (Surface, Working, Strong) must stay exactly as specified in English; only the human-readable text is translated."
  );
}

/** Drafts a job posting for the "Simulate one" tab. */
export function buildSimulatePrompt(fields: {
  title: string;
  company: string;
  industry: string;
  location: string;
  hint: string;
}): string {
  return (
    `Write a realistic job description for the role of ${fields.title}` +
    (fields.company
      ? ` at a company called ${fields.company}`
      : " at a plausible, invented company") +
    ` in the ${fields.industry} industry` +
    (fields.location ? `, located in ${fields.location}` : "") +
    ". " +
    (fields.hint ? `Additional context from the user: ${fields.hint}. ` : "") +
    'Write it the way a real job posting reads. Use a couple of short section headers written in bold, like **Responsibilities** and **Requirements**, and use "- " at the start of a line for each bullet point under those sections. Keep any intro paragraph plain, unbulleted text. Return only the job description, no preamble or extra commentary.'
  );
}

export function buildModifyPrompt(current: string, instruction: string): string {
  return (
    `Here is a job description:\n\n${current}\n\nRevise it with these changes: ${instruction}. ` +
    'Keep using bold section headers (like **Responsibilities**) and "- " bullet points the same way as before. ' +
    "Return only the revised job description text."
  );
}

/* ------------------------------------------------------------------------ */
/* Question planning                                                         */
/*                                                                           */
/* The whole interview is written up front in one call, rather than a call    */
/* per turn. Submitting an answer then shows the next question instantly,     */
/* with nothing to wait for.                                                  */
/*                                                                           */
/* The trade-off is real and worth naming: a pre-written set cannot follow up */
/* on what you actually said. That is the price of the interview never        */
/* stalling, and for practice it is the right way round — a question you wait */
/* eight seconds for breaks the rhythm an interview is meant to rehearse.     */
/* ------------------------------------------------------------------------ */

export function buildQuestionPlanPrompt(count: number): string {
  return [
    `Write the full set of ${count} interview questions now, before the interview begins.`,
    "They must build: open broadly, then go deeper, and finish with the hardest one.",
    "Each question stands alone — none may refer to a previous answer, since you are writing them all before hearing any.",
    "Keep each to 2-3 sentences, conversational, the way it would be spoken aloud.",
    "",
    "Respond with ONLY valid JSON, no markdown fences, in this exact shape:",
    '{"questions":["first question","second question"]}',
  ].join("\n");
}

export interface QuestionPlan {
  questions: string[];
}

/** Per-answer feedback, used only when the candidate asked for it immediately. */
export function buildAnswerFeedbackPrompt(
  question: string,
  answer: string,
): string {
  return [
    "Here is the question you asked and the candidate's answer.",
    "",
    `Question: ${question}`,
    `Answer: ${answer}`,
    "",
    "Respond with ONLY valid JSON, no markdown fences, in this exact shape:",
    '{"tier":"Surface"|"Working"|"Strong","note":"two or three sentences"}',
    "The note says what a strong answer would have covered that this one did not. Speak to the candidate directly. Do not ask another question.",
  ].join("\n");
}

export interface AnswerFeedback {
  tier: string;
  note: string;
}

/**
 * The end-of-session report.
 *
 * `resources` carries a search query rather than a URL on purpose. A model
 * asked for links produces plausible ones that 404, and sending someone to a
 * dead page is worse than sending them to a search that works.
 */
export const FINAL_REPORT_PROMPT = [
  "The interview is over. Review the whole transcript above.",
  "",
  "Respond with ONLY valid JSON, no markdown fences, in this exact shape:",
  '{"overall":"Surface"|"Working"|"Strong",',
  '"summary":"two or three sentences on how it went overall",',
  '"strengths":["what they genuinely did well"],',
  '"perQuestion":[{"question":"...","tier":"Surface"|"Working"|"Strong","note":"what a strong answer would have covered that this one did not"}],',
  '"toReview":["concept to revisit"],',
  '"resources":[{"title":"what to study","why":"one line on why it matters for this role","searchQuery":"a specific search phrase, e.g. dbt incremental models late arriving data"}]}',
  "",
  "Give one perQuestion entry for every question asked, in order. Give three to five resources.",
  "Never invent a URL — the searchQuery is what gets used.",
].join("\n");

export interface StudyResource {
  title: string;
  why: string;
  searchQuery: string;
}

/**
 * Dimensional modelling problems.
 *
 * Not executable, and that is correct rather than a shortcut: the modelling
 * round is a whiteboard conversation where you propose a design and then
 * defend every choice in it. One guide calls it "defense, not design".
 *
 * The three questions here are the ones interviewers report using most, and
 * they are chosen because each has a single failure mode that separates
 * candidates cleanly:
 *
 *   grain    — stated first, or not at all. Kimball's fourth rule, and the
 *              stated top criterion in every rubric I could find.
 *   fanout   — the join-before-aggregate bug, which almost everyone has
 *              shipped and comparatively few can explain.
 *   history  — what a report re-run for March should show after April's
 *              change.
 */

import type { ArchitectureProblem } from "./types";

export const DIMENSIONAL_PROBLEMS: ArchitectureProblem[] = [
  {
    kind: "architecture",
    slug: "dim-state-the-grain",
    title: "State the grain before you draw anything",
    category: "dimensional-modelling",
    difficulty: "medium",
    prompt: [
      "You are designing the analytics warehouse for a ride-hailing company. The business wants to answer questions about trips, drivers, riders, fares, promotions and cancellations.",
      "Before you draw a single table: what is the grain of your core fact table? Say what one row represents, then justify it.",
      "Then say what you would do with cancelled trips, and with a trip where the fare is split between two riders.",
    ],
    keyPoints: [
      "States the grain in one sentence, in the form 'one row per X', before discussing anything else.",
      "Picks one row per completed trip as the base, and can say why — it is the atomic business event, and almost every question asked reduces to counting or summing trips.",
      "Knows that the grain determines everything downstream: mixing two grains in one table is how a sum silently double-counts.",
      "Handles cancellations deliberately rather than by omission — either a status column on the trip fact, or a separate fact at the same grain — and says which and why.",
      "Spots that a split fare is a different grain. A trip with two payers either needs a second fact table at one row per trip per payer, or an allocated measure, and squeezing it into the trip row breaks the sum.",
      "Mentions additivity: fare is additive, a rating is not, and a percentage never is.",
      "Keeps dimensions out of the fact table — driver and rider attributes belong in dimensions keyed by surrogate keys.",
    ],
    modelAnswer: [
      "One row per completed trip. That is the atomic event the business actually transacts in, and nearly every question they listed — trips per driver, revenue per city, cancellation rate — is a count or a sum over trips or a ratio of two of them.",
      "I say it first because everything else depends on it. If I draw tables before I have settled the grain, I will end up with a table that has trips in some rows and daily driver summaries in others, and then every SUM over that table is wrong in a way nobody notices for a quarter.",
      "Cancellations I would keep in the same fact with a status, not in a separate table, because the questions people ask cut across both — cancellation rate is cancelled over total, and that is painful if they live apart. The fare measure would be null or zero on a cancelled row, and I would be explicit about which, since it changes what AVG returns.",
      "The split fare is the interesting one, because it is a different grain. A trip paid by two riders is still one trip but two payments. If I put both payers on the trip row I have to either duplicate the row, which breaks trip counts, or add payer_2 columns, which breaks the moment there are three. So: keep the trip fact at one row per trip, and add a second fact at one row per trip per payer for the payment split. Two facts, two grains, each internally consistent, joined on trip id when someone needs both.",
      "Beyond that the usual discipline — driver, rider, city and time as dimensions with surrogate keys, and care with measures that do not add up. Fare sums, rating does not, and a cancellation rate has to be recomputed from its numerator and denominator rather than averaged.",
    ],
    hint: "The first sentence of a strong answer is 'one row per…'. Everything else is downstream of it.",
  },
  {
    kind: "architecture",
    slug: "dim-fanout-join",
    title: "The total goes up when you add a join",
    category: "dimensional-modelling",
    difficulty: "medium",
    prompt: [
      "You have two tables: `customers`, one row per customer, and `subscriptions`, with several rows per customer over time.",
      "Someone writes a query to get total revenue per customer, joining customers to subscriptions and also to a `payments` table that has many rows per subscription.",
      "The total comes out roughly four times higher than finance's figure. Explain what is happening, and how you would fix it.",
    ],
    keyPoints: [
      "Names it as fan-out: joining one-to-many multiplies the rows on the left side, so any measure on that side is counted once per matching row on the right.",
      "Identifies that joining two separate one-to-many relationships to the same base multiplies them together, which is where a factor of four comes from rather than two.",
      "Understands that the fix is aggregating each branch to the base grain before joining, rather than adding DISTINCT.",
      "Explains why COUNT(DISTINCT) patches a symptom: it can rescue a count but cannot rescue a SUM, because the duplicated amounts are genuinely identical values that DISTINCT would also collapse wrongly.",
      "Frames it as a grain violation rather than a SQL mistake — the query is producing a row per payment and treating it as a row per customer.",
      "Suggests a test that would catch it: a row-count assertion on the model, or reconciliation against a known total.",
    ],
    modelAnswer: [
      "This is fan-out. The join to subscriptions turns one customer row into one row per subscription, and the join to payments turns each of those into one row per payment. So a customer with two subscriptions and two payments each now has four rows, and any measure attached to the customer gets summed four times.",
      "The factor of four is the giveaway that there are two one-to-many joins rather than one, because they multiply rather than add.",
      "The instinct is to reach for DISTINCT, and it is worth saying why that is a trap. On a COUNT it appears to work. On a SUM it cannot: if two payments are both £50, those are two legitimate rows with identical values, and SUM(DISTINCT amount) would give £50. You would have swapped an overcount for an undercount and lost the ability to tell.",
      "The actual fix is to aggregate each branch to the grain you want before joining. Sum payments per customer in one CTE, count subscriptions per customer in another, then join both to the customer table one-to-one. Every join in the final query is then one row to one row and nothing can multiply.",
      "Underneath, this is a grain problem rather than a SQL problem. The query claims to be one row per customer and is actually one row per payment. If the model declared its grain and had a test asserting the row count equals the distinct customer count, this would have failed in CI rather than in a meeting with finance.",
    ],
    hint: "Two separate one-to-many joins do not add, they multiply. That is where the factor comes from, and naming it is most of the answer.",
  },
  {
    kind: "architecture",
    slug: "dim-history-that-survives",
    title: "March's report has to keep saying March",
    category: "dimensional-modelling",
    difficulty: "hard",
    prompt: [
      "A customer moves from the North sales region to the South in April.",
      "Sales commission is reported monthly. When someone re-runs the March report in June, it has to show that customer in North — because that is who was paid for it — while the April report onwards shows South.",
      "How do you model `dim_customer` so that both stay true?",
    ],
    keyPoints: [
      "Identifies this as a Type 2 slowly changing dimension and says what that means concretely: a new row per version, not an update in place.",
      "Names the columns that make it work — a surrogate key distinct from the business key, valid_from, valid_to, and a current flag.",
      "Explains why the fact must store the surrogate key rather than the customer id: that is the mechanism by which an old fact keeps pointing at the old version.",
      "Contrasts it with Type 1 and says what Type 1 would cost here — overwriting the region would silently rewrite March's history, which is the exact failure being asked about.",
      "Handles the join correctly for point-in-time queries, either through the stored surrogate key or by joining on the date falling between valid_from and valid_to.",
      "Anticipates the follow-up about cost: Type 2 dimensions grow, and versioning every attribute means a new row every time anything changes, which is an argument for a mini-dimension or for versioning only the attributes that need it.",
      "Mentions late-arriving data — a fact that arrives after the dimension has moved on still has to attach to the right version.",
    ],
    modelAnswer: [
      "Type 2. Instead of updating the customer's region in place, I close the existing row and insert a new one, so the dimension holds both versions.",
      "Concretely, dim_customer gets a surrogate key that is unique per version, the natural customer id kept as a business key, valid_from and valid_to dates, and an is_current flag for the common case where someone just wants today's view.",
      "The part that actually does the work is on the fact side: the fact stores the surrogate key as it was at the time of the event, not the customer id. A March commission row points at the surrogate key of the North version, and it keeps pointing at it in June regardless of what has happened to the customer since. Re-running March gives North without anyone having to remember to.",
      "Type 1 is what most people reach for first, and it is exactly the failure in the question. Overwriting the region is a single cheap update that silently rewrites every historical report, and nobody finds out until someone notices last quarter's commission has changed.",
      "For point-in-time queries where the fact does not already carry the key, I would join on the customer id with the event date between valid_from and valid_to, which gives the version that was live at the time.",
      "Two things I would raise before finishing. Type 2 dimensions grow, and versioning every attribute means a new row whenever anything changes, including things nobody reports on — so I would version the attributes that carry reporting meaning and keep volatile ones elsewhere, in a mini-dimension if it is bad enough. And late-arriving facts need care: a trip that arrives a week late has to attach to the version that was current when it happened, not the version that is current when it lands.",
    ],
    hint: "The mechanism that makes it work is on the fact table, not the dimension. Say what the fact stores.",
  },
  {
    kind: "architecture",
    slug: "dim-many-to-many",
    title: "One visit, several diagnoses",
    category: "dimensional-modelling",
    difficulty: "hard",
    prompt: [
      "A hospital records patient visits. One visit can carry several diagnoses, and one diagnosis code appears across many visits.",
      "Finance needs cost per visit. Clinical analytics needs counts and outcomes per diagnosis.",
      "Model it. Then say what happens to total cost if someone joins your model to diagnoses and sums it.",
    ],
    notes: [
      "Cardinality and junction tables appear in almost every real modelling problem collected from interview loops — more often than slowly changing dimensions.",
    ],
    keyPoints: [
      "Names it as a many-to-many and knows it cannot be resolved by adding columns — diagnosis_1, diagnosis_2, diagnosis_3 breaks as soon as there is a fourth.",
      "Introduces a bridge or junction table at one row per visit per diagnosis, and states that grain explicitly.",
      "Keeps the visit fact at one row per visit so cost stays correct there, rather than moving cost down to the bridge.",
      "Answers the second question directly: joining the visit fact to the bridge fans the cost out, once per diagnosis, so the total is inflated. This is the whole reason the question is asked.",
      "Offers the two standard resolutions — aggregate the bridge before joining, or allocate a weighting factor across the diagnoses so the allocated amounts sum back to the true total.",
      "Notes that an allocation factor is a business decision, not a modelling one: someone has to decide whether cost splits evenly across diagnoses or by some clinical weighting.",
      "Distinguishes a primary diagnosis flag on the bridge as the pragmatic answer to many reporting needs.",
      "Mentions that counts per diagnosis are safe at the bridge grain, which is why the two teams can be served by the same model.",
    ],
    modelAnswer: [
      "This is a many-to-many between visits and diagnoses, so it needs a bridge. Numbered columns are the instinct and they fail on contact with reality — the moment a visit has more diagnoses than you allowed for, either data is lost or the schema changes.",
      "So: fct_visit at one row per visit, carrying cost and dates and the patient key. dim_diagnosis for the codes. And bridge_visit_diagnosis at one row per visit per diagnosis, carrying both keys, a sequence number, and a flag for the primary diagnosis.",
      "Now the part that matters. If someone joins fct_visit to that bridge and sums cost, the total is wrong — high, by however many diagnoses each visit carries. A visit costing £1,000 with three diagnoses produces three rows of £1,000 and reports £3,000. Nothing in SQL warns you; the number just comes out larger, and it looks plausible.",
      "There are two honest ways out. Aggregate first: if you want cost per diagnosis, decide how cost splits and apply it. Or keep the two questions apart: cost is reported from fct_visit at visit grain, and diagnosis counts are reported from the bridge, and the two are never summed through the same join.",
      "If they do want cost by diagnosis, someone has to decide the allocation. Evenly across diagnoses is the simple answer and is defensible. A clinical weighting is more accurate and needs a clinician. What is not acceptable is picking one silently — the allocation factor is a business decision wearing a modelling costume, and whoever reads the number needs to know which was used.",
      "The primary diagnosis flag is worth having regardless, because a large share of reporting questions turn out to mean 'the main reason they were admitted', and that gives a one-to-one path that cannot fan out.",
    ],
    hint: "The second half of the question is the real one. Say what happens to the total, and why nothing warns you.",
  },
  {
    kind: "architecture",
    slug: "dim-surrogate-or-natural-key",
    title: "Why not just use the id the source gave you?",
    category: "dimensional-modelling",
    difficulty: "medium",
    prompt: [
      "You are building `dim_product`. The source system already has a `product_code` that is unique and stable, and a colleague argues that generating a separate surrogate key is pointless indirection — it adds a join, it means nothing to anyone, and the source code is right there.",
      "Make the case either way, and be specific about what actually goes wrong.",
    ],
    notes: [
      "Surrogate versus natural keys appears in essentially every modelling problem collected from real loops. It is asked because the wrong answer is reasonable-sounding.",
    ],
    keyPoints: [
      "Takes the colleague's argument seriously rather than reciting a rule — for a Type 1 dimension that never versions, in a single-source warehouse, a natural key genuinely can be enough.",
      "Names the decisive case: the moment the dimension becomes Type 2, the natural key is no longer unique, because the same product has several versions. Something else has to identify a version.",
      "Points out that 'unique and stable' rarely survives contact with reality — codes get reused when a retired product relaunches, and a second source system arrives with its own codes that collide.",
      "Raises integration: two sources both calling something ABC123 cannot share a natural key, and a surrogate gives you somewhere to reconcile them.",
      "Mentions the practical benefits honestly rather than overselling them — a narrow integer key joins and stores more cheaply than a long varchar, though that matters less than it used to.",
      "Notes the cost fairly: an extra lookup at load time, and keys that mean nothing when reading raw rows, which makes debugging harder.",
      "Gives a decision rather than a survey — surrogate by default in a dimensional warehouse, because the cost is small and paid once, while retrofitting one after history exists is expensive.",
      "Mentions keeping the natural key on the dimension as an attribute, so nothing is lost.",
    ],
    modelAnswer: [
      "The argument is not silly, and I would not dismiss it. For a dimension that never tracks history, fed by one source, a stable natural key works and the surrogate is genuinely an extra join for nothing.",
      "The case that decides it is history. The moment dim_product becomes Type 2 — and product dimensions almost always do, because someone eventually asks what category a product was in last year — the product code stops being unique in the dimension. The same product now has three rows for three versions. The fact has to point at one specific version, and the code cannot do that. A surrogate key per version is the mechanism that makes point-in-time reporting work at all.",
      "Second, 'unique and stable' is a claim about the source that tends not to survive. Codes get reused when a retired product relaunches, which silently attaches old history to a new item. And the day a second system arrives — an acquisition, a new region — you have two sources that both use ABC123 for different things, and no way to tell them apart in a shared dimension.",
      "There are smaller benefits and I would not oversell them. A narrow integer joins and stores more cheaply than a long varchar, which mattered a great deal once and matters less now.",
      "The cost is real too: a lookup at load time to resolve the code to a key, and rows that are unreadable without joining out, which does make debugging slower. That is a genuine daily tax.",
      "So my answer is surrogate by default, and I would keep the product code on the dimension as an attribute so nothing is lost. The reason is asymmetry of regret: adding a surrogate at the start costs a load-time lookup, and adding one two years later means rewriting every fact table's keys against live history. I would rather pay the small certain cost than the large possible one.",
    ],
    hint: "Both positions are defensible in isolation. What settles it is what happens when the dimension starts tracking history.",
  },
];

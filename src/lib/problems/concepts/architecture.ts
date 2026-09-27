import { concept } from "./build";

/**
 * Architecture and design concept questions.
 *
 * The architecture round appears in around three quarters of loops and rises
 * sharply with seniority — at staff level it is most of the interview. It is
 * also the round with the lowest pass rate anywhere in the research.
 *
 * What it tests is trade-offs, said out loud. Zach Wilson's summary of the
 * round is one word: "tradeoffs". So almost every question here is phrased to
 * force a choice and a justification rather than a description.
 */
export const ARCHITECTURE_CONCEPTS = [
  // ---- Storage and platform ----------------------------------------------
  concept("architecture", "easy", "Data lake, warehouse, lakehouse",
    "What is the difference between a data lake, a data warehouse and a lakehouse? What does each one actually solve?"),
  concept("architecture", "medium", "What is a data mart?",
    "What is a data mart, and when is having one a good idea rather than duplication?"),
  concept("architecture", "hard", "Choosing storage for a new platform",
    "You're choosing where a new analytics platform stores its data. Walk me through the decision and what settles it."),
  concept("architecture", "hard", "CAP theorem, applied",
    "Explain the CAP theorem, and tell me how it actually affects a database choice you've made."),
  concept("architecture", "hard", "ACID and BASE",
    "What's the difference between ACID and BASE systems, and when is eventual consistency acceptable in analytics?"),
  concept("architecture", "medium", "Choosing between OLTP and OLAP storage",
    "How do you choose the right storage for different data consumers? Someone wants sub-second lookups and someone else wants full-history scans."),
  concept("architecture", "hard", "Serving analytics to an application",
    "You need to expose precomputed analytics to a customer-facing web application. How do you architect that, and why not just query the warehouse?"),
  concept("architecture", "hard", "Multi-tenancy",
    "How do you design a data platform for multiple teams or multiple customers? Where do you isolate, and where do you share?"),

  // ---- The design round itself --------------------------------------------
  concept("architecture", "medium", "The questions you ask first",
    "You're given an open design prompt and the interviewer goes quiet. What are the first questions you ask, and why does asking them matter more than drawing?"),
  concept("architecture", "hard", "Sizing before designing",
    "How do you estimate scale before choosing an architecture? Walk me through the arithmetic you'd do out loud."),
  concept("architecture", "hard", "Designing the first data infrastructure",
    "A small e-commerce business has a few thousand orders a day and wants analytics. Design their first data infrastructure — and tell me what you'd deliberately not build."),
  concept("architecture", "hard", "Now the table is 100GB",
    "That same business now has a table over 100GB and wants to query full history. What changes?"),
  concept("architecture", "hard", "Now they need five-minute latency",
    "They now need under five minutes between an order being placed and it appearing in analytics. Redesign it, and say which part of this is a change in kind rather than degree."),
  concept("architecture", "hard", "Designing a counter on a web page",
    "Design a counter showing how many people viewed a listing today. It needs to be at least ninety percent accurate at all times. What do you ask before designing?"),
  concept("architecture", "hard", "A pipeline for predictive modelling",
    "You have daily raw files from several sources — logs, weather, event schedules — feeding a demand forecast. Design the end-to-end pipeline that prepares and serves that data."),
  concept("architecture", "hard", "Open source only, no managed services",
    "Budget rules out every managed cloud service. Architect a weekly analytics report using only open-source tooling, and say what that costs you."),
  concept("architecture", "hard", "Migrating without breaking mornings",
    "You're moving an on-premise data platform to the cloud while the morning reports keep running every day. Design the migration itself."),

  // ---- Streaming and real time ---------------------------------------------
  concept("architecture", "hard", "Does this need to be real time?",
    "How do you work out whether a request for real-time data is real? What questions expose it?"),
  concept("architecture", "hard", "Designing high-volume ingestion",
    "Design ingestion for 200,000 events per second. What are the components, and where does it break first?"),
  concept("architecture", "medium", "What Kafka actually gives you",
    "What does a durable log like Kafka give you that a queue doesn't, and when do you need that?"),
  concept("architecture", "hard", "Partitions, consumers and ordering",
    "In Kafka, what ordering guarantees do you actually get, and what happens when you have more consumers than partitions?"),
  concept("architecture", "hard", "Replaying from the log",
    "How would you replay three days of events, and what has to be true downstream for that to be safe?"),
  concept("architecture", "hard", "Serving both a live view and history",
    "One event stream, two consumers: an operations team that needs seconds, and analysts querying years of history. Design for both without paying to stream everything."),
  concept("architecture", "hard", "The five shapes you should be able to draw",
    "Sketch the common data architecture patterns from memory — lambda, kappa, medallion, CDC into a warehouse, event sourcing — and say when each fits."),

  // ---- Judgement and organisation -----------------------------------------
  concept("architecture", "hard", "Build or buy?",
    "How do you decide whether to build a component or buy it? What's your default, and what overturns it?"),
  concept("architecture", "hard", "Choosing tools for a small team",
    "You're the only data engineer at a 40-person company. How does that constraint change every tooling decision?"),
  concept("architecture", "hard", "The first 90 days",
    "You've joined as the first data hire. There are no pipelines and reporting is three spreadsheets. What do you do in your first 90 days?"),
  concept("architecture", "hard", "Technology that nobody can operate",
    "How do you avoid choosing an architecture that's correct on paper and unmaintainable by the team you actually have?"),
  concept("architecture", "hard", "Designing for discoverability",
    "How do end users find out a dataset exists and whether they should trust it? What do you build for that?"),
  concept("architecture", "hard", "Designing for the on-call",
    "How does knowing you'll be on call for this pipeline change how you design it?"),
  concept("architecture", "hard", "What you'd do differently",
    "If you'd built your current team's data stack from day one, what would you have done differently?"),
  concept("architecture", "hard", "Defending a decision you'd now reverse",
    "Tell me about an architectural decision you made that turned out badly. What was the signal you missed?"),
  concept("architecture", "hard", "Nobody trusts the numbers",
    "Two teams quote different figures for the same metric in the same meeting, and both are reading dashboards you built. Where do you start?"),
  concept("architecture", "hard", "A platform bill that has to come down",
    "You've been told to cut platform spend by thirty percent without losing any capability. How do you approach it?"),
];

/**
 * Strings for the application itself — everything behind the sign-in.
 *
 * Kept apart from dictionary.ts because those 222 entries came verbatim from
 * the original app and should not be edited; these are new, and cover the
 * screens that did not exist then: the dashboard, the tracks, the coding
 * problems, reports and settings.
 *
 * Same convention throughout: keyed by the English source text, so a missing
 * entry falls back to readable English rather than showing a key.
 */

type Dictionary = Record<string, string>;

export const APP_FR: Dictionary = {
  // Navigation
  NAVIGATION: "NAVIGATION",
  Home: "Accueil",
  "Revamp My CV": "Améliorer mon CV",
  "AI Interview": "Entretien IA",
  "Mock Interview": "Entretien blanc",
  "Practice Tracks": "Parcours d'entraînement",
  "Coding Problems": "Exercices de code",
  "My Reports": "Mes rapports",
  Settings: "Paramètres",
  Logout: "Déconnexion",
  "AI key connected": "Clé IA connectée",
  "AI key absent": "Clé IA absente",

  // Dashboard
  "Good morning": "Bonjour",
  "Good afternoon": "Bon après-midi",
  "Good evening": "Bonsoir",
  "Let's get you ready for your next interview — start below.":
    "Préparons votre prochain entretien — commencez ci-dessous.",
  "START HERE": "COMMENCER ICI",
  "Revamp my CV": "Améliorer mon CV",
  "Practice a real interview": "Passer un vrai entretien",
  "Start interview": "Démarrer l'entretien",
  "Sharpen a specific skill": "Travailler une compétence précise",
  "Pick a track": "Choisir un parcours",
  "NEEDS AI KEY": "CLÉ IA REQUISE",
  "NO KEY NEEDED": "AUCUNE CLÉ REQUISE",
  "Run your first AI interview": "Lancez votre premier entretien IA",
  "Start now": "Commencer",
  STREAK: "SÉRIE",
  READINESS: "PRÉPARATION",
  day: "jour",
  days: "jours",

  // Mock interviews
  "Mock Interviews": "Entretiens blancs",
  "Start interview →": "Démarrer l'entretien →",
  questions: "questions",
  min: "min",
  "Interviewing for a specific job?": "Vous visez un poste précis ?",
  "Prefer to write SQL than talk?": "Vous préférez écrire du SQL que parler ?",

  // Coding
  "of {n} solved": "sur {n} résolus",
  "All problems": "Tous les exercices",
  "Run & check": "Exécuter et vérifier",
  Reset: "Réinitialiser",
  "Show a hint": "Afficher un indice",
  "Not quite": "Pas tout à fait",
  "Your answer": "Votre réponse",

  // Reports
  "No reports yet": "Aucun rapport pour l'instant",
  "Start your first interview": "Commencez votre premier entretien",
  "All reports": "Tous les rapports",
  "Practise this again": "Refaire cet entretien",
  "Try another track": "Essayer un autre parcours",
  "Full transcript": "Transcription complète",
  "Review these next": "À revoir ensuite",
  "What you did well": "Ce que vous avez bien fait",
  "Question by question": "Question par question",

  // Interview runtime
  "Preparing your questions…": "Préparation de vos questions…",
  "Writing your report…": "Rédaction de votre rapport…",
  "Tap to speak": "Appuyez pour parler",
  "Listening… tap to stop": "Écoute… appuyez pour arrêter",
  "Send answer": "Envoyer la réponse",
  "Send & finish": "Envoyer et terminer",
  "End & review": "Terminer et évaluer",
  "SESSION COMPLETE": "SESSION TERMINÉE",
  "What to study next": "À étudier ensuite",
  "Read about it": "En savoir plus",
  Watch: "Regarder",
  "Another track": "Un autre parcours",

  // Settings
  "Your profile": "Votre profil",
  "Display name": "Nom affiché",
  Email: "E-mail",
  "Profile picture": "Photo de profil",
  Save: "Enregistrer",
  Saved: "Enregistré",
  Language: "Langue",
  "Your Gemini API key": "Votre clé API Gemini",
  "Paste your key": "Collez votre clé",
  "Replace key": "Remplacer la clé",
  Connected: "Connectée",

  // Dashboard body copy. The short labels here were already translated for
  // the nav; these are the sentences the cards carry.
  "Let's get you ready for your next interview.":
    "Préparons-vous pour votre prochain entretien.",
  "Paste the job post and your current CV. Get it rewritten to match the role in seconds.":
    "Collez l'offre d'emploi et votre CV actuel. Il est réécrit pour correspondre au poste en quelques secondes.",
  "Type a role, paste a job post, or upload your CV. Answer out loud, then get an honest report on what you actually know.":
    "Indiquez un poste, collez une offre ou importez votre CV. Répondez à voix haute, puis recevez un bilan honnête de ce que vous maîtrisez vraiment.",
  "Focused practice by domain: data modelling, orchestration, pipelines, quality, architecture and governance.":
    "Entraînement ciblé par domaine : modélisation des données, orchestration, pipelines, qualité, architecture et gouvernance.",
  "Answer real questions out loud and get a full report with scores and honest feedback.":
    "Répondez à de vraies questions à voix haute et recevez un rapport complet, avec notes et retours francs.",
  "Rises as you complete interviews and close the gaps they find.":
    "Augmente à mesure que vous passez des entretiens et comblez les lacunes détectées.",

  // Mock, practice and reports screens
  "Practice by the domain you'll actually be questioned on.":
    "Entraînez-vous sur le domaine sur lequel vous serez réellement interrogé.",
  "Use AI Interview instead.": "Utilisez plutôt l'entretien IA.",
  "Prefer to code than talk?": "Vous préférez coder que parler ?",
  "Coding Problems run entirely in your browser.":
    "Les exercices de code s'exécutent entièrement dans votre navigateur.",
  Practice: "Entraînement",
  "Pick a subject, then work through its problems.":
    "Choisissez un sujet, puis travaillez ses exercices.",
  of: "sur",
  solved: "résolus",
  problems: "exercices",
  "Every interview you've completed and the gaps it found.":
    "Chaque entretien que vous avez terminé et les lacunes qu'il a révélées.",
  "Changes the interface and the language your interviewer speaks.":
    "Change l'interface et la langue parlée par votre intervieweur.",

  // Practice subjects
  "Metrics & Business Logic": "Métriques et logique métier",
  "Data Modelling": "Modélisation des données",
  "Python for Data": "Python pour la data",
  "Pipelines & ETL": "Pipelines et ETL",
  "Data Quality": "Qualité des données",
  Orchestration: "Orchestration",
  "Performance & Optimisation": "Performance et optimisation",
  "Architecture & Design": "Architecture et conception",

  // Practice subject blurbs
  "From a first filter through to window functions":
    "Du premier filtre jusqu'aux fonctions de fenêtrage",
  "Retention, funnels, cohorts, streaks.":
    "Rétention, entonnoirs, cohortes, séries.",
  "dbt models, grain, slowly changing dimensions.":
    "Modèles dbt, granularité, dimensions à évolution lente.",
  "Understanding the logic of data cleaning, and how to express it in code.":
    "Comprendre la logique du nettoyage des données et savoir l'exprimer en code.",
  "Watermarks, idempotency, backfills and retries.":
    "Filigranes, idempotence, reprises et relances.",
  "Making the data consistent, complete and correct.":
    "Rendre les données cohérentes, complètes et justes.",
  "Dependencies, schedules, retries and backfills. The logic underneath a DAG.":
    "Dépendances, planification, relances et reprises. La logique sous un DAG.",
  "Diagnose the bottleneck, then tune it.":
    "Diagnostiquer le goulet d'étranglement avant de l'optimiser.",
  "System design, scalability, and maintainability.":
    "Conception système, passage à l'échelle et maintenabilité.",

  // Practice categories, difficulty labels and the problem tabs
  "SQL Fundamentals": "Fondamentaux SQL",
  "Joins & Aggregation": "Jointures et agrégation",
  "Window Functions": "Fonctions de fenêtrage",
  "dbt Modelling": "Modélisation dbt",
  "Dimensional Modelling": "Modélisation dimensionnelle",
  "Filtering, shaping and grouping.": "Filtrer, mettre en forme et regrouper.",
  "Getting the grain right when more than one table is involved.":
    "Obtenir la bonne granularité dès que plusieurs tables sont en jeu.",
  "Running totals, ranking, period-over-period and deduplication.":
    "Cumuls, classements, comparaisons de périodes et déduplication.",
  "Write the model.": "Écrivez le modèle.",
  "Retention, funnels, cohorts and streaks.":
    "Rétention, entonnoirs, cohortes et séries.",
  "Grain, facts and dimensions, and reading history out of an SCD.":
    "Granularité, faits et dimensions, et lecture de l'historique d'une SCD.",
  "Understanding the logic of data cleaning.":
    "Comprendre la logique du nettoyage des données.",
  "Incremental loads, idempotency, backfills and retries.":
    "Chargements incrémentaux, idempotence, reprises et relances.",
  "Write the check that catches it. Duplicates, nulls, broken keys, stale tables and numbers that drifted.":
    "Écrivez le contrôle qui le détecte. Doublons, valeurs nulles, clés orphelines, tables obsolètes et chiffres qui ont dérivé.",
  easy: "facile",
  medium: "moyen",
  hard: "difficile",
  Question: "Question",
  Tables: "Tables",
  Expected: "Attendu",
  Example: "Exemple",
  Hint: "Indice",
  "All subjects": "Tous les sujets",
  problem: "exercice",
};

export const APP_DE: Dictionary = {
  NAVIGATION: "NAVIGATION",
  Home: "Start",
  "Revamp My CV": "Lebenslauf überarbeiten",
  "AI Interview": "KI-Interview",
  "Mock Interview": "Übungsinterview",
  "Practice Tracks": "Übungsbereiche",
  "Coding Problems": "Programmieraufgaben",
  "My Reports": "Meine Berichte",
  Settings: "Einstellungen",
  Logout: "Abmelden",
  "AI key connected": "KI-Schlüssel verbunden",
  "AI key absent": "Kein KI-Schlüssel",

  "Good morning": "Guten Morgen",
  "Good afternoon": "Guten Tag",
  "Good evening": "Guten Abend",
  "Let's get you ready for your next interview — start below.":
    "Bereiten wir dein nächstes Interview vor — fang unten an.",
  "START HERE": "HIER STARTEN",
  "Revamp my CV": "Lebenslauf überarbeiten",
  "Practice a real interview": "Ein echtes Interview üben",
  "Start interview": "Interview starten",
  "Sharpen a specific skill": "Eine bestimmte Fähigkeit schärfen",
  "Pick a track": "Bereich wählen",
  "NEEDS AI KEY": "KI-SCHLÜSSEL NÖTIG",
  "NO KEY NEEDED": "KEIN SCHLÜSSEL NÖTIG",
  "Run your first AI interview": "Führe dein erstes KI-Interview",
  "Start now": "Jetzt starten",
  STREAK: "SERIE",
  READINESS: "BEREITSCHAFT",
  day: "Tag",
  days: "Tage",

  "Mock Interviews": "Übungsinterviews",
  "Start interview →": "Interview starten →",
  questions: "Fragen",
  min: "Min",
  "Interviewing for a specific job?": "Interview für eine konkrete Stelle?",
  "Prefer to write SQL than talk?": "Lieber SQL schreiben als reden?",

  "of {n} solved": "von {n} gelöst",
  "All problems": "Alle Aufgaben",
  "Run & check": "Ausführen und prüfen",
  Reset: "Zurücksetzen",
  "Show a hint": "Hinweis anzeigen",
  "Not quite": "Noch nicht ganz",
  "Your answer": "Deine Antwort",

  "No reports yet": "Noch keine Berichte",
  "Start your first interview": "Starte dein erstes Interview",
  "All reports": "Alle Berichte",
  "Practise this again": "Noch einmal üben",
  "Try another track": "Anderen Bereich probieren",
  "Full transcript": "Vollständiges Transkript",
  "Review these next": "Als Nächstes wiederholen",
  "What you did well": "Was du gut gemacht hast",
  "Question by question": "Frage für Frage",

  "Preparing your questions…": "Deine Fragen werden vorbereitet…",
  "Writing your report…": "Dein Bericht wird geschrieben…",
  "Tap to speak": "Zum Sprechen tippen",
  "Listening… tap to stop": "Höre zu… zum Stoppen tippen",
  "Send answer": "Antwort senden",
  "Send & finish": "Senden und beenden",
  "End & review": "Beenden und auswerten",
  "SESSION COMPLETE": "SITZUNG ABGESCHLOSSEN",
  "What to study next": "Was du als Nächstes lernen solltest",
  "Read about it": "Nachlesen",
  Watch: "Ansehen",
  "Another track": "Anderer Bereich",

  "Your profile": "Dein Profil",
  "Display name": "Anzeigename",
  Email: "E-Mail",
  "Profile picture": "Profilbild",
  Save: "Speichern",
  Saved: "Gespeichert",
  Language: "Sprache",
  "Your Gemini API key": "Dein Gemini-API-Schlüssel",
  "Paste your key": "Schlüssel einfügen",
  "Replace key": "Schlüssel ersetzen",
  Connected: "Verbunden",

  // Dashboard body copy.
  "Let's get you ready for your next interview.":
    "Bereiten wir Sie auf Ihr nächstes Vorstellungsgespräch vor.",
  "Paste the job post and your current CV. Get it rewritten to match the role in seconds.":
    "Fügen Sie die Stellenanzeige und Ihren Lebenslauf ein. In Sekunden neu geschrieben, passend zur Stelle.",
  "Type a role, paste a job post, or upload your CV. Answer out loud, then get an honest report on what you actually know.":
    "Geben Sie eine Rolle ein, fügen Sie eine Stellenanzeige ein oder laden Sie Ihren Lebenslauf hoch. Antworten Sie laut und erhalten Sie eine ehrliche Auswertung Ihres Wissens.",
  "Focused practice by domain: data modelling, orchestration, pipelines, quality, architecture and governance.":
    "Gezieltes Üben nach Bereich: Datenmodellierung, Orchestrierung, Pipelines, Qualität, Architektur und Governance.",
  "Answer real questions out loud and get a full report with scores and honest feedback.":
    "Beantworten Sie echte Fragen laut und erhalten Sie einen vollständigen Bericht mit Bewertung und ehrlichem Feedback.",
  "Rises as you complete interviews and close the gaps they find.":
    "Steigt, wenn Sie Gespräche abschließen und die dabei gefundenen Lücken schließen.",

  // Mock, practice and reports screens
  "Practice by the domain you'll actually be questioned on.":
    "Üben Sie den Bereich, zu dem Sie tatsächlich befragt werden.",
  "Use AI Interview instead.": "Nutzen Sie stattdessen das KI-Gespräch.",
  "Prefer to code than talk?": "Lieber programmieren als reden?",
  "Coding Problems run entirely in your browser.":
    "Die Programmieraufgaben laufen vollständig in Ihrem Browser.",
  Practice: "Üben",
  "Pick a subject, then work through its problems.":
    "Wählen Sie ein Thema und arbeiten Sie die Aufgaben durch.",
  of: "von",
  solved: "gelöst",
  problems: "Aufgaben",
  "Every interview you've completed and the gaps it found.":
    "Jedes abgeschlossene Gespräch und die dabei gefundenen Lücken.",
  "Changes the interface and the language your interviewer speaks.":
    "Ändert die Oberfläche und die Sprache Ihres Gesprächspartners.",

  // Practice subjects
  "Metrics & Business Logic": "Kennzahlen & Geschäftslogik",
  "Data Modelling": "Datenmodellierung",
  "Python for Data": "Python für Daten",
  "Pipelines & ETL": "Pipelines & ETL",
  "Data Quality": "Datenqualität",
  Orchestration: "Orchestrierung",
  "Performance & Optimisation": "Performance & Optimierung",
  "Architecture & Design": "Architektur & Design",

  // Practice subject blurbs
  "From a first filter through to window functions":
    "Vom ersten Filter bis zu Fensterfunktionen",
  "Retention, funnels, cohorts, streaks.":
    "Bindung, Funnels, Kohorten, Serien.",
  "dbt models, grain, slowly changing dimensions.":
    "dbt-Modelle, Granularität, langsam veränderliche Dimensionen.",
  "Understanding the logic of data cleaning, and how to express it in code.":
    "Die Logik der Datenbereinigung verstehen und in Code ausdrücken.",
  "Watermarks, idempotency, backfills and retries.":
    "Watermarks, Idempotenz, Nachladen und Wiederholungen.",
  "Making the data consistent, complete and correct.":
    "Daten konsistent, vollständig und korrekt machen.",
  "Dependencies, schedules, retries and backfills. The logic underneath a DAG.":
    "Abhängigkeiten, Zeitpläne, Wiederholungen und Nachladen. Die Logik hinter einem DAG.",
  "Diagnose the bottleneck, then tune it.":
    "Erst den Engpass diagnostizieren, dann optimieren.",
  "System design, scalability, and maintainability.":
    "Systemdesign, Skalierbarkeit und Wartbarkeit.",

  // Practice categories, difficulty labels and the problem tabs
  "SQL Fundamentals": "SQL-Grundlagen",
  "Joins & Aggregation": "Joins & Aggregation",
  "Window Functions": "Fensterfunktionen",
  "dbt Modelling": "dbt-Modellierung",
  "Dimensional Modelling": "Dimensionale Modellierung",
  "Filtering, shaping and grouping.": "Filtern, formen und gruppieren.",
  "Getting the grain right when more than one table is involved.":
    "Die richtige Granularität finden, sobald mehrere Tabellen beteiligt sind.",
  "Running totals, ranking, period-over-period and deduplication.":
    "Laufende Summen, Rangfolgen, Periodenvergleiche und Deduplizierung.",
  "Write the model.": "Schreiben Sie das Modell.",
  "Retention, funnels, cohorts and streaks.":
    "Bindung, Funnels, Kohorten und Serien.",
  "Grain, facts and dimensions, and reading history out of an SCD.":
    "Granularität, Fakten und Dimensionen, und wie man Historie aus einer SCD liest.",
  "Understanding the logic of data cleaning.":
    "Die Logik der Datenbereinigung verstehen.",
  "Incremental loads, idempotency, backfills and retries.":
    "Inkrementelle Ladungen, Idempotenz, Nachladen und Wiederholungen.",
  "Write the check that catches it. Duplicates, nulls, broken keys, stale tables and numbers that drifted.":
    "Schreiben Sie die Prüfung, die es findet. Duplikate, NULL-Werte, verwaiste Schlüssel, veraltete Tabellen und abgedriftete Zahlen.",
  easy: "leicht",
  medium: "mittel",
  hard: "schwer",
  Question: "Frage",
  Tables: "Tabellen",
  Expected: "Erwartet",
  Example: "Beispiel",
  Hint: "Hinweis",
  "All subjects": "Alle Themen",
  problem: "Aufgabe",
};

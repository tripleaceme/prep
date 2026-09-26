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
};

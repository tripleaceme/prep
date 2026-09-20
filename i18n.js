/* Prep — shared translation layer for index.html and app.html.
 *
 * Strings are keyed by their English source text rather than by an invented key,
 * so neither page needs data-i18n attributes and any string missing from a
 * dictionary simply stays in English. Brand and product names (Prep, dbt,
 * Snowflake, Airflow) are absent from the dictionaries on purpose.
 *
 * Originals are cached on each node the first time it is touched, so switching
 * back to English restores the source text instead of re-translating a translation.
 */
(function (global) {
  "use strict";

  var STORAGE_KEY = "prep_lang";

  var LANGS = {
    en: { label: "English", endonym: "English", locale: "en-US", name: "English" },
    fr: { label: "French", endonym: "Français", locale: "fr-FR", name: "French" },
    de: { label: "German", endonym: "Deutsch", locale: "de-DE", name: "German" }
  };

  var DICT = { fr: {}, de: {} };

  /* ---------------- Landing page ---------------- */

  DICT.fr["How it works"] = "Comment ça marche";
  DICT.fr["Tracks"] = "Parcours";
  DICT.fr["Why Prep"] = "Pourquoi Prep";
  DICT.fr["Open source"] = "Open source";
  DICT.fr["FAQ"] = "FAQ";
  DICT.fr["Start a Mock Interview"] = "Commencer un entretien blanc";
  DICT.fr["Free · Open source · English, French, German"] = "Gratuit · Open source · Anglais, français, allemand";
  DICT.fr["Free · English, French, German"] = "Gratuit · Anglais, français, allemand";
  DICT.fr["Practice the interview before it costs you the offer."] = "Entraînez-vous à l'entretien avant qu'il ne vous coûte le poste.";
  DICT.fr["A realistic voice interview simulator for data and analytics roles. Paste the job description, answer questions out loud, and find out what you actually know before the interviewer does."] = "Un simulateur d'entretien vocal réaliste pour les métiers de la data et de l'analytics. Collez l'offre d'emploi, répondez aux questions à voix haute et découvrez ce que vous maîtrisez vraiment avant que le recruteur ne le fasse.";
  DICT.fr["No subscription. No account required. Bring your own Gemini API key."] = "Sans abonnement. Sans compte. Utilisez votre propre clé API Gemini.";
  DICT.fr["Job description"] = "Offre d'emploi";
  DICT.fr["Simulate"] = "Simuler";
  DICT.fr["Paste your own"] = "Coller la vôtre";
  DICT.fr["Business"] = "Métier";
  DICT.fr["Technical"] = "Technique";
  DICT.fr["Industry: Fintech"] = "Secteur : Fintech";
  DICT.fr["Level: L1"] = "Niveau : L1";
  DICT.fr["Interviewer:"] = "Recruteur :";
  DICT.fr["How would you handle a late-arriving fact in an incremental model?"] = "Comment géreriez-vous une donnée tardive dans un modèle incrémental ?";
  DICT.fr["You:"] = "Vous :";
  DICT.fr["I'd add a lookback window on the incremental filter and…"] = "J'ajouterais une fenêtre de rattrapage sur le filtre incrémental et…";
  DICT.fr["Surface"] = "Superficielle";
  DICT.fr["Working"] = "Opérationnelle";
  DICT.fr["Strong"] = "Solide";
  DICT.fr["To review"] = "À revoir";
  DICT.fr["Incremental strategies for late-arriving data"] = "Stratégies incrémentales pour les données tardives";
  DICT.fr["Trade-offs between merge and insert-overwrite"] = "Compromis entre merge et insert-overwrite";
  DICT.fr["Choose the job"] = "Choisissez le poste";
  DICT.fr["Paste the real job description you're applying for, or create a practice role from a title, company and industry."] = "Collez l'offre réelle à laquelle vous postulez, ou créez un poste d'entraînement à partir d'un intitulé, d'une entreprise et d'un secteur.";
  DICT.fr["Configure the interview"] = "Configurez l'entretien";
  DICT.fr["Choose business or technical, set the interview level, select the industry and pick the tools relevant to the role."] = "Choisissez métier ou technique, définissez le niveau, sélectionnez le secteur et les outils pertinents pour le poste.";
  DICT.fr["Answer out loud"] = "Répondez à voix haute";
  DICT.fr["Talk through the questions just like you would in an interview. Prep listens to your answers and evaluates how you explain and apply what you know."] = "Traitez les questions comme en entretien réel. Prep écoute vos réponses et évalue la façon dont vous expliquez et appliquez vos connaissances.";
  DICT.fr["Find your gaps"] = "Identifiez vos lacunes";
  DICT.fr["See where your knowledge is strong, where your explanations need work, and which concepts you should review before the real interview."] = "Voyez où vos connaissances sont solides, où vos explications doivent progresser et quels concepts revoir avant le vrai entretien.";
  DICT.fr["Generic interview questions aren't enough."] = "Les questions d'entretien génériques ne suffisent pas.";
  DICT.fr["You can ask an AI to interview you. But a generic conversation doesn't know what the role you're applying for actually demands. Prep starts with the job. It uses the role, industry, interview stage and technical stack to create a practice session around the kind of knowledge and reasoning you are likely to need."] = "Vous pouvez demander à une IA de vous faire passer un entretien. Mais une conversation générique ignore ce que le poste visé exige réellement. Prep part de l'offre. Il s'appuie sur le poste, le secteur, l'étape du processus et la stack technique pour construire une session autour des connaissances et du raisonnement dont vous aurez besoin.";
  DICT.fr["Built around the job"] = "Construit autour du poste";
  DICT.fr["Paste the job description and practice against the responsibilities, tools and expectations of the role you're targeting."] = "Collez l'offre et entraînez-vous sur les responsabilités, les outils et les attentes du poste visé.";
  DICT.fr["Practice out loud"] = "Entraînez-vous à voix haute";
  DICT.fr["Knowing an answer and being able to explain it clearly under pressure are two different skills. Prep gives you a chance to practice the second one."] = "Connaître une réponse et savoir l'expliquer clairement sous pression sont deux compétences différentes. Prep vous permet de travailler la seconde.";
  DICT.fr["Find specific gaps"] = "Repérez des lacunes précises";
  DICT.fr["Instead of leaving with a vague score, see the concepts you struggled to explain and the areas worth reviewing."] = "Au lieu d'un score vague, voyez les concepts que vous avez eu du mal à expliquer et les points à revoir.";
  DICT.fr["Choose your interview"] = "Choisissez votre entretien";
  DICT.fr["Practice what the interviewer will actually test."] = "Entraînez-vous sur ce que le recruteur va réellement évaluer.";
  DICT.fr["Different data roles test different things. Some interviews focus on business judgment and problem-solving. Others go deep into your technical knowledge. Prep lets you practice both."] = "Les métiers de la data ne sont pas évalués de la même façon. Certains entretiens portent sur le jugement métier et la résolution de problèmes. D'autres creusent vos connaissances techniques. Prep vous permet de travailler les deux.";
  DICT.fr["Business track"] = "Parcours métier";
  DICT.fr["Prove you understand the business, not just the tool."] = "Montrez que vous comprenez le métier, pas seulement l'outil.";
  DICT.fr["Choose an industry such as fintech, FMCG or e-commerce and practice questions that test how you apply data to real business decisions."] = "Choisissez un secteur comme la fintech, la grande consommation ou l'e-commerce et travaillez des questions qui évaluent votre capacité à appliquer la data à de vraies décisions.";
  DICT.fr["Industry shapes the questions"] = "Le secteur oriente les questions";
  DICT.fr["Adjustable interview difficulty"] = "Difficulté ajustable";
  DICT.fr["Scored on reasoning and decision-making"] = "Évalué sur le raisonnement et la prise de décision";
  DICT.fr["Technical track"] = "Parcours technique";
  DICT.fr["Get drilled on the stack the role uses."] = "Soyez interrogé sur la stack utilisée par le poste.";
  DICT.fr["Choose the interview stage, industry and technical tools in the role. Practice questions around the technologies and concepts you'll be expected to work with."] = "Choisissez l'étape de l'entretien, le secteur et les outils techniques du poste. Travaillez des questions sur les technologies et les concepts que vous devrez maîtriser.";
  DICT.fr["Recruiter screen, technical or advanced technical interview"] = "Préqualification RH, entretien technique ou technique avancé";
  DICT.fr["Choose the tools you'll be asked about"] = "Choisissez les outils sur lesquels vous serez interrogé";
  DICT.fr["Industry context shapes how the tools are applied"] = "Le contexte sectoriel détermine l'usage des outils";
  DICT.fr["After the interview"] = "Après l'entretien";
  DICT.fr["Don't just get a score. Know what to work on."] = "Ne repartez pas avec un simple score. Sachez quoi travailler.";
  DICT.fr["A useful practice session should leave you with a clearer idea of what you know, what you don't, and what to do next."] = "Une session utile doit vous laisser une idée claire de ce que vous savez, de ce que vous ignorez et de la suite à donner.";
  DICT.fr["Knowledge gaps"] = "Lacunes de connaissances";
  DICT.fr["Identify concepts you recognize but can't yet explain confidently."] = "Identifiez les concepts que vous reconnaissez mais que vous ne savez pas encore expliquer avec assurance.";
  DICT.fr["Reasoning feedback"] = "Retour sur le raisonnement";
  DICT.fr["See how well you apply concepts, explain trade-offs and work through unfamiliar situations."] = "Voyez comment vous appliquez les concepts, expliquez les compromis et abordez des situations inconnues.";
  DICT.fr["Targeted review"] = "Révisions ciblées";
  DICT.fr["Get specific concepts and topics to revisit instead of a generic list of things to study."] = "Obtenez des concepts et des sujets précis à revoir plutôt qu'une liste générique.";
  DICT.fr["Another attempt"] = "Nouvelle tentative";
  DICT.fr["Practice again after you've closed the gaps and see whether your answers have improved."] = "Recommencez une fois vos lacunes comblées et voyez si vos réponses se sont améliorées.";
  DICT.fr["Know your level"] = "Situez votre niveau";
  DICT.fr["Recognition isn't the same as understanding."] = "Reconnaître n'est pas comprendre.";
  DICT.fr["Prep looks beyond whether you've heard of a concept. The goal is to understand how confidently you can explain it and apply it in an interview."] = "Prep ne se limite pas à savoir si vous avez déjà entendu parler d'un concept. L'objectif est de mesurer votre capacité à l'expliquer et à l'appliquer en entretien.";
  DICT.fr["Level 01"] = "Niveau 01";
  DICT.fr["Level 02"] = "Niveau 02";
  DICT.fr["Level 03"] = "Niveau 03";
  DICT.fr["Surface knowledge"] = "Connaissance superficielle";
  DICT.fr["You recognize the concept, but struggle to explain how or when it is used."] = "Vous reconnaissez le concept, mais vous peinez à expliquer comment ou quand il s'utilise.";
  DICT.fr["Working knowledge"] = "Connaissance opérationnelle";
  DICT.fr["You can explain the concept and apply it to a familiar situation."] = "Vous savez expliquer le concept et l'appliquer à une situation familière.";
  DICT.fr["Strong understanding"] = "Compréhension solide";
  DICT.fr["You can explain trade-offs, reason through unfamiliar situations and apply the concept in context."] = "Vous savez expliquer les compromis, raisonner sur des situations inconnues et appliquer le concept en contexte.";
  DICT.fr["Private by design"] = "Confidentiel par conception";
  DICT.fr["Your interview preparation should stay yours."] = "Votre préparation doit rester la vôtre.";
  DICT.fr["Job descriptions, CVs and interview practice can contain information you don't want sitting in another database. Prep is designed to keep your session data in your browser rather than storing it on a Prep server. You control your Gemini API key, and there is no Prep account or subscription required."] = "Les offres d'emploi, les CV et les sessions d'entraînement peuvent contenir des informations que vous ne souhaitez pas voir stockées dans une base tierce. Prep est conçu pour conserver vos données de session dans votre navigateur plutôt que sur un serveur Prep. Vous gardez le contrôle de votre clé API Gemini, et aucun compte ni abonnement n'est requis.";
  DICT.fr["Your job descriptions stay in your browser"] = "Vos offres d'emploi restent dans votre navigateur";
  DICT.fr["Your CV stays in your browser"] = "Votre CV reste dans votre navigateur";
  DICT.fr["Your previous sessions stay in your browser"] = "Vos sessions précédentes restent dans votre navigateur";
  DICT.fr["No Prep account required"] = "Aucun compte Prep requis";
  DICT.fr["Built in the open"] = "Développé au grand jour";
  DICT.fr["Free to use. Open source. Built for the data community."] = "Gratuit. Open source. Conçu pour la communauté data.";
  DICT.fr["Prep is open source because tools for learning and career development shouldn't have to be black boxes. You can inspect the code, suggest improvements, contribute features or help bring Prep to more languages."] = "Prep est open source parce que les outils d'apprentissage et d'évolution professionnelle ne devraient pas être des boîtes noires. Vous pouvez inspecter le code, proposer des améliorations, contribuer à des fonctionnalités ou aider à traduire Prep dans d'autres langues.";
  DICT.fr["View on GitHub"] = "Voir sur GitHub";
  DICT.fr["Contribute a translation"] = "Contribuer à une traduction";
  DICT.fr["Currently available in English, French and German. More languages can come from the community."] = "Actuellement disponible en anglais, français et allemand. D'autres langues peuvent venir de la communauté.";
  DICT.fr["Start in minutes"] = "Démarrez en quelques minutes";
  DICT.fr["Your next interview doesn't have to be your first practice run."] = "Votre prochain entretien n'a pas à être votre premier essai.";
  DICT.fr["Get a Gemini API key"] = "Obtenez une clé API Gemini";
  DICT.fr["Use Google's Gemini API free tier. You control your own API usage."] = "Utilisez l'offre gratuite de l'API Gemini de Google. Vous maîtrisez votre propre consommation.";
  DICT.fr["Bring the job"] = "Apportez l'offre";
  DICT.fr["Paste the job description you're preparing for, or create a simulated role."] = "Collez l'offre pour laquelle vous vous préparez, ou créez un poste simulé.";
  DICT.fr["Start talking"] = "Commencez à parler";
  DICT.fr["Choose your track and answer the interview out loud."] = "Choisissez votre parcours et répondez à l'entretien à voix haute.";
  DICT.fr["Review your gaps"] = "Revoyez vos lacunes";
  DICT.fr["See what you know, what needs work and what to review next."] = "Voyez ce que vous savez, ce qui demande du travail et ce qu'il faut revoir.";
  DICT.fr["No subscription. No account required."] = "Sans abonnement. Sans compte.";
  DICT.fr["Good to know before you start."] = "Bon à savoir avant de commencer.";
  DICT.fr["Is Prep free?"] = "Prep est-il gratuit ?";
  DICT.fr["Yes. Prep itself is free. You bring your own Gemini API key, and Google's free tier is enough for practice. No account is needed."] = "Oui. Prep est gratuit. Vous utilisez votre propre clé API Gemini, et l'offre gratuite de Google suffit pour s'entraîner. Aucun compte n'est nécessaire.";
  DICT.fr["Get a free key at"] = "Obtenez une clé gratuite sur";
  DICT.fr["Can I use my own job description?"] = "Puis-je utiliser ma propre offre d'emploi ?";
  DICT.fr["Yes. That's one of the main reasons Prep exists. Paste the job description for the role you're preparing for and Prep uses it to shape the interview around the position."] = "Oui. C'est l'une des principales raisons d'être de Prep. Collez l'offre du poste que vous préparez et Prep construit l'entretien autour de celui-ci.";
  DICT.fr["You can also create a simulated role using a title, company and industry."] = "Vous pouvez aussi créer un poste simulé à partir d'un intitulé, d'une entreprise et d'un secteur.";
  DICT.fr["Is Prep only for Analytics Engineers?"] = "Prep est-il réservé aux Analytics Engineers ?";
  DICT.fr["Prep is designed for data and analytics roles, including analytics engineering, data engineering, analytics and business intelligence. The available tools and interview configuration can be adapted to the role you're preparing for."] = "Prep s'adresse aux métiers de la data et de l'analytics : analytics engineering, data engineering, analyse de données et business intelligence. Les outils et la configuration de l'entretien s'adaptent au poste que vous préparez.";
  DICT.fr["What's the difference between the Business and Technical tracks?"] = "Quelle est la différence entre les parcours Métier et Technique ?";
  DICT.fr["The Business track focuses on industry context, business judgment and how you apply data to business problems. The Technical track focuses on the technical knowledge and tools required for the role."] = "Le parcours Métier porte sur le contexte sectoriel, le jugement métier et l'application de la data à des problèmes concrets. Le parcours Technique porte sur les connaissances et les outils techniques exigés par le poste.";
  DICT.fr["Both tracks use industry context because the way data is used in fintech, FMCG and e-commerce can be very different."] = "Les deux parcours s'appuient sur le contexte sectoriel, car l'usage de la data diffère beaucoup entre la fintech, la grande consommation et l'e-commerce.";
  DICT.fr["What interview levels can I practice?"] = "Quels niveaux d'entretien puis-je travailler ?";
  DICT.fr["You can practice different stages of the interview process, from an initial recruiter screen to technical and more advanced technical interviews."] = "Vous pouvez travailler différentes étapes du processus, de la préqualification RH aux entretiens techniques et techniques avancés.";
  DICT.fr["Is my CV or job description stored?"] = "Mon CV ou mon offre d'emploi sont-ils stockés ?";
  DICT.fr["Prep is designed so that your CV, job descriptions and previous sessions stay in your browser rather than being stored on a Prep server."] = "Prep est conçu pour que votre CV, vos offres d'emploi et vos sessions précédentes restent dans votre navigateur plutôt que sur un serveur Prep.";
  DICT.fr["However, information used to generate an interview is sent to the AI provider you configure. Check the provider's current terms and privacy policy before using sensitive information."] = "En revanche, les informations utilisées pour générer un entretien sont envoyées au fournisseur d'IA que vous configurez. Consultez ses conditions et sa politique de confidentialité avant d'utiliser des informations sensibles.";
  DICT.fr["Can I contribute?"] = "Puis-je contribuer ?";
  DICT.fr["Yes. Prep is open source. You can contribute code, suggest improvements or help add translations for languages that aren't supported yet."] = "Oui. Prep est open source. Vous pouvez contribuer au code, proposer des améliorations ou aider à ajouter des traductions pour les langues non encore prises en charge.";
  DICT.fr["Know what you can explain before the interviewer asks."] = "Sachez ce que vous savez expliquer avant que le recruteur ne le demande.";
  DICT.fr["Paste the job. Pick the track. Start talking. Then use the feedback to close your gaps before the real interview."] = "Collez l'offre. Choisissez le parcours. Commencez à parler. Puis servez-vous du retour pour combler vos lacunes avant le vrai entretien.";
  DICT.fr["Free · Open source · No account required"] = "Gratuit · Open source · Sans compte";
  DICT.fr["Prep by"] = "Prep par";
  DICT.fr["Interview practice for data and analytics roles."] = "Entraînement aux entretiens pour les métiers de la data et de l'analytics.";
  DICT.fr["Scroll to top"] = "Revenir en haut";
  DICT.fr["How Prep works"] = "Comment fonctionne Prep";

  DICT.de["How it works"] = "So funktioniert es";
  DICT.de["Tracks"] = "Schwerpunkte";
  DICT.de["Why Prep"] = "Warum Prep";
  DICT.de["Open source"] = "Open Source";
  DICT.de["FAQ"] = "FAQ";
  DICT.de["Start a Mock Interview"] = "Übungsgespräch starten";
  DICT.de["Free · Open source · English, French, German"] = "Kostenlos · Open Source · Englisch, Französisch, Deutsch";
  DICT.de["Free · English, French, German"] = "Kostenlos · Englisch, Französisch, Deutsch";
  DICT.de["Practice the interview before it costs you the offer."] = "Üben Sie das Gespräch, bevor es Sie die Stelle kostet.";
  DICT.de["A realistic voice interview simulator for data and analytics roles. Paste the job description, answer questions out loud, and find out what you actually know before the interviewer does."] = "Ein realistischer Sprach-Interviewsimulator für Daten- und Analytics-Rollen. Fügen Sie die Stellenbeschreibung ein, beantworten Sie Fragen laut und finden Sie heraus, was Sie wirklich können – bevor es die Interviewerin oder der Interviewer tut.";
  DICT.de["No subscription. No account required. Bring your own Gemini API key."] = "Kein Abo. Kein Konto nötig. Nutzen Sie Ihren eigenen Gemini-API-Schlüssel.";
  DICT.de["Job description"] = "Stellenbeschreibung";
  DICT.de["Simulate"] = "Simulieren";
  DICT.de["Paste your own"] = "Eigene einfügen";
  DICT.de["Business"] = "Fachlich";
  DICT.de["Technical"] = "Technisch";
  DICT.de["Industry: Fintech"] = "Branche: Fintech";
  DICT.de["Level: L1"] = "Stufe: L1";
  DICT.de["Interviewer:"] = "Interviewer:";
  DICT.de["How would you handle a late-arriving fact in an incremental model?"] = "Wie würden Sie mit verspätet eintreffenden Fakten in einem inkrementellen Modell umgehen?";
  DICT.de["You:"] = "Sie:";
  DICT.de["I'd add a lookback window on the incremental filter and…"] = "Ich würde ein Rückblickfenster auf den inkrementellen Filter legen und…";
  DICT.de["Surface"] = "Oberflächlich";
  DICT.de["Working"] = "Anwendbar";
  DICT.de["Strong"] = "Fundiert";
  DICT.de["To review"] = "Zu wiederholen";
  DICT.de["Incremental strategies for late-arriving data"] = "Inkrementelle Strategien für verspätet eintreffende Daten";
  DICT.de["Trade-offs between merge and insert-overwrite"] = "Abwägungen zwischen Merge und Insert-Overwrite";
  DICT.de["Choose the job"] = "Stelle auswählen";
  DICT.de["Paste the real job description you're applying for, or create a practice role from a title, company and industry."] = "Fügen Sie die echte Stellenbeschreibung ein, auf die Sie sich bewerben, oder erstellen Sie eine Übungsrolle aus Titel, Unternehmen und Branche.";
  DICT.de["Configure the interview"] = "Gespräch konfigurieren";
  DICT.de["Choose business or technical, set the interview level, select the industry and pick the tools relevant to the role."] = "Wählen Sie fachlich oder technisch, legen Sie die Stufe fest, wählen Sie die Branche und die für die Rolle relevanten Tools.";
  DICT.de["Answer out loud"] = "Laut antworten";
  DICT.de["Talk through the questions just like you would in an interview. Prep listens to your answers and evaluates how you explain and apply what you know."] = "Sprechen Sie die Fragen durch wie in einem echten Gespräch. Prep hört zu und bewertet, wie Sie Ihr Wissen erklären und anwenden.";
  DICT.de["Find your gaps"] = "Lücken finden";
  DICT.de["See where your knowledge is strong, where your explanations need work, and which concepts you should review before the real interview."] = "Sehen Sie, wo Ihr Wissen stark ist, wo Ihre Erklärungen nachbessern müssen und welche Konzepte Sie vor dem echten Gespräch wiederholen sollten.";
  DICT.de["Generic interview questions aren't enough."] = "Allgemeine Interviewfragen reichen nicht.";
  DICT.de["You can ask an AI to interview you. But a generic conversation doesn't know what the role you're applying for actually demands. Prep starts with the job. It uses the role, industry, interview stage and technical stack to create a practice session around the kind of knowledge and reasoning you are likely to need."] = "Sie können eine KI bitten, Sie zu interviewen. Aber ein allgemeines Gespräch weiß nicht, was die angestrebte Rolle wirklich verlangt. Prep beginnt bei der Stelle: Rolle, Branche, Gesprächsphase und technischer Stack bestimmen eine Übungssitzung rund um das Wissen und die Denkweise, die Sie brauchen werden.";
  DICT.de["Built around the job"] = "Rund um die Stelle aufgebaut";
  DICT.de["Paste the job description and practice against the responsibilities, tools and expectations of the role you're targeting."] = "Fügen Sie die Stellenbeschreibung ein und üben Sie an den Aufgaben, Tools und Erwartungen der angestrebten Rolle.";
  DICT.de["Practice out loud"] = "Laut üben";
  DICT.de["Knowing an answer and being able to explain it clearly under pressure are two different skills. Prep gives you a chance to practice the second one."] = "Eine Antwort zu kennen und sie unter Druck klar zu erklären, sind zwei verschiedene Fähigkeiten. Prep lässt Sie die zweite üben.";
  DICT.de["Find specific gaps"] = "Konkrete Lücken finden";
  DICT.de["Instead of leaving with a vague score, see the concepts you struggled to explain and the areas worth reviewing."] = "Statt einer vagen Punktzahl sehen Sie die Konzepte, die Ihnen schwerfielen, und die Bereiche, die sich zu wiederholen lohnen.";
  DICT.de["Choose your interview"] = "Gespräch auswählen";
  DICT.de["Practice what the interviewer will actually test."] = "Üben Sie, was tatsächlich geprüft wird.";
  DICT.de["Different data roles test different things. Some interviews focus on business judgment and problem-solving. Others go deep into your technical knowledge. Prep lets you practice both."] = "Verschiedene Datenrollen prüfen Verschiedenes. Manche Gespräche zielen auf fachliches Urteilsvermögen und Problemlösung, andere gehen tief ins technische Wissen. Prep lässt Sie beides üben.";
  DICT.de["Business track"] = "Fachlicher Schwerpunkt";
  DICT.de["Prove you understand the business, not just the tool."] = "Zeigen Sie, dass Sie das Geschäft verstehen, nicht nur das Tool.";
  DICT.de["Choose an industry such as fintech, FMCG or e-commerce and practice questions that test how you apply data to real business decisions."] = "Wählen Sie eine Branche wie Fintech, Konsumgüter oder E-Commerce und üben Sie Fragen, die prüfen, wie Sie Daten auf echte Geschäftsentscheidungen anwenden.";
  DICT.de["Industry shapes the questions"] = "Die Branche prägt die Fragen";
  DICT.de["Adjustable interview difficulty"] = "Einstellbarer Schwierigkeitsgrad";
  DICT.de["Scored on reasoning and decision-making"] = "Bewertet nach Argumentation und Entscheidungsfindung";
  DICT.de["Technical track"] = "Technischer Schwerpunkt";
  DICT.de["Get drilled on the stack the role uses."] = "Lassen Sie sich zum Stack der Rolle abfragen.";
  DICT.de["Choose the interview stage, industry and technical tools in the role. Practice questions around the technologies and concepts you'll be expected to work with."] = "Wählen Sie Gesprächsphase, Branche und technische Tools der Rolle. Üben Sie Fragen zu den Technologien und Konzepten, mit denen Sie arbeiten sollen.";
  DICT.de["Recruiter screen, technical or advanced technical interview"] = "Erstgespräch, technisches oder vertieft technisches Interview";
  DICT.de["Choose the tools you'll be asked about"] = "Wählen Sie die Tools, zu denen Sie befragt werden";
  DICT.de["Industry context shapes how the tools are applied"] = "Der Branchenkontext bestimmt den Einsatz der Tools";
  DICT.de["After the interview"] = "Nach dem Gespräch";
  DICT.de["Don't just get a score. Know what to work on."] = "Nicht nur eine Punktzahl. Sondern wissen, woran Sie arbeiten müssen.";
  DICT.de["A useful practice session should leave you with a clearer idea of what you know, what you don't, and what to do next."] = "Eine nützliche Übungssitzung sollte Ihnen klarer zeigen, was Sie wissen, was nicht und was als Nächstes zu tun ist.";
  DICT.de["Knowledge gaps"] = "Wissenslücken";
  DICT.de["Identify concepts you recognize but can't yet explain confidently."] = "Erkennen Sie Konzepte, die Ihnen bekannt sind, die Sie aber noch nicht sicher erklären können.";
  DICT.de["Reasoning feedback"] = "Rückmeldung zur Argumentation";
  DICT.de["See how well you apply concepts, explain trade-offs and work through unfamiliar situations."] = "Sehen Sie, wie gut Sie Konzepte anwenden, Abwägungen erklären und unbekannte Situationen durchdenken.";
  DICT.de["Targeted review"] = "Gezielte Wiederholung";
  DICT.de["Get specific concepts and topics to revisit instead of a generic list of things to study."] = "Sie erhalten konkrete Konzepte und Themen zum Nacharbeiten statt einer allgemeinen Lernliste.";
  DICT.de["Another attempt"] = "Neuer Versuch";
  DICT.de["Practice again after you've closed the gaps and see whether your answers have improved."] = "Üben Sie erneut, nachdem Sie die Lücken geschlossen haben, und prüfen Sie, ob sich Ihre Antworten verbessert haben.";
  DICT.de["Know your level"] = "Kennen Sie Ihr Niveau";
  DICT.de["Recognition isn't the same as understanding."] = "Wiedererkennen ist nicht dasselbe wie Verstehen.";
  DICT.de["Prep looks beyond whether you've heard of a concept. The goal is to understand how confidently you can explain it and apply it in an interview."] = "Prep schaut über das bloße Kennen eines Konzepts hinaus. Es geht darum, wie sicher Sie es erklären und im Gespräch anwenden können.";
  DICT.de["Level 01"] = "Stufe 01";
  DICT.de["Level 02"] = "Stufe 02";
  DICT.de["Level 03"] = "Stufe 03";
  DICT.de["Surface knowledge"] = "Oberflächliches Wissen";
  DICT.de["You recognize the concept, but struggle to explain how or when it is used."] = "Sie erkennen das Konzept, tun sich aber schwer zu erklären, wie oder wann es eingesetzt wird.";
  DICT.de["Working knowledge"] = "Anwendbares Wissen";
  DICT.de["You can explain the concept and apply it to a familiar situation."] = "Sie können das Konzept erklären und auf eine vertraute Situation anwenden.";
  DICT.de["Strong understanding"] = "Fundiertes Verständnis";
  DICT.de["You can explain trade-offs, reason through unfamiliar situations and apply the concept in context."] = "Sie können Abwägungen erklären, unbekannte Situationen durchdenken und das Konzept im Kontext anwenden.";
  DICT.de["Private by design"] = "Datenschutz von Anfang an";
  DICT.de["Your interview preparation should stay yours."] = "Ihre Gesprächsvorbereitung sollte Ihre bleiben.";
  DICT.de["Job descriptions, CVs and interview practice can contain information you don't want sitting in another database. Prep is designed to keep your session data in your browser rather than storing it on a Prep server. You control your Gemini API key, and there is no Prep account or subscription required."] = "Stellenbeschreibungen, Lebensläufe und Übungsgespräche können Informationen enthalten, die Sie nicht in einer fremden Datenbank wissen wollen. Prep ist so gebaut, dass Ihre Sitzungsdaten im Browser bleiben statt auf einem Prep-Server. Sie behalten die Kontrolle über Ihren Gemini-API-Schlüssel, und es ist weder ein Prep-Konto noch ein Abo nötig.";
  DICT.de["Your job descriptions stay in your browser"] = "Ihre Stellenbeschreibungen bleiben im Browser";
  DICT.de["Your CV stays in your browser"] = "Ihr Lebenslauf bleibt im Browser";
  DICT.de["Your previous sessions stay in your browser"] = "Ihre früheren Sitzungen bleiben im Browser";
  DICT.de["No Prep account required"] = "Kein Prep-Konto erforderlich";
  DICT.de["Built in the open"] = "Offen entwickelt";
  DICT.de["Free to use. Open source. Built for the data community."] = "Kostenlos. Open Source. Für die Daten-Community gebaut.";
  DICT.de["Prep is open source because tools for learning and career development shouldn't have to be black boxes. You can inspect the code, suggest improvements, contribute features or help bring Prep to more languages."] = "Prep ist Open Source, weil Werkzeuge für Lernen und Karriere keine Blackboxes sein sollten. Sie können den Code einsehen, Verbesserungen vorschlagen, Funktionen beitragen oder helfen, Prep in weitere Sprachen zu bringen.";
  DICT.de["View on GitHub"] = "Auf GitHub ansehen";
  DICT.de["Contribute a translation"] = "Übersetzung beitragen";
  DICT.de["Currently available in English, French and German. More languages can come from the community."] = "Derzeit auf Englisch, Französisch und Deutsch verfügbar. Weitere Sprachen können aus der Community kommen.";
  DICT.de["Start in minutes"] = "In Minuten startklar";
  DICT.de["Your next interview doesn't have to be your first practice run."] = "Ihr nächstes Gespräch muss nicht Ihr erster Übungslauf sein.";
  DICT.de["Get a Gemini API key"] = "Gemini-API-Schlüssel holen";
  DICT.de["Use Google's Gemini API free tier. You control your own API usage."] = "Nutzen Sie das kostenlose Kontingent der Gemini-API von Google. Sie steuern Ihren Verbrauch selbst.";
  DICT.de["Bring the job"] = "Stelle mitbringen";
  DICT.de["Paste the job description you're preparing for, or create a simulated role."] = "Fügen Sie die Stellenbeschreibung ein, auf die Sie sich vorbereiten, oder erstellen Sie eine simulierte Rolle.";
  DICT.de["Start talking"] = "Losreden";
  DICT.de["Choose your track and answer the interview out loud."] = "Wählen Sie Ihren Schwerpunkt und beantworten Sie das Gespräch laut.";
  DICT.de["Review your gaps"] = "Lücken durchgehen";
  DICT.de["See what you know, what needs work and what to review next."] = "Sehen Sie, was Sie können, woran Sie arbeiten müssen und was als Nächstes dran ist.";
  DICT.de["No subscription. No account required."] = "Kein Abo. Kein Konto nötig.";
  DICT.de["Good to know before you start."] = "Gut zu wissen, bevor Sie loslegen.";
  DICT.de["Is Prep free?"] = "Ist Prep kostenlos?";
  DICT.de["Yes. Prep itself is free. You bring your own Gemini API key, and Google's free tier is enough for practice. No account is needed."] = "Ja. Prep selbst ist kostenlos. Sie bringen Ihren eigenen Gemini-API-Schlüssel mit, und das kostenlose Kontingent von Google reicht zum Üben. Ein Konto ist nicht nötig.";
  DICT.de["Get a free key at"] = "Kostenlosen Schlüssel erhalten unter";
  DICT.de["Can I use my own job description?"] = "Kann ich meine eigene Stellenbeschreibung verwenden?";
  DICT.de["Yes. That's one of the main reasons Prep exists. Paste the job description for the role you're preparing for and Prep uses it to shape the interview around the position."] = "Ja. Das ist einer der Hauptgründe, warum es Prep gibt. Fügen Sie die Stellenbeschreibung ein, auf die Sie sich vorbereiten, und Prep richtet das Gespräch danach aus.";
  DICT.de["You can also create a simulated role using a title, company and industry."] = "Sie können auch eine simulierte Rolle aus Titel, Unternehmen und Branche erstellen.";
  DICT.de["Is Prep only for Analytics Engineers?"] = "Ist Prep nur für Analytics Engineers?";
  DICT.de["Prep is designed for data and analytics roles, including analytics engineering, data engineering, analytics and business intelligence. The available tools and interview configuration can be adapted to the role you're preparing for."] = "Prep ist für Daten- und Analytics-Rollen gedacht, darunter Analytics Engineering, Data Engineering, Analyse und Business Intelligence. Tools und Gesprächskonfiguration lassen sich an die Rolle anpassen, auf die Sie sich vorbereiten.";
  DICT.de["What's the difference between the Business and Technical tracks?"] = "Was unterscheidet den fachlichen vom technischen Schwerpunkt?";
  DICT.de["The Business track focuses on industry context, business judgment and how you apply data to business problems. The Technical track focuses on the technical knowledge and tools required for the role."] = "Der fachliche Schwerpunkt behandelt Branchenkontext, Urteilsvermögen und die Anwendung von Daten auf geschäftliche Probleme. Der technische Schwerpunkt behandelt das technische Wissen und die Tools, die die Rolle verlangt.";
  DICT.de["Both tracks use industry context because the way data is used in fintech, FMCG and e-commerce can be very different."] = "Beide Schwerpunkte nutzen den Branchenkontext, denn der Umgang mit Daten unterscheidet sich in Fintech, Konsumgütern und E-Commerce erheblich.";
  DICT.de["What interview levels can I practice?"] = "Welche Gesprächsstufen kann ich üben?";
  DICT.de["You can practice different stages of the interview process, from an initial recruiter screen to technical and more advanced technical interviews."] = "Sie können verschiedene Phasen des Prozesses üben, vom ersten Gespräch mit dem Recruiting bis zu technischen und vertieft technischen Interviews.";
  DICT.de["Is my CV or job description stored?"] = "Werden mein Lebenslauf oder meine Stellenbeschreibung gespeichert?";
  DICT.de["Prep is designed so that your CV, job descriptions and previous sessions stay in your browser rather than being stored on a Prep server."] = "Prep ist so gebaut, dass Ihr Lebenslauf, Ihre Stellenbeschreibungen und früheren Sitzungen im Browser bleiben und nicht auf einem Prep-Server gespeichert werden.";
  DICT.de["However, information used to generate an interview is sent to the AI provider you configure. Check the provider's current terms and privacy policy before using sensitive information."] = "Allerdings werden die zur Erzeugung eines Gesprächs verwendeten Informationen an den von Ihnen konfigurierten KI-Anbieter gesendet. Prüfen Sie dessen aktuelle Bedingungen und Datenschutzerklärung, bevor Sie sensible Informationen verwenden.";
  DICT.de["Can I contribute?"] = "Kann ich beitragen?";
  DICT.de["Yes. Prep is open source. You can contribute code, suggest improvements or help add translations for languages that aren't supported yet."] = "Ja. Prep ist Open Source. Sie können Code beitragen, Verbesserungen vorschlagen oder Übersetzungen für noch fehlende Sprachen ergänzen.";
  DICT.de["Know what you can explain before the interviewer asks."] = "Wissen Sie, was Sie erklären können, bevor gefragt wird.";
  DICT.de["Paste the job. Pick the track. Start talking. Then use the feedback to close your gaps before the real interview."] = "Stelle einfügen. Schwerpunkt wählen. Losreden. Dann mit der Rückmeldung Ihre Lücken schließen, bevor es ernst wird.";
  DICT.de["Free · Open source · No account required"] = "Kostenlos · Open Source · Kein Konto nötig";
  DICT.de["Prep by"] = "Prep von";
  DICT.de["Interview practice for data and analytics roles."] = "Gesprächstraining für Daten- und Analytics-Rollen.";
  DICT.de["Scroll to top"] = "Nach oben";
  DICT.de["How Prep works"] = "So funktioniert Prep";

  /* ---------------- App ---------------- */

  DICT.fr["Bring your own Gemini API key."] = "Utilisez votre propre clé API Gemini.";
  DICT.fr["Prep runs entirely in your browser. Your key is used to call Gemini directly and is saved only on this device — never sent anywhere else."] = "Prep fonctionne entièrement dans votre navigateur. Votre clé sert à appeler Gemini directement et n'est enregistrée que sur cet appareil — elle n'est envoyée nulle part ailleurs.";
  DICT.fr["Gemini API key"] = "Clé API Gemini";
  DICT.fr["Show"] = "Afficher";
  DICT.fr["Don't have one? Get a free key at"] = "Vous n'en avez pas ? Obtenez une clé gratuite sur";
  DICT.fr["Get Started"] = "Commencer";
  DICT.fr["Past sessions"] = "Sessions précédentes";
  DICT.fr["API key"] = "Clé API";
  DICT.fr["Language"] = "Langue";
  DICT.fr["Clear history"] = "Effacer l'historique";
  DICT.fr["Install app"] = "Installer l'app";
  DICT.fr["Add Prep to your home screen"] = "Ajoutez Prep à votre écran d'accueil";
  DICT.fr["Tap the Share button in Safari, then choose Add to Home Screen."] = "Appuyez sur le bouton Partager dans Safari, puis choisissez « Sur l'écran d'accueil ».";
  DICT.fr["Got it"] = "J'ai compris";
  DICT.fr["Interface and interview language"] = "Langue de l'interface et de l'entretien";
  DICT.fr["Prep switches the whole app, the interviewer's questions and your feedback into the language you choose."] = "Prep bascule toute l'application, les questions du recruteur et vos retours dans la langue choisie.";
  DICT.fr["No sessions yet. Your first practice interview will show up here."] = "Aucune session pour l'instant. Votre premier entretien d'entraînement apparaîtra ici.";
  DICT.fr["Step 1 of 4"] = "Étape 1 sur 4";
  DICT.fr["Step 2 of 4"] = "Étape 2 sur 4";
  DICT.fr["What role are you preparing for?"] = "Pour quel poste vous préparez-vous ?";
  DICT.fr["Paste a real job posting, or simulate one and Prep will draft it for you."] = "Collez une vraie offre, ou simulez-en une et Prep la rédigera pour vous.";
  DICT.fr["Simulate one"] = "En simuler une";
  DICT.fr["Job title"] = "Intitulé du poste";
  DICT.fr["Company name (optional)"] = "Nom de l'entreprise (facultatif)";
  DICT.fr["Industry"] = "Secteur";
  DICT.fr["Location (optional)"] = "Lieu (facultatif)";
  DICT.fr["Anything else? (optional)"] = "Autre chose ? (facultatif)";
  DICT.fr["Simulate job description"] = "Simuler l'offre d'emploi";
  DICT.fr["Modify"] = "Modifier";
  DICT.fr["Edit details"] = "Modifier les détails";
  DICT.fr["Continue"] = "Continuer";
  DICT.fr["Configure the interview."] = "Configurez l'entretien.";
  DICT.fr["Business or technical, industry either way, plus level if it's technical."] = "Métier ou technique, secteur dans les deux cas, plus le niveau si c'est technique.";
  DICT.fr["Track"] = "Parcours";
  DICT.fr["Set from your job description."] = "Défini à partir de votre offre d'emploi.";
  DICT.fr["Interview level"] = "Niveau d'entretien";
  DICT.fr["Recruiter screen"] = "Préqualification RH";
  DICT.fr["Level 1"] = "Niveau 1";
  DICT.fr["Level 2"] = "Niveau 2";
  DICT.fr["Difficulty"] = "Difficulté";
  DICT.fr["Easy"] = "Facile";
  DICT.fr["Medium"] = "Moyenne";
  DICT.fr["Hard"] = "Difficile";
  DICT.fr["Duration"] = "Durée";
  DICT.fr["15 min"] = "15 min";
  DICT.fr["30 min"] = "30 min";
  DICT.fr["45 min"] = "45 min";
  DICT.fr["60 min"] = "60 min";
  DICT.fr["What should the interviewer call you? (optional)"] = "Comment le recruteur doit-il vous appeler ? (facultatif)";
  DICT.fr["Feedback timing"] = "Moment du retour";
  DICT.fr["Immediately after each answer"] = "Immédiatement après chaque réponse";
  DICT.fr["Spoken feedback, in the interviewer's voice, right after you answer."] = "Un retour oral, avec la voix du recruteur, juste après votre réponse.";
  DICT.fr["At the end of the session"] = "À la fin de la session";
  DICT.fr["A written report once the interview is over."] = "Un rapport écrit une fois l'entretien terminé.";
  DICT.fr["Back"] = "Retour";
  DICT.fr["Start Interview"] = "Démarrer l'entretien";
  DICT.fr["Question 1"] = "Question 1";
  DICT.fr["Tap to speak"] = "Appuyez pour parler";
  DICT.fr["Submit answer"] = "Envoyer la réponse";
  DICT.fr["End Interview"] = "Terminer l'entretien";
  DICT.fr["Session complete"] = "Session terminée";
  DICT.fr["Here's what to work on."] = "Voici ce qu'il faut travailler.";
  DICT.fr["Concepts to review"] = "Concepts à revoir";
  DICT.fr["Practice again"] = "S'entraîner à nouveau";
  DICT.fr["Paste your key here"] = "Collez votre clé ici";
  DICT.fr["Collapse"] = "Réduire";
  DICT.fr["Paste the job description here…"] = "Collez l'offre d'emploi ici…";
  DICT.fr["e.g. Senior Analytics Engineer"] = "ex. Senior Analytics Engineer";
  DICT.fr["Leave blank to let Prep invent one"] = "Laissez vide pour que Prep en invente une";
  DICT.fr["e.g. Fintech, FMCG, e-commerce"] = "ex. fintech, grande consommation, e-commerce";
  DICT.fr["e.g. Fintech, FMCG, e-commerce, logistics"] = "ex. fintech, grande consommation, e-commerce, logistique";
  DICT.fr["e.g. Lagos, Remote"] = "ex. Lagos, télétravail";
  DICT.fr["Rough idea of responsibilities, seniority, tools…"] = "Idée générale des responsabilités, du niveau, des outils…";
  DICT.fr["Want changes? Describe them, e.g. 'more senior, add dbt'"] = "Des changements ? Décrivez-les, ex. « plus senior, ajouter dbt »";
  DICT.fr["Your name"] = "Votre nom";
  DICT.fr["Tap to speak, or type your answer…"] = "Appuyez pour parler, ou saisissez votre réponse…";
  DICT.fr["Gemini returned an empty response."] = "Gemini a renvoyé une réponse vide.";
  DICT.fr["Paste your Gemini API key to continue."] = "Collez votre clé API Gemini pour continuer.";
  DICT.fr["Paste a job description to continue."] = "Collez une offre d'emploi pour continuer.";
  DICT.fr["Simulate a job description first."] = "Simulez d'abord une offre d'emploi.";
  DICT.fr["Add an industry before starting."] = "Ajoutez un secteur avant de commencer.";
  DICT.fr["No audio returned."] = "Aucun audio renvoyé.";
  DICT.fr["No audio in stream."] = "Aucun audio dans le flux.";
  DICT.fr["Listening… tap to stop"] = "Écoute en cours… appuyez pour arrêter";
  DICT.fr["Stopped after 10 minutes — tap to speak again"] = "Arrêté après 10 minutes — appuyez pour reprendre";
  DICT.fr["Couldn't hear that — type instead"] = "Je n'ai pas entendu — saisissez votre réponse";
  DICT.fr["Clear all saved session history? This can't be undone."] = "Effacer tout l'historique des sessions ? Cette action est irréversible.";

  DICT.de["Bring your own Gemini API key."] = "Nutzen Sie Ihren eigenen Gemini-API-Schlüssel.";
  DICT.de["Prep runs entirely in your browser. Your key is used to call Gemini directly and is saved only on this device — never sent anywhere else."] = "Prep läuft vollständig in Ihrem Browser. Ihr Schlüssel ruft Gemini direkt auf und wird nur auf diesem Gerät gespeichert – niemals sonst wohin gesendet.";
  DICT.de["Gemini API key"] = "Gemini-API-Schlüssel";
  DICT.de["Show"] = "Anzeigen";
  DICT.de["Don't have one? Get a free key at"] = "Noch keinen? Kostenlosen Schlüssel erhalten unter";
  DICT.de["Get Started"] = "Loslegen";
  DICT.de["Past sessions"] = "Frühere Sitzungen";
  DICT.de["API key"] = "API-Schlüssel";
  DICT.de["Language"] = "Sprache";
  DICT.de["Clear history"] = "Verlauf löschen";
  DICT.de["Install app"] = "App installieren";
  DICT.de["Add Prep to your home screen"] = "Prep zum Startbildschirm hinzufügen";
  DICT.de["Tap the Share button in Safari, then choose Add to Home Screen."] = "Tippen Sie in Safari auf „Teilen“ und wählen Sie „Zum Home-Bildschirm“.";
  DICT.de["Got it"] = "Verstanden";
  DICT.de["Interface and interview language"] = "Sprache für Oberfläche und Gespräch";
  DICT.de["Prep switches the whole app, the interviewer's questions and your feedback into the language you choose."] = "Prep stellt die gesamte App, die Fragen im Gespräch und Ihre Rückmeldung auf die gewählte Sprache um.";
  DICT.de["No sessions yet. Your first practice interview will show up here."] = "Noch keine Sitzungen. Ihr erstes Übungsgespräch erscheint hier.";
  DICT.de["Step 1 of 4"] = "Schritt 1 von 4";
  DICT.de["Step 2 of 4"] = "Schritt 2 von 4";
  DICT.de["What role are you preparing for?"] = "Auf welche Rolle bereiten Sie sich vor?";
  DICT.de["Paste a real job posting, or simulate one and Prep will draft it for you."] = "Fügen Sie eine echte Stellenanzeige ein, oder simulieren Sie eine und Prep entwirft sie für Sie.";
  DICT.de["Simulate one"] = "Eine simulieren";
  DICT.de["Job title"] = "Stellenbezeichnung";
  DICT.de["Company name (optional)"] = "Unternehmensname (optional)";
  DICT.de["Industry"] = "Branche";
  DICT.de["Location (optional)"] = "Standort (optional)";
  DICT.de["Anything else? (optional)"] = "Sonst noch etwas? (optional)";
  DICT.de["Simulate job description"] = "Stellenbeschreibung simulieren";
  DICT.de["Modify"] = "Ändern";
  DICT.de["Edit details"] = "Angaben bearbeiten";
  DICT.de["Continue"] = "Weiter";
  DICT.de["Configure the interview."] = "Konfigurieren Sie das Gespräch.";
  DICT.de["Business or technical, industry either way, plus level if it's technical."] = "Fachlich oder technisch, Branche in beiden Fällen, plus Stufe bei technisch.";
  DICT.de["Track"] = "Schwerpunkt";
  DICT.de["Set from your job description."] = "Aus Ihrer Stellenbeschreibung übernommen.";
  DICT.de["Interview level"] = "Gesprächsstufe";
  DICT.de["Recruiter screen"] = "Erstgespräch";
  DICT.de["Level 1"] = "Stufe 1";
  DICT.de["Level 2"] = "Stufe 2";
  DICT.de["Difficulty"] = "Schwierigkeit";
  DICT.de["Easy"] = "Leicht";
  DICT.de["Medium"] = "Mittel";
  DICT.de["Hard"] = "Schwer";
  DICT.de["Duration"] = "Dauer";
  DICT.de["15 min"] = "15 Min.";
  DICT.de["30 min"] = "30 Min.";
  DICT.de["45 min"] = "45 Min.";
  DICT.de["60 min"] = "60 Min.";
  DICT.de["What should the interviewer call you? (optional)"] = "Wie soll die Interviewerin oder der Interviewer Sie ansprechen? (optional)";
  DICT.de["Feedback timing"] = "Zeitpunkt der Rückmeldung";
  DICT.de["Immediately after each answer"] = "Direkt nach jeder Antwort";
  DICT.de["Spoken feedback, in the interviewer's voice, right after you answer."] = "Gesprochene Rückmeldung in der Stimme des Interviewers, direkt nach Ihrer Antwort.";
  DICT.de["At the end of the session"] = "Am Ende der Sitzung";
  DICT.de["A written report once the interview is over."] = "Ein schriftlicher Bericht nach dem Gespräch.";
  DICT.de["Back"] = "Zurück";
  DICT.de["Start Interview"] = "Gespräch starten";
  DICT.de["Question 1"] = "Frage 1";
  DICT.de["Tap to speak"] = "Zum Sprechen tippen";
  DICT.de["Submit answer"] = "Antwort senden";
  DICT.de["End Interview"] = "Gespräch beenden";
  DICT.de["Session complete"] = "Sitzung abgeschlossen";
  DICT.de["Here's what to work on."] = "Daran sollten Sie arbeiten.";
  DICT.de["Concepts to review"] = "Zu wiederholende Konzepte";
  DICT.de["Practice again"] = "Erneut üben";
  DICT.de["Paste your key here"] = "Schlüssel hier einfügen";
  DICT.de["Collapse"] = "Einklappen";
  DICT.de["Paste the job description here…"] = "Stellenbeschreibung hier einfügen…";
  DICT.de["e.g. Senior Analytics Engineer"] = "z. B. Senior Analytics Engineer";
  DICT.de["Leave blank to let Prep invent one"] = "Leer lassen, damit Prep eines erfindet";
  DICT.de["e.g. Fintech, FMCG, e-commerce"] = "z. B. Fintech, Konsumgüter, E-Commerce";
  DICT.de["e.g. Fintech, FMCG, e-commerce, logistics"] = "z. B. Fintech, Konsumgüter, E-Commerce, Logistik";
  DICT.de["e.g. Lagos, Remote"] = "z. B. Lagos, Remote";
  DICT.de["Rough idea of responsibilities, seniority, tools…"] = "Grobe Angaben zu Aufgaben, Seniorität, Tools…";
  DICT.de["Want changes? Describe them, e.g. 'more senior, add dbt'"] = "Änderungen? Beschreiben Sie sie, z. B. „mehr Seniorität, dbt ergänzen“";
  DICT.de["Your name"] = "Ihr Name";
  DICT.de["Tap to speak, or type your answer…"] = "Zum Sprechen tippen oder Antwort eingeben…";
  DICT.de["Gemini returned an empty response."] = "Gemini hat eine leere Antwort zurückgegeben.";
  DICT.de["Paste your Gemini API key to continue."] = "Fügen Sie Ihren Gemini-API-Schlüssel ein, um fortzufahren.";
  DICT.de["Paste a job description to continue."] = "Fügen Sie eine Stellenbeschreibung ein, um fortzufahren.";
  DICT.de["Simulate a job description first."] = "Simulieren Sie zuerst eine Stellenbeschreibung.";
  DICT.de["Add an industry before starting."] = "Ergänzen Sie vor dem Start eine Branche.";
  DICT.de["No audio returned."] = "Kein Audio zurückgegeben.";
  DICT.de["No audio in stream."] = "Kein Audio im Stream.";
  DICT.de["Listening… tap to stop"] = "Hört zu… zum Stoppen tippen";
  DICT.de["Stopped after 10 minutes — tap to speak again"] = "Nach 10 Minuten gestoppt – zum Weitersprechen tippen";
  DICT.de["Couldn't hear that — type instead"] = "Nicht verstanden – bitte tippen";
  DICT.de["Clear all saved session history? This can't be undone."] = "Gesamten gespeicherten Verlauf löschen? Das lässt sich nicht rückgängig machen.";

  /* ---------------- Engine ---------------- */

  var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, CODE: 1, PRE: 1 };
  var ATTRS = ["placeholder", "aria-label", "title", "data-title", "data-desc", "alt"];
  var listeners = [];
  var observer = null;

  function read() {
    try {
      var v = localStorage.getItem(STORAGE_KEY);
      return LANGS[v] ? v : "en";
    } catch (e) {
      return "en";
    }
  }

  var currentLang = read();

  function translate(text) {
    var d = DICT[currentLang];
    if (!d) return text;
    var hit = d[text];
    return typeof hit === "string" ? hit : text;
  }

  function translateTextNode(node) {
    if (node.__prepSrc === undefined) node.__prepSrc = node.nodeValue;
    var src = node.__prepSrc;
    var trimmed = src.trim();
    if (!trimmed) return;
    var out = translate(trimmed);
    if (out === trimmed && node.nodeValue === src) return;
    node.nodeValue = src.replace(trimmed, out);
  }

  function translateElementAttrs(el) {
    for (var i = 0; i < ATTRS.length; i++) {
      var name = ATTRS[i];
      if (!el.hasAttribute(name)) continue;
      if (!el.__prepAttrs) el.__prepAttrs = {};
      if (el.__prepAttrs[name] === undefined) el.__prepAttrs[name] = el.getAttribute(name);
      var src = el.__prepAttrs[name];
      if (!src || !src.trim()) continue;
      el.setAttribute(name, translate(src.trim()));
    }
  }

  function walk(root) {
    if (!root) return;
    if (root.nodeType === 1) translateElementAttrs(root);
    var tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
      acceptNode: function (n) {
        var tag = n.nodeType === 1 ? n.tagName : n.parentNode && n.parentNode.tagName;
        if (tag && SKIP_TAGS[tag]) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var node;
    while ((node = tw.nextNode())) {
      if (node.nodeType === 3) translateTextNode(node);
      else translateElementAttrs(node);
    }
  }

  function apply() {
    if (observer) observer.disconnect();
    document.documentElement.setAttribute("lang", currentLang);
    walk(document.body);
    if (observer) observe();
  }

  function observe() {
    if (!observer || !document.body) return;
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function setLang(lang) {
    if (!LANGS[lang] || lang === currentLang) return;
    currentLang = lang;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
    apply();
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](lang); } catch (e) {}
    }
  }

  function start() {
    if (!document.body) return;
    if (window.MutationObserver) {
      observer = new MutationObserver(function (records) {
        if (currentLang === "en") return;
        observer.disconnect();
        for (var i = 0; i < records.length; i++) {
          var added = records[i].addedNodes;
          for (var j = 0; j < added.length; j++) {
            var n = added[j];
            if (n.nodeType === 3) translateTextNode(n);
            else if (n.nodeType === 1) walk(n);
          }
        }
        observe();
      });
    }
    apply();
  }

  global.PrepI18n = {
    langs: LANGS,
    get: function () { return currentLang; },
    set: setLang,
    t: translate,
    /** BCP-47 tag for SpeechRecognition and speech synthesis voice matching. */
    locale: function () { return LANGS[currentLang].locale; },
    /** English name of the language, for instructing the model. */
    languageName: function () { return LANGS[currentLang].name; },
    /** Appended to the model's system instruction so the interview matches the UI. */
    interviewInstruction: function () {
      if (currentLang === "en") return "";
      var name = LANGS[currentLang].name;
      return " Conduct this entire interview in " + name +
        ". Every question, every follow-up and all written or spoken feedback must be in " + name +
        ", regardless of the language of the job description or the candidate's answers." +
        " Keep widely used English technical terms and product names (for example SQL, dbt, Snowflake, Airflow) as they are.";
    },
    onChange: function (fn) { if (typeof fn === "function") listeners.push(fn); },
    refresh: apply
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})(window);

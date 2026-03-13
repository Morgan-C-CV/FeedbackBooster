# Research Proposal Feedback Pilot Dataset

This document contains 20 highly authentic, Master/PhD-level simulated scenarios of academic feedback on early-stage research proposals. The scenarios mimic real-world advisory dynamics, including constructive tone, framing critiques as suggestions, and referencing literature, while testing the LLM's classification logic across varying degrees of ambiguity. A select few scenarios have had realistic "noise" injected (conversational filler, rambling, email artifacts, typos).

---

### Scenario 1: Direct Methodological Critique
**Original Content**: This study investigates the effect of LLM-assisted code generation on developer cognitive load. We propose a between-subjects experimental design (N=24) where participants complete algorithm implementation tasks either with or without Copilot. NASA-TLX surveys will be administered post-task to quantify cognitive demand.
**Mentor Feedback**: "Thanks for sending this over, I enjoyed reading the motivation section. The experimental design is a good starting point. However, I'm a bit concerned that relying solely on self-reported NASA-TLX scores might not be sufficient to capture the nuances of cognitive load in this context. You might want to look into how recent work by Liang et al. triangulates surveys with IDE telemetry data. Could we explore incorporating some objective measures?"
**Style**: Direct/Constructive

### Scenario 2: Conversational Phone Typo/Noise
**Original Content**: To understand the privacy implications of ambient voice assistants in multi-generational households, we outline an in-situ deployment of a custom smart speaker. We aim to conduct thematic analysis on post-deployment semi-structured interviews to synthesize localized privacy mental models.
**Mentor Feedback**: "Hey, just read through this on my phone so apologies for any typos. This is an interesting domain, and the deployment setup seems technically solid from what I read. I did find the transition between the discussion on general IoT privacy and your specific focus on multi-generational dynamics a bit hard to follow, though... like it felt like a jump? I suggest you might want to restructure the intro to make that connection more explicit for the reader. Also, check out some of the older ubiquitous computing papers for framing, I think Dourish maybe?"
**Style**: Noisy/Conversational

### Scenario 3: Socratic Methodological Questioning
**Original Content**: We propose a novel eco-feedback visualization utilizing ambient light displays mapped to real-time grid carbon intensity. We plan to deploy these artifacts in 10 urban households for a one-month period to observe longitudinal shifts in discretionary energy consumption behaviors.
**Mentor Feedback**: "I've reviewed the draft. You've clearly put a lot of thought into the hardware design, which looks great. I am wondering about the one-month deployment duration, though. Have you considered whether that might be a bit too brief to observe sustained behavioral shifts beyond the initial novelty effect? You might find it helpful to reference Pierce's work on long-term engagement in sustainable HCI to justify or adjust this timeframe."
**Style**: Socratic

### Scenario 4: Indirect Positioning Critique
**Original Content**: To mitigate information overload in asynchronous remote collaboration, we introduce an NLP-based summarization tool integrated within Slack. The tool generates semantic clusters of thread discussions to surface latent dependencies across engineering teams.
**Mentor Feedback**: "I read through the proposal this morning. The integration aspect sounds very smooth. I'm just having a bit of trouble seeing the full picture here. It feels like we might be addressing a symptom rather than the core issue team communication faces. Let's chat next week to see if we are taking the best angle on this."
**Style**: Vague/Indirect

### Scenario 5: Concern on Scope/Contribution
**Original Content**: Our research investigates decentralized reputation systems in Web3 platforms. We outline a methodology to architect and deploy a fully functional decentralized social network utilizing zero-knowledge proofs for identity verification, followed by user satisfaction surveys (N=50).
**Mentor Feedback**: "The technical ambition here is quite impressive. I worry, however, that building an entire decentralized social network from scratch might overshadow the core HCI contribution. I suggest we might want to narrow the scope significantly before you write the final proposal. We should focus more tightly on evaluating a specific interaction mechanism rather than the whole ecosystem. Can we look at what Fogg has written on credibility and isolate a smaller probe?"
**Style**: Concerned/Scope

### Scenario 6: Methodology Tense Polishing
**Original Content**: Prior literature underscores the navigational challenges encountered by visually impaired users in unfamiliar transit hubs. We propose an audio-haptic wayfinding interface. The Wizard-of-Oz study protocol involves testing 3 distinct haptic vocabularies with 10 participants.
**Mentor Feedback**: "Good progress on this draft. The motivation is very relatable. I think the phrasing in the methodology section could be tightened up a bit, though. You switch between 'we propose' and 'we will test' in a way that feels a little disjointed. I'd recommend reviewing the APA guidelines for writing methodology sections to ensure the tense is consistent. Otherwise, looking solid."
**Style**: Direct/Actionable

### Scenario 7: Email Signature/Noise Artifact
**Original Content**: We investigate algorithmic anxiety among gig economy workers by conducting a two-week Experience Sampling Method (ESM) study with rideshare drivers. Participants will self-report stress levels in response to dynamic pricing notifications.
**Mentor Feedback**: "Thanks for sharing the latest version. The methodology is standard and sound. I'm just not quite feeling the 'so what?' coming through strongly enough yet. The narrative might need a little more shaping so the reader immediately grasps why this specific facet of anxiety shifts our understanding of future work.

Sent from my iPad"
**Style**: Noisy/PDF-Artifacts

### Scenario 8: Nuanced Experimental Validity
**Original Content**: To evaluate the efficacy of our AR pedestrian navigation interface for neurodivergent users, we will conduct a comparative study against Google Maps. The primary evaluation metrics will comprise task completion time and the frequency of navigational errors during a predefined route.
**Mentor Feedback**: "The prototype design looks very thoughtful. I do have a question about the metrics, though. If a core argument in your framing is that this user group prioritizes cognitive safety and reduced sensory overload over speed, do you think 'task completion time' is still the most appropriate primary metric to emphasize? I suggest looking at how other accessibility papers handle this tradeoff."
**Style**: Socratic/Methodological

### Scenario 9: Argumentative Cohesion
**Original Content**: Personal informatics tools often suffer from high longitudinal attrition rates. We develop 'Reflecta', an application utilizing Generative AI to synthesize poetic daily activity summaries in lieu of standard data visualizations, aiming to foster sustained reflection.
**Mentor Feedback**: "I enjoyed the creativity in this draft. The poetic summary idea is very unique. However, the conceptual thread connecting your initial problem statement (attrition) directly to your proposed solution (poetry) feels a little thin to me right now. I can kind of see what you're trying to do, but I think the transition might require the reader to make some leaps in logic. You may want to revisit the intermediate steps of your argument."
**Style**: Indirect/Nuanced

### Scenario 10: Structural Readability
**Original Content**: Cybersickness remains a prevailing barrier in VR adoption. We evaluate a novel dynamic Field-of-View (FOV) modulation technique. The independent variables are FOV reduction type and onset latency. The dependent variables comprise physiological heart-rate variability and self-reported Simulator Sickness Questionnaire (SSQ) scores.
**Mentor Feedback**: "The experimental design here is very robust, great job on that. The formatting of the variables paragraph is a bit dense to read, however. I suggest you separate the independent and dependent variables into distinct, clearly labeled bullet points or sub-sections so a reviewer can parse them at a glance."
**Style**: Direct/Structural

### Scenario 11: Rambling / Speech-To-Text Flow
**Original Content**: We investigate the dynamics of human-AI trust calibration within clinical decision support systems. We will present diagnostic anomalies to clinicians accompanied by AI confidence scores, subsequently measuring their rate of algorithmic adherence and cognitive workload via NASA-TLX.
**Mentor Feedback**: "The clinical context you've chosen is highly relevant and timely, especially with all the LLM stuff happening right now. One thing I noticed though... while you mention 'trust calibration,' the proposal doesn't explicitly anchor this concept within an established theoretical framework. It's like, are you using Lee & See's model? Or Mayer's? Or something else entirely? Without clarifying that, the experimental design can feel a bit arbitrary to a reviewer. I strongly suggest integrating a specific framework to ground your research questions. We can talk about which one makes the most sense on Tuesday."
**Style**: Noisy/Rambling

### Scenario 12: Need for Elaboration
**Original Content**: Contemporary smartwatch interaction is predominantly bimanual. We present a machine learning pipeline for recognizing discrete, one-handed wrist-tilt gestures using the onboard IMU. A Random Forest classifier achieved a cross-validated accuracy of 92% across a 12-gesture taxonomy.
**Mentor Feedback**: "Looks like good progress on the pipeline! For the third paragraph detailing the classifier choice, I'm having a bit of trouble following the rationale. I suggest you might want to expand on that section."
**Style**: Vague/Brief

### Scenario 13: Overclaiming Scope
**Original Content**: To address the persistent challenge of email overload, we engineered a unified, timeline-based email client interface. A preliminary qualitative evaluation with 5 computer science undergraduates demonstrated a perceived reduction in triage time compared to traditional threaded views.
**Mentor Feedback**: "The prototype implementation is a solid piece of work. However, I think the contribution statement in the introduction might be a bit too broad given the context. Framing this as a solution to 'email overload' based on an exploratory evaluation with 5 undergrads might draw heavy criticism. I suggest you down-scope your claims to better align with the specific evidence this preliminary study can provide."
**Style**: Direct/Positioning

### Scenario 14: Rhetorical Logical Leap
**Original Content**: To support users in identifying algorithmic bias in news feeds, we propose 'BiasLens', a browser extension that obscures emotionally charged political rhetoric. The experimental evaluation will quantify whether the presence of the extension increases the dwell time on obscured content.
**Mentor Feedback**: "I read the draft—very timely topic! I find myself wondering about the experimental evaluation, though. How does increasing dwell time on a tweet reliably indicate a higher capacity for discerning algorithmic bias? What underlying assumptions are we making about cognitive load and critical thinking here? Let's discuss this logic chain in our next meeting."
**Style**: Socratic/Rhetorical

### Scenario 15: Sentence Structure & Flow
**Original Content**: Virtual typing interfaces on mixed reality headsets are inefficient. The absence of tactile feedback reduces typing speed. We propose a hexagonal key layout optimized for bimanual thumb or ray-cast input. Hexagonal tiling minimizes the distance between frequently co-occurring characters.
**Mentor Feedback**: "The motivation is strong and the layout design is clever. I did notice that the writing in the introduction feels a bit disjointed. It reads as a series of standalone, simple sentences. I suggest you look for opportunities to combine some of these ideas using transition phrases. This will help create a more cohesive and sophisticated academic flow."
**Style**: Editorial/Polishing

### Scenario 16: Interjections and Conversational Tone
**Original Content**: We evaluate the impact of 'dark mode' UX patterns on smartphone battery longevity. The proposed methodology involves a crowdsourced survey via Prolific, wherein 100 participants self-report their estimated daily battery consumption while utilizing a dark mode prototype.
**Mentor Feedback**: "Hi! I appreciate the quick turnaround on this draft. Hmm, I have some serious concerns about the methodology, however... I don't really believe we can reliably measure objective battery consumption by asking crowdsourced workers to estimate it from memory. It just seems way too subjective. I strongly suggest we pivot to utilizing software profiling tools to instrument the system for objective measurements instead. Let me know what you think."
**Style**: Noisy/Conversational

### Scenario 17: Structural Storytelling
**Original Content**: Our proposed system, 'FoodLens', leverages deep learning for dietary intake estimation. We compiled a proprietary dataset of 5,000 annotated food images to train a Convolutional Neural Network. Section 3 delineates the dataset curation. Section 4 describes the model architecture. Section 5 presents an evaluation demonstrating 85% accuracy.
**Mentor Feedback**: "This is a very technically rigorous piece of work, well done. As I was reading the introduction, it felt like we jumped straight into the technical infrastructure (the CNN and dataset) before fully establishing the HCI problem or user need this specific approach addresses. You might want to restructure the narrative so the story flows more naturally from the user experience constraint to the technical solution."
**Style**: Indirect/Structural

### Scenario 18: Academic Jargon
**Original Content**: We utilize a post-phenomenological framework to explicate the ontological shift in spatial perception mediated by the immersive affordances of the telepresence robotic surrogate.
**Mentor Feedback**: "I see you're integrating some heavy theoretical concepts here, which is ambitious. I'm wondering, though, if the phrasing in this core sentence might be a bit impenetrable for a general HCI reviewer. I suggest trying to rewrite this exact same idea in plainer language. Is there a way to convey this insight without relying so heavily on the philosophical jargon?"
**Style**: Socratic/Clarity

### Scenario 19: High-Level Originality
**Original Content**: We introduce a gamified intervention designed to encourage mindfulness practices among adolescents. The mobile application utilizes a pervasive virtual garden metaphor where flora matures synchronously with the user's logged meditation sessions. An in-the-wild deployment is planned at a local high school.
**Mentor Feedback**: "Thanks for sharing this draft. The visual mockups look great. I'm just a little worried that the framing might be leaning a bit too hard into 'gamification for the sake of gamification'. I'm not entirely seeing what the unique HCI or theoretical insight is here yet. Maybe we can brainstorm some ways to deepen the framing on Wednesday."
**Style**: Vague/Strategic

### Scenario 20: Justification of Method
**Original Content**: We present a replication of Smith et al.'s seminal study on Fitts' Law, adapted for smartwatch interaction modalities. The empirical evaluation yielded a measured throughput of 3.5 bits/s, confirming that the underlying motor behavior principles hold true for micro-scale interfaces.
**Mentor Feedback**: "It's good to see this replication study coming together. However, I think your introduction needs to work a bit harder to justify the necessity of this work to the HCI community. Simply stating 'we did X but on a watch' might not be seen as a sufficient contribution for a full paper. I suggest re-focusing the introduction to explicitly articulate what new theoretical insight we gain about motor behavior from this replication."
**Style**: Direct/Contribution

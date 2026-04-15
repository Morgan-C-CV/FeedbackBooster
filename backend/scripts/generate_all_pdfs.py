import json
import os
import shutil
from collections import OrderedDict

from fpdf import FPDF


BASE_DIR = "/Users/mgccvmacair/Myproject/Academic/ResearchProject/backend/projects"


def sanitize(text):
    return (
        str(text)
        .replace("\u2014", "-")
        .replace("\u2013", "-")
        .replace("\u201c", '"')
        .replace("\u201d", '"')
        .replace("\u2018", "'")
        .replace("\u2019", "'")
        .replace("\u2026", "...")
        .replace("\u00a0", " ")
    )


class ProposalPDF(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 9)
        self.set_text_color(60, 60, 60)
        self.cell(0, 8, "HCI Research Proposal Draft | Student-to-Advisor Submission", align="R")
        self.ln(2)

    def footer(self):
        self.set_y(-12)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(90, 90, 90)
        self.cell(0, 8, f"Page {self.page_no()}", align="C")


def create_rich_pdf(filename, project_code, round_index, pdf_title, student_name, advisor_name, date_label, sections):
    pdf = ProposalPDF()
    pdf.set_auto_page_break(auto=True, margin=16)
    pdf.add_page()

    pdf.set_font("Helvetica", "B", 18)
    pdf.set_text_color(15, 37, 64)
    pdf.multi_cell(0, 10, sanitize(pdf_title), align="C")
    pdf.ln(2)

    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(0, 0, 0)
    meta = (
        f"Project: {project_code}   |   Version: f{round_index}   |   Student: {student_name}   "
        f"|   Advisor: {advisor_name}   |   Date: {date_label}"
    )
    pdf.multi_cell(0, 6, sanitize(meta), align="C")
    pdf.ln(3)

    for section_title, content in sections.items():
        pdf.set_font("Helvetica", "B", 13)
        pdf.set_text_color(31, 73, 125)
        pdf.multi_cell(0, 8, sanitize(section_title))
        pdf.ln(1)

        pdf.set_font("Helvetica", "", 10)
        pdf.set_text_color(0, 0, 0)
        if isinstance(content, list):
            for line in content:
                pdf.multi_cell(0, 6, sanitize(f"- {line}"))
                pdf.ln(1)
        else:
            pdf.multi_cell(0, 6, sanitize(content))
        pdf.ln(3)

    os.makedirs(os.path.dirname(filename), exist_ok=True)
    pdf.output(filename)


def ordered_sections(*pairs):
    return OrderedDict(pairs)


PROJECTS = [
    {
        "id": "project01",
        "project_name": "Voice-Based Medication Support for Older Adults with Mild Visual Impairment",
        "participants": {"A": "Advisor (Prof. Helen Carter)", "B": "Student (Mia)"},
        "rounds": [
            {
                "time_prefix": "2026-04-02",
                "student_message": "Prof. Carter, I sent over a first draft. I started with voice assistants for older adults and ended up centering it on medication reminders at home, but I think it may still be trying to do too much. Could you tell me honestly if the scope is manageable?",
                "advisor_message": "Mia, there is something good in here, but right now it is doing four projects at once. You have trust, adherence, accessibility, and acceptance all mixed together. Pick one problem. The strongest one, to me, is what happens when a reminder is missed or unclear and the user has to recover from that.",
                "student_reply": "Yes, I can see that now. I kept broadening it instead of choosing. I'll cut it back and focus on the reminder-repair part.",
                "pdf_title": "Draft V1: Voice Assistants for Home Medication Support in Later Life",
                "date_label": "2026-04-02",
                "sections": ordered_sections(
                    ("Submission Context", "This draft was prepared before the first supervision meeting. I wanted to move from my broad interest in aging and accessibility toward a concrete home-care interaction problem."),
                    ("Problem Background", "Older adults increasingly encounter voice interfaces in phones, smart speakers, and health apps. In medication routines, voice reminders may reduce visual burden, but the interaction can fail when the wording is vague, the reminder appears at the wrong time, or the user is uncertain whether the system registered a response. These failures may create anxiety rather than support."),
                    ("Initial Topic Framing", "I propose to study voice-based medication support for older adults living independently. The broader motivation is to design reminders that are usable for people who experience reduced contrast sensitivity, slower task switching, or hesitation when interacting with speech systems."),
                    ("Preliminary Research Questions", [
                        "How do older adults perceive the usefulness and trustworthiness of voice reminders for medication routines?",
                        "What accessibility barriers emerge when reminders are delivered through a voice-only channel?",
                        "How might multimodal cues such as tone, repetition, and follow-up prompts improve the experience?"
                    ]),
                    ("Draft Method", "My first plan is to interview 8-10 older adults, create a simple voice assistant prototype, and then run a lab-based think-aloud study. I also considered collecting diary notes over one week, although I am not yet sure whether that is realistic within the timeline."),
                    ("Design Concept Notes", [
                        "Use plain verbal confirmation such as 'I heard you say you already took it.'",
                        "Allow the system to repeat slowly without sounding patronizing.",
                        "Offer optional tactile or screen-based backup for missed reminders."
                    ]),
                    ("Concerns I Want Feedback On", [
                        "The scope may still be too broad.",
                        "I am unsure whether diary data is necessary at this stage.",
                        "I need help deciding whether the prototype should be voice only or voice plus a lightweight display."
                    ]),
                    ("Student Annotation", "My instinct is that the meaningful contribution is not a new reminder system by itself, but a clearer model of what happens when the voice interaction breaks down in everyday medication routines.")
                ),
            },
            {
                "time_prefix": "2026-04-08",
                "student_message": "I've reworked it. f2.pdf is now about breakdown recovery after a missed or confusing reminder, and I dropped most of the general technology-acceptance material. I also cut the diary part and switched to scenario sessions, which feels more realistic.",
                "advisor_message": "This version is much clearer. The next problem is the method. You say you want to evaluate whether the design works, but I still don't know what a successful recovery actually means in your study. Tighten that up. And think about using Wizard-of-Oz rather than a fixed script. You'll learn more from the interaction that way.",
                "student_reply": "Got it. I'll define the recovery outcomes properly and move the prototype plan to Wizard-of-Oz.",
                "pdf_title": "Draft V2: Designing Breakdown Recovery in Voice Medication Reminders",
                "date_label": "2026-04-08",
                "sections": ordered_sections(
                    ("Revision Summary", "This version narrows the project from general voice support to one specific HCI problem: how older adults recover when a medication reminder is unclear, mistimed, or not acknowledged correctly."),
                    ("Focused Research Problem", "Current reminder systems often assume that once a prompt is delivered, the interaction is complete. In practice, users ask for repetition, hesitate, ignore the prompt temporarily, or worry that their response was misunderstood. For older adults with mild visual impairment, these moments are critical because users may prefer voice to screens but still need reassurance when the conversational flow breaks."),
                    ("Refined Research Questions", [
                        "What conversational breakdowns occur when older adults respond to medication reminders?",
                        "Which repair strategies are perceived as respectful, clear, and low-effort?",
                        "How do confirmation style and repetition timing affect user confidence during recovery?"
                    ]),
                    ("Proposed Method", [
                        "Conduct 6 contextual interviews to understand existing reminder routines and failure points.",
                        "Build a Wizard-of-Oz prototype with three repair strategies: immediate repetition, clarification with choice prompts, and deferred follow-up.",
                        "Run scenario-based sessions with 10 participants and collect interaction logs, confidence ratings, and short retrospective interviews."
                    ]),
                    ("Prototype Logic", [
                        "If no response is detected, the assistant waits 20 seconds and offers a concise follow-up.",
                        "If the user sounds uncertain, the assistant summarizes what it understood and asks a yes/no confirmation.",
                        "If the reminder is rejected, the system asks whether to postpone or mark as already completed."
                    ]),
                    ("Operationalizing Recovery", [
                        "Successful recovery: the participant reaches a correct medication status without asking the facilitator for help.",
                        "Effort indicator: number of turns required to resolve the reminder episode.",
                        "Confidence indicator: post-task self-rating and interview comments about trust in the system's interpretation."
                    ]),
                    ("Ethics and Recruitment", "Participants will be independent older adults who manage daily medication and report mild visual difficulty but no diagnosed cognitive impairment. I will avoid collecting actual medication names; scenarios will use participant-approved placeholders."),
                    ("Student Annotation", "I chose Wizard-of-Oz because scripted voice flows felt too rigid. The important interaction appears to be the repair sequence, not speech recognition performance alone.")
                ),
            },
            {
                "time_prefix": "2026-04-14",
                "student_message": "I've attached the third version. In f3.pdf I pinned down the recovery measures, tightened the contribution around repair strategies, and wrote out the Wizard-of-Oz protocol more carefully.",
                "advisor_message": "This is in good shape now. The question, participants, and method finally line up. Just keep yourself from drifting back into big adherence claims later unless the data really justifies it.",
                "pdf_title": "Draft V3: Repair-Oriented Voice Reminder Design for Older Adults",
                "date_label": "2026-04-14",
                "sections": ordered_sections(
                    ("Final Scope", "This proposal examines how voice medication reminders should support breakdown recovery for older adults with mild visual impairment. The project does not attempt to solve adherence broadly; it focuses on the repair interaction after reminders fail or become ambiguous."),
                    ("Final Research Question", "How can voice reminder systems support respectful, low-effort recovery when older adults are uncertain about what the system asked, whether it heard them correctly, or whether a reminder should be postponed?"),
                    ("Sub-Questions", [
                        "Which repair prompts reduce uncertainty without making users feel monitored or patronized?",
                        "How do participants distinguish a helpful confirmation from an intrusive one?",
                        "What sequence patterns characterize smooth versus stressful recovery episodes?"
                    ]),
                    ("Study Design", [
                        "Phase 1: six semi-structured interviews on reminder routines, wording preferences, and prior failures with digital assistants.",
                        "Phase 2: Wizard-of-Oz prototype sessions using realistic medication scenarios with branching repair prompts.",
                        "Phase 3: transcript coding of repair sequences, paired with confidence scores and debrief reflections."
                    ]),
                    ("Analysis Plan", "I will code episodes by trigger type (unclear prompt, no response, misunderstood response), repair strategy, number of turns, and perceived outcome. The analysis aims to produce a design framework for repair-oriented reminder interactions rather than a performance benchmark for speech technology."),
                    ("Expected Contribution", [
                        "A breakdown taxonomy for voice medication reminders.",
                        "Design implications for confirmation style, timing, and escalation.",
                        "A replicable Wizard-of-Oz protocol for studying repair in accessible voice interactions."
                    ]),
                    ("Timeline and Deliverables", [
                        "April: finalize protocol and recruit participants.",
                        "May: run interviews and prototype sessions.",
                        "June: code transcripts and synthesize design recommendations.",
                        "July: write thesis chapter and prepare demo screenshots for appendix."
                    ]),
                    ("Student Note to Advisor", "I kept the tone of the contribution intentionally modest. The strongest claim I can support is about interaction design for repair, not about medication outcomes in the wild.")
                ),
            },
        ],
    },
    {
        "id": "project02",
        "project_name": "AR Wayfinding for First-Time Museum Visitors",
        "participants": {"A": "Advisor (Dr. Omar Hassan)", "B": "Student (Leo)"},
        "rounds": [
            {
                "time_prefix": "2026-04-03",
                "student_message": "Dr. Hassan, sending the first draft here. I started from the simple observation that first-time museum visitors get lost a lot, and then I built it into an AR guide idea. Reading it back, I'm worried it sounds more like a product pitch than a thesis.",
                "advisor_message": "That's exactly the issue. Right now f1.pdf reads like an app concept deck. 'An AR guide for the whole museum visit' is too much. The real HCI question is narrower: when people are unsure where to go, how do they split attention between the space and the overlay?",
                "student_reply": "Fair. I added too many extras. I'll strip out the recommendation side and keep it on wayfinding and attention.",
                "pdf_title": "Draft V1: Augmented Reality Support for Museum Visits",
                "date_label": "2026-04-03",
                "sections": ordered_sections(
                    ("Submission Intent", "This draft explores whether augmented reality can help museum visitors feel less lost and more confident when navigating unfamiliar galleries. I suspect there is a useful HCI problem here, but I may still be mixing wayfinding with recommendation."),
                    ("Context and Motivation", "Large museums often present visitors with branching layouts, partial sightlines, and unfamiliar floor conventions. New visitors may repeatedly stop, backtrack, or rely on wall signage that competes with the visual richness of the exhibition. AR could potentially reduce search effort, but it may also distract from the environment it is meant to support."),
                    ("Initial Proposal", "I propose a mobile AR guide that shows arrows, highlighted doorways, and optional exhibit recommendations. Visitors would hold up a phone and follow the suggested route to a chosen exhibit or thematic path."),
                    ("Tentative Research Questions", [
                        "Can AR guidance reduce wayfinding confusion in museums?",
                        "Do visitors prefer AR over static maps and signs?",
                        "How might AR recommendations improve the overall visit experience?"
                    ]),
                    ("Draft Method", "I planned to build a medium-fidelity phone-based prototype, simulate museum routes, and compare user performance against a map-only baseline. I also wanted to collect interview feedback about discoverability and enjoyment."),
                    ("Features I Initially Included", [
                        "Arrow overlays for the next turn.",
                        "Exhibit recommendation cards along the route.",
                        "A quick-recenter button if the user rotates away from the path.",
                        "A progress marker that estimates remaining walking time."
                    ]),
                    ("Open Questions", [
                        "Is the AR condition too visually heavy for a museum context?",
                        "Should I compare against printed maps, wall signage, or both?",
                        "What is the right outcome measure beyond time-to-destination?"
                    ]),
                    ("Student Annotation", "I am personally excited by museum technology, which may be causing me to add features faster than I can justify them academically.")
                ),
            },
            {
                "time_prefix": "2026-04-09",
                "student_message": "I tightened the scope in f2.pdf. It now only looks at first-time visitors trying to get to one chosen exhibit, and I framed the problem as attention management rather than general AR usefulness.",
                "advisor_message": "Better. But you're still treating faster navigation as the same thing as better design. In a museum that may not be true. If they arrive quickly but spend the whole time staring at the phone, that's not a win. Add some way of capturing attention and interruption, not just speed.",
                "student_reply": "Makes sense. I'll make route confidence primary and treat exhibit engagement as secondary, and I'll add attention-switching notes to the study.",
                "pdf_title": "Draft V2: Attention-Aware AR Wayfinding in Museum Galleries",
                "date_label": "2026-04-09",
                "sections": ordered_sections(
                    ("Revision Summary", "This version narrows the work to one HCI challenge: helping first-time museum visitors reach a chosen exhibit without forcing them to over-attend to the device. Recommendation and itinerary functions from V1 were removed."),
                    ("Focused Research Problem", "Museum wayfinding differs from street navigation because visitors are expected to remain visually engaged with the environment. An AR arrow that is easy to follow may still be a poor interaction design if it causes continuous screen fixation or interrupts exhibit noticing."),
                    ("Revised Research Questions", [
                        "How do different AR guidance styles shape visitors' confidence while navigating to a target exhibit?",
                        "What attention-switching patterns emerge when visitors use screen-based AR compared with a map or static signage?",
                        "Which overlay density best balances navigational clarity and environmental awareness?"
                    ]),
                    ("Prototype Conditions", [
                        "Minimal overlay: next-turn cue only.",
                        "Contextual overlay: next-turn cue plus destination preview.",
                        "Control: printed map with existing signage."
                    ]),
                    ("Study Method", "I will run a within-subjects study in a gallery-like test environment built from a mapped museum floor. Participants will be first-time visitors to that space. Data will include route time, wrong turns, confidence ratings, observer-coded attention shifts, and short exit interviews about whether the interface felt intrusive."),
                    ("Measures", [
                        "Primary: route confidence and perceived orientation.",
                        "Secondary: attention switches between phone and environment, wrong turns, and comments about interruption."
                    ]),
                    ("Design Rationale", "The interface intentionally avoids persistent arrows in the center of the screen. Guidance appears near the lower edge and fades once the participant commits to a direction. This choice is based on the concern that heavy overlays may compete with the exhibition itself."),
                    ("Student Annotation", "The core question now feels much more like HCI: not whether AR works in general, but how interface density changes the social and perceptual quality of wayfinding.")
                ),
            },
        ],
    },
    {
        "id": "project03",
        "project_name": "LLM Feedback Dashboards for First-Year Academic Writing",
        "participants": {"A": "Advisor (Prof. Dana Liu)", "B": "Student (Nora)"},
        "rounds": [
            {
                "time_prefix": "2026-04-04",
                "student_message": "Prof. Liu, attaching the first draft. I want to work on AI support for first-year writing, but I know 'AI in education' is too vague. I tried to narrow it to dashboard-style feedback on essay drafts, though I think I'm still mixing interface questions with teaching claims.",
                "advisor_message": "You're right, it's still mixed. There is an HCI project in here, but it isn't 'does AI improve writing'. f1.pdf is promising better writing, better confidence, and less staff workload all at once. That's too much. The part worth keeping is how students read and interpret the feedback.",
                "student_reply": "Okay, that helps. I'll cut the bigger learning claims and stay with how students read, sort, and act on the feedback.",
                "pdf_title": "Draft V1: AI Feedback Dashboards for Early University Writing",
                "date_label": "2026-04-04",
                "sections": ordered_sections(
                    ("Motivation", "First-year students often receive automated writing feedback that is abundant but difficult to interpret. I am interested in the interface layer: how feedback is grouped, explained, and turned into concrete revision actions."),
                    ("Initial Problem Statement", "Current writing dashboards summarize issues such as structure, argument clarity, citation, or sentence-level style. Students may not know which feedback deserves attention first, whether comments are trustworthy, or how to translate abstract labels into edits."),
                    ("Broad Research Goal", "My initial aim is to design an AI feedback dashboard that helps first-year students revise essays more effectively while also making the feedback process more scalable for teaching staff."),
                    ("Early Research Questions", [
                        "How do students interpret different categories of AI writing feedback?",
                        "What dashboard layout encourages productive revision?",
                        "Can AI feedback improve writing confidence and final essay quality?"
                    ]),
                    ("Method Sketch", "I planned interviews with students, prototype comparisons between different dashboard layouts, and a small revision study where students act on feedback during a timed session."),
                    ("Interface Concepts", [
                        "A priority panel ranking feedback by severity.",
                        "Expandable explanations with plain-language examples.",
                        "A revision checklist that students can mark as they work."
                    ]),
                    ("Where I Need Guidance", [
                        "The proposal may still make claims that belong to education research rather than HCI.",
                        "I do not know whether to compare multiple visualizations or hold the visualization constant and vary explanation style.",
                        "I want to avoid a study that becomes an essay-grading benchmark."
                    ]),
                    ("Student Annotation", "My strongest observation from preliminary conversations is that students do not reject AI feedback outright; they often feel unsure about what the labels actually mean.")
                ),
            },
            {
                "time_prefix": "2026-04-10",
                "student_message": "I've revised the scope in f2.pdf. It's now about how first-year students interpret and prioritize AI comments in a dashboard, not whether the tool improves writing overall. I also moved trust and actionability closer to the center.",
                "advisor_message": "This is more coherent. The remaining issue is that your method still assumes students can explain their confusion after everything is over. I'd rather see you capture that in the moment. Add logging, and be more concrete about the kinds of misunderstanding you're actually looking for.",
                "student_reply": "Will do. I'll add click traces and use the recording for stimulated recall. I'll also define the misread categories more clearly.",
                "pdf_title": "Draft V2: Interpreting AI Writing Feedback Through Dashboard Design",
                "date_label": "2026-04-10",
                "sections": ordered_sections(
                    ("Revision Summary", "This version reframes the project as an HCI study of how first-year students interpret, prioritize, and act on AI-generated writing feedback when it is presented through a dashboard."),
                    ("Focused Research Problem", "Students often face feedback dashboards that summarize a draft through short labels, scores, and expandable comments. The problem is not simply whether feedback exists; it is whether users understand what the system means, know what to do next, and maintain an appropriate level of trust."),
                    ("Refined Research Questions", [
                        "How do first-year students interpret category labels and explanations in AI-generated writing feedback dashboards?",
                        "Which interface cues help students decide what to revise first?",
                        "Where do students over-trust, under-trust, or misapply AI feedback during revision planning?"
                    ]),
                    ("Study Design", [
                        "Semi-structured interviews to surface prior expectations about automated writing tools.",
                        "Prototype comparison of two dashboard styles: score-first versus explanation-first.",
                        "Timed revision-planning sessions with screen capture, click logs, and post-task interviews."
                    ]),
                    ("Planned Analysis", [
                        "Code interpretation problems such as category confusion, uncertainty about evidence, and premature acceptance of suggestions.",
                        "Examine how interface order and explanation format affect revision prioritization.",
                        "Synthesize design implications for trust calibration rather than essay quality prediction."
                    ]),
                    ("Why This Is HCI", "The contribution is about interaction design for sensemaking. I am not evaluating the language model as a grader, and I am not claiming improved long-term writing performance. The study examines how interface structure mediates meaning and action."),
                    ("Student Annotation", "I am now convinced the dashboard itself is the artifact of interest, especially the difference between a system that ranks comments and one that explains them before asking students to prioritize.")
                ),
            },
        ],
    },
    {
        "id": "project04",
        "project_name": "Shared Tablet Communication in Pediatric Wards",
        "participants": {"A": "Mentor (Prof. Rachel Miller)", "B": "Student (Chris)"},
        "rounds": [
            {
                "time_prefix": "2026-04-05",
                "student_message": "Prof. Miller, I finally pivoted the thesis toward hospital communication. The draft is about a shared bedside tablet for kids, parents, and nurses during short exchanges. I can't tell if I've actually found the interaction problem yet or if I'm still designing a whole system.",
                "advisor_message": "You're still too close to the whole system. The setting is good, but f1.pdf is trying to redesign ward communication end to end, and that's not realistic. The part I think is worth keeping is the tiny handoff moment: someone makes a request, and everyone wonders whether it landed with the right person.",
                "student_reply": "That sounds right. I let the urgency of the setting push the scope out too far. I'll pull it back to those short handoff moments.",
                "pdf_title": "Draft V1: Shared Tablet Interfaces for Pediatric Ward Communication",
                "date_label": "2026-04-05",
                "sections": ordered_sections(
                    ("Context", "In pediatric wards, communication is distributed among children, parents, and clinical staff. Requests are often verbal, fragmented, and vulnerable to delay or misunderstanding. I am interested in whether a shared bedside tablet could support clearer communication without replacing face-to-face care."),
                    ("Initial Project Idea", "Design a tablet-based interface for reporting symptoms, requesting comfort items, tracking care tasks, and messaging the care team. The system would be accessible to children with support from parents and could provide visible status updates."),
                    ("Draft Research Questions", [
                        "How can a shared bedside interface improve communication in pediatric wards?",
                        "What features do families and nurses need most?",
                        "Can the system reduce uncertainty around whether a request was received?"
                    ]),
                    ("Method Sketch", "I planned interviews with nurses and parents, a co-design workshop, and a prototype walkthrough study. The interface concept included quick symptom cards, request buttons, and a status tracker."),
                    ("Practical Constraints I Already See", [
                        "Bedside interaction is short and interrupted.",
                        "Young children may not read reliably.",
                        "The interface must be collaborative without becoming cluttered."
                    ]),
                    ("Student Annotation", "I realize this may still be too much system design. The moments that seem most consequential are the tiny handoffs when one person sends a request and another person wonders whether anything happened.")
                ),
            },
            {
                "time_prefix": "2026-04-11",
                "student_message": "I've revised it around micro-handoffs. In f2.pdf the tablet only supports short request-and-confirmation episodes now. I also rewrote the questions around reassurance and shared visibility.",
                "advisor_message": "This is more believable. The main thing still bothering me is the participant range. A five-year-old and a thirteen-year-old are completely different design cases. Narrow that down, and say more clearly what you mean by shared visibility in the interface itself.",
                "student_reply": "You're right. I'll narrow it to roughly 8-12 and define shared visibility more concretely as a small status trace everyone can read at a glance.",
                "pdf_title": "Draft V2: Designing Shared Visibility for Bedside Communication Handoffs",
                "date_label": "2026-04-11",
                "sections": ordered_sections(
                    ("Revision Summary", "This version focuses on a narrow HCI problem in pediatric wards: how a shared tablet can support short communication handoffs so that children and parents know a request was sent, seen, and being handled."),
                    ("Focused Research Problem", "Families often experience uncertainty after making a request. They may not know whether the nurse heard them, whether the request is clinically appropriate, or whether they should ask again. A shared interface could reduce that uncertainty, but only if its status cues are legible to multiple people in a brief, stressful context."),
                    ("Revised Research Questions", [
                        "How should a shared bedside interface represent request status so children and parents understand what happens next?",
                        "What kinds of confirmation cues feel reassuring without implying false precision?",
                        "How do nurses perceive the visibility of requests made through a shared device?"
                    ]),
                    ("Prototype Scope", [
                        "Comfort requests such as water, blanket, or help repositioning.",
                        "Simple symptom check-ins using icon-supported prompts.",
                        "Status trace showing sent, seen, and on-the-way states."
                    ]),
                    ("Study Plan", "I will interview pediatric nurses and parents first, then evaluate a clickable tablet prototype through role-play scenarios. The scenarios will focus on moments of uncertainty rather than broad workflow replacement."),
                    ("Age Band and Accessibility", "The target child group is 8-12 years old. The prototype uses large tap targets, icons paired with short labels, and a confirmation strip visible from different viewing positions so the device can be shared between child and parent."),
                    ("Student Annotation", "The design feels more honest now. It is about reassurance and coordination in short episodes, not digitizing the entire ward.")
                ),
            },
        ],
    },
    {
        "id": "project05",
        "project_name": "Privacy Negotiation Prompts for Smart Home Guests",
        "participants": {"A": "Advisor (Dr. Priya Nandakumar)", "B": "Student (Ethan)"},
        "rounds": [
            {
                "time_prefix": "2026-04-06",
                "student_message": "Dr. Priya, I've attached the first draft. I was originally thinking about consent in smart homes in general, but I narrowed it to what happens when a guest walks into a house with cameras and voice assistants already running. It still feels a bit too close to an ethics essay though.",
                "advisor_message": "That's exactly the risk. The material is good, but f1.pdf is still mostly a privacy argument. You need an interaction moment. The obvious one is arrival: the guest is suddenly in a sensor-rich home and has to work out what is active and whether they can say anything about it.",
                "student_reply": "Yes, that gives it a better center. I'll focus on the arrival moment and the prompts around it, not smart-home privacy in general.",
                "pdf_title": "Draft V1: Consent and Awareness in Sensor-Rich Smart Homes",
                "date_label": "2026-04-06",
                "sections": ordered_sections(
                    ("Motivation", "Guests entering a smart home may be surrounded by voice assistants, doorbell cameras, motion sensors, and appliance logs without knowing what is active or whether they can object. I want to study how interface design can support respectful privacy negotiation in this awkward social setting."),
                    ("Initial Problem Statement", "Smart home privacy research often focuses on owners, but guests have limited control and incomplete information. The challenge is not only legal consent; it is the social interaction of becoming aware of sensing and deciding whether to proceed, ask questions, or request changes."),
                    ("Early Research Questions", [
                        "How do guests understand sensing and recording in a smart home?",
                        "What kinds of privacy notices are acceptable in a domestic setting?",
                        "How can a system support consent without making the interaction socially hostile?"
                    ]),
                    ("Potential Artifact", "A prompt system delivered through an entry tablet, QR code, or lightweight mobile page that summarizes active sensors and offers guest-facing controls such as mute-now, ask-homeowner, or proceed with awareness."),
                    ("Method Sketch", "Interviews with smart home users and visitors, concept probes of alternative notice formats, and scenario-based evaluations of prompt timing and wording."),
                    ("Student Annotation", "The social awkwardness of being 'just a guest' seems central. People may not want to challenge the homeowner, even when they feel uncomfortable.")
                ),
            },
            {
                "time_prefix": "2026-04-12",
                "student_message": "I've revised it around the doorstep interaction. f2.pdf is now about guest-facing prompts that disclose active sensing and give a few low-friction response options. I also stripped out the broader ethics-survey language.",
                "advisor_message": "This is better. The thing still missing is the difference between awareness and agency. A notice can tell someone what's happening without giving them any real room to respond. Be careful there, and don't imply a guest would have full control over someone else's home setup.",
                "student_reply": "Agreed. I'll define agency more modestly, more like being able to ask, pause, or request a temporary change.",
                "pdf_title": "Draft V2: Designing Guest-Facing Privacy Prompts at Smart Home Entry",
                "date_label": "2026-04-12",
                "sections": ordered_sections(
                    ("Revision Summary", "The project now studies a concrete HCI problem: how guest-facing entry prompts can communicate active sensing and support socially realistic privacy negotiation when someone enters a smart home."),
                    ("Focused Research Problem", "Guests often learn about home sensing too late, too vaguely, or only after an uncomfortable incident. Entry prompts could improve awareness, but poor timing or overbearing wording may feel invasive, theatrical, or socially inappropriate."),
                    ("Refined Research Questions", [
                        "What timing and wording help guests notice active sensing without feeling accused or overwhelmed?",
                        "Which response options feel realistic for guests in another person's home?",
                        "How do guests interpret the difference between being informed and being given actual choice?"
                    ]),
                    ("Prototype Variants", [
                        "Doorstep summary card shown before entry.",
                        "Indoor ambient notice visible after entry.",
                        "QR-linked mobile prompt with optional follow-up questions."
                    ]),
                    ("Scenario-Based Method", "Participants will review and enact realistic visit scenarios such as dinner with friends, childcare pickup, or a repair visit. I will compare prompt formats and capture comfort, comprehension, and willingness to ask for changes."),
                    ("Agency Framing", "The system will not promise unrestricted control. Instead, it will support modest but meaningful actions: asking what is active, requesting a temporary mute, or indicating discomfort so the homeowner can respond."),
                    ("Student Annotation", "The project now feels less like a normative privacy debate and more like interface design for an asymmetrical social situation.")
                ),
            },
        ],
    },
    {
        "id": "project06",
        "project_name": "Cognitive Load Cues in VR Remote Lab Collaboration",
        "participants": {"A": "Advisor (Prof. Martin Schmidt)", "B": "Student (Sara)"},
        "rounds": [
            {
                "time_prefix": "2026-04-06",
                "student_message": "Prof. Schmidt, attached is the first draft. I'm trying to understand how people in a shared VR lab know when their partner is confused or overloaded. Right now the draft leans on status cues, but I'm not sure the questions are tight enough.",
                "advisor_message": "The problem is interesting, but you're jumping too fast from 'this seems hard to read in VR' to 'I'll detect cognitive load'. That becomes a sensing project very quickly. Start simpler. What cues help people notice a partner is struggling, and which of those are actually useful in collaboration?",
                "student_reply": "That makes sense. I'll step back from detection and keep it on cues people can actually use during the task.",
                "pdf_title": "Draft V1: Detecting Overload in VR Remote Lab Work",
                "date_label": "2026-04-06",
                "sections": ordered_sections(
                    ("Motivation", "Students increasingly collaborate remotely in immersive environments, but it is difficult to read whether a partner is confused, overloaded, or simply concentrating. This matters in lab-like tasks where one person may silently fall behind."),
                    ("Initial Project Idea", "Design a VR collaboration interface that estimates participant overload and displays support cues so partners can coordinate more effectively during remote lab tasks."),
                    ("Early Research Questions", [
                        "Can collaborators detect each other's cognitive load in VR?",
                        "What interface signals can surface overload in a useful way?",
                        "Do overload cues improve task performance and satisfaction?"
                    ]),
                    ("Initial Method", "A VR assembly task with dyads, optional biometric sensing, and prototype indicators such as partner status icons or requests-for-help. I planned to compare conditions with and without awareness cues."),
                    ("Risks I Already See", [
                        "Physiological sensing may dominate the project.",
                        "The concept of overload may be too vague without clearer interaction indicators.",
                        "The task must be collaborative enough for partner awareness to matter."
                    ]),
                    ("Student Annotation", "The meaningful design challenge seems to be how partners notice and interpret strain, not whether I can perfectly infer an internal cognitive state.")
                ),
            },
            {
                "time_prefix": "2026-04-13",
                "student_message": "I reworked the proposal in f2.pdf. It now focuses on lightweight collaboration cues instead of hidden-state detection, and I defined the task as a paired VR lab where one person manipulates equipment and the other tracks the procedure.",
                "advisor_message": "Good direction. But 'lightweight cues' is still too vague. I need to know what those cues actually are. Also be explicit about the trade-off here: the cue should help coordination without humiliating the person who's stuck or cluttering the scene.",
                "student_reply": "Okay. I'll make the cue set concrete and frame the study around that coordination-versus-social-cost trade-off.",
                "pdf_title": "Draft V2: Lightweight Awareness Cues for Partner Difficulty in VR Labs",
                "date_label": "2026-04-13",
                "sections": ordered_sections(
                    ("Revision Summary", "This version reframes the project as an HCI study of collaboration cues in VR rather than automatic cognitive-load detection. The goal is to help partners notice and respond to difficulty during a shared lab task."),
                    ("Focused Research Problem", "In immersive collaboration, participants have limited access to the subtle cues that would signal uncertainty in face-to-face settings. Yet overt alerts may embarrass the struggling partner or distract from the task. The design challenge is to surface useful awareness without overexposing vulnerability."),
                    ("Refined Research Questions", [
                        "Which lightweight cues help partners recognize when collaborative support is needed?",
                        "How do different cue styles affect coordination, interruption, and perceived social pressure?",
                        "What balance do participants prefer between visibility of struggle and preservation of autonomy?"
                    ]),
                    ("Cue Concepts", [
                        "Soft status halo that expands when a partner requests or appears to need assistance.",
                        "Procedure-progress mismatch cue when one partner advances faster than the other.",
                        "Optional help token a participant can trigger without speaking."
                    ]),
                    ("Method", "Dyads will complete a VR chemistry-lab simulation with asymmetric roles. I will compare cue conditions and collect coordination breakdowns, support actions, interview reflections, and ratings of pressure or embarrassment."),
                    ("Analysis Lens", "The study will analyze when cues enable timely support, when they create unnecessary interruption, and when they change the social tone of collaboration. The aim is a design framework for supportive but non-stigmatizing awareness cues."),
                    ("Student Annotation", "The proposal is much stronger once I stop pretending I can infer cognition cleanly and instead examine the communicative role of cues in collaborative work.")
                ),
            },
        ],
    },
    {
        "id": "project07",
        "project_name": "Accessible Self-Service Transit Kiosks for Low-Vision Riders",
        "participants": {"A": "Advisor (Prof. Isabella Romero)", "B": "Student (Jae)"},
        "rounds": [
            {
                "time_prefix": "2026-04-07",
                "student_message": "Prof. Romero, here's the first draft. I keep coming back to how stressful ticket kiosks are for low-vision riders, especially in loud stations when people are waiting behind them. I'm not sure yet whether the thesis is really about kiosk interaction or broader accessibility in public transit.",
                "advisor_message": "Keep it at the kiosk. Right now f1.pdf drifts into station design and policy, and that's where it starts to lose shape. The stronger HCI problem is the recovery moment: something goes wrong during ticketing or route selection, and the rider has to find their way back under time pressure.",
                "student_reply": "Got it. I'll cut the broader transit material and focus on breakdown and recovery at the kiosk itself.",
                "pdf_title": "Draft V1: Improving Accessibility of Transit Ticket Kiosks",
                "date_label": "2026-04-07",
                "sections": ordered_sections(
                    ("Motivation", "Public transit kiosks often assume stable vision, patience, and uninterrupted attention. Riders with low vision must act quickly in crowded spaces, sometimes while filtering ambient noise and social pressure from people waiting behind them."),
                    ("Initial Proposal", "Redesign self-service transit kiosks through a multimodal interface that combines high-contrast visuals, speech output, tactile landmarks, and simplified navigation for ticket purchase and route lookup."),
                    ("Preliminary Research Questions", [
                        "What barriers do low-vision riders encounter at existing kiosks?",
                        "How should multimodal kiosk interfaces balance speed and accessibility?",
                        "Can improved kiosk design increase confidence in independent travel?"
                    ]),
                    ("Method Sketch", "Accessibility walkthroughs of existing kiosks, co-design sessions with low-vision riders, and evaluation of a kiosk prototype with alternative interaction modes."),
                    ("Open Scope Problem", "The draft still includes station signage and journey planning concerns that may be too broad. I am unsure where to draw the line between kiosk interaction and broader travel accessibility."),
                    ("Student Annotation", "The moments that seem most stressful are not the ordinary flows, but the moments when users are unsure whether they selected the right fare or cannot find a way back without restarting.")
                ),
            },
            {
                "time_prefix": "2026-04-14",
                "student_message": "I've revised it around kiosk breakdown recovery. f2.pdf looks at fare confirmation, route correction, and backtracking, and I removed the broader station-level claims.",
                "advisor_message": "This is on the right track. The remaining issue is that you're still presenting the prototype as one big feature bundle. If you want interpretable results, vary fewer things. Audio timing or confirmation detail would be enough.",
                "student_reply": "Makes sense. I'll narrow the comparison to those two variables instead of changing everything at once.",
                "pdf_title": "Draft V2: Breakdown Recovery in Accessible Transit Kiosk Interaction",
                "date_label": "2026-04-14",
                "sections": ordered_sections(
                    ("Revision Summary", "The project now focuses on one HCI problem: how transit kiosks can support low-vision riders during error-prone moments such as correcting a route, confirming a fare, or returning from an unintended screen under time pressure."),
                    ("Focused Research Problem", "Existing kiosks often fail not only because text is hard to read, but because the interaction structure makes recovery difficult. Once a rider is uncertain, they may restart, rush, or accept a choice they do not trust. Accessible design must therefore address recovery, not just visibility."),
                    ("Refined Research Questions", [
                        "How do audio timing and confirmation detail affect confidence during kiosk recovery tasks?",
                        "What kinds of tactile and verbal cues help riders maintain orientation after an error?",
                        "How do users balance speed against certainty in a pressured public setting?"
                    ]),
                    ("Prototype Comparison", [
                        "Condition A: immediate step-by-step audio guidance with concise confirmations.",
                        "Condition B: user-triggered audio guidance with more detailed confirmations.",
                        "Shared tactile baseline: physical landmarks for home, back, and confirm zones."
                    ]),
                    ("Method", "Participants with low vision will complete fare-selection and route-correction tasks in a kiosk simulator while standing, with ambient station audio and timed departure scenarios. Data will include task paths, requests for repetition, confidence ratings, and retrospective interviews."),
                    ("Expected Contribution", [
                        "Design implications for recovery-oriented kiosk accessibility.",
                        "A comparison of timing strategies for audio guidance in public-service interfaces.",
                        "A richer account of confidence under accessibility-related time pressure."
                    ]),
                    ("Student Annotation", "The narrowed comparison finally gives me a way to produce interpretable findings instead of a grab bag of accessibility features.")
                ),
            },
        ],
    },
    {
        "id": "project08",
        "project_name": "Wearable Haptic Prompts for Emotion Regulation at Work",
        "participants": {"A": "Advisor (Dr. Samuel Greene)", "B": "Student (Ava)"},
        "rounds": [
            {
                "time_prefix": "2026-04-08",
                "student_message": "Dr. Greene, sending the first draft here. I came into it from personal informatics, but I don't want the thesis to slide into a clinical stress study. Right now it's about discreet haptic prompts that nudge short regulation actions during tense work moments.",
                "advisor_message": "The artifact is interesting, but you need to watch the framing. f1.pdf starts to sound like you're evaluating a mental-health intervention. Keep it grounded in HCI: timing, intrusiveness, and how people read the prompt in context.",
                "student_reply": "Understood. I'll keep it on how people interpret and use the prompt at work, not on therapeutic outcomes.",
                "pdf_title": "Draft V1: Wearable Haptics for Workplace Emotion Regulation",
                "date_label": "2026-04-08",
                "sections": ordered_sections(
                    ("Motivation", "People often notice mounting tension at work too late, or they avoid using visible regulation tools because they feel socially exposed. Wearable haptic prompts may create a private channel for interruption and self-check without requiring screen attention."),
                    ("Initial Problem Framing", "I propose a wrist-worn interface that delivers subtle haptic prompts when users self-identify rising stress or when contextual triggers suggest a difficult moment. The prompt would invite a short breathing, reframing, or pause action."),
                    ("Early Research Questions", [
                        "How do workers interpret discreet haptic prompts during tense moments?",
                        "What vibration styles feel supportive rather than disruptive?",
                        "Can wearable prompts encourage emotion regulation without social awkwardness?"
                    ]),
                    ("Draft Method", "Interviews about current coping routines, low-fidelity haptic probes, and a field deployment of a simple wearable prototype with event-contingent reflection surveys."),
                    ("Boundary Notes", [
                        "The study is not intended as therapy.",
                        "The prompts must be discreet enough for meetings and shared offices.",
                        "The timing logic must allow user agency rather than forced interruption."
                    ]),
                    ("Student Annotation", "My biggest concern is that a helpful prompt in one situation may feel irritating or exposing in another. That variability may be the actual design problem.")
                ),
            }
        ],
    },
    {
        "id": "project09",
        "project_name": "Multilingual Civic Reporting Chatbots for New Migrants",
        "participants": {"A": "Advisor (Prof. Elena Kovacs)", "B": "Student (Yusuf)"},
        "rounds": [
            {
                "time_prefix": "2026-04-08",
                "student_message": "Prof. Kovacs, attached is the first draft. I'm looking at a civic reporting chatbot for new migrants who notice local problems but don't really know how the reporting system works yet. I'm trying to keep it on interaction barriers rather than turning it into a public-policy piece.",
                "advisor_message": "The direction is good, but the draft is still too abstract. It says 'inclusion' a lot and doesn't say enough about where the interaction actually breaks down. Is it terminology, mistrust, not knowing the procedure, or being afraid of submitting the wrong thing? That's what I need to see.",
                "student_reply": "That helps. I'll make the barriers more concrete and treat the chatbot as support for forming a report, not as a general inclusion platform.",
                "pdf_title": "Draft V1: Civic Issue Reporting Chatbots for New Migrants",
                "date_label": "2026-04-08",
                "sections": ordered_sections(
                    ("Context", "New migrants may notice local issues that affect daily life but hesitate to report them because the process feels bureaucratic, unfamiliar, or linguistically risky. Civic reporting systems often assume knowledge of categories, locations, and expected evidence."),
                    ("Initial Proposal", "Design a multilingual chatbot that helps users report issues such as trash overflow, broken streetlights, and inaccessible crossings by asking simple questions and translating the result into a formal report structure."),
                    ("Preliminary Research Questions", [
                        "What interaction barriers prevent new migrants from using civic reporting systems?",
                        "How should a chatbot ask clarifying questions without sounding bureaucratic?",
                        "Can multilingual conversational scaffolding increase confidence in submitting a report?"
                    ]),
                    ("Method Sketch", "Interviews with recent migrants, prompt-and-response prototype testing, and comparison with existing web forms for simple civic reporting tasks."),
                    ("Student Annotation", "The friction seems to come less from language alone and more from not knowing what kind of detail counts as an acceptable report.")
                ),
            },
            {
                "time_prefix": "2026-04-15",
                "student_message": "I've revised it based on your notes. f2.pdf now treats the chatbot as a scaffold for first-time report formulation, especially around category confusion, evidence expectations, and fear of doing the process wrong.",
                "advisor_message": "This is much clearer. My only caution is that you shouldn't assume chat will automatically feel safer than a form. For some people it may feel less transparent. Add a comparison and pay attention to whether the chatbot feels helpful or like it's hiding the process.",
                "student_reply": "Good point. I'll compare it against a structured form and make transparency one of the main things I look at.",
                "pdf_title": "Draft V2: Conversational Scaffolding for First-Time Civic Reporting",
                "date_label": "2026-04-15",
                "sections": ordered_sections(
                    ("Revision Summary", "This version focuses on first-time civic reporting and defines the chatbot as a conversational scaffold that helps users understand categories, required detail, and procedural expectations."),
                    ("Focused Research Problem", "For first-time reporters, the challenge is often not language translation alone but uncertainty about what the city expects. A conversational interface may lower entry barriers, yet it may also feel opaque or overly leading if users cannot see how their answers become a formal report."),
                    ("Refined Research Questions", [
                        "How do new migrants interpret chatbot questions when trying to formulate a civic report for the first time?",
                        "What kinds of conversational prompts reduce uncertainty about categories and evidence requirements?",
                        "How do perceptions of transparency differ between a chatbot and a structured form?"
                    ]),
                    ("Method", [
                        "Interviews about prior experiences with civic systems.",
                        "Prototype comparison between multilingual chatbot and structured multilingual form.",
                        "Scenario-based reporting tasks followed by stimulated recall and trust interviews."
                    ]),
                    ("Design Focus", [
                        "Plain-language category guidance.",
                        "Visible summary showing how user responses become report fields.",
                        "Confidence checkpoint before submission."
                    ]),
                    ("Student Annotation", "I had assumed chat would obviously feel friendlier, but the more I think about it, the more transparency seems likely to matter as much as tone.")
                ),
            },
        ],
    },
    {
        "id": "project10",
        "project_name": "Explainable Course Recommendation Interfaces in Online Learning",
        "participants": {"A": "Advisor (Dr. Laura Bennett)", "B": "Student (Hugo)"},
        "rounds": [
            {
                "time_prefix": "2026-04-09",
                "student_message": "Dr. Bennett, here's the first draft. I'm interested in recommendation systems in online learning, especially how explanations affect whether students follow a recommendation or ignore it. I tried to keep it on the interface side, but I'm not sure the question is specific enough yet.",
                "advisor_message": "The direction is fine. The problem is that f1.pdf is still bundling too many things together: trust, fairness, satisfaction, planning quality. Pick the decision you actually care about. To me the interesting one is whether the explanation helps students judge fit for themselves.",
                "student_reply": "Okay, that's cleaner. I'll make the next version about explanation style and fit assessment, not broad trust or fairness claims.",
                "pdf_title": "Draft V1: Explanation Design for Course Recommendations",
                "date_label": "2026-04-09",
                "sections": ordered_sections(
                    ("Motivation", "Students in online learning platforms often receive recommendations with little context. Explanations are meant to increase trust, but they may also encourage superficial acceptance if they sound authoritative without supporting real judgment."),
                    ("Initial Problem Statement", "I want to study how explanation design in a recommendation interface affects student decision making during course selection. The central concern is whether students can assess the fit of a recommendation for their own goals and constraints."),
                    ("Preliminary Research Questions", [
                        "How do different explanation styles affect student trust in recommended courses?",
                        "Do explanations help students choose more suitable courses?",
                        "What forms of explanation feel useful rather than generic?"
                    ]),
                    ("Method Sketch", "Prototype comparison between recommendation cards with no explanation, short rationale, and more detailed fit explanation. Tasks would ask students to choose courses for hypothetical planning scenarios."),
                    ("Student Annotation", "I think the real issue is not simply whether students trust the recommendation, but whether the explanation helps them reason about fit in a reflective way.")
                ),
            },
            {
                "time_prefix": "2026-04-16",
                "student_message": "I've revised the proposal in f2.pdf. It's now about how explanation style supports fit assessment during course planning, and I took out the broader fairness claims.",
                "advisor_message": "This is cleaner. One thing still needs pinning down: what do you mean by fit? Workload, prerequisites, career goals, confidence? If you leave that vague, the analysis will get muddy fast.",
                "student_reply": "Right, I'll define fit more explicitly around workload, prior knowledge, and goal alignment and adjust the tasks to match.",
                "pdf_title": "Draft V2: Supporting Fit Assessment in Explainable Course Recommendation Interfaces",
                "date_label": "2026-04-16",
                "sections": ordered_sections(
                    ("Revision Summary", "This version studies explanation design in online course recommendation interfaces through the lens of fit assessment rather than generic trust or fairness."),
                    ("Focused Research Problem", "Students evaluating a recommendation must weigh multiple dimensions at once: workload, prior preparation, interest, and future goals. Explanations may help with this reasoning, but they may also compress complexity into a persuasive summary that users accept too quickly."),
                    ("Refined Research Questions", [
                        "How do different explanation styles support students' assessment of course fit across workload, prior knowledge, and goal alignment?",
                        "When do explanations prompt reflective comparison rather than quick acceptance?",
                        "Which explanation elements make recommendation logic feel inspectable?"
                    ]),
                    ("Prototype Conditions", [
                        "No explanation baseline.",
                        "Single-line rationale emphasizing popularity or similarity.",
                        "Structured fit explanation showing workload, prerequisites, and goal match."
                    ]),
                    ("Method", "Participants will complete scenario-based course planning tasks while thinking aloud. I will capture decision time, comparison behavior, and interview reflections about whether the explanation supported or short-circuited judgment."),
                    ("Expected Contribution", [
                        "Design implications for recommendation explanations in educational planning.",
                        "A richer account of how students construct 'fit' in interaction with recommendation interfaces.",
                        "Evidence about when explanations support reflective decision making."
                    ]),
                    ("Student Annotation", "This now feels like an HCI thesis about sensemaking in planning interfaces rather than a weak attempt to evaluate the recommender itself.")
                ),
            },
        ],
    },
    {
        "id": "project11",
        "project_name": "Turn-Taking Signals for Social Robots in Language Practice",
        "participants": {"A": "Mentor (Prof. Akiko Tanaka)", "B": "Student (Lina)"},
        "rounds": [
            {
                "time_prefix": "2026-04-10",
                "student_message": "Prof. Tanaka, attached is my initial proposal. I'm interested in those awkward moments in language practice when the learner isn't sure whether the robot expects an answer, wants them to continue, or is just pausing. I think the topic is there, but the method is still fuzzy.",
                "advisor_message": "The topic is good. But the draft still wanders into broad learning-gain claims, and I don't think you need those. Keep it on conversational coordination. The interesting question is what kinds of turn-taking cues help hesitant learners know when to speak.",
                "student_reply": "That makes sense. I'll narrow it to the coordination cues and drop the broader learning-outcome claims.",
                "pdf_title": "Draft V1: Social Robot Cues for Spoken Language Practice",
                "date_label": "2026-04-10",
                "sections": ordered_sections(
                    ("Motivation", "Language learners often hesitate in spoken practice because they are unsure when to begin, whether the partner expects more, or whether a pause counts as trouble. These issues may become sharper with social robots because turn-taking norms are less familiar."),
                    ("Initial Proposal", "Study how a social robot can support spoken language practice by using gaze, pause timing, gesture, and verbal prompts to coordinate turns with learners."),
                    ("Preliminary Research Questions", [
                        "How do robot turn-taking cues affect learner comfort and participation?",
                        "Which combinations of verbal and nonverbal cues reduce hesitation?",
                        "Can better coordination cues improve practice quality?"
                    ]),
                    ("Method Sketch", "Prototype sessions with a tabletop robot, scripted language tasks, and comparison of cue combinations such as gaze only, gaze plus gesture, or explicit verbal handoff prompts."),
                    ("Student Annotation", "The moments I care about are the small awkward gaps where a learner is unsure whether to speak, not overall robot likability.")
                ),
            },
            {
                "time_prefix": "2026-04-17",
                "student_message": "I've revised the project in f2.pdf. It now centers on turn-taking ambiguity for hesitant learners and compares verbal and nonverbal handoff cues directly. I also removed the long-term learning claims.",
                "advisor_message": "Much stronger. The last thing I'd tighten is the learner group. Beginners and advanced learners won't react the same way here. Narrow the participant profile, and make sure the tasks create real hesitation instead of staged silence.",
                "student_reply": "Will do. I'll target lower-intermediate learners and design the prompts so hesitation comes up naturally.",
                "pdf_title": "Draft V2: Designing Turn-Taking Signals for Hesitant Language Learners",
                "date_label": "2026-04-17",
                "sections": ordered_sections(
                    ("Revision Summary", "This version narrows the thesis to turn-taking ambiguity in social-robot language practice and examines how different handoff signals affect speaking initiation for hesitant learners."),
                    ("Focused Research Problem", "In language practice, learners often wait for confirmation that it is their turn. With a robot partner, conventional conversational cues may be weak or unfamiliar. Poor handoff design can therefore suppress participation even when the learner knows what to say."),
                    ("Refined Research Questions", [
                        "How do verbal versus nonverbal handoff cues affect speaking initiation for lower-intermediate language learners?",
                        "Which cue combinations reduce hesitation without making the robot feel overbearing?",
                        "How do learners describe moments of uncertainty about whether to speak?"
                    ]),
                    ("Method", [
                        "Wizarded robot interactions with open but bounded speaking tasks.",
                        "Comparison of gaze-only, gesture-assisted, and explicit verbal handoff cues.",
                        "Measures of initiation delay, turn-taking errors, and post-task confidence."
                    ]),
                    ("Participant Scope", "The target participants are lower-intermediate adult learners who can respond in short phrases but report hesitation in live speaking situations. This group is likely to experience turn ambiguity without requiring fully novice support."),
                    ("Student Annotation", "I finally have a project where the interaction phenomenon, the learner group, and the measures all point to the same thing.")
                ),
            },
        ],
    },
    {
        "id": "project12",
        "project_name": "LLM-Supported Peer Critique in Studio-Based Design Education",
        "participants": {"A": "Advisor (Prof. Miguel Alvarez)", "B": "Student (Irene)"},
        "rounds": [
            {
                "time_prefix": "2026-04-10",
                "student_message": "Prof. Alvarez, attached is the first draft on AI support for peer critique in studio courses. What I care about is whether an LLM scaffold can make critique more specific without making the whole process feel canned. I'm worried the current version still sounds too idealistic.",
                "advisor_message": "That's the right worry. Right now f1.pdf sounds like the AI will simply improve critique, which is too broad and too clean. The real question is how the scaffold changes the practice itself: what people notice, what they say, and whether they start to feel boxed in by the prompt structure.",
                "student_reply": "Yes, that's the tension I'm after. I'll rewrite it around specificity and constraint instead of general quality improvement.",
                "pdf_title": "Draft V1: AI Scaffolds for Peer Critique in Design Studios",
                "date_label": "2026-04-10",
                "sections": ordered_sections(
                    ("Motivation", "Design students often understand that feedback should be specific and constructive, yet real critique sessions can drift into vague praise or personal preference statements. An AI scaffold might prompt more grounded comments, but it could also standardize critique in unhelpful ways."),
                    ("Initial Problem Statement", "I propose an LLM-supported critique interface that suggests lenses such as audience, hierarchy, readability, and rationale while students review each other's design work."),
                    ("Preliminary Research Questions", [
                        "Can AI scaffolds help students produce more specific critique?",
                        "How do students feel about using AI prompts during peer review?",
                        "Does the scaffold improve the usefulness of critique sessions?"
                    ]),
                    ("Method Sketch", "Design a critique support interface, compare scaffolded and unscaffolded peer feedback sessions, and analyze the resulting comments plus participant reflections."),
                    ("Student Annotation", "What matters to me is not whether the AI writes better critique, but whether it changes how students look at and talk about each other's work.")
                ),
            },
            {
                "time_prefix": "2026-04-18",
                "student_message": "I've revised the proposal in f2.pdf. It now looks at how an LLM scaffold changes critique specificity and perceived constraint during peer review, rather than claiming it improves critique overall.",
                "advisor_message": "This is close. The last piece is to separate two kinds of scaffolding: prompts that help students notice more, and prompts that more or less script what they say. That distinction should show up clearly in both the questions and the prototype conditions.",
                "student_reply": "Got it. I'll make that distinction explicit and compare a lens-based prompt with a more structured sentence-template prompt.",
                "pdf_title": "Draft V2: Specificity and Constraint in LLM-Supported Studio Critique",
                "date_label": "2026-04-18",
                "sections": ordered_sections(
                    ("Revision Summary", "This version studies AI-supported peer critique as an HCI problem of interactional scaffolding: how prompts shape what students notice, how they express critique, and whether they feel supported or constrained."),
                    ("Focused Research Problem", "Peer critique in studio settings depends on both perception and expression. A scaffold may broaden what students attend to, but it may also narrow the forms of critique they feel permitted to offer. The design challenge is to support specificity without scripting participation too tightly."),
                    ("Refined Research Questions", [
                        "How do different scaffold styles affect the specificity of peer critique comments?",
                        "When do students experience prompts as helpful lenses versus restrictive scripts?",
                        "How does scaffold style influence confidence in giving feedback during studio review?"
                    ]),
                    ("Prototype Conditions", [
                        "Lens-based prompts that suggest what to inspect without prescribing wording.",
                        "Sentence-template prompts that structure how to phrase critique.",
                        "No-AI critique baseline."
                    ]),
                    ("Method", "Small-group critique sessions around existing studio work, followed by transcript analysis and interviews about perceived agency, usefulness, and disruption to studio norms."),
                    ("Expected Contribution", [
                        "An interactional account of AI scaffolding in peer critique.",
                        "Design implications for balancing specificity and openness.",
                        "Evidence about how prompt structure changes critique practice."
                    ]),
                    ("Student Annotation", "The key distinction is no longer 'AI versus no AI' but what kind of scaffolding practice the interface creates.")
                ),
            },
        ],
    },
]


def build_messages(project):
    messages = []
    for index, round_info in enumerate(project["rounds"], start=1):
        day = round_info["time_prefix"]
        conversation = {
            "conversation_id": f"round_{index:02d}_{project['id']}",
            "participants": project["participants"],
            "project": project["project_name"],
            "records": [
                {
                    "type": "message",
                    "time": f"{day}T09:00:00+03:00",
                    "sender": "B",
                    "content": round_info["student_message"],
                },
                {
                    "type": "file",
                    "time": f"{day}T09:02:00+03:00",
                    "sender": "B",
                    "content": f"{BASE_DIR}/{project['id']}/files/f{index}.pdf",
                },
                {
                    "type": "message",
                    "time": f"{day}T15:30:00+03:00",
                    "sender": "A",
                    "content": round_info["advisor_message"],
                },
            ],
        }
        if round_info.get("student_reply"):
            conversation["records"].append(
                {
                    "type": "message",
                    "time": f"{day}T16:05:00+03:00",
                    "sender": "B",
                    "content": round_info["student_reply"],
                }
            )
        messages.append(conversation)
    return messages


def write_project(project):
    project_dir = os.path.join(BASE_DIR, project["id"])
    files_dir = os.path.join(project_dir, "files")
    os.makedirs(files_dir, exist_ok=True)

    for entry in os.listdir(files_dir):
        path = os.path.join(files_dir, entry)
        if os.path.isfile(path):
            os.remove(path)
        else:
            shutil.rmtree(path)

    for index, round_info in enumerate(project["rounds"], start=1):
        create_rich_pdf(
            filename=os.path.join(files_dir, f"f{index}.pdf"),
            project_code=project["id"],
            round_index=index,
            pdf_title=round_info["pdf_title"],
            student_name=project["participants"]["B"],
            advisor_name=project["participants"]["A"],
            date_label=round_info["date_label"],
            sections=round_info["sections"],
        )

    messages = build_messages(project)
    messages_path = os.path.join(project_dir, "messages.json")
    with open(messages_path, "w", encoding="utf-8") as handle:
        json.dump(messages, handle, indent=2, ensure_ascii=False)


if __name__ == "__main__":
    os.makedirs(BASE_DIR, exist_ok=True)
    for project in PROJECTS:
        write_project(project)
    print(f"Generated {len(PROJECTS)} HCI mock projects with realistic PDFs and messages.")

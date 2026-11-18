import raw from "./questions.json";
import {
  Answer,
  Question,
  Story,
  InterviewEvent,
  blankAnswer,
} from "@/lib/models";
const initial = "2026-11-17T12:00:00.000Z";
export const topIds = [
  "intro",
  "why-axon",
  "company",
  "why-swe",
  "resume",
  "lasso",
  "shakeur",
  "research",
  "interests",
  "values",
  "locations",
  "ask-recruiter",
];
const top: [string, string, string][] = [
  ["intro", "Tell me about yourself.", "Introduction and motivation"],
  ["why-axon", "Why Axon?", "Introduction and motivation"],
  ["company", "What do you know about Axon?", "Company knowledge"],
  ["why-swe", "Why software engineering?", "Introduction and motivation"],
  ["resume", "Walk me through your resume.", "Introduction and motivation"],
  [
    "lasso",
    "Tell me about your work at University IT.",
    "University IT and leadership",
  ],
  [
    "shakeur",
    "Tell me about ShakeUR.",
    "ShakeUR and hardware/software engineering",
  ],
  [
    "research",
    "Tell me about your AI security research.",
    "Research and security",
  ],
  [
    "interests",
    "What kind of engineering interests you most?",
    "Introduction and motivation",
  ],
  ["values", "Which Axon values resonate with you?", "Axon values"],
  [
    "locations",
    "What are your location and internship preferences?",
    "Logistics",
  ],
  [
    "ask-recruiter",
    "Do you have any questions for me?",
    "Questions for interviewers",
  ],
  [
    "authorization",
    "Are you legally authorized to work in the United States?",
    "Logistics",
  ],
  [
    "afrotech",
    "How did your AfroTech meeting influence your interest?",
    "Introduction and motivation",
  ],
];
const categoryStories: Record<string, string[]> = {
  "University IT and leadership": ["lasso-story", "scheduler", "cicd"],
  "ShakeUR and hardware/software engineering": ["shakeur-story"],
  "Research and security": ["research-story"],
  "Axon values": ["lasso-story"],
  "Behavioral and teamwork": ["lasso-story", "shakeur-story"],
  "Technical thinking and engineering judgment": ["cicd", "research-story"],
  "Introduction and motivation": ["lasso-story", "shakeur-story"],
  "Company knowledge": ["shakeur-story", "research-story"],
};
const guidance: Record<string, string> = {
  "Introduction and motivation":
    "Connect your current work to what you want to learn. Start with Rochester CS + Business, choose one relevant experience, then explain why this opportunity fits. Keep your introduction around 45 seconds.",
  "Company knowledge":
    "Explain the product in plain language, then connect one engineering challenge to your background. Separate verified product facts from your own engineering observations. See Company Intel for sources.",
  "Axon values":
    "Choose one actual example. Use Situation, Task, Action, Result, Reflection. Emphasize what you personally decided and did. Own It connects naturally to your LASSO responsibilities.",
  "University IT and leadership":
    "Ground the answer in LASSO: five student engineers, 1,000+ users, React/Node/Express/MongoDB. Pick a real decision and explain how you validated it. Add the specific incident and outcome yourself.",
  "ShakeUR and hardware/software engineering":
    "Explain the alarm-clock problem, your Raspberry Pi backend contribution, FastAPI integration, and the device pipeline. Your resume reports sub-200ms detection and MQTT. Be clear about your work versus teammates’ contributions.",
  "Research and security":
    "Explain the threat first, then eBPF monitoring and cgroup containment. Discuss evaluation limits: 100% detection applied only to a manually constructed test set, not all attacks.",
  "Behavioral and teamwork":
    "Choose a real, specific incident. Do not invent conflict, feedback, or failure. Keep context brief; focus on your action, the outcome, and what you would change.",
  "Technical thinking and engineering judgment":
    "Clarify requirements and constraints, describe alternatives, and explain your choice. Cover correctness, edge cases, complexity, testing, and limitations.",
  Logistics:
    "Private preparation. Enter your actual availability and preferences. F-1 work authorization and sponsorship details need confirmation with your university’s international student office and applicable authorities; no authorization or licensing outcome is assumed.",
  "Questions for interviewers":
    "Choose two or three questions for the time available. Ask about the process, team matching, or what successful interns do. Use the audience filter in the tags.",
};
const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const existing = new Set(top.map((x) => normalize(x[1])));
const items: [string, string, string][] = [
  ...top,
  ...raw
    .filter((q) => !existing.has(normalize(q.text)))
    .map(
      (q, i) => [`q-${i + 1}`, q.text, q.category] as [string, string, string],
    ),
];
const audienceQuestions: Record<string, string> = {
  "Engineering manager":
    "How do interns get ownership of a scoped project and receive feedback?",
  "Software engineer":
    "How does your team review, test, and roll out changes to production?",
  "Hardware engineer":
    "Where do device constraints most affect software design decisions?",
  "Behavioral interviewer":
    "How does your team make candid feedback useful and respectful?",
  "Internship coordinator":
    "What mentorship and learning opportunities are available during the internship?",
};
items.push(
  ...Object.entries(audienceQuestions).map(
    ([, t], i) =>
      [`audience-${i}`, t, "Questions for interviewers"] as [
        string,
        string,
        string,
      ],
  ),
);
export const seedQuestions: Question[] = items.map(([id, text, category]) => ({
  id,
  companyId: "axon",
  text,
  category,
  stage:
    topIds.includes(id) ||
    category === "Logistics" ||
    category === "Company knowledge" ||
    category === "Introduction and motivation" ||
    category === "Questions for interviewers"
      ? "Recruiter"
      : category === "Axon values" || category === "Behavioral and teamwork"
        ? "ACE Behavioral"
        : /AI|generated/.test(text) &&
            category === "Technical thinking and engineering judgment"
          ? "Engineering with AI"
          : "Traditional Coding",
  priority:
    topIds.includes(id) || id === "authorization"
      ? "Critical"
      : category === "Axon values" || id === "afrotech"
        ? "High"
        : "Medium",
  tags: [
    category === "Logistics" ? "Private" : category.split(" and ")[0],
    ...(id.startsWith("audience-")
      ? [Object.keys(audienceQuestions)[Number(id.split("-")[1])]]
      : []),
  ],
  source:
    "Suggested preparation question, not a confirmed Axon interview script. Based on your background and the supplied interview guide.",
  guidance:
    guidance[category] ||
    guidance["Technical thinking and engineering judgment"],
  linkedStoryIds: categoryStories[category] || [],
  status: "Not Started",
  confidence: 0,
  favorite: false,
  reviewFlag: false,
  custom: false,
  notes: "",
  nextReview: null,
  lastPracticed: null,
  createdAt: initial,
  updatedAt: initial,
}));
const drafts: Record<string, string> = {
  intro:
    "I'm a Computer Science and Business student at the University of Rochester, graduating in May 2028. I lead five student engineers at University IT, where we work on LASSO, an equipment-reservation platform used by over a thousand people. I also research AI agent security, and at HackPrinceton I helped build ShakeUR, a Raspberry Pi alarm clock that uses computer vision. I'm interested in backend systems and software that interacts with real devices, which is one reason Axon caught my attention.",
  "why-axon":
    "What interests me about Axon is the connection between software and devices people rely on. At HackPrinceton, I worked on the Raspberry Pi backend for ShakeUR and connected computer vision with FastAPI. I enjoyed having to think about the whole system. I met Nache Shekarri at AfroTech, and hearing how closely Axon's software and hardware teams collaborate made that interest more concrete. I'd like to learn how a team builds that kind of connected system with much higher requirements for reliability and accountability.",
  shakeur:
    "ShakeUR is an alarm clock that only turns off after you complete certain movements in front of a camera. We built it at HackPrinceton using a Raspberry Pi, Python, OpenCV, MediaPipe, and a web interface. My contribution was the Raspberry Pi backend architecture and connecting the computer-vision processing with FastAPI. The project also used MQTT, and my resume reports sub-200ms motion detection latency. We received two first-place awards. The part I'd like to discuss is how the device, backend, and interface worked together under hardware constraints.",
  lasso:
    "At University IT, I lead five student engineers working on LASSO, our equipment-reservation and loaner-management platform. It serves more than a thousand internal and public users. I work across the React frontend and Node, Express, and MongoDB backend. My work has included reservation scheduling, Shibboleth SSO with JWT sessions and role-based access, and GitLab CI/CD for our test and production environments. It's taught me to think beyond getting a feature working locally and take responsibility for how it behaves for real users.",
  values:
    "Own It resonates with me because of my role at University IT. I lead five student engineers working on a production application, so I need to think about coordinating work, checking changes, and supporting the system after deployment. I've worked on our reservation scheduler, authentication, and deployment workflows. To me, ownership means seeing the work through and paying attention to the people who depend on it. That's the connection I discussed with Nache at AfroTech.",
  research:
    "I research AI agent security with Professor Yanan Guo at Rochester. We look at agents that can interact with operating systems and external tools, and how to monitor potentially harmful behavior. My work uses eBPF to trace agent processes and cgroups to contain process trees. In testing, the monitor detected every attack scenario in our manually constructed set. That result is limited to those tests; it doesn't mean we detect all attacks. I'm interested in how to make useful autonomous systems easier to observe and control.",
  interests:
    "I'm especially interested in backend and infrastructure work, with opportunities to work on security, AI, or connected devices. At University IT, I enjoy owning the pieces that make an application reliable, like authentication and deployment. ShakeUR also made me interested in the boundary between software and hardware. I'd be open to different teams where I could contribute to a real system and learn from engineers with more experience.",
  afrotech:
    "I had the chance to meet Nache Shekarri at AfroTech earlier this month. We talked about Axon's body cameras and how closely hardware and software teams work together. That was particularly interesting to me because I worked on a Raspberry Pi computer-vision project at HackPrinceton. It was a useful opportunity to learn more about the engineering side of Axon and made me more interested in continuing the process.",
};
export const seedAnswers: Answer[] = Object.entries(drafts).map(
  ([id, draft]) => ({
    ...blankAnswer(id),
    draft,
    starter: true,
    createdAt: initial,
    updatedAt: initial,
  }),
);
function story(
  id: string,
  title: string,
  summary: string,
  action: string,
  result: string,
  technologies: string[],
  valueIds: string[],
): Story {
  return {
    id,
    title,
    summary,
    situation: summary,
    task: "",
    action,
    result,
    reflection: "",
    technologies,
    skills: valueIds,
    valueIds,
    sourceNotes:
      "Facts supplied in your request and resume. Complete the missing STAR fields with a specific real incident.",
    confidence: 0,
    archived: false,
    updatedAt: initial,
  };
}
export const seedStories: Story[] = [
  story(
    "lasso-story",
    "Owning LASSO",
    "Lead five student engineers maintaining a production equipment-reservation application for 1,000+ users.",
    "Work across React, Node.js, Express, and MongoDB; coordinate engineering work and support production deployments.",
    "",
    ["React", "Node.js", "MongoDB"],
    ["Own It", "Join Forces", "Be Obsessed"],
  ),
  story(
    "scheduler",
    "Rethinking reservation scheduling",
    "LASSO needs equipment availability to reflect overlapping reservations.",
    "Reworked the scheduler algorithm to evaluate date overlaps against availability.",
    "",
    ["Node.js", "MongoDB"],
    ["Own It", "Be Obsessed"],
  ),
  story(
    "cicd",
    "Building a reliable path to production",
    "LASSO has separate test and production environments.",
    "Built GitLab CI/CD workflows with self-hosted runners and tests.",
    "",
    ["GitLab CI/CD", "Linux", "Self-hosted runners"],
    ["Own It", "Aim Far"],
  ),
  story(
    "shakeur-story",
    "ShakeUR: from camera to working device",
    "Built a Raspberry Pi alarm clock at HackPrinceton Spring 2026 that requires movements to dismiss an alarm.",
    "Developed the Raspberry Pi backend architecture and integrated computer vision with FastAPI. Resume also describes MQTT communication and pipeline optimization.",
    "Sub-200ms motion detection latency reported on resume; team received two first-place awards.",
    ["Python", "Raspberry Pi", "FastAPI", "OpenCV", "MediaPipe", "MQTT"],
    ["Boldly Go", "Join Forces"],
  ),
  story(
    "research-story",
    "Observing and containing AI agents",
    "Undergraduate AI agent security research with Professor Yanan Guo.",
    "Built an eBPF runtime monitor and cgroup-based process containment.",
    "Detected 100% of manually constructed attack scenarios in testing. This is not a claim about general real-world detection.",
    ["Linux", "eBPF", "cgroups"],
    ["Win Right", "Aim Far", "Boldly Go"],
  ),
  story(
    "imkon",
    "IMKON: building for students",
    "Study-abroad platform with authenticated student profiles and AI-assisted university discovery.",
    "Built React and FastAPI components, aggregated university information, persisted profiles and chat history, and deployed frontend and backend.",
    "",
    ["React", "FastAPI", "SQLite", "MongoDB", "AWS", "Heroku"],
    ["Be Obsessed", "Boldly Go"],
  ),
];
export const meetingRecap =
  "On November 3 at AfroTech in Houston, I had a scheduled 20-minute conversation with Nache Shekarri, Axon’s VP of Hardware Engineering, during Axon Game Day in Room 350D. He welcomed me into a small booth with Body 4 and a smaller body camera on display. I mentioned the Body 5 announcement and its AI capabilities. We discussed my background, ShakeUR, and AI agent security research. I asked about team sizes and software/hardware collaboration; he said the teams interact extensively. When he asked about values, I connected Own It to leading five student engineers and supporting production software at University IT. He appeared positive, shook my hand, and said he would be happy to see me in the next stage. I felt it went well. A personal recommendation has not been confirmed.";
export function emptyEvent(
  id: string,
  title: string,
  date: string,
): InterviewEvent {
  return {
    id,
    title,
    date,
    time: "11:30",
    duration: 15,
    interviewer: "",
    notes: "",
    goals: "",
    questions: "",
    concerns: "",
    asked: "",
    answered: "",
    wentWell: "",
    improve: "",
    feedback: "",
    nextSteps: "",
    followUp: "",
    completed: false,
    questionIds: [],
    updatedAt: initial,
  };
}
export const seedEvents: InterviewEvent[] = [
  ["applied", "Applied to the AfroTech SWE opportunity", "2026-10-18", ""],
  [
    "code",
    "Resolved the attendance-code issue",
    "2026-10-19",
    "Worked with Axon recruiting on October 19–20.",
  ],
  [
    "invite",
    "Invited to Axon Game Day",
    "2026-10-21",
    "Received the 1:1 invitation and SWE Intern Interview Guide.",
  ],
  ["nache", "A conversation with Nache Shekarri", "2026-11-03", meetingRecap],
  [
    "recruiter-invite",
    "An invitation to continue",
    "2026-11-12",
    "Nicholas Cortez invited me to a recruiter call for the 2027 US SWE Internship.",
  ],
  [
    "recruiter",
    "Recruiter screen with Nicholas",
    "2026-11-18",
    "Virtual recruiter screen · 2027 US Software Engineering Internship.",
  ],
].map(([id, title, date, notes]) => ({
  ...emptyEvent(id, title, date),
  notes,
  completed: id !== "recruiter",
  interviewer:
    id === "recruiter"
      ? "Nicholas Cortez, Recruiter II"
      : id === "nache"
        ? "Nache Shekarri, VP of Hardware Engineering"
        : "",
  duration: id === "nache" ? 20 : 15,
}));
export const askNicholas = [
  "How does my AfroTech conversation with Nache fit into the broader recruiting process?",
  "Is the Engineering with AI, Coding, and ACE interview sequence still accurate?",
  "How are interns matched to engineering teams?",
  "How are Seattle and Boston preferences handled?",
  "What does Axon look for in successful SWE interns?",
  "How do software and hardware teams collaborate in practice?",
  "What is the expected timeline for the next stage?",
];
export const checklist = [
  "Review introduction",
  "Review why Axon",
  "Review ShakeUR",
  "Review LASSO leadership story",
  "Review Axon values",
  "Confirm interview link",
  "Test microphone",
  "Prepare questions",
  "Have resume open",
  "Join on time",
];
export const talkingPoints = [
  "Rochester · CS + Business · May 2028",
  "Lead Software Engineer · five student engineers",
  "LASSO · production application · 1,000+ users",
  "AI agent security · eBPF monitoring + cgroups",
  "ShakeUR · Raspberry Pi + computer vision + FastAPI",
  "Met Nache at AfroTech · hardware/software collaboration",
  "Interested in backend, infrastructure, AI, and security",
];

export const verified = "2026-11-17";
export const values = [
  {
    name: "Be Obsessed",
    meaning: "Start with the customer and solve problems that matter to them.",
    story: "lasso-story",
    connection:
      "LASSO serves 1,000+ users. Describe a real user need you addressed.",
  },
  {
    name: "Aim Far",
    meaning:
      "Think beyond the immediate task and make room for long-term progress.",
    story: "cicd",
    connection:
      "CI/CD and separate environments can support future changes. Supply a concrete decision.",
  },
  {
    name: "Win Right",
    meaning:
      "Pursue results with integrity and explain the limits of your evidence.",
    story: "research-story",
    connection:
      "Be precise that 100% detection applies only to your constructed test set.",
  },
  {
    name: "Own It",
    meaning: "Take responsibility, follow through, and deliver.",
    story: "lasso-story",
    connection:
      "Your production responsibilities and five-person team are the connection you discussed at AfroTech.",
  },
  {
    name: "Join Forces",
    meaning: "Collaborate across teams, disciplines, and perspectives.",
    story: "shakeur-story",
    connection:
      "ShakeUR brought device, vision, backend, and web work together. Explain your part.",
  },
  {
    name: "Expect Candor",
    meaning: "Give and receive honest feedback respectfully.",
    story: "",
    connection:
      "Add a real feedback example. No specific incident has been supplied.",
  },
  {
    name: "Boldly Go",
    meaning:
      "Take thoughtful risks, learn through uncertainty, and try new approaches.",
    story: "shakeur-story",
    connection:
      "Hardware/software integration at HackPrinceton provides a starting point. Add a specific risk and lesson.",
  },
];
export const companySummary =
  "Axon’s mission is Protect Life. It builds connected cameras, TASER devices, cloud software, and AI tools for public safety agencies and enterprise customers. The ecosystem connects work in the field with evidence and reporting workflows.";
export const products = [
  {
    id: "body5",
    name: "Axon Body 5",
    category: "Intelligent devices",
    summary:
      "Announced October 24, 2026. A new body-worn camera platform with more capacity for on-device AI and upgraded connectivity, video, and battery life.",
    detail:
      "Axon describes 25× the AI processing power of earlier-generation cameras. Body 5 and Body 5 Pro are distinct models; Pro adds near-focus capture, front-facing speakers, and memory. The announcement says availability dates will follow and capabilities vary by configuration.",
    connection:
      "Engineering observation: ShakeUR gives you a way to discuss edge processing, device constraints, latency, and backend communication. It is not equivalent technology or a comparable public-safety deployment.",
    source:
      "https://www.axon.com/newsroom/press-releases/axon-announces-body-5",
    users: "Officers in the field",
    challenge:
      "Balancing real-time assistance, connectivity, battery, and human oversight.",
  },
  {
    id: "draft-one",
    name: "Draft One",
    category: "Responsible AI",
    summary:
      "Generates draft report narratives from body-camera audio transcripts and officer context. Officers must review, fill gaps, and sign off before submission.",
    detail:
      "Axon describes side-by-side review with footage and transcripts, agency restrictions on use, and an event history including generation and sign-off. These controls do not eliminate the need to check accuracy.",
    connection:
      "Engineering observation: your AI security research is a useful bridge to discussing observability, bounded behavior, privacy, and accountable human review.",
    source: "https://www.axon.com/products/draft-one",
    users: "Officers preparing incident reports",
    challenge:
      "Grounding generated text in evidence and making human verification practical.",
  },
  {
    id: "body4",
    name: "Axon Body 4",
    category: "Connected hardware",
    summary:
      "A body-worn camera for evidence capture, with an optional point-of-view accessory and real-time communication through Respond+.",
    detail:
      "The public product page describes remote video upload, live location, and bidirectional communication with support teams.",
    connection:
      "Engineering observation: discuss device-to-service integration using ShakeUR as your own experience.",
    source: "https://www.axon.com/products/axon-body-4",
    users: "Officers and support teams",
    challenge: "Reliable capture and communication during a shift.",
  },
  {
    id: "evidence",
    name: "Axon Evidence",
    category: "Cloud platform",
    summary:
      "A digital evidence platform for collecting, reviewing, managing, and disclosing files across an agency.",
    detail:
      "Publicly described features include file fingerprints, audit trails, encryption, and configurable access permissions.",
    connection:
      "Engineering observation: connect access controls and file workflows to Shibboleth, JWT roles, and GridFS work in LASSO.",
    source: "https://www.axon.com/products/axon-evidence",
    users: "Investigators, officers, and agency staff",
    challenge:
      "File integrity, access control, traceability, and reliable storage.",
  },
  {
    id: "records",
    name: "Axon Records",
    category: "Backend workflows",
    summary:
      "A cloud records-management platform that brings reporting, evidence, and agency workflows together.",
    detail:
      "The product page describes integration with Axon Evidence, configurable workflows, permission-based sharing, and report/evidence case packets.",
    connection:
      "Engineering observation: your full-stack work offers a starting point for discussing data models and reliable user workflows.",
    source: "https://www.axon.com/products/axon-records",
    users: "Officers, investigators, and agencies",
    challenge: "Connecting records and evidence while controlling access.",
  },
  {
    id: "respond",
    name: "Axon Respond",
    category: "Real-time systems",
    summary:
      "Combines live location, alerts, video, and communication from connected Axon devices to support incident awareness.",
    detail:
      "Respond and Respond+ have different capabilities; the product page associates live streaming and bidirectional communication with Respond+.",
    connection:
      "Engineering observation: draw on networking projects to discuss delay, disconnection, retries, and failure visibility.",
    source: "https://www.axon.com/products/axon-respond",
    users: "Officers, supervisors, dispatchers, and support teams",
    challenge: "Delivering timely information over imperfect networks.",
  },
  {
    id: "fleet",
    name: "Axon Fleet 3",
    category: "Vehicle systems",
    summary:
      "An in-car video system with automatic license-plate recognition and connected real-time awareness features.",
    detail:
      "Axon describes interior and exterior video, live alerts and maps, and connections to its wider ecosystem.",
    connection:
      "Engineering observation: use your computer-vision and networking background to ask about performance and system boundaries.",
    source: "https://www.axon.com/products/axon-fleet-3",
    users: "Public safety vehicle teams",
    challenge: "Reliable mobile capture, vision processing, and connectivity.",
  },
  {
    id: "taser",
    name: "TASER ecosystem",
    category: "Devices + software",
    summary:
      "TASER 10 is a less-lethal energy device connected to evidence management, training, and device-administration tools.",
    detail:
      "Axon describes evidence integration for activity logs, VR training, and dock-based firmware updates and log downloads.",
    connection:
      "Engineering observation: emphasize careful testing, audit trails, and update reliability without claiming weapons-engineering experience.",
    source: "https://www.axon.com/products/taser-10",
    users: "Trained public safety personnel",
    challenge: "Accountable device records and dependable software updates.",
  },
];
export const exercises = [
  {
    title: "Equipment reservation service",
    brief:
      "Create a small API that reserves equipment for a date range and rejects conflicts.",
    edge: "Overlapping intervals, adjacent reservations, invalid dates, duplicate requests, and simultaneous bookings.",
  },
  {
    title: "Device status monitoring API",
    brief: "Accept device heartbeats and expose current online/offline status.",
    edge: "Out-of-order timestamps, timeouts, missing devices, clock skew, and duplicate heartbeats.",
  },
  {
    title: "Event ingestion service",
    brief:
      "Ingest events, validate their schema, and provide a query endpoint.",
    edge: "Idempotency keys, malformed payloads, pagination, overload, and retry behavior.",
  },
  {
    title: "A small alerting system",
    brief: "Create alerts when a metric crosses a configurable threshold.",
    edge: "Repeated alerts, recovery states, noisy measurements, missing data, and rate limits.",
  },
  {
    title: "Permission management service",
    brief:
      "Implement users, roles, and resource permissions with an explicit policy.",
    edge: "Deny by default, revoked permissions, missing resources, conflicting roles, and audit logs.",
  },
];
export const technicalChecklist = [
  "Clarify inputs, outputs, requirements, and constraints",
  "Write assumptions and explain the approach",
  "Choose data structures and describe tradeoffs",
  "Implement the core path in small steps",
  "Inspect AI-generated code before accepting it",
  "Test happy paths, edge cases, and invalid input",
  "Debug failures and record what changed",
  "Explain complexity, limitations, and next steps",
];

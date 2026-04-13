/**
 * Hushh Open Source Hiring Challenge 2026 — Static content
 * All text, links, dates, prizes, tracks, steps, and rules live here.
 * The UI imports from this file so content changes never touch layout code.
 */

/* ── Dates ── */
export const CONTRIBUTION_START = "12 April 2026";
export const CONTRIBUTION_END = "26 April 2026";

/* ── Hero ── */
export const HERO_TITLE = "Hushh Open Source Hiring Challenge";
export const HERO_YEAR = "2026";
export const HERO_SUBTITLE =
  "Build on real open-source products. Submit a real pull request. Get shortlisted for internship and full-time hiring opportunities at Hushh.";
export const HERO_DESCRIPTION =
  "This is not a hackathon. This is an open contribution window. Explore the repositories, understand the products, identify bugs, improve documentation, add meaningful features, optimize performance, and submit quality pull requests.";

/* ── Project Tracks ── */
export interface TrackLink {
  label: string;
  url: string;
}

export interface ProjectTrack {
  id: string;
  name: string;
  icon: string;
  description: string;
  idealFor: string;
  links: TrackLink[];
}

export const PROJECT_TRACKS: ProjectTrack[] = [
  {
    id: "hushh-tech",
    name: "hushhTech",
    icon: "code",
    description:
      "Frontend experience, APIs, repo hygiene, testing, performance, documentation, and developer-facing improvements.",
    idealFor:
      "Contributors interested in frontend, APIs, testing, performance, documentation, and developer experience.",
    links: [
      {
        label: "Repository",
        url: "https://github.com/hushh-labs/hushh_Tech_website",
      },
      {
        label: "README",
        url: "https://github.com/hushh-labs/hushh_Tech_website/blob/main/README.md",
      },
      {
        label: "Contributing Guide",
        url: "https://github.com/hushh-labs/hushh_Tech_website/blob/main/CONTRIBUTING.md",
      },
      {
        label: "Issues",
        url: "https://github.com/hushh-labs/hushh_Tech_website/issues",
      },
      {
        label: "Open a PR",
        url: "https://github.com/hushh-labs/hushh_Tech_website/compare",
      },
      {
        label: "Security Policy",
        url: "https://github.com/hushh-labs/hushh_Tech_website/blob/main/SECURITY.md",
      },
    ],
  },
  {
    id: "kai",
    name: "Kai",
    icon: "psychology",
    description:
      "Deeper AI-first product flow, architecture study, real issue identification, and meaningful improvements.",
    idealFor:
      "Contributors who want to explore AI-first product architecture, identify real gaps, and contribute meaningful improvements.",
    links: [
      {
        label: "Application",
        url: "https://kai.hushh.ai/",
      },
      {
        label: "Repository",
        url: "https://github.com/hushh-labs/hushh-research",
      },
    ],
  },
];

/* ── Participation Steps ── */
export interface ParticipationStep {
  step: number;
  title: string;
  description: string;
  icon: string;
}

export const PARTICIPATION_STEPS: ParticipationStep[] = [
  {
    step: 1,
    title: "Register",
    description: "Register for the opportunity on the platform.",
    icon: "person_add",
  },
  {
    step: 2,
    title: "Choose Track",
    description: "Choose one track: hushhTech or Kai.",
    icon: "route",
  },
  {
    step: 3,
    title: "Read Documentation",
    description:
      "Read the repository documentation carefully. Go through the README, contribution rules, and other public documentation.",
    icon: "menu_book",
  },
  {
    step: 4,
    title: "Identify Contribution",
    description:
      "Pick an existing issue, find a new bug, suggest and implement a useful feature, improve documentation, tests, developer experience, or optimize performance.",
    icon: "search",
  },
  {
    step: 5,
    title: "Build & Branch",
    description:
      "Create your working branch properly and make your contribution. Do not push directly to the main branch.",
    icon: "terminal",
  },
  {
    step: 6,
    title: "Test & Validate",
    description:
      "Test or validate your changes. Make sure your pull request is meaningful, clear, and reviewable.",
    icon: "verified",
  },
  {
    step: 7,
    title: "Raise Pull Request",
    description:
      "Raise a pull request in the correct repository before the deadline.",
    icon: "merge",
  },
  {
    step: 8,
    title: "Submit Entry",
    description:
      "Submit your final entry on the platform with your GitHub profile link, chosen track, repository name, issue/problem statement link, PR link, and a short write-up.",
    icon: "send",
  },
];

/* ── What We Look For ── */
export interface LookForItem {
  label: string;
  icon: string;
}

export const WHAT_WE_LOOK_FOR: LookForItem[] = [
  { label: "Understand a real codebase before coding", icon: "visibility" },
  {
    label: "Think from both product and engineering perspectives",
    icon: "lightbulb",
  },
  { label: "Identify meaningful problems worth solving", icon: "target" },
  { label: "Write clean and maintainable code", icon: "code" },
  {
    label: "Communicate clearly through pull requests",
    icon: "chat",
  },
  { label: "Show strong ownership", icon: "shield" },
];

/* ── Rules ── */
export const RULES: string[] = [
  "Read the README and contributor documentation before starting.",
  "Follow the contribution protocols of the selected repository.",
  "Do not push directly to the main branch.",
  "Create a proper topic branch.",
  "Keep your pull request focused, meaningful, and easy to review.",
  "Clearly explain what changed, why it changed, and how it was validated.",
  "Do not commit secrets, tokens, API keys, certificates, credentials, or .env files.",
  "Do not report security vulnerabilities publicly through open issues.",
  "Respect the project's Code of Conduct, Security Policy, and support workflow.",
  "AI-assisted coding is allowed, but participants must fully understand and justify their submitted work.",
  "Low-effort, copied, spammy, irrelevant, or cosmetic-only submissions may be rejected.",
];

/* ── Evaluation Criteria ── */
export interface EvaluationCriterion {
  label: string;
  icon: string;
}

export const EVALUATION_CRITERIA: EvaluationCriterion[] = [
  { label: "Relevance & Quality", icon: "star" },
  { label: "Codebase Understanding", icon: "data_object" },
  { label: "Technical Depth", icon: "layers" },
  { label: "Code Quality", icon: "code" },
  { label: "PR Clarity", icon: "description" },
  { label: "Testing & Validation", icon: "bug_report" },
  { label: "Security Awareness", icon: "lock" },
  { label: "Product Thinking", icon: "lightbulb" },
  { label: "Ownership & Execution", icon: "rocket_launch" },
];

/* ── Prizes ── */
export interface Prize {
  position: string;
  amount: string;
  highlight: boolean;
}

export const PRIZES: Prize[] = [
  { position: "1st Position", amount: "₹50,000", highlight: true },
  { position: "2nd Position", amount: "₹25,000", highlight: false },
];

/* ── Hiring Opportunities ── */
export interface HiringOpportunity {
  type: "internship" | "fulltime";
  title: string;
  stipend: string;
  perks: string[];
}

export const HIRING_OPPORTUNITIES: HiringOpportunity[] = [
  {
    type: "internship",
    title: "Internship",
    stipend: "₹30,000 – ₹40,000 / month",
    perks: [
      "Fully furnished accommodation support (Pune-based).",
      "Remote option available for candidates outside Pune.",
      "Access to Mac, Apple developer account, Prime membership, and role-based developer resources.",
    ],
  },
  {
    type: "fulltime",
    title: "Full-Time",
    stipend: "₹80,000 – ₹1,00,000 / month",
    perks: [
      "Fully furnished flat or accommodation support (Pune-based).",
      "Room, rent, food, and essential living support covered.",
      "Apple ecosystem work resources — MacBook, iPhone access, Apple developer account support, and related tools.",
    ],
  },
];

/* ── Eligibility ── */
export const ELIGIBILITY: string[] = [
  "College students",
  "Freshers",
  "Professionals",
  "Open-source contributors",
  "Frontend developers",
  "Backend developers",
  "Full-stack developers",
  "AI and product builders",
];

/* ── Contact ── */
export const CONTACT_EMAIL = "ankit@hushh.ai";
export const COMPANY_WEBSITE = "https://www.hushh.ai/";

/* ── Submission Clarity ── */
export const SUBMISSION_NOTES: string[] = [
  "Only submissions with a proper pull request link will be considered.",
  "Your pull request must be raised on or before 26 April 2026.",
  "Quality matters more than quantity. One strong PR is better than multiple weak submissions.",
  "If you raise more than one PR, evaluation will focus on overall impact, quality, and relevance.",
  "Low-effort, cosmetic-only, copied, spammy, or irrelevant submissions may be rejected.",
];

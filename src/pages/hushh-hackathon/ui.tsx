/**
 * Hushh Open Source Hiring Challenge 2026 — Page UI
 * Follows the same design system as onboarding steps 1–6:
 *   • White background, Playfair Display serif headings
 *   • HushhTechBackHeader sticky header
 *   • Material Symbols Outlined icons in circular gray containers
 *   • Pill tags, clean dividers, HushhTechCta buttons
 *   • Mobile-first, max-w-md centered layout
 */
import { useHackathonLogic, SECTION_IDS } from "./logic";
import {
  HERO_TITLE,
  HERO_YEAR,
  HERO_SUBTITLE,
  HERO_DESCRIPTION,
  CONTRIBUTION_START,
  CONTRIBUTION_END,
  PROJECT_TRACKS,
  PARTICIPATION_STEPS,
  WHAT_WE_LOOK_FOR,
  RULES,
  EVALUATION_CRITERIA,
  PRIZES,
  HIRING_OPPORTUNITIES,
  ELIGIBILITY,
  SUBMISSION_NOTES,
  CONTACT_EMAIL,
  COMPANY_WEBSITE,
} from "./content";
import HushhTechBackHeader from "../../components/hushh-tech-back-header/HushhTechBackHeader";
import HushhTechCta, {
  HushhTechCtaVariant,
} from "../../components/hushh-tech-cta/HushhTechCta";

/* ── Shared Styles ── */
const playfair = { fontFamily: "'Playfair Display', serif" };

/** Small section label — uppercase tracking */
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-[10px] tracking-[0.2em] text-gray-400 uppercase mb-4 font-medium">
    {children}
  </h3>
);

/** Section heading — Playfair Display */
const SectionHeading = ({
  children,
  id,
}: {
  children: React.ReactNode;
  id?: string;
}) => (
  <h2
    id={id}
    className="text-[1.75rem] sm:text-[2rem] leading-[1.15] font-normal text-black tracking-tight font-serif mb-6"
    style={playfair}
  >
    {children}
  </h2>
);

/** Icon in a circular gray container — matches onboarding step rows */
const CircleIcon = ({
  icon,
  size = "w-10 h-10",
}: {
  icon: string;
  size?: string;
}) => (
  <div
    className={`${size} rounded-full bg-gray-100 flex items-center justify-center shrink-0`}
  >
    <span
      className="material-symbols-outlined text-gray-700 text-lg"
      style={{ fontVariationSettings: "'wght' 400" }}
    >
      {icon}
    </span>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════ */

export default function HushhHackathonPage() {
  const { handleBack, openExternal } = useHackathonLogic();

  return (
    <div className="bg-white text-gray-900 min-h-screen antialiased flex flex-col selection:bg-hushh-blue selection:text-white">
      {/* ═══ Sticky Header ═══ */}
      <HushhTechBackHeader
        onBackClick={handleBack}
        rightType="hamburger"
      />

      <main className="px-6 flex-grow max-w-md mx-auto w-full pb-16">
        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  HERO                                                         */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section id={SECTION_IDS.hero} className="py-8">
          <SectionLabel>Open Source · Hiring · {HERO_YEAR}</SectionLabel>

          <h1
            className="text-[2.5rem] sm:text-[2.75rem] leading-[1.08] font-normal text-black tracking-tight font-serif"
            style={playfair}
          >
            {HERO_TITLE} <br />
            <span className="text-gray-400 italic font-light">{HERO_YEAR}</span>
          </h1>

          <p className="mt-6 text-sm text-gray-600 leading-relaxed font-medium">
            {HERO_SUBTITLE}
          </p>

          <p className="mt-3 text-xs text-gray-500 leading-relaxed">
            {HERO_DESCRIPTION}
          </p>
        </section>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  CONTRIBUTION WINDOW                                          */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section
          id={SECTION_IDS.window}
          className="py-6 border-t border-gray-200"
        >
          <SectionLabel>Contribution Window</SectionLabel>

          {/* Date cards */}
          <div className="space-y-3">
            {/* Open window */}
            <div className="flex items-center gap-4 py-4 border-b border-gray-100">
              <CircleIcon icon="calendar_today" />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {CONTRIBUTION_START} – {CONTRIBUTION_END}
                </p>
                <p className="text-xs text-gray-500 font-medium">
                  Open contribution window. Contribute at any time.
                </p>
              </div>
            </div>

            {/* Post window */}
            <div className="flex items-center gap-4 py-4">
              <CircleIcon icon="event_available" />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Post {CONTRIBUTION_END}
                </p>
                <p className="text-xs text-gray-500 font-medium">
                  Review, evaluation, results, prize distribution, internship
                  shortlisting, and full-time hiring consideration.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  PROJECT TRACKS                                               */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section
          id={SECTION_IDS.tracks}
          className="py-6 border-t border-gray-200"
        >
          <SectionLabel>Project Tracks</SectionLabel>
          <SectionHeading>
            Choose Your <br />
            <span className="text-gray-400 italic font-light">Track</span>
          </SectionHeading>

          <div className="space-y-4">
            {PROJECT_TRACKS.map((track) => (
              <div
                key={track.id}
                className="border border-gray-200 rounded-xl p-5"
              >
                {/* Track header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <span
                      className="material-symbols-outlined text-gray-700 text-xl"
                      style={{ fontVariationSettings: "'wght' 400" }}
                    >
                      {track.icon}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      {track.name}
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed font-medium mt-0.5">
                      {track.description}
                    </p>
                  </div>
                </div>

                {/* Ideal for */}
                <p className="text-[11px] text-gray-400 mb-3 font-medium">
                  Ideal for: {track.idealFor}
                </p>

                {/* Link pills */}
                <div className="flex flex-wrap gap-2">
                  {track.links.map((link) => (
                    <button
                      key={link.label}
                      onClick={() => openExternal(link.url)}
                      className="px-3 py-1.5 text-[11px] font-medium border border-gray-200 rounded-full text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                      aria-label={`Open ${link.label}`}
                      tabIndex={0}
                    >
                      {link.label}
                      <span className="material-symbols-outlined text-[11px] ml-1 align-middle">
                        open_in_new
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  HOW TO PARTICIPATE — Steps 1-8                               */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section
          id={SECTION_IDS.steps}
          className="py-6 border-t border-gray-200"
        >
          <SectionLabel>How To Participate</SectionLabel>
          <SectionHeading>
            Step by Step <br />
            <span className="text-gray-400 italic font-light">Guide</span>
          </SectionHeading>

          <div className="space-y-1">
            {PARTICIPATION_STEPS.map((ps) => (
              <div
                key={ps.step}
                className="flex items-start gap-4 py-4 border-b border-gray-100 last:border-b-0"
              >
                {/* Step number in circle */}
                <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center shrink-0 text-sm font-bold">
                  {ps.step}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {ps.title}
                    </h3>
                    <span
                      className="material-symbols-outlined text-gray-400 text-base"
                      style={{ fontVariationSettings: "'wght' 300" }}
                    >
                      {ps.icon}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed font-medium">
                    {ps.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  SUBMISSION NOTES                                             */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section className="py-6 border-t border-gray-200">
          <SectionLabel>Important Notes</SectionLabel>

          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            {SUBMISSION_NOTES.map((note, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="material-symbols-outlined text-hushh-blue text-sm mt-0.5 shrink-0">
                  info
                </span>
                <p className="text-xs text-gray-600 leading-relaxed font-medium">
                  {note}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  WHAT WE LOOK FOR                                            */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section
          id={SECTION_IDS.lookFor}
          className="py-6 border-t border-gray-200"
        >
          <SectionLabel>What We Look For</SectionLabel>
          <SectionHeading>
            Strong <br />
            <span className="text-gray-400 italic font-light">Builders</span>
          </SectionHeading>

          <div className="space-y-1">
            {WHAT_WE_LOOK_FOR.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-4 py-4 border-b border-gray-100 last:border-b-0"
              >
                <CircleIcon icon={item.icon} />
                <p className="text-sm font-medium text-gray-800">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  RULES & GUIDELINES                                          */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section
          id={SECTION_IDS.rules}
          className="py-6 border-t border-gray-200"
        >
          <SectionLabel>Rules & Guidelines</SectionLabel>
          <SectionHeading>
            Contribution <br />
            <span className="text-gray-400 italic font-light">Protocol</span>
          </SectionHeading>

          <div className="space-y-3">
            {RULES.map((rule, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="material-symbols-outlined text-green-600 text-sm mt-0.5 shrink-0">
                  check_circle
                </span>
                <p className="text-xs text-gray-600 leading-relaxed font-medium">
                  {rule}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  EVALUATION CRITERIA                                         */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section
          id={SECTION_IDS.evaluation}
          className="py-6 border-t border-gray-200"
        >
          <SectionLabel>Evaluation</SectionLabel>
          <SectionHeading>
            How We <br />
            <span className="text-gray-400 italic font-light">Evaluate</span>
          </SectionHeading>

          <div className="flex flex-wrap gap-2">
            {EVALUATION_CRITERIA.map((criterion) => (
              <span
                key={criterion.label}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border border-gray-200 rounded-full text-gray-700 bg-white"
              >
                <span
                  className="material-symbols-outlined text-sm text-gray-500"
                  style={{ fontVariationSettings: "'wght' 300" }}
                >
                  {criterion.icon}
                </span>
                {criterion.label}
              </span>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  PRIZES                                                       */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section
          id={SECTION_IDS.prizes}
          className="py-6 border-t border-gray-200"
        >
          <SectionLabel>Prizes & Recognition</SectionLabel>
          <SectionHeading>
            Win Big, <br />
            <span className="text-gray-400 italic font-light">
              Build Bigger
            </span>
          </SectionHeading>

          <div className="space-y-3">
            {PRIZES.map((prize) => (
              <div
                key={prize.position}
                className={`flex items-center justify-between py-5 px-5 rounded-xl border ${
                  prize.highlight
                    ? "border-black bg-black text-white"
                    : "border-gray-200 bg-white text-gray-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`material-symbols-outlined text-xl ${
                      prize.highlight ? "text-yellow-400" : "text-gray-400"
                    }`}
                  >
                    emoji_events
                  </span>
                  <span className="text-sm font-semibold">{prize.position}</span>
                </div>
                <span
                  className="text-lg font-bold font-mono"
                  style={playfair}
                >
                  {prize.amount}
                </span>
              </div>
            ))}
          </div>

          {/* Extra recognition note */}
          <div className="mt-4 flex items-start gap-3 py-3">
            <span className="material-symbols-outlined text-hushh-blue text-sm mt-0.5 shrink-0">
              redeem
            </span>
            <p className="text-xs text-gray-500 leading-relaxed font-medium">
              Standout contributors may also receive Hushh goodies and
              recognition. Top performers may be shortlisted directly for
              internship and full-time opportunities.
            </p>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  HIRING OPPORTUNITIES                                        */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section
          id={SECTION_IDS.hiring}
          className="py-6 border-t border-gray-200"
        >
          <SectionLabel>Career Opportunities</SectionLabel>
          <SectionHeading>
            From PR to <br />
            <span className="text-gray-400 italic font-light">Career</span>
          </SectionHeading>

          <div className="space-y-4">
            {HIRING_OPPORTUNITIES.map((opp) => (
              <div
                key={opp.type}
                className="border border-gray-200 rounded-xl p-5"
              >
                {/* Header row */}
                <div className="flex items-center gap-4 mb-4">
                  <CircleIcon
                    icon={opp.type === "internship" ? "school" : "work"}
                    size="w-12 h-12"
                  />
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      {opp.title}
                    </h3>
                    <p className="text-sm text-hushh-blue font-bold mt-0.5">
                      {opp.stipend}
                    </p>
                  </div>
                </div>

                {/* Perks */}
                <div className="space-y-2.5 pl-1">
                  {opp.perks.map((perk, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-gray-400 text-sm mt-0.5 shrink-0">
                        check
                      </span>
                      <p className="text-xs text-gray-600 leading-relaxed font-medium">
                        {perk}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  ELIGIBILITY                                                  */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section
          id={SECTION_IDS.eligibility}
          className="py-6 border-t border-gray-200"
        >
          <SectionLabel>Who Can Participate</SectionLabel>
          <SectionHeading>
            Open To <br />
            <span className="text-gray-400 italic font-light">Everyone</span>
          </SectionHeading>

          <div className="flex flex-wrap gap-2">
            {ELIGIBILITY.map((role) => (
              <span
                key={role}
                className="px-4 py-2.5 text-xs font-medium border border-gray-200 rounded-full text-gray-700 bg-white"
              >
                {role}
              </span>
            ))}
          </div>

          {/* Format badges */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center gap-3 py-3 border-b border-gray-100">
              <CircleIcon icon="language" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Online</p>
                <p className="text-xs text-gray-500 font-medium">
                  Participate from anywhere
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 py-3 border-b border-gray-100">
              <CircleIcon icon="group" />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Individual or Team
                </p>
                <p className="text-xs text-gray-500 font-medium">
                  1 to 2 members per team
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 py-3">
              <CircleIcon icon="description" />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  GitHub PR + Write-up
                </p>
                <p className="text-xs text-gray-500 font-medium">
                  Submission format
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  CONTACT                                                      */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section
          id={SECTION_IDS.contact}
          className="py-6 border-t border-gray-200"
        >
          <SectionLabel>Contact</SectionLabel>

          <div className="flex items-center gap-4 py-4 border-b border-gray-100">
            <CircleIcon icon="mail" />
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {CONTACT_EMAIL}
              </p>
              <p className="text-xs text-gray-500 font-medium">
                For queries and contribution-related questions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 py-4">
            <CircleIcon icon="public" />
            <div>
              <p className="text-sm font-semibold text-gray-900">hushh.ai</p>
              <p className="text-xs text-gray-500 font-medium">
                Company website
              </p>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  CTAs                                                         */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section className="py-8 space-y-3">
          <HushhTechCta
            variant={HushhTechCtaVariant.BLACK}
            onClick={() =>
              openExternal(
                "https://github.com/hushh-labs/hushh_Tech_website/issues"
              )
            }
          >
            Start Contributing
            <span className="material-symbols-outlined text-base">
              arrow_forward
            </span>
          </HushhTechCta>

          <HushhTechCta
            variant={HushhTechCtaVariant.WHITE}
            onClick={() => openExternal(COMPANY_WEBSITE)}
          >
            Visit hushh.ai
          </HushhTechCta>
        </section>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  TRUST BADGES                                                 */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section className="flex flex-col items-center justify-center text-center gap-2 pb-8">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px] text-hushh-blue">
                lock
              </span>
              <span className="text-[10px] text-gray-500 tracking-wide uppercase font-medium">
                Authentication Required
              </span>
            </div>
            <span className="text-gray-300">·</span>
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px] text-hushh-blue">
                verified
              </span>
              <span className="text-[10px] text-gray-500 tracking-wide uppercase font-medium">
                Official Hushh Challenge
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

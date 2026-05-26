import { useMemo } from "react";
import { Sparkles, Star } from "lucide-react";
import { Card } from "../ui/Card";
import { TextSkeleton } from "../ui/Skeleton";
import { StateMessage } from "../ui/StateMessage";

function countLabel(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function formatGeneratedAt(value) {
  if (!value) return "Generated just now";
  const minutes = Math.floor(Math.max(Date.now() - value, 0) / 60000);
  if (minutes < 1) return "Generated just now";
  return minutes === 1 ? "Generated 1 min ago" : `Generated ${minutes} mins ago`;
}

function parseSummaryLines(summary = "") {
  return summary
    .replace(/Today's Inbox Summary/gi, "Today's Inbox Summary\n")
    .replace(/\*/g, "\n")
    .split(/\n+|(?=\s-\s\d+)/)
    .map((line) => line.replace(/^\s*[-•]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 4);
}

function hasCategory(categoryCounts = {}, names = []) {
  return names.some((name) => (categoryCounts[name] || 0) > 0);
}

function buildNarrativeSummary({ total, important, urgent, threats, summary, categoryCounts = {} }) {
  const parsed = parseSummaryLines(summary).filter((line) => !/today'?s inbox summary/i.test(line));
  const recruitment = hasCategory(categoryCounts, ["recruitment", "placement", "job"]);
  const security = hasCategory(categoryCounts, ["security"]) || threats > 0;
  const finance = hasCategory(categoryCounts, ["finance", "payment", "bill"]);
  const education = hasCategory(categoryCounts, ["education", "college"]);
  const work = hasCategory(categoryCounts, ["work", "project"]);
  const schedule = hasCategory(categoryCounts, ["meeting", "calendar", "deadline", "reminder"]);
  const activity = [
    recruitment ? "recruitment activity" : null,
    security ? "security-related activity" : null,
    finance ? "payment or billing activity" : null,
    schedule ? "schedule and reminder activity" : null,
    work ? "work-related activity" : null,
    education ? "education-related activity" : null,
  ].filter(Boolean);

  if (activity.length) {
    const activityText = activity.length === 1 ? activity[0] : `${activity.slice(0, -1).join(", ")} and ${activity.at(-1)}`;
    const attention = urgent
      ? `${countLabel(urgent, "urgent conversation")} may need immediate attention.`
      : important
        ? `${countLabel(important, "priority signal")} may need review.`
        : "No urgent action pattern was detected.";
    const securityText = threats
      ? `${countLabel(threats, "security concern")} should be verified.`
      : "No critical spam escalation was found in today's inbox activity.";

    return `InboxIQ analyzed ${countLabel(total, "email")} today and detected ${activityText}. ${attention} ${securityText}`;
  }

  if (parsed.length) {
    return `InboxIQ analyzed today's inbox and found ${parsed.join(", ").toLowerCase()}.`;
  }

  return total
    ? `InboxIQ analyzed ${countLabel(total, "email")} today. ${important ? `${countLabel(important, "priority signal")} may need review.` : "No urgent action pattern was detected."} ${threats ? `${countLabel(threats, "security concern")} should be verified.` : "No critical spam escalation was found in today's inbox activity."}`
    : "InboxIQ is ready to summarize your inbox after the next sync.";
}

function buildBriefingSections({ categoryCounts = {}, important, urgent, threats, total }) {
  const recruitment = categoryCounts.recruitment || 0;
  const finance = categoryCounts.finance || 0;
  const security = categoryCounts.security || 0;
  const education = categoryCounts.education || 0;
  const promotions = categoryCounts.promotions || 0;
  const work = categoryCounts.work || categoryCounts.project || categoryCounts.projects || 0;
  const personal = categoryCounts.personal || 0;
  const subscriptions = categoryCounts.subscriptions || 0;
  const deadline = categoryCounts.deadline || categoryCounts.reminder || 0;
  const schedule = categoryCounts.meeting || categoryCounts.calendar || 0;
  const activeAreas = [
    recruitment ? "recruitment" : null,
    finance ? "payments" : null,
    threats || security ? "security" : null,
    work ? "work" : null,
    education ? "education" : null,
    personal ? "personal mail" : null,
    subscriptions ? "subscriptions" : null,
    deadline || schedule ? "reminders" : null,
    promotions ? "low-priority filtering" : null,
  ].filter(Boolean);

  const sections = [
    {
      title: "1. Priority Needs",
      items: [
        urgent ? `${countLabel(urgent, "urgent conversation")} need immediate review` : null,
        important ? `${countLabel(important, "important email")} ranked high priority` : null,
        recruitment ? `${countLabel(recruitment, "placement/job email")} detected` : null,
        finance ? `${countLabel(finance, "payment/bill email")} should be checked` : null,
      ],
    },
    {
      title: "2. Inbox Activity",
      items: [
        total ? `${countLabel(total, "email")} included in this briefing` : null,
        personal ? `${countLabel(personal, "personal email")} grouped for normal review` : null,
        subscriptions ? `${countLabel(subscriptions, "subscription email")} grouped for later review` : null,
        promotions ? `${countLabel(promotions, "promotion email")} filtered as lower priority` : null,
      ],
    },
    {
      title: "3. Schedule & Reminder Needs",
      items: [
        schedule ? `${countLabel(schedule, "meeting reminder")} detected` : null,
        deadline ? `${countLabel(deadline, "deadline/reminder email")} needs follow-up` : null,
        recruitment ? "Interview-related schedule may need confirmation" : null,
      ],
    },
    {
      title: "4. Security Needs",
      items: [
        threats ? `${countLabel(threats, "threat or suspicious email")} detected` : null,
        security ? `${countLabel(security, "security email")} present in today's inbox` : null,
      ],
    },
    {
      title: "5. Productivity Needs",
      items: [
        work ? `${countLabel(work, "project/work email")} should be reviewed` : null,
        education ? `${countLabel(education, "education/college email")} may need action` : null,
      ],
    },
    {
      title: "6. Low Priority Summary",
      items: [
        promotions ? `${countLabel(promotions, "promotion email")} safely grouped as low priority` : null,
      ],
    },
    {
      title: "7. AI Interpretation",
      items: activeAreas.length
        ? [`InboxIQ detected activity across ${activeAreas.join(", ")} and generated a focused briefing from those needs.`]
        : total
          ? ["InboxIQ generated a general briefing from your synced inbox activity."]
          : [],
    },
  ].map((section) => ({ ...section, items: section.items.filter(Boolean).slice(0, 4) }));

  return sections
    .filter((section) => section.items.length)
    .map((section, index) => ({
      ...section,
      title: section.title.replace(/^\d+\.\s*/, `${index + 1}. `),
    }));
}

export function InboxSummaryCard({
  total = 0,
  important = 0,
  urgent = 0,
  threats = 0,
  summary = "",
  categoryCounts = {},
  loading = false,
  error = "",
  generatedAt = Date.now(),
  briefingOpen = false,
  briefingData,
}) {
  const narrativeSummary = useMemo(
    () => buildNarrativeSummary({ total, important, urgent, threats, summary, categoryCounts }),
    [total, important, urgent, threats, summary, categoryCounts],
  );
  const sections = useMemo(
    () => briefingData || buildBriefingSections({ categoryCounts, important, urgent, threats, total }),
    [briefingData, categoryCounts, important, urgent, threats, total],
  );

  return (
    <Card className="theme-fast-surface relative overflow-hidden rounded-2xl border border-indigo-200/80 bg-white p-0 shadow-soft transition-transform duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-xl dark:border-[#2351d9]/70 dark:bg-[#070b32] dark:shadow-lg dark:shadow-indigo-950/25">
      <div className="relative min-h-[172px] overflow-hidden p-5 sm:px-7 sm:py-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_84%_42%,rgba(99,102,241,0.18),transparent_28%),linear-gradient(90deg,rgba(255,255,255,0.99)_0%,rgba(248,250,252,0.98)_56%,rgba(238,242,255,0.96)_100%)] dark:bg-[radial-gradient(circle_at_84%_42%,rgba(37,99,235,0.42),transparent_25%),linear-gradient(90deg,rgba(10,12,50,0.99)_0%,rgba(8,12,48,0.97)_55%,rgba(10,17,72,0.94)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(99,102,241,0.06),transparent_30%,transparent_70%,rgba(139,92,246,0.1))] dark:bg-[linear-gradient(105deg,rgba(255,255,255,0.05),transparent_30%,transparent_70%,rgba(92,122,255,0.12))]" />
        <div className="relative z-10">
        <div className="flex flex-wrap items-start justify-between gap-3 pr-0 md:pr-[19rem]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-primary-light ring-1 ring-indigo-100 dark:bg-sky-500/15 dark:text-primary-dark dark:ring-sky-400/20">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800 dark:text-white">AI Inbox Summary</h2>
              <p className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-white/55">{briefingOpen ? "Briefing expanded" : formatGeneratedAt(generatedAt)}</p>
            </div>
          </div>
        </div>

        {error ? (
          <StateMessage type="error" title="Summary unavailable" description={error} className="mt-5 max-w-md text-left" />
        ) : loading ? (
          <TextSkeleton lines={3} className="mt-5 max-w-lg" />
        ) : (
            <div className="mt-5 max-w-2xl pr-0 md:pr-[19rem]">
              <p className="text-sm font-extrabold text-slate-800 dark:text-white">Today's Inbox Summary</p>
              <p className="mt-2 text-sm font-semibold leading-7 text-slate-700 dark:text-white/90">{narrativeSummary}</p>
            </div>
        )}
        </div>

      <div className="pointer-events-none absolute right-5 top-7 hidden h-[122px] w-[295px] md:block">
        <div className="absolute left-2 top-[54px] h-2.5 w-2.5 rounded-full bg-indigo-400/70 shadow-[0_0_13px_rgba(99,102,241,0.8)] dark:bg-[#4c5dff]/80 dark:shadow-[0_0_13px_#4c5dff]" />
        <div className="absolute left-24 top-2 h-2 w-2 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.8)] dark:bg-[#3858ff] dark:shadow-[0_0_10px_#3858ff]" />
        <div className="absolute right-[72px] top-0 h-2 w-2 rounded-full bg-primary-light shadow-[0_0_9px_rgba(99,102,241,0.75)] dark:bg-[#2e64ff] dark:shadow-[0_0_9px_#2e64ff]" />
        <div className="absolute right-3 top-5 h-6 w-6 rounded-full bg-gradient-to-br from-indigo-400 to-violet-600 opacity-80 dark:from-[#2d62ff] dark:to-[#1626bb] dark:opacity-90" />
        <div className="absolute right-16 top-1/2 h-[86px] w-[86px] -translate-y-1/2 rounded-full border border-indigo-300/70 dark:border-[#244cf0]/65" />
        <div className="absolute right-[66px] top-1/2 flex h-[62px] w-[62px] -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br from-primary-light to-violet-700 shadow-[0_0_24px_rgba(99,102,241,0.38)] dark:from-[#155cff] dark:to-[#07147a] dark:shadow-[0_0_24px_rgba(37,99,235,0.72)]">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500 text-white shadow-[inset_0_0_13px_rgba(255,255,255,0.24)] dark:bg-[#2385ff]">
            <Star size={18} fill="currentColor" strokeWidth={2.4} />
          </div>
        </div>
        <div className="absolute left-[88px] top-5 h-[58px] w-[76px] rotate-[10deg] rounded-[7px] bg-gradient-to-br from-indigo-500 to-violet-500 opacity-70 shadow-[0_14px_32px_rgba(99,102,241,0.24)] dark:from-[#3322bd] dark:to-[#7d49ff] dark:opacity-80 dark:shadow-[0_14px_32px_rgba(50,37,214,0.35)]" />
        <div className="absolute left-[108px] top-[18px] h-[64px] w-[82px] rotate-[2deg] rounded-[7px] bg-gradient-to-br from-indigo-500 via-violet-500 to-secondary shadow-[0_18px_38px_rgba(99,102,241,0.32)] dark:from-[#4f39ff] dark:via-[#7d56ff] dark:to-[#4f2adf] dark:shadow-[0_18px_38px_rgba(72,55,226,0.5)]">
          <div className="absolute inset-x-0 top-0 h-1/2 rounded-t-[7px] bg-gradient-to-br from-white/50 to-white/5 [clip-path:polygon(0_0,100%_0,50%_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-1/2 rounded-b-[7px] bg-gradient-to-br from-violet-500 to-indigo-700 [clip-path:polygon(0_100%,50%_0,100%_100%)] dark:from-[#6e44ff] dark:to-[#3c1db7]" />
          <div className="absolute left-0 top-0 h-full w-1/2 rounded-l-[7px] bg-white/10 [clip-path:polygon(0_0,100%_50%,0_100%)]" />
          <div className="absolute right-0 top-0 h-full w-1/2 rounded-r-[7px] bg-black/10 [clip-path:polygon(100%_0,0_50%,100%_100%)]" />
        </div>
        <div className="absolute left-[46px] top-[24px] h-[34px] w-[48px] rotate-[-8deg] rounded-[5px] bg-gradient-to-br from-indigo-400/60 to-indigo-700/70 dark:from-[#3b5dff]/70 dark:to-[#151f9f]/80">
          <div className="absolute inset-x-2 top-2 h-1 rounded-full bg-white/20" />
          <div className="absolute inset-x-2 top-4 h-1 rounded-full bg-white/14" />
        </div>
        <div className="absolute right-0 top-[52px] h-[22px] w-[58px] -rotate-[23deg] rounded-r-full bg-gradient-to-r from-indigo-500 to-primary-light dark:from-[#2345ff] dark:to-[#1a67ff]" />
        <div className="absolute right-[34px] top-[43px] h-[24px] w-[24px] -rotate-[23deg] bg-indigo-500 [clip-path:polygon(0_50%,100%_0,100%_100%)] dark:bg-[#2b47ff]" />
        <div className="absolute right-[24px] top-[80px] h-4 w-4 rounded-full bg-indigo-500 dark:bg-[#2b67ff]" />
        <div className="absolute left-8 top-[76px] h-2 w-16 rounded-full bg-indigo-200 dark:bg-[#111965]" />
        <div className="absolute left-10 top-[68px] h-3 w-8 -rotate-[24deg] bg-indigo-500 [clip-path:polygon(0_100%,100%_0,100%_100%)] dark:bg-[#2142ff]" />
        <div className="absolute left-[62px] top-[56px] h-5 w-5 rounded-full bg-indigo-500 dark:bg-[#152fb8]" />
        <div className="absolute left-[66px] top-[49px] h-2 w-2 rounded-full bg-indigo-400 dark:bg-[#2556ff]" />
        <div className="absolute left-[14px] top-[48px] h-[1px] w-[76px] rotate-[-24deg] bg-indigo-400/45 dark:bg-[#2451ff]/50" />
      </div>
      </div>

            {!error && !loading && (
            <div className={`grid transition-all duration-300 ease-in-out ${briefingOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
              <div className="overflow-hidden">
                <div className="grid gap-3 border-t border-slate-200/80 bg-white px-5 py-5 sm:px-7 dark:border-white/10 dark:bg-[#070b32] lg:grid-cols-2">
                  {sections.map((section) => (
                    <section key={section.title} className="rounded-2xl border border-slate-200 bg-white/65 p-4 dark:border-white/10 dark:bg-white/5">
                      <h3 className="text-sm font-bold text-slate-950 dark:text-white">{section.title}</h3>
                      <div className="mt-3 space-y-2">
                        {section.items.map((item) => (
                          <p key={item} className="flex gap-2 text-sm font-medium leading-6 text-slate-600 dark:text-white/85">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-light dark:bg-[#4da3ff]" />
                            <span>{item}</span>
                          </p>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </div>
            </div>
            )}
    </Card>
  );
}

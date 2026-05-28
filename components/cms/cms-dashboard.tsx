"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Bell,
  Calendar,
  CheckCircle2,
  ExternalLink,
  FileText,
  LayoutGrid,
  Megaphone,
  Newspaper,
  PlusCircle,
  Users,
  Wallet,
} from "lucide-react";
import { CmsDashboardTabs, type DashboardModuleSection } from "@/components/cms/cms-dashboard-tabs";
import { CmsCard } from "@/components/cms/cms-ui";
import { CmsMetricCard, CmsSectionHeading, CmsWelcomeBanner } from "@/components/cms/cms-page-chrome";
import type { CmsDashboardStats } from "@/lib/cms-dashboard-stats";
import type { CmsNotificationCounts } from "@/lib/cms-notifications";
function buildSections(counts: CmsNotificationCounts): DashboardModuleSection[] {
  return [
    {
      id: "homepage",
      tabLabel: "Homepage",
      title: "Homepage",
      description: "Update what visitors see when they first arrive on the site.",
      items: [
        { href: "/cms/hero", title: "Hero banner", desc: "Images and headlines on the home page.", icon: "ImageIcon" },
        { href: "/cms/homepage-explore", title: "Mission section", desc: "Story and imagery below the banner.", icon: "House" },
        { href: "/cms/join", title: "Join section", desc: "Membership invitation on the homepage.", icon: "Users" },
        { href: "/cms/partnerships", title: "Partners", desc: "Partner logos and links.", icon: "Handshake" },
        { href: "/cms/testimonials", title: "Testimonials", desc: "Member voices carousel content.", icon: "MessageCircle" },
        { href: "/cms/site-footer", title: "Footer", desc: "Links and contact details at the bottom of every page.", icon: "PanelBottom" },
      ],
    },
    {
      id: "content",
      tabLabel: "Content",
      title: "Site content",
      description: "News, events, and information pages.",
      items: [
        { href: "/cms/about", title: "About", desc: "Who we are and what we do.", icon: "FileText" },
        { href: "/cms/executives", title: "Executives", desc: "Officers and leadership profiles.", icon: "Users" },
        { href: "/cms/news", title: "News", desc: "Announcements and articles.", icon: "Newspaper" },
        { href: "/cms/resources", title: "Resources", desc: "Videos, documents, and useful links.", icon: "FolderOpen" },
        { href: "/cms/publications", title: "Publications", desc: "Journals and society publications.", icon: "BookOpen" },
        { href: "/cms/events", title: "Events", desc: "Conferences, workshops, and meetings.", icon: "Calendar" },
        { href: "/cms/contact", title: "Contact page", desc: "How the public can reach the society.", icon: "MessageCircle" },
      ],
    },
    {
      id: "operations",
      tabLabel: "Members & inbox",
      title: "Members & messages",
      description: "Applications, member records, and incoming enquiries.",
      items: [
        {
          href: "/cms/contact-inquiries",
          title: "Contact messages",
          desc: "Questions sent through the website.",
          icon: "Inbox",
          badge: counts.unreadContactInquiries,
        },
        {
          href: "/cms/membership",
          title: "Membership",
          desc: "Approve new members and view payments.",
          icon: "Wallet",
          badge: counts.pendingMembershipPayments,
        },
        {
          href: "/cms/member-portal",
          title: "Member area",
          desc: "Content shown to signed-in members.",
          icon: "Users",
        },
        {
          href: "/cms/registration-inbox",
          title: "Event sign-ups",
          desc: "Registrations from event pages.",
          icon: "ClipboardList",
          badge: counts.unreadRegistrations,
        },
        {
          href: "/cms/testimonial-inbox",
          title: "Testimonials inbox",
          desc: "Reviews submitted from the public site.",
          icon: "MessageCircle",
          badge: counts.unreadTestimonialSubmissions,
        },
        {
          href: "/cms/analytics",
          title: "Analytics",
          desc: "Visitors and registered members by year.",
          icon: "BarChart3",
        },
        {
          href: "/cms/settings",
          title: "Settings",
          desc: "Exports, clean-up, and membership options.",
          icon: "Settings",
        },
      ],
    },
  ];
}

function formatDashboardDate(d: Date) {
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function greetingFor(d: Date) {
  const h = d.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function ActionCard({
  href,
  label,
  count,
  description,
  cta,
}: {
  href: string;
  label: string;
  count: number;
  description: string;
  cta: string;
}) {
  return (
    <Link href={href} className="group block h-full">
      <CmsCard className="h-full border-amber-100/80 bg-gradient-to-br from-amber-50/30 to-white transition-all group-hover:border-gcs-primary/25 group-hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-medium text-gcs-muted-text">{label}</p>
          <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-gcs-primary px-2 text-xs font-semibold text-white">
            {count > 99 ? "99+" : count}
          </span>
        </div>
        <p className="mt-3 text-2xl font-semibold text-gcs-foreground">{count}</p>
        <p className="mt-2 text-sm leading-relaxed text-gcs-muted-text">{description}</p>
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-gcs-primary">
          {cta}
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </CmsCard>
    </Link>
  );
}

function QuickAction({
  href,
  title,
  description,
  icon: Icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: typeof Megaphone;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:border-gcs-primary/20 hover:shadow-md"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gcs-primary/10 text-gcs-primary">
        <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="flex items-center gap-1 text-sm font-semibold text-gcs-foreground">
          {title}
          <ArrowUpRight className="h-3.5 w-3.5 text-gcs-muted-text opacity-0 transition group-hover:opacity-100" />
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-gcs-muted-text">{description}</p>
      </div>
    </Link>
  );
}

export type CmsDashboardProps = {
  counts: CmsNotificationCounts;
  stats: CmsDashboardStats;
  degraded: boolean;
};

export function CmsDashboard({ counts, stats, degraded }: CmsDashboardProps) {
  const sections = buildSections(counts);
  const greeting = greetingFor(new Date());
  const today = formatDashboardDate(new Date());

  const actionItems = [
    counts.unreadContactInquiries > 0
      ? {
          href: "/cms/contact-inquiries",
          label: "Contact messages",
          count: counts.unreadContactInquiries,
          description: "New messages waiting for a reply.",
          cta: "View messages",
        }
      : null,
    counts.pendingMembershipPayments > 0
      ? {
          href: "/cms/membership",
          label: "Membership",
          count: counts.pendingMembershipPayments,
          description: "Applications ready for your review.",
          cta: "Review now",
        }
      : null,
    counts.unreadRegistrations > 0
      ? {
          href: "/cms/registration-inbox",
          label: "Event sign-ups",
          count: counts.unreadRegistrations,
          description: "Recent event registrations to check.",
          cta: "View sign-ups",
        }
      : null,
    counts.unreadTestimonialSubmissions > 0
      ? {
          href: "/cms/testimonial-inbox",
          label: "Testimonials",
          count: counts.unreadTestimonialSubmissions,
          description: "New reviews submitted from the public site.",
          cta: "Review now",
        }
      : null,
  ].filter(Boolean);

  return (
    <div className="space-y-8">
      <CmsWelcomeBanner greeting={`${greeting}`} dateLabel={today}>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gcs-muted-text">
          Manage the Ghana Chemical Society website, member applications, and society updates from one place.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-gcs-foreground shadow-sm transition hover:border-gcs-primary/30"
          >
            View live site
            <ExternalLink className="h-3.5 w-3.5 text-gcs-muted-text" aria-hidden />
          </Link>
          <Link
            href="/cms/member-announcements"
            className="inline-flex items-center gap-2 rounded-full bg-gcs-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-gcs-primary-hover"
          >
            <Megaphone className="h-3.5 w-3.5" aria-hidden />
            New member bulletin
          </Link>
        </div>
      </CmsWelcomeBanner>

      {degraded ? (
        <p className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
          Some figures are temporarily unavailable. You can continue working — try refreshing shortly.
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <CmsMetricCard
          label="Needs your attention"
          value={String(counts.totalUnread)}
          hint="Across all inboxes"
          icon={Bell}
          variant={counts.totalUnread > 0 ? "warning" : "neutral"}
        />
        <CmsMetricCard
          label="Active members"
          value={String(stats.activeMembers)}
          hint={`${stats.approvedMembers} total members`}
          icon={Users}
          variant="success"
        />
        <CmsMetricCard label="News articles" value={String(stats.publishedNews)} icon={Newspaper} />
        <CmsMetricCard label="Upcoming events" value={String(stats.publishedEvents)} icon={Calendar} />
      </div>

      <section>
        <CmsSectionHeading
          title="Shortcuts"
          description="Common tasks"
          icon={LayoutGrid}
        />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <li>
            <QuickAction
              href="/cms/member-announcements"
              title="Member bulletin"
              description="Send an update to all members."
              icon={Megaphone}
            />
          </li>
          <li>
            <QuickAction href="/cms/news" title="Add news" description="Publish a new article." icon={PlusCircle} />
          </li>
          <li>
            <QuickAction href="/cms/events" title="Add event" description="List a new event." icon={FileText} />
          </li>
          <li>
            <QuickAction
              href="/cms/membership"
              title="Membership"
              description="Approve applications."
              icon={Wallet}
            />
          </li>
        </ul>
      </section>

      <section>
        <CmsSectionHeading
          title="Priority items"
          description={counts.totalUnread > 0 ? "Review these when you can" : "Nothing urgent right now"}
          icon={Bell}
        />
        {actionItems.length > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {actionItems.map((item) =>
              item ? (
                <li key={item.href}>
                  <ActionCard {...item} />
                </li>
              ) : null
            )}
          </ul>
        ) : (
          <CmsCard className="flex items-center gap-4 border-dashed border-emerald-200/80 bg-emerald-50/30 py-8">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="font-medium text-gcs-foreground">All caught up</p>
              <p className="mt-0.5 text-sm text-gcs-muted-text">No pending messages or applications at the moment.</p>
            </div>
          </CmsCard>
        )}
      </section>

      <CmsDashboardTabs sections={sections} />
    </div>
  );
}

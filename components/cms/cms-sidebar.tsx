"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  LayoutDashboard,
  ImageIcon,
  FileText,
  Users,
  Newspaper,
  BookOpen,
  FolderOpen,
  Calendar,
  ClipboardList,
  MessageCircle,
  Inbox,
  Wallet,
  House,
  Handshake,
  PanelBottom,
  UserCircle,
  Megaphone,
  Quote,
  Menu,
  Settings,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import { CmsLogoutButton } from "@/components/cms/cms-logout";
import { CmsNavBadge, useCmsNotificationCounts } from "@/components/cms/cms-nav-badges";
import { cn } from "@/lib/utils";

const SIDEBAR_COLLAPSED_KEY = "gcs-cms-sidebar-collapsed";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: "contact" | "registrations" | "testimonials" | "membership" | "total";
};

type NavGroup = {
  id: string;
  label: string;
  description?: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    id: "overview",
    label: "Overview",
    items: [
      { href: "/cms", label: "Overview", icon: LayoutDashboard, badge: "total" },
      { href: "/cms/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    id: "site",
    label: "Public site",
    description: "Pages visible to everyone.",
    items: [
      { href: "/cms/homepage-explore", label: "Homepage · mission", icon: House },
      { href: "/cms/hero", label: "Hero", icon: ImageIcon },
      { href: "/cms/about", label: "About", icon: FileText },
      { href: "/cms/executives", label: "Executives", icon: Users },
      { href: "/cms/join", label: "Join / membership", icon: Users },
      { href: "/cms/partnerships", label: "Partnerships", icon: Handshake },
      { href: "/cms/news", label: "News", icon: Newspaper },
      { href: "/cms/resources", label: "Resources", icon: FolderOpen },
      { href: "/cms/publications", label: "Publications", icon: BookOpen },
      { href: "/cms/events", label: "Events", icon: Calendar },
      { href: "/cms/testimonials", label: "Testimonials", icon: Quote },
      { href: "/cms/site-footer", label: "Site footer", icon: PanelBottom },
      { href: "/cms/contact", label: "Contact page", icon: MessageCircle },
    ],
  },
  {
    id: "members",
    label: "Members & community",
    description: "Approvals, portal copy, and resources shared only with registered members.",
    items: [
      { href: "/cms/membership", label: "Membership approvals", icon: Wallet, badge: "membership" },
      { href: "/cms/member-announcements", label: "Member announcements", icon: Megaphone },
      { href: "/cms/member-portal", label: "Member portal", icon: UserCircle },
    ],
  },
  {
    id: "inbox",
    label: "Inboxes",
    description: "Messages and registrations that need a reply.",
    items: [
      { href: "/cms/registration-inbox", label: "Event registrations", icon: ClipboardList, badge: "registrations" },
      { href: "/cms/testimonial-inbox", label: "Testimonial inbox", icon: Quote, badge: "testimonials" },
      { href: "/cms/contact-inquiries", label: "Contact messages", icon: Inbox, badge: "contact" },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    items: [{ href: "/cms/settings", label: "Settings", icon: Settings }],
  },
];

function isNavActive(href: string, pathname: string) {
  if (href === "/cms") return pathname === "/cms";
  if (href === "/cms/contact") return pathname === "/cms/contact";
  if (href === "/cms/homepage-explore") return pathname === "/cms/homepage-explore";
  if (href === "/cms/settings") return pathname === "/cms/settings";
  if (href === "/cms/analytics") return pathname === "/cms/analytics";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function badgeCount(badge: NavItem["badge"], counts: ReturnType<typeof useCmsNotificationCounts>["counts"]) {
  if (badge === "contact") return counts.unreadContactInquiries;
  if (badge === "registrations") return counts.unreadRegistrations;
  if (badge === "testimonials") return counts.unreadTestimonialSubmissions;
  if (badge === "membership") return counts.pendingMembershipPayments;
  if (badge === "total") return counts.totalUnread;
  return 0;
}

export function CmsSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { counts } = useCmsNotificationCounts();

  useEffect(() => {
    try {
      if (localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1") setCollapsed(true);
    } catch {
      /* ignore */
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const linkCls = (href: string) => {
    const active = isNavActive(href, pathname);
    return cn(
      "relative flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-colors",
      collapsed ? "md:justify-center md:px-2" : "px-3",
      active
        ? "bg-gcs-primary/10 text-gcs-primary shadow-sm"
        : "text-gcs-muted-text hover:bg-neutral-50 hover:text-gcs-foreground"
    );
  };

  return (
    <>
      <button
        type="button"
        className="fixed left-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-xl border border-gcs-border bg-white text-gcs-foreground shadow-md md:hidden"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close menu" : "Open menu"}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex shrink-0 flex-col overflow-hidden border-r border-gcs-border bg-white px-3 pb-6 pt-16 shadow-xl transition-[width,transform] duration-300 ease-in-out md:static md:translate-x-0 md:pt-8 md:shadow-none",
          collapsed ? "w-[260px] md:w-[4.5rem] md:px-2" : "w-[260px]",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          type="button"
          onClick={toggleCollapsed}
          className="absolute -right-3 top-24 z-50 hidden h-7 w-7 items-center justify-center rounded-full border border-gcs-border bg-white text-gcs-muted-text shadow-md transition hover:border-gcs-primary/30 hover:text-gcs-primary md:flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" aria-hidden /> : <ChevronLeft className="h-4 w-4" aria-hidden />}
        </button>

        <Link
          href="/cms"
          className={cn(
            "mb-6 flex items-start gap-3 rounded-xl py-1 transition-colors hover:bg-neutral-50",
            collapsed ? "md:justify-center md:px-0" : "px-2"
          )}
          onClick={() => setOpen(false)}
          title={collapsed ? "GCS Admin" : undefined}
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-gcs-border/60">
            <span className="relative h-8 w-8">
              <Image
                src="/logo/ghana-chemical-society-logo.png"
                alt="Ghana Chemical Society logo"
                fill
                className="object-contain object-center"
                sizes="32px"
              />
            </span>
          </span>
          <span className={cn("min-w-0 pt-0.5", collapsed && "md:hidden")}>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-gcs-primary">GCS</p>
            <p className="mt-0.5 text-lg font-semibold leading-tight tracking-tight text-gcs-foreground">Admin</p>
            <p className="mt-0.5 text-xs leading-snug text-gcs-muted-text">Marketing &amp; content</p>
          </span>
        </Link>

        <nav className="flex flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden px-1">
          {navGroups.map((group, groupIndex) => (
            <div key={group.id} className={groupIndex === 0 ? "" : "border-t border-gcs-border/40 pt-3"}>
              {group.id === "overview" || collapsed ? null : (
                <div className="px-3 pb-2">
                  <p className="text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-gcs-muted-text/80">
                    {group.label}
                  </p>
                  {group.description ? (
                    <p className="mt-0.5 text-[0.7rem] leading-snug text-gcs-muted-text/70">{group.description}</p>
                  ) : null}
                </div>
              )}
              <div className="flex flex-col gap-0.5">
                {group.items.map(({ href, label, icon: Icon, badge }) => {
                  const count = badgeCount(badge, counts);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={linkCls(href)}
                      onClick={() => setOpen(false)}
                      title={collapsed ? label : undefined}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isNavActive(href, pathname) ? "text-gcs-primary" : "text-gcs-muted-text"
                        )}
                      />
                      <span className={cn("min-w-0 flex-1 truncate", collapsed && "md:hidden")}>{label}</span>
                      {collapsed ? (
                        count > 0 ? (
                          <span
                            className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gcs-primary px-1 text-[0.55rem] font-bold text-white md:right-0.5 md:top-0.5"
                            aria-label={`${count} notifications`}
                          >
                            {count > 9 ? "9+" : count}
                          </span>
                        ) : null
                      ) : (
                        <CmsNavBadge count={count} />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-auto space-y-2 border-t border-gcs-border/60 pt-4">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex w-full items-center gap-2 rounded-xl py-2.5 text-sm font-medium text-gcs-primary transition-colors hover:bg-gcs-primary/5",
              collapsed ? "md:justify-center md:px-2" : "px-3"
            )}
            onClick={() => setOpen(false)}
            title={collapsed ? "Visit live site" : undefined}
          >
            <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
            <span className={cn(collapsed && "md:hidden")}>Visit live site</span>
          </Link>
          <CmsLogoutButton iconOnly={collapsed} />
        </div>
      </aside>

      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-gcs-foreground/25 backdrop-blur-[2px] md:hidden"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

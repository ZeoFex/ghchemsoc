"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Bell, ExternalLink } from "lucide-react";
import { cmsCredentials } from "@/lib/cms-fetch";
import type { CmsNotificationCounts } from "@/lib/cms-notifications";

const empty: CmsNotificationCounts = {
  unreadContactInquiries: 0,
  unreadRegistrations: 0,
  unreadTestimonialSubmissions: 0,
  pendingMembershipPayments: 0,
  totalUnread: 0,
};

export function CmsHeaderActions() {
  const [counts, setCounts] = useState<CmsNotificationCounts>(empty);

  const load = useCallback(async () => {
    const res = await fetch("/api/cms/notifications", cmsCredentials);
    if (!res.ok) return;
    setCounts((await res.json()) as CmsNotificationCounts);
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(id);
  }, [load]);

  return (
    <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:gap-3 md:mt-0 md:w-auto">
      <Link
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-full border border-gcs-border bg-white px-3 py-2 text-xs font-semibold text-gcs-foreground shadow-sm transition-colors hover:border-gcs-primary hover:text-gcs-primary sm:flex-none sm:px-4 sm:text-sm"
      >
        Visit site
        <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
      </Link>
      <Link
        href="/cms"
        className="relative inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-full border border-gcs-border bg-white px-3 py-2 text-xs font-semibold text-gcs-foreground shadow-sm transition-colors hover:border-gcs-primary hover:text-gcs-primary sm:flex-none sm:px-4 sm:text-sm"
        aria-label={counts.totalUnread ? `${counts.totalUnread} unread notifications` : "Notifications"}
      >
        <Bell className="h-4 w-4 text-gcs-primary" aria-hidden />
        Notifications
        {counts.totalUnread > 0 ? (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gcs-primary px-1.5 text-[0.65rem] font-bold text-white">
            {counts.totalUnread > 99 ? "99+" : counts.totalUnread}
          </span>
        ) : null}
      </Link>
    </div>
  );
}

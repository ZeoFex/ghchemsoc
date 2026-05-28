"use client";

import { useCallback, useEffect, useState } from "react";
import { cmsCredentials } from "@/lib/cms-fetch";
import type { CmsNotificationCounts } from "@/lib/cms-notifications";

const empty: CmsNotificationCounts = {
  unreadContactInquiries: 0,
  unreadRegistrations: 0,
  unreadTestimonialSubmissions: 0,
  pendingMembershipPayments: 0,
  totalUnread: 0,
};

/** Hook for sidebar / overview badge counts (polls every 60s). */
export function useCmsNotificationCounts() {
  const [counts, setCounts] = useState<CmsNotificationCounts>(empty);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/cms/notifications", cmsCredentials);
      if (!res.ok) return;
      setCounts((await res.json()) as CmsNotificationCounts);
    } catch {
      /* ignore — background poll must not affect CMS forms */
    }
  }, []);

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    tick();
    const id = window.setInterval(tick, 90_000);
    const onRefresh = () => void refresh();
    window.addEventListener("cms-notifications-refresh", onRefresh);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("cms-notifications-refresh", onRefresh);
    };
  }, [refresh]);

  return { counts, refresh };
}

export function refreshCmsNotifications() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("cms-notifications-refresh"));
  }
}

export function CmsNavBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-gcs-primary px-1.5 text-[0.65rem] font-bold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

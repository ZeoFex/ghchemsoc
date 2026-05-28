import Image from "next/image";
import Link from "next/link";
import type { ExecutivePublic } from "@/lib/executive-defaults";

/** Portrait frame on executives page — full image visible (no crop). */
const EXECUTIVE_PHOTO_WIDTH_PX = 260;
const EXECUTIVE_PHOTO_HEIGHT_PX = 280;

export function ExecutivesGrid({ executives }: { executives: ExecutivePublic[] }) {
  if (executives.length === 0) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-dashed border-blue-200/80 bg-white/80 px-8 py-16 text-center">
        <p className="text-lg font-semibold text-slate-900">Leadership profiles coming soon</p>
        <p className="mt-2 text-sm text-slate-600">Executive officers will be listed here once published in the admin.</p>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-7 sm:grid-cols-2 sm:gap-9 xl:grid-cols-3 xl:gap-10">
      {executives.map((e) => (
        <li key={e.id}>
          <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_12px_40px_-22px_rgba(15,23,42,0.22)] ring-1 ring-slate-900/5 transition hover:-translate-y-0.5 hover:border-blue-200/60 hover:shadow-[0_18px_55px_-28px_rgba(29,78,216,0.35)] sm:rounded-3xl">
            <div
              className="relative mx-auto flex w-full max-w-[280px] items-center justify-center bg-gradient-to-b from-blue-50/80 via-white to-white px-4 pt-5"
              style={{ maxWidth: EXECUTIVE_PHOTO_WIDTH_PX }}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(29,78,216,0.14),transparent_70%)]" />
              <div
                className="relative w-full"
                style={{
                  width: "100%",
                  maxWidth: EXECUTIVE_PHOTO_WIDTH_PX,
                  height: EXECUTIVE_PHOTO_HEIGHT_PX,
                }}
              >
                {e.media?.url ? (
                  <Image
                    src={e.media.url}
                    alt={e.media.alt ?? e.name}
                    fill
                    className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
                    sizes={`(max-width: 640px) 100vw, ${EXECUTIVE_PHOTO_WIDTH_PX}px`}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 text-sm text-slate-500">
                    No photo
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-1 flex-col px-5 pb-6 pt-4 text-center sm:px-7">
              <p className="mx-auto inline-flex items-center rounded-full border border-blue-200/60 bg-blue-50/70 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-blue-800">
                {e.role}
              </p>
              <h2 className="mt-3.5 text-lg font-semibold tracking-tight text-gcs-foreground sm:text-xl">
                {e.name}
              </h2>
              {e.bio ? (
                <p className="mt-3 line-clamp-3 text-left text-sm leading-relaxed text-slate-600">
                  {e.bio}
                </p>
              ) : null}

              <div className="mt-5 flex justify-center">
                <Link
                  href={`/executives/${e.id}`}
                  className="inline-flex items-center justify-center rounded-full bg-gcs-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gcs-primary-hover"
                >
                  Read more
                </Link>
              </div>
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}

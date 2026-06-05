"use client";

import { useState, useTransition, type ComponentProps, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Briefcase,
  Building2,
  Calendar,
  GraduationCap,
  Loader2,
  Mail,
  PenLine,
  Phone,
  Send,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createMembershipApplication } from "@/app/membership/actions";
import { MembershipLoginLink } from "@/components/membership/membership-login-link";
import { MembershipPaymentModal } from "@/components/membership/membership-payment-modal";
import { formatGhs, MEMBERSHIP_FEE_GHS } from "@/lib/membership-application";
import { MembershipPhotoField } from "@/components/membership/membership-photo-field";
import { gooeyToast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const labelClass = "mb-1 block text-xs font-semibold text-slate-600";
const hintClass = "mt-1 text-[11px] leading-snug text-gcs-muted-text";

const fieldShell =
  "group flex h-10 w-full items-stretch overflow-hidden rounded-lg border border-slate-200 bg-white transition-[border-color,box-shadow] focus-within:border-gcs-primary focus-within:ring-2 focus-within:ring-gcs-primary/15";

const iconSlot =
  "flex w-9 shrink-0 items-center justify-center border-r border-slate-200 bg-slate-50/90 text-gcs-primary group-focus-within:border-gcs-primary/20 group-focus-within:bg-sky-50/80";

const fieldInput =
  "min-h-0 min-w-0 flex-1 border-0 bg-transparent px-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50";

function trimFd(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function RequiredMark() {
  return <span className="text-gcs-primary" aria-hidden>*</span>;
}

function IconInput({
  icon: Icon,
  className,
  inputClassName,
  ...props
}: { icon: LucideIcon; inputClassName?: string } & ComponentProps<"input">) {
  const isDate = props.type === "date";
  return (
    <div className={cn(fieldShell, className)}>
      <span className={iconSlot} aria-hidden>
        <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
      </span>
      <input
        className={cn(
          fieldInput,
          isDate && "[&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-55",
          inputClassName
        )}
        {...props}
      />
    </div>
  );
}

function FormField({
  id,
  label,
  required,
  hint,
  icon,
  className,
  inputClassName,
  ...inputProps
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  icon: LucideIcon;
  className?: string;
  inputClassName?: string;
} & Omit<ComponentProps<"input">, "id">) {
  return (
    <div className={cn("min-w-0", className)}>
      <label className={labelClass} htmlFor={id}>
        {label}
        {required ? (
          <>
            {" "}
            <RequiredMark />
          </>
        ) : null}
      </label>
      <IconInput id={id} icon={icon} required={required} inputClassName={inputClassName} {...inputProps} />
      {hint ? <p className={hintClass}>{hint}</p> : null}
    </div>
  );
}

function FormSection({
  step,
  title,
  children,
  className,
}: {
  step: number;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn(className)}>
      <div className="mb-4 flex items-center gap-2.5 border-b border-slate-100 pb-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gcs-primary text-[11px] font-bold text-white">
          {step}
        </span>
        <h3 className="text-sm font-semibold tracking-tight text-slate-700">{title}</h3>
      </div>
      {children}
    </section>
  );
}

export function MembershipRegistrationForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [payOpen, setPayOpen] = useState(false);
  const [checkout, setCheckout] = useState<{ applicationId: string; amountGhs: number; email: string } | null>(null);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_8px_32px_-12px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/50">
      <div className="border-b border-slate-100 bg-gradient-to-r from-gcs-primary to-blue-700 px-5 py-4 text-white sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/75">Application</p>
            <h2 id="membership-form-title" className="text-base font-semibold tracking-tight text-white sm:text-lg">
              Registration &amp; renewal
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-white/85">
              Fields marked <span className="font-semibold text-white">*</span> are required · {formatGhs(MEMBERSHIP_FEE_GHS)} / year
            </p>
          </div>
          <p className="shrink-0 text-xs text-white/90 sm:text-right">
            Member? <MembershipLoginLink variant="onDark" />
          </p>
        </div>
      </div>

      <form
        id="membership-form"
        aria-labelledby="membership-form-title"
        className="space-y-8 px-5 py-6 sm:px-6 sm:py-7"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          startTransition(async () => {
            const res = await createMembershipApplication(fd);
            if (!res.ok) {
              gooeyToast.error("We couldn’t submit your application", {
                description: res.message,
                preset: "smooth",
                spring: false,
              });
              return;
            }
            if (res.resumed) {
              gooeyToast.success("Continuing your application", {
                description: "Your details were saved. Complete payment to finish.",
                preset: "smooth",
                spring: false,
              });
            }
            setCheckout({
              applicationId: res.applicationId,
              amountGhs: res.amountGhs,
              email: trimFd(fd, "email"),
            });
            setPayOpen(true);
          });
        }}
      >
        <FormSection step={1} title="Personal & professional details">
          <div className="grid gap-4 md:grid-cols-12 md:items-start">
            <div className="md:col-span-3 lg:col-span-3">
              <MembershipPhotoField disabled={isPending} />
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2 md:col-span-9 md:gap-x-4">
              <FormField
                id="fullName"
                name="fullName"
                label="Full name (certificate)"
                required
                hint="Include title if applicable — Dr., Prof., etc."
                icon={BadgeCheck}
                autoComplete="name"
                placeholder="Dr. Felix Owusu"
                className="sm:col-span-2"
              />
              <FormField
                id="institution"
                name="institution"
                label="Institution / employer"
                required
                icon={Building2}
                autoComplete="organization"
                placeholder="University or company"
              />
              <FormField
                id="jobTitle"
                name="jobTitle"
                label="Job title"
                icon={Briefcase}
                autoComplete="organization-title"
                placeholder="Senior Lecturer"
              />
              <FormField
                id="email"
                name="email"
                type="email"
                label="Email"
                required
                icon={Mail}
                autoComplete="email"
                placeholder="you@institution.edu.gh"
              />
              <FormField
                id="phone"
                name="phone"
                type="tel"
                label="Phone"
                icon={Phone}
                autoComplete="tel"
                placeholder="+233 XX XXX XXXX"
              />
              <FormField
                id="highestDegree"
                name="highestDegree"
                label="Highest degree"
                icon={GraduationCap}
                placeholder="PhD, MSc, BSc…"
                className="sm:col-span-2"
              />
            </div>
          </div>
        </FormSection>

        <FormSection step={2} title="Declaration" className="border-t border-slate-100 pt-8">
          <div className="rounded-xl border border-blue-100/90 bg-blue-50/30 px-4 py-3.5">
            <p className="text-xs leading-relaxed text-slate-600">
              I declare that all information provided is true regarding my registration or renewal of GCS membership.
            </p>
          </div>

          <div className="mt-3.5 grid gap-3.5 sm:grid-cols-2 sm:gap-x-4">
            <FormField
              id="declarationLegalName"
              name="declarationLegalName"
              label="Legal name (signature)"
              required
              hint="Surname last — electronic signature."
              icon={PenLine}
              autoComplete="name"
              placeholder="Owusu Felix"
              className="sm:col-span-2"
            />
            <FormField
              id="declarationDate"
              name="declarationDate"
              type="date"
              label="Date"
              required
              icon={Calendar}
              defaultValue={todayIsoDate()}
            />
          </div>
        </FormSection>

        <div className="flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 text-xs leading-relaxed text-gcs-muted-text">
            <p>
              <span className="font-semibold text-slate-700">{formatGhs(MEMBERSHIP_FEE_GHS)}</span> annual dues · 12 months active after verified payment.
            </p>
            <p className="mt-1">
              <Link href="/contact" className="font-semibold text-gcs-primary hover:underline">
                Contact secretariat
              </Link>
              {" · "}
              <MembershipLoginLink variant="inline" />
            </p>
          </div>
          <Button
            type="submit"
            disabled={isPending}
            className="group h-10 w-full shrink-0 gap-2 rounded-full bg-gcs-primary px-6 text-sm font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-gcs-primary-hover disabled:opacity-50 sm:w-auto sm:min-w-[200px]"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Submitting…
              </>
            ) : (
              <>
                Continue to payment
                <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </>
            )}
          </Button>
        </div>
      </form>

      {checkout ? (
        <MembershipPaymentModal
          open={payOpen}
          applicationId={checkout.applicationId}
          amountGhs={checkout.amountGhs}
          email={checkout.email}
          onClose={() => setPayOpen(false)}
          onSuccess={(payload) => {
            setPayOpen(false);
            gooeyToast.success("Payment submitted", {
              description: payload.message,
              preset: "smooth",
              spring: false,
            });
            const q = new URLSearchParams({
              applicationId: checkout.applicationId,
              ref: payload.paystackReference,
              method: payload.paymentMethod,
            });
            router.push(`/membership/pending?${q.toString()}`);
          }}
        />
      ) : null}
    </div>
  );
}

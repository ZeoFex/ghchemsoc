"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronRight,
  Copy,
  Loader2,
  Lock,
  Smartphone,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatGhs } from "@/lib/membership-application";
import {
  membershipPaymentMethodLabel,
  PAYMENT_METHOD_GROUPS,
  paystackChannels,
  requiresPayerPhone,
  type MembershipPaymentMethodId,
} from "@/lib/membership-payment-methods";
import { loadPaystackInline, openPaystackCheckout } from "@/lib/paystack-inline";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  applicationId: string;
  amountGhs: number;
  email: string;
  onClose: () => void;
  onSuccess: (payload: { paystackReference: string; message: string; paymentMethod: string }) => void;
};

type PayInitResponse = {
  ok?: boolean;
  flow?: "popup" | "bank_transfer";
  reference?: string;
  publicKey?: string;
  email?: string;
  amountPesewas?: number;
  currency?: string;
  channels?: string[];
  paymentMethod?: string;
  mode?: "test" | "live" | null;
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
  accountExpiresAt?: string;
  displayText?: string;
  error?: string;
};

type BankTransferDetails = {
  reference: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  accountExpiresAt: string;
  displayText?: string;
};

async function parseJsonResponse<T>(res: Response): Promise<T | null> {
  const raw = await res.text();
  try {
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function methodIcon(id: MembershipPaymentMethodId) {
  if (id === "bank_transfer") return Building2;
  return Smartphone;
}


export function MembershipPaymentModal({
  open,
  applicationId,
  amountGhs,
  email,
  onClose,
  onSuccess,
}: Props) {
  const [step, setStep] = useState<"choose" | "confirm" | "bank_transfer">("choose");
  const [method, setMethod] = useState<MembershipPaymentMethodId | null>(null);
  const [payerPhone, setPayerPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [paystackReady, setPaystackReady] = useState(false);
  const [paystackMode, setPaystackMode] = useState<"test" | "live" | null>(null);
  const [bankTransfer, setBankTransfer] = useState<BankTransferDetails | null>(null);
  const [copied, setCopied] = useState(false);
  const [polling, setPolling] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setPolling(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void loadPaystackInline()
      .then(() => {
        if (!cancelled) setPaystackReady(true);
      })
      .catch(() => {
        if (!cancelled) setPaystackReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  const resetAndClose = useCallback(() => {
    if (busy) return;
    stopPolling();
    setStep("choose");
    setMethod(null);
    setPayerPhone("");
    setErr(null);
    setPaystackMode(null);
    setBankTransfer(null);
    setCopied(false);
    onClose();
  }, [busy, onClose, stopPolling]);

  if (!open) return null;

  function pickMethod(id: MembershipPaymentMethodId) {
    setMethod(id);
    setStep("confirm");
    setErr(null);
    setBankTransfer(null);
  }

  async function verifyPaystackPayment(reference: string, paymentMethod: string) {
    const res = await fetch(
      `/api/public/membership-applications/${applicationId}/pay/verify`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      }
    );
    const body = await parseJsonResponse<{
      ok?: boolean;
      paystackReference?: string;
      message?: string;
      error?: string;
      paymentMethod?: string;
    }>(res);

    if (res.status === 402) {
      return { ok: false as const, pending: true };
    }

    if (!res.ok || !body?.ok) {
      throw new Error(body?.error ?? "Payment verification failed.");
    }

    return {
      ok: true as const,
      pending: false,
      paystackReference: body.paystackReference ?? reference,
      message: body.message ?? "Payment received.",
      paymentMethod: body.paymentMethod ?? paymentMethod,
    };
  }

  function startBankTransferPolling(reference: string, paymentMethod: string) {
    stopPolling();
    setPolling(true);

    const tick = async () => {
      try {
        const result = await verifyPaystackPayment(reference, paymentMethod);
        if (result.ok) {
          stopPolling();
          setBusy(false);
          onSuccess({
            paystackReference: result.paystackReference,
            message: result.message,
            paymentMethod: result.paymentMethod,
          });
        }
      } catch (e) {
        stopPolling();
        setBusy(false);
        setErr(e instanceof Error ? e.message : "Could not verify payment.");
      }
    };

    void tick();
    pollRef.current = setInterval(() => void tick(), 8000);
  }

  async function submitPaystackPopup(init: PayInitResponse, paymentMethod: MembershipPaymentMethodId) {
    if (!init.reference || !init.publicKey || !init.amountPesewas) {
      throw new Error("Could not start Paystack checkout.");
    }

    setPaystackMode(init.mode ?? null);
    await loadPaystackInline();

    const channels = init.channels ?? paystackChannels(paymentMethod);
    const reference = init.reference;

    return new Promise<void>((resolve, reject) => {
      let completed = false;
      try {
        const handler = openPaystackCheckout({
          key: init.publicKey!,
          email: init.email ?? email,
          amount: init.amountPesewas!,
          currency: init.currency ?? "GHS",
          ref: reference,
          channels,
          metadata: {
            applicationId,
            paymentMethod,
          },
          callback: (response) => {
            completed = true;
            void (async () => {
              try {
                const result = await verifyPaystackPayment(response.reference, paymentMethod);
                if (result.ok) {
                  onSuccess({
                    paystackReference: result.paystackReference,
                    message: result.message,
                    paymentMethod: result.paymentMethod,
                  });
                  resolve();
                } else {
                  reject(new Error("Payment not confirmed yet. Try again in a moment."));
                }
              } catch (e) {
                reject(e);
              }
            })();
          },
          onClose: () => {
            if (!completed) {
              reject(new Error("Payment window closed before completion."));
            }
          },
        });
        handler.openIframe();
      } catch (e) {
        reject(e instanceof Error ? e : new Error("Could not open Paystack."));
      }
    });
  }

  async function submitPayment() {
    if (!method) return;
    setErr(null);

    if (requiresPayerPhone(method)) {
      const digits = payerPhone.replace(/\D/g, "");
      if (digits.length < 9) {
        setErr("Enter the phone number linked to your wallet or USSD account.");
        return;
      }
    }

    if (method !== "bank_transfer" && !paystackReady) {
      setErr("Loading secure checkout… try again in a moment.");
      return;
    }

    setBusy(true);
    try {
      const initRes = await fetch(
        `/api/public/membership-applications/${applicationId}/pay/init`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentMethod: method,
            ...(requiresPayerPhone(method) ? { payerPhone } : {}),
          }),
        }
      );
      const init = await parseJsonResponse<PayInitResponse>(initRes);

      if (!initRes.ok || !init?.ok || !init.reference) {
        throw new Error(init?.error ?? "Could not start payment.");
      }

      if (init.flow === "bank_transfer" && init.accountNumber) {
        setPaystackMode(init.mode ?? null);
        setBankTransfer({
          reference: init.reference,
          accountName: init.accountName ?? "Paystack",
          accountNumber: init.accountNumber,
          bankName: init.bankName ?? "Bank",
          accountExpiresAt: init.accountExpiresAt ?? "",
          displayText: init.displayText,
        });
        setStep("bank_transfer");
        setBusy(false);
        startBankTransferPolling(init.reference, init.paymentMethod ?? method);
        return;
      }

      await submitPaystackPopup(init, method);
      setBusy(false);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Payment could not be completed.";
      if (message !== "Payment window closed before completion.") {
        setErr(message);
      }
      setBusy(false);
      stopPolling();
    }
  }

  async function checkBankTransferNow() {
    if (!bankTransfer || !method) return;
    setErr(null);
    setBusy(true);
    try {
      const result = await verifyPaystackPayment(bankTransfer.reference, method);
      if (result.ok) {
        stopPolling();
        onSuccess({
          paystackReference: result.paystackReference,
          message: result.message,
          paymentMethod: result.paymentMethod,
        });
      } else {
        setErr("Transfer not detected yet. Pay the exact amount to the account below, then check again.");
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not verify payment.");
    } finally {
      setBusy(false);
    }
  }

  async function copyAccountNumber() {
    if (!bankTransfer) return;
    try {
      await navigator.clipboard.writeText(bankTransfer.accountNumber);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const expiresLabel =
    bankTransfer?.accountExpiresAt &&
    !Number.isNaN(new Date(bankTransfer.accountExpiresAt).getTime())
      ? new Date(bankTransfer.accountExpiresAt).toLocaleString("en-GB", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

  const confirmLabel =
    step === "bank_transfer"
      ? "Check payment status"
      : method === "bank_transfer"
        ? "Get transfer account"
        : "Continue to Paystack";

  const stepIndex = step === "choose" ? 0 : step === "confirm" ? 1 : 2;
  const showFooter = (step === "confirm" || step === "bank_transfer") && method;

  const headerTitle =
    step === "choose"
      ? "Pay membership fee"
      : step === "bank_transfer"
        ? "Bank transfer"
        : membershipPaymentMethodLabel(method);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col justify-end sm:items-center sm:justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-title"
    >
      {/* Light backdrop — click outside to close */}
      <button
        type="button"
        aria-label="Close payment"
        onClick={resetAndClose}
        disabled={busy}
        className="absolute inset-0 cursor-default bg-slate-900/10 backdrop-blur-md transition-opacity disabled:cursor-not-allowed"
      />

      <div
        className={cn(
          "relative flex w-full flex-col overflow-hidden bg-white shadow-[0_24px_64px_-16px_rgba(15,23,42,0.18)]",
          "max-h-[min(96dvh,100%)] rounded-t-2xl border border-slate-200/80",
          "sm:max-h-[min(88vh,680px)] sm:max-w-md sm:rounded-2xl"
        )}
      >
        {/* Header */}
        <div className="shrink-0 border-b border-slate-100 px-4 pb-4 pt-4 sm:px-5 sm:pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-wider text-gcs-muted-text">
                Secure checkout
              </p>
              <h2
                id="payment-title"
                className="mt-0.5 break-words text-lg font-semibold tracking-tight text-gcs-foreground sm:text-xl"
              >
                {headerTitle}
              </h2>
            </div>
            <button
              type="button"
              onClick={resetAndClose}
              disabled={busy}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3.5 py-3 ring-1 ring-slate-200/70">
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-gcs-muted-text">Amount due</p>
              <p className="text-xl font-bold tracking-tight text-gcs-foreground sm:text-2xl">
                {formatGhs(amountGhs)}
              </p>
            </div>
            <p className="max-w-[45%] truncate text-right text-xs text-gcs-muted-text">{email}</p>
          </div>

          {/* Minimal step dots */}
          <div className="mt-4 flex items-center gap-2" aria-label="Checkout progress">
            {(["Method", "Review", "Pay"] as const).map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold transition-colors",
                    i < stepIndex
                      ? "bg-gcs-primary text-white"
                      : i === stepIndex
                        ? "bg-gcs-primary/15 text-gcs-primary ring-1 ring-gcs-primary/25"
                        : "bg-slate-100 text-slate-400"
                  )}
                  aria-current={i === stepIndex ? "step" : undefined}
                >
                  {i < stepIndex ? "✓" : i + 1}
                </span>
                <span
                  className={cn(
                    "hidden text-xs font-medium sm:inline",
                    i <= stepIndex ? "text-gcs-foreground" : "text-slate-400"
                  )}
                >
                  {label}
                </span>
                {i < 2 ? (
                  <span
                    className={cn(
                      "hidden h-px w-4 sm:block",
                      i < stepIndex ? "bg-gcs-primary/40" : "bg-slate-200"
                    )}
                    aria-hidden
                  />
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5">
          {step === "choose" ? (
            <div className="space-y-5">
              {PAYMENT_METHOD_GROUPS.map((group) => (
                <section key={group.id}>
                  <h3 className="text-sm font-semibold text-gcs-foreground">{group.title}</h3>
                  {group.subtitle ? (
                    <p className="mt-0.5 text-xs text-gcs-muted-text">{group.subtitle}</p>
                  ) : null}
                  <ul className="mt-2.5 space-y-2">
                    {group.methods.map((m) => {
                      const Icon = methodIcon(m.id);
                      return (
                        <li key={m.id}>
                          <button
                            type="button"
                            onClick={() => pickMethod(m.id)}
                            className="group flex min-h-[52px] w-full items-center gap-3 rounded-xl border border-gcs-border bg-white px-3.5 py-3 text-left transition hover:border-gcs-primary/30 hover:bg-slate-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gcs-primary/25"
                          >
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gcs-primary/10 text-gcs-primary">
                              <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-semibold text-gcs-foreground">
                                {m.label}
                              </span>
                              {m.detail ? (
                                <span className="mt-0.5 block text-xs text-gcs-muted-text">
                                  {m.detail}
                                </span>
                              ) : null}
                            </span>
                            <ChevronRight
                              className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-gcs-primary"
                              aria-hidden
                            />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          ) : step === "bank_transfer" && bankTransfer ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-gcs-border bg-slate-50/50 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-gcs-foreground">
                  <Building2 className="h-4 w-4 text-gcs-primary" aria-hidden />
                  Transfer to this account
                </p>
                {bankTransfer.displayText ? (
                  <p className="mt-2 text-sm leading-relaxed text-gcs-muted-text">
                    {bankTransfer.displayText}
                  </p>
                ) : (
                  <p className="mt-2 text-sm leading-relaxed text-gcs-muted-text">
                    Pay exactly <strong className="text-gcs-foreground">{formatGhs(amountGhs)}</strong>.
                    We confirm automatically when Paystack receives it.
                  </p>
                )}

                {paystackMode === "test" ? (
                  <p className="mt-3 rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-xs leading-relaxed text-amber-950">
                    <strong>Test mode:</strong> Use{" "}
                    <a
                      href="https://demobank.paystackintegrations.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-gcs-primary underline"
                    >
                      Paystack Demo Bank
                    </a>{" "}
                    to simulate {formatGhs(amountGhs)}.
                  </p>
                ) : null}

                <dl className="mt-4 space-y-3 rounded-lg border border-gcs-border bg-white p-3.5">
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-gcs-muted-text">
                      Bank
                    </dt>
                    <dd className="mt-0.5 text-sm font-medium text-gcs-foreground">
                      {bankTransfer.bankName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-gcs-muted-text">
                      Account name
                    </dt>
                    <dd className="mt-0.5 text-sm font-medium text-gcs-foreground">
                      {bankTransfer.accountName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-gcs-muted-text">
                      Account number
                    </dt>
                    <dd className="mt-1 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                      <span className="break-all font-mono text-lg font-bold tracking-wide text-gcs-primary">
                        {bankTransfer.accountNumber}
                      </span>
                      <button
                        type="button"
                        onClick={() => void copyAccountNumber()}
                        className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-gcs-border bg-white px-3.5 text-sm font-semibold text-gcs-foreground transition hover:border-gcs-primary/30 sm:w-auto"
                      >
                        {copied ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" aria-hidden />
                            Copy
                          </>
                        )}
                      </button>
                    </dd>
                  </div>
                  {expiresLabel ? (
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wider text-gcs-muted-text">
                        Expires
                      </dt>
                      <dd className="mt-0.5 text-sm text-gcs-muted-text">{expiresLabel}</dd>
                    </div>
                  ) : null}
                </dl>
              </div>

              {polling ? (
                <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-800">
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                  Waiting for your transfer…
                </p>
              ) : null}
            </div>
          ) : method ? (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  stopPolling();
                  setStep("choose");
                  setMethod(null);
                  setBankTransfer(null);
                  setErr(null);
                }}
                disabled={busy}
                className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-gcs-primary hover:underline"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Change method
              </button>

              <div className="flex items-center gap-3 rounded-xl border border-gcs-border bg-slate-50/60 p-3.5">
                {(() => {
                  const Icon = methodIcon(method);
                  return (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gcs-primary/10 text-gcs-primary">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                  );
                })()}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gcs-foreground">
                    {membershipPaymentMethodLabel(method)}
                  </p>
                  <p className="text-xs text-gcs-muted-text">{formatGhs(amountGhs)}</p>
                </div>
              </div>

              {method === "bank_transfer" ? (
                <p className="text-sm leading-relaxed text-gcs-muted-text">
                  We&apos;ll generate a one-time account number. Transfer the exact amount — verification
                  is automatic.
                </p>
              ) : null}

              {method === "mobile_money_mtn" ? (
                <p className="rounded-lg border border-blue-100 bg-blue-50/70 px-3.5 py-2.5 text-xs leading-relaxed text-slate-700">
                  Use your registered MTN MoMo number. You&apos;ll approve the payment in Paystack.
                </p>
              ) : null}

              {requiresPayerPhone(method) ? (
                <div>
                  <label
                    htmlFor="pay-phone"
                    className="mb-1.5 block text-sm font-medium text-gcs-foreground"
                  >
                    MTN MoMo number
                  </label>
                  <input
                    id="pay-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={payerPhone}
                    onChange={(e) => setPayerPhone(e.target.value)}
                    placeholder="024 XXX XXXX"
                    className="min-h-[48px] w-full rounded-xl border border-gcs-border bg-white px-3.5 text-base text-gcs-foreground outline-none transition placeholder:text-slate-400 focus:border-gcs-primary focus:ring-2 focus:ring-gcs-primary/20"
                    disabled={busy}
                  />
                </div>
              ) : null}

              <p className="flex items-start gap-2 text-xs leading-relaxed text-gcs-muted-text">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gcs-primary/60" aria-hidden />
                {paystackMode === "test"
                  ? "Test mode — no real charges."
                  : paystackMode === "live"
                    ? "Encrypted via Paystack. GCS never stores card or PIN details."
                    : "You'll complete payment on Paystack's secure page."}
              </p>
            </div>
          ) : null}

          {err ? (
            <p
              className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800"
              role="alert"
            >
              {err}
            </p>
          ) : null}
        </div>

        {/* Sticky footer CTA */}
        {showFooter ? (
          <div className="shrink-0 border-t border-slate-100 bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-5">
            <Button
              type="button"
              disabled={busy || (step === "confirm" && method !== "bank_transfer" && !paystackReady)}
              onClick={() =>
                step === "bank_transfer" ? void checkBankTransferNow() : void submitPayment()
              }
              className="h-12 w-full rounded-xl bg-gcs-primary text-base font-semibold text-white hover:bg-gcs-primary-hover disabled:opacity-60"
            >
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Processing…
                </>
              ) : step === "confirm" && method !== "bank_transfer" && !paystackReady ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Preparing…
                </>
              ) : (
                confirmLabel
              )}
            </Button>
            <p className="mt-2.5 text-center text-[11px] text-gcs-muted-text">
              Secured by Paystack · Ghana Chemical Society
            </p>
          </div>
        ) : (
          <div className="shrink-0 border-t border-slate-100 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 text-center sm:px-5">
            <p className="text-[11px] text-gcs-muted-text">Choose a payment method to continue</p>
          </div>
        )}
      </div>
    </div>
  );
}

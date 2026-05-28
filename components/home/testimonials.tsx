"use client";

import { Quote, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";

export type TestimonialItem = {
    id: string;
    name: string;
    role: string;
    quote: string;
    imageUrl?: string | null;
    imageAlt?: string | null;
};

export function Testimonials({ testimonials }: { testimonials: TestimonialItem[] }) {
    const [index, setIndex] = useState(0);
    const [direction, setDirection] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [submitOk, setSubmitOk] = useState<string | null>(null);
    const [submitErr, setSubmitErr] = useState<string | null>(null);
    const [form, setForm] = useState({
        name: "",
        role: "",
        email: "",
        phone: "",
        quote: "",
    });

    const next = useCallback(() => {
        setDirection(1);
        setIndex((prev) => (prev + 1) % testimonials.length);
    }, []);

    const prev = useCallback(() => {
        setDirection(-1);
        setIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    }, []);

    useEffect(() => {
        if (testimonials.length <= 1) return;
        const timer = setInterval(next, 6000);
        return () => clearInterval(timer);
    }, [next, testimonials.length]);

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 100 : -100,
            opacity: 0,
            scale: 0.95,
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1,
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 100 : -100,
            opacity: 0,
            scale: 0.95,
        }),
    };

    return (
        <section className="relative flex w-full flex-col items-center overflow-hidden bg-gcs-surface px-6 py-24" data-aos="fade-up">

            <div className="pointer-events-none absolute left-1/2 top-0 z-0 h-[150vw] w-[150vw] -translate-x-1/2 -translate-y-1/2 rounded-full border border-gcs-border/50 bg-transparent md:h-[120vw] md:w-[120vw]"></div>

            <div className="relative z-10 mx-auto mt-12 max-w-4xl text-center md:mt-16">

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-12 inline-flex items-center gap-2 rounded-full border border-gcs-border bg-white px-6 py-2 shadow-sm"
                >
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gcs-muted-text md:text-sm">
                        Member voices
                    </span>
                    <Quote className="h-5 w-5 text-gcs-primary" />
                </motion.div>

                <div className="relative flex min-h-[300px] flex-col items-center justify-center">
                    <AnimatePresence initial={false} custom={direction} mode="wait">
                        <motion.div
                            key={index}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: "spring", stiffness: 300, damping: 30 },
                                opacity: { duration: 0.4 },
                                scale: { duration: 0.4 },
                            }}
                            className="w-full"
                        >
                            <div className="relative mb-12">
                                <span className="absolute -left-4 -top-12 select-none font-serif text-6xl text-neutral-100 md:-left-12 md:text-8xl">
                                    ❝
                                </span>
                                <p className="break-words text-xl font-medium italic leading-relaxed tracking-tight text-gcs-foreground sm:text-2xl md:text-3xl lg:text-4xl">
                                    {testimonials[index]?.quote ?? ""}
                                </p>
                            </div>

                            <div className="flex flex-col items-center gap-4">
                                <div className="relative h-20 w-20 overflow-hidden rounded-3xl border-4 border-white shadow-2xl shadow-slate-900/10 transition-transform duration-500 transform rotate-3 hover:rotate-0 md:h-24 md:w-24">
                                    {testimonials[index]?.imageUrl ? (
                                        <Image
                                            src={testimonials[index].imageUrl}
                                            alt={testimonials[index].imageAlt ?? testimonials[index].name}
                                            fill
                                            className="object-cover"
                                            sizes="96px"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-slate-100 text-base font-semibold text-slate-500">
                                            {(testimonials[index]?.name ?? "G").slice(0, 1).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-gcs-foreground transition-all md:text-2xl">
                                        {testimonials[index]?.name ?? ""}
                                    </h4>
                                    <p className="mt-1 text-xs font-medium uppercase tracking-wide text-gcs-muted-text md:text-sm normal-case">
                                        {testimonials[index]?.role ?? ""}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="mt-16 flex flex-col items-center gap-8">
                    <div className="flex items-center gap-6">
                        <button
                            type="button"
                            onClick={prev}
                            aria-label="Previous testimonial"
                            className="flex h-12 w-12 items-center justify-center rounded-full border border-gcs-border bg-white text-gcs-foreground shadow-sm transition-all hover:bg-gcs-primary hover:text-white active:scale-90"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <div className="flex justify-center gap-2.5">
                            {testimonials.map((_, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => {
                                        setDirection(i > index ? 1 : -1);
                                        setIndex(i);
                                    }}
                                    aria-label={`Go to testimonial ${i + 1}`}
                                    className={`h-2 rounded-full transition-all duration-300 ${
                                        index === i
                                            ? "w-8 bg-gcs-primary"
                                            : "w-2 bg-gcs-border hover:bg-gcs-muted-text/40"
                                    }`}
                                />
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={next}
                            aria-label="Next testimonial"
                            className="flex h-12 w-12 items-center justify-center rounded-full border border-gcs-border bg-white text-gcs-foreground shadow-sm transition-all hover:bg-gcs-primary hover:text-white active:scale-90"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="mx-auto mt-20 w-full max-w-3xl">
                    <div className="rounded-3xl border border-gcs-border/80 bg-white p-6 shadow-sm sm:p-8">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gcs-muted-text">
                            Leave a review
                        </p>
                        <h3 className="mt-3 text-xl font-semibold tracking-tight text-gcs-foreground sm:text-2xl">
                            Share your experience with GCS
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-gcs-muted-text">
                            Your testimonial will appear on the homepage after submission.
                        </p>

                        {submitErr ? (
                            <p className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">{submitErr}</p>
                        ) : null}
                        {submitOk ? (
                            <p className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{submitOk}</p>
                        ) : null}

                        <form
                            className="mt-6 grid gap-4 sm:grid-cols-2"
                            onSubmit={async (e) => {
                                e.preventDefault();
                                setSubmitErr(null);
                                setSubmitOk(null);
                                setSubmitting(true);
                                try {
                                    const res = await fetch("/api/public/testimonials", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                            name: form.name,
                                            role: form.role,
                                            email: form.email,
                                            phone: form.phone || undefined,
                                            quote: form.quote,
                                        }),
                                    });
                                    const body = (await res.json().catch(() => null)) as { error?: unknown } | null;
                                    if (!res.ok) {
                                        const msg =
                                            typeof body?.error === "string"
                                                ? body.error
                                                : "Could not submit your testimonial. Please try again.";
                                        setSubmitErr(msg);
                                        return;
                                    }
                                    setSubmitOk("Thanks — your testimonial has been sent for review.");
                                    setForm({ name: "", role: "", email: "", phone: "", quote: "" });
                                } finally {
                                    setSubmitting(false);
                                }
                            }}
                        >
                            <label className="text-left text-sm font-medium text-slate-700">
                                Name
                                <input
                                    required
                                    value={form.name}
                                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-gcs-foreground shadow-sm outline-none transition-shadow placeholder:text-slate-400 focus:border-gcs-primary focus:ring-2 focus:ring-gcs-primary/15"
                                    placeholder="Your name"
                                />
                            </label>
                            <label className="text-left text-sm font-medium text-slate-700">
                                Role / affiliation
                                <input
                                    required
                                    value={form.role}
                                    onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-gcs-foreground shadow-sm outline-none transition-shadow placeholder:text-slate-400 focus:border-gcs-primary focus:ring-2 focus:ring-gcs-primary/15"
                                    placeholder="e.g. Lecturer, University of Ghana"
                                />
                            </label>
                            <label className="text-left text-sm font-medium text-slate-700">
                                Email
                                <input
                                    required
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-gcs-foreground shadow-sm outline-none transition-shadow placeholder:text-slate-400 focus:border-gcs-primary focus:ring-2 focus:ring-gcs-primary/15"
                                    placeholder="you@example.com"
                                />
                            </label>
                            <label className="text-left text-sm font-medium text-slate-700">
                                Phone (optional)
                                <input
                                    value={form.phone}
                                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-gcs-foreground shadow-sm outline-none transition-shadow placeholder:text-slate-400 focus:border-gcs-primary focus:ring-2 focus:ring-gcs-primary/15"
                                    placeholder="+233…"
                                />
                            </label>
                            <label className="sm:col-span-2 text-left text-sm font-medium text-slate-700">
                                Testimonial
                                <textarea
                                    required
                                    rows={5}
                                    value={form.quote}
                                    onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))}
                                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-gcs-foreground shadow-sm outline-none transition-shadow placeholder:text-slate-400 focus:border-gcs-primary focus:ring-2 focus:ring-gcs-primary/15"
                                    placeholder="Write your review..."
                                />
                            </label>
                            <div className="sm:col-span-2 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="inline-flex items-center justify-center rounded-full bg-gcs-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gcs-primary-hover disabled:opacity-60"
                                >
                                    {submitting ? "Submitting…" : "Submit testimonial"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
}

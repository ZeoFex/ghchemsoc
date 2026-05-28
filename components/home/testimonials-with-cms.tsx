import { Testimonials, type TestimonialItem } from "@/components/home/testimonials";
import { getPublishedTestimonials } from "@/lib/cms-queries";

export async function TestimonialsWithCms() {
  const rows = await getPublishedTestimonials();
  const testimonials: TestimonialItem[] = rows.map((t) => ({
    id: t.id,
    name: t.name,
    role: t.role,
    quote: t.quote,
    imageUrl: t.media?.url ?? null,
    imageAlt: t.media?.alt ?? null,
  }));

  if (testimonials.length === 0) return null;
  return <Testimonials testimonials={testimonials} />;
}


export const TESTIMONIAL_SEED = [
  {
    sortOrder: 0,
    published: true,
    name: "Prof. Kwame Mensah",
    role: "Professor of Chemistry · University of Ghana",
    imageUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop",
    imageAlt: "Testimonial portrait",
    quote:
      "GCS has been indispensable for building bridges between departments and industry. The society elevates standards for teaching and research chemistry nationwide.",
  },
  {
    sortOrder: 1,
    published: true,
    name: "Dr. Ama Serwaa Osei",
    role: "Principal Scientist · Ghana Standards Authority",
    imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop",
    imageAlt: "Testimonial portrait",
    quote:
      "Through workshops and technical programmes, GCS gives practitioners access to cutting-edge practice and a network of peers we can rely on for real-world problems.",
  },
  {
    sortOrder: 2,
    published: true,
    name: "Kofi Owusu-Ankomah",
    role: "PhD Researcher · Catalysis & Green Chemistry",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
    imageAlt: "Testimonial portrait",
    quote:
      "Presenting at the annual symposium and connecting with mentors through the society opened doors I would not have found on my own. It is the hub for early-career chemists.",
  },
  {
    sortOrder: 3,
    published: true,
    name: "Efua Brookman",
    role: "R&D Lead · Pharmaceutical Manufacturing",
    imageUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200&auto=format&fit=crop",
    imageAlt: "Testimonial portrait",
    quote:
      "The Ghana Chemical Society represents the rigour and collaboration our sector needs. Membership signals commitment to ethics, safety, and scientific excellence.",
  },
] as const;

export type TestimonialPublic = {
  id: string;
  sortOrder: number;
  published: boolean;
  name: string;
  role: string;
  quote: string;
  media: { url: string; alt: string | null } | null;
};

export function testimonialsPublicFallback(): TestimonialPublic[] {
  return TESTIMONIAL_SEED.filter((t) => t.published).map((t, i) => ({
    id: `testimonial-fallback-${i}`,
    sortOrder: t.sortOrder,
    published: t.published,
    name: t.name,
    role: t.role,
    quote: t.quote,
    media: t.imageUrl ? { url: t.imageUrl, alt: t.imageAlt } : null,
  }));
}


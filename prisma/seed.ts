import { prisma } from "../lib/prisma";
import { HOMEPAGE_EXPLORE_DEFAULTS as HX } from "../lib/homepage-explore-defaults";
import { HOMEPAGE_EVENTS_DEFAULTS as HE } from "../lib/homepage-events-defaults";
import {
  HOMEPAGE_PARTNERSHIPS_DEFAULTS as HP,
  PARTNERSHIP_CARD_SEEDS,
} from "../lib/homepage-partnerships-defaults";
import { Prisma } from "@prisma/client";
import { MEMBER_BENEFIT_DEFAULTS, memberPortalCreateData } from "../lib/member-portal";

const DEFAULT_EVENT_REGISTRATION_FORM: Prisma.InputJsonValue = [
  { id: "full_name", label: "Full name", type: "short_text", required: true, sortOrder: 0 },
  { id: "email", label: "Email", type: "email", required: true, sortOrder: 1 },
  { id: "phone", label: "Phone", type: "tel", required: false, sortOrder: 2 },
  { id: "institution", label: "Institution / affiliation", type: "short_text", required: true, sortOrder: 3 },
  {
    id: "category",
    label: "Attendee category",
    type: "radio",
    required: true,
    sortOrder: 4,
    options: ["Student", "Professional", "Industry partner", "Other"],
  },
  {
    id: "interests",
    label: "Topics of interest",
    type: "checkbox",
    required: false,
    sortOrder: 5,
    description: "Select all that apply",
    options: ["Green chemistry", "Teaching labs", "Industry partnerships", "Student networking"],
  },
  {
    id: "notes",
    label: "Dietary or accessibility notes",
    type: "long_text",
    required: false,
    sortOrder: 6,
  },
];

async function main() {
  await prisma.heroSlide.deleteMany();
  await prisma.societyEvent.deleteMany();
  await prisma.contactInquiry.deleteMany();
  await prisma.aboutSection.deleteMany();
  await prisma.executive.deleteMany();
  await prisma.joinStep.deleteMany();
  await prisma.newsItem.deleteMany();
  await prisma.publicationArticle.deleteMany();
  await prisma.publication.deleteMany();
  await prisma.joinPageHeader.deleteMany();
  await prisma.homepageExploreSettings.deleteMany();
  await prisma.homepageEventsSettings.deleteMany();
  await prisma.partnershipCard.deleteMany();
  await prisma.homepagePartnershipsSettings.deleteMany();
  await prisma.membershipApplication.deleteMany();
  await prisma.memberBenefit.deleteMany();
  await prisma.memberPortalSettings.deleteMany();
  await prisma.contactSettings.deleteMany();
  await prisma.media.deleteMany();

  const heroImg = await prisma.media.create({
    data: {
      url: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1600&q=80",
      publicId: null,
      alt: "Laboratory research",
    },
  });

  await prisma.heroSlide.create({
    data: {
      sortOrder: 0,
      published: true,
      mediaId: heroImg.id,
      imageAlt: "Laboratory research",
      eyebrow: "Ghana Chemical Society",
      headlineLine1: "Chemistry that serves",
      headlineLine2: "Ghana and the world",
      description: "Advancing education, research, and collaboration.",
      tags: ["Education", "Research"],
      highlights: ["National voice for chemical sciences"],
      ctaLabel: "Become a member",
      ctaHref: "/login",
      statValue: "40+",
      statLabel: "Years of impact",
    },
  });

  const joinHero = await prisma.media.create({
    data: {
      url: "/Hero/hero.jpg",
      publicId: null,
      alt: "Chemists and laboratory research",
    },
  });

  await prisma.joinPageHeader.create({
    data: {
      key: "join_page_header",
      eyebrow: "Membership",
      title: "How will I join?",
      subtitle: "One clear path—laid out in four moves beside a snapshot of the community you're joining.",
      mediaId: joinHero.id,
    },
  });

  const stepData = [
    {
      sortOrder: 0,
      stepKey: "01",
      title: "Review categories",
      description:
        "Compare student, professional, and corporate tiers—choose what matches your role and institution.",
    },
    {
      sortOrder: 1,
      stepKey: "02",
      title: "Apply online",
      description:
        "Submit the membership form with your affiliation, qualifications, and preferred contact channel.",
    },
    {
      sortOrder: 2,
      stepKey: "03",
      title: "Verification & dues",
      description:
        "The secretariat reviews your application. When approved, pay annual dues via the secure link provided.",
    },
    {
      sortOrder: 3,
      stepKey: "04",
      title: "You're in",
      description:
        "Get your confirmation, unlock the member space, and join events, publications, and committees.",
    },
  ] as const;

  for (const s of stepData) {
    await prisma.joinStep.create({ data: { ...s, published: true } });
  }

  const mMission = await prisma.media.create({
    data: {
      url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&q=80",
      publicId: null,
      alt: "Collaboration in science",
    },
  });

  const mGovernance = await prisma.media.create({
    data: {
      url: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200&q=80",
      publicId: null,
      alt: "Leadership meeting",
    },
  });

  await prisma.aboutSection.createMany({
    data: [
      {
        sortOrder: 0,
        published: true,
        title: "Our mission",
        subtitle: "Chemistry in service of Ghana",
        body: "We advance chemical education, research integrity, and evidence-based policy dialogue—linking universities, industry, and public institutions.",
        layout: "default",
        mediaId: mMission.id,
      },
      {
        sortOrder: 1,
        published: true,
        title: "What we do",
        subtitle: null,
        body: "Conferences, publications, outreach to schools, and professional networks that strengthen the chemical sciences nationwide.",
        layout: "wide",
        mediaId: null,
      },
      {
        sortOrder: 2,
        published: true,
        title: "Governance & leadership",
        subtitle: "Executive oversight",
        body: "The society is guided by elected officers who set policy, steward membership services, and represent Ghana’s chemical community nationally and internationally.",
        layout: "default",
        mediaId: mGovernance.id,
      },
    ],
  });

  const execPhotos = await Promise.all([
    prisma.media.create({
      data: {
        url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&q=80",
        publicId: null,
        alt: "President portrait",
      },
    }),
    prisma.media.create({
      data: {
        url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80",
        publicId: null,
        alt: "Vice President portrait",
      },
    }),
    prisma.media.create({
      data: {
        url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&q=80",
        publicId: null,
        alt: "General Secretary portrait",
      },
    }),
    prisma.media.create({
      data: {
        url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800&q=80",
        publicId: null,
        alt: "Treasurer portrait",
      },
    }),
  ]);

  await prisma.executive.createMany({
    data: [
      {
        sortOrder: 0,
        published: true,
        name: "Prof. Kwame Asante",
        role: "President",
        bio: "Leads society strategy, international representation, and partnerships with universities and industry across Ghana.",
        mediaId: execPhotos[0].id,
      },
      {
        sortOrder: 1,
        published: true,
        name: "Dr. Ama Mensah",
        role: "Vice President",
        bio: "Oversees programmes, conferences, and professional development for members in academia and the private sector.",
        mediaId: execPhotos[1].id,
      },
      {
        sortOrder: 2,
        published: true,
        name: "Mr. Kofi Boateng",
        role: "General Secretary",
        bio: "Coordinates governance, membership records, and liaison with institutional partners and government stakeholders.",
        mediaId: execPhotos[2].id,
      },
      {
        sortOrder: 3,
        published: true,
        name: "Dr. Efua Osei",
        role: "Treasurer",
        bio: "Manages society finances, grants, and sponsorships that support outreach and annual scientific meetings.",
        mediaId: execPhotos[3].id,
      },
    ],
  });

  const nImg = await prisma.media.create({
    data: {
      url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1600&q=80",
      publicId: null,
      alt: "Conference auditorium",
    },
  });

  await prisma.newsItem.create({
    data: {
      slug: "national-chemistry-summit-2026",
      title: "GCS welcomes delegates for the national chemistry summit in Accra",
      excerpt:
        "Plenary sessions on sustainable synthesis, teaching innovation, and strengthening links between universities and chemical industry partners across Ghana.",
      body:
        "<p>Delegates from universities, industry, and government agencies gathered in Accra for three days of plenary sessions, poster presentations, and policy dialogue on the future of chemistry education and research in Ghana.</p><p><strong>Programme highlights</strong> included panels on green synthesis, laboratory safety standards, and partnerships between academia and the private sector.</p>",
      authorName: "Communications Office",
      authorRole: "Ghana Chemical Society",
      date: new Date("2026-05-12T10:00:00Z"),
      published: true,
      sortOrder: 0,
      mediaId: nImg.id,
    },
  });

  const pImg = await prisma.media.create({
    data: {
      url: "https://images.unsplash.com/photo-1532619675605-1ede6c778ed9?auto=format&fit=crop&w=1600&q=80",
      publicId: null,
      alt: "Chemistry journals on a desk",
    },
  });

  const pub = await prisma.publication.create({
    data: {
      title: "Vol. 51 No. 2 (2026): J. Chem. Soc. Nigeria",
      journalTitle: "Journal of the Chemical Society of Nigeria",
      meta: "Quarterly",
      description:
        "Original research and reviews on sustainable synthesis, analytical methods adapted for Ghanaian contexts, and education-focused laboratory innovations.",
      issue: "Vol. 51 · No. 2",
      href: null,
      published: true,
      featured: true,
      publishedAt: new Date("2026-04-30"),
      sortOrder: 0,
      readerEmails: ["readers@ghanachemicalsociety.org"],
      authorEmails: ["authors@ghanachemicalsociety.org", "editorial@ghanachemicalsociety.org"],
      mediaId: pImg.id,
    },
  });

  await prisma.publicationArticle.createMany({
    data: [
      {
        publicationId: pub.id,
        sortOrder: 0,
        title: "POTENTIALS OF Hura crepitans (LINN) AND RUBBER SEED OILS FOR INDUSTRIAL APPLICATIONS",
        authors: "A. Awosanya, C. O. Eromosele, A. A. Lasisi, R. N. Ugbaja",
        pdfHref: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      },
      {
        publicationId: pub.id,
        sortOrder: 1,
        title: "Green extraction pathways for underutilised plant oils in West Africa",
        authors: "K. Mensah, P. Osei, D. Boateng",
        pdfHref: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      },
    ],
  });

  await prisma.contactSettings.create({
    data: {
      id: "contact",
      eyebrow: "Contact",
      headline: "Reach the Ghana Chemical Society",
      subtext:
        "Membership, partnerships, student chapters, and media enquiries — the secretariat coordinates responses across our networks.",
      cards: [
        { icon: "phone", title: "Phone", value: "+233 30 000 0000", description: "Secretariat · weekdays 09:00–17:00 GMT" },
        { icon: "mail", title: "Email", value: "secretariat@ghanachemicalsociety.org", description: "We aim to reply within a few business days" },
        { icon: "map", title: "Location", value: "Accra, Ghana", description: "National coordinating office" },
        { icon: "clock", title: "Hours", value: "09:00 – 17:00 GMT", description: "Monday to Friday" },
      ],
    },
  });

  const evFeaturedImg = await prisma.media.create({
    data: {
      url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1600&q=80",
      publicId: null,
      alt: "Conference auditorium",
    },
  });

  await prisma.societyEvent.create({
    data: {
      featured: true,
      published: true,
      sortOrder: 0,
      title: "National chemistry summit",
      excerpt:
        "Plenary talks, poster sessions, and industry panels on sustainable synthesis, teaching labs, and strengthening university–industry links.",
      body:
        "The National Chemistry Summit brings together educators, postgraduate researchers, and industry partners for three days of plenaries, contributed talks, and poster sessions.\n\nExpect dedicated tracks on green synthesis, analytical method development suited to local supply chains, and practical ideas for revitalising teaching laboratories. Student chapters host a networking breakfast, and the society AGM is scheduled on the final afternoon.\n\nRegistration details and the full scientific programme will be confirmed by the secretariat. Members receive priority booking and discounted rates where applicable.",
      startDate: new Date("2026-06-18T09:00:00Z"),
      endDate: new Date("2026-06-20T17:00:00Z"),
      timeLabel: "09:00 – 17:00 GMT",
      location: "Accra International Conference Centre",
      href: "/news/national-chemistry-summit-2026",
      badge: "Flagship",
      mediaId: evFeaturedImg.id,
      registrationFormFields: DEFAULT_EVENT_REGISTRATION_FORM,
    },
  });

  const evWorkshopImg = await prisma.media.create({
    data: {
      url: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=900&q=80",
      publicId: null,
      alt: "Laboratory glassware",
    },
  });

  await prisma.societyEvent.create({
    data: {
      featured: false,
      published: true,
      sortOrder: 1,
      title: "Green chemistry workshop",
      excerpt: "Hands-on sessions on safer solvents, waste minimisation, and teaching demonstrations for secondary schools.",
      body:
        "This one-day workshop is designed for lecturers, lab coordinators, and senior secondary teachers who want to refresh practical chemistry with safer, lower-waste approaches.\n\nMorning sessions cover solvent selection, micro-scale techniques, and simple risk-reduction checklists you can take back to your own lab. After lunch, facilitators run rotating teaching demonstrations you can adapt for classrooms and outreach.\n\nPlaces are limited to keep bench work manageable. Bring a lab coat; all other materials are supplied on site.",
      startDate: new Date("2026-07-08T10:00:00Z"),
      endDate: new Date("2026-07-08T15:00:00Z"),
      timeLabel: "10:00 – 15:00 GMT",
      location: "KNUST, Kumasi",
      href: "#",
      badge: null,
      mediaId: evWorkshopImg.id,
      registrationFormFields: DEFAULT_EVENT_REGISTRATION_FORM,
    },
  });

  await prisma.membershipApplication.createMany({
    data: [
      {
        status: "payment_submitted",
        fullName: "Dr. Ama Mensah",
        email: "ama.mensah@example.edu.gh",
        phone: "+233 24 111 2233",
        institution: "University of Ghana",
        jobTitle: "Senior Lecturer",
        highestDegree: "PhD Chemistry",
        declarationLegalName: "Mensah Ama",
        declarationDate: "2026-05-10",
        amountGhs: 250,
        paymentStatus: "submitted",
        paymentMethod: "mobile_money_mtn",
        paystackReference: "GCS-MEM-DEMO-PENDING-001",
        payerPhone: "0241112233",
        paidAt: new Date("2026-05-10T14:30:00Z"),
        read: false,
      },
      {
        status: "approved",
        fullName: "Felix Owusu",
        email: "felixo6996@gmail.com",
        phone: "+233 20 555 0199",
        institution: "KNUST",
        jobTitle: "Research Scientist",
        highestDegree: "MSc",
        declarationLegalName: "Owusu Felix",
        declarationDate: "2026-04-01",
        amountGhs: 250,
        paymentStatus: "verified",
        paymentMethod: "bank_transfer",
        paystackReference: "GCS-MEM-DEMO-APPROVED-002",
        payerPhone: "0205550199",
        paymentNote: "TRF-DEMO-20260401",
        paidAt: new Date("2026-04-01T09:00:00Z"),
        memberId: "GCS-26-A1B2C3D4",
        approvedAt: new Date("2026-04-02T11:00:00Z"),
        read: true,
      },
    ],
  });

  await prisma.homepageExploreSettings.create({
    data: {
      id: "homepage_explore",
      missionEyebrow: HX.missionEyebrow,
      headlineLine1: HX.headlineLine1,
      headlineLine2: HX.headlineLine2,
      aboutEyebrow: HX.aboutEyebrow,
      aboutBody: HX.aboutBody,
      imageBadge: HX.imageBadge,
      imageHoverQuote: HX.imageHoverQuote,
      locationLabel: HX.locationLabel,
      secondaryBadge: HX.secondaryBadge,
      bottomBlurb: HX.bottomBlurb,
    },
  });

  const eventsSpotlightImg = await prisma.media.create({
    data: {
      url: HE.fallbackImageUrl,
      publicId: null,
      alt: HE.fallbackImageAlt,
    },
  });

  await prisma.homepagePartnershipsSettings.create({
    data: {
      id: "homepage_partnerships",
      eyebrow: HP.eyebrow,
      title: HP.title,
      searchPlaceholder: HP.searchPlaceholder,
      showSearch: HP.showSearch,
      ctaLabel: HP.ctaLabel,
      ctaHref: HP.ctaHref,
      footerNote: HP.footerNote,
    },
  });

  for (const card of PARTNERSHIP_CARD_SEEDS) {
    const img = await prisma.media.create({
      data: { url: card.imageUrl, publicId: null, alt: card.imageAlt },
    });
    await prisma.partnershipCard.create({
      data: {
        sortOrder: card.sortOrder,
        tag: card.tag,
        title: card.title,
        accentPill: card.accentPill,
        href: card.href,
        published: true,
        mediaId: img.id,
      },
    });
  }

  await prisma.memberPortalSettings.create({ data: memberPortalCreateData() });
  for (let i = 0; i < MEMBER_BENEFIT_DEFAULTS.length; i++) {
    const b = MEMBER_BENEFIT_DEFAULTS[i]!;
    await prisma.memberBenefit.create({
      data: {
        section: b.section,
        title: b.title,
        description: b.description,
        body: b.body,
        href: b.href,
        iconKey: b.iconKey,
        hint: b.hint,
        sortOrder: i,
        published: true,
      },
    });
  }

  await prisma.homepageEventsSettings.create({
    data: {
      id: "homepage_events",
      spotlightEnabled: HE.spotlightEnabled,
      sectionEyebrow: HE.sectionEyebrow,
      sectionTitle: HE.sectionTitle,
      spotlightEyebrow: HE.spotlightEyebrow,
      headline: HE.headline,
      body: HE.body,
      metaLine: HE.metaLine,
      imagePosition: HE.imagePosition,
      ctaLabel: HE.ctaLabel,
      ctaHref: HE.ctaHref,
      imageBadge: HE.imageBadge,
      imageMediaId: eventsSpotlightImg.id,
    },
  });

  console.log("Seed complete.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });

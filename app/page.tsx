import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Ghana Chemical Society (ghchemsoc) | Official GCS Website",
  absoluteTitle: true,
  description:
    "Official website of the Ghana Chemical Society (ghchemsoc, GCS). Discover events, publications, membership, and chemistry resources in Ghana.",
  path: "/",
});
import { HeroWithCms } from "@/components/home/hero-with-cms";
import { ExploreSection } from "@/components/home/explore-section";
import { HomeEventsRow } from "@/components/home/home-events-row";
import { JoinWithCms } from "@/components/home/join-with-cms";
import { NewsUpdatesSection } from "@/components/home/news-updates-section";
import { ScienceStrip } from "@/components/home/science-strip";
import { PartnershipsSection } from "@/components/home/partnerships-section";
import { TestimonialsWithCms } from "@/components/home/testimonials-with-cms";
import { ContactFooter } from "@/components/home/contact-footer";
import { getHomepageEventsForPublic, getHomepagePartnershipsForPublic, getPublishedSocietyEvents } from "@/lib/cms-queries";
import { getHomeNewsUpdatesData } from "@/lib/home-news-updates";

export default async function Home() {
  const [events, newsUpdates, eventsSection, partnerships] = await Promise.all([
    getPublishedSocietyEvents(),
    getHomeNewsUpdatesData(),
    getHomepageEventsForPublic(),
    getHomepagePartnershipsForPublic(),
  ]);

  return (
    <main className="min-h-screen bg-white">
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }])} />
      <Header />
      <HeroWithCms />
      <ExploreSection />
      <HomeEventsRow events={events} settings={eventsSection} />
      <JoinWithCms />
      <NewsUpdatesSection data={newsUpdates} />
      <ScienceStrip />
      <PartnershipsSection data={partnerships} />
      <TestimonialsWithCms />
      <ContactFooter />
    </main>
  );
}

import { JsonLd } from "@/components/seo/json-ld";
import { getContactSettings, getSiteFooterForPublic } from "@/lib/cms-queries";
import {
  extractContactEmail,
  extractContactPhone,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/seo";

export async function GlobalJsonLd() {
  const [footer, contact] = await Promise.all([getSiteFooterForPublic(), getContactSettings()]);

  const sameAs = footer.socialLinks
    .map((link) => link.href.trim())
    .filter((href) => /^https?:\/\//i.test(href));

  const email = extractContactEmail(contact?.cards);
  const telephone = extractContactPhone(contact?.cards);

  return (
    <JsonLd
      data={[
        organizationJsonLd({ sameAs, email, telephone }),
        websiteJsonLd(),
      ]}
    />
  );
}

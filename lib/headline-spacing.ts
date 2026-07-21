/**
 * Fix CMS headlines that arrive glued together
 * (e.g. "AdvancingChemicalSciencestoTransformGhanaandBeyond").
 */
export function normalizeHeadlineSpacing(text: string): string {
  if (!text?.trim()) return "";

  let t = text.replace(/\s+/g, " ").trim();

  // PascalCase / camelCase: AdvancingChemical → Advancing Chemical
  t = t.replace(/([a-z])([A-Z])/g, "$1 $2");
  // Acronym + word: GCSTransform → GCS Transform
  t = t.replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");

  // Glued small words left after camelCase split (Sciencesto → Sciences to)
  t = t.replace(/([a-z])to(\s+[A-Z])/g, "$1 to$2");
  t = t.replace(/([a-z])and(\s+[A-Z])/g, "$1 and$2");
  t = t.replace(/([a-z])for(\s+[A-Z])/g, "$1 for$2");
  t = t.replace(/([a-z])of(\s+[A-Z])/g, "$1 of$2");
  t = t.replace(/([a-z])in(\s+[A-Z])/g, "$1 in$2");
  t = t.replace(/([a-z])to([A-Z])/g, "$1 to $2");
  t = t.replace(/([a-z])and([A-Z])/g, "$1 and $2");
  t = t.replace(/([a-z])for([A-Z])/g, "$1 for $2");

  // Homepage explore legacy patterns
  t = t.replace(/advancing\s*chemistry\s*for/gi, "Advancing chemistry for");
  t = t.replace(/advancingchemistryfor/gi, "Advancing chemistry for");
  t = t.replace(/chemistry\s*for/gi, "chemistry for");
  t = t.replace(/chemistryfor/gi, "chemistry for");
  t = t.replace(/('s)([A-Za-z])/g, "$1 $2");
  t = t.replace(/,(\S)/g, ", $1");
  t = t.replace(/,and/gi, ", and");
  t = t.replace(/\band([A-Za-z])/g, "and $1");
  t = t.replace(
    /universities,\s*laboratories,\s*and\s*industries/gi,
    "universities, laboratories, and industries"
  );

  return t.replace(/\s+/g, " ").trim();
}

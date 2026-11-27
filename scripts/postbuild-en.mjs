// Generates dist/en/index.html: the same single-page app, served at /en with an
// English document head (title, description, social tags, canonical, JSON-LD) so
// search engines and link previews see the English page before any JavaScript runs.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const DIST = 'dist';
const ORIGIN = 'https://www.elattar.site';

const EN_TITLE =
  'Dr. Mohamed El Sayed El Attar | Internal Medicine, Intensive Care & Critical Care Specialist – Al-Husseiniya, Sharqia';
const EN_DESCRIPTION =
  'Dr. Mohamed El Sayed El Attar (Dr. Mohammed Elsayed Elattar), specialist in general internal medicine, intensive care and critical cases. Fellowship in internal medicine and intensive care, 8 years of experience, Al-Azhar University graduate. Clinic: Kobri Wahid El-Salhia, in front of the car park, Bahr El-Baqar, Al-Husseiniya, Sharqia, Egypt. Open Saturday to Thursday 1:00 PM – 9:00 PM, Friday 4:00 PM – 10:00 PM. Book your appointment online.';
const EN_KEYWORDS =
  'Dr Mohamed El Sayed El Attar, Dr Mohammed Elsayed Elattar, internal medicine doctor Al Husseiniya, intensive care specialist Sharqia, internal medicine clinic Egypt, diabetes and blood pressure clinic, critical care doctor Ismailia, elattar clinic';

const EN_JSONLD = `    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "@id": "${ORIGIN}/en#website",
          "url": "${ORIGIN}/en",
          "name": "Dr. Mohamed El Sayed El Attar Clinic",
          "alternateName": ["Dr. Mohammed Elsayed Elattar", "Elattar Clinic"],
          "inLanguage": "en"
        },
        {
          "@type": "WebPage",
          "@id": "${ORIGIN}/en#webpage",
          "url": "${ORIGIN}/en",
          "name": ${JSON.stringify(EN_TITLE)},
          "description": ${JSON.stringify(EN_DESCRIPTION)},
          "isPartOf": { "@id": "${ORIGIN}/en#website" },
          "about": { "@id": "${ORIGIN}/#doctor" },
          "primaryImageOfPage": { "@type": "ImageObject", "url": "${ORIGIN}/brand/dr-elattar-medical.jpg", "width": 1024, "height": 1024 },
          "inLanguage": "en"
        },
        {
          "@type": "MedicalBusiness",
          "@id": "${ORIGIN}/#clinic",
          "name": "Dr. Mohamed El Sayed El Attar Clinic",
          "alternateName": "عيادة الدكتور محمد السيد العطار",
          "image": "${ORIGIN}/brand/clinic-logo.png",
          "logo": "${ORIGIN}/brand/clinic-logo.png",
          "url": "${ORIGIN}/en",
          "telephone": ["+201060918977", "+201007347945"],
          "priceRange": "$$",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Kobri Wahid El-Salhia – in front of the car park – Bahr El-Baqar",
            "addressLocality": "Al-Husseiniya Center",
            "addressRegion": "Al-Sharqia Governorate",
            "addressCountry": "EG"
          },
          "openingHoursSpecification": [
            {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
              "opens": "13:00",
              "closes": "21:00"
            },
            {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": "Friday",
              "opens": "16:00",
              "closes": "22:00"
            }
          ],
          "hasMap": "https://maps.app.goo.gl/ST9qs3kYt1nFxiGn8"
        },
        {
          "@type": "Physician",
          "@id": "${ORIGIN}/#doctor",
          "url": "${ORIGIN}/en",
          "image": "${ORIGIN}/brand/dr-elattar-medical.jpg",
          "name": "Dr. Mohamed El Sayed El Attar",
          "alternateName": ["Dr. Mohammed Elsayed Elattar", "الدكتور محمد السيد العطار"],
          "jobTitle": "Specialist in General Internal Medicine, Intensive Care and Critical Cases",
          "description": "Specialist in general internal medicine, intensive care and critical cases; graduate of the Faculty of Medicine, Al-Azhar University in Cairo; fellowship in general internal medicine, intensive care and critical cases.",
          "medicalSpecialty": [
            "InternalMedicine",
            "CriticalCare",
            "Cardiology",
            "Pulmonology",
            "InfectiousDiseases"
          ],
          "worksFor": { "@id": "${ORIGIN}/#clinic" },
          "alumniOf": {
            "@type": "EducationalOrganization",
            "name": "Faculty of Medicine – Al-Azhar University, Cairo"
          }
        }
      ]
    }
    </script>`;

const mustReplace = (html, pattern, replacement, label) => {
  if (!pattern.test(html)) {
    throw new Error(`postbuild-en: could not find ${label} in dist/index.html`);
  }
  return html.replace(pattern, replacement);
};

const source = readFileSync(join(DIST, 'index.html'), 'utf8');
let html = source;

html = mustReplace(html, /<html lang="ar" dir="rtl"/, '<html lang="en" dir="ltr"', 'the <html> element');
html = mustReplace(html, /<title>[\s\S]*?<\/title>/, `<title>${EN_TITLE}</title>`, 'the <title> tag');
html = mustReplace(
  html,
  /<meta name="title" content="[^"]*" \/>/,
  `<meta name="title" content="${EN_TITLE}" />`,
  'the title meta tag',
);
html = mustReplace(
  html,
  /<meta name="description" content="[^"]*" \/>/,
  `<meta name="description" content="${EN_DESCRIPTION}" />`,
  'the description meta tag',
);
html = mustReplace(
  html,
  /<meta name="keywords" content="[^"]*" \/>/,
  `<meta name="keywords" content="${EN_KEYWORDS}" />`,
  'the keywords meta tag',
);
html = mustReplace(
  html,
  /<link rel="canonical" href="[^"]*" \/>/,
  `<link rel="canonical" href="${ORIGIN}/en" />`,
  'the canonical link',
);
html = mustReplace(
  html,
  /<meta property="og:url" content="[^"]*" \/>/,
  `<meta property="og:url" content="${ORIGIN}/en" />`,
  'og:url',
);
html = mustReplace(
  html,
  /<meta property="og:title" content="[^"]*" \/>/,
  `<meta property="og:title" content="${EN_TITLE}" />`,
  'og:title',
);
html = mustReplace(
  html,
  /<meta property="og:description" content="[^"]*" \/>/,
  `<meta property="og:description" content="${EN_DESCRIPTION}" />`,
  'og:description',
);
html = mustReplace(
  html,
  /<meta property="og:locale" content="[^"]*" \/>/,
  '<meta property="og:locale" content="en_US" />',
  'og:locale',
);
html = mustReplace(
  html,
  /<meta property="og:site_name" content="[^"]*" \/>/,
  '<meta property="og:site_name" content="Dr. Mohamed El Sayed El Attar Clinic" />',
  'og:site_name',
);
html = mustReplace(
  html,
  /<meta property="twitter:title" content="[^"]*" \/>/,
  `<meta property="twitter:title" content="${EN_TITLE}" />`,
  'twitter:title',
);
html = mustReplace(
  html,
  /<meta property="twitter:description" content="[^"]*" \/>/,
  `<meta property="twitter:description" content="${EN_DESCRIPTION}" />`,
  'twitter:description',
);
html = mustReplace(
  html,
  /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
  EN_JSONLD,
  'the JSON-LD block',
);

// Guard against an Arabic <title> leaking through a changed template.
if (!html.includes(EN_TITLE)) throw new Error('postbuild-en: English title missing from the generated page');

mkdirSync(dirname(join(DIST, 'en', 'index.html')), { recursive: true });
writeFileSync(join(DIST, 'en', 'index.html'), html, 'utf8');
console.log('postbuild-en: wrote dist/en/index.html');

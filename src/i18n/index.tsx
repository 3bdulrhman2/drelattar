import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { EN_TEXT, localizeContent } from './en';
import { useContent } from '../context/ContentContext';
import type { AppContentState } from '../types';

export type Lang = 'ar' | 'en';

export const SITE_ORIGIN = 'https://www.elattar.site';

interface LanguageContextValue {
  lang: Lang;
  isEn: boolean;
  dir: 'rtl' | 'ltr';
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  /** Translate a fixed interface string: t('عربي') uses the English dictionary. */
  t: (ar: string, en?: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const HOME_SEO = {
  ar: {
    title: 'عيادة الدكتور محمد السيد العطار | أخصائي الباطنة العامة والعناية المركزة والحالات الحرجة',
    description:
      'عيادة الدكتور محمد السيد العطار، أخصائي الباطنة العامة والعناية المركزة والحالات الحرجة، زمالة الباطنة والعناية المركزة وخبرة 8 سنوات. كوبري واحد الصالحية، بحر البقر، مركز الحسينية، الشرقية. احجز موعدك أونلاين.',
    keywords:
      'الدكتور محمد السيد العطار, دكتور باطنة, عناية مركزة, حالات حرجة, عيادة باطنة الحسينية, كوبري واحد الصالحية, بحر البقر, طبيب باطنة الشرقية, علاج السكري والضغط',
    locale: 'ar_EG',
    ogSiteName: 'الدكتور محمد السيد العطار',
  },
  en: {
    title:
      'Dr. Mohamed El Sayed El Attar | Internal Medicine, Intensive Care & Critical Care Specialist – Al-Husseiniya, Sharqia',
    description:
      'Dr. Mohamed El Sayed El Attar (Dr. Mohammed Elsayed Elattar), specialist in general internal medicine, intensive care and critical cases. Fellowship in internal medicine and intensive care, 8 years of experience, Al-Azhar University graduate. Clinic: Kobri Wahid El-Salhia, in front of the car park, Bahr El-Baqar, Al-Husseiniya, Sharqia, Egypt. Open Saturday to Thursday 1:00 PM – 9:00 PM, Friday 4:00 PM – 10:00 PM. Book your appointment online.',
    keywords:
      'Dr Mohamed El Sayed El Attar, Dr Mohammed Elsayed Elattar, internal medicine doctor Al Husseiniya, intensive care specialist Sharqia, internal medicine clinic Egypt, diabetes and blood pressure clinic, critical care doctor Ismailia, elattar clinic',
    locale: 'en_US',
    ogSiteName: 'Dr. Mohamed El Sayed El Attar Clinic',
  },
} as const;

const normalizePath = (path: string) => {
  const lower = path.toLowerCase();
  if (lower === '/en') return '/en';
  if (lower.startsWith('/en/')) return lower.slice(3) || '/';
  return lower;
};

const detectLang = (): Lang => {
  if (typeof window === 'undefined') return 'ar';
  const path = window.location.pathname.toLowerCase();
  return path === '/en' || path.startsWith('/en/') ? 'en' : 'ar';
};

const isHomePath = () => {
  if (typeof window === 'undefined') return true;
  const path = window.location.pathname.toLowerCase();
  return path === '/' || path === '/en' || path === '/en/' || path === '/index.html';
};

const upsertMeta = (selector: string, attr: 'name' | 'property', key: string, content: string) => {
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
};

const upsertLink = (rel: string, href: string, hreflang?: string) => {
  const selector = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]`;
  let tag = document.head.querySelector<HTMLLinkElement>(selector);
  if (!tag) {
    tag = document.createElement('link');
    tag.setAttribute('rel', rel);
    if (hreflang) tag.setAttribute('hreflang', hreflang);
    document.head.appendChild(tag);
  }
  tag.setAttribute('href', href);
};

/** Keeps <html lang/dir>, the page title and the social/SEO tags in step with the language. */
const applyDocumentLanguage = (lang: Lang) => {
  const root = document.documentElement;
  root.setAttribute('lang', lang === 'en' ? 'en' : 'ar');
  root.setAttribute('dir', lang === 'en' ? 'ltr' : 'rtl');
  root.classList.toggle('lang-en', lang === 'en');

  const seo = HOME_SEO[lang];
  upsertLink('canonical', lang === 'en' ? `${SITE_ORIGIN}/en` : `${SITE_ORIGIN}/`);
  upsertLink('alternate', `${SITE_ORIGIN}/`, 'ar');
  upsertLink('alternate', `${SITE_ORIGIN}/en`, 'en');
  upsertLink('alternate', `${SITE_ORIGIN}/`, 'x-default');

  if (!isHomePath()) return;

  document.title = seo.title;
  upsertMeta('meta[name="title"]', 'name', 'title', seo.title);
  upsertMeta('meta[name="description"]', 'name', 'description', seo.description);
  upsertMeta('meta[name="keywords"]', 'name', 'keywords', seo.keywords);
  upsertMeta('meta[property="og:title"]', 'property', 'og:title', seo.title);
  upsertMeta('meta[property="og:description"]', 'property', 'og:description', seo.description);
  upsertMeta('meta[property="og:locale"]', 'property', 'og:locale', seo.locale);
  upsertMeta('meta[property="og:site_name"]', 'property', 'og:site_name', seo.ogSiteName);
  upsertMeta('meta[property="og:url"]', 'property', 'og:url', lang === 'en' ? `${SITE_ORIGIN}/en` : `${SITE_ORIGIN}/`);
  upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', seo.title);
  upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', seo.description);
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(detectLang);

  useEffect(() => {
    applyDocumentLanguage(lang);
  }, [lang]);

  useEffect(() => {
    const handlePopState = () => {
      const next = detectLang();
      setLangState(next);
      // Route changes reset scroll handled by App; keep language in sync only.
      if (next === 'en') document.documentElement.setAttribute('dir', 'ltr');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    const path = window.location.pathname.toLowerCase();
    const onHome = path === '/' || path === '/en' || path === '/en/';
    if (!onHome) return;
    const target = next === 'en' ? '/en' : '/';
    if (path !== target) window.history.pushState(null, '', target);
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === 'en' ? 'ar' : 'en');
  }, [lang, setLang]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      isEn: lang === 'en',
      dir: lang === 'en' ? 'ltr' : 'rtl',
      setLang,
      toggleLang,
      t: (ar: string, en?: string) => {
        if (lang !== 'en') return ar;
        return en ?? EN_TEXT[ar] ?? ar;
      },
    }),
    [lang, setLang, toggleLang],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLang = (): LanguageContextValue => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used inside LanguageProvider');
  return ctx;
};

/** The public site content, translated to the active language. */
export const useSiteContent = () => {
  const content = useContent();
  const { lang } = useLang();
  const data = useMemo<AppContentState>(() => localizeContent(content.data, lang), [content.data, lang]);
  return { ...content, data };
};

export { normalizePath };

import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import en from './locales/en.js';
import ar from './locales/ar.js';

const DICTIONARIES = { en, ar };
const STORAGE_KEY = 'procurio.locale';

const I18nContext = createContext(null);

const resolve = (dict, path) =>
  path.split('.').reduce((node, key) => (node == null ? undefined : node[key]), dict);

const interpolate = (template, vars) =>
  typeof template === 'string' && vars
    ? template.replace(/\{\{(\w+)\}\}/g, (_, key) => (vars[key] ?? `{{${key}}}`))
    : template;

/**
 * Minimal i18n provider with RTL support.
 *
 * Switching to Arabic flips `dir` on <html>, which is what drives every
 * layout mirror in the app — components use logical utilities (ms/me/ps/pe)
 * rather than hard-coded left/right.
 */
export const I18nProvider = ({ children }) => {
  const [locale, setLocaleState] = useState(
    () => localStorage.getItem(STORAGE_KEY) || 'en',
  );

  useEffect(() => {
    const dir = locale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
    localStorage.setItem(STORAGE_KEY, locale);
  }, [locale]);

  const t = useCallback(
    (path, vars) => {
      const value = resolve(DICTIONARIES[locale], path) ?? resolve(DICTIONARIES.en, path);
      if (value === undefined) return path;
      return interpolate(value, vars);
    },
    [locale],
  );

  const value = useMemo(
    () => ({
      locale,
      dir: locale === 'ar' ? 'rtl' : 'ltr',
      isRtl: locale === 'ar',
      t,
      setLocale: setLocaleState,
      toggleLocale: () => setLocaleState((l) => (l === 'en' ? 'ar' : 'en')),
      /** Picks the Arabic field when it exists and Arabic is active. */
      pick: (obj, field = 'name') => {
        if (!obj) return '';
        const arField = `${field}Ar`;
        return (locale === 'ar' && obj[arField]) || obj[field] || '';
      },
    }),
    [locale, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
};

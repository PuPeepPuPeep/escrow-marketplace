import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import translations, { type Lang, type Translations } from "../i18n/translations";

interface LanguageContextValue {
  lang: Lang;
  toggleLang: () => void;
  t: (section: keyof Translations, key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({} as LanguageContextValue);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(
    () => (localStorage.getItem("lang") as Lang) ?? "th"
  );

  const toggleLang = () => {
    const next: Lang = lang === "en" ? "th" : "en";
    setLang(next);
    localStorage.setItem("lang", next);
  };

  const t = (section: keyof Translations, key: string): string => {
    const sectionObj = translations[lang][section] as Record<string, string>;
    return sectionObj?.[key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);

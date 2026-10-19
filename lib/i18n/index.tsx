"use client";

import React, { createContext, useContext, useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import en from "./en.json";
import ar from "./ar.json";

export type Language = "en" | "ar";
export type Direction = "ltr" | "rtl";

interface I18nContextType {
  lang: Language;
  dir: Direction;
  isRtl: boolean;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  dict: typeof en;
}

const dictionaries = { en, ar };

const I18nContext = createContext<I18nContextType | null>(null);

function getNestedValue(obj: any, path: string): string | undefined {
  const parts = path.split(".");
  let current = obj;
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  return typeof current === "string" ? current : undefined;
}

export function I18nProvider({
  children,
  initialLang = "en",
}: {
  children: React.ReactNode;
  initialLang?: Language;
}) {
  const [lang, setLangState] = useState<Language>(initialLang);
  const router = useRouter();
  const [, startTransition] = useTransition();

  const dir: Direction = lang === "ar" ? "rtl" : "ltr";
  const isRtl = lang === "ar";
  const dict = dictionaries[lang] || dictionaries.en;

  // Sync with document element and read stored cookie
  useEffect(() => {
    if (typeof document !== "undefined") {
      const match = document.cookie.match(/tijori_lang=([^;]+)/);
      if (match && (match[1] === "ar" || match[1] === "en")) {
        if (match[1] !== lang) {
          setLangState(match[1] as Language);
          return;
        }
      }
      document.documentElement.lang = lang;
      document.documentElement.dir = dir;
    }
  }, [lang, dir]);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    if (typeof document !== "undefined") {
      document.cookie = `tijori_lang=${newLang}; path=/; max-age=31536000; SameSite=Lax`;
      document.documentElement.lang = newLang;
      document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
    }
    startTransition(() => {
      router.refresh();
    });
  };

  const toggleLang = () => {
    setLang(lang === "en" ? "ar" : "en");
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    let text = getNestedValue(dict, key) || getNestedValue(dictionaries.en, key) || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(new RegExp(`{${k}}`, "g"), String(v));
      });
    }
    return text;
  };

  return (
    <I18nContext.Provider
      value={{
        lang,
        dir,
        isRtl,
        setLang,
        toggleLang,
        t,
        dict,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useT() {
  const context = useContext(I18nContext);
  if (!context) {
    // Graceful fallback for non-provider renders
    const fallbackT = (key: string) => getNestedValue(en, key) || key;
    return {
      lang: "en" as Language,
      dir: "ltr" as Direction,
      isRtl: false,
      setLang: () => {},
      toggleLang: () => {},
      t: fallbackT,
      dict: en,
    };
  }
  return context;
}

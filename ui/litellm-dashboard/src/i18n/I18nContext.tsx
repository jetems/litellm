"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

export type Locale = "en" | "zh-CN";

interface I18nContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const LOCALE_STORAGE_KEY = "litellm-locale";

export const useI18n = () => {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error("useI18n must be used within an I18nProvider");
    }
    return context;
};

interface I18nProviderProps {
    children: ReactNode;
    defaultLocale?: Locale;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children, defaultLocale = "en" }) => {
    const [locale, setLocaleState] = useState<Locale>(defaultLocale);

    // Load locale from localStorage on mount
    useEffect(() => {
        try {
            const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
            if (savedLocale && (savedLocale === "en" || savedLocale === "zh-CN")) {
                setLocaleState(savedLocale);
            }
        } catch {
            // localStorage not available
        }
    }, []);

    // Update locale and persist to localStorage
    const setLocale = useCallback((newLocale: Locale) => {
        setLocaleState(newLocale);
        try {
            localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
        } catch {
            // localStorage not available
        }
    }, []);

    return <I18nContext.Provider value={{ locale, setLocale }}>{children}</I18nContext.Provider>;
};

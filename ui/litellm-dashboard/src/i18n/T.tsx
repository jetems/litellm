"use client";

import React from "react";
import { useI18n } from "./I18nContext";
import { translate } from "./translate";

interface TProps {
    children: string;
    /** Optional variables to interpolate */
    vars?: Record<string, string | number>;
}

/**
 * Translation wrapper component.
 *
 * Usage:
 *   <T>Create New Key</T>
 *   <T vars={{ count: 5 }}>You have {count} items</T>
 *
 * The component automatically looks up the translation for the children text
 * based on the current locale. If no translation is found, the original text is displayed.
 */
export const T: React.FC<TProps> = ({ children, vars }) => {
    const { locale } = useI18n();
    const translatedText = translate(children, locale, vars);
    return <>{translatedText}</>;
};

/**
 * Hook for translating strings in components.
 * Returns a translate function bound to the current locale.
 *
 * Usage:
 *   const t = useTranslate();
 *   const text = t("Hello, World!");
 */
export function useTranslate() {
    const { locale } = useI18n();
    return (text: string, vars?: Record<string, string | number>) => translate(text, locale, vars);
}

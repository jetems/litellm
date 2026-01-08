import type { Locale } from "./I18nContext";

// Import translation files
import enTranslations from "./locales/en.json";
import zhCNTranslations from "./locales/zh-CN.json";

type TranslationDict = Record<string, string>;

const translations: Record<Locale, TranslationDict> = {
    en: enTranslations,
    "zh-CN": zhCNTranslations,
};

/**
 * Translate a text string to the specified locale.
 *
 * @param text - The source text (typically English)
 * @param locale - The target locale
 * @param variables - Optional variables to interpolate (e.g., { name: "John" })
 * @returns The translated text, or the original text if no translation exists
 */
export function translate(text: string, locale: Locale, variables?: Record<string, string | number>): string {
    // Get translation dictionary for the locale
    const dict = translations[locale];

    // Look up translation, fall back to original text
    let result = dict?.[text] ?? text;

    // Interpolate variables if provided (e.g., "Hello, {name}" -> "Hello, John")
    if (variables) {
        Object.entries(variables).forEach(([key, value]) => {
            result = result.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
        });
    }

    return result;
}

/**
 * Create a translate function bound to a specific locale.
 * Useful for components that frequently translate strings.
 */
export function createTranslator(locale: Locale) {
    return (text: string, variables?: Record<string, string | number>) => translate(text, locale, variables);
}

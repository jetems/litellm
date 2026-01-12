import type { Locale } from "@/i18n/I18nContext";

/**
 * Format a date according to the specified locale
 * @param date - Date object or date string
 * @param locale - Locale ("en" or "zh-CN")
 * @param includeTime - Whether to include time (default: false for date only, true for full datetime)
 * @returns Formatted date string
 */
export function formatDate(date: Date | string, locale: Locale, includeTime: boolean = false): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return "-";
  }

  if (locale === "zh-CN") {
    if (includeTime) {
      // Chinese format: 2026年1月12日 22:03:51
      const year = dateObj.getFullYear();
      const month = dateObj.getMonth() + 1;
      const day = dateObj.getDate();
      const hours = dateObj.getHours().toString().padStart(2, "0");
      const minutes = dateObj.getMinutes().toString().padStart(2, "0");
      const seconds = dateObj.getSeconds().toString().padStart(2, "0");
      return `${year}年${month}月${day}日 ${hours}:${minutes}:${seconds}`;
    } else {
      // Chinese format: 2026年1月12日
      const year = dateObj.getFullYear();
      const month = dateObj.getMonth() + 1;
      const day = dateObj.getDate();
      return `${year}年${month}月${day}日`;
    }
  } else {
    // English format
    if (includeTime) {
      // English format: 1/12/2026, 10:03:51 PM
      return dateObj.toLocaleString("en-US", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    } else {
      // English format: 1/12/2026
      return dateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      });
    }
  }
}

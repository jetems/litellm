import { cx } from "@/lib/cva.config";
import { UiLoadingSpinner } from "../ui/ui-loading-spinner";
import { translate } from "@/i18n/translate";
import type { Locale } from "@/i18n/I18nContext";

// 获取语言设置（不依赖 Context，用于 Context 外的组件）
function getLocale(): Locale {
  if (typeof window !== "undefined") {
    return (localStorage.getItem("locale") as Locale) || "en";
  }
  return "en";
}

export default function LoadingScreen() {
  const locale = getLocale();
  return (
    <div className={cx("h-screen", "flex items-center justify-center gap-4")}>
      <div className="text-lg font-medium py-2 pr-4 border-r border-r-gray-200">🚅 LiteLLM</div>

      <div className="flex items-center justify-center gap-2">
        <UiLoadingSpinner className="size-4" />
        <span className="text-gray-600 text-sm">{translate("Loading...", locale)}</span>
      </div>
    </div>
  );
}


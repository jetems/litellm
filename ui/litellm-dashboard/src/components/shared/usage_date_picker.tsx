import React, { useCallback, useState, useRef } from "react";
import { DateRangePicker, DateRangePickerValue, Text } from "@tremor/react";
import { useTranslate, useI18n } from "@/i18n";
import { zhCN, enUS } from "date-fns/locale";
import { subDays, startOfMonth, startOfYear, startOfToday, endOfDay } from "date-fns";

interface UsageDatePickerProps {
  value: DateRangePickerValue;
  onValueChange: (value: DateRangePickerValue) => void;
  label?: string;
  className?: string;
  showTimeRange?: boolean;
}

/**
 * Ultra responsive date picker with instant click feedback
 */
const UsageDatePicker: React.FC<UsageDatePickerProps> = ({
  value,
  onValueChange,
  label,
  className = "",
  showTimeRange = true,
}) => {
  const t = useTranslate();
  const { locale } = useI18n();

  const presets = [
    {
      label: t("Today"),
      dateRange: {
        from: startOfToday(),
        to: endOfDay(new Date()),
      },
    },
    {
      label: t("Last 7 days"),
      dateRange: {
        from: subDays(new Date(), 7),
        to: new Date(),
      },
    },
    {
      label: t("Last 30 days"),
      dateRange: {
        from: subDays(new Date(), 30),
        to: new Date(),
      },
    },
    {
      label: t("Month to Date"),
      dateRange: {
        from: startOfMonth(new Date()),
        to: new Date(),
      },
    },
    {
      label: t("Year to Date"),
      dateRange: {
        from: startOfYear(new Date()),
        to: new Date(),
      },
    },
  ];

  const displayLabel = label ?? t("Select Time Range");
  const [showSelectedFeedback, setShowSelectedFeedback] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // This only triggers AFTER user has actually made a selection
  const handleDateChange = useCallback(
    (newValue: DateRangePickerValue) => {
      // Show t("Selected") feedback ONLY after actual selection is made
      setShowSelectedFeedback(true);

      // Hide the feedback after a short time
      setTimeout(() => setShowSelectedFeedback(false), 1500);

      // Update parent immediately
      onValueChange(newValue);

      // Do heavy processing in background
      requestIdleCallback(
        () => {
          if (newValue.from) {
            const adjustedValue = { ...newValue };
            const adjustedStartTime = new Date(newValue.from);
            let adjustedEndTime: Date;

            if (newValue.to) {
              adjustedEndTime = new Date(newValue.to);
            } else {
              adjustedEndTime = new Date(newValue.from);
            }

            const isSameDay = adjustedStartTime.toDateString() === adjustedEndTime.toDateString();

            if (isSameDay) {
              adjustedStartTime.setHours(0, 0, 0, 0);
              adjustedEndTime.setHours(23, 59, 59, 999);
            } else {
              adjustedStartTime.setHours(0, 0, 0, 0);
              adjustedEndTime.setHours(23, 59, 59, 999);
            }

            adjustedValue.from = adjustedStartTime;
            adjustedValue.to = adjustedEndTime;
            onValueChange(adjustedValue);
          }
        },
        { timeout: 100 },
      );
    },
    [onValueChange],
  );

  const formatTimeRange = useCallback((from: Date | undefined, to: Date | undefined) => {
    if (!from || !to) return "";

    const jsLocale = locale === "zh-CN" ? "zh-CN" : "en-US";

    const formatDateTime = (date: Date) => {
      return date.toLocaleString(jsLocale, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: locale !== "zh-CN",
        timeZoneName: "short",
      });
    };

    const isSameDay = from.toDateString() === to.toDateString();

    if (isSameDay) {
      const dateStr = from.toLocaleDateString(jsLocale, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const startTime = from.toLocaleTimeString(jsLocale, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: locale !== "zh-CN",
      });
      const endTime = to.toLocaleTimeString(jsLocale, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: locale !== "zh-CN",
        timeZoneName: "short",
      });
      return `${dateStr}: ${startTime} - ${endTime}`;
    } else {
      return `${formatDateTime(from)} - ${formatDateTime(to)}`;
    }
  }, [locale]);

  return (
    <div className={className}>
      {displayLabel && <Text className="mb-2">{displayLabel}</Text>}

      {/* Container with relative positioning for absolute placement */}
      <div className="relative w-fit">
        <div ref={datePickerRef}>
          <DateRangePicker
            enableSelect={true}
            value={value}
            onValueChange={handleDateChange} // Only triggers on actual selection
            placeholder={t("Select date range")}
            enableClear={false}
            style={{ zIndex: 100 }}
            locale={locale === "zh-CN" ? zhCN : enUS}
            selectPlaceholder={t("Select range")}
            // @ts-ignore
            presets={presets}
          />
        </div>

        {/* ONLY SHOW AFTER ACTUAL SELECTION IS COMPLETED */}
        {showSelectedFeedback && (
          <div
            className="absolute top-1/2 animate-pulse"
            style={{
              left: "calc(100% + 8px)",
              transform: "translateY(-50%)",
              zIndex: 110,
            }}
          >
            <div className="flex items-center gap-1 text-green-600 text-sm font-medium bg-white px-2 py-1 rounded-full border border-green-200 shadow-sm whitespace-nowrap">
              <div className="w-3 h-3 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">
                ✓
              </div>
              <span className="text-xs">{t("Selected")}</span>
            </div>
          </div>
        )}
      </div>

      {/* Time range display */}
      {showTimeRange && value.from && value.to && (
        <Text className="mt-2 text-xs text-gray-500">{formatTimeRange(value.from, value.to)}</Text>
      )}
    </div>
  );
};

export default UsageDatePicker;

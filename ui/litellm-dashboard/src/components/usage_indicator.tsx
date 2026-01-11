import { Badge } from "@tremor/react";
import { AlertTriangle, Loader2, TrendingUp, UserCheck, Users } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { getRemainingUsers } from "./networking";
import { useTranslate } from "@/i18n";

// Simple utility function to combine class names
const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(" ");
};

interface UsageIndicatorProps {
  accessToken: string | null;
  width?: number;
}

interface UsageData {
  total_users: number | null;
  total_users_used: number;
  total_users_remaining: number | null;
  total_teams: number | null;
  total_teams_used: number;
  total_teams_remaining: number | null;
}

export default function UsageIndicator({ accessToken }: UsageIndicatorProps) {
  const t = useTranslate();
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!accessToken) return;

      setIsLoading(true);
      setError(null);

      try {
        const result = await getRemainingUsers(accessToken);
        setData(result);
      } catch (err) {
        console.error("Failed to fetch usage data:", err);
        setError(t("Failed to load usage data"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [accessToken]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Calculate derived values from data
  const getUsageMetrics = (data: UsageData | null) => {
    if (!data) {
      return {
        isOverLimit: false,
        isNearLimit: false,
        usagePercentage: 0,
        userMetrics: {
          isOverLimit: false,
          isNearLimit: false,
          usagePercentage: 0,
        },
        teamMetrics: {
          isOverLimit: false,
          isNearLimit: false,
          usagePercentage: 0,
        },
      };
    }

    // User metrics
    const userUsagePercentage = data.total_users ? (data.total_users_used / data.total_users) * 100 : 0;
    const userIsOverLimit = userUsagePercentage > 100;
    const userIsNearLimit = userUsagePercentage >= 80 && userUsagePercentage <= 100;

    // Team metrics
    const teamUsagePercentage = data.total_teams ? (data.total_teams_used / data.total_teams) * 100 : 0;
    const teamIsOverLimit = teamUsagePercentage > 100;
    const teamIsNearLimit = teamUsagePercentage >= 80 && teamUsagePercentage <= 100;

    // Combined status (worst case scenario)
    const isOverLimit = userIsOverLimit || teamIsOverLimit;
    const isNearLimit = (userIsNearLimit || teamIsNearLimit) && !isOverLimit;

    return {
      isOverLimit,
      isNearLimit,
      usagePercentage: Math.max(userUsagePercentage, teamUsagePercentage),
      userMetrics: {
        isOverLimit: userIsOverLimit,
        isNearLimit: userIsNearLimit,
        usagePercentage: userUsagePercentage,
      },
      teamMetrics: {
        isOverLimit: teamIsOverLimit,
        isNearLimit: teamIsNearLimit,
        usagePercentage: teamUsagePercentage,
      },
    };
  };

  const { isOverLimit, isNearLimit, userMetrics, teamMetrics } = getUsageMetrics(data);

  const getStatusColor = () => {
    if (isOverLimit) return "red";
    if (isNearLimit) return "yellow";
    return "green";
  };

  const getStatusBgColor = () => {
    if (isOverLimit) return "bg-red-100 hover:bg-red-200 text-red-600";
    if (isNearLimit) return "bg-yellow-100 hover:bg-yellow-200 text-yellow-600";
    return "bg-gray-100 hover:bg-gray-200 text-gray-600";
  };

  // Don't render anything if no access token or if both total_users and total_teams are null
  if (!accessToken || (data?.total_users === null && data?.total_teams === null)) {
    return null;
  }

  return (
    <div className="relative" ref={popoverRef}>
      {/* Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "p-2 rounded-lg transition-all duration-200 relative",
          getStatusBgColor(),
        )}
        title={t("Usage Status")}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Users className="h-5 w-5" />
        )}
        {/* Status indicator dot */}
        {(isOverLimit || isNearLimit) && !isLoading && (
          <span
            className={cn(
              "absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-white",
              isOverLimit && "bg-red-500",
              isNearLimit && "bg-yellow-500",
            )}
          />
        )}
      </button>

      {/* Popover */}
      {isOpen && (
        <div
          className="absolute top-full right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
        >
          {/* Arrow */}
          <div className="absolute -top-2 right-4 w-4 h-4 bg-white border-l border-t border-gray-200 rotate-45" />

          {/* Content */}
          <div className="relative bg-white rounded-lg p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-600" />
                <span className="font-semibold text-gray-800">{t("Usage Status")}</span>
              </div>
              {(isOverLimit || isNearLimit) && (
                <Badge color={getStatusColor()} className="text-xs">
                  {isOverLimit ? (
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> {t("Over Limit")}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> {t("Near Limit")}
                    </span>
                  )}
                </Badge>
              )}
            </div>

            {error ? (
              <div className="text-sm text-red-500 py-2">{error}</div>
            ) : !data ? (
              <div className="text-sm text-gray-500 py-2">{t("No data available")}</div>
            ) : (
              <div className="space-y-4">
                {/* Users section */}
                {data.total_users !== null && (
                  <div
                    className={cn(
                      "p-3 rounded-lg border",
                      userMetrics.isOverLimit && "border-red-200 bg-red-50",
                      userMetrics.isNearLimit && "border-yellow-200 bg-yellow-50",
                      !userMetrics.isOverLimit && !userMetrics.isNearLimit && "border-gray-200 bg-gray-50",
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-600" />
                        <span className="font-medium text-sm">{t("Users")}</span>
                      </div>
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium",
                          userMetrics.isOverLimit && "bg-red-100 text-red-700",
                          userMetrics.isNearLimit && "bg-yellow-100 text-yellow-700",
                          !userMetrics.isOverLimit && !userMetrics.isNearLimit && "bg-green-100 text-green-700",
                        )}
                      >
                        {userMetrics.isOverLimit ? t("Over") : userMetrics.isNearLimit ? t("Warning") : t("OK")}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                      <div>
                        <span className="text-gray-500 block">{t("Used")}</span>
                        <span className="font-semibold">{data.total_users_used}/{data.total_users}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">{t("Remaining")}</span>
                        <span className={cn(
                          "font-semibold",
                          userMetrics.isOverLimit && "text-red-600",
                          userMetrics.isNearLimit && "text-yellow-600",
                        )}>{data.total_users_remaining}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">{t("Usage")}</span>
                        <span className="font-semibold">{Math.round(userMetrics.usagePercentage)}%</span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={cn(
                          "h-1.5 rounded-full transition-all duration-300",
                          userMetrics.isOverLimit && "bg-red-500",
                          userMetrics.isNearLimit && "bg-yellow-500",
                          !userMetrics.isOverLimit && !userMetrics.isNearLimit && "bg-green-500",
                        )}
                        style={{ width: `${Math.min(userMetrics.usagePercentage, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Teams section */}
                {data.total_teams !== null && (
                  <div
                    className={cn(
                      "p-3 rounded-lg border",
                      teamMetrics.isOverLimit && "border-red-200 bg-red-50",
                      teamMetrics.isNearLimit && "border-yellow-200 bg-yellow-50",
                      !teamMetrics.isOverLimit && !teamMetrics.isNearLimit && "border-gray-200 bg-gray-50",
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-gray-600" />
                        <span className="font-medium text-sm">{t("Teams")}</span>
                      </div>
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium",
                          teamMetrics.isOverLimit && "bg-red-100 text-red-700",
                          teamMetrics.isNearLimit && "bg-yellow-100 text-yellow-700",
                          !teamMetrics.isOverLimit && !teamMetrics.isNearLimit && "bg-green-100 text-green-700",
                        )}
                      >
                        {teamMetrics.isOverLimit ? t("Over") : teamMetrics.isNearLimit ? t("Warning") : t("OK")}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                      <div>
                        <span className="text-gray-500 block">{t("Used")}</span>
                        <span className="font-semibold">{data.total_teams_used}/{data.total_teams}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">{t("Remaining")}</span>
                        <span className={cn(
                          "font-semibold",
                          teamMetrics.isOverLimit && "text-red-600",
                          teamMetrics.isNearLimit && "text-yellow-600",
                        )}>{data.total_teams_remaining}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">{t("Usage")}</span>
                        <span className="font-semibold">{Math.round(teamMetrics.usagePercentage)}%</span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={cn(
                          "h-1.5 rounded-full transition-all duration-300",
                          teamMetrics.isOverLimit && "bg-red-500",
                          teamMetrics.isNearLimit && "bg-yellow-500",
                          !teamMetrics.isOverLimit && !teamMetrics.isNearLimit && "bg-green-500",
                        )}
                        style={{ width: `${Math.min(teamMetrics.usagePercentage, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


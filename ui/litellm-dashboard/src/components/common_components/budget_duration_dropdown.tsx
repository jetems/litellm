import React from "react";
import { Select } from "antd";
import { useTranslate } from "@/i18n";

const { Option } = Select;

interface BudgetDurationDropdownProps {
  value?: string | null;
  onChange?: (value: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

const BudgetDurationDropdown: React.FC<BudgetDurationDropdownProps> = ({
  value,
  onChange,
  className = "",
  style = {},
}) => {
  const t = useTranslate();
  return (
    <Select
      style={{ width: "100%", ...style }}
      value={value || undefined}
      onChange={onChange}
      className={className}
      placeholder="n/a"
    >
      <Option value="24h">{t("daily")}</Option>
      <Option value="7d">{t("weekly")}</Option>
      <Option value="30d">{t("monthly")}</Option>
    </Select>
  );
};

export const getBudgetDurationLabel = (value: string | null | undefined, t?: any): string => {
  if (!value) return t ? t("Not set") : "Not set";

  const budgetDurationMap: Record<string, string> = {
    "24h": t ? t("daily") : "daily",
    "7d": t ? t("weekly") : "weekly",
    "30d": t ? t("monthly") : "monthly",
  };

  return budgetDurationMap[value] || value;
};

export default BudgetDurationDropdown;


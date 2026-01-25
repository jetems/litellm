import { useTranslate } from "@/i18n";
import { Select } from "antd";

interface DurationSelectProps {
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export default function DurationSelect({ className, value, onChange }: DurationSelectProps) {
  const t = useTranslate();
  return (
    <Select className={className} value={value} onChange={onChange}>
      <Select.Option value="24h">{t("Daily")}</Select.Option>
      <Select.Option value="7d">{t("Weekly")}</Select.Option>
      <Select.Option value="30d">{t("Monthly")}</Select.Option>
    </Select>
  );
}

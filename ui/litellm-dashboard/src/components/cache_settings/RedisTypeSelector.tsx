import React from "react";
import { Select, SelectItem } from "@tremor/react";
import { useTranslate } from "@/i18n";

interface RedisTypeSelectorProps {
  redisType: string;
  redisTypeDescriptions: { [key: string]: string };
  onTypeChange: (type: string) => void;
}

const RedisTypeSelector: React.FC<RedisTypeSelectorProps> = ({ redisType, redisTypeDescriptions, onTypeChange }) => {
  const t = useTranslate();
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{t("Redis Type")}</label>
      <Select value={redisType} onValueChange={onTypeChange}>
        <SelectItem value="node">{t("Node (Single Instance)")}</SelectItem>
        <SelectItem value="cluster">{t("Cluster")}</SelectItem>
        <SelectItem value="sentinel">{t("Sentinel")}</SelectItem>
        <SelectItem value="semantic">{t("Semantic")}</SelectItem>
      </Select>
      <p className="text-xs text-gray-500">
        {redisTypeDescriptions[redisType] || t("Select the type of Redis deployment you're using")}
      </p>
    </div>
  );
};

export default RedisTypeSelector;

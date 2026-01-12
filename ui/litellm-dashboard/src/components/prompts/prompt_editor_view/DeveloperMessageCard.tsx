import React from "react";
import { Card, Text } from "@tremor/react";
import VariableTextArea from "../variable_textarea";
import { useTranslate } from "@/i18n";

interface DeveloperMessageCardProps {
  value: string;
  onChange: (value: string) => void;
}

const DeveloperMessageCard: React.FC<DeveloperMessageCardProps> = ({
  value,
  onChange,
}) => {
  const t = useTranslate();
  return (
    <Card className="p-3">
      <Text className="block mb-2 text-sm font-medium">{t("Developer message")}</Text>
      <Text className="text-gray-500 text-xs mb-2">
        {t("Optional system instructions for the model")}
      </Text>
      <VariableTextArea
        value={value}
        onChange={onChange}
        rows={3}
        placeholder={t("e.g., You are a helpful assistant...")}
      />
    </Card>
  );
};

export default DeveloperMessageCard;


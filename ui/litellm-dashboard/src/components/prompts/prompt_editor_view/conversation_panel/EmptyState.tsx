import React from "react";
import { RobotOutlined } from "@ant-design/icons";
import { useTranslate } from "@/i18n";

interface EmptyStateProps {
  hasVariables: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({ hasVariables }) => {
  const t = useTranslate();
  return (
    <div className="h-full flex flex-col items-center justify-center text-gray-400">
      <RobotOutlined style={{ fontSize: "48px", marginBottom: "16px" }} />
      <span className="text-base">
        {hasVariables
          ? t("Fill in the variables above, then type a message to start testing")
          : t("Type a message below to start testing your prompt")}
      </span>
    </div>
  );
};

export default EmptyState;


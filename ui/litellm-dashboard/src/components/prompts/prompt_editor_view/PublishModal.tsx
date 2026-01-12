import React from "react";
import { Button as TremorButton, Text } from "@tremor/react";
import { Input, Modal } from "antd";
import { useTranslate } from "@/i18n";

interface PublishModalProps {
  visible: boolean;
  promptName: string;
  isSaving: boolean;
  onNameChange: (name: string) => void;
  onPublish: () => void;
  onCancel: () => void;
}

const PublishModal: React.FC<PublishModalProps> = ({
  visible,
  promptName,
  isSaving,
  onNameChange,
  onPublish,
  onCancel,
}) => {
  const t = useTranslate();
  return (
    <Modal
      title={t("Publish Prompt")}
      open={visible}
      onCancel={onCancel}
      footer={[
        <div key="footer" className="flex justify-end gap-2">
          <TremorButton variant="secondary" onClick={onCancel}>
            {t("Cancel")}
          </TremorButton>
          <TremorButton onClick={onPublish} loading={isSaving}>
            {t("Publish")}
          </TremorButton>
        </div>
      ]}
    >
      <div className="py-4">
        <Text className="mb-2">{t("Name")}</Text>
        <Input
          value={promptName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={t("Enter prompt name")}
          onPressEnter={onPublish}
          autoFocus
        />
        <Text className="text-gray-500 text-xs mt-2">
          {t("Published prompts can be used in API calls and are versioned for easy tracking.")}
        </Text>
      </div>
    </Modal>
  );
};

export default PublishModal;


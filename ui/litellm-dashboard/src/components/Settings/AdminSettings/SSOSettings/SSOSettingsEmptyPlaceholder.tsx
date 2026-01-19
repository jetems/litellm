import { useTranslate } from "@/i18n";
import { Empty, Typography, Button } from "antd";

const { Title, Paragraph } = Typography;

interface SSOSettingsEmptyPlaceholderProps {
  onAdd: () => void;
}

export default function SSOSettingsEmptyPlaceholder({ onAdd }: SSOSettingsEmptyPlaceholderProps) {
  const t = useTranslate();
  return (
    <div className="bg-white p-12 rounded-lg border border-dashed border-gray-300 text-center w-full">
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <div className="space-y-2">
            <Title level={4}>{t("No SSO Configuration Found")}</Title>
            <Paragraph type="secondary" className="max-w-md mx-auto">
              {t("Configure Single Sign-On (SSO) to enable seamless authentication for your team members using your identity provider.")}
            </Paragraph>
          </div>
        }
      >
        <Button type="primary" size="large" onClick={onAdd} className="flex items-center gap-2 mx-auto mt-4">
          {t("Configure SSO")}
        </Button>
      </Empty>
    </div>
  );
}

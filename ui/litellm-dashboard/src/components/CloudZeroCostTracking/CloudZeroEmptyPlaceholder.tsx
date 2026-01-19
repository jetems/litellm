import { useTranslate } from "@/i18n";
import { Empty, Typography, Button } from "antd";

const { Title, Paragraph } = Typography;

interface CloudZeroEmptyPlaceholderProps {
  startCreation: () => void;
}

export default function CloudZeroEmptyPlaceholder({ startCreation }: CloudZeroEmptyPlaceholderProps) {
  const t = useTranslate();
  return (
    <div className="bg-white p-12 rounded-lg border border-dashed border-gray-300 text-center max-w-2xl mx-auto mt-8">
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <div className="space-y-2">
            <Title level={4}>{t("No CloudZero Integration Found")}</Title>
            <Paragraph type="secondary" className="max-w-md mx-auto">
              {t("Connect your CloudZero account to start tracking and analyzing your cloud costs directly from LiteLLM.")}
            </Paragraph>
          </div>
        }
      >
        <Button type="primary" size="large" onClick={startCreation} className="flex items-center gap-2 mx-auto mt-4">
          {t("Add CloudZero Integration")}
        </Button>
      </Empty>
    </div>
  );
}

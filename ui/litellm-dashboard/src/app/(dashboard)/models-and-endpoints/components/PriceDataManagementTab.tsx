import { TabPanel, Text, Title } from "@tremor/react";
import PriceDataReload from "@/components/price_data_reload";
import { modelCostMap } from "@/components/networking";
import React from "react";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { useTranslate } from "@/i18n";

interface PriceDataManagementPanelProps {
  setModelMap: (data: any) => void;
}

const PriceDataManagementTab = ({ setModelMap }: PriceDataManagementPanelProps) => {
  const { accessToken } = useAuthorized();
  const t = useTranslate();

  return (
    <TabPanel>
      <div className="p-6">
        <div className="mb-6">
          <Title>{t("Price Data Management")}</Title>
          <Text className="text-tremor-content">
            {t("Manage model pricing data and configure automatic reload schedules")}
          </Text>
        </div>
        <PriceDataReload
          accessToken={accessToken}
          onReloadSuccess={() => {
            // Refresh the model map after successful reload
            const fetchModelMap = async () => {
              const data = await modelCostMap();
              setModelMap(data);
            };
            fetchModelMap();
          }}
          buttonText={t("Reload Price Data")}
          size="middle"
          type="primary"
          className="w-full"
        />
      </div>
    </TabPanel>
  );
};

export default PriceDataManagementTab;

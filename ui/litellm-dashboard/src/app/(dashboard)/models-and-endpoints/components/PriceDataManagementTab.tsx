import { TabPanel, Text, Title } from "@tremor/react";
import PriceDataReload from "@/components/price_data_reload";
import React from "react";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { useModelCostMap } from "../../hooks/models/useModelCostMap";
import { useTranslate } from "@/i18n";

const PriceDataManagementTab = () => {
  const { accessToken } = useAuthorized();
  const { refetch: refetchModelCostMap } = useModelCostMap();
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
            refetchModelCostMap();
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

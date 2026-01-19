import React from "react";
import { BarChart, Card, Title } from "@tremor/react";
import { CustomLegend, CustomTooltip } from "@/components/common_components/chartUtils";
import { MetricWithMetadata } from "../../../types";
import { useTranslate } from "@/i18n";

interface EndpointUsageBarChartProps {
  endpointData?: Record<string, MetricWithMetadata>;
}

const EndpointUsageBarChart: React.FC<EndpointUsageBarChartProps> = ({ endpointData }) => {
  const t = useTranslate();
  const dataToUse = endpointData || {};

  // Transform endpoint data into chart format
  const chartData = React.useMemo(() => {
    return Object.entries(dataToUse).map(([endpoint, data]) => ({
      endpoint,
      [t("Successful Requests")]: data.metrics.successful_requests,
      [t("Failed Requests")]: data.metrics.failed_requests,
      metrics: {
        successful_requests: data.metrics.successful_requests,
        failed_requests: data.metrics.failed_requests,
      },
    }));
  }, [dataToUse, t]);

  const valueFormatter = (value: number) => value.toLocaleString();

  return (
    <Card>
      <div className="flex justify-between items-center">
        <Title>{t("Success vs Failed Requests by Endpoint")}</Title>
        <CustomLegend
          categories={[t("Successful Requests"), t("Failed Requests")]}
          colors={["green", "red"]}
        />
      </div>
      <BarChart
        className="mt-4"
        data={chartData}
        index="endpoint"
        categories={[t("Successful Requests"), t("Failed Requests")]}
        colors={["green", "red"]}
        valueFormatter={valueFormatter}
        customTooltip={CustomTooltip}
        showLegend={false}
        stack={true}
        yAxisWidth={60}
      />
    </Card>
  );
};

export default EndpointUsageBarChart;

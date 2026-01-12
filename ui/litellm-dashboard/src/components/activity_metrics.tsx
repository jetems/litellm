import { formatNumberWithCommas } from "@/utils/dataUtils";
import { AreaChart, BarChart, Card, Grid, Text, Title } from "@tremor/react";
import { Collapse } from "antd";
import React from "react";
import { CustomLegend, CustomTooltip } from "./common_components/chartUtils";
import { DailyData, KeyMetricWithMetadata, ModelActivityData, TopApiKeyData } from "./UsagePage/types";
import { valueFormatter } from "./UsagePage/utils/value_formatters";
import { Team } from "./key_team_helpers/key_list";
import { resolveTeamAliasFromTeamID } from "@/utils/teamUtils";
import { useTranslate } from "@/i18n";

interface ActivityMetricsProps {
  modelMetrics: Record<string, ModelActivityData>;
  hidePromptCachingMetrics?: boolean;
}

const ModelSection = ({
  modelName,
  metrics,
  hidePromptCachingMetrics = false,
}: {
  modelName: string;
  metrics: ModelActivityData;
  hidePromptCachingMetrics?: boolean;
}) => {
  const t = useTranslate();
  return (
    <div className="space-y-2">
      {/* Summary Cards */}
      <Grid numItems={4} className="gap-4">
        <Card>
          <Text>{t("Total Requests")}</Text>
          <Title>{metrics.total_requests.toLocaleString()}</Title>
        </Card>
        <Card>
          <Text>{t("Total Successful Requests")}</Text>
          <Title>{metrics.total_successful_requests.toLocaleString()}</Title>
        </Card>
        <Card>
          <Text>{t("Total Tokens")}</Text>
          <Title>{metrics.total_tokens.toLocaleString()}</Title>
          <Text>{Math.round(metrics.total_tokens / metrics.total_successful_requests)} {t("avg per successful request")}</Text>
        </Card>
        <Card>
          <Text>{t("Total Spend")}</Text>
          <Title>${formatNumberWithCommas(metrics.total_spend, 2)}</Title>
          <Text>
            ${formatNumberWithCommas(metrics.total_spend / metrics.total_successful_requests, 3)} {t("per successful request")}
          </Text>
        </Card>
      </Grid>

      {metrics.top_api_keys && metrics.top_api_keys.length > 0 && (
        <Card className="mt-4">
          <Title>{t("Top Virtual Keys by Spend")}</Title>
          <div className="mt-3">
            <div className="grid grid-cols-1 gap-2">
              {metrics.top_api_keys.map((keyData, index) => (
                <div key={keyData.api_key} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Text className="font-medium">{keyData.key_alias || `${keyData.api_key.substring(0, 10)}...`}</Text>
                    {keyData.team_id && <Text className="text-xs text-gray-500">{t("Team")}: {keyData.team_id}</Text>}
                  </div>
                  <div className="text-right">
                    <Text className="font-medium">${formatNumberWithCommas(keyData.spend, 2)}</Text>
                    <Text className="text-xs text-gray-500">
                      {keyData.requests.toLocaleString()} {t("requests")} | {keyData.tokens.toLocaleString()} {t("tokens")}
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Charts */}
      <Grid numItems={2} className="gap-4">
        <Card>
          <div className="flex justify-between items-center">
            <Title>{t("Total Tokens")}</Title>
            <CustomLegend
              categories={["metrics.prompt_tokens", "metrics.completion_tokens", "metrics.total_tokens"]}
              colors={["blue", "cyan", "indigo"]}
            />
          </div>
          <AreaChart
            className="mt-4"
            data={metrics.daily_data}
            index="date"
            categories={["metrics.prompt_tokens", "metrics.completion_tokens", "metrics.total_tokens"]}
            colors={["blue", "cyan", "indigo"]}
            valueFormatter={valueFormatter}
            customTooltip={CustomTooltip}
            showLegend={false}
          />
        </Card>

        <Card>
          <div className="flex justify-between items-center">
            <Title>{t("Requests per day")}</Title>
            <CustomLegend categories={["metrics.api_requests"]} colors={["blue"]} />
          </div>
          <BarChart
            className="mt-4"
            data={metrics.daily_data}
            index="date"
            categories={["metrics.api_requests"]}
            colors={["blue"]}
            valueFormatter={valueFormatter}
            customTooltip={CustomTooltip}
            showLegend={false}
          />
        </Card>

        <Card>
          <div className="flex justify-between items-center">
            <Title>{t("Spend per day")}</Title>
            <CustomLegend categories={["metrics.spend"]} colors={["green"]} />
          </div>
          <BarChart
            className="mt-4"
            data={metrics.daily_data}
            index="date"
            categories={["metrics.spend"]}
            colors={["green"]}
            valueFormatter={(value: number) => `$${formatNumberWithCommas(value, 2, true)}`}
            yAxisWidth={72}
          />
        </Card>

        <Card>
          <div className="flex justify-between items-center">
            <Title>{t("Success vs Failed Requests")}</Title>
            <CustomLegend
              categories={["metrics.successful_requests", "metrics.failed_requests"]}
              colors={["green", "red"]}
            />
          </div>
          <AreaChart
            className="mt-4"
            data={metrics.daily_data}
            index="date"
            categories={["metrics.successful_requests", "metrics.failed_requests"]}
            colors={["green", "red"]}
            valueFormatter={valueFormatter}
            stack
            customTooltip={CustomTooltip}
            showLegend={false}
          />
        </Card>

        {!hidePromptCachingMetrics && (
          <Card>
            <div className="flex justify-between items-center">
              <Title>{t("Prompt Caching Metrics")}</Title>
              <CustomLegend
                categories={["metrics.cache_read_input_tokens", "metrics.cache_creation_input_tokens"]}
                colors={["cyan", "purple"]}
              />
            </div>
            <div className="mb-2">
              <Text>{t("Cache Read")}: {metrics.total_cache_read_input_tokens?.toLocaleString() || 0} {t("tokens")}</Text>
              <Text>{t("Cache Creation")}: {metrics.total_cache_creation_input_tokens?.toLocaleString() || 0} {t("tokens")}</Text>
            </div>
            <AreaChart
              className="mt-4"
              data={metrics.daily_data}
              index="date"
              categories={["metrics.cache_read_input_tokens", "metrics.cache_creation_input_tokens"]}
              colors={["cyan", "purple"]}
              valueFormatter={valueFormatter}
              customTooltip={CustomTooltip}
              showLegend={false}
            />
          </Card>
        )}
      </Grid>
    </div>
  );
};

export const ActivityMetrics: React.FC<ActivityMetricsProps> = ({ modelMetrics, hidePromptCachingMetrics = false }) => {
  const t = useTranslate();
  const modelNames = Object.keys(modelMetrics).sort((a, b) => {
    if (a === "") return 1;
    if (b === "") return -1;
    return modelMetrics[b].total_spend - modelMetrics[a].total_spend;
  });

  // Calculate total metrics across all models
  const totalMetrics = {
    total_requests: 0,
    total_successful_requests: 0,
    total_tokens: 0,
    total_spend: 0,
    total_cache_read_input_tokens: 0,
    total_cache_creation_input_tokens: 0,
    daily_data: {} as Record<
      string,
      {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
        api_requests: number;
        spend: number;
        successful_requests: number;
        failed_requests: number;
        cache_read_input_tokens: number;
        cache_creation_input_tokens: number;
      }
    >,
  };

  // Aggregate data
  Object.values(modelMetrics).forEach((model) => {
    totalMetrics.total_requests += model.total_requests;
    totalMetrics.total_successful_requests += model.total_successful_requests;
    totalMetrics.total_tokens += model.total_tokens;
    totalMetrics.total_spend += model.total_spend;
    totalMetrics.total_cache_read_input_tokens += model.total_cache_read_input_tokens || 0;
    totalMetrics.total_cache_creation_input_tokens += model.total_cache_creation_input_tokens || 0;

    // Aggregate daily data
    model.daily_data.forEach((day) => {
      if (!totalMetrics.daily_data[day.date]) {
        totalMetrics.daily_data[day.date] = {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
          api_requests: 0,
          spend: 0,
          successful_requests: 0,
          failed_requests: 0,
          cache_read_input_tokens: 0,
          cache_creation_input_tokens: 0,
        };
      }
      totalMetrics.daily_data[day.date].prompt_tokens += day.metrics.prompt_tokens;
      totalMetrics.daily_data[day.date].completion_tokens += day.metrics.completion_tokens;
      totalMetrics.daily_data[day.date].total_tokens += day.metrics.total_tokens;
      totalMetrics.daily_data[day.date].api_requests += day.metrics.api_requests;
      totalMetrics.daily_data[day.date].spend += day.metrics.spend;
      totalMetrics.daily_data[day.date].successful_requests += day.metrics.successful_requests;
      totalMetrics.daily_data[day.date].failed_requests += day.metrics.failed_requests;
      totalMetrics.daily_data[day.date].cache_read_input_tokens += day.metrics.cache_read_input_tokens || 0;
      totalMetrics.daily_data[day.date].cache_creation_input_tokens += day.metrics.cache_creation_input_tokens || 0;
    });
  });

  // Convert daily_data object to array and sort by date
  const sortedDailyData = Object.entries(totalMetrics.daily_data)
    .map(([date, metrics]) => ({ date, metrics }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-8">
      {/* Global Summary */}
      <div className="border rounded-lg p-4">
        <Title>{t("Overall Usage")}</Title>
        <Grid numItems={4} className="gap-4 mb-4">
          <Card>
            <Text>{t("Total Requests")}</Text>
            <Title>{totalMetrics.total_requests.toLocaleString()}</Title>
          </Card>
          <Card>
            <Text>{t("Total Successful Requests")}</Text>
            <Title>{totalMetrics.total_successful_requests.toLocaleString()}</Title>
          </Card>
          <Card>
            <Text>{t("Total Tokens")}</Text>
            <Title>{totalMetrics.total_tokens.toLocaleString()}</Title>
          </Card>
          <Card>
            <Text>{t("Total Spend")}</Text>
            <Title>${formatNumberWithCommas(totalMetrics.total_spend, 2)}</Title>
          </Card>
        </Grid>

        <Grid numItems={2} className="gap-4">
          <Card>
            <div className="flex justify-between items-center">
              <Title>{t("Total Tokens Over Time")}</Title>
              <CustomLegend
                categories={["metrics.prompt_tokens", "metrics.completion_tokens", "metrics.total_tokens"]}
                colors={["blue", "cyan", "indigo"]}
              />
            </div>
            <AreaChart
              className="mt-4"
              data={sortedDailyData}
              index="date"
              categories={["metrics.prompt_tokens", "metrics.completion_tokens", "metrics.total_tokens"]}
              colors={["blue", "cyan", "indigo"]}
              valueFormatter={valueFormatter}
              customTooltip={CustomTooltip}
              showLegend={false}
            />
          </Card>
          <Card>
            <Title>{t("Total Requests Over Time")}</Title>
            <AreaChart
              className="mt-4"
              data={sortedDailyData}
              index="date"
              categories={["metrics.successful_requests", "metrics.failed_requests"]}
              colors={["emerald", "red"]}
              valueFormatter={(number: number) => number.toLocaleString()}
              stack
              customTooltip={CustomTooltip}
              showLegend={false}
            />
          </Card>
        </Grid>
      </div>

      {/* Individual Model Sections */}
      <Collapse defaultActiveKey={modelNames[0]}>
        {modelNames.map((modelName) => (
          <Collapse.Panel
            key={modelName}
            header={
              <div className="flex justify-between items-center w-full">
                <Title>{modelMetrics[modelName].label || t("Unknown Item")}</Title>
                <div className="flex space-x-4 text-sm text-gray-500">
                  <span>${formatNumberWithCommas(modelMetrics[modelName].total_spend, 2)}</span>
                  <span>{modelMetrics[modelName].total_requests.toLocaleString()} {t("requests")}</span>
                </div>
              </div>
            }
          >
            <ModelSection
              modelName={modelName || t("Unknown Model")}
              metrics={modelMetrics[modelName]}
              hidePromptCachingMetrics={hidePromptCachingMetrics}
            />
          </Collapse.Panel>
        ))}
      </Collapse>
    </div>
  );
};

// Helper function to format key label
export const formatKeyLabel = (modelData: KeyMetricWithMetadata, model: string, teams: Team[]): string => {
  const keyAlias = modelData.metadata.key_alias || `key-hash-${model}`;
  const teamId = modelData.metadata.team_id;
  if (teamId) {
    const teamAlias = resolveTeamAliasFromTeamID(teamId, teams);
    return teamAlias ? `${keyAlias} (team: ${teamAlias})` : `${keyAlias} (team_id: ${teamId})`;
  }
  return keyAlias;
};

// Process data function
export const processActivityData = (
  dailyActivity: { results: DailyData[] },
  key: "models" | "api_keys" | "mcp_servers",
  teams: Team[] = [],
): Record<string, ModelActivityData> => {
  const modelMetrics: Record<string, ModelActivityData> = {};

  dailyActivity.results.forEach((day) => {
    Object.entries(day.breakdown[key] || {}).forEach(([model, modelData]) => {
      if (!modelMetrics[model]) {
        modelMetrics[model] = {
          label: key === "api_keys" ? formatKeyLabel(modelData as KeyMetricWithMetadata, model, teams) : model,
          total_requests: 0,
          total_successful_requests: 0,
          total_failed_requests: 0,
          total_tokens: 0,
          prompt_tokens: 0,
          completion_tokens: 0,
          total_spend: 0,
          total_cache_read_input_tokens: 0,
          total_cache_creation_input_tokens: 0,
          top_api_keys: [],
          daily_data: [],
        };
      }
      // Update totals
      modelMetrics[model].total_requests += modelData.metrics.api_requests;
      modelMetrics[model].prompt_tokens += modelData.metrics.prompt_tokens;
      modelMetrics[model].completion_tokens += modelData.metrics.completion_tokens;
      modelMetrics[model].total_tokens += modelData.metrics.total_tokens;
      modelMetrics[model].total_spend += modelData.metrics.spend;
      modelMetrics[model].total_successful_requests += modelData.metrics.successful_requests;
      modelMetrics[model].total_failed_requests += modelData.metrics.failed_requests;
      modelMetrics[model].total_cache_read_input_tokens += modelData.metrics.cache_read_input_tokens || 0;
      modelMetrics[model].total_cache_creation_input_tokens += modelData.metrics.cache_creation_input_tokens || 0;

      // Add daily data
      modelMetrics[model].daily_data.push({
        date: day.date,
        metrics: {
          prompt_tokens: modelData.metrics.prompt_tokens,
          completion_tokens: modelData.metrics.completion_tokens,
          total_tokens: modelData.metrics.total_tokens,
          api_requests: modelData.metrics.api_requests,
          spend: modelData.metrics.spend,
          successful_requests: modelData.metrics.successful_requests,
          failed_requests: modelData.metrics.failed_requests,
          cache_read_input_tokens: modelData.metrics.cache_read_input_tokens || 0,
          cache_creation_input_tokens: modelData.metrics.cache_creation_input_tokens || 0,
        },
      });
    });
  });

  // Process Virtual Key breakdowns for each metric (skip if key is 'api_keys' to avoid duplication)
  if (key !== "api_keys") {
    Object.entries(modelMetrics).forEach(([model, _]) => {
      const apiKeyBreakdown: Record<string, TopApiKeyData> = {};

      // Aggregate Virtual Key data across all days
      dailyActivity.results.forEach((day) => {
        const modelData = day.breakdown[key]?.[model];
        if (modelData && "api_key_breakdown" in modelData) {
          Object.entries(modelData.api_key_breakdown || {}).forEach(([apiKey, keyData]) => {
            if (!apiKeyBreakdown[apiKey]) {
              apiKeyBreakdown[apiKey] = {
                api_key: apiKey,
                key_alias: keyData.metadata.key_alias,
                team_id: keyData.metadata.team_id,
                spend: 0,
                requests: 0,
                tokens: 0,
              };
            }

            apiKeyBreakdown[apiKey].spend += keyData.metrics.spend;
            apiKeyBreakdown[apiKey].requests += keyData.metrics.api_requests;
            apiKeyBreakdown[apiKey].tokens += keyData.metrics.total_tokens;
          });
        }
      });

      // Sort by spend and take top 5
      modelMetrics[model].top_api_keys = Object.values(apiKeyBreakdown)
        .sort((a, b) => b.spend - a.spend)
        .slice(0, 5);
    });
  }

  // Sort daily data
  Object.values(modelMetrics).forEach((metrics) => {
    metrics.daily_data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  });

  return modelMetrics;
};

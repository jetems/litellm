import React from "react";
import { Select } from "antd";
import { useTranslate } from "@/i18n";

interface RoutingStrategySelectorProps {
  selectedStrategy: string | null;
  availableStrategies: string[];
  routingStrategyDescriptions: { [key: string]: string };
  routerFieldsMetadata: { [key: string]: any };
  onStrategyChange: (strategy: string) => void;
}

// Translation mapping for routing strategy descriptions
const ROUTING_STRATEGY_TRANSLATION_KEYS: { [key: string]: string } = {
  "simple-shuffle": "Randomly picks a deployment from the list. Simple and fast.",
  "least-busy": "Routes to the deployment with the lowest number of ongoing requests.",
  "latency-based-routing": "Routes to the deployment with the lowest latency over a sliding window.",
  "cost-based-routing": "Routes to the deployment with the lowest cost per token.",
  "usage-based-routing": "Routes to the deployment with the lowest TPM (Tokens Per Minute) usage. (deprecated)",
  "usage-based-routing-v2": "Improved version of usage-based routing with better tracking.",
};

const RoutingStrategySelector: React.FC<RoutingStrategySelectorProps> = ({
  selectedStrategy,
  availableStrategies,
  routingStrategyDescriptions,
  routerFieldsMetadata,
  onStrategyChange,
}) => {
  const t = useTranslate();

  // Get translated description for a strategy
  const getTranslatedDescription = (strategy: string): string => {
    const originalDescription = routingStrategyDescriptions[strategy] || ROUTING_STRATEGY_TRANSLATION_KEYS[strategy];
    if (originalDescription) {
      return t(originalDescription);
    }
    return "";
  };

  // Get translated field description
  const getFieldDescription = (): string => {
    const desc = routerFieldsMetadata["routing_strategy"]?.field_description;
    if (desc) {
      return t(desc);
    }
    return "";
  };

  // Get translated UI field name
  const getFieldName = (): string => {
    const name = routerFieldsMetadata["routing_strategy"]?.ui_field_name;
    if (name) {
      return t(name);
    }
    return t("Routing Strategy");
  };

  return (
    <div className="space-y-2 max-w-3xl">
      <div>
        <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">
          {getFieldName()}
        </label>
        <p className="text-xs text-gray-500 mt-0.5 mb-2">
          {getFieldDescription()}
        </p>
      </div>
      <div className="routing-strategy-select max-w-3xl">
        <Select
          value={selectedStrategy}
          onChange={onStrategyChange}
          style={{ width: "100%" }}
          size="large"
        >
          {availableStrategies.map((strategy) => (
            <Select.Option key={strategy} value={strategy} label={strategy}>
              <div className="flex flex-col gap-0.5 py-1">
                <span className="font-mono text-sm font-medium">{strategy}</span>
                {(routingStrategyDescriptions[strategy] || ROUTING_STRATEGY_TRANSLATION_KEYS[strategy]) && (
                  <span className="text-xs text-gray-500 font-normal">
                    {getTranslatedDescription(strategy)}
                  </span>
                )}
              </div>
            </Select.Option>
          ))}
        </Select>
      </div>
    </div>
  );
};

export default RoutingStrategySelector;


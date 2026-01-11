/**
 * Unified selector component that handles both model and agent selection
 * based on the current endpoint configuration.
 */

import { Select, Spin } from "antd";
import { SelectorOption, EndpointConfig } from "../endpoint_config";
import { useTranslate } from "@/i18n";

interface UnifiedSelectorProps {
  value: string;
  options: SelectorOption[];
  loading: boolean;
  config: EndpointConfig;
  onChange: (value: string) => void;
}

export function UnifiedSelector({
  value,
  options,
  loading,
  config,
  onChange,
}: UnifiedSelectorProps) {
  const t = useTranslate();

  const getPlaceholder = () => {
    if (loading) {
      return t(`Loading ${config.selectorLabel.toLowerCase()}s...`);
    }
    return t(config.selectorPlaceholder);
  };

  const getNotFoundContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-2">
          <Spin size="small" />
        </div>
      );
    }
    return t(`No ${config.selectorLabel.toLowerCase()}s available`);
  };

  return (
    <Select
      value={value || undefined}
      placeholder={getPlaceholder()}
      onChange={onChange}
      loading={loading}
      showSearch
      filterOption={(input, option) =>
        (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
      }
      options={options}
      className="w-48"
      notFoundContent={getNotFoundContent()}
    />
  );
}

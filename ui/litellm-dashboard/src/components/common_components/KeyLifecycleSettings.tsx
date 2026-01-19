import React, { useState } from "react";
import { Select, Tooltip, Divider, Switch } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { TextInput } from "@tremor/react";
import { useTranslate } from "../../i18n";

const { Option } = Select;

interface KeyLifecycleSettingsProps {
  form: any; // Form instance from parent
  autoRotationEnabled: boolean;
  onAutoRotationChange: (enabled: boolean) => void;
  rotationInterval: string;
  onRotationIntervalChange: (interval: string) => void;
}

const KeyLifecycleSettings: React.FC<KeyLifecycleSettingsProps> = ({
  form,
  autoRotationEnabled,
  onAutoRotationChange,
  rotationInterval,
  onRotationIntervalChange,
}) => {
  const t = useTranslate();
  // Predefined intervals
  const predefinedIntervals = ["7d", "30d", "90d", "180d", "365d"];

  // Check if current interval is custom
  const isCustomInterval = rotationInterval && !predefinedIntervals.includes(rotationInterval);

  const [showCustomInput, setShowCustomInput] = useState(isCustomInterval);
  const [customInterval, setCustomInterval] = useState(isCustomInterval ? rotationInterval : "");
  const [durationValue, setDurationValue] = useState<string>(form?.getFieldValue?.("duration") || "");

  const handleIntervalChange = (value: string) => {
    if (value === "custom") {
      setShowCustomInput(true);
      // Don't change the actual interval yet, wait for custom input
    } else {
      setShowCustomInput(false);
      setCustomInterval("");
      onRotationIntervalChange(value);
    }
  };

  const handleCustomIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomInterval(value);
    onRotationIntervalChange(value);
  };

  const handleDurationChange = (value: string) => {
    setDurationValue(value);
    if (form && typeof form.setFieldValue === "function") {
      form.setFieldValue("duration", value);
    } else if (form && typeof form.setFieldsValue === "function") {
      form.setFieldsValue({ duration: value });
    }
  };
  return (
    <div className="space-y-6">
      {/* Key Expiry Section */}
      <div className="space-y-4">
        <span className="text-sm font-medium text-gray-700">{t("Key Expiry Settings")}</span>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center space-x-1">
            <span>{t("Expire Key")}</span>
            <Tooltip title={t("Set when this key should expire. Format: 30s (seconds), 30m (minutes), 30h (hours), 30d (days). Use -1 to never expire.")}>
              <InfoCircleOutlined className="text-gray-400 cursor-help text-xs" />
            </Tooltip>
          </label>
          <TextInput
            name="duration"
            placeholder={t("e.g., 30d or -1 to never expire")}
            className="w-full"
            value={durationValue}
            onValueChange={handleDurationChange}
          />
        </div>
      </div>

      <Divider />

      {/* Auto-Rotation Section */}
      <div className="space-y-4">
        <span className="text-sm font-medium text-gray-700">{t("Auto-Rotation Settings")}</span>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center space-x-1">
              <span>{t("Enable Auto-Rotation")}</span>
              <Tooltip title={t("Key will automatically regenerate at the specified interval for enhanced security.")}>
                <InfoCircleOutlined className="text-gray-400 cursor-help text-xs" />
              </Tooltip>
            </label>
            <Switch
              checked={autoRotationEnabled}
              onChange={onAutoRotationChange}
              size="default"
              className={autoRotationEnabled ? "" : "bg-gray-400"}
            />
          </div>

          {autoRotationEnabled && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center space-x-1">
                <span>{t("Rotation Interval")}</span>
                <Tooltip title={t("How often the key should be automatically rotated. Choose the interval that best fits your security requirements.")}>
                  <InfoCircleOutlined className="text-gray-400 cursor-help text-xs" />
                </Tooltip>
              </label>
              <div className="space-y-2">
                <Select
                  value={showCustomInput ? "custom" : rotationInterval}
                  onChange={handleIntervalChange}
                  className="w-full"
                  placeholder={t("Select interval")}
                >
                  <Option value="7d">{t("7 days")}</Option>
                  <Option value="30d">{t("30 days")}</Option>
                  <Option value="90d">{t("90 days")}</Option>
                  <Option value="180d">{t("180 days")}</Option>
                  <Option value="365d">{t("365 days")}</Option>
                  <Option value="custom">{t("Custom interval")}</Option>
                </Select>

                {showCustomInput && (
                  <div className="space-y-1">
                    <TextInput
                      value={customInterval}
                      onChange={handleCustomIntervalChange}
                      placeholder={t("e.g., 1s, 5m, 2h, 14d")}
                    />
                    <div className="text-xs text-gray-500">
                      {t("Supported formats: seconds (s), minutes (m), hours (h), days (d)")}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {autoRotationEnabled && (
          <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-700">
            {t("When rotation occurs, you'll receive a notification with the new key. The old key will be deactivated after a brief grace period.")}
          </div>
        )}
      </div>
    </div>
  );
};

export default KeyLifecycleSettings;

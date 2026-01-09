import React from "react";
import { Form, Select, Tooltip } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { useTranslate } from "@/i18n";

const { Option } = Select;

interface RateLimitTypeFormItemProps {
  /** The type of rate limit - either 'tpm' or 'rpm' */
  type: "tpm" | "rpm";
  /** The form field name */
  name: string;
  /** Whether to show detailed descriptions (default: true) */
  showDetailedDescriptions?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Initial value for the field */
  initialValue?: string | null;
  /** Form instance for setting field values */
  form?: any;
  /** Custom onChange handler */
  onChange?: (value: string) => void;
}

export const RateLimitTypeFormItem: React.FC<RateLimitTypeFormItemProps> = ({
  type,
  name,
  showDetailedDescriptions = true,
  className = "",
  initialValue = null,
  form,
  onChange,
}) => {
  const t = useTranslate();
  const limitTypeUpper = type.toUpperCase();
  const limitTypeLower = type.toLowerCase();

  const handleChange = (value: string) => {
    if (form) {
      form.setFieldValue(name, value);
    }
    if (onChange) {
      onChange(value);
    }
  };

  const tooltipTitle = t("Select 'guaranteed_throughput' to prevent overallocating limit when the key belongs to a Team with specific limits.", { type: limitTypeUpper });

  return (
    <Form.Item
      label={
        <span>
          {t("{type} Rate Limit Type", { type: limitTypeUpper })}{" "}
          <Tooltip title={tooltipTitle}>
            <InfoCircleOutlined style={{ marginLeft: "4px" }} />
          </Tooltip>
        </span>
      }
      name={name}
      initialValue={initialValue}
      className={className}
    >
      <Select
        defaultValue={showDetailedDescriptions ? "default" : undefined}
        placeholder={t("Select rate limit type")}
        style={{ width: "100%" }}
        optionLabelProp={showDetailedDescriptions ? "label" : undefined}
        onChange={handleChange}
      >
        {showDetailedDescriptions ? (
          <>
            <Option value="best_effort_throughput" label={t("Default")}>
              <div style={{ padding: "4px 0" }}>
                <div style={{ fontWeight: 500 }}>{t("Default")}</div>
                <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>
                  {t("Best effort throughput - no error if overallocating (Team/Key Limits checked at runtime).")}
                </div>
              </div>
            </Option>
            <Option value="guaranteed_throughput" label={t("Guaranteed throughput")}>
              <div style={{ padding: "4px 0" }}>
                <div style={{ fontWeight: 500 }}>{t("Guaranteed throughput")}</div>
                <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>
                  {t("Guaranteed throughput - raise an error if overallocating (also checks model-specific limits)")}
                </div>
              </div>
            </Option>
            <Option value="dynamic" label={t("Dynamic")}>
              <div style={{ padding: "4px 0" }}>
                <div style={{ fontWeight: 500 }}>{t("Dynamic")}</div>
                <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>
                  {t("If the key has a set limit and there are no 429 errors, it can dynamically exceed the limit.")}
                </div>
              </div>
            </Option>
          </>
        ) : (
          <>
            <Option value="best_effort_throughput">{t("Best effort throughput")}</Option>
            <Option value="guaranteed_throughput">{t("Guaranteed throughput")}</Option>
            <Option value="dynamic">{t("Dynamic")}</Option>
          </>
        )}
      </Select>
    </Form.Item>
  );
};

export default RateLimitTypeFormItem;


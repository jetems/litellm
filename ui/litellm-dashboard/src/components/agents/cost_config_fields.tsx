import React from "react";
import { Form, Input } from "antd";
import { AGENT_FORM_CONFIG } from "./agent_config";

interface CostConfigFieldsProps {
  t?: (text: string, vars?: Record<string, string | number>) => string;
}

const CostConfigFields: React.FC<CostConfigFieldsProps> = ({ t }) => {
  // Use a fallback if t is not provided
  const _t = t || ((text: string) => text);

  return (
    <>
      {AGENT_FORM_CONFIG.cost.fields.map((field) => (
        <Form.Item
          key={field.name}
          label={_t(field.label)}
          name={field.name}
          tooltip={field.tooltip ? _t(field.tooltip) : undefined}
        >
          <Input placeholder={field.placeholder} type="number" step="0.000001" />
        </Form.Item>
      ))}
    </>
  );
};

export default CostConfigFields;


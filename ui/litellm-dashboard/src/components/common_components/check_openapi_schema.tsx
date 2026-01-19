import React, { useState, useEffect } from "react";
import { Form, Input, InputNumber, Select } from "antd";
import { TextInput } from "@tremor/react";
import { InfoCircleOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";
import { getOpenAPISchema } from "../networking";
import { formatLabel } from "@/utils/textUtils";
import { useTranslate } from "@/i18n";

interface SchemaProperty {
  type?: string;
  title?: string;
  description?: string;
  anyOf?: Array<{ type: string }>;
  enum?: string[];
  format?: string;
}

interface OpenAPISchema {
  properties: {
    [key: string]: SchemaProperty;
  };
  required?: string[];
}

interface SchemaFormFieldsProps {
  schemaComponent: string;
  excludedFields?: string[];
  form: any;
  overrideLabels?: { [key: string]: string };
  overrideTooltips?: { [key: string]: string };
  customValidation?: {
    [key: string]: (rule: any, value: any) => Promise<void>;
  };
  defaultValues?: { [key: string]: any };
}

// Define which fields should be parsed as JSON
export const jsonFields = ["metadata", "config", "enforced_params", "aliases"];

// Helper function to determine if a field should be treated as JSON
const isJSONField = (key: string, property: SchemaProperty): boolean => {
  return jsonFields.includes(key) || property.format === "json";
};

// Helper function to validate JSON input
const validateJSON = (value: string): boolean => {
  if (!value) return true;
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
};

const SchemaFormFields: React.FC<SchemaFormFieldsProps> = ({
  schemaComponent,
  excludedFields = [],
  form,
  overrideLabels = {},
  overrideTooltips = {},
  customValidation = {},
  defaultValues = {},
}) => {
  const t = useTranslate();
  const [schemaProperties, setSchemaProperties] = useState<OpenAPISchema | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getFieldHelp = (key: string, property: SchemaProperty, type: string): string => {
    // Default help text based on type
    const defaultHelp =
      {
        string: t("Text input"),
        number: t("Numeric input"),
        integer: t("Whole number input"),
        boolean: t("True/False value"),
      }[type] || t("Text input");

    // Specific field help text
    const specificHelp: { [key: string]: string } = {
      max_budget: t("Enter maximum budget in USD (e.g., 100.50)"),
      budget_duration: t("Select a time period for budget reset"),
      tpm_limit: t("Enter maximum tokens per minute (whole number)"),
      rpm_limit: t("Enter maximum requests per minute (whole number)"),
      duration: t("Enter duration (e.g., 30s, 24h, 7d)"),
      metadata: t("Enter JSON object with key-value pairs") + '\n' + t("Example") + ': {"team": "research", "project": "nlp"}',
      config: t("Enter configuration as JSON object") + '\n' + t("Example") + ': {"setting": "value"}',
      permissions: t("Enter comma-separated permission strings"),
      enforced_params: t("Enter parameters as JSON object") + '\n' + t("Example") + ': {"param": "value"}',
      blocked: t("Enter true/false or specific block conditions"),
      aliases: t("Enter aliases as JSON object") + '\n' + t("Example") + ': {"alias1": "value1", "alias2": "value2"}',
      models: t("Select one or more model names"),
      key_alias: t("Enter a unique identifier for this key"),
      tags: t("Enter comma-separated tag strings"),
    };

    // Get specific help text or use default based on type
    const helpText = specificHelp[key] || defaultHelp;

    // Add format requirements for special cases
    if (isJSONField(key, property)) {
      return `${helpText}\n${t("Must be valid JSON format")}`;
    }

    if (property.enum) {
      return `${t("Select from available options")}\n${t("Allowed values")}: ${property.enum.join(", ")}`;
    }

    return helpText;
  };

  useEffect(() => {
    const fetchOpenAPISchema = async () => {
      try {
        const schema = await getOpenAPISchema();
        const componentSchema = schema.components.schemas[schemaComponent];

        if (!componentSchema) {
          throw new Error(`Schema component "${schemaComponent}" not found`);
        }

        setSchemaProperties(componentSchema);

        const defaultFormValues: { [key: string]: any } = {};
        Object.keys(componentSchema.properties)
          .filter((key) => !excludedFields.includes(key) && defaultValues[key] !== undefined)
          .forEach((key) => {
            defaultFormValues[key] = defaultValues[key];
          });

        form.setFieldsValue(defaultFormValues);
      } catch (error) {
        console.error("Schema fetch error:", error);
        setError(error instanceof Error ? error.message : t("Failed to fetch schema"));
      }
    };

    fetchOpenAPISchema();
  }, [schemaComponent, form, excludedFields]);

  const getPropertyType = (property: SchemaProperty): string => {
    if (property.type) {
      return property.type;
    }
    if (property.anyOf) {
      const types = property.anyOf.map((t) => t.type);
      if (types.includes("number") || types.includes("integer")) return "number";
      if (types.includes("string")) return "string";
    }
    return "string";
  };

  const renderFormItem = (key: string, property: SchemaProperty) => {
    const type = getPropertyType(property);
    const isRequired = schemaProperties?.required?.includes(key);

    const label = overrideLabels[key] || t(property.title || formatLabel(key));
    const tooltip = overrideTooltips[key] || (property.description ? t(property.description) : undefined);

    const rules = [];
    if (isRequired) {
      rules.push({ required: true, message: `${label} ${t("is required")}` });
    }
    if (customValidation[key]) {
      rules.push({ validator: customValidation[key] });
    }
    if (isJSONField(key, property)) {
      rules.push({
        validator: async (_: any, value: string) => {
          if (value && !validateJSON(value)) {
            throw new Error(t("Please enter valid JSON"));
          }
        },
      });
    }

    const formLabel = tooltip ? (
      <span>
        {label}{" "}
        <Tooltip title={tooltip}>
          <InfoCircleOutlined style={{ marginLeft: "4px" }} />
        </Tooltip>
      </span>
    ) : (
      label
    );

    let inputComponent;
    if (isJSONField(key, property)) {
      inputComponent = <Input.TextArea rows={4} placeholder={t("Enter as JSON")} className="font-mono" />;
    } else if (property.enum) {
      inputComponent = (
        <Select>
          {property.enum.map((value) => (
            <Select.Option key={value} value={value}>
              {value}
            </Select.Option>
          ))}
        </Select>
      );
    } else if (type === "number" || type === "integer") {
      inputComponent = <InputNumber style={{ width: "100%" }} precision={type === "integer" ? 0 : undefined} />;
    } else if (key === "duration") {
      inputComponent = <TextInput placeholder="eg: 30s, 30h, 30d" />;
    } else {
      inputComponent = <TextInput placeholder={tooltip || ""} />;
    }

    return (
      <Form.Item
        key={key}
        label={formLabel}
        name={key}
        className="mt-8"
        rules={rules}
        initialValue={defaultValues[key]}
        help={<div className="text-xs text-gray-500">{getFieldHelp(key, property, type)}</div>}
      >
        {inputComponent}
      </Form.Item>
    );
  };

  if (error) {
    return <div className="text-red-500">{t("Error")}: {error}</div>;
  }

  if (!schemaProperties?.properties) {
    return null;
  }

  return (
    <div>
      {Object.entries(schemaProperties.properties)
        .filter(([key]) => !excludedFields.includes(key))
        .map(([key, property]) => renderFormItem(key, property))}
    </div>
  );
};

export default SchemaFormFields;


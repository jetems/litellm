import GuardrailSelector from "@/components/guardrails/GuardrailSelector";
import { InfoCircleOutlined } from "@ant-design/icons";
import { TextInput, Button as TremorButton } from "@tremor/react";
import { useTranslate } from "@/i18n";
import { Form, Input, Select, Switch, Tooltip } from "antd";
import { useEffect, useState } from "react";
import AgentSelector from "../agent_management/AgentSelector";
import { mapInternalToDisplayNames } from "../callback_info_helpers";
import KeyLifecycleSettings from "../common_components/KeyLifecycleSettings";
import PassThroughRoutesSelector from "../common_components/PassThroughRoutesSelector";
import RateLimitTypeFormItem from "../common_components/RateLimitTypeFormItem";
import { extractLoggingSettings, formatMetadataForDisplay, stripTagsFromMetadata } from "../key_info_utils";
import { KeyResponse } from "../key_team_helpers/key_list";
import MCPServerSelector from "../mcp_server_management/MCPServerSelector";
import MCPToolPermissions from "../mcp_server_management/MCPToolPermissions";
import NotificationsManager from "../molecules/notifications_manager";
import { getPromptsList, modelAvailableCall, tagListCall } from "../networking";
import { fetchTeamModels } from "../organisms/create_key_button";
import NumericalInput from "../shared/numerical_input";
import { Tag } from "../tag_management/types";
import EditLoggingSettings from "../team/EditLoggingSettings";
import VectorStoreSelector from "../vector_store_management/VectorStoreSelector";

interface KeyEditViewProps {
  keyData: KeyResponse;
  onCancel: () => void;
  onSubmit: (values: any) => Promise<void>;
  teams?: any[] | null;
  accessToken: string | null;
  userID: string | null;
  userRole: string | null;
  premiumUser?: boolean;
}

// Add this helper function
const getAvailableModelsForKey = (keyData: KeyResponse, teams: any[] | null): string[] => {
  // If no teams data is available, return empty array
  console.log("getAvailableModelsForKey:", teams);
  if (!teams || !keyData.team_id) {
    return [];
  }

  // Find the team that matches the key's team_id
  const keyTeam = teams.find((team) => team.team_id === keyData.team_id);

  // If team found and has models, return those models
  if (keyTeam?.models) {
    return keyTeam.models;
  }

  return [];
};

// Helper function to determine key_type display value from allowed_routes
const getKeyTypeFromRoutes = (allowedRoutes: string[] | null | undefined): string => {
  if (!allowedRoutes || allowedRoutes.length === 0) {
    return "default";
  }

  if (allowedRoutes.includes("llm_api_routes")) {
    return "llm_api";
  }

  if (allowedRoutes.includes("management_routes")) {
    return "management";
  }

  if (allowedRoutes.includes("info_routes")) {
    return "read_only";
  }

  return "default";
};

export function KeyEditView({
  keyData,
  onCancel,
  onSubmit,
  teams,
  accessToken,
  userID,
  userRole,
  premiumUser = false,
}: KeyEditViewProps) {
  const t = useTranslate();
  const [form] = Form.useForm();
  const [promptsList, setPromptsList] = useState<string[]>([]);
  const [tagsList, setTagsList] = useState<Record<string, Tag>>({});
  const team = teams?.find((team) => team.team_id === keyData.team_id);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [disabledCallbacks, setDisabledCallbacks] = useState<string[]>(
    Array.isArray(keyData.metadata?.litellm_disabled_callbacks)
      ? mapInternalToDisplayNames(keyData.metadata.litellm_disabled_callbacks)
      : [],
  );
  const [autoRotationEnabled, setAutoRotationEnabled] = useState<boolean>(keyData.auto_rotate || false);
  const [rotationInterval, setRotationInterval] = useState<string>(keyData.rotation_interval || "");
  const [isKeySaving, setIsKeySaving] = useState(false);

  useEffect(() => {
    const fetchModels = async () => {
      if (!userID || !userRole || !accessToken) return;

      try {
        if (keyData.team_id === null) {
          // Fetch user models if no team
          const model_available = await modelAvailableCall(accessToken, userID, userRole);
          const available_model_names = model_available["data"].map((element: { id: string }) => element.id);
          setAvailableModels(available_model_names);
        } else if (team?.team_id) {
          // Fetch team models if team exists
          const models = await fetchTeamModels(userID, userRole, accessToken, team.team_id);
          setAvailableModels(Array.from(new Set([...team.models, ...models])));
        }
      } catch (error) {
        console.error("Error fetching models:", error);
      }
    };

    const fetchPrompts = async () => {
      if (!accessToken) return;
      try {
        const response = await getPromptsList(accessToken);
        setPromptsList(response.prompts.map((prompt) => prompt.prompt_id));
      } catch (error) {
        console.error("Failed to fetch prompts:", error);
      }
    };

    fetchPrompts();
    fetchModels();
  }, [userID, userRole, accessToken, team, keyData.team_id]);

  // Sync disabled callbacks with form when component mounts
  useEffect(() => {
    form.setFieldValue("disabled_callbacks", disabledCallbacks);
  }, [form, disabledCallbacks]);

  // Convert API budget duration to form format
  const getBudgetDuration = (duration: string | null) => {
    if (!duration) return null;
    const durationMap: Record<string, string> = {
      "24h": "daily",
      "7d": "weekly",
      "30d": "monthly",
    };
    return durationMap[duration] || null;
  };

  // Set initial form values
  const initialValues = {
    ...keyData,
    token: keyData.token || keyData.token_id,
    budget_duration: getBudgetDuration(keyData.budget_duration),
    metadata: formatMetadataForDisplay(stripTagsFromMetadata(keyData.metadata)),
    guardrails: keyData.metadata?.guardrails,
    disable_global_guardrails: keyData.metadata?.disable_global_guardrails || false,
    prompts: keyData.metadata?.prompts,
    tags: keyData.metadata?.tags,
    vector_stores: keyData.object_permission?.vector_stores || [],
    mcp_servers_and_groups: {
      servers: keyData.object_permission?.mcp_servers || [],
      accessGroups: keyData.object_permission?.mcp_access_groups || [],
    },
    mcp_tool_permissions: keyData.object_permission?.mcp_tool_permissions || {},
    agents_and_groups: {
      agents: keyData.object_permission?.agents || [],
      accessGroups: keyData.object_permission?.agent_access_groups || [],
    },
    logging_settings: extractLoggingSettings(keyData.metadata),
    disabled_callbacks: Array.isArray(keyData.metadata?.litellm_disabled_callbacks)
      ? mapInternalToDisplayNames(keyData.metadata.litellm_disabled_callbacks)
      : [],
    auto_rotate: keyData.auto_rotate || false,
    ...(keyData.rotation_interval && { rotation_interval: keyData.rotation_interval }),
    allowed_routes: keyData.allowed_routes,
  };

  useEffect(() => {
    form.setFieldsValue({
      ...keyData,
      token: keyData.token || keyData.token_id,
      budget_duration: getBudgetDuration(keyData.budget_duration),
      metadata: formatMetadataForDisplay(stripTagsFromMetadata(keyData.metadata)),
      guardrails: keyData.metadata?.guardrails,
      disable_global_guardrails: keyData.metadata?.disable_global_guardrails || false,
      prompts: keyData.metadata?.prompts,
      tags: keyData.metadata?.tags,
      vector_stores: keyData.object_permission?.vector_stores || [],
      mcp_servers_and_groups: {
        servers: keyData.object_permission?.mcp_servers || [],
        accessGroups: keyData.object_permission?.mcp_access_groups || [],
      },
      mcp_tool_permissions: keyData.object_permission?.mcp_tool_permissions || {},
      logging_settings: extractLoggingSettings(keyData.metadata),
      disabled_callbacks: Array.isArray(keyData.metadata?.litellm_disabled_callbacks)
        ? mapInternalToDisplayNames(keyData.metadata.litellm_disabled_callbacks)
        : [],
      auto_rotate: keyData.auto_rotate || false,
      ...(keyData.rotation_interval && { rotation_interval: keyData.rotation_interval }),
      allowed_routes: keyData.allowed_routes,
    });
  }, [keyData, form]);

  // Sync auto-rotation state with form values
  useEffect(() => {
    form.setFieldValue("auto_rotate", autoRotationEnabled);
  }, [autoRotationEnabled, form]);

  useEffect(() => {
    if (rotationInterval) {
      form.setFieldValue("rotation_interval", rotationInterval);
    }
  }, [rotationInterval, form]);

  // Fetch tags for selector
  useEffect(() => {
    const fetchTags = async () => {
      if (!accessToken) return;
      try {
        const response = await tagListCall(accessToken);
        setTagsList(response);
      } catch (error) {
        NotificationsManager.fromBackend(t("Error fetching tags: ") + error);
      }
    };
    fetchTags();
  }, [accessToken]);

  console.log("premiumUser:", premiumUser);

  const handleSubmit = async (values: any) => {
    try {
      setIsKeySaving(true);
      await onSubmit(values);
    } finally {
      setIsKeySaving(false);
    }
  };

  return (
    <Form form={form} onFinish={handleSubmit} initialValues={initialValues} layout="vertical">
      <Form.Item label={t("Key Alias")} name="key_alias">
        <TextInput />
      </Form.Item>

      <Form.Item label={t("Models")} name="models">
        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) =>
            prevValues.allowed_routes !== currentValues.allowed_routes || prevValues.models !== currentValues.models
          }
        >
          {({ getFieldValue, setFieldValue }) => {
            const allowedRoutes = getFieldValue("allowed_routes") || [];
            const isDisabled = allowedRoutes.includes("management_routes") || allowedRoutes.includes("info_routes");
            const models = getFieldValue("models") || [];

            return (
              <>
                <Select
                  mode="multiple"
                  placeholder={t("Select models")}
                  style={{ width: "100%" }}
                  disabled={isDisabled}
                  value={isDisabled ? [] : models}
                  onChange={(value) => setFieldValue("models", value)}
                >
                  {/* Only show All Team Models if team has models */}
                  {availableModels.length > 0 && <Select.Option value="all-team-models">{t("All Team Models")}</Select.Option>}
                  {availableModels.map((model) => (
                    <Select.Option key={model} value={model}>
                      {model}
                    </Select.Option>
                  ))}
                </Select>
                {isDisabled && (
                  <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>
                    {t("Models field is disabled for this key type")}
                  </div>
                )}
              </>
            );
          }}
        </Form.Item>
      </Form.Item>

      <Form.Item label={t("Key Type")}>
        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) => prevValues.allowed_routes !== currentValues.allowed_routes}
        >
          {({ getFieldValue, setFieldValue }) => {
            const allowedRoutes = getFieldValue("allowed_routes");
            const keyTypeValue = getKeyTypeFromRoutes(allowedRoutes);

            return (
              <Select
                placeholder={t("Select key type")}
                style={{ width: "100%" }}
                optionLabelProp="label"
                value={keyTypeValue}
                onChange={(value) => {
                  switch (value) {
                    case "default":
                      setFieldValue("allowed_routes", []);
                      break;
                    case "llm_api":
                      setFieldValue("allowed_routes", ["llm_api_routes"]);
                      break;
                    case "management":
                      setFieldValue("allowed_routes", ["management_routes"]);
                      setFieldValue("models", []);
                      break;
                  }
                }}
              >
                <Select.Option value="default" label={t("Default")}>
                  <div style={{ padding: "4px 0" }}>
                    <div style={{ fontWeight: 500 }}>{t("Default")}</div>
                    <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>
                      {t("Can call LLM API + Management routes")}
                    </div>
                  </div>
                </Select.Option>
                <Select.Option value="llm_api" label={t("LLM API")}>
                  <div style={{ padding: "4px 0" }}>
                    <div style={{ fontWeight: 500 }}>{t("LLM API")}</div>
                    <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>
                      {t("Can call only LLM API routes (chat/completions, embeddings, etc.)")}
                    </div>
                  </div>
                </Select.Option>
                <Select.Option value="management" label={t("Management")}>
                  <div style={{ padding: "4px 0" }}>
                    <div style={{ fontWeight: 500 }}>{t("Management")}</div>
                    <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>
                      {t("Can call only management routes (user/team/key management)")}
                    </div>
                  </div>
                </Select.Option>
              </Select>
            );
          }}
        </Form.Item>
      </Form.Item>

      <Form.Item label={t("Max Budget (USD)")} name="max_budget">
        <NumericalInput step={0.01} style={{ width: "100%" }} placeholder={t("Enter a numerical value")} />
      </Form.Item>

      <Form.Item label={t("Reset Budget")} name="budget_duration">
        <Select placeholder={t("n/a")}>
          <Select.Option value="daily">{t("Daily")}</Select.Option>
          <Select.Option value="weekly">{t("Weekly")}</Select.Option>
          <Select.Option value="monthly">{t("Monthly")}</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item label={t("TPM Limit")} name="tpm_limit">
        <NumericalInput min={0} />
      </Form.Item>

      <RateLimitTypeFormItem type="tpm" name="tpm_limit_type" showDetailedDescriptions={false} />

      <Form.Item label={t("RPM Limit")} name="rpm_limit">
        <NumericalInput min={0} />
      </Form.Item>

      <RateLimitTypeFormItem type="rpm" name="rpm_limit_type" showDetailedDescriptions={false} />

      <Form.Item label={t("Max Parallel Requests")} name="max_parallel_requests">
        <NumericalInput min={0} />
      </Form.Item>

      <Form.Item label={t("Model TPM Limit")} name="model_tpm_limit">
        <Input.TextArea rows={4} placeholder='{"gpt-4": 100, "claude-v1": 200}' />
      </Form.Item>

      <Form.Item label={t("Model RPM Limit")} name="model_rpm_limit">
        <Input.TextArea rows={4} placeholder='{"gpt-4": 100, "claude-v1": 200}' />
      </Form.Item>

      <Form.Item label={t("Guardrails")} name="guardrails">
        {accessToken && (
          <GuardrailSelector
            onChange={(v) => {
              form.setFieldValue("guardrails", v);
            }}
            accessToken={accessToken}
            disabled={!premiumUser}
          />
        )}
      </Form.Item>

      <Form.Item
        label={
          <span>
            {t("Disable Global Guardrails")}{" "}
            <Tooltip title={t("When enabled, this key will bypass any guardrails configured to run on every request (global guardrails)")}>
              <InfoCircleOutlined style={{ marginLeft: "4px" }} />
            </Tooltip>
          </span>
        }
        name="disable_global_guardrails"
        valuePropName="checked"
      >
        <Switch disabled={!premiumUser} checkedChildren={t("Yes")} unCheckedChildren={t("No")} />
      </Form.Item>

      <Form.Item label={t("Tags")} name="tags">
        <Select
          mode="tags"
          style={{ width: "100%" }}
          placeholder={t("Select or enter tags")}
          options={Object.values(tagsList).map((tag) => ({
            value: tag.name,
            label: tag.name,
            title: tag.description || tag.name,
          }))}
        />
      </Form.Item>

      <Form.Item label={t("Prompts")} name="prompts">
        <Tooltip title={!premiumUser ? t("Setting prompts by key is a premium feature") : ""} placement="top">
          <Select
            mode="tags"
            style={{ width: "100%" }}
            disabled={!premiumUser}
            placeholder={
              !premiumUser
                ? t("Setting prompts by key is a premium feature")
                : Array.isArray(keyData.metadata?.prompts) && keyData.metadata.prompts.length > 0
                  ? `${t("Current: ")}${keyData.metadata.prompts.join(", ")}`
                  : t("Select or enter prompts")
            }
            options={promptsList.map((name) => ({ value: name, label: name }))}
          />
        </Tooltip>
      </Form.Item>

      <Form.Item label={t("Allowed Pass Through Routes")} name="allowed_passthrough_routes">
        <Tooltip
          title={!premiumUser ? t("Setting allowed pass through routes by key is a premium feature") : ""}
          placement="top"
        >
          <PassThroughRoutesSelector
            onChange={(values: string[]) => form.setFieldValue("allowed_passthrough_routes", values)}
            value={form.getFieldValue("allowed_passthrough_routes")}
            accessToken={accessToken || ""}
            placeholder={
              !premiumUser
                ? t("Setting allowed pass through routes by key is a premium feature")
                : Array.isArray(keyData.metadata?.allowed_passthrough_routes) &&
                  keyData.metadata.allowed_passthrough_routes.length > 0
                  ? `${t("Current: ")}${keyData.metadata.allowed_passthrough_routes.join(", ")}`
                  : t("Select or enter allowed pass through routes")
            }
            disabled={!premiumUser}
          />
        </Tooltip>
      </Form.Item>

      <Form.Item label={t("Vector Stores")} name="vector_stores">
        <VectorStoreSelector
          onChange={(values: string[]) => form.setFieldValue("vector_stores", values)}
          value={form.getFieldValue("vector_stores")}
          accessToken={accessToken || ""}
          placeholder={t("Select vector stores")}
        />
      </Form.Item>

      <Form.Item label={t("MCP Servers / Access Groups")} name="mcp_servers_and_groups">
        <MCPServerSelector
          onChange={(val) => form.setFieldValue("mcp_servers_and_groups", val)}
          value={form.getFieldValue("mcp_servers_and_groups")}
          accessToken={accessToken || ""}
          placeholder={t("Select MCP servers or access groups (optional)")}
        />
      </Form.Item>

      {/* Hidden field to register mcp_tool_permissions with the form */}
      <Form.Item name="mcp_tool_permissions" initialValue={{}} hidden>
        <Input type="hidden" />
      </Form.Item>

      <Form.Item
        noStyle
        shouldUpdate={(prevValues, currentValues) =>
          prevValues.mcp_servers_and_groups !== currentValues.mcp_servers_and_groups ||
          prevValues.mcp_tool_permissions !== currentValues.mcp_tool_permissions
        }
      >
        {() => (
          <div className="mb-6">
            <MCPToolPermissions
              accessToken={accessToken || ""}
              selectedServers={form.getFieldValue("mcp_servers_and_groups")?.servers || []}
              toolPermissions={form.getFieldValue("mcp_tool_permissions") || {}}
              onChange={(toolPerms) => form.setFieldsValue({ mcp_tool_permissions: toolPerms })}
            />
          </div>
        )}
      </Form.Item>

      <Form.Item label={t("Agents / Access Groups")} name="agents_and_groups">
        <AgentSelector
          onChange={(val) => form.setFieldValue("agents_and_groups", val)}
          value={form.getFieldValue("agents_and_groups")}
          accessToken={accessToken || ""}
          placeholder={t("Select agents or access groups (optional)")}
        />
      </Form.Item>

      <Form.Item label={t("Team ID")} name="team_id">
        <Select
          placeholder={t("Select team")}
          showSearch
          style={{ width: "100%" }}
          filterOption={(input, option) => {
            const team = teams?.find((t) => t.team_id === option?.value);
            if (!team) return false;
            return team.team_alias?.toLowerCase().includes(input.toLowerCase()) ?? false;
          }}
        >
          {/* Only show All Team Models if team has models */}
          {teams?.map((team) => (
            <Select.Option key={team.team_id} value={team.team_id}>
              {`${team.team_alias} (${team.team_id})`}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item label={t("Logging Settings")} name="logging_settings">
        <EditLoggingSettings
          value={form.getFieldValue("logging_settings")}
          onChange={(values) => form.setFieldValue("logging_settings", values)}
          disabledCallbacks={disabledCallbacks}
          onDisabledCallbacksChange={(internalValues) => {
            // Convert internal values back to display names for UI state
            const displayNames = mapInternalToDisplayNames(internalValues);
            setDisabledCallbacks(displayNames);
            // Store internal values in form for submission
            form.setFieldValue("disabled_callbacks", internalValues);
          }}
        />
      </Form.Item>

      <Form.Item label={t("Metadata")} name="metadata">
        <Input.TextArea rows={10} />
      </Form.Item>

      {/* Auto-Rotation Settings */}
      <div className="mb-4">
        <KeyLifecycleSettings
          form={form}
          autoRotationEnabled={autoRotationEnabled}
          onAutoRotationChange={setAutoRotationEnabled}
          rotationInterval={rotationInterval}
          onRotationIntervalChange={setRotationInterval}
        />
        <Form.Item name="duration" hidden initialValue="">
          <Input />
        </Form.Item>
      </div>

      {/* Hidden form field for token */}
      <Form.Item name="token" hidden>
        <Input />
      </Form.Item>

      {/* Hidden form field for allowed_routes */}
      <Form.Item name="allowed_routes" hidden>
        <Input />
      </Form.Item>

      {/* Hidden form field for disabled callbacks */}
      <Form.Item name="disabled_callbacks" hidden>
        <Input />
      </Form.Item>

      {/* Hidden form fields for auto-rotation */}
      <Form.Item name="auto_rotate" hidden>
        <Input />
      </Form.Item>
      <Form.Item name="rotation_interval" hidden>
        <Input />
      </Form.Item>

      <div className="sticky z-10 bg-white p-4 border-t border-gray-200 bottom-[-1.5rem] inset-x-[-1.5rem]">
        <div className="flex justify-end items-center gap-2">
          <TremorButton variant="secondary" onClick={onCancel} disabled={isKeySaving}>
            {t("Cancel")}
          </TremorButton>
          <TremorButton type="submit" loading={isKeySaving}>
            {t("Save Changes")}
          </TremorButton>
        </div>
      </div>
    </Form>
  );
}

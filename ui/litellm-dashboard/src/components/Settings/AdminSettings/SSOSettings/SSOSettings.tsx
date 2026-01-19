"use client";

import { useTranslate } from "@/i18n";
import { useSSOSettings, type SSOSettingsValues } from "@/app/(dashboard)/hooks/sso/useSSOSettings";
import { Button, Card, Descriptions, Space, Typography } from "antd";
import { Edit, Shield, Trash2 } from "lucide-react";
import { useState } from "react";
import { ssoProviderDisplayNames, ssoProviderLogoMap } from "./constants";
import AddSSOSettingsModal from "./Modals/AddSSOSettingsModal";
import DeleteSSOSettingsModal from "./Modals/DeleteSSOSettingsModal";
import EditSSOSettingsModal from "./Modals/EditSSOSettingsModal";
import RedactableField from "./RedactableField";
import RoleMappings from "./RoleMappings";
import SSOSettingsEmptyPlaceholder from "./SSOSettingsEmptyPlaceholder";
import SSOSettingsLoadingSkeleton from "./SSOSettingsLoadingSkeleton";
import { detectSSOProvider } from "./utils";

const { Title, Text } = Typography;

export default function SSOSettings() {
  const t = useTranslate();
  const { data: ssoSettings, refetch, isLoading } = useSSOSettings();
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const isSSOConfigured =
    Boolean(ssoSettings?.values.google_client_id) ||
    Boolean(ssoSettings?.values.microsoft_client_id) ||
    Boolean(ssoSettings?.values.generic_client_id);

  const selectedProvider = ssoSettings?.values ? detectSSOProvider(ssoSettings.values) : null;
  const isRoleMappingsEnabled = Boolean(ssoSettings?.values.role_mappings);

  const renderEndpointValue = (value?: string | null) => (
    <Text className="font-mono text-gray-600 text-sm" copyable={!!value}>
      {value || "-"}
    </Text>
  );

  const renderSimpleValue = (value?: string | null) =>
    value ? value : <span className="text-gray-400 italic">{t("Not configured")}</span>;

  const descriptionsConfig = {
    column: {
      xxl: 1,
      xl: 1,
      lg: 1,
      md: 1,
      sm: 1,
      xs: 1,
    },
  };

  const providerConfigs = {
    google: {
      providerText: ssoProviderDisplayNames.google,
      fields: [
        {
          label: t("Client ID"),
          render: (values: SSOSettingsValues) => <RedactableField value={values.google_client_id} />,
        },
        {
          label: t("Client Secret"),
          render: (values: SSOSettingsValues) => <RedactableField value={values.google_client_secret} />,
        },
        { label: t("Proxy Base URL"), render: (values: SSOSettingsValues) => renderSimpleValue(values.proxy_base_url) },
      ],
    },
    microsoft: {
      providerText: ssoProviderDisplayNames.microsoft,
      fields: [
        {
          label: t("Client ID"),
          render: (values: SSOSettingsValues) => <RedactableField value={values.microsoft_client_id} />,
        },
        {
          label: t("Client Secret"),
          render: (values: SSOSettingsValues) => <RedactableField value={values.microsoft_client_secret} />,
        },
        { label: t("Tenant"), render: (values: any) => renderSimpleValue(values.microsoft_tenant) },
        { label: t("Proxy Base URL"), render: (values: SSOSettingsValues) => renderSimpleValue(values.proxy_base_url) },
      ],
    },
    okta: {
      providerText: ssoProviderDisplayNames.okta,
      fields: [
        {
          label: t("Client ID"),
          render: (values: SSOSettingsValues) => <RedactableField value={values.generic_client_id} />,
        },
        {
          label: t("Client Secret"),
          render: (values: SSOSettingsValues) => <RedactableField value={values.generic_client_secret} />,
        },
        {
          label: t("Authorization Endpoint"),
          render: (values: SSOSettingsValues) => renderEndpointValue(values.generic_authorization_endpoint),
        },
        {
          label: t("Token Endpoint"),
          render: (values: SSOSettingsValues) => renderEndpointValue(values.generic_token_endpoint),
        },
        {
          label: t("User Info Endpoint"),
          render: (values: SSOSettingsValues) => renderEndpointValue(values.generic_userinfo_endpoint),
        },
        { label: t("Proxy Base URL"), render: (values: SSOSettingsValues) => renderSimpleValue(values.proxy_base_url) },
      ],
    },
    generic: {
      providerText: ssoProviderDisplayNames.generic,
      fields: [
        {
          label: t("Client ID"),
          render: (values: SSOSettingsValues) => <RedactableField value={values.generic_client_id} />,
        },
        {
          label: t("Client Secret"),
          render: (values: SSOSettingsValues) => <RedactableField value={values.generic_client_secret} />,
        },
        {
          label: t("Authorization Endpoint"),
          render: (values: SSOSettingsValues) => renderEndpointValue(values.generic_authorization_endpoint),
        },
        {
          label: t("Token Endpoint"),
          render: (values: SSOSettingsValues) => renderEndpointValue(values.generic_token_endpoint),
        },
        {
          label: t("User Info Endpoint"),
          render: (values: SSOSettingsValues) => renderEndpointValue(values.generic_userinfo_endpoint),
        },
        { label: t("Proxy Base URL"), render: (values: SSOSettingsValues) => renderSimpleValue(values.proxy_base_url) },
      ],
    },
  };

  const renderSSOSettings = () => {
    if (!ssoSettings?.values || !selectedProvider) return null;

    const { values } = ssoSettings;
    const config = providerConfigs[selectedProvider as keyof typeof providerConfigs];

    if (!config) return null;

    return (
      <Descriptions bordered {...descriptionsConfig}>
        <Descriptions.Item label={t("Provider")}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {ssoProviderLogoMap[selectedProvider] && (
              <img
                src={ssoProviderLogoMap[selectedProvider]}
                alt={selectedProvider}
                style={{ height: 24, width: 24, objectFit: "contain" }}
              />
            )}
            <span>{config.providerText}</span>
          </div>
        </Descriptions.Item>
        {config.fields.map((field, index) => (
          <Descriptions.Item key={index} label={field.label}>
            {field.render(values)}
          </Descriptions.Item>
        ))}
      </Descriptions>
    );
  };

  return (
    <>
      {isLoading ? (
        <SSOSettingsLoadingSkeleton />
      ) : (
        <Space direction="vertical" size="large" className="w-full">
          <Card>
            <Space direction="vertical" size="large" className="w-full">
              {/* Header Section */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-gray-400" />
                  <div>
                    <Title level={3}>{t("SSO Configuration")}</Title>
                    <Text type="secondary">{t("Manage Single Sign-On authentication settings")}</Text>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isSSOConfigured && (
                    <>
                      <Button icon={<Edit className="w-4 h-4" />} onClick={() => setIsEditModalVisible(true)}>
                        {t("Edit SSO Settings")}
                      </Button>
                      <Button
                        danger
                        icon={<Trash2 className="w-4 h-4" />}
                        onClick={() => setIsDeleteModalVisible(true)}
                      >
                        {t("Delete SSO Settings")}
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {isSSOConfigured ? (
                renderSSOSettings()
              ) : (
                <SSOSettingsEmptyPlaceholder onAdd={() => setIsAddModalVisible(true)} />
              )}
            </Space>
          </Card>
          {isRoleMappingsEnabled && <RoleMappings roleMappings={ssoSettings?.values.role_mappings} />}
        </Space>
      )}

      <DeleteSSOSettingsModal
        isVisible={isDeleteModalVisible}
        onCancel={() => setIsDeleteModalVisible(false)}
        onSuccess={() => refetch()}
      />

      <AddSSOSettingsModal
        isVisible={isAddModalVisible}
        onCancel={() => setIsAddModalVisible(false)}
        onSuccess={() => {
          setIsAddModalVisible(false);
          refetch();
        }}
      />

      <EditSSOSettingsModal
        isVisible={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        onSuccess={() => {
          setIsEditModalVisible(false);
          refetch();
        }}
      />
    </>
  );
}

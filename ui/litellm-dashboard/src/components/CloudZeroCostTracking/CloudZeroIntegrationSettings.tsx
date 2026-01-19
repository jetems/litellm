import { useTranslate } from "@/i18n";
import { useCloudZeroDryRun } from "@/app/(dashboard)/hooks/cloudzero/useCloudZeroDryRun";
import { useCloudZeroExport } from "@/app/(dashboard)/hooks/cloudzero/useCloudZeroExport";
import { useCloudZeroDeleteSettings } from "@/app/(dashboard)/hooks/cloudzero/useCloudZeroSettings";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import DeleteResourceModal from "@/components/common_components/DeleteResourceModal";
import { Alert, Button, Card, Descriptions, Divider, message, Popconfirm, Tag } from "antd";
import { CheckCircle, Edit, Play, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import CloudZeroUpdateModal from "./CloudZeroUpdateModal";
import { CloudZeroSettings } from "./types";

interface CloudZeroIntegrationSettingsProps {
  settings: CloudZeroSettings;
  onSettingsUpdated: () => void;
}

export function CloudZeroIntegrationSettings({ settings, onSettingsUpdated }: CloudZeroIntegrationSettingsProps) {
  const t = useTranslate();
  const { accessToken } = useAuthorized();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const dryRunMutation = useCloudZeroDryRun(accessToken || "");
  const exportMutation = useCloudZeroExport(accessToken || "");
  const deleteMutation = useCloudZeroDeleteSettings(accessToken || "");

  const handleDryRun = () => {
    if (!accessToken) return;

    dryRunMutation.mutate(
      { limit: 10 },
      {
        onSuccess: (data) => {
          message.success(t("Dry run completed successfully"));
        },
        onError: (error) => {
          message.error(error?.message || t("Failed to perform dry run"));
        },
      },
    );
  };

  const dryRunResult = dryRunMutation.data ? JSON.stringify(dryRunMutation.data, null, 2) : null;

  const handleExport = () => {
    if (!accessToken) return;

    exportMutation.mutate(
      { operation: "replace_hourly" },
      {
        onSuccess: () => {
          message.success(t("Data successfully exported to CloudZero"));
        },
        onError: (error) => {
          message.error(error?.message || t("Failed to export data"));
        },
      },
    );
  };

  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  const handleEditModalOk = async () => {
    setIsEditModalOpen(false);
    onSettingsUpdated();
  };

  const handleEditModalCancel = () => {
    setIsEditModalOpen(false);
  };

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!accessToken) return;

    deleteMutation.mutate(undefined, {
      onSuccess: () => {
        message.success(t("CloudZero integration deleted successfully"));
        setIsDeleteModalOpen(false);
        onSettingsUpdated();
      },
      onError: (error) => {
        message.error(error?.message || t("Failed to delete CloudZero integration"));
      },
    });
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
  };

  return (
    <>
      <div className="space-y-6 w-full max-w-4xl mx-auto">
        <Card
          title={
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">{t("CloudZero Configuration")}</span>
              <Tag color="success" className="ml-2 capitalize">
                {settings.status || t("Active")}
              </Tag>
            </div>
          }
          extra={
            <div className="flex gap-2">
              <Button icon={<Edit size={16} />} onClick={handleEdit} className="flex items-center gap-2">
                {t("Edit")}
              </Button>
              <Button
                danger
                icon={<Trash2 size={16} />}
                onClick={handleDeleteClick}
                className="flex items-center gap-2"
              >
                {t("Delete")}
              </Button>
            </div>
          }
          className="shadow-sm"
        >
          <Descriptions
            bordered
            column={{
              xxl: 1,
              xl: 1,
              lg: 1,
              md: 1,
              sm: 1,
              xs: 1,
            }}
          >
            <Descriptions.Item label={t("API Key (Redacted)")}>
              <span className="font-mono text-gray-600">
                {settings.api_key_masked || <span className="text-gray-400 italic">{t("Not configured")}</span>}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label={t("Connection ID")}>
              <span className="font-mono text-gray-600">
                {settings.connection_id || <span className="text-gray-400 italic">{t("Not configured")}</span>}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label={t("Timezone")}>
              {settings.timezone || <span className="text-gray-400 italic">{t("Default (UTC)")}</span>}
            </Descriptions.Item>
          </Descriptions>

          <Divider orientation="left" className="text-gray-500">
            {t("Actions")}
          </Divider>

          <div className="flex flex-wrap gap-4 mb-6">
            <Button
              onClick={handleDryRun}
              loading={dryRunMutation.isPending}
              icon={<Play size={16} />}
              className="flex items-center gap-2"
            >
              {t("Run Dry Run Simulation")}
            </Button>

            <Popconfirm
              title={t("Export Data to CloudZero")}
              description={t("This will push the current accumulated cost data to CloudZero. Continue?")}
              onConfirm={handleExport}
              okText={t("Export")}
              cancelText={t("Cancel")}
            >
              <Button
                type="primary"
                loading={exportMutation.isPending}
                icon={<Upload size={16} />}
                className="flex items-center gap-2"
              >
                {t("Export Data Now")}
              </Button>
            </Popconfirm>
          </div>

          {dryRunResult && (
            <div className="mt-6 animate-in fade-in slide-in-from-top-4 duration-300">
              <Alert
                message={t("Dry Run Results")}
                description={
                  <div className="mt-2">
                    <p className="mb-2 text-gray-600">{t("Simulation output for connection")}: {settings.connection_id}</p>
                    <pre className="bg-gray-50 p-4 rounded-md border border-gray-200 overflow-x-auto text-xs font-mono text-gray-800">
                      {dryRunResult}
                    </pre>
                  </div>
                }
                type="info"
                showIcon
                icon={<CheckCircle className="text-blue-500" />}
              />
            </div>
          )}
        </Card>
      </div>

      <CloudZeroUpdateModal
        open={isEditModalOpen}
        onOk={handleEditModalOk}
        onCancel={handleEditModalCancel}
        settings={settings}
      />

      <DeleteResourceModal
        isOpen={isDeleteModalOpen}
        title={t("Delete CloudZero Integration?")}
        message={t("Are you sure you want to delete this CloudZero integration? All associated settings and configurations will be permanently removed.")}
        resourceInformationTitle={t("Integration Details")}
        resourceInformation={[
          {
            label: t("Connection ID"),
            value: settings.connection_id,
            code: true,
          },
          {
            label: t("Timezone"),
            value: settings.timezone || t("Default (UTC)"),
          },
        ]}
        onCancel={handleDeleteCancel}
        onOk={handleDeleteConfirm}
        confirmLoading={deleteMutation.isPending}
      />
    </>
  );
}

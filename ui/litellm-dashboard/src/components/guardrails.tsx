import React, { useState, useEffect } from "react";
import { Button, TabGroup, TabList, Tab, TabPanels, TabPanel } from "@tremor/react";
import { getGuardrailsList, deleteGuardrailCall } from "./networking";
import AddGuardrailForm from "./guardrails/add_guardrail_form";
import GuardrailTable from "./guardrails/guardrail_table";
import { isAdminRole } from "@/utils/roles";
import GuardrailInfoView from "./guardrails/guardrail_info";
import GuardrailTestPlayground from "./guardrails/GuardrailTestPlayground";
import NotificationsManager from "./molecules/notifications_manager";
import { Guardrail, GuardrailDefinitionLocation } from "./guardrails/types";
import DeleteResourceModal from "./common_components/DeleteResourceModal";
import { getGuardrailLogoAndName } from "./guardrails/guardrail_info_helpers";
import { useTranslate } from "@/i18n";

interface GuardrailsPanelProps {
  accessToken: string | null;
  userRole?: string;
}

interface GuardrailItem {
  guardrail_id?: string;
  guardrail_name: string | null;
  litellm_params: {
    guardrail: string;
    mode: string;
    default_on: boolean;
  };
  guardrail_info: Record<string, any> | null;
  created_at?: string;
  updated_at?: string;
  guardrail_definition_location: GuardrailDefinitionLocation;
}

interface GuardrailsResponse {
  guardrails: Guardrail[];
}

const GuardrailsPanel: React.FC<GuardrailsPanelProps> = ({ accessToken, userRole }) => {
  const t = useTranslate();
  const [guardrailsList, setGuardrailsList] = useState<Guardrail[]>([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [guardrailToDelete, setGuardrailToDelete] = useState<Guardrail | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedGuardrailId, setSelectedGuardrailId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);

  const isAdmin = userRole ? isAdminRole(userRole) : false;

  const fetchGuardrails = async () => {
    if (!accessToken) {
      return;
    }

    setIsLoading(true);
    try {
      const response: GuardrailsResponse = await getGuardrailsList(accessToken);
      console.log(`guardrails: ${JSON.stringify(response)}`);
      setGuardrailsList(response.guardrails);
    } catch (error) {
      console.error("Error fetching guardrails:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGuardrails();
  }, [accessToken]);

  const handleAddGuardrail = () => {
    if (selectedGuardrailId) {
      setSelectedGuardrailId(null);
    }
    setIsAddModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsAddModalVisible(false);
  };

  const handleSuccess = () => {
    fetchGuardrails();
  };

  const handleDeleteClick = (guardrailId: string, guardrailName: string) => {
    const guardrail = guardrailsList.find((g) => g.guardrail_id === guardrailId) || null;
    setGuardrailToDelete(guardrail);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!guardrailToDelete || !accessToken) return;

    // Log removed to maintain clean production code
    setIsDeleting(true);
    try {
      await deleteGuardrailCall(accessToken, guardrailToDelete.guardrail_id);
      NotificationsManager.success(t(`Guardrail "{{guardrailName}}" deleted successfully`).replace("{{guardrailName}}", guardrailToDelete.guardrail_name || ""));
      await fetchGuardrails(); // Refresh the list
    } catch (error) {
      console.error("Error deleting guardrail:", error);
      NotificationsManager.fromBackend(t("Failed to delete guardrail"));
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setGuardrailToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setGuardrailToDelete(null);
  };

  const providerDisplayName =
    guardrailToDelete && guardrailToDelete.litellm_params
      ? getGuardrailLogoAndName(guardrailToDelete.litellm_params.guardrail).displayName
      : undefined;

  return (
    <div className="w-full mx-auto flex-auto overflow-y-auto m-8 p-2">
      <TabGroup index={activeTab} onIndexChange={setActiveTab}>
        <TabList className="mb-4">
          <Tab>{t("Guardrails")}</Tab>
          <Tab disabled={!accessToken || guardrailsList.length === 0}>{t("Test Playground")}</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <div className="flex justify-between items-center mb-4">
              <Button onClick={handleAddGuardrail} disabled={!accessToken}>
                + {t("Add New Guardrail")}
              </Button>
            </div>

            {selectedGuardrailId ? (
              <GuardrailInfoView
                guardrailId={selectedGuardrailId}
                onClose={() => setSelectedGuardrailId(null)}
                accessToken={accessToken}
                isAdmin={isAdmin}
              />
            ) : (
              <GuardrailTable
                guardrailsList={guardrailsList}
                isLoading={isLoading}
                onDeleteClick={handleDeleteClick}
                accessToken={accessToken}
                onGuardrailUpdated={fetchGuardrails}
                isAdmin={isAdmin}
                onGuardrailClick={(id) => setSelectedGuardrailId(id)}
              />
            )}

            <AddGuardrailForm
              visible={isAddModalVisible}
              onClose={handleCloseModal}
              accessToken={accessToken}
              onSuccess={handleSuccess}
            />

            <DeleteResourceModal
              isOpen={isDeleteModalOpen}
              title={t("Delete Guardrail")}
              message={t(`Are you sure you want to delete guardrail: {{guardrailName}}? This action cannot be undone.`).replace("{{guardrailName}}", guardrailToDelete?.guardrail_name || "")}
              resourceInformationTitle={t("Guardrail Information")}
              resourceInformation={[
                { label: t("Name"), value: guardrailToDelete?.guardrail_name },
                { label: t("ID"), value: guardrailToDelete?.guardrail_id, code: true },
                { label: t("Provider"), value: providerDisplayName },
                { label: t("Mode"), value: guardrailToDelete?.litellm_params.mode },
                {
                  label: t("Default On"),
                  value: guardrailToDelete?.litellm_params.default_on ? t("Yes") : t("No"),
                },
              ]}
              onCancel={handleDeleteCancel}
              onOk={handleDeleteConfirm}
              confirmLoading={isDeleting}
            />
          </TabPanel>

          <TabPanel>
            <GuardrailTestPlayground
              guardrailsList={guardrailsList}
              isLoading={isLoading}
              accessToken={accessToken}
              onClose={() => setActiveTab(0)}
            />
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
};

export default GuardrailsPanel;

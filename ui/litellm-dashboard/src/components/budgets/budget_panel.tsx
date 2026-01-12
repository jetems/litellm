/**
 * The parent pane, showing list of budgets
 *
 */

import {
  Button,
  Card,
  Tab,
  TabGroup,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TabList,
  TabPanel,
  TabPanels,
  Text,
} from "@tremor/react";
import React, { useEffect, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import DeleteResourceModal from "../common_components/DeleteResourceModal";
import TableIconActionButton from "../common_components/IconActionButton/TableIconActionButtons/TableIconActionButton";
import NotificationsManager from "../molecules/notifications_manager";
import { budgetDeleteCall, getBudgetList } from "../networking";
import BudgetModal from "./budget_modal";
import EditBudgetModal from "./edit_budget_modal";
import { useTranslate } from "@/i18n";

interface BudgetSettingsPageProps {
  accessToken: string | null;
}

export interface budgetItem {
  budget_id: string;
  max_budget: string | null;
  rpm_limit: number | null;
  tpm_limit: number | null;
  updated_at: string;
}

const BudgetPanel: React.FC<BudgetSettingsPageProps> = ({ accessToken }) => {
  const t = useTranslate();
  const [isCreateModelVisible, setIsCreateModelVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<budgetItem | null>(null);
  const [budgetList, setBudgetList] = useState<budgetItem[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  useEffect(() => {
    if (!accessToken) {
      return;
    }
    getBudgetList(accessToken).then((data) => {
      setBudgetList(data);
    });
  }, [accessToken]);

  const handleEditCall = async (budget: budgetItem) => {
    if (accessToken == null) {
      return;
    }
    setSelectedBudget(budget);
    setIsEditModalVisible(true);
  };

  const handleDeleteClick = (budget: budgetItem) => {
    setSelectedBudget(budget);
    setIsDeleteModalVisible(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedBudget || accessToken == null) {
      return;
    }
    setIsDeleting(true);
    try {
      await budgetDeleteCall(accessToken, selectedBudget.budget_id);
      NotificationsManager.success(t("Budget deleted."));
      await handleUpdateCall();
    } catch (error) {
      console.error("Error deleting budget:", error);
      if (typeof NotificationsManager.fromBackend === "function") {
        NotificationsManager.fromBackend(t("Failed to delete budget"));
      } else {
        NotificationsManager.info(t("Failed to delete budget"));
      }
    } finally {
      setIsDeleting(false);
      setIsDeleteModalVisible(false);
      setSelectedBudget(null);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalVisible(false);
  };

  const handleUpdateCall = async () => {
    if (accessToken == null) {
      return;
    }
    getBudgetList(accessToken).then((data) => {
      setBudgetList(data);
    });
  };

  return (
    <div className="w-full mx-auto flex-auto overflow-y-auto m-8 p-2">
      <Button size="sm" variant="primary" className="mb-2" onClick={() => setIsCreateModelVisible(true)}>
        + {t("Create Budget")}
      </Button>
      <BudgetModal
        accessToken={accessToken}
        isModalVisible={isCreateModelVisible}
        setIsModalVisible={setIsCreateModelVisible}
        setBudgetList={setBudgetList}
      />
      {selectedBudget && (
        <EditBudgetModal
          accessToken={accessToken}
          isModalVisible={isEditModalVisible}
          setIsModalVisible={setIsEditModalVisible}
          setBudgetList={setBudgetList}
          existingBudget={selectedBudget}
          handleUpdateCall={handleUpdateCall}
        />
      )}
      <Card>
        <Text>{t("Create a budget to assign to customers.")}</Text>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>{t("Budget ID")}</TableHeaderCell>
              <TableHeaderCell>{t("Max Budget")}</TableHeaderCell>
              <TableHeaderCell>{t("TPM")}</TableHeaderCell>
              <TableHeaderCell>{t("RPM")}</TableHeaderCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {budgetList
              .slice() // Creates a shallow copy to avoid mutating the original array
              .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()) // Sort by updated_at in descending order
              .map((value: budgetItem, index: number) => (
                <TableRow key={index}>
                  <TableCell>{value.budget_id}</TableCell>
                  <TableCell>{value.max_budget ? value.max_budget : t("n/a")}</TableCell>
                  <TableCell>{value.tpm_limit ? value.tpm_limit : t("n/a")}</TableCell>
                  <TableCell>{value.rpm_limit ? value.rpm_limit : t("n/a")}</TableCell>
                  <TableIconActionButton
                    variant="Edit"
                    tooltipText={t("Edit budget")}
                    onClick={() => handleEditCall(value)}
                  />
                  <TableIconActionButton
                    variant="Delete"
                    tooltipText={t("Delete budget")}
                    onClick={() => handleDeleteClick(value)}
                  />
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Card>
      <DeleteResourceModal
        isOpen={isDeleteModalVisible}
        title={t("Delete Budget?")}
        message={t("Are you sure you want to delete this budget? This action cannot be undone.")}
        resourceInformationTitle={t("Budget Information")}
        resourceInformation={[
          { label: t("Budget ID"), value: selectedBudget?.budget_id, code: true },
          { label: t("Max Budget"), value: selectedBudget?.max_budget },
          { label: t("TPM"), value: selectedBudget?.tpm_limit },
          { label: t("RPM"), value: selectedBudget?.rpm_limit },
        ]}
        onCancel={handleDeleteCancel}
        onOk={handleDeleteConfirm}
        confirmLoading={isDeleting}
      />
      <div className="mt-5">
        <Text className="text-base">{t("How to use budget id")}</Text>
        <TabGroup>
          <TabList>
            <Tab>{t("Assign Budget to Customer")}</Tab>
            <Tab>{t("Test it (Curl)")}</Tab>

            <Tab>{t("Test it (OpenAI SDK)")}</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <SyntaxHighlighter language="bash">
                {`
curl -X POST --location '<your_proxy_base_url>/end_user/new' \

-H 'Authorization: Bearer <your-master-key>' \

-H 'Content-Type: application/json' \

-d '{"user_id": "my-customer-id', "budget_id": "<BUDGET_ID>"}' # 👈 KEY CHANGE

            `}
              </SyntaxHighlighter>
            </TabPanel>
            <TabPanel>
              <SyntaxHighlighter language="bash">
                {`
curl -X POST --location '<your_proxy_base_url>/chat/completions' \

-H 'Authorization: Bearer <your-master-key>' \

-H 'Content-Type: application/json' \

-d '{
  "model": "gpt-3.5-turbo', 
  "messages":[{"role": "user", "content": "Hey, how's it going?"}],
  "user": "my-customer-id"
}' # 👈 KEY CHANGE

            `}
              </SyntaxHighlighter>
            </TabPanel>
            <TabPanel>
              <SyntaxHighlighter language="python">
                {`from openai import OpenAI
client = OpenAI(
  base_url="<your_proxy_base_url>",
  api_key="<your_proxy_key>"
)

completion = client.chat.completions.create(
  model="gpt-3.5-turbo",
  messages=[
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"}
  ],
  user="my-customer-id"
)

print(completion.choices[0].message)`}
              </SyntaxHighlighter>
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </div>
    </div>
  );
};

export default BudgetPanel;

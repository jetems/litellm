import React from "react";
import { TextInput, Accordion, AccordionHeader, AccordionBody } from "@tremor/react";
import { Button as Button2, Modal, Form, InputNumber, Select } from "antd";
import { budgetCreateCall } from "../networking";
import NotificationsManager from "../molecules/notifications_manager";
import { useTranslate } from "@/i18n";

interface BudgetModalProps {
  isModalVisible: boolean;
  accessToken: string | null;
  setIsModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setBudgetList: React.Dispatch<React.SetStateAction<any[]>>;
}
const BudgetModal: React.FC<BudgetModalProps> = ({ isModalVisible, accessToken, setIsModalVisible, setBudgetList }) => {
  const t = useTranslate();
  const [form] = Form.useForm();
  const handleOk = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleCreate = async (formValues: Record<string, any>) => {
    if (accessToken == null || accessToken == undefined) {
      return;
    }
    try {
      NotificationsManager.info(t("Making API Call"));
      // setIsModalVisible(true);
      const response = await budgetCreateCall(accessToken, formValues);
      console.log("key create Response:", response);
      setBudgetList((prevData) => (prevData ? [...prevData, response] : [response])); // Check if prevData is null
      NotificationsManager.success(t("Budget Created"));
      form.resetFields();
    } catch (error) {
      console.error("Error creating the key:", error);
      NotificationsManager.fromBackend(`${t("Error creating the key:")} ${error}`);
    }
  };

  return (
    <Modal
      title={t("Create Budget")}
      visible={isModalVisible}
      width={800}
      footer={null}
      onOk={handleOk}
      onCancel={handleCancel}
    >
      <Form form={form} onFinish={handleCreate} labelCol={{ span: 8 }} wrapperCol={{ span: 16 }} labelAlign="left">
        <>
          <Form.Item
            label={t("Budget ID")}
            name="budget_id"
            rules={[
              {
                required: true,
                message: t("Please input a human-friendly name for the budget"),
              },
            ]}
            help={t("A human-friendly name for the budget")}
          >
            <TextInput placeholder="" />
          </Form.Item>
          <Form.Item label={t("Max Tokens per minute")} name="tpm_limit" help={t("Default is model limit.")}>
            <InputNumber step={1} precision={2} width={200} />
          </Form.Item>
          <Form.Item label={t("Max Requests per minute")} name="rpm_limit" help={t("Default is model limit.")}>
            <InputNumber step={1} precision={2} width={200} />
          </Form.Item>

          <Accordion className="mt-20 mb-8">
            <AccordionHeader>
              <b>{t("Optional Settings")}</b>
            </AccordionHeader>
            <AccordionBody>
              <Form.Item label={t("Max Budget (USD)")} name="max_budget">
                <InputNumber step={0.01} precision={2} width={200} />
              </Form.Item>
              <Form.Item className="mt-8" label={t("Reset Budget")} name="budget_duration">
                <Select defaultValue={null} placeholder={t("n/a")}>
                  <Select.Option value="24h">{t("daily")}</Select.Option>
                  <Select.Option value="7d">{t("weekly")}</Select.Option>
                  <Select.Option value="30d">{t("monthly")}</Select.Option>
                </Select>
              </Form.Item>
            </AccordionBody>
          </Accordion>
        </>

        <div style={{ textAlign: "right", marginTop: "10px" }}>
          <Button2 htmlType="submit">{t("Create Budget")}</Button2>
        </div>
      </Form>
    </Modal>
  );
};

export default BudgetModal;

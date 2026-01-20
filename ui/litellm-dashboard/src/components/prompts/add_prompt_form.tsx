import React, { useState } from "react";
import { Modal, Form, Select, Upload, Button, Divider, message, Input } from "antd";
import { UploadOutlined, FileTextOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd";
import { convertPromptFileToJson, createPromptCall } from "../networking";
import NotificationsManager from "../molecules/notifications_manager";
import { useTranslate } from "@/i18n";

const { Option } = Select;

interface AddPromptFormProps {
  visible: boolean;
  onClose: () => void;
  accessToken: string | null;
  onSuccess: () => void;
}

const AddPromptForm: React.FC<AddPromptFormProps> = ({ visible, onClose, accessToken, onSuccess }) => {
  const t = useTranslate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [promptIntegration, setPromptIntegration] = useState<string>("dotprompt");

  const handleCancel = () => {
    form.resetFields();
    setFileList([]);
    setPromptIntegration("dotprompt");
    onClose();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      console.log("values: ", values);
      if (!accessToken) {
        NotificationsManager.fromBackend("Access token is required");
        return;
      }

      if (promptIntegration === "dotprompt" && fileList.length === 0) {
        NotificationsManager.fromBackend(t("Please upload a .prompt file"));
        return;
      }

      const file = fileList[0];

      if (!file.originFileObj) {
        message.error("File object needed");
        return;
      }

      // Convert .prompt file to JSON
      const conversionResponse = await convertPromptFileToJson(accessToken, file.originFileObj);

      const promptData = {
        model: values.model || "gpt-3.5-turbo", // Default model if not specified
        messages: conversionResponse.json_data.messages,
        prompt_id: values.prompt_id,
        litellm_params: {
          prompt_id: values.prompt_id
        },
        prompt_info: {
          prompt_type: "dotprompt"
        }
      };

      await createPromptCall(accessToken, promptData);
      message.success(t("Prompt created successfully!"));
      form.resetFields();
      setFileList([]);
      onSuccess();
    } catch (error) {
      console.error("Error creating prompt:", error);
      message.error(t("Failed to create prompt"));
    } finally {
      setLoading(false);
    }
  };

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  const uploadProps = {
    onRemove: (file: any) => {
      setFileList((prev) => {
        const index = prev.indexOf(file);
        const newFileList = prev.slice();
        newFileList.splice(index, 1);
        return newFileList;
      });
    },
    beforeUpload: (file: any) => {
      // Check if file extension is .prompt
      const isPromptFile = file.name.endsWith('.prompt');
      if (!isPromptFile) {
        message.error(t("Please upload a .prompt file"));
        return Upload.LIST_IGNORE;
      }

      setFileList([file]); // Only allow one file
      return false; // Prevent automatic upload
    },
    fileList,
  };

  return (
    <Modal
      title={t("Add New Prompt")}
      open={visible}
      onCancel={handleCancel}
      footer={null}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          model: "gpt-3.5-turbo",
        }}
      >
        <Form.Item
          name="prompt_id"
          label={t("Prompt ID")}
          rules={[{ required: true, message: t("Please input prompt ID!") }]}
          help={t("Unique identifier for this prompt")}
        >
          <Input placeholder={t("Enter unique prompt ID...")} />
        </Form.Item>

        <Form.Item
          name="upload"
          label={t("Prompt File")}
          valuePropName="fileList"
          getValueFromEvent={normFile}
          extra={t("Upload a .prompt file containing your prompt template")}
        >
          <Upload {...uploadProps} maxCount={1} accept=".prompt">
            <Button icon={<UploadOutlined />}>{t("Select .prompt File")}</Button>
          </Upload>
        </Form.Item>

        {fileList.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-md flex items-center">
            <FileTextOutlined className="text-blue-500 mr-2" />
            <span className="text-blue-700 text-sm">
              {t("Selected: ")} <span className="font-semibold">{fileList[0].name}</span>
            </span>
          </div>
        )}

        <Divider />

        <div className="flex justify-end gap-2">
          <Button onClick={handleCancel} disabled={loading}>
            {t("Cancel")}
          </Button>
          <Button type="primary" htmlType="submit" loading={loading} disabled={fileList.length === 0}>
            {t("Create Prompt")}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default AddPromptForm;

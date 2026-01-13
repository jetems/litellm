import React, { useState, useEffect } from "react";
import { Button as TremorButton, Text } from "@tremor/react";
import { Modal, Table, Upload, Typography } from "antd";
import {
  UploadOutlined,
  DownloadOutlined,
  WarningOutlined,
  FileTextOutlined,
  DeleteOutlined,
  FileExclamationOutlined,
} from "@ant-design/icons";
import { userCreateCall, invitationCreateCall, getProxyUISettings } from "./networking";
import Papa from "papaparse";
import { CheckCircleIcon, XCircleIcon, ExclamationIcon } from "@heroicons/react/outline";
import { CopyToClipboard } from "react-copy-to-clipboard";
import NotificationsManager from "./molecules/notifications_manager";
import { useTranslate } from "@/i18n";
import { T } from "@/i18n";

interface BulkCreateUsersProps {
  accessToken: string;
  teams: any[] | null;
  possibleUIRoles: null | Record<string, Record<string, string>>;
  onUsersCreated?: () => void;
}

interface UserData {
  user_email: string;
  user_role: string;
  teams?: string | string[];
  metadata?: string;
  max_budget?: string | number;
  budget_duration?: string;
  models?: string | string[];
  status?: string;
  error?: string;
  rowNumber?: number;
  isValid?: boolean;
  key?: string;
  invitation_link?: string;
}

// Define an interface for the UI settings
interface UISettings {
  PROXY_BASE_URL: string | null;
  PROXY_LOGOUT_URL: string | null;
  DEFAULT_TEAM_DISABLED: boolean;
  SSO_ENABLED: boolean;
}

const BulkCreateUsersButton: React.FC<BulkCreateUsersProps> = ({
  accessToken,
  teams,
  possibleUIRoles,
  onUsersCreated,
}) => {
  const t = useTranslate();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [parsedData, setParsedData] = useState<UserData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [csvStructureError, setCsvStructureError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uiSettings, setUISettings] = useState<UISettings | null>(null);
  const [baseUrl, setBaseUrl] = useState("http://localhost:4000");

  useEffect(() => {
    // Get UI settings
    const fetchUISettings = async () => {
      try {
        const uiSettingsResponse = await getProxyUISettings(accessToken);
        setUISettings(uiSettingsResponse);
      } catch (error) {
        console.error("Error fetching UI settings:", error);
      }
    };

    fetchUISettings();

    // Set base URL
    const base = new URL("/", window.location.href);
    setBaseUrl(base.toString());
  }, [accessToken]);

  const downloadTemplate = () => {
    const template = [
      ["user_email", "user_role", "teams", "max_budget", "budget_duration", "models"],
      ["user@example.com", "internal_user", "team-id-1,team-id-2", "100", "30d", "gpt-3.5-turbo,gpt-4"],
    ];

    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk_users_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleFileUpload = (file: File) => {
    // Reset all error states
    setParseError(null);
    setCsvStructureError(null);
    setFileError(null);

    // Set the selected file - always show the file even if it's invalid
    setSelectedFile(file);

    // Check file type
    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      setFileError(t("Invalid file type: {{filename}}. Please upload a CSV file (.csv extension).").replace("{{filename}}", file.name));
      NotificationsManager.fromBackend(t("Invalid file type. Please upload a CSV file."));
      return false;
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFileError(
        t("File is too large ({{size}} MB). Please upload a CSV file smaller than 5MB.").replace("{{size}}", (file.size / (1024 * 1024)).toFixed(1)),
      );
      return false;
    }

    Papa.parse(file, {
      complete: (results) => {
        // Check if file is empty
        if (!results.data || results.data.length === 0) {
          setCsvStructureError(t("The CSV file appears to be empty. Please upload a file with data."));
          setParsedData([]);
          return;
        }

        // Check if there's only header row
        if (results.data.length === 1) {
          setCsvStructureError(
            t("The CSV file only contains headers but no user data. Please add user data to your CSV."),
          );
          setParsedData([]);
          return;
        }

        const headers = results.data[0] as string[];

        // Check if headers exist
        if (headers.length === 0 || (headers.length === 1 && headers[0] === "")) {
          setCsvStructureError(
            t("The CSV file doesn't contain any column headers. Please make sure your CSV has headers."),
          );
          setParsedData([]);
          return;
        }

        const requiredColumns = ["user_email", "user_role"];

        // Check if all required columns are present
        const missingColumns = requiredColumns.filter((col) => !headers.includes(col));
        if (missingColumns.length > 0) {
          setCsvStructureError(
            t("Your CSV is missing these required columns: {{columns}}. Please add these columns to your CSV file.").replace("{{columns}}", missingColumns.join(", ")),
          );
          setParsedData([]);
          return;
        }

        try {
          const userData = results.data
            .slice(1)
            .map((row: any, index: number) => {
              // Skip empty rows
              if (row.length === 0 || (row.length === 1 && row[0] === "")) {
                return null;
              }

              // Check if row has enough columns
              if (row.length < headers.length) {
                return {
                  rowNumber: index + 2,
                  isValid: false,
                  error: t("Row {{row}} has fewer columns than the header row. Please ensure all data is properly formatted.").replace("{{row}}", String(index + 2)),
                  user_email: "",
                  user_role: "",
                } as UserData;
              }

              const user: UserData = {
                user_email: row[headers.indexOf("user_email")]?.trim() || "",
                user_role: row[headers.indexOf("user_role")]?.trim() || "",
                teams: row[headers.indexOf("teams")]?.trim(),
                max_budget: row[headers.indexOf("max_budget")]?.trim(),
                budget_duration: row[headers.indexOf("budget_duration")]?.trim(),
                models: row[headers.indexOf("models")]?.trim(),
                rowNumber: index + 2,
                isValid: true,
                error: "",
              };

              // Validate the row
              const errors: string[] = [];

              // Email validation
              if (!user.user_email) {
                errors.push(t("Email is required"));
              } else if (!user.user_email.includes("@") || !user.user_email.includes(".")) {
                errors.push(t("Invalid email format (must contain @ and domain)"));
              }

              // Role validation
              if (!user.user_role) {
                errors.push(t("Role is required"));
              } else {
                // Validate user role
                const validRoles = ["proxy_admin", "proxy_admin_viewer", "internal_user", "internal_user_viewer"];
                if (!validRoles.includes(user.user_role)) {
                  errors.push(t("Invalid role \"{{role}}\". Must be one of: {{roles}}").replace("{{role}}", user.user_role).replace("{{roles}}", validRoles.join(", ")));
                }
              }

              // Budget validation
              if (user.max_budget && user.max_budget.toString().trim() !== "") {
                if (isNaN(parseFloat(user.max_budget.toString()))) {
                  errors.push(t("Max budget \"{{budget}}\" must be a number").replace("{{budget}}", user.max_budget.toString()));
                } else if (parseFloat(user.max_budget.toString()) <= 0) {
                  errors.push(t("Max budget must be greater than 0"));
                }
              }

              // Budget duration validation
              if (user.budget_duration && !user.budget_duration.match(/^\d+[dhmwy]$|^\d+mo$/)) {
                errors.push(
                  t("Invalid budget duration format \"{{duration}}\". Use format like \"30d\", \"1mo\", \"2w\", \"6h\"").replace("{{duration}}", user.budget_duration),
                );
              }

              // Teams validation
              if (user.teams && typeof user.teams === "string") {
                // Check if teams exist (if teams data is available)
                if (teams && teams.length > 0) {
                  const teamIds = teams.map((t) => t.team_id);
                  const userTeams = user.teams.split(",").map((t) => t.trim());
                  const invalidTeams = userTeams.filter((t) => !teamIds.includes(t));
                  if (invalidTeams.length > 0) {
                    errors.push(t("Unknown team(s): {{teams}}").replace("{{teams}}", invalidTeams.join(", ")));
                  }
                }
              }

              if (errors.length > 0) {
                user.isValid = false;
                user.error = errors.join(", ");
              }

              return user;
            })
            .filter(Boolean) as UserData[]; // Filter out null values (empty rows)

          const validData = userData.filter((user) => user.isValid);
          setParsedData(userData);

          if (userData.length === 0) {
            setCsvStructureError(t("No valid data rows found in the CSV file. Please check your file format."));
          } else if (validData.length === 0) {
            setParseError(t("No valid users found in the CSV. Please check the errors below and fix your CSV file."));
          } else if (validData.length < userData.length) {
            setParseError(
              t("Found {{count}} row(s) with errors out of {{total}} total rows. Please correct them before proceeding.").replace("{{count}}", String(userData.length - validData.length)).replace("{{total}}", String(userData.length)),
            );
          } else {
            NotificationsManager.success(t("Successfully parsed {{count}} users").replace("{{count}}", String(validData.length)));
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          setParseError(t("Error parsing CSV: {{error}}").replace("{{error}}", errorMessage));
          setParsedData([]);
        }
      },
      error: (error) => {
        setParseError(t("Failed to parse CSV file: {{error}}").replace("{{error}}", error.message));
        setParsedData([]);
      },
      header: false,
    });
    return false;
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setParsedData([]);
    setParseError(null);
    setCsvStructureError(null);
    setFileError(null);
  };

  const handleBulkCreate = async () => {
    setIsProcessing(true);
    const updatedData = parsedData.map((user) => ({ ...user, status: "pending" }));
    setParsedData(updatedData);

    let anySuccessful = false;

    for (let index = 0; index < updatedData.length; index++) {
      const user = updatedData[index];
      try {
        // Create a clean user object with only non-empty values
        const cleanUser: Partial<UserData> = {
          user_email: user.user_email,
          user_role: user.user_role,
        };

        // Only add optional fields if they have values
        if (user.teams && typeof user.teams === "string" && user.teams.trim() !== "") {
          cleanUser.teams = user.teams
            .split(",")
            .map((team) => team.trim())
            .filter(Boolean);
          // Only include teams if there's at least one valid team
          if (cleanUser.teams.length === 0) {
            delete cleanUser.teams;
          }
        }

        // Only add models if provided and non-empty
        if (user.models && typeof user.models === "string" && user.models.trim() !== "") {
          cleanUser.models = user.models
            .split(",")
            .map((model) => model.trim())
            .filter(Boolean);
          // Only include models if there's at least one valid model
          if (cleanUser.models.length === 0) {
            delete cleanUser.models;
          }
        }

        // Only add max_budget if it's a valid number
        if (user.max_budget && user.max_budget.toString().trim() !== "") {
          const budgetValue = parseFloat(user.max_budget.toString());
          if (!isNaN(budgetValue) && budgetValue > 0) {
            cleanUser.max_budget = budgetValue;
          }
        }

        // Only add budget_duration if provided and non-empty
        if (user.budget_duration && user.budget_duration.trim() !== "") {
          cleanUser.budget_duration = user.budget_duration.trim();
        }

        // Only add metadata if provided and non-empty
        if (user.metadata && typeof user.metadata === "string" && user.metadata.trim() !== "") {
          cleanUser.metadata = user.metadata.trim();
        }

        console.log("Sending user data:", cleanUser);
        const response = await userCreateCall(accessToken, null, cleanUser);
        console.log("Full response:", response);

        // Check if response has key or user_id, indicating success
        if (response && (response.key || response.user_id)) {
          anySuccessful = true;
          console.log("Success case triggered");
          const user_id = response.data?.user_id || response.user_id;

          // Create invitation link for the user
          try {
            if (!uiSettings?.SSO_ENABLED) {
              // Regular invitation flow
              const invitationData = await invitationCreateCall(accessToken, user_id);
              const invitationUrl = new URL(`/ui?invitation_id=${invitationData.id}`, baseUrl).toString();

              setParsedData((current) =>
                current.map((u, i) =>
                  i === index
                    ? {
                      ...u,
                      status: "success",
                      key: response.key || response.user_id,
                      invitation_link: invitationUrl,
                    }
                    : u,
                ),
              );
            } else {
              // SSO flow - just use the base URL
              const invitationUrl = new URL("/ui", baseUrl).toString();

              setParsedData((current) =>
                current.map((u, i) =>
                  i === index
                    ? {
                      ...u,
                      status: "success",
                      key: response.key || response.user_id,
                      invitation_link: invitationUrl,
                    }
                    : u,
                ),
              );
            }
          } catch (inviteError) {
            console.error("Error creating invitation:", inviteError);
            setParsedData((current) =>
              current.map((u, i) =>
                i === index
                  ? {
                    ...u,
                    status: "success",
                    key: response.key || response.user_id,
                    error: t("User created but failed to generate invitation link"),
                  }
                  : u,
              ),
            );
          }
        } else {
          console.log("Error case triggered");
          const errorMessage = response?.error || t("Failed to create user");
          console.log("Error message:", errorMessage);
          setParsedData((current) =>
            current.map((u, i) => (i === index ? { ...u, status: "failed", error: errorMessage } : u)),
          );
        }
      } catch (error) {
        console.error("Caught error:", error);
        const errorMessage = (error as any)?.response?.data?.error || (error as Error)?.message || String(error);
        setParsedData((current) =>
          current.map((u, i) => (i === index ? { ...u, status: "failed", error: errorMessage } : u)),
        );
      }
    }

    setIsProcessing(false);

    // Call the callback if any users were successfully created
    if (anySuccessful && onUsersCreated) {
      onUsersCreated();
    }
  };

  const downloadResults = () => {
    const results = parsedData.map((user) => ({
      user_email: user.user_email,
      user_role: user.user_role,
      status: user.status,
      key: user.key || "",
      invitation_link: user.invitation_link || "",
      error: user.error || "",
    }));

    const csv = Papa.unparse(results);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk_users_results.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const columns = [
    {
      title: t("Row"),
      dataIndex: "rowNumber",
      key: "rowNumber",
      width: 80,
    },
    {
      title: t("Email"),
      dataIndex: "user_email",
      key: "user_email",
    },
    {
      title: t("Role"),
      dataIndex: "user_role",
      key: "user_role",
    },
    {
      title: t("Teams"),
      dataIndex: "teams",
      key: "teams",
    },
    {
      title: t("Budget"),
      dataIndex: "max_budget",
      key: "max_budget",
    },
    {
      title: t("Status"),
      key: "status",
      render: (_: any, record: UserData) => {
        if (!record.isValid) {
          return (
            <div>
              <div className="flex items-center">
                <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-red-500"><T>Invalid</T></span>
              </div>
              {record.error && <span className="text-sm text-red-500 ml-7">{record.error}</span>}
            </div>
          );
        }
        if (!record.status || record.status === "pending") {
          return <span className="text-gray-500"><T>Pending</T></span>;
        }
        if (record.status === "success") {
          return (
            <div>
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-green-500"><T>Success</T></span>
              </div>
              {record.invitation_link && (
                <div className="mt-1">
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 truncate max-w-[150px]">{record.invitation_link}</span>
                    <CopyToClipboard
                      text={record.invitation_link}
                      onCopy={() => NotificationsManager.success(t("Invitation link copied!"))}
                    >
                      <button className="ml-1 text-blue-500 text-xs hover:text-blue-700"><T>Copy</T></button>
                    </CopyToClipboard>
                  </div>
                </div>
              )}
            </div>
          );
        }
        return (
          <div>
            <div className="flex items-center">
              <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-500"><T>Failed</T></span>
            </div>
            {record.error && <span className="text-sm text-red-500 ml-7">{JSON.stringify(record.error)}</span>}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <TremorButton className="mb-0" onClick={() => setIsModalVisible(true)}>
        + <T>Bulk Invite Users</T>
      </TremorButton>

      <Modal
        title={t("Bulk Invite Users")}
        visible={isModalVisible}
        width={800}
        onCancel={() => setIsModalVisible(false)}
        bodyStyle={{ maxHeight: "70vh", overflow: "auto" }}
        footer={null}
      >
        <div className="flex flex-col">
          {/* Step indicator */}
          {parsedData.length === 0 ? (
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center mr-3">
                  1
                </div>
                <h3 className="text-lg font-medium"><T>Download and fill the template</T></h3>
              </div>

              <div className="ml-11 mb-6">
                <p className="mb-4"><T>Add multiple users at once by following these steps:</T></p>
                <ol className="list-decimal list-inside space-y-2 ml-2 mb-4">
                  <li><T>Download our CSV template</T></li>
                  <li><T>Add your users&apos; information to the spreadsheet</T></li>
                  <li><T>Save the file and upload it here</T></li>
                  <li><T>After creation, download the results file containing the Virtual Keys for each user</T></li>
                </ol>

                <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-4">
                  <h4 className="font-medium mb-2"><T>Template Column Names</T></h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-start">
                      <div className="w-3 h-3 rounded-full bg-red-500 mt-1.5 mr-2 flex-shrink-0"></div>
                      <div>
                        <p className="font-medium">user_email</p>
                        <p className="text-sm text-gray-600"><T>User&apos;s email address (required)</T></p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-3 h-3 rounded-full bg-red-500 mt-1.5 mr-2 flex-shrink-0"></div>
                      <div>
                        <p className="font-medium">user_role</p>
                        <p className="text-sm text-gray-600">
                          <T>User&apos;s role (one of: &quot;proxy_admin&quot;, &quot;proxy_admin_viewer&quot;, &quot;internal_user&quot;, &quot;internal_user_viewer&quot;)</T>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-3 h-3 rounded-full bg-gray-300 mt-1.5 mr-2 flex-shrink-0"></div>
                      <div>
                        <p className="font-medium">teams</p>
                        <p className="text-sm text-gray-600">
                          <T>Comma-separated team IDs (e.g., &quot;team-1,team-2&quot;)</T>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-3 h-3 rounded-full bg-gray-300 mt-1.5 mr-2 flex-shrink-0"></div>
                      <div>
                        <p className="font-medium">max_budget</p>
                        <p className="text-sm text-gray-600"><T>Maximum budget as a number (e.g., &quot;100&quot;)</T></p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-3 h-3 rounded-full bg-gray-300 mt-1.5 mr-2 flex-shrink-0"></div>
                      <div>
                        <p className="font-medium">budget_duration</p>
                        <p className="text-sm text-gray-600">
                          <T>Budget reset period (e.g., &quot;30d&quot;, &quot;1mo&quot;)</T>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-3 h-3 rounded-full bg-gray-300 mt-1.5 mr-2 flex-shrink-0"></div>
                      <div>
                        <p className="font-medium">models</p>
                        <p className="text-sm text-gray-600">
                          <T>Comma-separated allowed models (e.g., &quot;gpt-3.5-turbo,gpt-4&quot;)</T>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <TremorButton onClick={downloadTemplate} size="lg" className="w-full md:w-auto">
                  <DownloadOutlined className="mr-2" /> <span><T>Download CSV Template</T></span>
                </TremorButton>
              </div>

              <div className="flex items-center mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center mr-3">
                  2
                </div>
                <h3 className="text-lg font-medium"><T>Upload your completed CSV</T></h3>
              </div>

              <div className="ml-11">
                {selectedFile ? (
                  <div
                    className={`mb-4 p-4 rounded-md border ${fileError ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {fileError ? (
                          <FileExclamationOutlined className="text-red-500 text-xl mr-3" />
                        ) : (
                          <FileTextOutlined className="text-blue-500 text-xl mr-3" />
                        )}
                        <div>
                          <Typography.Text strong className={fileError ? "text-red-800" : "text-blue-800"}>
                            {selectedFile.name}
                          </Typography.Text>
                          <Typography.Text className={`block text-xs ${fileError ? "text-red-600" : "text-blue-600"}`}>
                            {(selectedFile.size / 1024).toFixed(1)} <T>KB</T> • {new Date().toLocaleDateString()}
                          </Typography.Text>
                        </div>
                      </div>
                      <TremorButton
                        size="xs"
                        variant="secondary"
                        onClick={removeSelectedFile}
                        className="flex items-center"
                      >
                        <DeleteOutlined className="mr-1" /> <span><T>Remove</T></span>
                      </TremorButton>
                    </div>

                    {fileError ? (
                      <div className="mt-3 text-red-600 text-sm flex items-start">
                        <WarningOutlined className="mr-2 mt-0.5" />
                        <span>{fileError}</span>
                      </div>
                    ) : (
                      !csvStructureError && (
                        <div className="mt-3 flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div className="bg-blue-500 h-1.5 rounded-full w-full animate-pulse"></div>
                          </div>
                          <span className="ml-2 text-xs text-blue-600"><T>Processing...</T></span>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <Upload beforeUpload={handleFileUpload} accept=".csv" maxCount={1} showUploadList={false}>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
                      <UploadOutlined className="text-3xl text-gray-400 mb-2" />
                      <p className="mb-1"><T>Drag and drop your CSV file here</T></p>
                      <p className="text-sm text-gray-500 mb-3"><T>or</T></p>
                      <TremorButton size="sm"><T>Browse files</T></TremorButton>
                      <p className="text-xs text-gray-500 mt-4"><T>Only CSV files (.csv) are supported</T></p>
                    </div>
                  </Upload>
                )}

                {csvStructureError && (
                  <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-start">
                      <ExclamationIcon className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
                      <div>
                        <Typography.Text strong className="text-yellow-800">
                          <T>CSV Structure Error</T>
                        </Typography.Text>
                        <Typography.Paragraph className="text-yellow-700 mt-1 mb-0">
                          {csvStructureError}
                        </Typography.Paragraph>
                        <Typography.Paragraph className="text-yellow-700 mt-2 mb-0">
                          <T>Please download our template and ensure your CSV follows the required format.</T>
                        </Typography.Paragraph>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center mr-3">
                  3
                </div>
                <h3 className="text-lg font-medium">
                  {parsedData.some((user) => user.status === "success" || user.status === "failed")
                    ? <T>User Creation Results</T>
                    : <T>Review and create users</T>}
                </h3>
              </div>

              {parseError && (
                <div className="ml-11 mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-start">
                    <WarningOutlined className="text-red-500 mr-2 mt-1" />
                    <div>
                      <Text className="text-red-600 font-medium">{parseError}</Text>
                      {parsedData.some((user) => !user.isValid) && (
                        <ul className="mt-2 list-disc list-inside text-red-600 text-sm">
                          <li><T>Check the table below for specific errors in each row</T></li>
                          <li>
                            <T>Common issues include invalid email formats, missing required fields, or incorrect role values</T>
                          </li>
                          <li><T>Fix these issues in your CSV file and upload again</T></li>
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="ml-11">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center">
                    {parsedData.some((user) => user.status === "success" || user.status === "failed") ? (
                      <div className="flex items-center">
                        <Text className="text-lg font-medium mr-3"><T>Creation Summary</T></Text>
                        <Text className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded mr-2">
                          {parsedData.filter((d) => d.status === "success").length} <T>Successful</T>
                        </Text>
                        {parsedData.some((d) => d.status === "failed") && (
                          <Text className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded">
                            {parsedData.filter((d) => d.status === "failed").length} <T>Failed</T>
                          </Text>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Text className="text-lg font-medium mr-3"><T>User Preview</T></Text>
                        <Text className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {parsedData.filter((d) => d.isValid).length} <T>of</T> {parsedData.length} <T>users valid</T>
                        </Text>
                      </div>
                    )}
                  </div>

                  {!parsedData.some((user) => user.status === "success" || user.status === "failed") && (
                    <div className="flex space-x-3">
                      <TremorButton
                        onClick={() => {
                          setParsedData([]);
                          setParseError(null);
                        }}
                        variant="secondary"
                      >
                        <T>Back</T>
                      </TremorButton>
                      <TremorButton
                        onClick={handleBulkCreate}
                        disabled={parsedData.filter((d) => d.isValid).length === 0 || isProcessing}
                      >
                        {isProcessing ? t("Creating...") : `${t("Create")} ${parsedData.filter((d) => d.isValid).length} ${t("Users")}`}
                      </TremorButton>
                    </div>
                  )}
                </div>

                {parsedData.some((user) => user.status === "success") && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-start">
                      <div className="mr-3 mt-1">
                        <CheckCircleIcon className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <Text className="font-medium text-blue-800"><T>User creation complete</T></Text>
                        <Text className="block text-sm text-blue-700 mt-1">
                          <span className="font-medium"><T>Next step:</T></span> <T>Download the credentials file containing Virtual Keys and invitation links.</T> <T>Users will need these Virtual Keys to make LLM requests through LiteLLM.</T>
                        </Text>
                      </div>
                    </div>
                  </div>
                )}

                <Table
                  dataSource={parsedData}
                  columns={columns}
                  size="small"
                  pagination={{ pageSize: 5 }}
                  scroll={{ y: 300 }}
                  rowClassName={(record) => (!record.isValid ? "bg-red-50" : "")}
                />

                {!parsedData.some((user) => user.status === "success" || user.status === "failed") && (
                  <div className="flex justify-end mt-4">
                    <TremorButton
                      onClick={() => {
                        setParsedData([]);
                        setParseError(null);
                      }}
                      variant="secondary"
                      className="mr-3"
                    >
                      <T>Back</T>
                    </TremorButton>
                    <TremorButton
                      onClick={handleBulkCreate}
                      disabled={parsedData.filter((d) => d.isValid).length === 0 || isProcessing}
                    >
                      {isProcessing ? t("Creating...") : `${t("Create")} ${parsedData.filter((d) => d.isValid).length} ${t("Users")}`}
                    </TremorButton>
                  </div>
                )}

                {parsedData.some((user) => user.status === "success" || user.status === "failed") && (
                  <div className="flex justify-end mt-4">
                    <TremorButton
                      onClick={() => {
                        setParsedData([]);
                        setParseError(null);
                      }}
                      variant="secondary"
                      className="mr-3"
                    >
                      <T>Start New Bulk Import</T>
                    </TremorButton>
                    <TremorButton onClick={downloadResults} variant="primary" className="flex items-center">
                      <DownloadOutlined className="mr-2" /> <span><T>Download User Credentials</T></span>
                    </TremorButton>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default BulkCreateUsersButton;

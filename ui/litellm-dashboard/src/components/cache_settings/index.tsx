import React, { useState, useEffect, useCallback } from "react";
import { Button, Accordion, AccordionHeader, AccordionBody } from "@tremor/react";
import { useTranslate } from "@/i18n";
import { getCacheSettingsCall, testCacheConnectionCall, updateCacheSettingsCall } from "../networking";
import NotificationsManager from "../molecules/notifications_manager";
import RedisTypeSelector from "./RedisTypeSelector";
import CacheFieldRenderer from "./CacheFieldRenderer";
import { gatherFormValues, groupFieldsByCategory } from "./cacheSettingsUtils";

interface CacheSettingsProps {
  accessToken: string | null;
  userRole: string | null;
  userID: string | null;
}

const CacheSettings: React.FC<CacheSettingsProps> = ({ accessToken, userRole, userID }) => {
  const t = useTranslate();
  const [cacheSettings, setCacheSettings] = useState<{ [key: string]: any }>({});
  const [fields, setFields] = useState<any[]>([]);
  const [redisTypeDescriptions, setRedisTypeDescriptions] = useState<{ [key: string]: string }>({});
  const [redisType, setRedisType] = useState<string>("node");
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const loadCacheSettings = useCallback(async () => {
    try {
      const data = await getCacheSettingsCall(accessToken!);
      console.log("cache settings from API", data);

      if (data.fields) {
        setFields(data.fields);
      }

      // Set current values
      if (data.current_values) {
        setCacheSettings(data.current_values);
        if (data.current_values.redis_type) {
          setRedisType(data.current_values.redis_type);
        }
      }

      // Store Redis type descriptions
      if (data.redis_type_descriptions) {
        setRedisTypeDescriptions(data.redis_type_descriptions);
      }
    } catch (error) {
      console.error("Failed to load cache settings:", error);
      NotificationsManager.fromBackend(t("Failed to load cache settings"));
    }
  }, [accessToken, t]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    loadCacheSettings();
  }, [accessToken, loadCacheSettings]);

  const handleTestConnection = async () => {
    if (!accessToken) {
      return;
    }

    setIsTesting(true);
    try {
      const testSettings = gatherFormValues(fields, redisType);
      const result = await testCacheConnectionCall(accessToken, testSettings);

      if (result.status === "success") {
        NotificationsManager.success(t("Cache connection test successful!"));
      } else {
        NotificationsManager.fromBackend(`${t("Connection test failed: ")}${result.message || result.error}`);
      }
    } catch (error: any) {
      console.error("Test connection error:", error);
      NotificationsManager.fromBackend(`${t("Connection test failed: ")}${error.message || "Unknown error"}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!accessToken) {
      return;
    }

    setIsSaving(true);
    try {
      const settingsToSave = gatherFormValues(fields, redisType);
      if (redisType === "semantic") {
        settingsToSave.type = "redis-semantic";
      }
      await updateCacheSettingsCall(accessToken, settingsToSave);
      NotificationsManager.success(t("Cache settings updated successfully"));
      // Reload settings to reflect saved values
      await loadCacheSettings();
    } catch (error) {
      console.error("Failed to save cache settings:", error);
      NotificationsManager.fromBackend(t("Failed to update cache settings"));
    } finally {
      setIsSaving(false);
    }
  };

  if (!accessToken) {
    return null;
  }

  const { basicFields, sslFields, cacheManagementFields, gcpFields, clusterFields, sentinelFields, semanticFields } =
    groupFieldsByCategory(fields, redisType);

  return (
    <div className="w-full space-y-8 py-2">
      <div className="space-y-6">
        <div className="max-w-3xl">
          <h3 className="text-sm font-medium text-gray-900">{t("Cache Settings")}</h3>
          <p className="text-xs text-gray-500 mt-1">{t("Configure Redis cache for LiteLLM")}</p>
        </div>

        {/* Redis Type Selector */}
        <RedisTypeSelector
          redisType={redisType}
          redisTypeDescriptions={redisTypeDescriptions}
          onTypeChange={setRedisType}
        />

        {/* Basic Fields */}
        <div className="space-y-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900">{t("Connection Settings")}</h4>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {basicFields.map((field: any) => {
              if (!field) return null;
              const currentValue = cacheSettings[field.field_name] ?? field.field_default ?? "";
              return <CacheFieldRenderer key={field.field_name} field={field} currentValue={currentValue} />;
            })}
          </div>
        </div>

        {/* Redis Type-Specific Fields */}
        {redisType === "cluster" && clusterFields.length > 0 && (
          <div className="space-y-6 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900">{t("Cluster Configuration")}</h4>
            <div className="grid grid-cols-1 gap-6">
              {clusterFields.map((field: any) => {
                const currentValue = cacheSettings[field.field_name] ?? field.field_default ?? "";
                return <CacheFieldRenderer key={field.field_name} field={field} currentValue={currentValue} />;
              })}
            </div>
          </div>
        )}

        {redisType === "sentinel" && sentinelFields.length > 0 && (
          <div className="space-y-6 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900">{t("Sentinel Configuration")}</h4>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {sentinelFields.map((field: any) => {
                const currentValue = cacheSettings[field.field_name] ?? field.field_default ?? "";
                return <CacheFieldRenderer key={field.field_name} field={field} currentValue={currentValue} />;
              })}
            </div>
          </div>
        )}

        {redisType === "semantic" && semanticFields.length > 0 && (
          <div className="space-y-6 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900">{t("Semantic Configuration")}</h4>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {semanticFields.map((field: any) => {
                const currentValue = cacheSettings[field.field_name] ?? field.field_default ?? "";
                return <CacheFieldRenderer key={field.field_name} field={field} currentValue={currentValue} />;
              })}
            </div>
          </div>
        )}

        {/* Advanced Settings Accordion */}
        <Accordion className="mt-4">
          <AccordionHeader>
            <span className="text-sm font-medium text-gray-900">{t("Advanced Settings")}</span>
          </AccordionHeader>
          <AccordionBody>
            <div className="space-y-6">
              {/* SSL Settings */}
              {sslFields.length > 0 && (
                <div className="space-y-4">
                  <h5 className="text-sm font-medium text-gray-700">{t("SSL Settings")}</h5>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {sslFields.map((field: any) => {
                      if (!field) return null;
                      const currentValue = cacheSettings[field.field_name] ?? field.field_default ?? "";
                      return <CacheFieldRenderer key={field.field_name} field={field} currentValue={currentValue} />;
                    })}
                  </div>
                </div>
              )}

              {/* Cache Management */}
              {cacheManagementFields.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  <h5 className="text-sm font-medium text-gray-700">{t("Cache Management")}</h5>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {cacheManagementFields.map((field: any) => {
                      if (!field) return null;
                      const currentValue = cacheSettings[field.field_name] ?? field.field_default ?? "";
                      return <CacheFieldRenderer key={field.field_name} field={field} currentValue={currentValue} />;
                    })}
                  </div>
                </div>
              )}

              {/* GCP Authentication */}
              {gcpFields.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  <h5 className="text-sm font-medium text-gray-700">{t("GCP Authentication")}</h5>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {gcpFields.map((field: any) => {
                      if (!field) return null;
                      const currentValue = cacheSettings[field.field_name] ?? field.field_default ?? "";
                      return <CacheFieldRenderer key={field.field_name} field={field} currentValue={currentValue} />;
                    })}
                  </div>
                </div>
              )}
            </div>
          </AccordionBody>
        </Accordion>
      </div>

      {/* Actions */}
      <div className="border-t border-gray-200 pt-6 flex justify-end gap-3">
        <Button variant="secondary" size="sm" onClick={handleTestConnection} disabled={isTesting} className="text-sm">
          {isTesting ? t("Testing...") : t("Test Connection")}
        </Button>
        <Button size="sm" onClick={handleSaveChanges} disabled={isSaving} className="text-sm font-medium">
          {isSaving ? t("Saving...") : t("Save Changes")}
        </Button>
      </div>
    </div>
  );
};

export default CacheSettings;

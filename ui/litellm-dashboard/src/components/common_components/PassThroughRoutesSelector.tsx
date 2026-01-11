import React, { useEffect, useState } from "react";
import { Select } from "antd";
import { getPassThroughEndpointsCall } from "../networking";
import { useTranslate } from "@/i18n";

interface PassThroughRoutesSelectorProps {
  onChange: (selectedRoutes: string[]) => void;
  value?: string[];
  className?: string;
  accessToken: string;
  placeholder?: string;
  disabled?: boolean;
  teamId?: string | null;
}

const PassThroughRoutesSelector: React.FC<PassThroughRoutesSelectorProps> = ({
  onChange,
  value,
  className,
  accessToken,
  placeholder,
  disabled = false,
  teamId,
}) => {
  const t = useTranslate();
  const displayPlaceholder = placeholder || t("Select pass through routes");
  const [passThroughRoutes, setPassThroughRoutes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPassThroughRoutes = async () => {
      if (!accessToken) return;

      setLoading(true);
      try {
        const response = await getPassThroughEndpointsCall(accessToken, teamId);
        if (response.endpoints) {
          const routes = response.endpoints.map((route: { path: string }) => route.path);
          setPassThroughRoutes(routes);
        }
      } catch (error) {
        console.error("Error fetching pass through routes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPassThroughRoutes();
  }, [accessToken, teamId]);

  return (
    <Select
      mode="tags"
      placeholder={displayPlaceholder}
      onChange={onChange}
      value={value}
      loading={loading}
      className={className}
      options={passThroughRoutes.map((route) => ({
        label: route,
        value: route,
      }))}
      optionFilterProp="label"
      showSearch
      style={{ width: "100%" }}
      disabled={disabled}
    />
  );
};

export default PassThroughRoutesSelector;


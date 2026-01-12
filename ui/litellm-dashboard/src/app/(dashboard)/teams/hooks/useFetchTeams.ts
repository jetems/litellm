import { useCallback, useEffect, useState } from "react";
import { fetchTeams } from "@/components/common_components/fetch_teams";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { Organization, Team } from "@/components/networking";
import { useI18n } from "@/i18n";
import { formatDate } from "@/utils/dateUtils";

interface useFetchTeamsProps {
  currentOrg: Organization | null;
  setTeams: (teams: Team[] | null) => void;
}

const useFetchTeams = ({ currentOrg, setTeams }: useFetchTeamsProps) => {
  const [lastRefreshed, setLastRefreshed] = useState("");
  const { accessToken, userId, userRole } = useAuthorized();
  const { locale } = useI18n();

  const onRefreshClick = useCallback(() => {
    if (accessToken) {
      fetchTeams(accessToken, userId, userRole, currentOrg, setTeams).then(() => {
        const currentDate = new Date();
        setLastRefreshed(formatDate(currentDate, locale, true));
      });
    } else {
      const currentDate = new Date();
      setLastRefreshed(formatDate(currentDate, locale, true));
    }
  }, [accessToken, currentOrg, locale, setTeams, userId, userRole]);

  useEffect(() => {
    if (accessToken) {
      fetchTeams(accessToken, userId, userRole, currentOrg, setTeams).then(() => {
        const currentDate = new Date();
        setLastRefreshed(formatDate(currentDate, locale, true));
      });
    }
  }, [accessToken, currentOrg, locale, setTeams, userId, userRole]);

  return { lastRefreshed, setLastRefreshed, onRefreshClick };
};

export default useFetchTeams;

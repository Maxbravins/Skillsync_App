import api from "./api";

export const getDeveloperDashboard =
  async () => {
    const response =
      await api.get(
        "/dashboard/developer"
      );

    return response.data;
  };

export const getClientDashboard =
  async () => {
    const response =
      await api.get(
        "/dashboard/client"
      );

    return response.data;
  };
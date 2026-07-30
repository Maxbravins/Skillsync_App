import api from "./api";

export const downloadApplicationsPDF = async () => {
  const response = await api.get("/pdf/applications", {
    responseType: "blob",
  });

  return response.data;
};
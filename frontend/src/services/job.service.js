import api from "./api";

export const getAllJobs = async (page = 1, limit = 10) => {
  const response = await api.get(`/jobs?page=${page}&limit=${limit}`);
  return response.data;
};

export const getMyJobs = async (page = 1, limit = 10) => {
  const response = await api.get(`/jobs/my?page=${page}&limit=${limit}`);
  return response.data;
};

export const getJobById = async (id) => {
  const response = await api.get(`/jobs/${id}`);
  return response.data;
};

export const createJob = async (data) => {
  const response = await api.post("/jobs", data);
  return response.data;
};

export const updateJob = async (id, data) => {
  const response = await api.put(`/jobs/${id}`, data);
  return response.data;
};

export const deleteJob = async (id) => {
  const response = await api.delete(`/jobs/${id}`);
  return response.data;
};
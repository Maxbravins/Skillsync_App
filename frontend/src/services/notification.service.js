import api from "./api";

/**
 * Get notifications for the authenticated user.
 */
export const getNotifications = async () => {
  const response = await api.get("/notifications");

  return response.data;
};

/**
 * Mark a notification as read.
 */
export const markAsRead = async (id) => {
  if (!id) {
    throw new Error("Notification ID is required.");
  }

  const response = await api.put(
    `/notifications/${id}/read`
  );

  return response.data;
};

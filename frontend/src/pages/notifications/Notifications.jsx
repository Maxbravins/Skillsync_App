import { useEffect, useState } from "react";
import { getNotifications, markAsRead } from "../../services/notification.service";
import { useNavigate } from "react-router-dom";

const Notifications = () => {
  const [  notifications,  setNotifications,] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications =
    async () => {
      try {
        const data =
          await getNotifications();

        setNotifications(
          data.notifications
        );
      } catch (error) {
        console.log(error);
      }
    };
const handleRead =
  async (id) => {
    try {
      await markAsRead(id);

      setNotifications(
        notifications.map(
          (notification) =>
            notification._id === id
              ? {
                  ...notification,
                  isRead: true,
                }
              : notification
        )
      );

      setTimeout(() => {
        navigate("/client-dashboard");
      }, 1000);

    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">

      <h1 className="text-2xl font-bold mb-6">
        Notifications
      </h1>

      {notifications.length ===
      0 ? (
        <p>
          No notifications
          available.
        </p>
      ) : (
        notifications.map(
          (notification) => (
            <div
              key={
                notification._id
              }
              className={`border p-4 rounded-lg mb-4 ${
                notification.isRead
                  ? "bg-gray-100"
                  : "bg-blue-50"
              }`}
            >
              <p>
                {
                  notification.message
                }
              </p>

              <small className="text-gray-500">
                {new Date(
                  notification.createdAt
                ).toLocaleString()}
              </small>

              {!notification.isRead && (
                <button
                  onClick={() =>
                    handleRead(
                      notification._id
                    )
                  }
                  className="ml-4 bg-blue-600 text-white px-3 py-1 rounded"
                >
                  Mark as Read
                </button>
              )}
            </div>
          )
        )
      )}
    </div>
  );
};

export default Notifications;
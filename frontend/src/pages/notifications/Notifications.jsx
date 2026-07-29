import { useEffect, useState } from "react";
import { getNotifications, markAsRead } from "../../services/notification.service";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { Bell, BellOff } from "lucide-react";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data.notifications);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRead = async (id) => {
    try {
      await markAsRead(id);

      setNotifications(
        notifications.map((notification) =>
          notification._id === id
            ? { ...notification, isRead: true }
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Notifications
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Stay up to date with job updates and responses.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
            <BellOff size={48} className="mx-auto text-slate-600 mb-4" />
            <h2 className="text-xl font-bold text-white">
              No Notifications
            </h2>
            <p className="text-slate-400 mt-2">
              You're all caught up. Check back later.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`border rounded-xl p-5 flex items-start gap-4 transition ${
                  notification.isRead
                    ? "bg-slate-900 border-slate-800"
                    : "bg-cyan-950/20 border-cyan-800/40"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    notification.isRead ? "bg-slate-800" : "bg-cyan-500/20"
                  }`}
                >
                  <Bell
                    size={18}
                    className={notification.isRead ? "text-slate-500" : "text-cyan-400"}
                  />
                </div>

                <div className="flex-1">
                  <p className="text-slate-200">{notification.message}</p>
                  <small className="text-slate-500">
                    {new Date(notification.createdAt).toLocaleString()}
                  </small>
                </div>

                {!notification.isRead && (
                  <button
                    onClick={() => handleRead(notification._id)}
                    className="shrink-0 bg-cyan-500 hover:bg-cyan-600 text-white text-sm px-4 py-2 rounded-lg font-medium transition"
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Notifications;

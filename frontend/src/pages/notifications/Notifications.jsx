import { Bell, BellOff } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";
import { useLanguage } from "../../context/LanguageContext";
import {
  getNotifications,
  markAsRead,
} from "../../services/notification.service";

const Notifications = () => {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await getNotifications();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleRead = async (id) => {
    try {
      await markAsRead(id);

      setNotifications((prev) =>
        prev.map((notification) =>
          notification._id === id
            ? { ...notification, isRead: true }
            : notification,
        ),
      );
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans transition-colors">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto px-6 py-10 w-full">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight">
            {t("notifications")}
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            {t("stayUpdated")}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-[var(--text-secondary)]">
            {t("loading")}
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-12 text-center">
            <BellOff
              size={48}
              className="mx-auto text-[var(--text-secondary)] mb-4"
            />
            <h2 className="text-xl font-bold">{t("noData")}</h2>
            <p className="text-[var(--text-secondary)] mt-2">
              {t("allCaughtUp")}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`border rounded-xl p-5 flex items-start gap-4 transition ${
                  notification.isRead
                    ? "bg-[var(--bg-secondary)] border-[var(--border-color)]"
                    : "bg-cyan-500/10 border-cyan-500/30"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    notification.isRead
                      ? "bg-[var(--bg-primary)]"
                      : "bg-cyan-500/20"
                  }`}
                >
                  <Bell
                    size={18}
                    className={
                      notification.isRead
                        ? "text-[var(--text-secondary)]"
                        : "text-cyan-400"
                    }
                  />
                </div>

                <div className="flex-1">
                  <p className="text-[var(--text-primary)]">
                    {notification.message}
                  </p>
                  <small className="text-[var(--text-secondary)]">
                    {new Date(notification.createdAt).toLocaleString()}
                  </small>
                </div>

                {!notification.isRead && (
                  <button
                    onClick={() => handleRead(notification._id)}
                    className="shrink-0 bg-cyan-500 hover:bg-cyan-600 text-white text-sm px-4 py-2 rounded-lg font-medium transition"
                  >
                    {t("markAsRead")}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Notifications;

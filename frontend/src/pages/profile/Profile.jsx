import useAuth from "../../hooks/useAuth";
import DeveloperProfile from "./DeveloperProfile";
import ClientProfile from "./ClientProfile";
import AdminProfile from "./AdminProfile";

const Profile = () => {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case "developer":
      return <DeveloperProfile />;

    case "client":
      return <ClientProfile />;

    case "admin":
      return <AdminProfile />;

    default:
      return <DeveloperProfile />;
  }
};

export default Profile;
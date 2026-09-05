import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside an AuthProvider"
    );
  }

  const { user, ...auth } = context;

  return {
    ...auth,
    user,
    isDeveloper: user?.role === "developer",
    isClient: user?.role === "client",
    isAdmin: user?.role === "admin",
  };
};

export default useAuth;

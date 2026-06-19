import useAuth from "../../hooks/useAuth";

const Profile = () => {
  const { user } = useAuth();

  return (
    <div>
      <h1>My Profile</h1>

      <p>
        Username:
        {user?.username}
      </p>

      <p>
        Email:
        {user?.email}
      </p>

      <p>
        Role:
        {user?.role}
      </p>
    </div>
  );
};

export default Profile;

import ProfilePage from "../components/ProfilePage";

const ProfileRoute = ({ user, accessToken, onBack, onLogout }) => {
  if (!user || !accessToken) {
    return null;
  }

  return (
    <ProfilePage
      user={user}
      accessToken={accessToken}
      onBack={onBack}
      onLogout={onLogout}
    />
  );
};

export default ProfileRoute;

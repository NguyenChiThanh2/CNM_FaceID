import { useAuth } from '../context/AuthContext';

const RoleProtected = ({ allowedRoles, children }) => {
  const { auth } = useAuth();

  if (!auth || !allowedRoles.includes(auth.role)) {
    return <p>Bạn không có quyền truy cập.</p>;
  }

  return children;
};

export default RoleProtected;

export const getCurrentUser = () => {
  const saved = localStorage.getItem("user");
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
};

export const getNhanVienInfo = () => {
  const user = getCurrentUser();
  return user?.nhan_vien || null;
};

export const getToken = () => {
  const user = getCurrentUser();
  return user?.token || null;
};

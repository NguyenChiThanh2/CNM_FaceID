// src/hooks/useDialog.js
import { useState, useCallback } from "react";

export default function useDialog() {
  const [dlg, setDlg] = useState({
    show: false,
    variant: "alert",
    title: "",
    message: "",
    okText: undefined,
    cancelText: "Hủy",
    onOk: null,
  });

  const hide = useCallback(() => setDlg((d) => ({ ...d, show: false })), []);

  const alert = useCallback((message, title = "Thông báo") => {
    setDlg({ show: true, variant: "alert", title, message, onOk: null });
  }, []);

  const confirm = useCallback(
    (message, onOk, { title = "Xác nhận", okText = "Xóa", cancelText = "Hủy" } = {}) => {
      setDlg({ show: true, variant: "confirm", title, message, okText, cancelText, onOk });
    },
    []
  );

  return { dlg, hide, alert, confirm };
}

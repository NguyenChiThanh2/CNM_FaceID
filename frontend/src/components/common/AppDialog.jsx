// src/components/common/AppDialog.jsx
import React from "react";
import { Modal, Button } from "react-bootstrap";

const VARIANT_MAP = {
  alert: { okVariant: "primary", okText: "OK" },
  confirm: { okVariant: "danger", okText: "Xác nhận" },
};

const AppDialog = ({
  show,
  onHide,
  title = "Thông báo",
  message,
  variant = "alert", // 'alert' | 'confirm'
  okText,
  cancelText = "Hủy",
  onOk,
  centered = true,
}) => {
  const map = VARIANT_MAP[variant] || VARIANT_MAP.alert;

  return (
    <Modal show={show} onHide={onHide} centered={centered} backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title className="fw-semibold">{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {typeof message === "string" ? <p className="mb-0">{message}</p> : message}
      </Modal.Body>
      <Modal.Footer>
        {variant === "confirm" && (
          <Button variant="outline-secondary" onClick={onHide}>
            {cancelText}
          </Button>
        )}
        <Button
          variant={map.okVariant}
          onClick={() => {
            onOk?.();
            onHide?.();
          }}
        >
          {okText || map.okText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AppDialog;

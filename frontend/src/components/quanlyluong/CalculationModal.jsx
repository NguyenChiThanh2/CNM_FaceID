// components/CalculationModal.js
import React from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

const CalculationModal = ({
  show,
  onHide,
  isTinhTatCa,
  formData,
  setFormData,
  selectedPhongBan,
  setSelectedPhongBan,
  phongBanList,
  nhanVienList,
  onSubmit
}) => (
  <Modal
    show={show}
    onHide={onHide}
    backdrop="static"
    centered
    className="rounded-4"
  >
    <Modal.Header closeButton className="modal-gradient-header">
      <Modal.Title>
        {isTinhTatCa
          ? "Tính lương cho tất cả nhân viên"
          : "Tính lương cho 1 nhân viên"}
      </Modal.Title>
    </Modal.Header>
    <Modal.Body className="p-4">
      <Form>
        <Form.Group className="mb-3">
          <Form.Label>Tháng</Form.Label>
          <Form.Control
            type="number"
            value={formData.thang}
            onChange={(e) =>
              setFormData({ ...formData, thang: e.target.value })
            }
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Năm</Form.Label>
          <Form.Control
            type="number"
            value={formData.nam}
            onChange={(e) =>
              setFormData({ ...formData, nam: e.target.value })
            }
          />
        </Form.Group>

        {isTinhTatCa && (
          <Form.Group className="mb-3">
            <Form.Label>Chọn phòng ban (tuỳ chọn)</Form.Label>
            <Form.Select
              value={selectedPhongBan}
              onChange={(e) => setSelectedPhongBan(e.target.value)}
            >
              <option value="">Tất cả phòng ban</option>
              {phongBanList.map((pb) => (
                <option key={pb.id} value={pb.id}>
                  {pb.ten_phong_ban}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        )}

        {!isTinhTatCa && (
          <Form.Group className="mb-3">
            <Form.Label>Chọn nhân viên</Form.Label>
            <Form.Select
              value={formData.nhan_vien_id}
              onChange={(e) =>
                setFormData({ ...formData, nhan_vien_id: e.target.value })
              }
            >
              <option value="">-- Chọn nhân viên --</option>
              {nhanVienList.map((nv) => (
                <option key={nv.id} value={nv.id}>
                  {nv.ho_ten}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        )}
      </Form>
    </Modal.Body>
    <Modal.Footer>
      <Button variant="outline-secondary" onClick={onHide}>
        Đóng
      </Button>
      <Button
        variant="primary"
        onClick={onSubmit}
        className="modal-gradient-button"
      >
        Xác nhận
      </Button>
    </Modal.Footer>
  </Modal>
);

export default CalculationModal;
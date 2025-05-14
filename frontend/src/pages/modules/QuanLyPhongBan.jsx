import React, { useEffect, useState } from "react";
import axios from "axios";
import PhongBanForm from "../../components/phongban/PhongBanForm";
import PhongBanList from "../../components/phongban/PhongBanList";
import { Modal, Button, Breadcrumb, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const QuanLyPhongBan = () => {
  const [phongBanList, setPhongBanList] = useState([]);
  const [selectedPhongBan, setSelectedPhongBan] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchPhongBan = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/get-all-phong-ban");
      setPhongBanList(res.data);
    } catch (err) {
      console.error("Lỗi khi tải phòng ban:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhongBan();
  }, []);

  const handleAdd = () => {
    setSelectedPhongBan(null);
    setShowModal(true);
  };

  const handleEdit = (phongBan) => {
    setSelectedPhongBan(phongBan);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc muốn xóa phòng ban này không?")) {
      try {
        await axios.delete(`http://localhost:5000/api/delete-phong-ban/${id}`);
        fetchPhongBan();
      } catch (err) {
        console.error("Lỗi khi xóa:", err);
      }
    }
  };

  const handleViewNhanVien = (phongBanId) => {
    navigate(`/phong-ban/${phongBanId}/nhan-vien`);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedPhongBan(null);
  };

  const handleFormSubmit = () => {
    fetchPhongBan();
    handleModalClose();
  };

  return (
    <div className="container min-vh-100">
      <div className="row">
        <div className="col-12 mt-5">
          <Breadcrumb className="mt-3">
            <Breadcrumb.Item onClick={() => navigate("/")}>Trang chủ</Breadcrumb.Item>
            <Breadcrumb.Item active>Quản lý phòng ban</Breadcrumb.Item>
          </Breadcrumb>

          <Button variant="secondary" onClick={() => navigate("/")}>← Trang chủ</Button>

          <h2 className="mb-4 text-center">Quản lý Phòng ban</h2>

          <div className="mb-3 d-flex justify-content-end flex-wrap">
            <button className="btn btn-success" onClick={handleAdd}>
              Thêm phòng ban
            </button>
          </div>

          {loading ? (
            <div className="text-center my-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Đang tải dữ liệu...</p>
            </div>
          ) : (
            <PhongBanList
              list={phongBanList}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewNhanVien={handleViewNhanVien}
            />
          )}

          {/* Modal thêm/sửa phòng ban */}
          <Modal show={showModal} onHide={handleModalClose} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>
                {selectedPhongBan ? "Chỉnh sửa phòng ban" : "Thêm phòng ban"}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <PhongBanForm
                editingPhongBan={selectedPhongBan}
                onSaved={handleFormSubmit}
              />
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleModalClose}>
                Đóng
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default QuanLyPhongBan;

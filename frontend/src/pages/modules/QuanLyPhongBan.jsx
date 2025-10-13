import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { Modal, Button, Breadcrumb, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import PhongBanForm from "../../components/phongban/PhongBanForm";
import PhongBanList from "../../components/phongban/PhongBanList";
import { getAllPhongBan, deletePhongBan } from "../../services/phongBanApi";

const QuanLyPhongBan = () => {
  const [phongBanList, setPhongBanList] = useState([]);
  const [selectedPhongBan, setSelectedPhongBan] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchPhongBan = async () => {
    setLoading(true);
    try {
      // ⬇️ getAllPhongBan đã unwrap → trả thẳng data (array)
      const data = await getAllPhongBan();
      setPhongBanList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Lỗi khi tải phòng ban:", err);
      toast.error("Không thể tải danh sách phòng ban!");
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
        await toast.promise(deletePhongBan(id), {
          pending: "Đang xóa phòng ban...",
          success: "Đã xóa phòng ban!",
          error: "Xóa phòng ban thất bại!",
        });
        fetchPhongBan();
      } catch (err) {
        console.error("Lỗi khi xóa:", err);
      }
    }
  };

  const handleViewNhanVien = (phongBanId) => {
    navigate(`/get-phong-ban-by-id/${phongBanId}`);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedPhongBan(null);
  };

  const handleFormSubmit = (message) => {
    fetchPhongBan();
    toast.success(
      message ||
      (selectedPhongBan
        ? "Cập nhật phòng ban thành công!"
        : "Thêm phòng ban thành công!")
    );
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
      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
};

export default QuanLyPhongBan;

import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { Modal, Button, Breadcrumb, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import PhongBanForm from "../../components/phongban/PhongBanForm";
import PhongBanList from "../../components/phongban/PhongBanList";
import { getAllPhongBan, deletePhongBan, getPhongBanById } from "../../services/phongBanApi";

const QuanLyPhongBan = () => {
  // ====== PHÂN QUYỀN ======
  const raw = localStorage.getItem("user");
  let currentUser = null;
  try { currentUser = raw ? JSON.parse(raw)?.nhan_vien : null; } catch { }
  const HR_DEPARTMENT_ID = 2;
  const isHR = currentUser?.phong_ban_id === HR_DEPARTMENT_ID;
  const isAdmin = (currentUser?.role || currentUser?.vai_tro) === "ADMIN"; // tuỳ backend

  // Cho phép thêm (HR hoặc Admin), nhưng Sửa/Xoá chỉ HR
  const canAdd = isHR || isAdmin;
  const canEditDelete = isHR;

  const [phongBanList, setPhongBanList] = useState([]);
  const [selectedPhongBan, setSelectedPhongBan] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchPhongBan = async () => {
    setLoading(true);
    try {
      if (canAdd) {
        // HR/Admin thấy tất cả
        const data = await getAllPhongBan();
        setPhongBanList(Array.isArray(data) ? data : []);
      } else if (currentUser?.phong_ban_id) {
        // Nhân viên thường: chỉ phòng ban của mình
        try {
          const one = await getPhongBanById(currentUser.phong_ban_id);
          setPhongBanList(one ? [one] : []);
        } catch {
          setPhongBanList([]);
        }
      } else {
        setPhongBanList([]);
      }
    } catch (err) {
      console.error("Lỗi khi tải phòng ban:", err);
      toast.error("Không thể tải danh sách phòng ban!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhongBan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = () => {
    if (!canAdd) {
      toast.error("Bạn không có quyền thêm phòng ban.");
      return;
    }
    setSelectedPhongBan(null);
    setShowModal(true);
  };

  const handleEdit = (phongBan) => {
    if (!canEditDelete) {
      toast.error("Bạn không có quyền sửa phòng ban.");
      return;
    }
    setSelectedPhongBan(phongBan);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!canEditDelete) {
      toast.error("Bạn không có quyền xóa phòng ban.");
      return;
    }
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
    // nhân viên thường chỉ được xem trang chi tiết phòng ban của chính mình
    if (!(isHR || isAdmin) && phongBanId !== currentUser?.phong_ban_id) {
      toast.error("Bạn không có quyền xem phòng ban này.");
      return;
    }
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
            {canAdd && (
              <button className="btn btn-success" onClick={handleAdd}>
                Thêm phòng ban
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center my-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Đang tải dữ liệu...</p>
            </div>
          ) : (
            <PhongBanList
              list={phongBanList}
              onEdit={canEditDelete ? handleEdit : undefined}
              onDelete={canEditDelete ? handleDelete : undefined}
              onViewNhanVien={handleViewNhanVien}
              // gửi thêm cờ để component con có thể ẩn cột hành động
              showActions={canEditDelete}
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
  
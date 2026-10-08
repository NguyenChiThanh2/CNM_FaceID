import React, { useEffect, useState } from "react";
import { Button, Table, Modal, Form, Breadcrumb } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getAllLoaiNghiPhep,
  createLoaiNghiPhep,
  updateLoaiNghiPhep,
  deleteLoaiNghiPhep,
} from "../../services/loaiNghiPhepApi";

const EMPTY_FORM = {
  ten: "",
  mo_ta: "",
  co_luong: true,
  don_vi_tinh: "NGAY",
  yeu_cau_cham_cong: false,
  yeu_cau_thong_tin_sinh: false,
};

const QuanLyLoaiNghiPhep = () => {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const fetchList = async () => {
    try {
      const data = await getAllLoaiNghiPhep();
      setList(data);
    } catch (err) {
      toast.error("Lỗi khi tải danh mục: " + (err?.message || ""));
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (loai) => {
    setEditing(loai);
    setFormData({
      ten: loai.ten || "",
      mo_ta: loai.mo_ta || "",
      co_luong: !!loai.co_luong,
      don_vi_tinh: loai.don_vi_tinh || "NGAY",
      yeu_cau_cham_cong: !!loai.yeu_cau_cham_cong,
      yeu_cau_thong_tin_sinh: !!loai.yeu_cau_thong_tin_sinh,
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateLoaiNghiPhep(editing.id, formData);
        toast.success("Cập nhật loại nghỉ phép thành công!");
      } else {
        await createLoaiNghiPhep(formData);
        toast.success("Thêm loại nghỉ phép thành công!");
      }
      setShowModal(false);
      fetchList();
    } catch (err) {
      toast.error(err?.data?.error || err?.message || "Lỗi khi lưu");
    }
  };

  const handleDelete = async (loai) => {
    if (!window.confirm(`Xóa loại nghỉ phép "${loai.ten}"?`)) return;
    try {
      await deleteLoaiNghiPhep(loai.id);
      toast.success("Đã xóa");
      fetchList();
    } catch (err) {
      toast.error(err?.data?.error || err?.message || "Không thể xóa");
    }
  };

  return (
    <div className="container mt-4">
      <Breadcrumb>
        <Breadcrumb.Item onClick={() => navigate("/")}>Trang chủ</Breadcrumb.Item>
        <Breadcrumb.Item onClick={() => navigate("/nghi-phep")}>Nghỉ phép</Breadcrumb.Item>
        <Breadcrumb.Item active>Danh mục loại nghỉ phép</Breadcrumb.Item>
      </Breadcrumb>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Quản lý loại nghỉ phép</h4>
        <Button variant="success" onClick={openAdd}>
          + Thêm loại nghỉ phép
        </Button>
      </div>

      <Table striped bordered hover responsive>
        <thead className="table-dark">
          <tr>
            <th>Tên</th>
            <th>Mô tả</th>
            <th>Có lương?</th>
            <th>Đơn vị tính</th>
            <th>Gắn chấm công?</th>
            <th>Yêu cầu thông tin sinh?</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {list.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center">
                Chưa có loại nghỉ phép nào
              </td>
            </tr>
          ) : (
            list.map((loai) => (
              <tr key={loai.id}>
                <td>{loai.ten}</td>
                <td>{loai.mo_ta}</td>
                <td>{loai.co_luong ? "Có" : "Không"}</td>
                <td>{loai.don_vi_tinh === "GIO" ? "Theo giờ" : "Theo ngày"}</td>
                <td>{loai.yeu_cau_cham_cong ? "Có" : "Không"}</td>
                <td>{loai.yeu_cau_thong_tin_sinh ? "Có" : "Không"}</td>
                <td>
                  <Button size="sm" variant="outline-warning" className="me-2" onClick={() => openEdit(loai)}>
                    Sửa
                  </Button>
                  <Button size="sm" variant="outline-danger" onClick={() => handleDelete(loai)}>
                    Xóa
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editing ? "Sửa loại nghỉ phép" : "Thêm loại nghỉ phép"}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Tên loại nghỉ phép</Form.Label>
              <Form.Control name="ten" value={formData.ten} onChange={handleChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Mô tả</Form.Label>
              <Form.Control name="mo_ta" value={formData.mo_ta} onChange={handleChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Đơn vị tính</Form.Label>
              <Form.Select name="don_vi_tinh" value={formData.don_vi_tinh} onChange={handleChange}>
                <option value="NGAY">Theo ngày (nghỉ nhiều ngày)</option>
                <option value="GIO">Theo giờ (gắn 1 ngày chấm công cụ thể)</option>
              </Form.Select>
            </Form.Group>
            <Form.Check
              className="mb-2"
              type="checkbox"
              label="Có tính vào lương / trừ ngày phép còn lại"
              name="co_luong"
              checked={formData.co_luong}
              onChange={handleChange}
            />
            <Form.Check
              className="mb-2"
              type="checkbox"
              label="Yêu cầu gắn với 1 bản ghi chấm công cụ thể (vd quên chấm công, tăng ca)"
              name="yeu_cau_cham_cong"
              checked={formData.yeu_cau_cham_cong}
              onChange={handleChange}
            />
            <Form.Check
              className="mb-2"
              type="checkbox"
              label="Yêu cầu nhập thông tin sinh (ngày dự sinh, số con, phương pháp sinh)"
              name="yeu_cau_thong_tin_sinh"
              checked={formData.yeu_cau_thong_tin_sinh}
              onChange={handleChange}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              {editing ? "Lưu thay đổi" : "Thêm"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default QuanLyLoaiNghiPhep;

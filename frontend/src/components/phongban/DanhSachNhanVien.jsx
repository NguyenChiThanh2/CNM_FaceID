import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { Table, Spinner, Button, Breadcrumb, Card } from "react-bootstrap";

const DanhSachNhanVien = () => {
  const { id } = useParams(); // id phòng ban
  const [nhanVienList, setNhanVienList] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNhanVien = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/nhan-vien-by-phong-ban/${id}`);
        setNhanVienList(res.data);
      } catch (err) {
        console.error("Lỗi khi tải danh sách nhân viên:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNhanVien();
  }, [id]);

  return (
    <Card className="container mt-5 p-4">
      <Breadcrumb>
        <Breadcrumb.Item onClick={() => navigate("/")}>Trang chủ</Breadcrumb.Item>
        <Breadcrumb.Item onClick={() => navigate("/phong-ban")}>Quản lý phòng ban</Breadcrumb.Item>
        <Breadcrumb.Item active>Danh sách nhân viên</Breadcrumb.Item>
      </Breadcrumb>

      <h4 className="text-center text-primary mb-4">Danh sách nhân viên thuộc phòng ban</h4>

      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" />
          <p className="mt-2">Đang tải dữ liệu...</p>
        </div>
      ) : nhanVienList.length === 0 ? (
        <p className="text-center text-muted">Không có nhân viên nào trong phòng ban này.</p>
      ) : (
        <div className="table-responsive">
          <Table striped bordered hover responsive>
            <thead className="table-dark">
              <tr>
                <th>#</th>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Chức vụ</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {nhanVienList.map((nv, idx) => (
                <tr key={nv.id}>
                  <td>{idx + 1}</td>
                  <td>{nv.ho_ten}</td>
                  <td>{nv.email}</td>
                  <td>{nv.chuc_vu}</td>
                  <td>{nv.trang_thai}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      <div className="text-center mt-3">
        <Button variant="secondary" onClick={() => navigate("/phong-ban")}>
          ← Quay lại
        </Button>
      </div>
    </Card>
  );
};

export default DanhSachNhanVien;

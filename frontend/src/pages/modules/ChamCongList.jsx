import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const ChamCongList = () => {
  const [chamCongList, setChamCongList] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [dsNhanVien, setDsNhanVien] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const navigate = useNavigate();

  useEffect(() => {
    fetchChamCong();
    fetchNhanVien();
  }, []);

  const fetchChamCong = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:5000/api/get-all-cham-cong");
      setChamCongList(response.data);
    } catch (error) {
      console.error("Lỗi khi gọi API:", error);
    }
  };

  const fetchNhanVien = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:5000/api/get-all-nhan-vien");
      setDsNhanVien(response.data);
    } catch (err) {
      console.error("Lỗi khi load nhân viên:", err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc muốn xóa chấm công này không?")) {
      try {
        await axios.delete(`http://127.0.0.1:5000/api/delete-cham-cong/${id}`);
        fetchChamCong();
      } catch (error) {
        console.error("Lỗi khi xóa chấm công:", error.response || error.message);
        alert("Có lỗi xảy ra khi xóa chấm công!");
      }
    }
  };

  const handleRowClick = (chamCong) => {
    navigate(`/cham-cong/${chamCong.id}`);
  };

  const getTenNhanVien = (id) => {
    const item = dsNhanVien.find((nv) => nv.id === id);
    return item ? item.ho_ten : "Không rõ";
  };

  const filteredList = chamCongList.filter((chamCong) =>
    new Date(chamCong.ngay).toLocaleDateString().includes(searchKeyword.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredList.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="container min-vh-100">
      <div className="row">
        <div className="col-12 mt-5">
          <button className="btn btn-secondary mb-3" onClick={() => navigate("/")}>
            ← Về trang chủ
          </button>

          <h2 className="mb-4 text-center">Quản lý chấm công</h2>

          <div className="mb-4 d-flex justify-content-between">
            <input
              type="text"
              className="form-control"
              placeholder="Tìm theo ngày..."
              value={searchKeyword}
              onChange={(e) => { setSearchKeyword(e.target.value); setCurrentPage(1); }}
            />
          </div>

          <div className="table-responsive">
            <table className="table table-bordered table-hover w-100">
              <thead className="table-dark">
                <tr>
                  <th>ID</th>
                  <th>Nhân viên</th>
                  <th>Ngày</th>
                  <th>Giờ vào</th>
                  <th>Giờ ra</th>
                  <th>Ảnh vào</th>
                  <th>Ảnh ra</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>

              <tbody>
                {currentItems.map((chamCong) => (
                  <tr key={chamCong.id} onClick={() => handleRowClick(chamCong)} style={{ cursor: "pointer" }}>
                    <td>{chamCong.id}</td>
                    <td>{getTenNhanVien(chamCong.nhan_vien_id)}</td>
                    <td>{new Date(chamCong.ngay).toLocaleDateString()}</td>
                    <td>{chamCong.thoi_gian_vao}</td>
                    <td>{chamCong.thoi_gian_ra}</td>
                    <td>
                      <img
                        src={`http://127.0.0.1:5000/api/checkin_images/${chamCong.hinh_anh_vao}`}
                        alt="Ảnh vào"
                        width="50"
                        height="50"
                        style={{ objectFit: "cover", borderRadius: "50%" }}
                      />
                    </td>
                    <td>
                      <img
                        src={`http://127.0.0.1:5000/api/checkin_images/${chamCong.hinh_anh_ra}`}
                        alt="Ảnh vào"
                        width="50"
                        height="50"
                        style={{ objectFit: "cover", borderRadius: "50%" }}
                      />
                    </td>
                    <td>{chamCong.trang_thai}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-warning me-2"
                        onClick={(e) => { e.stopPropagation(); handleRowClick(chamCong); }}
                      >
                        Sửa
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={(e) => { e.stopPropagation(); handleDelete(chamCong.id); }}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>

          <div className="d-flex justify-content-center mt-4">
            <Button
              variant="secondary"
              disabled={currentPage === 1}
              onClick={() => paginate(currentPage - 1)}
            >
              Trang trước
            </Button>
            <span className="mx-3">
              Trang {currentPage} / {totalPages}
            </span>
            <Button
              variant="secondary"
              disabled={currentPage === totalPages}
              onClick={() => paginate(currentPage + 1)}
            >
              Trang sau
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChamCongList;

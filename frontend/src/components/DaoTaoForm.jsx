import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

const DaoTaoForm = ({ editingDaoTao, setEditingDaoTao }) => {
  const [formData, setFormData] = useState({
    khoa_dao_tao: "",
    ngay_bat_dau: "",
    ngay_ket_thuc: "",
  });
  const [nhanVienList, setNhanVienList] = useState([]);
  const [selectedNhanViens, setSelectedNhanViens] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState(""); // Từ khóa tìm kiếm
  const navigate = useNavigate();
  const { id } = useParams(); // Lấy id từ URL khi chỉnh sửa khóa đào tạo

  useEffect(() => {
    fetchNhanViens();
    if (id && id !== "create") {
      fetchDaoTao(id);
    }
  }, [id]);

  const fetchNhanViens = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:5000/api/get-all-nhan-vien");
      setNhanVienList(response.data);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách nhân viên:", error);
    }
  };

  const fetchDaoTao = async (id) => {
    try {
      const response = await axios.get(`http://127.0.0.1:5000/api/get-dao-tao-by-id/${id}`);
      const daoTaoData = response.data;

      // Đảm bảo lấy thông tin về khóa đào tạo chính xác
      setFormData({
        khoa_dao_tao: daoTaoData.khoa_dao_tao,
        ngay_bat_dau: daoTaoData.ngay_bat_dau,
        ngay_ket_thuc: daoTaoData.ngay_ket_thuc,
      });

      // Kiểm tra nếu dữ liệu nhân viên có tồn tại, gán vào selectedNhanViens
      if (daoTaoData.nhan_viens && Array.isArray(daoTaoData.nhan_viens)) {
        const nhanVienIds = daoTaoData.nhan_viens.map((nv) => nv.id);
        setSelectedNhanViens(nhanVienIds); // Gán nhân viên đã tham gia vào khóa đào tạo
      }
    } catch (error) {
      console.error("Lỗi khi lấy thông tin khóa đào tạo:", error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let response;
      if (id) {
        // Chỉnh sửa khóa đào tạo
        response = await axios.put(`http://127.0.0.1:5000/api/edit-dao-tao/${id}`, formData);
      } else {
        // Tạo mới khóa đào tạo
        response = await axios.post("http://127.0.0.1:5000/api/add-dao-tao", formData);
      }

      const daoTaoId = response.data.id || id; // Lấy ID khóa đào tạo đã tạo hoặc đang sửa

      // Gán nhân viên vào khóa đào tạo
      await Promise.all(
        selectedNhanViens.map((nhanVienId) =>
          axios.post(`http://127.0.0.1:5000/api/get-dao-tao-by-id/${daoTaoId}/assign`, {
            nhan_vien_id: nhanVienId,
          })
        )
      );

      navigate("/dao-tao"); // Quay lại danh sách khóa đào tạo
    } catch (error) {
      console.error("Lỗi khi thêm/sửa khóa đào tạo:", error);
    }
  };

  const handleSelectNhanVien = (nhanVienId) => {
    setSelectedNhanViens((prev) =>
      prev.includes(nhanVienId) ? prev.filter((id) => id !== nhanVienId) : [...prev, nhanVienId]
    );
  };

  // Lọc danh sách nhân viên theo từ khóa tìm kiếm
  const filteredNhanVienList = nhanVienList.filter((nv) =>
    nv.ho_ten.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label className="form-label">Khóa đào tạo</label>
        <input
          type="text"
          className="form-control"
          name="khoa_dao_tao"
          value={formData.khoa_dao_tao}
          onChange={handleChange}
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Ngày bắt đầu</label>
        <input
          type="date"
          className="form-control"
          name="ngay_bat_dau"
          value={formData.ngay_bat_dau}
          onChange={handleChange}
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Ngày kết thúc</label>
        <input
          type="date"
          className="form-control"
          name="ngay_ket_thuc"
          value={formData.ngay_ket_thuc}
          onChange={handleChange}
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Chọn nhân viên</label>
        <div>
          <input
            type="text"
            className="form-control mb-3"
            placeholder="Tìm kiếm nhân viên..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
          {filteredNhanVienList.length > 0 ? (
            filteredNhanVienList.map((nv) => (
              <div key={nv.id} className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id={`nhanvien-${nv.id}`}
                  checked={selectedNhanViens.includes(nv.id)}
                  onChange={() => handleSelectNhanVien(nv.id)}
                />
                <label className="form-check-label" htmlFor={`nhanvien-${nv.id}`}>
                  {nv.ho_ten}
                </label>
              </div>
            ))
          ) : (
            <p>Không tìm thấy nhân viên nào.</p>
          )}
        </div>
      </div>

      <button type="submit" className="btn btn-primary">
        {id ? "Cập nhật" : "Thêm mới"}
      </button>
    </form>
  );
};

export default DaoTaoForm;

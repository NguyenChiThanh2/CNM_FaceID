import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const ChamCongNhanVien = () => {
  const { id } = useParams(); // lấy id nhân viên từ URL

  // lấy tháng, năm hiện tại
  const now = new Date();
  const [thang, setThang] = useState(now.getMonth() + 1); // JS tháng bắt đầu từ 0
  const [nam, setNam] = useState(now.getFullYear());

  const [chamCong, setChamCong] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nhanVien, setNhanVien] = useState(null);
  const [modalMessage, setModalMessage] = useState(""); // thông báo modal
  const [showModal, setShowModal] = useState(false); // trạng thái modal

  useEffect(() => {
    fetchChamCong(thang, nam);
  }, [id, thang, nam]);

  useEffect(() => {
    fetch(`http://localhost:5000/api/get-nhan-vien-by-id/${id}`)
      .then((res) => res.json())
      .then((data) => setNhanVien(data));
  }, [id]);
  // fetch chấm công theo id + tháng + năm
  const fetchChamCong = async (thang, nam) => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:5000/api/chamcong_1nhanvien_theothang/${id}?thang=${thang}&nam=${nam}`
      );
      const data = await response.json();
      setChamCong(data);
    } catch (error) {
      console.error("Lỗi khi fetch dữ liệu chấm công:", error);
    } finally {
      setLoading(false);
    }
  };

  // Hàm gọi API tính số ngày công
  const tinhSoCong = async (thang, nam) => {
    try {
      setLoading(true);

      const res = await fetch(
        `http://localhost:5000/api/tinh-so-cong/${id}?thang=${thang}&nam=${nam}`
      );
      const data = await res.json();
      alert(data.message || "✅ Đã tính số công thành công!");
      // Set thông báo từ API (hoặc mặc định)
      // setModalMessage(data.message || "✅ Đã tính số công thành công!");
      // setShowModal(true);

      // Sau khi tính số công, fetch lại dữ liệu chấm công
      const chamCongRes = await fetch(
        `http://localhost:5000/api/chamcong_1nhanvien_theothang/${id}?thang=${thang}&nam=${nam}`
      );
      const chamCongData = await chamCongRes.json();
      setChamCong(chamCongData);
    } catch (error) {
      console.error("Lỗi khi tính số ngày công:", error);
      setModalMessage("❌ Có lỗi khi tính số ngày công");
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  if (!nhanVien) return <p>Đang tải thông tin nhân viên...</p>;

  if (loading) return <p className="p-4">Đang tải dữ liệu...</p>;

  return (
    <div className="container min-vh-100">
      <div className="row">
        <div className="col-12 mt-5">
          {nhanVien ? (
            <>
              <h2 className="text-xl font-bold mb-2">Chi tiết nhân viên</h2>
              <p>
                <strong>Họ tên:</strong> {nhanVien.ho_ten}
              </p>
              <p>
                <strong>Email:</strong> {nhanVien.email}
              </p>
              <p>
                <strong>Chức vụ:</strong> {nhanVien.chuc_vu}
              </p>

              {/* Bộ lọc tháng/năm */}
              {/* Bộ lọc tháng/năm */}
              <div className="flex items-center gap-2 my-4">
                <select
                  value={thang}
                  onChange={(e) => setThang(Number(e.target.value))}
                  className="border rounded p-1"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      Tháng {m}
                    </option>
                  ))}
                </select>{" "}
                &nbsp;
                <select
                  value={nam}
                  onChange={(e) => setNam(Number(e.target.value))}
                  className="border rounded p-1"
                >
                  {Array.from({ length: 5 }, (_, i) => 2022 + i).map((y) => (
                    <option key={y} value={y}>
                      Năm {y}
                    </option>
                  ))}
                </select>{" "}
                &nbsp;
                {/* Nút tính công */}
                <button
                  onClick={() => tinhSoCong(thang, nam)}
                  disabled={loading}
                  className="btn btn-warning bg-green-600 text-white py-1 rounded hover:bg-green-700"
                >
                  {loading ? "Đang tính..." : "Tính số ngày công"}
                </button>
              </div>

              {/* Bảng dữ liệu chấm công */}
              {!Array.isArray(chamCong) || chamCong.length === 0 ? (
                <p className="text-gray-500">Không có dữ liệu chấm công.</p>
              ) : (
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
                        <th>Số Công</th>
                        <th>Hành động</th>
                      </tr>
                    </thead>

                    <tbody>
                      {chamCong.map((cc) => (
                        <tr key={cc.id} className="text align-items-center hover:bg-gray-50 ">
                          <td>{cc.id}</td>
                          <td>{cc.nhan_vien_id}</td>
                          <td>{new Date(cc.ngay).toLocaleDateString()}</td>
                          <td>{cc.thoi_gian_vao || "-"}</td>
                          <td>{cc.thoi_gian_ra || "-"}</td>
                          <td>
                            <img
                              src={`http://127.0.0.1:5000/api/checkin_images/${cc.hinh_anh_vao}`}
                              alt="Ảnh vào"
                              width="50"
                              height="50"
                              style={{
                                objectFit: "cover",
                                borderRadius: "50%",
                              }}
                            />
                          </td>
                          <td>
                            <img
                              src={`http://127.0.0.1:5000/api/checkin_images/${cc.hinh_anh_ra}`}
                              alt="Ảnh vào"
                              width="50"
                              height="50"
                              style={{
                                objectFit: "cover",
                                borderRadius: "50%",
                              }}
                            />
                          </td>
                          <td>{cc.so_cong}</td>
                          <td>
                            {/* <button
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
                        </button> */}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <p>Đang tải thông tin nhân viên...</p>
          )}
        </div>
      </div>
      {/* {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 transition-opacity duration-300">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-96 text-center animate-fade-in">
            <h3 className="text-lg font-semibold mb-4">Thông báo</h3>
            <p className="text-gray-700">{modalMessage}</p>
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setShowModal(false)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default ChamCongNhanVien;


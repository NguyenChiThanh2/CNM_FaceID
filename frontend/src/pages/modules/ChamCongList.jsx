import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button, Breadcrumb, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";

const ChamCongList = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const [chamCongList, setChamCongList] = useState([]);
  const [dsNhanVien, setDsNhanVien] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    fetchChamCong();
    fetchNhanVien();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (query.trim() !== "") {
        fetchData(query);
      } else {
        setResults([]); // clear nếu input rỗng
      }
    }, 0); // chờ 400ms sau khi gõ mới gọi API

    return () => clearTimeout(delayDebounce); // clear timeout khi gõ tiếp
  }, [query]);

  const fetchData = async (q) => {
    try {
      setLoading(true);
      const res = await axios.get(`http://127.0.0.1:5000/api/search_nhanvien_theoten?q=${q}`);
      setResults(res.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChamCong = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("http://127.0.0.1:5000/api/get-all-cham-cong");
      setChamCongList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Lỗi khi gọi API chấm công:", error);
      toast.error("Không thể tải danh sách chấm công!");
    } finally {
      setLoading(false);
    }
  };

  const fetchNhanVien = async () => {
    try {
      const { data } = await axios.get("http://127.0.0.1:5000/api/get-all-nhan-vien");
      setDsNhanVien(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Lỗi khi load nhân viên:", error);
      toast.error("Không thể tải danh sách nhân viên!");
    }
  };

  const getTenNhanVien = (id) => {
    const nv = dsNhanVien.find((x) => x.id === id);
    return nv?.ho_ten || "Không rõ";
  };

  const formatDate = (d) => {
    const dt = new Date(d);
    return isNaN(dt) ? "-" : dt.toLocaleDateString("vi-VN");
  };

  const formatTime = (d) => {
    if (!d) return "-";
    const dt = new Date(d);
    return isNaN(dt)
      ? d // nếu backend trả chuỗi giờ dạng custom thì hiển thị nguyên văn
      : dt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  };

  const getImgUrl = (file) =>
    file ? `http://127.0.0.1:5000/api/checkin_images/${file}` : "";

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa chấm công này không?")) return;
    try {
      await toast.promise(
        axios.delete(`http://127.0.0.1:5000/api/delete-cham-cong/${id}`),
        {
          pending: "Đang xóa chấm công...",
          success: "Đã xóa chấm công!",
          error: "Xóa chấm công thất bại!",
        }
      );
      // làm mới dữ liệu & về trang 1 để tránh trang trống
      await fetchChamCong();
      setCurrentPage(1);
    } catch (error) {
      // lỗi đã được toast.promise hiển thị
      console.error("Lỗi khi xóa chấm công:", error);
    }
  };

  const handleRowClick = (chamCong) => {
    navigate(`/cham-cong/${chamCong.id}`);
  };

  // --- Tìm kiếm theo ngày (chuỗi) hoặc tên NV
  const filteredList = chamCongList.filter((cc) => {
    const ngayStr = formatDate(cc.ngay);
    const tenNhanVien = getTenNhanVien(cc.nhan_vien_id).toLowerCase();
    const key = (searchKeyword || "").toLowerCase();
    return ngayStr.toLowerCase().includes(key) || tenNhanVien.includes(key);
  });

  const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredList.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    
    <div className="container min-vh-100">
      <div className="row">
        <div className="col-12 mt-5">
          <Breadcrumb className="mt-3">
            <Breadcrumb.Item onClick={() => navigate("/")}>Trang chủ</Breadcrumb.Item>
            <Breadcrumb.Item active>Quản lý chấm công</Breadcrumb.Item>
          </Breadcrumb>

          <Button variant="secondary" onClick={() => navigate("/")}>← Trang chủ</Button>

          <h2 className="mb-4 text-center">Quản lý chấm công</h2>

          <div className="">
            <div className="mb-1 d-flex justify-content-between">
              <input
                type="text"

                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nhập tên nhân viên..."
                className="form-control"
              />
            </div>
            <div className="list-group w-auto mb-4">
              {results.map((nv) => (
                <button type="button" className="list-group-item list-group-item-action" key={nv.id} onClick={() => handleRowClick_tennv(nv)} >
                  {nv.ho_ten}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4 d-flex justify-content-between">
            <input
              type="text"
              className="form-control"
              placeholder="🔍 Tìm theo ngày hoặc tên nhân viên..."
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {loading ? (
            <div className="text-center my-4">
              <Spinner animation="border" variant="primary" />
              <div className="mt-2">Đang tải dữ liệu...</div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-hover w-100">
                <thead className="table-dark text-center">
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
                  {currentItems.map((cc) => (
                    <tr key={cc.id}>
                      <td>{cc.id}</td>
                      <td>{getTenNhanVien(cc.nhan_vien_id)}</td>
                      <td>{formatDate(cc.ngay)}</td>
                      <td>{formatTime(cc.thoi_gian_vao)}</td>
                      <td>{formatTime(cc.thoi_gian_ra)}</td>
                      <td className="text-center">
                        {cc.hinh_anh_vao ? (
                          <img
                            src={getImgUrl(cc.hinh_anh_vao)}
                            alt="Ảnh vào"
                            width="50"
                            height="50"
                            style={{ objectFit: "cover", borderRadius: "50%" }}
                          />
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="text-center">
                        {cc.hinh_anh_ra ? (
                          <img
                            src={getImgUrl(cc.hinh_anh_ra)}
                            alt="Ảnh ra"
                            width="50"
                            height="50"
                            style={{ objectFit: "cover", borderRadius: "50%" }}
                          />
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>{cc.trang_thai || (cc.thoi_gian_ra ? "Hoàn tất" : "Chưa ra")}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-warning me-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(cc);
                          }}
                        >
                          Sửa
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(cc.id);
                          }}
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}

                  {currentItems.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center text-muted">
                        Không có bản ghi phù hợp
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="d-flex justify-content-center mt-4 align-items-center gap-3">
            <Button
              variant="outline-secondary"
              disabled={currentPage === 1}
              onClick={() => paginate(currentPage - 1)}
            >
              ← Trang trước
            </Button>
            <span>
              Trang {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline-secondary"
              disabled={currentPage === totalPages}
              onClick={() => paginate(currentPage + 1)}
            >
              Trang sau →
            </Button>
          </div>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
};

export default ChamCongList;

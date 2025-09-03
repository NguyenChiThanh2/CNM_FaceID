import React, { useEffect, useState } from "react";
import { Button, Modal, OverlayTrigger, Tooltip, Form, Spinner, Row, Col  } from "react-bootstrap";
import { useParams } from "react-router-dom";
import axios from "axios";

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
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState([]); // dữ liệu form
  const [showModalTB, setShowModalTB] = useState(false); // trạng thái modal

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
  
  const laygiaypheptheochamcong = async (cc) => {
    setShowModal(true);
    try {
       const laygiayphep = await axios.get(
        `http://localhost:5000/api/get_giay_phep_quen_chamcong/${cc}`
      );
      setFormData(laygiayphep.data); // set dữ liệu lấy về vào form
    } catch (error) {
      console.error("Lỗi khi cập nhật giấy phép:", error);
      setModalMessage("❌ Có lỗi khi cập nhật giấy phép");
      setShowModal(true);
    }
    finally {
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
      // alert(data.message || "✅ Đã tính số công thành công!");
      // Set thông báo từ API (hoặc mặc định)
      setModalMessage("✅ " + data.message);
      setShowModalTB(true);

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
  const tinhsocong_theogiayphep = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
       const response = await axios.put(
        `http://127.0.0.1:5000/api/tinhsocong_theogiayphep`, formData
      );
       if (response.status === 200) {
        setModalMessage("✅ Cập nhật giấy phép và số công thành công!");
        setShowModalTB(true);
        setShowModal(false);
        fetchChamCong(thang, nam); // refresh dữ liệu
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật:", error);
      setModalMessage("❌" + error.response.data.body.error);
      setShowModalTB(true);
    }finally {
      setLoading(false);
    }
  };

  if (!nhanVien) return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" role="status" />
        <span className="ms-2">⏳ Đang tải thông tin nhân viên...</span>
      </div>
    );

  if (loading) return (
       <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" role="status" />
        <span className="ms-2">⏳ Đang tải dữ liệu...</span>
      </div>
    ); 

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
                    <thead className="table-dark text-center">
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
                        <tr key={cc.id} className="text-center align-middle hover:bg-gray-50 ">
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
                            {!cc.thoi_gian_vao || !cc.thoi_gian_ra ? (
                              <OverlayTrigger placement="top" overlay={<Tooltip>Sửa</Tooltip>}>
                                <Button variant="btn btn-success" className="w-100" onClick={() => laygiaypheptheochamcong(cc.id)}>
                                  Cập nhật giấy phép
                                </Button>
                              </OverlayTrigger>
                              ) : (
                              <span className="text-success"></span>
                            )}
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
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Cập nhật giấy phép quên chấm công</Modal.Title>
        </Modal.Header>
         <Modal.Body>
        {formData && formData.id ? (
          <Form onSubmit={tinhsocong_theogiayphep}>
            <Form.Control
              type="hidden"
              name="cham_cong_id"
              value={formData.cham_cong_id}
            />
            <Row>
              <Col>
                <Form.Group>
                  <Form.Label>Mã giấy phép</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.id}
                    // onChange={(e) =>
                    //   setFormData({ ...formData, thoi_gian_vao: e.target.value })
                    // }
                  disabled readonly />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group>
                  <Form.Label>Loại giấy phép</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.loai_giay_phep}
                    // onChange={(e) =>
                    //   setFormData({ ...formData, thoi_gian_ra: e.target.value })
                    // }
                  disabled readonly />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col>
                <Form.Group>
                  <Form.Label>Trạng thái</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.trang_thai}
                    // onChange={(e) =>
                    //   setFormData({ ...formData, thoi_gian_vao: e.target.value })
                    // }
                  disabled readonly />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group>
                  <Form.Label>Ngày duyệt</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.ngay_duyet}
                    // onChange={(e) =>
                    //   setFormData({ ...formData, thoi_gian_ra: e.target.value })
                    // }
                  disabled readonly />
                </Form.Group>
              </Col>
            </Row>
            
            {formData.trang_thai === "Đã duyệt" ? (
              <Button type="submit" variant="primary" className="mt-3">
                Áp dụng
              </Button>
              ) : (
              <p className="text-danger text-center pt-4">Giấy phép chưa được duyệt không thể áp dụng</p>
              )}
          </Form>
        ) : (
          <p className="text-danger text-center pt-3">Giấy phép không tồn tại</p>
        )}
        </Modal.Body>
        {/* <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Đóng
          </Button>
        </Modal.Footer> */}
      </Modal>

      {/* Modal thông báo */}
       <Modal show={showModalTB} onHide={() => setShowModalTB(false)} centered>
        {/* <Modal.Header >
          <Modal.Title>Thông báo</Modal.Title>
        </Modal.Header> */}
        <Modal.Body>
            {/* <h3 className="text-lg font-semibold mb-4">Thông báo</h3> */}
            <h4 className="text-lg font-semibold mb-4 mt-4 text-center">{modalMessage}</h4>
        </Modal.Body>
        {/* <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModalTB(false)}>
            Đóng
          </Button>
        </Modal.Footer> */}
      </Modal>
    </div>
  );
};

export default ChamCongNhanVien;


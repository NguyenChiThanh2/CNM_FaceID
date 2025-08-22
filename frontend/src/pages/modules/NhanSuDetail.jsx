import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaUser,
  FaBirthdayCake,
  FaEnvelope,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaRegCheckCircle,
  FaGift,
  FaChalkboardTeacher,
} from "react-icons/fa";
import { getChucVuById } from "../../services/api/chuc-vu-api";
import { getPhongBanById } from "../../services/api/phong-ban-api";
import { getPhucLoiByNhanVienId } from "../../services/api/phuc-loi-api";
import { Button, Modal, Breadcrumb } from "react-bootstrap";
import { jsPDF } from "jspdf";
import domtoimage from "dom-to-image";
import * as XLSX from "xlsx";
import { Document, Packer, Paragraph } from "docx";
import { saveAs } from "file-saver";

const NhanSuDetail = () => {
  const { id } = useParams();
  const [nhanSu, setNhanSu] = useState(null);
  const [chucVu, setChucVu] = useState("");
  const [phongBan, setPhongBan] = useState("");
  const [phucLoiList, setPhucLoiList] = useState([]);
  const [daoTaoList, setDaoTaoList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const printRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get(`http://localhost:5000/api/get-nhan-vien-by-id/${id}`);
        setNhanSu(data);

        const [cv, pb, pl, dt] = await Promise.all([
          getChucVuById(data.chuc_vu_id),
          getPhongBanById(data.phong_ban_id),
          getPhucLoiByNhanVienId(id),
          axios.get(`http://localhost:5000/api/get-dao-tao-by-nhan-vien-id/${id}`),
        ]);

        setChucVu(cv.ten_chuc_vu);
        setPhongBan(pb.ten_phong_ban);
        setPhucLoiList(pl);
        setDaoTaoList(dt.data);
      } catch (err) {
        console.error("❌ Lỗi khi tải dữ liệu:", err);
      }
    };

    fetchData();
  }, [id]);

  const exportToPDF = async () => {
    setShowModal(false);
    setTimeout(async () => {
      const element = printRef.current;
      if (!element) {
        console.error("❌ Không tìm thấy phần tử để in");
        return;
      }

      domtoimage.toPng(element).then((dataUrl) => {
        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const imgProps = pdf.getImageProperties(dataUrl);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`NhanSu_${nhanSu.ho_ten}.pdf`);
      }).catch((error) => {
        console.error("Error generating image from DOM:", error);
      });
    }, 300);
  };

  const exportToExcel = () => {
    const data = [{
      "Tên": nhanSu.ho_ten,
      "Chức vụ": chucVu,
      "Phòng ban": phongBan,
      "Giới tính": nhanSu.gioi_tinh,
      "Ngày sinh": new Date(nhanSu.ngay_sinh).toLocaleDateString(),
      "Email": nhanSu.email,
      "Điện thoại": nhanSu.so_dien_thoai,
      "Địa chỉ": nhanSu.dia_chi,
      "Trạng thái": nhanSu.trang_thai,
      "Phúc lợi": phucLoiList.map(item => `${item.ten_phuc_loi}: ${item.gia_tri}`).join(", "),
      "Khóa đào tạo": daoTaoList.map(dt => `${dt.ten_khoa_dao_tao} (${dt.ket_qua || "Chưa có kết quả"})`).join(", "),
      "Số ngày phép còn lại": nhanSu.so_ngay_phep_con_lai,
    }];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "NhanSu");
    XLSX.writeFile(wb, `NhanSu_${nhanSu.ho_ten}.xlsx`);
    setShowModal(false);
  };

  const exportToWord = async () => {
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph(`Thông tin nhân sự: ${nhanSu.ho_ten}`),
          new Paragraph(`Chức vụ: ${chucVu}`),
          new Paragraph(`Phòng ban: ${phongBan}`),
          new Paragraph(`Giới tính: ${nhanSu.gioi_tinh}`),
          new Paragraph(`Ngày sinh: ${new Date(nhanSu.ngay_sinh).toLocaleDateString()}`),
          new Paragraph(`Email: ${nhanSu.email}`),
          new Paragraph(`Điện thoại: ${nhanSu.so_dien_thoai}`),
          new Paragraph(`Địa chỉ: ${nhanSu.dia_chi}`),
          new Paragraph(`Trạng thái: ${nhanSu.trang_thai}`),
          new Paragraph(`Số ngày phép còn lại: ${nhanSu.so_ngay_phep_con_lai}`),
          new Paragraph(`Phúc lợi:`),
          ...phucLoiList.map(pl => new Paragraph(`${pl.ten_phuc_loi}: ${pl.mo_ta} - ${pl.gia_tri}`)),
          new Paragraph(`Khóa đào tạo:`),
          ...daoTaoList.map(dt => new Paragraph(`${dt.ten_khoa_dao_tao} (${dt.ket_qua || "Chưa có kết quả"})`)),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `NhanSu_${nhanSu.ho_ten}.docx`);
    setShowModal(false);
  };

  if (!nhanSu) {
    return <div className="text-center mt-5">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="container my-5">
      <button onClick={() => navigate(-1)} className="btn btn-outline-primary mb-4">
        ← Quay lại
      </button>
      <Breadcrumb className="mt-3">
        <Breadcrumb.Item onClick={() => navigate("/")}>Trang chủ</Breadcrumb.Item>
        <Breadcrumb.Item onClick={() => navigate("/nhan-su")}>Quản lý nhân sự</Breadcrumb.Item>
        <Breadcrumb.Item active>Chi tiết nhân sự</Breadcrumb.Item>
      </Breadcrumb>

      <div className="card border-0 shadow-sm p-4" ref={printRef}>
        <div className="row">
          <div className="col-lg-3 text-center">
            <img
              src={nhanSu.avatar ? `http://127.0.0.1:5000/api/images/${nhanSu.avatar}` : "https://via.placeholder.com/120"}
              className="rounded-circle mb-3"
              alt="avatar"
              style={{ width: "120px", height: "120px", objectFit: "cover" }}
            />
            <h5>{nhanSu.ho_ten}</h5>
            <p className="text-muted">{chucVu} - {phongBan}</p>
          </div>

          <div className="col-lg-9">
            <h5>Thông tin chi tiết</h5>
            <div className="row">
              <div className="col-md-6">
                <p><FaUser /> Giới tính: {nhanSu.gioi_tinh}</p>
                <p><FaBirthdayCake /> Ngày sinh: {new Date(nhanSu.ngay_sinh).toLocaleDateString()}</p>
                <p><FaEnvelope /> Email: {nhanSu.email}</p>
                <p><FaGift /> Số ngày phép còn lại: {nhanSu.so_ngay_phep_con_lai} ngày</p>
              </div>
              <div className="col-md-6">
                <p><FaPhoneAlt /> SĐT: {nhanSu.so_dien_thoai}</p>
                <p><FaMapMarkerAlt /> Địa chỉ: {nhanSu.dia_chi}</p>
                <p><FaRegCheckCircle /> Trạng thái: {nhanSu.trang_thai}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <h6><FaGift /> Phúc lợi</h6>
          {phucLoiList.length > 0 ? (
            <ul className="list-group">
              {phucLoiList.map(item => (
                <li key={item.id} className="list-group-item">
                  <strong>{item.ten_phuc_loi}:</strong> {item.mo_ta} - {item.gia_tri}
                </li>
              ))}
            </ul>
          ) : <p>Chưa có phúc lợi.</p>}
        </div>

        <div className="mt-4">
          <h6><FaChalkboardTeacher /> Khóa đào tạo đã tham gia</h6>
          {daoTaoList.length > 0 ? (
            <ul className="list-group">
              {daoTaoList.map(item => (
                <li key={item.id} className="list-group-item">
                  <strong>{item.ten_khoa_dao_tao}</strong> (Bắt đầu: {new Date(item.ngay_bat_dau).toLocaleDateString()} - Kết thúc: {new Date(item.ngay_ket_thuc).toLocaleDateString()}, Kết quả: {item.ket_qua || "Chưa có"})
                </li>
              ))}
            </ul>
          ) : <p>Chưa tham gia khóa đào tạo nào.</p>}
        </div>

        <div className="d-flex justify-content-end mt-4">
          <Button variant="outline-primary" onClick={() => setShowModal(true)}>
            Xuất dữ liệu
          </Button>
        </div>

        <Modal show={showModal} onHide={() => setShowModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Xuất dữ liệu</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Button className="w-100 mb-2" onClick={exportToPDF} variant="outline-primary">
              Xuất PDF
            </Button>
            <Button className="w-100 mb-2" onClick={exportToExcel} variant="outline-success">
              Xuất Excel
            </Button>
            <Button className="w-100" onClick={exportToWord} variant="outline-danger">
              Xuất Word
            </Button>
          </Modal.Body>
        </Modal>
      </div>
    </div>
  );
};

export default NhanSuDetail;

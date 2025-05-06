import React, { useEffect, useState } from "react";
import axios from "axios";
import DanhGiaForm from "../../components/danhgia/DanhGiaForm";
import {
    Container, Row, Col, Button, Table, Modal, Breadcrumb,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";


const QuanLyDanhGia = () => {
    const [danhGias, setDanhGias] = useState([]);
    const [selectedDG, setSelectedDG] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [search, setSearch] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        fetchDanhGias();
    }, []);

    const fetchDanhGias = async () => {
        try {
            const res = await axios.get("http://127.0.0.1:5000/api/get-all-danh-gia");
            const data = Array.isArray(res.data) ? res.data : res.data.data || [];
            setDanhGias(data);
        } catch (error) {
            console.error("Lỗi khi tải đánh giá:", error);
        }
    };

    const handleCreate = () => {
        setSelectedDG(null);
        setShowModal(true);
    };

    const handleEdit = (dg) => {
        setSelectedDG(dg);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc muốn xóa đánh giá này không?")) {
            try {
                await axios.delete(`/danhgia/${id}`);
                fetchDanhGias();
            } catch (err) {
                console.error("Lỗi khi xóa đánh giá:", err);
            }
        }
    };

    const handleFormSubmit = async (data) => {
        try {
            if (selectedDG) {
                await axios.put(`/danhgia/${selectedDG.id}`, data);
            } else {
                await axios.post("/danhgia", data);
            }
            setShowModal(false);
            fetchDanhGias();
        } catch (err) {
            console.error("Lỗi khi lưu đánh giá:", err);
        }
    };

    const getRowClass = (dg) => {
        const avg = (dg.diem_ky_nang + dg.diem_thai_do + dg.diem_hieu_suat) / 3;
        if (avg >= 8.5) return "table-primary";
        if (avg >= 7) return "table-success";
        if (avg >= 5) return "table-warning";
        return "table-danger";
    };

    const filteredDanhGias = danhGias.filter((dg) =>
        dg.nhan_vien_id?.toString().toLowerCase().includes(search.toLowerCase())
    );

    const handleExportExcel = () => {
        const exportData = filteredDanhGias.map((dg) => ({
            ID: dg.id,
            "Nhân viên": dg.nhan_vien_id,
            "Người đánh giá": dg.nguoi_danh_gia_id,
            "Kỹ năng": dg.diem_ky_nang,
            "Thái độ": dg.diem_thai_do,
            "Hiệu suất": dg.diem_hieu_suat,
            "Điểm trung bình": ((dg.diem_ky_nang + dg.diem_thai_do + dg.diem_hieu_suat) / 3).toFixed(1),
            "Thời gian": dg.thoi_gian,
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "DanhGia");

        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
        saveAs(blob, "danhgia.xlsx");
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.text("Báo cáo đánh giá nhân sự", 14, 10);

        const tableData = filteredDanhGias.map((dg) => [
            dg.id,
            dg.nhan_vien_id,
            dg.nguoi_danh_gia_id,
            dg.diem_ky_nang,
            dg.diem_thai_do,
            dg.diem_hieu_suat,
            ((dg.diem_ky_nang + dg.diem_thai_do + dg.diem_hieu_suat) / 3).toFixed(1),
            dg.thoi_gian,
        ]);

        doc.autoTable({
            head: [["ID", "Nhân viên", "Người đánh giá", "Kỹ năng", "Thái độ", "Hiệu suất", "TB", "Thời gian"]],
            body: tableData,
            startY: 20,
        });

        doc.save("danhgia.pdf");
    };

    return (
        <Container fluid className="bg-light py-4 px-5">
            <Breadcrumb className="mt-3">
                <Breadcrumb.Item onClick={() => navigate("/")}>Trang chủ</Breadcrumb.Item>
                <Breadcrumb.Item active>Quản lý đánh giá</Breadcrumb.Item>
            </Breadcrumb>

            <Row className="mb-3">
                <Col><h2 className="text-center">Quản lý đánh giá nhân sự</h2></Col>
            </Row>

            <Row className="mb-3">
                <Col md={4}>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Tìm theo ID nhân viên..."
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </Col>
                <Col className="text-end">
                    <Button variant="outline-success" className="me-2" onClick={handleExportExcel}>Xuất Excel</Button>

                    <Button variant="outline-primary" onClick={handleCreate}>+ Thêm đánh giá</Button>
                </Col>
            </Row>

            <div className="shadow-sm p-4">
                <Table bordered hover className="bg-white shadow-sm">
                    <thead className="table-dark text-center">
                        <tr>
                            <th>ID</th>
                            <th>Nhân viên</th>
                            <th>Người đánh giá</th>
                            <th>Kỹ năng</th>
                            <th>Thái độ</th>
                            <th>Hiệu suất</th>
                            <th>Điểm TB</th>
                            <th>Ngày</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredDanhGias.map((dg) => (
                            <tr key={dg.id} className={`text-center ${getRowClass(dg)}`}>
                                <td>{dg.id}</td>
                                <td>{dg.nhan_vien.ho_ten}</td>
                                <td>{dg.nguoi_danh_gia.ho_ten}</td>
                                <td>{dg.diem_ky_nang}</td>
                                <td>{dg.diem_thai_do}</td>
                                <td>{dg.diem_hieu_suat}</td>
                                <td>{((dg.diem_ky_nang + dg.diem_thai_do + dg.diem_hieu_suat) / 3).toFixed(1)}</td>
                                <td>{dg.thoi_gian}</td>
                                <td>
                                    <Button variant="outline-warning" size="sm" onClick={() => handleEdit(dg)}>
                                        Sửa
                                    </Button>{" "}
                                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(dg.id)}>
                                        Xóa
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>

            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{selectedDG ? "Cập nhật đánh giá" : "Thêm đánh giá mới"}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <DanhGiaForm
                        initialData={selectedDG}
                        onSubmit={handleFormSubmit}
                        onClose={() => setShowModal(false)}
                    />
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default QuanLyDanhGia;

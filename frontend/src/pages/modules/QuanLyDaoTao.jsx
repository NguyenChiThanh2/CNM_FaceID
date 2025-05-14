import React, { useState, useEffect } from "react";
import axios from "axios";
import DaoTaoForm from "../../components/daotao/DaoTaoForm";
import { Modal, Button, Form, Breadcrumb } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { OverlayTrigger, Tooltip } from "react-bootstrap";

const QuanLyDaoTao = () => {
    const [daoTaoList, setDaoTaoList] = useState([]);
    const [searchKeyword, setSearchKeyword] = useState("");
    const [editingDaoTao, setEditingDaoTao] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedNhanVien, setSelectedNhanVien] = useState([]);
    const [showNhanVienModal, setShowNhanVienModal] = useState(false);
    const [showAddNhanVienModal, setShowAddNhanVienModal] = useState(false);
    const [selectedNhanVienIds, setSelectedNhanVienIds] = useState([]);
    const [nhanVienList, setNhanVienList] = useState([]);
    const [selectedDaoTaoId, setSelectedDaoTaoId] = useState(null);

    const navigate = useNavigate();
    const API_BASE = "http://localhost:5000";

    useEffect(() => {
        fetchDaoTao();
    }, []);

    const fetchDaoTao = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_BASE}/api/get-all-dao-tao`);
            setDaoTaoList(response.data);
        } catch (error) {
            console.error("Lỗi khi gọi API khóa đào tạo:", error);
            setError("Không thể tải danh sách khóa đào tạo.");
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingDaoTao(null);
        setShowModal(true);
    };

    const handleEdit = (daoTao) => {
        setEditingDaoTao(daoTao);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc muốn xóa khóa đào tạo này không?")) {
            try {
                await axios.delete(`${API_BASE}/api/delete-dao-tao/${id}`);
                fetchDaoTao();
                toast.success("Xóa thành công!");
            } catch (error) {
                console.error("Lỗi khi xóa khóa đào tạo:", error);
                toast.error("Xóa khóa đào tạo thất bại!");
            }
        }
    };

    const handleModalClose = () => {
        setShowModal(false);
        setEditingDaoTao(null);
    };

    const handleFormSubmit = () => {
        fetchDaoTao();
        toast.success(editingDaoTao ? "Cập nhật khóa đào tạo thành công!" : "Thêm khóa đào tạo thành công!");
        handleModalClose();
    };

    const handleViewNhanVien = async (daoTaoId) => {
        try {
            const response = await axios.get(`${API_BASE}/api/get-all-nhan-vien-by-dao-tao-id/${daoTaoId}`);
            setSelectedDaoTaoId(daoTaoId);
            setSelectedNhanVien(response.data);
        } catch (error) {
            console.error("Lỗi khi lấy danh sách nhân viên:", error);
            setSelectedNhanVien([]);
        } finally {
            setShowNhanVienModal(true);
        }
    };

    const handleDeleteNhanVienFromDaoTao = async (nhanVienId) => {
        if (!selectedDaoTaoId) return;

        if (window.confirm("Bạn có chắc muốn xóa nhân viên này khỏi khóa đào tạo?")) {
            try {
                await axios.post(`${API_BASE}/api/remove-nhan-vien-from-dao-tao`, {
                    dao_tao_id: selectedDaoTaoId,
                    nhan_vien_id: nhanVienId,
                });

                const response = await axios.get(`${API_BASE}/api/get-all-nhan-vien-by-dao-tao-id/${selectedDaoTaoId}`);
                setSelectedNhanVien(response.data);
                toast.success("Đã xóa nhân viên khỏi khóa đào tạo.");
            } catch (error) {
                console.error("Lỗi khi xóa nhân viên khỏi khóa đào tạo:", error);
                toast.error("Không thể xóa nhân viên.");
            }
        }
    };

    const handleShowAddNhanVienModal = async (daoTaoId) => {
        setSelectedDaoTaoId(daoTaoId);
        setShowAddNhanVienModal(true);

        try {
            const allNhanVienRes = await axios.get(`${API_BASE}/api/get-all-nhan-vien`);
            setNhanVienList(allNhanVienRes.data);

            const existedNhanVienRes = await axios.get(`${API_BASE}/api/get-all-nhan-vien-by-dao-tao-id/${daoTaoId}`);
            const existedNhanVienIds = existedNhanVienRes.data.map((nv) => nv.id);
            setSelectedNhanVienIds(existedNhanVienIds);
        } catch (err) {
            console.error("Lỗi khi tải dữ liệu nhân viên:", err);
        }
    };

    const handleSelectNhanVien = (e, id) => {
        const newSet = new Set(selectedNhanVienIds);
        if (e.target.checked) {
            newSet.add(id);
        } else {
            newSet.delete(id);
        }
        setSelectedNhanVienIds([...newSet]);
    };

    const handleAddNhanVienToDaoTao = async () => {
        try {
            await axios.post(`${API_BASE}/api/add-nhan-vien-to-dao-tao`, {
                dao_tao_id: selectedDaoTaoId,
                nhan_vien_ids: selectedNhanVienIds,
            });
            toast.success("Thêm nhân viên thành công!");
            setShowAddNhanVienModal(false);
            setSelectedNhanVienIds([]);
        } catch (err) {
            toast.error("Lỗi khi thêm nhân viên vào khóa đào tạo.");
            console.error(err);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    const filteredList = daoTaoList.filter((dt) =>
        dt.khoa_dao_tao.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        formatDate(dt.ngay_bat_dau).includes(searchKeyword) ||
        formatDate(dt.ngay_ket_thuc).includes(searchKeyword)
    );

    return (
        <div className="container min-vh-100">
            <div className="row">
                <div className="col-12 mt-5">
                    <Breadcrumb className="mt-3">
                        <Breadcrumb.Item onClick={() => navigate("/")}>Trang chủ</Breadcrumb.Item>
                        <Breadcrumb.Item active>Quản lý đào tạo</Breadcrumb.Item>
                    </Breadcrumb>
                    <Button variant="secondary" onClick={() => navigate("/")}>← Trang chủ</Button>

                    <h2 className="mb-4 text-center ">Quản lý khóa đào tạo</h2>

                    <Form.Control
                        type="text"
                        placeholder="Tìm theo tên khóa đào tạo hoặc ngày..."
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        className="mb-4"
                    />

                    {loading && (
                        <div className="text-center my-4">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Đang tải...</span>
                            </div>
                        </div>
                    )}

                    {error && <div className="alert alert-danger">{error}</div>}

                    <div className="mb-4 d-flex justify-content-end me-4">
                        <OverlayTrigger placement="top" overlay={<Tooltip>Thêm khóa đào tạo</Tooltip>}>
                            <Button variant="success" className="d-flex align-items-center gap-2 px-3 rounded-3" onClick={handleAdd}>
                                <i className="bi bi-plus-circle"></i> Thêm khóa đào tạo
                            </Button>
                        </OverlayTrigger>
                    </div>


                    <table className="table table-bordered table-hover w-100">
                        <thead className="table-dark text-center">
                            <tr>
                                <th>Tên Khóa Đào Tạo</th>
                                <th>Ngày Bắt Đầu</th>
                                <th>Ngày Kết Thúc</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredList.map((daoTao) => (
                                <tr key={daoTao.id}>
                                    <td>{daoTao.khoa_dao_tao}</td>
                                    <td>{formatDate(daoTao.ngay_bat_dau)}</td>
                                    <td>{formatDate(daoTao.ngay_ket_thuc)}</td>
                                    <td className="text-center">
                                        <OverlayTrigger placement="top" overlay={<Tooltip>Chỉnh sửa khóa đào tạo</Tooltip>}>
                                            <Button variant="outline-warning" className="me-2" size="sm" onClick={() => handleEdit(daoTao)}>
                                                Sửa
                                            </Button>
                                        </OverlayTrigger>

                                        <OverlayTrigger
                                            placement="top"
                                            overlay={<Tooltip>Xóa khóa đào tạo</Tooltip>}
                                        >
                                            <Button variant="outline-danger" size="sm" className="me-2" onClick={() => handleDelete(daoTao.id)}>
                                                Xóa
                                            </Button>
                                        </OverlayTrigger>

                                        <OverlayTrigger
                                            placement="top"
                                            overlay={<Tooltip>Xem danh sách nhân viên tham gia</Tooltip>}
                                        >
                                            <Button variant="outline-info" size="sm" className="me-2" onClick={() => handleViewNhanVien(daoTao.id)}>
                                                Xem nhân viên
                                            </Button>
                                        </OverlayTrigger>

                                        <OverlayTrigger
                                            placement="top"
                                            overlay={<Tooltip>Thêm nhân viên vào khóa đào tạo</Tooltip>}
                                        >
                                            <Button variant="outline-primary" size="sm" onClick={() => handleShowAddNhanVienModal(daoTao.id)}>
                                                Thêm nhân viên
                                            </Button>
                                        </OverlayTrigger>

                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Modal thêm/sửa đào tạo */}
                    <Modal show={showModal} onHide={handleModalClose} size="lg">
                        <Modal.Header closeButton>
                            <Modal.Title>{editingDaoTao ? "Chỉnh sửa khóa đào tạo" : "Thêm khóa đào tạo"}</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <DaoTaoForm
                                onAdded={handleFormSubmit}
                                editingDaoTao={editingDaoTao}
                                setEditingDaoTao={setEditingDaoTao}
                            />
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={handleModalClose}>Đóng</Button>
                        </Modal.Footer>
                    </Modal>

                    {/* Modal xem nhân viên */}
                    <Modal show={showNhanVienModal} onHide={() => setShowNhanVienModal(false)} size="lg">
                        <Modal.Header closeButton>
                            <Modal.Title>Danh sách nhân viên tham gia khóa đào tạo</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            {selectedNhanVien.length === 0 ? (
                                <p>Không có nhân viên nào tham gia khóa đào tạo này.</p>
                            ) : (
                                <table className="table table-bordered">
                                    <thead>
                                        <tr>
                                            <th>Họ tên</th>
                                            <th>Email</th>
                                            <th>Kết quả</th>
                                            <th>Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedNhanVien.map((nv) => (
                                            <tr key={nv.id}>
                                                <td>{nv.ho_ten}</td>
                                                <td>{nv.email}</td>
                                                <td>{nv.ket_qua}</td>
                                                <td>
                                                    <Button variant="danger" size="sm" onClick={() => handleDeleteNhanVienFromDaoTao(nv.id)}>
                                                        Xóa
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setShowNhanVienModal(false)}>Đóng</Button>
                        </Modal.Footer>
                    </Modal>

                    {/* Modal thêm nhân viên */}
                    <Modal show={showAddNhanVienModal} onHide={() => setShowAddNhanVienModal(false)} size="lg">
                        <Modal.Header closeButton>
                            <Modal.Title>Thêm nhân viên vào khóa đào tạo</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            {nhanVienList.length === 0 ? (
                                <p>Đang tải danh sách nhân viên...</p>
                            ) : (
                                <div>
                                    {nhanVienList.map((nv) => (
                                        <div key={nv.id} className="form-check">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                value={nv.id}
                                                checked={selectedNhanVienIds.includes(nv.id)}
                                                onChange={(e) => handleSelectNhanVien(e, nv.id)}
                                            />
                                            <label className="form-check-label">
                                                {nv.ho_ten} - {nv.email}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setShowAddNhanVienModal(false)}>Đóng</Button>
                            <Button variant="primary" onClick={handleAddNhanVienToDaoTao}>Xác nhận</Button>
                        </Modal.Footer>
                    </Modal>
                </div>
            </div>
            <ToastContainer position="top-right" autoClose={2000} />
        </div>
    );
};

export default QuanLyDaoTao;

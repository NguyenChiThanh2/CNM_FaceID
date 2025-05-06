// src/pages/NhanSuProfile.jsx
import React, { useState, useEffect } from 'react';
import { Tabs, Tab, Card, Button } from 'react-bootstrap';
import { getNhanVienById } from '../../services/api/nhan-vien-api';
import { getLuongByNhanVienId } from '../../services/api/luong-api';
import { getDaoTaoByNhanVienId } from '../../services/api/dao-tao-api';
import { getDanhGiaByNhanVienId } from '../../services/api/danh-gia-api';
import { getPhucLoiByNhanVienId } from '../../services/api/phuc-loi-api'

const NhanSuProfile = ({ nhanVienId }) => {
  const [nhanVien, setNhanVien] = useState(null);
  const [luong, setLuong] = useState([]);
  const [daoTao, setDaoTao] = useState([]);
  const [danhGia, setDanhGia] = useState([]);
  const [phucLoi, setPhucLoi] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const nv = await getNhanVienById(nhanVienId);
      const luongData = await getLuongByNhanVienId(nhanVienId);
      const daoTaoData = await getDaoTaoByNhanVienId(nhanVienId);
      const danhGiaData = await getDanhGiaByNhanVienId(nhanVienId);
      const phucLoiData = await getPhucLoiByNhanVienId(nhanVienId);
      
      setNhanVien(nv);
      setLuong(luongData);
      setDaoTao(daoTaoData);
      setDanhGia(danhGiaData);
      setPhucLoi(phucLoiData);
    };
    fetchData();
  }, [nhanVienId]);

  if (!nhanVien) return <p>Đang tải dữ liệu nhân viên...</p>;

  return (
    <Card className="p-4">
      <h2 className="mb-4">Trang cá nhân - {nhanVien.ho_ten}</h2>
      <Tabs defaultActiveKey="thongtin" className="mb-3">
        <Tab eventKey="thongtin" title="Thông tin">
          <p><strong>Email:</strong> {nhanVien.email}</p>
          <p><strong>Giới tính:</strong> {nhanVien.gioi_tinh}</p>
          <p><strong>Ngày sinh:</strong> {new Date(nhanVien.ngay_sinh).toLocaleDateString()}</p>
          <p><strong>Chức vụ:</strong> {nhanVien.chuc_vu_id}</p>
          <p><strong>Phòng ban:</strong> {nhanVien.phong_ban_id}</p>
        </Tab>
        <Tab eventKey="luong" title="Lương">
          {luong.map((l, i) => (
            <p key={i}><strong>Tháng {l.thang}:</strong> {l.tong_luong.toLocaleString()} VND</p>
          ))}
        </Tab>
        <Tab eventKey="daotao" title="Đào tạo">
          {daoTao.map((dt, i) => (
            <p key={i}><strong>{dt.khoa_dao_tao}</strong>: {new Date(dt.ngay_bat_dau).toLocaleDateString()} - {new Date(dt.ngay_ket_thuc).toLocaleDateString()}</p>
          ))}
        </Tab>
        <Tab eventKey="danhgia" title="Đánh giá">
          {danhGia.map((dg, i) => (
            <p key={i}><strong>Kỳ:</strong> {dg.ky_danh_gia} - <strong>Kết quả:</strong> {dg.ket_qua}</p>
          ))}
        </Tab>
        <Tab eventKey="phucloi" title="Phúc lợi">
          {phucLoi.map((pl, i) => (
            <p key={i}><strong>{pl.ten_phuc_loi}</strong>: {pl.mo_ta} - {pl.gia_tri.toLocaleString()} VND</p>
          ))}
        </Tab>
      </Tabs>
    </Card>
  );
};

export default NhanSuProfile;

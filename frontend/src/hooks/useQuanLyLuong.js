// hooks/useQuanLyLuong.js
import { useState, useEffect, useMemo } from 'react';
import axiosInstance from '../services/axiosInstance';
import { toast } from 'react-toastify';
import { getNhanVienInfo } from '../utils/auth';

const HR_DEPARTMENT_ID = 2;

export const useQuanLyLuong = () => {
  const [luongList, setLuongList] = useState([]);
  const [nhanVienList, setNhanVienList] = useState([]);
  const [phongBanList, setPhongBanList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedMonthNumber, setSelectedMonthNumber] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedPhongBan, setSelectedPhongBan] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [isTinhTatCa, setIsTinhTatCa] = useState(false);
  const [formData, setFormData] = useState({
    nhan_vien_id: "",
    thang: "",
    nam: "",
  });

  const itemsPerPage = 10;
  const currentUser = getNhanVienInfo();
  const isHR = currentUser?.phong_ban_id === HR_DEPARTMENT_ID;

  // Fetch data functions
  const fetchPhongBan = async () => {
    try {
      const res = await axiosInstance.get(`/get-all-phong-ban`);
      setPhongBanList(res.data);
    } catch (error) {
      // toast.error chỉ nhận (nội dung, ToastOptions) ở tham số 2 — truyền
      // thẳng object Error vào đó là sai chữ ký hàm, không có tác dụng gì.
      console.error("Lỗi khi tải danh sách phòng ban:", error);
      toast.error("Không thể tải danh sách phòng ban!");
    }
  };

  const fetchLuong = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/get-all-bang-luong`);
      setLuongList(response.data);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu lương:", error);
      toast.error("Không thể tải dữ liệu lương!");
    } finally {
      setLoading(false);
    }
  };

  const fetchNhanVien = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/get-all-nhan-vien`);
      setNhanVienList(response.data || []);
    } catch (error) {
      console.error("Lỗi khi tải danh sách nhân viên:", error);
      toast.error("Không thể tải danh sách nhân viên!");
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleDeleteLuong = async (luongId) => {
    if (!isHR) return;
    if (!window.confirm("Bạn có chắc chắn muốn xoá dòng lương này?")) return;
    
    setLoading(true);
    try {
      await axiosInstance.delete(`/delete-bangluong/${luongId}`);
      toast.success("Xoá lương thành công!");
      fetchLuong();
    } catch (error) {
      console.error("Lỗi khi xoá lương:", error);
      toast.error("Không thể xoá lương.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitLuong = async () => {
    const { nhan_vien_id, thang, nam } = formData;

    if (!thang || !nam) {
      toast.warning("Vui lòng điền đầy đủ tháng và năm.");
      return;
    }

    if (!isHR) {
      const nhanVienId = currentUser?.id;
      if (!nhanVienId) {
        toast.error("Không xác định được nhân viên hiện tại!");
        return;
      }
    }

    setLoading(true);
    try {
      if (isTinhTatCa && isHR) {
        const response = await axiosInstance.post(`/get-tinh-luong-tat-ca`, {
          thang: parseInt(thang),
          nam: parseInt(nam),
          phong_ban_id: selectedPhongBan ? parseInt(selectedPhongBan) : null,
        });
        
        const { data, errors } = response.data.data;
        if (errors && errors.length > 0) {
          errors.forEach((msg, i) =>
            toast.warning(msg, { autoClose: 2500, delay: i * 500 })
          );
        }
        if (data && data.length > 0) {
          toast.success("Đã tính lương cho tất cả nhân viên.");
        }
      } else {
        const nhanVienId = isHR ? parseInt(nhan_vien_id) : currentUser?.id;
        if (!nhanVienId) {
          toast.warning("Vui lòng chọn nhân viên.");
          return;
        }

        const response = await axiosInstance.post(`/get-tinh-luong-1nv`, {
          nhan_vien_id: nhanVienId,
          thang: parseInt(thang),
          nam: parseInt(nam),
        });

        if (response.data.success) {
          toast.success(response.data.message || "Tính lương thành công!");
        } else {
          toast.error(response.data.message || "Không thể tính lương!");
        }
      }
      
      setShowModal(false);
      fetchLuong();
    } catch (error) {
      // axiosInstance đã tự chuẩn hoá lỗi (xem normalizeError trong
      // services/axiosInstance.js), không còn error.response nữa.
      toast.error(error.message || "Lỗi hệ thống!");
    } finally {
      setLoading(false);
    }
  };

  // Computed values
  const nhanVienMap = useMemo(() => {
    return nhanVienList.reduce((acc, nv) => {
      acc[nv.id] = (nv.ho_ten || "").toLowerCase();
      return acc;
    }, {});
  }, [nhanVienList]);

  const filteredList = useMemo(() => {
    return luongList
      .filter((luong) => {
        if (!isHR && currentUser?.id && luong.nhan_vien_id !== currentUser.id) {
          return false;
        }
        const hoTen = nhanVienMap[luong.nhan_vien_id] || "";
        const searchMatch = hoTen.includes((searchKeyword || "").toLowerCase());
        const monthMatch =
          selectedMonthNumber && selectedYear
            ? luong.thang === parseInt(selectedMonthNumber) &&
              luong.nam === parseInt(selectedYear)
            : true;

        return searchMatch && monthMatch;
      })
      .sort((a, b) => b.id - a.id);
  }, [luongList, isHR, currentUser?.id, nhanVienMap, searchKeyword, selectedMonthNumber, selectedYear]);

  const totalPages = Math.ceil(filteredList.length / itemsPerPage);
  const paginatedList = filteredList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Effects
  useEffect(() => {
    fetchLuong();
    fetchNhanVien();
    fetchPhongBan();
  }, []);

  useEffect(() => {
    if (!showModal) {
      const today = new Date();
      setFormData({
        nhan_vien_id: isHR ? "" : currentUser?.id || "",
        thang: today.getMonth() + 1,
        nam: today.getFullYear(),
      });
      setIsTinhTatCa(false);
    }
  }, [showModal, isHR, currentUser?.id]);

  return {
    // State
    luongList, // THÊM DÒNG NÀY
    paginatedList,
    nhanVienList,
    phongBanList,
    loading,
    searchKeyword,
    selectedMonthNumber,
    selectedYear,
    selectedPhongBan,
    currentPage,
    totalPages,
    showModal,
    isTinhTatCa,
    formData,
    isHR,
    
    // Setters
    setSearchKeyword,
    setSelectedMonthNumber,
    setSelectedYear,
    setSelectedPhongBan,
    setCurrentPage,
    setShowModal,
    setIsTinhTatCa,
    setFormData,
    
    // Handlers
    handleDeleteLuong,
    handleSubmitLuong,
  };
};
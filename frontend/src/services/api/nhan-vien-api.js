
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api"; 

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});

// 1. Lấy tất cả nhân viên
export const getAllNhanVien = async () => {
  try {
    const res = await api.get("/get-all-nhan-vien");
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách nhân viên:", error);
    throw error.response?.data || { message: "Không thể lấy danh sách nhân viên" };
  }
};

// 2. Lấy nhân viên theo ID
export const getNhanVienById = async (id) => {
  try {
    const res = await api.get(`/get-nhan-vien-by-id/${id}`);
    return res.data;
  } catch (error) {
    console.error(`❌ Lỗi khi lấy nhân viên ID ${id}:`, error);
    throw error.response?.data || { message: `Không tìm thấy nhân viên ID ${id}` };
  }
};

// 3. Tạo mới nhân viên
export const createNhanVien = async (data) => {
  try {
    // Tạo FormData để gửi dữ liệu và file
    const formData = new FormData();
    for (const key in data) {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    }
    console.log("📤 Dữ liệu gửi đi:", Object.fromEntries(formData)); // Debug
    
    const res = await api.post("/add-nhan-vien", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi khi tạo nhân viên:", error);
    const errorMessage = error.response?.data?.message || "Lỗi khi tạo nhân viên";
    throw { message: errorMessage, status: error.response?.status };
  }
};

// 4. Cập nhật nhân viên
export const updateNhanVien = async (id, data) => {
  try {
    // Tạo FormData để gửi dữ liệu và file
    const formData = new FormData();
    for (const key in data) {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    }

    // Debug: Log từng cặp key-value của FormData
    console.log("📤 Dữ liệu cập nhật gửi đi:");
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }

    const res = await api.put(`/edit-nhan-vien/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  } catch (error) {
    console.error(`❌ Lỗi khi cập nhật nhân viên ID ${id}:`, error);
    const errorMessage = error.response?.data?.message || "Lỗi khi cập nhật nhân viên";
    throw { message: errorMessage, status: error.response?.status };
  }
};

// 5. Xóa nhân viên
export const deleteNhanVien = async (id) => {
  try {
    const res = await api.delete(`/delete-nhan-vien/${id}`);
    return res.data;
  } catch (error) {
    console.error(`❌ Lỗi khi xóa nhân viên ID ${id}:`, error);
    throw error.response?.data || { message: `Không thể xóa nhân viên ID ${id}` };
  }
};

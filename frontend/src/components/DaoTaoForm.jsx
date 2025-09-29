// import React, { useState, useEffect } from "react";
// import { useNavigate, useParams } from "react-router-dom";

// // ⬇️ Dùng service thay cho axios
// import { getAllNhanVien } from "../../services/api/nhan-su.api";
// import {
//   getDaoTaoById,
//   createDaoTao,
//   updateDaoTao,
//   assignNhanVienToDaoTao,
// } from "../../services/api/dao-tao.api";

// const DaoTaoForm = () => {
//   const [formData, setFormData] = useState({
//     khoa_dao_tao: "",
//     ngay_bat_dau: "",
//     ngay_ket_thuc: "",
//   });
//   const [nhanVienList, setNhanVienList] = useState([]);
//   const [selectedNhanViens, setSelectedNhanViens] = useState([]);
//   const [searchKeyword, setSearchKeyword] = useState("");

//   const navigate = useNavigate();
//   const { id } = useParams();

//   useEffect(() => {
//     (async () => {
//       try {
//         // Lấy danh sách nhân viên
//         const nv = await getAllNhanVien();
//         setNhanVienList(Array.isArray(nv) ? nv : []);
//       } catch (e) {
//         console.error("❌ Lỗi khi lấy danh sách nhân viên:", e);
//       }

//       // Nếu đang chỉnh sửa
//       if (id && id !== "create") {
//         try {
//           const daoTaoData = await getDaoTaoById(id);
//           setFormData({
//             khoa_dao_tao: daoTaoData.khoa_dao_tao || "",
//             ngay_bat_dau: (daoTaoData.ngay_bat_dau || "").slice(0, 10),
//             ngay_ket_thuc: (daoTaoData.ngay_ket_thuc || "").slice(0, 10),
//           });
//           if (Array.isArray(daoTaoData.nhan_viens)) {
//             setSelectedNhanViens(
//               daoTaoData.nhan_viens.map((nv) => Number(nv.id))
//             );
//           }
//         } catch (e) {
//           console.error("❌ Lỗi khi tải chi tiết khóa đào tạo:", e);
//         }
//       }
//     })();
//   }, [id]);

//   const handleChange = (e) => {
//     setFormData((s) => ({ ...s, [e.target.name]: e.target.value }));
//   };

//   const handleSelectNhanVien = (nhanVienId) => {
//     const idNum = Number(nhanVienId);
//     setSelectedNhanViens((prev) =>
//       prev.includes(idNum)
//         ? prev.filter((x) => x !== idNum)
//         : [...prev, idNum]
//     );
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     try {
//       let daoTaoId = id;

//       if (id && id !== "create") {
//         const res = await updateDaoTao(id, formData);
//         daoTaoId = res?.id || id;
//       } else {
//         const res = await createDaoTao(formData);
//         daoTaoId = res?.id;
//       }

//       // Gán nhân viên
//       if (daoTaoId && Array.isArray(selectedNhanViens)) {
//         await Promise.all(
//           selectedNhanViens.map((nhanVienId) =>
//             assignNhanVienToDaoTao(daoTaoId, nhanVienId)
//           )
//         );
//       }

//       navigate("/dao-tao");
//     } catch (error) {
//       console.error("❌ Lỗi khi thêm/sửa khóa đào tạo:", error);
//     }
//   };

//   const filteredNhanVienList = nhanVienList.filter((nv) =>
//     (nv.ho_ten || "")
//       .toLowerCase()
//       .includes((searchKeyword || "").toLowerCase())
//   );

//   return (
//     <form onSubmit={handleSubmit}>
//       {/* Thông tin khóa học */}
//       <div className="mb-3">
//         <label className="form-label">Khóa đào tạo</label>
//         <input
//           type="text"
//           className="form-control"
//           name="khoa_dao_tao"
//           value={formData.khoa_dao_tao}
//           onChange={handleChange}
//           required
//         />
//       </div>

//       <div className="mb-3">
//         <label className="form-label">Ngày bắt đầu</label>
//         <input
//           type="date"
//           className="form-control"
//           name="ngay_bat_dau"
//           value={formData.ngay_bat_dau}
//           onChange={handleChange}
//           required
//         />
//       </div>

//       <div className="mb-3">
//         <label className="form-label">Ngày kết thúc</label>
//         <input
//           type="date"
//           className="form-control"
//           name="ngay_ket_thuc"
//           value={formData.ngay_ket_thuc}
//           onChange={handleChange}
//           required
//         />
//       </div>

//       {/* Chọn nhân viên */}
//       <div className="mb-3">
//         <label className="form-label fw-bold">Chọn nhân viên</label>

//         <input
//           type="text"
//           className="form-control mb-3"
//           placeholder="🔍 Tìm kiếm nhân viên..."
//           value={searchKeyword}
//           onChange={(e) => setSearchKeyword(e.target.value)}
//         />

//         {/* Thanh công cụ */}
//         <div className="d-flex justify-content-between align-items-center mb-2 small text-muted">
//           <span>
//             Hiển thị {filteredNhanVienList.length}/{nhanVienList.length}
//           </span>
//           <div className="d-flex gap-2">
//             <button
//               type="button"
//               className="btn btn-sm btn-outline-primary"
//               onClick={() =>
//                 setSelectedNhanViens(filteredNhanVienList.map((nv) => Number(nv.id)))
//               }
//             >
//               ✅ Chọn tất cả
//             </button>
//             <button
//               type="button"
//               className="btn btn-sm btn-outline-danger"
//               onClick={() => setSelectedNhanViens([])}
//             >
//               ❌ Bỏ chọn
//             </button>
//           </div>
//         </div>

//         {/* Danh sách nhân viên có cuộn */}
//         <div
//           className="border rounded p-2 shadow-sm"
//           style={{
//             maxHeight: "320px",
//             overflowY: "auto",
//             backgroundColor: "#fafafa",
//           }}
//         >
//           {filteredNhanVienList.length > 0 ? (
//             filteredNhanVienList.map((nv, index) => (
//               <div
//                 key={nv.id}
//                 className={`form-check py-1 ${index % 2 === 0 ? "bg-light" : ""}`}
//               >
//                 <input
//                   type="checkbox"
//                   className="form-check-input"
//                   id={`nv-${nv.id}`}
//                   checked={selectedNhanViens.includes(Number(nv.id))}
//                   onChange={() => handleSelectNhanVien(nv.id)}
//                 />
//                 <label
//                   className="form-check-label"
//                   htmlFor={`nv-${nv.id}`}
//                   style={{ cursor: "pointer" }}
//                 >
//                   {nv.ho_ten}
//                 </label>
//               </div>
//             ))
//           ) : (
//             <p className="text-center text-muted my-2">
//               Không tìm thấy nhân viên nào.
//             </p>
//           )}
//         </div>
//       </div>

//       {/* Nút submit */}
//       <button type="submit" className="btn btn-primary">
//         {id && id !== "create" ? "Cập nhật" : "Thêm mới"}
//       </button>
//     </form>
//   );
// };

// export default DaoTaoForm;

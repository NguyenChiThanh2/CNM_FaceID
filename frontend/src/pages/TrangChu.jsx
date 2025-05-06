import React from "react";
import { useNavigate } from "react-router-dom";

const TrangChu = () => {
  const navigate = useNavigate();

  const modules = [
    { title: "Quản lý nhân sự", icon: "👤", path: "/nhan-su", color: "#007bff" },
    { title: "Quản lý chấm công", icon: "📷", path: "/quan-ly-cham-cong", color: "#17a2b8" },
    { title: "Nghỉ phép", icon: "📆", path: "/nghi-phep", color: "#ffc107" },
    { title: "Tính lương", icon: "💰", path: "/tinh-luong", color: "#28a745" },
    { title: "Phúc lợi", icon: "🎁", path: "/phuc-loi", color: "#6610f2" },
    { title: "Đào tạo", icon: "📚", path: "/dao-tao", color: "#fd7e14" },
    { title: "Đánh giá", icon: "📈", path: "/danh-gia", color: "#20c997" },
    { title: "Phòng ban", icon: "🏢", path: "/phong-ban", color: "#6c757d" },
     //  { title: "Tuyển dụng", icon: "📝", path: "/tuyen-dung" }, 
     // // { title: "Chấm công khuôn mặt", icon: "📷", path: "/cham-cong-nhan-vien" },
  ];

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <header className="text-center py-4 bg-white shadow-sm border-bottom">
        <h1 className="display-5 fw-bold text-primary mb-1">
          🏢 Hệ thống Quản lý Nhân sự
        </h1>
        <p className="text-muted">Dashboard quản trị nhân sự doanh nghiệp</p>
      </header>

      <main className="flex-grow-1 py-5">
        <section className="container">
          <h2 className="mb-5 fw-semibold text-center text-dark">
            Các phân hệ chính
          </h2>
          <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4 justify-content-center">
            {modules.map((module, index) => (
              <div className="col" key={index}>
                <div
                  className="card h-100 text-center shadow-sm border-0 rounded-4 p-3 hover-shadow"
                  style={{
                    cursor: "pointer",
                    transition: "transform 0.2s",
                  }}
                  onClick={() => navigate(module.path)}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-5px)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                >
                  <div className="card-body d-flex flex-column justify-content-center align-items-center">
                    <div
                      className="icon mb-3"
                      style={{
                        fontSize: "3rem",
                        color: module.color,
                      }}
                    >
                      {module.icon}
                    </div>
                    <h5 className="fw-bold text-dark">{module.title}</h5>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default TrangChu;

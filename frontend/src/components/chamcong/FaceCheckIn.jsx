import React, { useEffect, useRef, useState } from "react";

export default function FaceCheckin() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("success"); // "success" | "danger" | "warning"
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        showModal("❌ Không thể truy cập camera", "danger");
      }
    }
    startCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  function showModal(message, type = "success") {
    setModalMessage(message);
    setModalType(type);
    setModalOpen(true);
  }

  function handleOk() {
    setModalOpen(false);
    if (modalType === "success") {
      // Nếu bạn muốn reload trang mới lấy dữ liệu mới, giữ, nếu không thì bỏ
      // window.location.reload();
    }
  }

  async function takePicture() {
    if (loading) return; // tránh click nhiều lần
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;

    // Kiểm tra video kích thước
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      showModal("❌ Camera chưa sẵn sàng, vui lòng thử lại sau.", "danger");
      return;
    }

    setLoading(true);

    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const gray = [];
    for (let i = 0; i < imageData.data.length; i += 4) {
      gray.push(
        0.299 * imageData.data[i] +
        0.587 * imageData.data[i + 1] +
        0.114 * imageData.data[i + 2]
      );
    }

    const w = canvas.width;
    const h = canvas.height;
    const laplacian = [];

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x;
        const lap =
          -gray[idx - w] -
          gray[idx - 1] +
          4 * gray[idx] -
          gray[idx + 1] -
          gray[idx + w];
        laplacian.push(lap);
      }
    }

    const mean = laplacian.reduce((a, b) => a + b, 0) / laplacian.length;
    const variance =
      laplacian.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / laplacian.length;

    if (variance < 20) {
      showModal("⚠️ Ảnh quá mờ! Vui lòng thử lại.", "warning");
      setLoading(false);
      return;
    }

    const dataURL = canvas.toDataURL("image/jpeg");

    try {
      const response = await fetch("http://127.0.0.1:5000/api/face-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_base64: dataURL }),
      });

      const text = await response.text();

      let result;
      try {
        result = JSON.parse(text);
      } catch {
        showModal("❌ Server trả về dữ liệu không hợp lệ.", "danger");
        setLoading(false);
        return;
      }

      if (response.ok) {
        const { message, name, time } = result;
        showModal(
          `✅ ${message} <strong style="font-weight: 900;">${name}</strong><br/>
           <small>Thời gian: <strong style="font-weight: 900;">${time}</strong></small>`,
          "success"
        );
      } else {
        const namePart = result.name
          ? ` <strong style="font-weight: 900;">${result.name}</strong>`
          : "";
        showModal(`❌ ${result.message || "Lỗi không xác định"}${namePart}`, "danger");
      }
    } catch (error) {
      showModal("❌ Lỗi kết nối đến server.", "danger");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="container py-5 text-center"
      style={{
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        backgroundColor: "#f8f9fa",
      }}
    >
      <h2 className="mb-4" style={{ fontWeight: 600, color: "#343a40" }}>
        Chấm công bằng FaceID
      </h2>

      <div className="d-flex flex-column align-items-center">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{
            width: "100%",
            maxWidth: 500,
            borderRadius: 12,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            border: "2px solid #dee2e6",
            backgroundColor: "#fff",
            height: "auto",
          }}
        />
        <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
        <div
          id="countdown"
          style={{ fontSize: "2.5rem", color: "#00378a", fontWeight: "bold", marginTop: 12 }}
        ></div>
        <h5 className="text-muted mt-2">
          💡 Giữ khuôn mặt rõ nét, ánh sáng đủ và nhìn thẳng vào camera
        </h5>

        <div className="btn-group mt-3 gap-2">
          <button
            type="button"
            className="btn btn-success"
            style={{ minWidth: 130, fontWeight: 500, fontSize: "1rem", transition: "0.2s ease" }}
            onClick={takePicture}
            disabled={loading}
          >
            {loading ? "Đang xử lý..." : "Chấm công"}
          </button>
        </div>
      </div>

      {modalOpen && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Thông báo</h5>
              </div>
              <div className="modal-body" dangerouslySetInnerHTML={{ __html: modalMessage }} />
              <div className="modal-footer">
                <button className="btn btn-primary" onClick={handleOk}>
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

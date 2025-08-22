// import React, { useEffect, useRef, useState } from "react";

// export default function FaceCheckin() {
//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);

//   const [modalOpen, setModalOpen] = useState(false);
//   const [modalMessage, setModalMessage] = useState("");
//   const [modalType, setModalType] = useState("success"); // "success" | "danger" | "warning"
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     async function startCamera() {
//       try {
//         const stream = await navigator.mediaDevices.getUserMedia({ video: true });
//         if (videoRef.current) {
//           videoRef.current.srcObject = stream;
//         }
//       } catch (err) {
//         showModal("❌ Không thể truy cập camera", "danger");
//       }
//     }
//     startCamera();

//     return () => {
//       if (videoRef.current && videoRef.current.srcObject) {
//         videoRef.current.srcObject.getTracks().forEach(track => track.stop());
//       }
//     };
//   }, []);

//   function showModal(message, type = "success") {
//     setModalMessage(message);
//     setModalType(type);
//     setModalOpen(true);
//   }

//   function handleOk() {
//     setModalOpen(false);
//     if (modalType === "success") {
//       // Nếu bạn muốn reload trang mới lấy dữ liệu mới, giữ, nếu không thì bỏ
//       // window.location.reload();
//     }
//   }

//   async function takePicture() {
//     if (loading) return; // tránh click nhiều lần
//     if (!videoRef.current || !canvasRef.current) return;

//     const video = videoRef.current;

//     // Kiểm tra video kích thước
//     if (video.videoWidth === 0 || video.videoHeight === 0) {
//       showModal("❌ Camera chưa sẵn sàng, vui lòng thử lại sau.", "danger");
//       return;
//     }

//     setLoading(true);

//     const canvas = canvasRef.current;
//     canvas.width = video.videoWidth;
//     canvas.height = video.videoHeight;

//     const ctx = canvas.getContext("2d");
//     ctx.drawImage(video, 0, 0);

//     const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
//     const gray = [];
//     for (let i = 0; i < imageData.data.length; i += 4) {
//       gray.push(
//         0.299 * imageData.data[i] +
//         0.587 * imageData.data[i + 1] +
//         0.114 * imageData.data[i + 2]
//       );
//     }

//     const w = canvas.width;
//     const h = canvas.height;
//     const laplacian = [];

//     for (let y = 1; y < h - 1; y++) {
//       for (let x = 1; x < w - 1; x++) {
//         const idx = y * w + x;
//         const lap =
//           -gray[idx - w] -
//           gray[idx - 1] +
//           4 * gray[idx] -
//           gray[idx + 1] -
//           gray[idx + w];
//         laplacian.push(lap);
//       }
//     }

//     const mean = laplacian.reduce((a, b) => a + b, 0) / laplacian.length;
//     const variance =
//       laplacian.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / laplacian.length;

//     if (variance < 20) {
//       showModal("⚠️ Ảnh quá mờ! Vui lòng thử lại.", "warning");
//       setLoading(false);
//       return;
//     }

//     const dataURL = canvas.toDataURL("image/jpeg");

//     try {
//       const response = await fetch("http://127.0.0.1:5000/api/face-checkin", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ image_base64: dataURL }),
//       });

//       const text = await response.text();

//       let result;
//       try {
//         result = JSON.parse(text);
//       } catch {
//         showModal("❌ Server trả về dữ liệu không hợp lệ.", "danger");
//         setLoading(false);
//         return;
//       }

//       if (response.ok) {
//         const { message, name, time } = result;
//         showModal(
//           `✅ ${message} <strong style="font-weight: 900;">${name}</strong><br/>
//            <small>Thời gian: <strong style="font-weight: 900;">${time}</strong></small>`,
//           "success"
//         );
//       } else {
//         const namePart = result.name
//           ? ` <strong style="font-weight: 900;">${result.name}</strong>`
//           : "";
//         showModal(`❌ ${result.message || "Lỗi không xác định"}${namePart}`, "danger");
//       }
//     } catch (error) {
//       showModal("❌ Lỗi kết nối đến server.", "danger");
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <div
//       className="container py-5 text-center"
//       style={{
//         fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
//         backgroundColor: "#f8f9fa",
//       }}
//     >
//       <h2 className="mb-4" style={{ fontWeight: 600, color: "#343a40" }}>
//         Chấm công bằng FaceID
//       </h2>

//       <div className="d-flex flex-column align-items-center">
//         <video
//           ref={videoRef}
//           autoPlay
//           muted
//           playsInline
//           style={{
//             width: "100%",
//             maxWidth: 500,
//             borderRadius: 12,
//             boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
//             border: "2px solid #dee2e6",
//             backgroundColor: "#fff",
//             height: "auto",
//           }}
//         />
//         <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
//         <div
//           id="countdown"
//           style={{ fontSize: "2.5rem", color: "#00378a", fontWeight: "bold", marginTop: 12 }}
//         ></div>
//         <h5 className="text-muted mt-2">
//           💡 Giữ khuôn mặt rõ nét, ánh sáng đủ và nhìn thẳng vào camera
//         </h5>

//         <div className="btn-group mt-3 gap-2">
//           <button
//             type="button"
//             className="btn btn-success"
//             style={{ minWidth: 130, fontWeight: 500, fontSize: "1rem", transition: "0.2s ease" }}
//             onClick={takePicture}
//             disabled={loading}
//           >
//             {loading ? "Đang xử lý..." : "Chấm công"}
//           </button>
//         </div>
//       </div>

//       {modalOpen && (
//         <div
//           className="modal show d-block"
//           tabIndex="-1"
//           role="dialog"
//           style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
//         >
//           <div className="modal-dialog modal-dialog-centered" role="document">
//             <div className="modal-content">
//               <div className="modal-header">
//                 <h5 className="modal-title">Thông báo</h5>
//               </div>
//               <div className="modal-body" dangerouslySetInnerHTML={{ __html: modalMessage }} />
//               <div className="modal-footer">
//                 <button className="btn btn-primary" onClick={handleOk}>
//                   OK
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
import React, { useEffect, useRef, useState } from "react";
import { FaceDetection } from "@mediapipe/face_detection";
import { Camera } from "@mediapipe/camera_utils";

export default function FaceCheckin() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("success");
  const [loading, setLoading] = useState(false);

  // Pause/Resume quét
  const [allowScan, setAllowScan] = useState(true);
  const allowScanRef = useRef(true);
  useEffect(() => {
    allowScanRef.current = allowScan;
  }, [allowScan]);

  // Đếm 2s
  const holdTimeRequired = 4; // giây
  const faceDetectedAtRef = useRef(null);
  const [countdown, setCountdown] = useState(null);

  const cameraInstanceRef = useRef(null);
  const detectorRef = useRef(null);

  // Khởi tạo FaceDetection + Camera loop
  useEffect(() => {
    let stopped = false;

    const init = async () => {
      try {
        // Khởi tạo detector
        const detector = new FaceDetection({
          locateFile: (file) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
        });
        detector.setOptions({
          model: "short",
          minDetectionConfidence: 0.5,
        });
        detectorRef.current = detector;

        detector.onResults((results) => {
          if (stopped) return;
          if (!allowScanRef.current || loading) return;

          const hasFace =
            results.detections && results.detections.length > 0;

          if (hasFace) {
            if (!faceDetectedAtRef.current) {
              faceDetectedAtRef.current = Date.now();
              setCountdown(holdTimeRequired);
            } else {
              const elapsed = (Date.now() - faceDetectedAtRef.current) / 1000;
              const remain = Math.max(
                0,
                Math.ceil(holdTimeRequired - elapsed)
              );
              setCountdown(remain);

              if (elapsed >= holdTimeRequired) {
                // Đủ 2s: tạm dừng quét & chụp
                faceDetectedAtRef.current = null;
                setCountdown(null);
                setAllowScan(false); // PAUSE quét
                takePicture(); // sẽ mở modal
              }
            }
          } else {
            // Mất mặt: reset
            faceDetectedAtRef.current = null;
            setCountdown(null);
          }
        });

        // Khởi tạo Camera utils
        if (!videoRef.current) return;
        const cam = new Camera(videoRef.current, {
          onFrame: async () => {
            // Gate: khi pause hoặc đang loading thì bỏ qua việc gửi frame
            if (!allowScanRef.current || loading) return;
            try {
              await detector.send({ image: videoRef.current });
            } catch (e) {
              // tránh crash nếu có frame lỗi lẻ tẻ
            }
          },
          width: 640,
          height: 480,
        });

        cameraInstanceRef.current = cam;
        await cam.start(); // tự xin quyền camera + chạy loop
      } catch (e) {
        showModal("❌ Không thể truy cập camera hoặc khởi tạo phát hiện.", "danger");
      }
    };

    init();

    // Cleanup
    return () => {
      stopped = true;
      if (cameraInstanceRef.current) {
        // Camera utils không có stop() chính thức; dừng tracks thay thế
        const v = videoRef.current;
        if (v?.srcObject) {
          v.srcObject.getTracks().forEach((t) => t.stop());
        }
      }
    };
  }, [loading]);

  function showModal(message, type = "success") {
    setModalMessage(message);
    setModalType(type);
    setModalOpen(true);
  }

  function handleOk() {
    setModalOpen(false);
    // Cho phép quét lại sau khi đóng modal
    setAllowScan(true);
  }

  async function takePicture() {
    if (loading) return;
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      showModal("❌ Camera chưa sẵn sàng, vui lòng thử lại.", "danger");
      return;
    }

    setLoading(true);

    // Chụp frame hiện tại
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    // (Tuỳ chọn) kiểm tra độ mờ bằng Laplacian variance như code trước
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const gray = [];
    for (let i = 0; i < imageData.data.length; i += 4) {
      gray.push(
        0.299 * imageData.data[i] +
          0.587 * imageData.data[i + 1] +
          0.114 * imageData.data[i + 2]
      );
    }
    const w = canvas.width,
      h = canvas.height;
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
    const mean =
      laplacian.reduce((a, b) => a + b, 0) / laplacian.length || 0;
    const variance =
      laplacian.reduce((a, b) => a + Math.pow(b - mean, 2), 0) /
        (laplacian.length || 1);

    if (variance < 20) {
      showModal(
        "⚠️ Ảnh quá mờ! Vui lòng giữ chắc và thử lại.",
        "warning"
      );
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
        showModal(
          `❌ ${result.message || "Lỗi không xác định"}${namePart}`,
          "danger"
        );
      }
    } catch {
      showModal("❌ Lỗi kết nối đến server.", "danger");
    } finally {
      setLoading(false);
      // Lưu ý: KHÔNG bật quét lại ở đây. Chờ user bấm OK (handleOk).
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
          style={{
            fontSize: "2.2rem",
            color: "#00378a",
            fontWeight: "bold",
            marginTop: 12,
            minHeight: 40,
          }}
        >
          {countdown !== null ? `Giữ nguyên ${countdown}s...` : ""}
        </div>

        <h5 className="text-muted mt-2">
          💡 Giữ khuôn mặt rõ nét, ánh sáng đủ và nhìn thẳng vào camera
        </h5>
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
              <div
                className="modal-body"
                dangerouslySetInnerHTML={{ __html: modalMessage }}
              />
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


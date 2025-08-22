// src/pages/ChamCong.jsx
import React, { useRef, useState } from "react";
import Webcam from "react-webcam";

const ChamCong = () => {
  const webcamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const captureAndSend = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    setCapturedImage(imageSrc);
    setLoading(true);

    // Đảm bảo URL đúng với backend
    fetch("http://localhost:5000/cham-cong-khuon-mat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageSrc }), // Gửi ảnh dưới dạng base64
    })
      .then(response => response.json())
      .then(data => {
        console.log("Kết quả nhận diện:", data);
        setResult(data);
      })
      .catch(error => {
        console.error("Lỗi:", error);
        setResult({ message: "Lỗi kết nối server" });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="container py-5">
      <h2 className="text-center mb-5 fw-bold text-primary">Chấm công bằng khuôn mặt 📸</h2>

      <div className="d-flex flex-column align-items-center">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          className="rounded-4 shadow"
          width={360}
          height={270}
        />

        <button
          className="btn btn-success mt-4 px-4 py-2 fw-bold"
          onClick={captureAndSend}
          disabled={loading}
        >
          {loading ? "Đang nhận diện..." : "Chụp & Nhận diện"}
        </button>

        {capturedImage && (
          <div className="mt-5 text-center">
            <h5 className="mb-3 text-secondary">Ảnh đã chụp:</h5>
            <img src={capturedImage} alt="Captured" className="rounded-4 shadow" width="320" />
          </div>
        )}

        {result && (
          <div className="mt-5 text-center">
            <h5 className="text-success mb-3">Kết quả nhận diện:</h5>
            {result.name ? (
              <>
                <h4 className="fw-bold text-dark">{result.name}</h4>
                {result.image && (
                  <img src={result.image} alt="Result" width="200" className="rounded-4 mt-3 shadow" />
                )}
              </>
            ) : (
              <div className="alert alert-danger">
                {result.message || "Không nhận diện được khuôn mặt"}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChamCong;

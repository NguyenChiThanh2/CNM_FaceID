import React, { useRef, useState, useEffect } from 'react';

const FaceCheckIn = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [previewSrc, setPreviewSrc] = useState(null);
  const fileInputRef = useRef();

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(err => {
        console.error('Không thể mở webcam:', err);
      });
  }, []);

  const capture = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const video = videoRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataURL = canvas.toDataURL('image/jpeg');
    setPreviewSrc(dataURL);
  };

  const handleUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewSrc(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const sendImage = () => {
    if (!previewSrc) return alert("❗ Chưa có ảnh để gửi");
  
    const base64Image = previewSrc.split(',')[1];
  
    fetch('http://127.0.0.1:5000/api/cham-cong-face', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_base64: base64Image })
    })
      .then(res => {
        if (!res.ok) throw new Error(`Lỗi server: ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data.message) {
          alert("✅ " + data.message);
        }
        if (data.cham_cong) {
          alert(`✅ ${data.cham_cong.nhan_vien.ten || 'Nhân viên'} đã được chấm công lúc ${data.cham_cong.thoi_gian_vao || data.cham_cong.thoi_gian_ra}`);
        }
      })
      .catch(err => {
        console.error('❌ Gửi lỗi:', err);
        alert("❌ Lỗi gửi ảnh: " + err.message);
      });
  };
  
  return (
    <div className="container mt-4">
      <h2 className="mb-4">Chấm Công Nhận Diện Khuôn Mặt</h2>

      <div className="mb-3">
        <video ref={videoRef} width="640" height="480" autoPlay className="img-fluid border" />
      </div>

      <div className="mb-3">
        <button className="btn btn-primary me-2" onClick={capture}>📸 Chụp ảnh</button>
        <button className="btn btn-secondary me-2" onClick={() => fileInputRef.current.click()}>⬆️ Upload ảnh từ máy</button>
        <input type="file" ref={fileInputRef} onChange={handleUpload} accept="image/*" hidden />
      </div>

      {previewSrc && (
        <div className="mb-3">
          <img src={previewSrc} alt="Preview" className="img-thumbnail" />
        </div>
      )}

      <button className="btn btn-success" onClick={sendImage}>🛡️ Gửi Chấm Công</button>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default FaceCheckIn;


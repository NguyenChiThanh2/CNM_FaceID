import React, { useState } from 'react';
import chamCongService from '../../services/api/cham-cong-api';

const FaceRecognition = () => {
  const [image, setImage] = useState(null);
  const [message, setMessage] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    try {
      const response = await chamCongService.recognizeFaceAndAutoChamCong(image);
      setMessage(response.data.message);
    } catch (error) {
      setMessage('Có lỗi xảy ra khi nhận diện khuôn mặt');
    }
  };

  return (
    <div>
      <h3>Nhận diện khuôn mặt và chấm công</h3>
      <input type="file" onChange={handleImageChange} />
      <button onClick={handleSubmit} className="btn btn-primary">Chấm công</button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default FaceRecognition;

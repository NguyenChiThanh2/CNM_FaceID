// src/components/ChamCongFaceRecognition.js
import React, { useState } from 'react';
import axios from 'axios';

const ChamCongFaceRecognition = () => {
    const [image, setImage] = useState(null);

    const handleFileChange = (e) => {
        setImage(e.target.files[0]);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('avatar', image);

        axios.post('http://127.0.0.1:5000/api/cham-cong-khuon-mat', formData)
            .then(response => {
                alert("Chấm công thành công!");
            })
            .catch(error => {
                console.error("There was an error with face recognition:", error);
            });
    };

    return (
        <div>
            <h1>Chấm Công Bằng Khuôn Mặt</h1>
            <form onSubmit={handleSubmit}>
                <input
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*"
                />
                <button type="submit">Nhận diện và Chấm công</button>
            </form>
        </div>
    );
};

export default ChamCongFaceRecognition;

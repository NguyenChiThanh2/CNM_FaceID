// src/components/AddChamCong.js
import React, { useState } from 'react';
import axios from 'axios';

const AddChamCong = () => {
    const [nhanVienId, setNhanVienId] = useState('');
    const [ngay, setNgay] = useState('');
    const [gioVao, setGioVao] = useState('');
    const [gioRa, setGioRa] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();

        const chamCongData = {
            nhan_vien_id: nhanVienId,
            ngay: ngay,
            gio_vao: gioVao,
            gio_ra: gioRa,
        };

        axios.post('/cham-cong/add-cham-cong', chamCongData)
            .then(response => {
                alert("Chấm công thành công!");
            })
            .catch(error => {
                console.error("There was an error adding the Cham Cong:", error);
            });
    };

    return (
        <div>
            <h1>Thêm Chấm Công</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Nhân viên ID</label>
                    <input
                        type="text"
                        value={nhanVienId}
                        onChange={(e) => setNhanVienId(e.target.value)}
                    />
                </div>
                <div>
                    <label>Ngày</label>
                    <input
                        type="date"
                        value={ngay}
                        onChange={(e) => setNgay(e.target.value)}
                    />
                </div>
                <div>
                    <label>Giờ vào</label>
                    <input
                        type="time"
                        value={gioVao}
                        onChange={(e) => setGioVao(e.target.value)}
                    />
                </div>
                <div>
                    <label>Giờ ra</label>
                    <input
                        type="time"
                        value={gioRa}
                        onChange={(e) => setGioRa(e.target.value)}
                    />
                </div>
                <button type="submit">Thêm Chấm Công</button>
            </form>
        </div>
    );
};

export default AddChamCong;

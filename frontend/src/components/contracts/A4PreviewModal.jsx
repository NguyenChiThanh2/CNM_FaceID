import React from "react";
import { Modal, Button } from "react-bootstrap";
import ContractA4Paper from "./ContractA4Paper";

export default function A4PreviewModal({
    show, onHide, onPrint, onSavePDF,
    nhanSu, hopDong, chucVu, phongBan, phucLoiList, contractRef
}) {
    return (
        <Modal show={show} onHide={onHide} centered dialogClassName="a4-dialog">
            {/* CSS dành riêng cho modal + A4 */}
            <style>{`
        /* ========= A4 MODAL & PAPER ========= */
        .a4-dialog { width:210mm; max-width:210mm; margin-left:auto; margin-right:auto; }
        .a4-dialog .modal-content, .a4-dialog .modal-header,
        .a4-dialog .modal-body, .a4-dialog .modal-footer {
          background-color:#fff !important; border:0; box-shadow:none;
        }
        .modal-backdrop.show { opacity:0.6; }
        .a4-modal-body { padding:0 !important; }
        .a4-print-area { display:flex; justify-content:center; align-items:flex-start; margin:0; padding:0; }
        .a4-paper { width:210mm; min-height:297mm; background:#fff; color:#111;
          padding:8mm 15mm 14mm 15mm; box-sizing:border-box; margin:0 !important; position:relative; }
        @media screen { .a4-paper { box-shadow:0 4px 24px rgba(0,0,0,.15); margin-top:16px; margin-bottom:24px; } }
        @media print {
          @page { size:A4; margin:0; }
          body * { visibility:hidden !important; }
          .a4-paper, .a4-paper * { visibility:visible !important; }
          .a4-paper { position:fixed; left:0; top:0; box-shadow:none !important; margin:0 !important; }
        }
        @media (max-width:992px){ .a4-dialog{max-width:100%; width:100%;} .a4-paper{ transform:scale(.9); transform-origin:top center; } }

        /* ========= NỘI DUNG TRÊN GIẤY ========= */
        .a4-header{ display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #222; padding-bottom:8px; margin-bottom:12px; }
        .a4-title{ text-align:center; font-weight:700; font-size:18px; margin:8px 0 16px; }
        .a4-meta{ font-size:12px; line-height:1.6; }
        .a4-section{ margin-top:12px; }
        .a4-section h4{ font-size:14px; margin:0 0 6px; text-transform:uppercase; }
        .a4-row{ display:grid; grid-template-columns:1fr 1fr; gap:8px 16px; }
        .a4-kv{ font-size:12px; } .a4-kv b{ font-weight:600; }
        .a4-table{ width:100%; border-collapse:collapse; margin-top:8px; font-size:12px; }
        .a4-table th, .a4-table td{ border:1px solid #444; padding:6px 8px; vertical-align:top; }
        .a4-footer{ position:absolute; bottom:14mm; left:15mm; right:15mm; display:grid; grid-template-columns:1fr 1fr; gap:16px; }
        .a4-sign-box{ text-align:center; border:1px dashed #777; padding:12px 8px; min-height:90px; }
        .a4-note{ font-size:11px; margin-top:8px; color:#444; }
      `}</style>

            <Modal.Header closeButton>
                <Modal.Title>Hợp đồng lao động (A4)</Modal.Title>
            </Modal.Header>

            <Modal.Body className="a4-modal-body">
                <div className="a4-print-area">
                    <ContractA4Paper
                        nhanSu={nhanSu}
                        hopDong={hopDong}
                        chucVu={chucVu}
                        phongBan={phongBan}
                        phucLoiList={phucLoiList}
                        contractRef={contractRef}
                    />
                </div>
            </Modal.Body>

            <Modal.Footer className="d-flex justify-content-between">
                <div className="text-muted small">Mẹo: Dùng Ctrl+P để in, hoặc Lưu PDF.</div>
                <div className="d-flex gap-2">
                    <Button variant="outline-secondary" onClick={onHide}>Đóng</Button>
                    <Button variant="outline-primary" onClick={onPrint}>In (Ctrl+P)</Button>
                    <Button variant="success" onClick={onSavePDF}>Lưu PDF</Button>
                </div>
            </Modal.Footer>
        </Modal>
    );
}

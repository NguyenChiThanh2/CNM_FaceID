import cv2
import face_recognition
from app.models.nhan_vien_model import NhanVien

def recognize_face_from_camera():
    # Khởi tạo camera (0 là camera mặc định của máy tính)
    cap = cv2.VideoCapture(0)

    while True:
        # Đọc hình ảnh từ camera
        ret, frame = cap.read()

        # Nếu không thể lấy hình ảnh, dừng vòng lặp
        if not ret:
            print("Không thể lấy hình ảnh từ camera")
            break

        # Chuyển đổi ảnh thành định dạng RGB
        rgb_frame = frame[:, :, ::-1]

        # Tìm tất cả các khuôn mặt trong ảnh
        face_locations = face_recognition.face_locations(rgb_frame)

        # Lấy face encoding của khuôn mặt đầu tiên (nếu có)
        face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)

        if len(face_encodings) > 0:
            # Nếu nhận diện được khuôn mặt, lấy face encoding
            encoding_to_compare = face_encodings[0]
            
            # Kiểm tra với cơ sở dữ liệu nhân viên
            nhan_vien = compare_face_with_db(encoding_to_compare)
            
            if nhan_vien:
                print(f"Nhận diện thành công nhân viên: {nhan_vien.ho_ten}")
                # Bạn có thể tạo chấm công ở đây
                return nhan_vien
            else:
                print("Không tìm thấy nhân viên khớp")
        
        # Hiển thị khung hình camera
        cv2.imshow("Camera", frame)

        # Đóng khi nhấn phím 'q'
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    # Giải phóng camera
    cap.release()
    cv2.destroyAllWindows()

def compare_face_with_db(encoding_to_compare):
    # Lấy danh sách tất cả nhân viên
    nhan_vien_list = NhanVien.query.all()

    # Duyệt qua từng nhân viên và so sánh face encoding
    for nhan_vien in nhan_vien_list:
        if nhan_vien.face_encoding:
            match = face_recognition.compare_faces([nhan_vien.face_encoding], encoding_to_compare)
            if match[0]:
                return nhan_vien  # Trả về nhân viên nếu trùng khớp
    return None  # Không tìm thấy nhân viên nào trùng khớp

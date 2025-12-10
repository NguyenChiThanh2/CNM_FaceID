import os
import uuid
import cv2
import jwt
import pytz
import face_recognition
from datetime import datetime, timedelta, time, date
import cv2, numpy as np, math
from app import db
from app.models.nhan_vien_model import NhanVien
from app.models.cham_cong_model import ChamCong
from app.utils.file_utils import read_image_from_base64
from app.models.giay_phep_model import GiayPhep
from decimal import Decimal
from sqlalchemy import extract
from typing import Optional

# ====== Cấu hình ======
FACE_JWT_SECRET = os.getenv("FACE_JWT_SECRET", "dev-secret")
THRESH = float(os.getenv("FACE_MATCH_THRESH", "0.41"))
CHECKIN_DIR = os.path.join("static", "checkin_images")
os.makedirs(CHECKIN_DIR, exist_ok=True)
# ====== STRICT MODE ======
STRICT_MODE            = os.getenv("LIVENESS_STRICT", "1") == "1"
MIN_FRAMES             = int(os.getenv("LIVENESS_MIN_FRAMES", "8"))

# Ngưỡng nền
LAPLACIAN_MIN          = float(os.getenv("LIVENESS_LAPLACIAN_MIN",  "18")) # Độ nét tối thiểu
SSIM_SOFT              = float(os.getenv("LIVENESS_SSIM_SOFT",      "0.994")) # ĐỘ tĩnh
SSIM_HARD              = float(os.getenv("LIVENESS_SSIM_HARD",      "0.9965"))# ĐỘ tĩnh
FLOW_MIN               = float(os.getenv("LIVENESS_FLOW_MIN",       "0.016"))
FLOW_VERY_LOW          = float(os.getenv("LIVENESS_FLOW_VLOW",      "0.010"))

HOMO_ERR_FAIL          = float(os.getenv("LIVENESS_HOMO_ERR_FAIL",  "1.25"))
PARA_RATIO_NEAR_L      = float(os.getenv("LIVENESS_PARA_RATIO_L",   "0.95"))
PARA_RATIO_NEAR_H      = float(os.getenv("LIVENESS_PARA_RATIO_H",   "1.05"))
PARA_COS_NEAR          = float(os.getenv("LIVENESS_PARA_COS_NEAR",  "0.99"))
PARA_SCREEN_MIN_HITS   = int(os.getenv("LIVENESS_PARA_SCREEN_MIN_HITS", "4"))

# Ràng buộc kích thước mặt (tỉ lệ diện tích ROI mặt / khung)
FACE_AREA_MIN          = float(os.getenv("LIVENESS_FACE_AREA_MIN", "0.20"))
FACE_AREA_MAX          = float(os.getenv("LIVENESS_FACE_AREA_MAX", "0.70"))

DEBUG_LIVENESS         = os.getenv("DEBUG_LIVENESS", "0") == "1"
MIN_GAP_BETWEEN_CHECKINS = timedelta(minutes=1)


# ====== CRUD cơ bản ======
def get_all_cham_cong_service():
    return ChamCong.query.order_by(ChamCong.id.desc()).all()

def get_cham_cong_by_id_service(id):
    chamcong = ChamCong.query.get(id)
    return chamcong


def get_cham_cong_by_nhan_vien_id_service(nhan_vien_id):
    return ChamCong.query.filter_by(nhan_vien_id=nhan_vien_id).all()

def update_cham_cong_service(id, thoi_gian_vao=None, thoi_gian_ra=None, ngay=None,
                             hinh_anh_vao=None, hinh_anh_ra=None, hinh_anh=None):
    cc = ChamCong.query.get(id)
    if not cc:
        return None

    old_files = []
    if hinh_anh_vao is not None and cc.hinh_anh_vao and cc.hinh_anh_vao != hinh_anh_vao:
        old_files.append(cc.hinh_anh_vao)
        cc.hinh_anh_vao = hinh_anh_vao

    if hinh_anh_ra is not None and cc.hinh_anh_ra and cc.hinh_anh_ra != hinh_anh_ra:
        old_files.append(cc.hinh_anh_ra)
        cc.hinh_anh_ra = hinh_anh_ra

    if hinh_anh is not None and getattr(cc, "hinh_anh", None) and cc.hinh_anh != hinh_anh:
        old_files.append(cc.hinh_anh)
        cc.hinh_anh = hinh_anh

    if thoi_gian_vao is not None: cc.thoi_gian_vao = thoi_gian_vao
    if thoi_gian_ra is not None:  cc.thoi_gian_ra  = thoi_gian_ra
    if ngay is not None:          cc.ngay          = ngay

    db.session.commit()

    for f in old_files:
        _unlink_quiet(_safe_checkin_path(f))

    return cc

# ---- helpers: chọn đường dẫn an toàn & xoá im lặng
def _safe_checkin_path(filename: str):
    if not filename:
        return None
    # tránh path traversal
    return os.path.join(CHECKIN_DIR, os.path.basename(filename))

def _unlink_quiet(path: str):
    try:
        if path and os.path.exists(path):
            os.remove(path)
            return True
    except Exception:
        pass
    return False

def delete_cham_cong_service(id):
    cham_cong = ChamCong.query.get(id)
    if not cham_cong:
        return False

    # gom các tên file có thể có (tuỳ model của bạn)
    files = []
    if getattr(cham_cong, "hinh_anh_vao", None):
        files.append(cham_cong.hinh_anh_vao)
    if getattr(cham_cong, "hinh_anh_ra", None):
        files.append(cham_cong.hinh_anh_ra)
    if getattr(cham_cong, "hinh_anh", None):   # nếu còn field cũ
        files.append(cham_cong.hinh_anh)

    # chuẩn bị path trước khi xoá DB
    paths = [_safe_checkin_path(f) for f in files]

    db.session.delete(cham_cong)
    db.session.commit()

    # xoá file sau khi commit để tránh “mất file mà DB vẫn còn”
    for p in paths:
        _unlink_quiet(p)

    return True


def _bbox_area(loc):  # (top, right, bottom, left)
    t, r, b, l = loc
    return (b - t) * (r - l)

def _pick_biggest(locs):
    return max(locs, key=_bbox_area)
# ====== Tiện ích nhận dạng ======
def _best_match(input_encoding):
    matched_nv, min_d = None, float("inf")
    for nv in NhanVien.query.all():
        if nv.face_encoding:
            known = np.array(nv.face_encoding)
            d = np.linalg.norm(known - input_encoding)
            if d < min_d and d <= THRESH:
                min_d, matched_nv = d, nv
    return matched_nv, min_d

def _encode_one_face(img):
    locs = face_recognition.face_locations(img)
    if not locs:
        return None, None
    best = _pick_biggest(locs)  # <- chọn mặt lớn nhất
    encs = face_recognition.face_encodings(img, known_face_locations=[best])
    if not encs:
        return None, None
    return encs[0], best

# ====== Passive liveness (không thử thách) ======
def _lap_var(img_bgr):
    return float(cv2.Laplacian(img_bgr, cv2.CV_64F).var())

def _crop_by_loc(img, loc):
    top, right, bottom, left = loc
    top = max(0, top-10); left = max(0, left-10)
    bottom = min(img.shape[0], bottom+10); right = min(img.shape[1], right+10)
    return img[top:bottom, left:right]

# SSIM xấp xỉ (không phụ thuộc skimage)
def _ssim_gray(a, b):
    a = a.astype(np.float64); b = b.astype(np.float64)
    K1, K2, L = 0.01, 0.03, 255
    C1, C2 = (K1*L)**2, (K2*L)**2
    mu_a, mu_b = a.mean(), b.mean()
    sigma_a, sigma_b = a.var(), b.var()
    sigma_ab = ((a-mu_a)*(b-mu_b)).mean()
    num = (2*mu_a*mu_b + C1) * (2*sigma_ab + C2)
    den = (mu_a**2 + mu_b**2 + C1) * (sigma_a + sigma_b + C2)
    return float(num / (den + 1e-9))

def _optical_flow_mag(prev_bgr, curr_bgr):
    prev = cv2.cvtColor(prev_bgr, cv2.COLOR_BGR2GRAY)
    curr = cv2.cvtColor(curr_bgr, cv2.COLOR_BGR2GRAY)
    flow = cv2.calcOpticalFlowFarneback(prev, curr, None,
                                        pyr_scale=0.5, levels=3, winsize=15,
                                        iterations=3, poly_n=5, poly_sigma=1.2, flags=0)
    mag, _ = cv2.cartToPolar(flow[...,0], flow[...,1])
    return float(np.mean(mag)), float(np.std(mag))

def _yaw_value(landmarks):
    nose = np.mean(np.array(landmarks['nose_bridge']), axis=0)
    leye = np.mean(np.array(landmarks['left_eye']), axis=0)
    reye = np.mean(np.array(landmarks['right_eye']), axis=0)
    dl = np.linalg.norm(nose - leye)
    dr = np.linalg.norm(nose - reye)
    return float((dr - dl) / (dl + dr + 1e-6))
def _homography_planarity_error(points_a, points_b):
    """
    points_*: np.array shape [N,2]
    Trả về reprojection error trung bình sau khi fit H. Lỗi nhỏ -> bề mặt phẳng.
    """
    if points_a.shape[0] < 6:  # cần đủ điểm
        return None
    H, mask = cv2.findHomography(points_a, points_b, cv2.RANSAC, 3.0)
    if H is None:
        return None
    pts_a_h = np.hstack([points_a, np.ones((points_a.shape[0],1))])
    proj = (H @ pts_a_h.T).T
    proj = proj[:, :2] / (proj[:, 2:3] + 1e-6)
    err = np.linalg.norm(proj - points_b, axis=1)
    return float(np.mean(err))

def _landmark_points68(lm_dict):
    # Lấy 8–10 điểm ổn định: khoé mắt, trán (ước lượng), mũi, khoé miệng
    pts = []
    def mean_xy(arr): 
        a = np.array(arr, dtype=np.float32); 
        return a.mean(axis=0)
    if "left_eye" in lm_dict and "right_eye" in lm_dict:
        le = np.array(lm_dict["left_eye"], dtype=np.float32)
        re = np.array(lm_dict["right_eye"], dtype=np.float32)
        pts += [le[0], le[3], re[0], re[3]]  # góc mắt
        pts += [mean_xy(le), mean_xy(re)]
    if "nose_tip" in lm_dict:
        n = np.array(lm_dict["nose_tip"], dtype=np.float32)
        pts += [n[0], n[-1], mean_xy(n)]
    if "top_lip" in lm_dict and "bottom_lip" in lm_dict:
        tl = np.array(lm_dict["top_lip"], dtype=np.float32)
        bl = np.array(lm_dict["bottom_lip"], dtype=np.float32)
        pts += [tl[0], tl[-1], bl[0], bl[-1]]
    if len(pts) < 6: 
        return None
    return np.array(pts, dtype=np.float32)

def _parallax_face_vs_bg(prev_bgr, curr_bgr, face_rect):
    """
    So sánh optical flow giữa vùng mặt và nền.
    Trả về (ratio_mag, cos_dir) – lớn & cos ~1 => chuyển động toàn khung (điện thoại trước camera)
    """
    h, w = prev_bgr.shape[:2]
    (top, right, bottom, left) = face_rect
    face = prev_bgr[top:bottom, left:right]
    if face.size == 0:
        return None, None

    prev_g = cv2.cvtColor(prev_bgr, cv2.COLOR_BGR2GRAY)
    curr_g = cv2.cvtColor(curr_bgr, cv2.COLOR_BGR2GRAY)
    flow = cv2.calcOpticalFlowFarneback(prev_g, curr_g, None, 0.5, 3, 15, 3, 5, 1.2, 0)

    # vector trung bình toàn ảnh (bg approx) và trong mặt
    fy, fx = flow[...,1], flow[...,0]
    v_bg = np.array([fx.mean(), fy.mean()], dtype=np.float32)

    fyf = fy[top:bottom, left:right]; fxf = fx[top:bottom, left:right]
    v_face = np.array([fxf.mean(), fyf.mean()], dtype=np.float32)

    mag_bg = float(np.linalg.norm(v_bg))
    mag_face = float(np.linalg.norm(v_face))
    ratio = (mag_bg + 1e-6) / (mag_face + 1e-6)

    # cos góc giữa 2 vector
    denom = (np.linalg.norm(v_bg)*np.linalg.norm(v_face) + 1e-6)
    cosdir = float(np.dot(v_bg, v_face) / denom)
    return ratio, cosdir

def _detect_screen_bezel(img_bgr, face_rect):
    """
    Tìm khung chữ nhật cứng quanh ROI (màn hình điện thoại).
    Trả True nếu thấy contour chữ nhật nổi bật bao quanh mặt.
    """
    (top, right, bottom, left) = face_rect
    pad = 30
    t = max(0, top - pad); l = max(0, left - pad)
    b = min(img_bgr.shape[0], bottom + pad); r = min(img_bgr.shape[1], right + pad)
    roi = img_bgr[t:b, l:r]
    if roi.size == 0: 
        return False

    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (3,3), 0)
    edges = cv2.Canny(gray, 60, 120, apertureSize=3, L2gradient=True)

    # contour -> polygon => tìm hình gần chữ nhật tỉ lệ khung > 0.6
    cnts, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    H, W = roi.shape[:2]
    for c in cnts:
        area = cv2.contourArea(c)
        if area < (H*W)*0.1:  # bỏ contour nhỏ
            continue
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.02*peri, True)
        if len(approx) == 4:
            # hình gần chữ nhật và bao quanh phần lớn ROI
            x,y,w,h = cv2.boundingRect(approx)
            cover = (w*h)/(H*W)
            if cover > 0.55 and min(w,h) > 0.5*min(W,H):
                return True
    return False
def passive_liveness_score(frames_bgr):
    """
    Strict: bắt buộc frames >= MIN_FRAMES, không fallback 1 ảnh.
    Fail NGAY nếu: bezel, homography quá khớp (planar), parallax mặt~nền lặp nhiều,
                   khung siêu tĩnh (SSIM_HARD & FLOW_VERY_LOW),
                   không có dấu hiệu parallax 'live_like',
                   chuyển động quá thấp, mặt quá nhỏ/quá to.
    """
    if not frames_bgr or len(frames_bgr) < MIN_FRAMES:
        return False, 0.0, f"Thiếu khung hình (cần >= {MIN_FRAMES})"

    # 0) tìm mặt ở frame 0 + ràng buộc diện tích
    locs0 = face_recognition.face_locations(frames_bgr[0])
    if not locs0:
        return False, 0.1, "Không phát hiện khuôn mặt ổn định"
    loc0 = _pick_biggest(locs0)

    loc0 = _pick_biggest(locs0)  # dùng mặt lớn nhất
    top, right, bottom, left = loc0
    H, W = frames_bgr[0].shape[:2]
    face_area_ratio = ((bottom-top) * (right-left)) / float(H*W + 1e-6)

    # 1) nét
    sharp_vals = [float(cv2.Laplacian(f, cv2.CV_64F).var()) for f in frames_bgr]
    med_sharp = float(np.median(sharp_vals))
    if med_sharp < LAPLACIAN_MIN:
        return False, 0.1, "Ảnh quá mờ"

    # 2) SSIM liên tiếp
    def _ssim_pair(a, b):
        a = cv2.cvtColor(a, cv2.COLOR_BGR2GRAY); b = cv2.cvtColor(b, cv2.COLOR_BGR2GRAY)
        hh = min(a.shape[0], b.shape[0]); ww = min(a.shape[1], b.shape[1])
        a = cv2.resize(a, (ww, hh)); b = cv2.resize(b, (ww, hh))
        return _ssim_gray(a, b)
    ssim_vals = [_ssim_pair(frames_bgr[i], frames_bgr[i+1]) for i in range(len(frames_bgr)-1)]
    avg_ssim = float(np.mean(ssim_vals))

    # 3) optical flow trong ROI mặt
    def _crop(img, loc):
        t,r,b,l = loc
        t = max(0, t-10); l = max(0, l-10)
        b = min(img.shape[0], b+10); r = min(img.shape[1], r+10)
        return img[t:b, l:r]
    face_crops = [_crop(f, loc0) for f in frames_bgr]
    mags = []
    for i in range(len(face_crops)-1):
        m, _ = _optical_flow_mag(face_crops[i], face_crops[i+1])
        mags.append(m)
    mean_mag = float(np.mean(mags))

    # 4) homography planarity (frame cách nhau)
    def _lm_pts(img):
        lms = face_recognition.face_landmarks(img)
        if not lms: return None
        return _landmark_points68(lms[0])
    idxA, idxB = 0, min(len(frames_bgr)-1, max(4, len(frames_bgr)//5))
    ptsA, ptsB = _lm_pts(frames_bgr[idxA]), _lm_pts(frames_bgr[idxB])
    homo_err = None
    if ptsA is not None and ptsB is not None:
        homo_err = _homography_planarity_error(ptsA, ptsB)

    # 5) parallax: so sánh mặt vs nền nhiều cặp
    screen_like_hits, live_like_hits = 0, 0
    for i in range(0, len(frames_bgr)-1, 2):
        ratio, cosdir = _parallax_face_vs_bg(frames_bgr[i], frames_bgr[i+1], loc0)
        if ratio is None: 
            continue
        if (PARA_RATIO_NEAR_L <= ratio <= PARA_RATIO_NEAR_H) and (cosdir >= PARA_COS_NEAR):
            screen_like_hits += 1
        elif (ratio >= 1.25) or (cosdir <= 0.90):
            live_like_hits += 1

    # 6) bezel -> fail ngay
    if _detect_screen_bezel(frames_bgr[0], loc0):
        if DEBUG_LIVENESS:
            print(f"[Liveness STRICT] Bezel=1  sharp={med_sharp:.2f}  ssim={avg_ssim:.5f}  flow={mean_mag:.4f}")
        return False, 0.25, "Phát hiện khung màn hình quanh mặt"

    # 7) fail cứng theo từng tín hiệu (chống màn hình)
    # --- MỚI (chỉ fail khi planar + thêm dấu hiệu giả mạo) ---
    planar = (homo_err is not None) and (homo_err < HOMO_ERR_FAIL)

    # Nếu planar và mặt ~ nền lặp nhiều lần  -> nghi cầm điện thoại
    if planar and (screen_like_hits >= PARA_SCREEN_MIN_HITS):
        return False, 0.30, "Chấm công thất bại. Vui lòng thử lại"
        # return False, 0.30, "Planarity + parallax mặt~nền (nghi màn hình)"

    # Nếu planar và khung rất tĩnh, lại không có parallax 'live_like' -> nghi ảnh/màn hình
    if planar and (avg_ssim >= SSIM_SOFT) and (live_like_hits == 0):
        return False, 0.30, "Chấm công thất bại. Vui lòng thử lại"

    if screen_like_hits >= PARA_SCREEN_MIN_HITS:
        return False, 0.30, "Chấm công thất bại. Vui lòng thử lại"
    if (avg_ssim >= SSIM_HARD) and (mean_mag <= FLOW_VERY_LOW):
        return False, 0.30, "Chấm công thất bại. Vui lòng thử lại"

    # 8) yêu cầu có ít nhất 1 dấu hiệu 'live_like' & chuyển động đủ
    if live_like_hits < 1:
        # return False, 0.30, "Thiếu parallax tự nhiên của người thật"
        return False, 0.30, "Chấm công thất bại. Vui lòng thử lại"
    if mean_mag < FLOW_MIN:
        return False, 0.30, "Chuyển động vi mô quá thấp"

    # 9) score mềm (để log/giám sát), strict pass khi qua tất cả cổng
    sharp_score = float(np.clip((med_sharp - LAPLACIAN_MIN) / 40.0, 0, 0.25))
    ssim_score  = float(np.clip((1.0 - avg_ssim) / (1.0 - SSIM_SOFT + 1e-6), 0, 1.0)) * 0.25
    flow_score  = float(np.clip((mean_mag - FLOW_MIN) / 0.06, 0, 1.0)) * 0.25
    bonus       = 0.10 if live_like_hits >= 1 else 0.0
    score = float(min(1.0, sharp_score + ssim_score + flow_score + bonus))

    if DEBUG_LIVENESS:
        print(f"[Liveness STRICT] ok=True score={score:.2f} sharp={med_sharp:.2f} "
              f"ssim={avg_ssim:.5f} flow={mean_mag:.4f} H={homo_err} "
              f"screen_hits={screen_like_hits} live_hits={live_like_hits} "
              f"face_area={face_area_ratio:.2f}")

    return True, score, None




# ====== Preview nhận diện (dùng cho /api/face/recognize nếu muốn gọi qua service) ======
def recognize_preview_service(image_base64):
    img = read_image_from_base64(image_base64)
    if img is None:
        return {"ok": False, "message": "Thiếu ảnh"}, 400

    enc, _ = _encode_one_face(img)
    if enc is None:
        return {"ok": True, "nhan_vien": None, "preview_token": None}, 200

    nv, _ = _best_match(enc)
    if not nv:
        return {"ok": True, "nhan_vien": None, "preview_token": None}, 200

    now = datetime.utcnow()
    token = jwt.encode({
        "typ": "preview",
        "nv_id": nv.id,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(seconds=20)).timestamp())
    }, FACE_JWT_SECRET, algorithm="HS256")

    return {"ok": True, "nhan_vien": {"id": nv.id, "ho_ten": nv.ho_ten}, "preview_token": token}, 200

# ====== Checkin với passive liveness (frames ưu tiên, 1 ảnh fallback) ======
def create_cham_cong_from_face_service_passive(payload):
    """
    payload:
      - ưu tiên: {"frames": ["data:image/jpeg;base64,...", ...], "preview_token": "..."}
      - fallback: {"image_base64": "...", "preview_token": "..."}
    """
    token = (payload or {}).get("preview_token")
    if not token:
        return {"ok": False, "message": "Thiếu preview_token"}, 400

    # xác thực token & nv
    try:
        claims = jwt.decode(token, FACE_JWT_SECRET, algorithms=["HS256"])
        if claims.get("typ") != "preview":
            return {"ok": False, "message": "Token không hợp lệ"}, 400
        nv_id = claims.get("nv_id")
    except Exception:
        return {"ok": False, "message": "Token hết hạn/không hợp lệ"}, 400

    nv = NhanVien.query.get(nv_id)
    if not nv:
        return {"ok": False, "message": "Nhân viên không tồn tại"}, 404

    # Liveness nếu có frames
    frames_bgr = []
    for b64 in (payload.get("frames") or [])[:12]:
        img = read_image_from_base64(b64)
        if img is not None:
            frames_bgr.append(img)

    if frames_bgr:
        ok, score, reason = passive_liveness_score(frames_bgr)
        if not ok:
            return {"ok": False, "message": f"Liveness không đạt: {reason} (score={score:.2f})"}, 400
        best_img = max(frames_bgr, key=lambda im: _lap_var(im))
    else:
        # fallback 1 ảnh
        img_one = read_image_from_base64(payload.get("image_base64"))
        if img_one is None:
            return {"ok": False, "message": "Thiếu ảnh"}, 400
        if _lap_var(img_one) < 20:
            return {"ok": False, "message": "Ảnh quá mờ"}, 400
        best_img = img_one

    # xác thực lại khớp khuôn mặt với nv từ token (siết chặt)
    enc, _ = _encode_one_face(best_img)
    if enc is None:
        return {"ok": False, "message": "Không phát hiện khuôn mặt khi chấm công"}, 400
    if nv.face_encoding is not None:
        d = float(np.linalg.norm(np.array(nv.face_encoding) - enc))
        if d > THRESH:
            return {"ok": False, "message": "Khuôn mặt không khớp nhân viên"}, 400

    # Ghi ảnh minh chứng
    filename = f"{uuid.uuid4()}.jpg"
    path = os.path.join(CHECKIN_DIR, filename)
    cv2.imwrite(path, best_img)

    # Chấm công
    vn_tz = pytz.timezone("Asia/Ho_Chi_Minh")
    now = datetime.now(vn_tz)
    today = now.date()
    time_str = now.strftime("%H:%M %d-%m")

    cc = ChamCong.query.filter_by(nhan_vien_id=nv.id, ngay=today).first()
    if not cc:
        # lần đầu trong ngày -> VÀO
        cc = ChamCong(nhan_vien_id=nv.id, thoi_gian_vao=now, ngay=today, hinh_anh_vao=filename)
        db.session.add(cc)
        db.session.commit()
        return {
            "ok": True,
            "message": "Chấm công vào thành công",
            "nhan_vien": {"id": nv.id, "ho_ten": nv.ho_ten},
            "time": time_str,
            "cham_cong": cc.to_dict(),
        }, 200
    elif cc.thoi_gian_ra is None:
        # đang có VÀO rồi, chuẩn bị RA -> kiểm tra đủ gap chưa
        try:
            vn_tz = pytz.timezone("Asia/Ho_Chi_Minh")

            def _ensure_aware(dt, tz):
                if dt is None:
                    return None
                # Nếu dt chưa có tz -> gán tz VN; nếu có -> chuyển về VN tz
                return tz.localize(dt) if dt.tzinfo is None else dt.astimezone(tz)

            last_in = _ensure_aware(cc.thoi_gian_vao, vn_tz)
            now_local = _ensure_aware(now, vn_tz)  # now ở trên đã là aware, đoạn này chỉ để đồng nhất

            if last_in is None:
                # Không có thoi_gian_vao hợp lệ -> fail-safe
                return {
                    "ok": False,
                    "message": "Không tìm thấy thời gian vào để đối chiếu. Vui lòng thử lại.",
                    "name": nv.ho_ten,
                }, 400

            gap = now_local - last_in
            if gap < MIN_GAP_BETWEEN_CHECKINS:
                left = MIN_GAP_BETWEEN_CHECKINS - gap
                mins = int(left.total_seconds() // 60)
                secs = int(left.total_seconds() % 60)

                # Thông điệp động theo cấu hình MIN_GAP_BETWEEN_CHECKINS
                target_mins = int(MIN_GAP_BETWEEN_CHECKINS.total_seconds() // 60)
                target_secs = int(MIN_GAP_BETWEEN_CHECKINS.total_seconds() % 60)
                target_str = (
                    f"{target_mins} phút" if target_secs == 0
                    else f"{target_mins} phút {target_secs} giây"
                )

                return {
                    "ok": False,
                    "message": f"Chưa đủ {target_str} từ lần chấm gần nhất. Vui lòng thử lại sau {mins} phút {secs} giây.",
                    "name": nv.ho_ten,
                    "debug": {
                        "last_in": last_in.isoformat(),
                        "now": now_local.isoformat(),
                        "gap_seconds": int(gap.total_seconds()),
                        "required_seconds": int(MIN_GAP_BETWEEN_CHECKINS.total_seconds()),
                    }
                }, 400

        except Exception as e:
            # nếu lỗi tz/so sánh -> fail-safe nhưng có debug
            return {
                "ok": False,
                "message": "Không thể xác minh khoảng cách giữa 2 lần chấm. Vui lòng thử lại sau.",
                "name": nv.ho_ten,
                "error": str(e),
            }, 400

        # đủ gap -> cho RA
        cc.thoi_gian_ra = now
        cc.hinh_anh_ra = filename
        db.session.commit()
        return {
            "ok": True,
            "message": "Chấm công ra thành công",
            "nhan_vien": {"id": nv.id, "ho_ten": nv.ho_ten},
            "time": time_str,
            "cham_cong": cc.to_dict(),
        }, 200
    else:
        # đã đủ vào/ra trong ngày
        return {"ok": False, "message": "Hôm nay đã chấm đủ vào/ra", "name": nv.ho_ten}, 400

# ====== Backward-compat (API cũ: 1 ảnh, không token) ======
def create_cham_cong_from_face_service(base64_image):
    img = read_image_from_base64(base64_image)
    if img is None:
        return {"ok": False, "message": "Thiếu ảnh"}, 400
    enc, _ = _encode_one_face(img)
    if enc is None:
        return {"ok": False, "message": "Không phát hiện khuôn mặt nào"}, 400
    nv, _ = _best_match(enc)
    if not nv:
        return {"ok": False, "message": "Không khớp khuôn mặt với bất kỳ nhân viên nào"}, 404

    filename = f"{uuid.uuid4()}.jpg"
    path = os.path.join(CHECKIN_DIR, filename)
    cv2.imwrite(path, img)

    vn_tz = pytz.timezone("Asia/Ho_Chi_Minh")
    now = datetime.now(vn_tz)
    today = now.date()
    time_str = now.strftime("%H:%M %d-%m")

    cc = ChamCong.query.filter_by(nhan_vien_id=nv.id, ngay=today).first()
    if not cc:
        cc = ChamCong(nhan_vien_id=nv.id, thoi_gian_vao=now, ngay=today, hinh_anh_vao=filename)
        db.session.add(cc)
        db.session.commit()
        return {"ok": True, "message": "Chấm công <strong>vào</strong> thành công", "name": nv.ho_ten, "time": time_str, "cham_cong": cc.to_dict()}, 200
    if cc.thoi_gian_ra is None:
        cc.thoi_gian_ra = now
        cc.hinh_anh_ra = filename
        db.session.commit()
        return {"ok": True, "message": "Chấm công <strong>ra</strong> thành công", "name": nv.ho_ten, "time": time_str, "cham_cong": cc.to_dict()}, 200
    return {"ok": False, "message": "Đã chấm công đủ vào và ra cho hôm nay", "name": nv.ho_ten}, 400

# -----------------------------------------------------------------------------------
def get_chamcong_1nhanvien_theothang_service(nhan_vien_id, thang, nam):
    return ChamCong.query.filter(
    ChamCong.nhan_vien_id == nhan_vien_id,
    extract('month', ChamCong.ngay) == thang,
    extract('year', ChamCong.ngay) == nam).all()
    
    
def tinh_so_cong_cho_1_ngay(check_in: Optional[datetime], check_out: Optional[datetime]) -> Decimal:
    if not check_in or not check_out:
        return Decimal("0")
# theo thời gian việt nam
    in_t = check_in.time()
    out_t = check_out.time()

    # tính giờ làm việc trong ngày
    total_hours = Decimal("0")
    # ca sáng 08:00-12:00
    a_start, a_end = time(8, 0), time(12, 0)
    # ca chiều 13:00-17:00
    b_start, b_end = time(13, 0), time(17, 0)


    def overlap_hours(s: time, e: time, ws: time, we: time) -> Decimal:
        start = max(datetime.combine(date.min, s), datetime.combine(date.min, ws))
        end = min(datetime.combine(date.min, e), datetime.combine(date.min, we))
        delta = (end - start).total_seconds() / 3600
        return Decimal(str(max(delta, 0)))


    total_hours += overlap_hours(in_t, out_t, a_start, a_end)
    total_hours += overlap_hours(in_t, out_t, b_start, b_end)


    # 8 hours -> 1 công; 4 hours -> 0.5 công; trễ 30 phút không tính công ca sáng; về sớm 30 phút không tính công ca chiều
    if total_hours >= Decimal("7.5"):
        return Decimal("1.00")
    if total_hours >= Decimal("3.5"):
        return Decimal("0.50")
    return Decimal("0.00")
    
        
def get_tinhsocong_1nhanvien_theothang_service(nhan_vien_id, thang, nam):
    dschamcong = ChamCong.query.filter(ChamCong.nhan_vien_id == nhan_vien_id,extract('month', ChamCong.ngay) == thang,extract('year', ChamCong.ngay) == nam).all()
    if not dschamcong:
        return None
    else:
        for cc in dschamcong:
            so_cong_moi = tinh_so_cong_cho_1_ngay(cc.thoi_gian_vao, cc.thoi_gian_ra)
            cc.so_cong = so_cong_moi  # cập nhật lại cột so_cong
        db.session.commit()
        return True
    
def get_tinhsocong_theogiayphep_service(id):
    cham_cong = ChamCong.query.get(id)
    giay_phep = GiayPhep.query.filter(GiayPhep.cham_cong_id == id, GiayPhep.trang_thai == "Đã duyệt").first()

    if not cham_cong or not giay_phep:
        return {"error": "Không tìm thấy bản ghi chấm công hoặc giấy phép"}, 404
    
    if giay_phep.so_gio == 8:
        cham_cong.so_cong = Decimal("1.0")
        message = "Cập nhật 1 ngày công"
    elif giay_phep.so_gio == 4:
        cham_cong.so_cong = Decimal("0.5")
        message = "Cập nhật nửa ngày công"
    else:
        return {"error": "Giấy phép không hợp lệ"}, 400

    try:
        db.session.commit()
        return {"success": message}, 200
    except Exception as e:
        db.session.rollback()
        return {"error": str(e)}, 500 
import React, { useEffect, useRef, useState } from "react";
import {
  Card,
  Button,
  Breadcrumb,
  Spinner,
  Alert,
  Row,
  Col,
  Badge,
  Modal
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import {
  FaHome,
  FaCamera,
  FaUserCheck,
  FaUserTimes,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaLightbulb,
  FaSyncAlt
} from "react-icons/fa";
import { createFaceDetector } from "../../lib/faceDetectorFallback";
import { getDeviceToken } from "../DeviceGuard";

const API_BASE = "http://127.0.0.1:5000";

// Nhịp nhận diện & điều kiện
const RECOGNIZE_EVERY = 1300;
const STABLE_MS = 800;
const COOLDOWN_MS = 5000;
const PAUSE_AFTER_SUCCESS_MS = 3000;
const MIN_GAP_BETWEEN_CHECKINS_MS = 60_000;
const SAME_PERSON_GAP_MS = 120_000;
const KEEP_FACE_MS = 600;
const PORTRAIT_ASPECT = 1.25;
const BLUR_THRESHOLD = 15;
const DEBUG = false;
const MIRRORED = false;

const dlog = (...args) => DEBUG && console.log("[FaceCheckin]", ...args);

const supportsRVFC = () => {
  const v = document.createElement("video");
  return typeof v.requestVideoFrameCallback === "function";
};

// EMA smoothing cho bbox
function emaBox(prev, cur, alpha = 0.25) {
  if (!prev) return cur;
  return {
    x: prev.x + alpha * (cur.x - prev.x),
    y: prev.y + alpha * (cur.y - prev.y),
    width: prev.width + alpha * (cur.width - prev.width),
    height: prev.height + alpha * (cur.height - prev.height),
  };
}

// Ép khung portrait + padding + clamp
function padPortraitBox(bb, padRatio, overlayW, overlayH, aspect = PORTRAIT_ASPECT) {
  let { x, y, width: w, height: h } = bb;

  if (w <= 1 && h <= 1) {
    x *= overlayW; y *= overlayH; w *= overlayW; h *= overlayH;
  }

  const cx = x + w / 2, cy = y + h / 2;
  let newW = Math.max(w, h / aspect);
  let newH = Math.max(h, newW * aspect);

  const p = padRatio ?? 0.12;
  newW *= (1 + p);
  newH *= (1 + p);

  let nx = cx - newW / 2, ny = cy - newH / 2;
  nx = Math.max(0, Math.min(nx, overlayW - newW));
  ny = Math.max(0, Math.min(ny, overlayH - newH));
  newW = Math.min(newW, overlayW - nx);
  newH = Math.min(newH, overlayH - ny);

  return { x: nx, y: ny, width: newW, height: newH };
}

export default function FaceCheckin() {
  // ===== Refs & state =====
  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const analysisCanvasRef = useRef(null);
  const navigate = useNavigate();

  const loopHandleRef = useRef(null);
  const lastRecognizeAtRef = useRef(0);
  const matchedRef = useRef(null);
  const previewTokenRef = useRef(null);
  const stableStartRef = useRef(null);
  const smoothBoxRef = useRef(null);
  const lastFacesRef = useRef([]);
  const lastFaceTsRef = useRef(0);
  const detectorRef = useRef(null);
  const isPausedRef = useRef(false);

  const [ready, setReady] = useState(false);
  const [detectorReady, setDetectorReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [matched, setMatched] = useState(null);
  const [previewToken, setPreviewToken] = useState(null);
  const [stableStart, setStableStart] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [modalType, setModalType] = useState("success");

  // Nhận JSX (hoặc chuỗi text thuần) thay vì chuỗi HTML — tránh phải dùng
  // dangerouslySetInnerHTML với dữ liệu tên nhân viên lấy từ BE (rủi ro XSS
  // nếu tên nhân viên trong DB từng chứa thẻ HTML/script độc).
  function showModal(content, type = "success") {
    setModalContent(content);
    setModalType(type);
    setModalOpen(true);
    setTimeout(() => setModalOpen(false), 3000);
  }

  // ===== Overlay helpers =====
  function syncOverlaySize() {
    const video = videoRef.current;
    const overlay = overlayRef.current;
    if (!video || !overlay) return;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return;
    overlay.width = w;
    overlay.height = h;
  }

  function clearOverlay() {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext("2d");
    ctx.clearRect(0, 0, overlay.width, overlay.height);
  }

  function drawBoxes(faces, label) {
    syncOverlaySize();
    const overlay = overlayRef.current;
    if (!overlay || !overlay.width || !overlay.height) return;
    const ctx = overlay.getContext("2d");
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    faces.forEach((f) => {
      const bb0 = f.boundingBox || {};
      let bb = padPortraitBox(bb0, 0.15, overlay.width, overlay.height);
      bb = (smoothBoxRef.current = emaBox(smoothBoxRef.current, bb, 0.25));

      if (MIRRORED) bb.x = overlay.width - (bb.x + bb.width);

      ctx.lineWidth = 3;
      ctx.strokeStyle = "#00ff00";
      ctx.strokeRect(bb.x, bb.y, bb.width, bb.height);

      if (label) {
        ctx.font = "16px Segoe UI, Tahoma, sans-serif";
        const pad = 10, lh = 26;
        const tw = ctx.measureText(label).width + pad * 2;
        const bx = Math.max(10, Math.min(bb.x, overlay.width - tw - 10));
        const by = Math.max(10, bb.y - lh - 6);
        ctx.fillStyle = "rgba(25,135,84,0.9)";
        ctx.fillRect(bx, by, tw, lh);
        ctx.fillStyle = "#fff";
        ctx.textBaseline = "middle";
        ctx.fillText(label, bx + pad, by + lh / 2);
      }
    });
  }

  // ===== Chụp frame để gửi BE =====
  function drawToAnalysisCanvas(targetW = 320) {
    const v = videoRef.current;
    const c = analysisCanvasRef.current || (analysisCanvasRef.current = document.createElement("canvas"));
    if (!v || !v.videoWidth) return null;
    const scale = targetW / v.videoWidth;
    const w = Math.round(v.videoWidth * scale);
    const h = Math.round(v.videoHeight * scale);
    c.width = w; c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true, desynchronized: true });
    ctx.drawImage(v, 0, 0, w, h);
    return c;
  }

  function snapBase64(quality = 0.85) {
    const c = drawToAnalysisCanvas(360);
    if (!c) return null;
    return c.toDataURL("image/jpeg", quality);
  }

  async function collectFrames(durationMs = 1200, stepMs = 120, quality = 0.76) {
    const frames = [];
    const start = performance.now();
    while (performance.now() - start < durationMs) {
      const dataURL = snapBase64(quality);
      if (dataURL) frames.push(dataURL);
      await new Promise((r) => setTimeout(r, stepMs));
    }
    return frames;
  }

  function varianceOfLaplacian(imageData) {
    const gray = [];
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      gray.push(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    }
    const w = imageData.width;
    const h = imageData.height;
    const lap = [];
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x;
        const val = -gray[idx - w] - gray[idx - 1] + 4 * gray[idx] - gray[idx + 1] - gray[idx + w];
        lap.push(val);
      }
    }
    const mean = lap.reduce((a, b) => a + b, 0) / (lap.length || 1);
    const variance = lap.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (lap.length || 1);
    return variance;
  }

  // ===== API =====
  async function apiRecognize() {
    const dataURL = snapBase64(0.85);
    if (!dataURL) { dlog("No dataURL for recognize"); return null; }
    try {
      const res = await fetch(`${API_BASE}/api/face/recognize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Device-Token": getDeviceToken(),
        },
        body: JSON.stringify({ image_base64: dataURL }),
      });
      const data = await res.json();
      dlog("recognize:", res.status, data);
      // trả thêm status để biết 400/404
      return { ok: res.ok && data?.ok !== false, status: res.status, data };
    } catch (e) {
      dlog("recognize error:", e);
      return null;
    }
  }

  async function apiCheckinWithToken(token, frames) {
    const payload = (frames && frames.length)
      ? { frames, preview_token: token }
      : { image_base64: snapBase64(0.92), preview_token: token };
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/face-checkin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Device-Token": getDeviceToken(),
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      dlog("checkin:", res.status, data);
      return { ok: res.ok && data?.ok !== false, data };
    } catch (e) {
      dlog("checkin error:", e);
      return { ok: false, data: null };
    } finally {
      setLoading(false);
    }
  }

  // ===== Vòng lặp khung hình =====
  function scheduleLoop(video) {
    if (supportsRVFC() && video?.requestVideoFrameCallback) {
      loopHandleRef.current = video.requestVideoFrameCallback((now, meta) => loop(now, meta));
    } else {
      loopHandleRef.current = requestAnimationFrame((now) => loop(now));
    }
  }

  function cancelLoop(video) {
    if (!loopHandleRef.current) return;
    if (supportsRVFC() && video?.cancelVideoFrameCallback) {
      video.cancelVideoFrameCallback(loopHandleRef.current);
    } else {
      cancelAnimationFrame(loopHandleRef.current);
    }
    loopHandleRef.current = null;
  }

  function hardPauseCamera(ms = PAUSE_AFTER_SUCCESS_MS) {
    if (isPausedRef.current) return;
    isPausedRef.current = true;
    setCooldown(true);

    cancelLoop(videoRef.current);
    const tracks = videoRef.current?.srcObject?.getVideoTracks?.() || [];
    tracks.forEach(t => (t.enabled = false));

    setMatched(null); matchedRef.current = null;
    setPreviewToken(null); previewTokenRef.current = null;
    setStableStart(null); stableStartRef.current = null;
    lastFacesRef.current = [];
    smoothBoxRef.current = null;
    clearOverlay();

    setTimeout(() => {
      tracks.forEach(t => (t.enabled = true));
      isPausedRef.current = false;
      setCooldown(false);

      if (ready && detectorReady && !loopHandleRef.current) {
        scheduleLoop(videoRef.current);
      }
    }, ms);
  }

  async function recognizeTick(ts) {
    if (isPausedRef.current) return;
    if (cooldown || loading) { dlog("skip recognize: cooldown/loading"); return; }
    if (ts - lastRecognizeAtRef.current < RECOGNIZE_EVERY) { return; }
    lastRecognizeAtRef.current = ts;

    const res = await apiRecognize();
    if (!res) {
      // request lỗi hẳn -> clear
      setMatched(null); matchedRef.current = null;
      setPreviewToken(null); previewTokenRef.current = null;
      setStableStart(null); stableStartRef.current = null;
      return;
    }

    // === CASE 1: BE bảo mặt quá nhỏ -> giữ nguyên matched hiện tại ===
    if (!res.ok && res.status === 400 && res.data?.reason === "face_too_small") {
      dlog("face too small -> keep previous matched");
      // không reset matched, chỉ vẽ lại khung ở loop
      return;
    }

    // === CASE 2: không khớp nhân viên nào -> clear như cũ ===
    if (!res.ok) {
      dlog("recognize failed or not ok");
      setMatched(null); matchedRef.current = null;
      setPreviewToken(null); previewTokenRef.current = null;
      setStableStart(null); stableStartRef.current = null;
      return;
    }

    // === CASE 3: OK, có nhân viên ===
    const nv = res.data?.nhan_vien || null;
    const token = res.data?.preview_token || null;

    const prevId = matchedRef.current?.id;
    const newId = nv?.id;

    if (prevId !== newId) {
      matchedRef.current = nv; setMatched(nv);
      const now = performance.now();
      stableStartRef.current = nv ? now : null;
      setStableStart(nv ? now : null);
    }

    previewTokenRef.current = token;
    setPreviewToken(token);
    matchedRef.current = nv;
  }


  async function loop(ts) {
    if (isPausedRef.current) {
      scheduleLoop(videoRef.current);
      return;
    }

    if (!ready || !detectorReady || cooldown || loading) {
      scheduleLoop(videoRef.current);
      return;
    }
    const v = videoRef.current;
    if (!v || !v.videoWidth || !v.videoHeight) {
      scheduleLoop(videoRef.current);
      return;
    }

    try {
      if (detectorRef.current && typeof detectorRef.current.detect === "function") {
        let faces = await detectorRef.current.detect(v);
        dlog("detector=", detectorRef.current?.name, "faces=", faces?.length, faces?.[0]?.boundingBox);

        const nowTs = performance.now();
        if (!faces || faces.length === 0) {
          if (nowTs - lastFaceTsRef.current < KEEP_FACE_MS && lastFacesRef.current.length) {
            faces = lastFacesRef.current;
          }
        } else {
          lastFacesRef.current = faces;
          lastFaceTsRef.current = nowTs;
        }

        if (faces && faces.length) {
          await recognizeTick(ts);

          const nvNow = matchedRef.current;
          const label = nvNow ? ` ${nvNow.ho_ten}` : "Chưa tìm thấy dữ liệu nhân viên";
          drawBoxes(faces, label);

          const tokenNow = previewTokenRef.current;
          const stableElapsed = stableStartRef.current ? (performance.now() - stableStartRef.current) : 0;
          const enoughStable = !!(nvNow && stableElapsed >= STABLE_MS);
          dlog("check conditions:", { nvId: nvNow?.id, ho_ten: nvNow?.ho_ten, stableElapsed: Math.round(stableElapsed), enoughStable, hasToken: !!tokenNow });

          if (enoughStable && tokenNow) {
            const c = drawToAnalysisCanvas(320);
            if (c) {
              const ctx = c.getContext("2d", { willReadFrequently: true });
              const imgData = ctx.getImageData(0, 0, c.width, c.height);
              const sharp = varianceOfLaplacian(imgData);
              dlog("sharp=", Math.round(sharp), "threshold=", BLUR_THRESHOLD);

              if (sharp >= BLUR_THRESHOLD) {
                const frames = await collectFrames(1200, 120, 0.76);
                const result = await apiCheckinWithToken(tokenNow, frames);
                if (result.ok) {
                  const message = result.data?.message || "Thành công";
                  const nvName = (result.data?.nhan_vien && result.data.nhan_vien.ho_ten) || (nvNow && nvNow.ho_ten) || "";
                  const time = result.data?.time || "";
                  showModal(
                    <>
                      ✅ {message} <strong style={{ fontWeight: 900, color: "white" }}>{nvName}</strong>
                      <br />
                      <small>Thời gian: <strong style={{ fontWeight: 900, color: "white" }}>{time}</strong></small>
                    </>,
                    "success"
                  );

                  hardPauseCamera(PAUSE_AFTER_SUCCESS_MS);
                  setMatched(null); matchedRef.current = null;
                  setPreviewToken(null); previewTokenRef.current = null;
                  setStableStart(null); stableStartRef.current = null;
                } else {
                  const nvName = result.data?.name || (nvNow && nvNow.ho_ten) || "";
                  showModal(
                    <>
                      ❌ {result.data?.message || "Chấm công thất bại"}
                      {nvName && <> <strong style={{ fontWeight: 900, color: "white" }}>{nvName}</strong></>}
                    </>,
                    "danger"
                  );
                }
              } else {
                dlog("blocked: image too blur");
              }
            }
          }
        } else {
          if (performance.now() - lastFaceTsRef.current >= 400) {
            clearOverlay();
            setMatched(null); matchedRef.current = null;
            setPreviewToken(null); previewTokenRef.current = null;
            setStableStart(null); stableStartRef.current = null;
            smoothBoxRef.current = null;
            lastFacesRef.current = [];
          }
        }
      } else {
        dlog("Detector not ready/available");
        clearOverlay();
      }
    } catch (e) {
      dlog("loop error:", e);
      clearOverlay();
    } finally {
      scheduleLoop(videoRef.current);
    }
  }

  // ===== Khởi tạo detector =====
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const det = await createFaceDetector();
        if (!cancelled) {
          detectorRef.current = det;
          setDetectorReady(true);
          dlog("Using detector:", det?.name);
        }
      } catch (e) {
        if (!cancelled) {
          detectorRef.current = null;
          setDetectorReady(false);
          console.error("Detector init error", e);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ===== Lifecycle camera =====
  useEffect(() => {
    let stream = null;
    const playOnceRef = { current: false };

    const tryPlay = (video) => {
      if (!video || playOnceRef.current) return;
      playOnceRef.current = true;
      video.playsInline = true;
      video.muted = true;
      syncOverlaySize();
      video.play()
        .then(() => {
          setReady(true);
          dlog("camera ready", { width: video.videoWidth, height: video.videoHeight });
        })
        .catch((err) => {
          if (err?.name === "AbortError") {
            playOnceRef.current = false;
          } else {
            console.warn("video.play() error:", err);
          }
        });
    };

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
        const video = videoRef.current;
        if (video) {
          const onLoadedMeta = () => tryPlay(video);
          const onCanPlay = () => tryPlay(video);
          video.addEventListener("loadedmetadata", onLoadedMeta);
          video.addEventListener("canplay", onCanPlay);

          video.srcObject = stream;
          if (video.readyState >= 2) tryPlay(video);

          return () => {
            video.removeEventListener("loadedmetadata", onLoadedMeta);
            video.removeEventListener("canplay", onCanPlay);
          };
        }
      } catch (err) {
        console.error(err);
        showModal("❌ Không thể truy cập camera", "danger");
      }
    })();

    const onResize = () => syncOverlaySize();
    const onVis = () => {
      if (document.hidden) {
        if (loopHandleRef.current) cancelLoop(videoRef.current);
      } else if (!loopHandleRef.current && ready && detectorReady && !isPausedRef.current) {
        scheduleLoop(videoRef.current);
      }
    };
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
      if (loopHandleRef.current) cancelLoop(videoRef.current);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [detectorReady]);

  useEffect(() => {
    if (ready && detectorReady && !loopHandleRef.current && !isPausedRef.current) {
      scheduleLoop(videoRef.current);
    }
    return () => {
      if (loopHandleRef.current) cancelLoop(videoRef.current);
    };
  }, [ready, detectorReady]);

  return (
    <div className="p-4 ps-5" style={{ minHeight: "100vh" }}>
      {/* Header Section */}
      <div
        className="rounded-4 mb-4 shadow-sm"
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          padding: "2rem",
          color: "white"
        }}
      >
        <div className="d-flex justify-content-between align-items-center">
          <div>
            {/* <Breadcrumb className="mb-3">
              <Breadcrumb.Item active style={{ color: "white" }}
              >
                <FaHome className="me-2" />
                Trang chủ
              </Breadcrumb.Item>
              <Breadcrumb.Item active style={{ color: "white" }}>
                Chấm công khuôn mặt
              </Breadcrumb.Item>
            </Breadcrumb> */}
            <h1 className="fw-bold mb-2">🤖 Chấm công Tự động</h1>
            <p className="mb-0 opacity-90">
              Hệ thống nhận diện khuôn mặt tự động - Giữ ổn định để chấm công
            </p>
          </div>
          {/* <Button
            variant="outline-light"
            onClick={() => navigate("/")}
            className="border-0"
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(10px)"
            }}
          >
            <FaHome className="me-2" />
            Trang chủ
          </Button> */}
        </div>
      </div>

      <Row className="g-4 justify-content-center">
        {/* Camera Section */}
        <Col lg={8}>
          <Card className="shadow-sm border-0 rounded-4">
            <Card.Header
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                fontWeight: "600",
                fontSize: "1.1rem"
              }}
            >
              <FaCamera className="me-2" />
              Camera nhận diện
            </Card.Header>
            <Card.Body className="p-4 text-center">
              <div className="position-relative d-inline-block">
                <div
                  style={{
                    width: "100%",
                    maxWidth: "600px",
                    borderRadius: "16px",
                    border: "3px solid #e2e8f0",
                    boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
                    overflow: "hidden",
                    backgroundColor: "#000"
                  }}
                >
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    style={{
                      width: "100%",
                      height: "auto",
                      display: "block",
                    }}
                  />
                  <canvas
                    ref={overlayRef}
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      pointerEvents: "none",
                    }}
                  />
                </div>

                {/* Loading Overlay */}
                {loading && (
                  <div
                    className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center rounded-4"
                    style={{
                      background: "rgba(0, 0, 0, 0.8)",
                      zIndex: 10
                    }}
                  >
                    <div className="text-center text-white">
                      <Spinner animation="border" variant="light" size="lg" />
                      <div className="mt-3 fw-semibold fs-5">Đang xử lý chấm công...</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Information */}
              <div className="mt-4">
                <Row className="g-3 justify-content-center">
                  <Col xs="auto">
                    {matched ? (
                      <Badge bg="success" className="fs-6 px-3 py-2">
                        <FaUserCheck className="me-2" />
                        Đã nhận diện: {matched.ho_ten}
                      </Badge>
                    ) : (
                      <Badge bg="secondary" className="fs-6 px-3 py-2">
                        <FaUserTimes className="me-2" />
                        Đang tìm khuôn mặt...
                      </Badge>
                    )}
                  </Col>

                  <Col xs="auto">
                    {loading ? (
                      <Badge bg="warning" text="dark" className="fs-6 px-3 py-2">
                        <FaSyncAlt className="me-2" />
                        Đang xử lý...
                      </Badge>
                    ) : isPausedRef.current || cooldown ? (
                      <Badge bg="secondary" className="fs-6 px-3 py-2">
                        <FaClock className="me-2" />
                        Tạm nghỉ {PAUSE_AFTER_SUCCESS_MS / 1000}s...
                      </Badge>
                    ) : ready && detectorReady ? (
                      <Badge bg="success" className="fs-6 px-3 py-2">
                        <FaCheckCircle className="me-2" />
                        Sẵn sàng
                      </Badge>
                    ) : (
                      <Badge bg="danger" className="fs-6 px-3 py-2">
                        <FaExclamationTriangle className="me-2" />
                        Đang khởi tạo...
                      </Badge>
                    )}
                  </Col>
                </Row>

                {/* Countdown Timer */}
                {matched && stableStart && (
                  <div className="mt-3">
                    <div className="progress" style={{ height: "8px", maxWidth: "300px", margin: "0 auto" }}>
                      <div
                        className="progress-bar progress-bar-striped progress-bar-animated"
                        style={{
                          width: `${Math.min(100, (performance.now() - stableStart) / STABLE_MS * 100)}%`
                        }}
                      />
                    </div>
                    <small className="text-muted mt-2 d-block">
                      Giữ ổn định để chấm công... ({Math.max(0, STABLE_MS - (performance.now() - stableStart)).toFixed(0)}ms)
                    </small>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Instructions Section */}
        <Col lg={4}>
          <Card className="shadow-sm border-0 rounded-4 h-100">
            <Card.Header
              style={{
                background: "linear-gradient(135deg, #48bb78 0%, #38a169 100%)",
                color: "white",
                fontWeight: "600"
              }}
            >
              <FaLightbulb className="me-2" />
              Hướng dẫn sử dụng
            </Card.Header>
            <Card.Body>
              <div className="text-start">
                <div className="d-flex align-items-start mb-3">
                  <div className="bg-primary rounded-circle p-2 me-3 flex-shrink-0">
                    <FaCamera className="text-white" />
                  </div>
                  <div>
                    <h6 className="fw-semibold mb-1">Bước 1: Định vị camera</h6>
                    <p className="text-muted mb-0 small">Đứng trước camera với khuôn mặt rõ ràng, ánh sáng đầy đủ</p>
                  </div>
                </div>

                <div className="d-flex align-items-start mb-3">
                  <div className="bg-success rounded-circle p-2 me-3 flex-shrink-0">
                    <FaUserCheck className="text-white" />
                  </div>
                  <div>
                    <h6 className="fw-semibold mb-1">Bước 2: Chờ nhận diện</h6>
                    <p className="text-muted mb-0 small">Hệ thống tự động nhận diện và hiển thị tên của bạn</p>
                  </div>
                </div>

                <div className="d-flex align-items-start">
                  <div className="bg-info rounded-circle p-2 me-3 flex-shrink-0">
                    <FaCheckCircle className="text-white" />
                  </div>
                  <div>
                    <h6 className="fw-semibold mb-1">Bước 3: Giữ ổn định</h6>
                    <p className="text-muted mb-0 small">Giữ nguyên vị trí để hệ thống chấm công tự động</p>
                  </div>
                </div>
              </div>

              <Alert variant="info" className="mt-4">
                <strong>💡 Mẹo:</strong>
                <ul className="mb-0 mt-2 small">
                  <li>Đảm bảo khuôn mặt được chiếu sáng đều</li>
                  <li>Giữ khoảng cách 0.5 – 1 mét với camera (gần quá sẽ out nét)</li>
                  <li>Tránh đeo kính râm hoặc vật che mặt</li>
                </ul>
              </Alert>

            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Result Modal */}
      <Modal show={modalOpen} onHide={() => setModalOpen(false)} centered className="rounded-4">
        <Modal.Body
          className="text-center p-5"
          style={{
            background: modalType === "success"
              ? "linear-gradient(135deg, #48bb78 0%, #38a169 100%)"
              : "linear-gradient(135deg, #f56565 0%, #e53e3e 100%)",
            color: "white"
          }}
        >
          <div className="mb-3">
            {modalType === "success" ? (
              <FaCheckCircle size={48} />
            ) : (
              <FaExclamationTriangle size={48} />
            )}
          </div>
          <div>{modalContent}</div>
        </Modal.Body>
      </Modal>
    </div>
  );
}
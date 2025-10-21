import React, { useEffect, useRef, useState } from "react";
import { createFaceDetector } from "../../lib/faceDetectorFallback";

const API_BASE = "http://127.0.0.1:5000";
const RECOGNIZE_EVERY = 1300; // ms
const STABLE_MS = 1500;       // ms
const COOLDOWN_MS = 5000;     // ms
// Giảm giật & tiết kiệm CPU
const DETECT_EVERY_MS = 90;   // chỉ detect mỗi ~90ms; giữa các lần sẽ dùng kết quả gần nhất
const KEEP_FACE_MS = 600;     // nếu miss tạm 1-2 frame thì vẫn giữ khung trong 600ms

// Box portrait (cao hơn ngang). Ví dụ 1.25 = cao hơn ngang 25%
// Bạn có thể chỉnh 1.2–1.35 tuỳ gu.
const PORTRAIT_ASPECT = 1.25;

// Ngưỡng ảnh
const BLUR_THRESHOLD = 20; // hạ tạm để dễ pass
const DEBUG = false;       // bật/tắt console.log
const MIRRORED = false;    // bật true nếu bạn mirror video (scaleX(-1))

// ===== Utils =====
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

// Quy về hộp vuông + padding quanh tâm, clamp trong khung
// Quy về hộp portrait (cao hơn ngang) + padding quanh tâm, clamp trong khung
function padPortraitBox(bb, padRatio, overlayW, overlayH, aspect = PORTRAIT_ASPECT) {
  let { x, y, width: w, height: h } = bb;
  // normalized → pixels
  if (w <= 1 && h <= 1) {
    x *= overlayW; y *= overlayH; w *= overlayW; h *= overlayH;
  }
  // lấy kích thước “gần gũi” với detector, rồi ép tỉ lệ dọc > ngang
  const cx = x + w / 2, cy = y + h / 2;
  let newW = Math.max(w, h / aspect);
  let newH = Math.max(h, newW * aspect);

  // padding nhẹ
  const p = padRatio ?? 0.12;
  newW *= (1 + p);
  newH *= (1 + p);

  // chuyển về (x,y,w,h) & clamp
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
  const canvasRef = useRef(null); // nếu cần chụp ẩn
  const analysisCanvasRef = useRef(null);

  const loopHandleRef = useRef(null);

  const lastRecognizeAtRef = useRef(0);
  const matchedRef = useRef(null);
  const previewTokenRef = useRef(null);
  const stableStartRef = useRef(null);

  const smoothBoxRef = useRef(null);
  const lastFacesRef = useRef([]);
  const lastFaceTsRef = useRef(0);
  const boxHistoryRef = useRef([]); // lưu 5–7 bbox gần nhất
  const lastDetectAtRef = useRef(0);
  const detectorRef = useRef(null);

  const [ready, setReady] = useState(false);
  const [detectorReady, setDetectorReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(false);

  const [matched, setMatched] = useState(null);        // { id, ho_ten } | null
  const [previewToken, setPreviewToken] = useState(null);
  const [stableStart, setStableStart] = useState(null); // hiển thị “đang chờ 2s…”

  // Modal đơn giản
  const [modalOpen, setModalOpen] = useState(false);
  const [modalHtml, setModalHtml] = useState("");
  const [modalType, setModalType] = useState("success");
  function showModal(html, type = "success") {
    setModalHtml(html);
    setModalType(type);
    setModalOpen(true);
    setTimeout(() => setModalOpen(false), 3000);
  }
  function closeModal() { setModalOpen(false); }

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

      // Clamp
      bb.x = Math.max(0, Math.min(bb.x, overlay.width - 2));
      bb.y = Math.max(0, Math.min(bb.y, overlay.height + 2));
      bb.width = Math.max(2, Math.min(bb.width, overlay.width - bb.x));
      bb.height = Math.max(2, Math.min(bb.height, overlay.height - bb.y));

      // Vẽ
      const pad = 10, lh = 26;
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#00ff00";
      ctx.strokeRect(bb.x, bb.y, bb.width, bb.height);

      if (label) {
        ctx.font = "16px Segoe UI, Tahoma, sans-serif";
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
  function median(arr) {
    if (!arr.length) return 0;
    const a = [...arr].sort((a, b) => a - b);
    const m = Math.floor(a.length / 2);
    return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
  }

  function medianBox(history) {
    if (!history.length) return null;
    return {
      x: median(history.map(b => b.x)),
      y: median(history.map(b => b.y)),
      width: median(history.map(b => b.width)),
      height: median(history.map(b => b.height)),
    };
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

  async function collectFrames(durationMs = 1200, stepMs = 150, quality = 0.72) {
    const frames = [];
    const start = performance.now();
    while (performance.now() - start < durationMs) {
      const dataURL = snapBase64(quality);
      if (dataURL) frames.push(dataURL);
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, stepMs));
    }
    return frames;
  }

  // Độ nét ảnh – Variance of Laplacian (approx)
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_base64: dataURL }),
      });
      const data = await res.json();
      dlog("recognize:", res.status, data);
      return { ok: res.ok && data?.ok !== false, data };
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
        headers: { "Content-Type": "application/json" },
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

  // ===== Tick nhận diện nhanh =====
  async function recognizeTick(ts) {
    if (cooldown || loading) { dlog("skip recognize: cooldown/loading"); return; }
    if (ts - lastRecognizeAtRef.current < RECOGNIZE_EVERY) { return; }
    lastRecognizeAtRef.current = ts;

    const res = await apiRecognize();
    if (!res || !res.ok) {
      dlog("recognize failed or not ok");
      setMatched(null); matchedRef.current = null;
      setPreviewToken(null); previewTokenRef.current = null;
      setStableStart(null); stableStartRef.current = null;
      return;
    }

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

  // ===== Loop chính =====
  async function loop(ts) {
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

        // smoothing giữ khung 400ms nếu tạch 1-2 frame
        const nowTs = performance.now();
        if (!faces || faces.length === 0) {
          if (nowTs - lastFaceTsRef.current < 400 && lastFacesRef.current.length) {
            faces = lastFacesRef.current;
          }
        } else {
          lastFacesRef.current = faces;
          lastFaceTsRef.current = nowTs;
        }

        if (faces && faces.length) {
          // 1) Nhận diện để lấy tên/token
          await recognizeTick(ts);

          // 2) Vẽ khung
          const nvNow = matchedRef.current;
          const label = nvNow ? ` ${nvNow.ho_ten}${stableStartRef.current ? "" : ""}` : "Chưa tìm thấy dữ liệu nhân viên";
          drawBoxes(faces, label);

          // 3) Nếu đủ ổn định + ảnh đủ nét → chấm công
          const tokenNow = previewTokenRef.current;
          const stableElapsed = stableStartRef.current ? (performance.now() - stableStartRef.current) : 0;
          const enoughStable = !!(nvNow && stableElapsed >= STABLE_MS);
          dlog("check conditions:", { nvId: nvNow?.id, ho_ten: nvNow?.ho_ten, stableElapsed: Math.round(stableElapsed), enoughStable, hasToken: !!tokenNow });

          if (enoughStable && tokenNow) {
            const imgData = (() => {
              const c = drawToAnalysisCanvas(320);
              if (!c) return null;
              const ctx = c.getContext("2d", { willReadFrequently: true });
              return ctx.getImageData(0, 0, c.width, c.height);
            })();
            const sharp = imgData ? varianceOfLaplacian(imgData) : 0;
            dlog("sharp=", Math.round(sharp), "threshold=", BLUR_THRESHOLD);

            if (sharp >= BLUR_THRESHOLD) {
              const frames = await collectFrames(2500, 120, 0.76);
              const result = await apiCheckinWithToken(tokenNow, frames);
              if (result.ok) {
                const message = result.data?.message || "Thành công";
                const nvName = (result.data?.nhan_vien && result.data.nhan_vien.ho_ten) || (nvNow && nvNow.ho_ten) || "";
                const time = result.data?.time || "";
                showModal(
                  `✅ ${message} <strong style="font-weight:900;">${nvName}</strong><br/>
                   <small>Thời gian: <strong style="font-weight:900;">${time}</strong></small>`,
                  "success"
                );
                setCooldown(true);
                if (loopHandleRef.current) cancelLoop(videoRef.current);
                setTimeout(() => {
                  setCooldown(false);
                  if (ready && !loopHandleRef.current) scheduleLoop(videoRef.current);
                }, COOLDOWN_MS);

                // reset nhận diện cho lượt sau
                setMatched(null); matchedRef.current = null;
                setPreviewToken(null); previewTokenRef.current = null;
                setStableStart(null); stableStartRef.current = null;
              } else {
                const nvName = (result.data?.name || (nvNow && nvNow.ho_ten))
                  ? ` <strong style="font-weight:900;">${result.data?.name || nvNow.ho_ten}</strong>` : "";
                showModal(`❌ ${result.data?.message || "Chấm công thất bại"}${nvName}`, "danger");
              }
            } else {
              dlog("blocked: image too blur");
            }
          }
        } else {
          if (performance.now() - lastFaceTsRef.current >= 400) {
            clearOverlay();
            // reset khi mất mặt đủ lâu
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

  // ===== Khởi tạo detector (fallback) =====
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
      video.play().then(() => {
        setReady(true);
        dlog("camera ready", { width: video.videoWidth, height: video.videoHeight });
      }).catch((err) => {
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
      } else if (!loopHandleRef.current && ready && detectorReady) {
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

  // Start loop khi camera & detector đã sẵn sàng
  useEffect(() => {
    if (ready && detectorReady && !loopHandleRef.current) {
      scheduleLoop(videoRef.current);
    }
    return () => {
      if (loopHandleRef.current) cancelLoop(videoRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, detectorReady]);

  return (
    <div
      className="container py-5 text-center"
      style={{
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        backgroundColor: "#dee2e6",
      }}
    >
      <h2 className="mb-3" style={{ fontWeight: 600, color: "#343a40" }}>
        Chấm công
      </h2>
      <p className="text-muted mb-2">
        💡 Hệ thống nhận diện tên trước, sau đó tự chụp lại sau 2 giây ổn định để chấm công.
      </p>

      {/* Video + overlay */}
      <div
        className="position-relative d-inline-block"
        style={{
          width: "100%",
          maxWidth: 500,
          borderRadius: 12,
          border: "2px solid #2b2b2b",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
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
            borderRadius: 12,
            backgroundColor: "#000",
            display: "block",
            // Nếu cần mirror selfie:
            // transform: "scaleX(-1)",
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
            borderRadius: 12,
          }}
        />
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>

      <div className="mt-3">
        {matched && (
          <div className="mb-2">
            <strong>{stableStart && <span> Giữ 2giây để chấm công</span>}</strong>
          </div>
        )}
        {loading ? (
          <span className="badge bg-warning text-dark px-3 py-2">Đang xử lý…</span>
        ) : cooldown ? (
          <span className="badge bg-secondary px-3 py-2">Vui lòng đợi {COOLDOWN_MS / 1000}s</span>
        ) : ready && detectorReady ? (
          <span className="badge bg-success px-3 py-2">Sẵn sàng</span>
        ) : (
          <span className="badge bg-danger px-3 py-2">Camera/Detector chưa sẵn sàng</span>
        )}
      </div>

      {modalOpen && (
        <div className="modal show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header"><h5 className="modal-title">Thông báo</h5></div>
              <div className="modal-body" dangerouslySetInnerHTML={{ __html: modalHtml }} />
              <div className="modal-footer"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
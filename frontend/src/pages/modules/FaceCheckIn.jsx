import React, { useEffect, useRef, useState } from "react";
import { createFaceDetector } from "../../lib/faceDetectorFallback";

const API_BASE = "http://127.0.0.1:5000";

// Nhịp nhận diện & điều kiện
const RECOGNIZE_EVERY = 1300;         // ms: gọi /api/face/recognize tối đa ~1.3s/lần
const STABLE_MS = 800;               // ms: giữ ổn định trước khi chụp
const COOLDOWN_MS = 5000;             // ms: badge UI
const PAUSE_AFTER_SUCCESS_MS = 3000;  // ms: NGHỈ CAMERA 3s sau khi checkin
const MIN_GAP_BETWEEN_CHECKINS_MS = 60_000;   // 60s cho mọi người
const SAME_PERSON_GAP_MS = 120_000;
// Giảm giật & tiết kiệm CPU
const KEEP_FACE_MS = 600;   // miss tạm 1-2 frame vẫn giữ khung 600ms

// Khung portrait
const PORTRAIT_ASPECT = 1.25;

// Ngưỡng ảnh
const BLUR_THRESHOLD = 20; // hạ tạm để dễ pass
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

  // nếu là normalized -> đổi ra pixel
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

  const loopHandleRef = useRef(null);

  const lastRecognizeAtRef = useRef(0);
  const matchedRef = useRef(null);
  const previewTokenRef = useRef(null);
  const stableStartRef = useRef(null);

  const smoothBoxRef = useRef(null);
  const lastFacesRef = useRef([]);
  const lastFaceTsRef = useRef(0);
  const detectorRef = useRef(null);

  const isPausedRef = useRef(false); // ĐANG NGHỈ camera cứng

  const [ready, setReady] = useState(false);
  const [detectorReady, setDetectorReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(false);

  const [matched, setMatched] = useState(null);        // { id, ho_ten } | null
  const [previewToken, setPreviewToken] = useState(null);
  const [stableStart, setStableStart] = useState(null); // hiển thị “đang chờ ...s”

  // ===== Modal đơn giản =====
  const [modalOpen, setModalOpen] = useState(false);
  const [modalHtml, setModalHtml] = useState("");
  const [modalType, setModalType] = useState("success");
  function showModal(html, type = "success") {
    setModalHtml(html);
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

  // ===== Nghỉ camera (dừng loop hoàn toàn) =====
  function hardPauseCamera(ms = PAUSE_AFTER_SUCCESS_MS) {
    if (isPausedRef.current) return;
    isPausedRef.current = true;
    setCooldown(true);

    // Dừng vòng lặp
    cancelLoop(videoRef.current);

    // Tắt tạm video tracks
    const tracks = videoRef.current?.srcObject?.getVideoTracks?.() || [];
    tracks.forEach(t => (t.enabled = false));

    // Reset toàn bộ state nhận diện để tránh auto-chụp khi resume
    setMatched(null); matchedRef.current = null;
    setPreviewToken(null); previewTokenRef.current = null;
    setStableStart(null); stableStartRef.current = null;
    lastFacesRef.current = [];
    smoothBoxRef.current = null;
    clearOverlay();

    // Bật lại sau ms
    setTimeout(() => {
      tracks.forEach(t => (t.enabled = true));
      isPausedRef.current = false;
      setCooldown(false);

      // Khởi động lại loop
      if (ready && detectorReady && !loopHandleRef.current) {
        scheduleLoop(videoRef.current);
      }
    }, ms);
  }

  // ===== Tick nhận diện nhanh =====
  async function recognizeTick(ts) {
    if (isPausedRef.current) return;                  // đang nghỉ -> bỏ qua
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
    // Nếu đang nghỉ camera -> KHÔNG làm gì, chỉ lên lịch lần sau sau khi resume
    if (isPausedRef.current) {
      // không schedule liên tục khi pause, nhưng để đơn giản vẫn set lại frame tiếp theo
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

        // giữ khung 0.6s nếu miss
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
          // 1) Nhận diện để lấy tên/token
          await recognizeTick(ts);

          // 2) Vẽ khung
          const nvNow = matchedRef.current;
          const label = nvNow ? ` ${nvNow.ho_ten}` : "Chưa tìm thấy dữ liệu nhân viên";
          drawBoxes(faces, label);

          // 3) Nếu đủ ổn định + ảnh đủ nét → chấm công
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
                    `✅ ${message} <strong style="font-weight:900;">${nvName}</strong><br/>
                     <small>Thời gian: <strong style="font-weight:900;">${time}</strong></small>`,
                    "success"
                  );

                  // Nghỉ camera 3s (dừng loop và tắt track)
                  hardPauseCamera(PAUSE_AFTER_SUCCESS_MS);

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

  // Start loop khi camera & detector đã sẵn sàng
  useEffect(() => {
    if (ready && detectorReady && !loopHandleRef.current && !isPausedRef.current) {
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
        💡 Hệ thống nhận diện tên trước, sau đó tự chụp lại sau {STABLE_MS / 1000}s ổn định để chấm công.
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
      </div>

      <div className="mt-3">
        {matched && (
          <div className="mb-2">
            <strong>{stableStart && <span> Giữ 2s để chấm công</span>}</strong>
          </div>
        )}
        {loading ? (
          <span className="badge bg-warning text-dark px-3 py-2">Đang xử lý…</span>
        ) : isPausedRef.current || cooldown ? (
          <span className="badge bg-secondary px-3 py-2">Tạm nghỉ {PAUSE_AFTER_SUCCESS_MS / 1000}s…</span>
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

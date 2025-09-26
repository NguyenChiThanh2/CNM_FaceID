import React, { useEffect, useRef, useState } from "react";

const API_BASE = "http://127.0.0.1:5000";
const RECOGNIZE_EVERY = 800; // ms
const STABLE_MS = 1500;      // ms
const COOLDOWN_MS = 5000;   // ms

// Ngưỡng ảnh
const BLUR_THRESHOLD = 20; // hạ tạm để dễ pass
const DEBUG = true;       // bật/tắt console.log

export default function FaceCheckin() {
  // refs & state
  const videoRef = useRef(null);
  const canvasRef = useRef(null);   // chụp ảnh gửi BE
  const overlayRef = useRef(null);  // vẽ khung + label
  const rafRef = useRef(null);
  const lastRecognizeAtRef = useRef(0);

  const matchedRef = useRef(null);        // NV mới nhất cho frame hiện tại
  const previewTokenRef = useRef(null);   // token mới nhất cho frame hiện tại
  const stableStartRef = useRef(null);    // mốc bắt đầu “ổn định” theo frame

  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(false);

  const [matched, setMatched] = useState(null);        // { id, ho_ten } | null
  const [previewToken, setPreviewToken] = useState(null);
  const [stableStart, setStableStart] = useState(null); // chỉ để hiển thị “đang chờ 2s…”

  // Modal đơn giản
  const [modalOpen, setModalOpen] = useState(false);
  const [modalHtml, setModalHtml] = useState("");
  const [modalType, setModalType] = useState("success");
  function showModal(html, type = "success") {
    setModalHtml(html);
    setModalType(type);
    setModalOpen(true);
    setTimeout(() => {
      setModalOpen(false);
    }, 3000);
  }
  function closeModal() { setModalOpen(false); }

  // ===== Helpers =====
  const dlog = (...args) => DEBUG && console.log("[FaceCheckin]", ...args);

  function syncOverlaySize() {
    const video = videoRef.current;
    const overlay = overlayRef.current;
    if (!video || !overlay) return;
    const w = video.videoWidth || video.clientWidth || 0;
    const h = video.videoHeight || video.clientHeight || 0;
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
    if (!overlay) return;
    const ctx = overlay.getContext("2d");
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    ctx.lineWidth = 3;
    ctx.strokeStyle = "#0d6efd";
    ctx.font = "16px Segoe UI, Tahoma, sans-serif";
    const pad = 10, h = 26;

    faces.forEach((f) => {
      const bb = f.boundingBox || {};
      const x = bb.x, y = bb.y, width = bb.width, height = bb.height;
      if (!width || !height) return;
      ctx.strokeRect(x, y, width, height);

      if (!label) return; // không vẽ label nếu chưa có tên
      const tw = ctx.measureText(label).width + pad * 2;
      const bx = Math.max(10, Math.min(x, overlay.width - tw - 10));
      const by = Math.max(10, y - h - 6);
      ctx.fillStyle = "rgba(25,135,84,0.9)";
      ctx.fillRect(bx, by, tw, h);
      ctx.fillStyle = "#fff";
      ctx.textBaseline = "middle";
      ctx.fillText(label, bx + pad, by + h / 2);
    });
  }

  // Chụp frame hiện tại thành base64 jpeg
  function snapBase64(quality = 0.9) {
    const v = videoRef.current, c = canvasRef.current;
    if (!v || !c || !v.videoWidth) return null;
    c.width = v.videoWidth; c.height = v.videoHeight;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(v, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", quality);
  }
  // Gom 6–8 frames trong ~1.2s để BE kiểm tra liveness thụ động
  async function collectFrames(durationMs = 2500, stepMs = 120, quality = 0.76) {
    const frames = [];
    const start = performance.now();
    while (performance.now() - start < durationMs) {
      const dataURL = snapBase64(quality);
      if (dataURL) frames.push(dataURL);
      await new Promise((r) => setTimeout(r, stepMs));
    }
    return frames; // ~20 frames
  }

  // Đo độ nét ảnh: Variance of Laplacian (approx)
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
        const val =
          -gray[idx - w] - gray[idx - 1] + 4 * gray[idx] - gray[idx + 1] - gray[idx + w];
        lap.push(val);
      }
    }
    const mean = lap.reduce((a, b) => a + b, 0) / (lap.length || 1);
    const variance = lap.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (lap.length || 1);
    return variance;
  }

  function drawToCanvasAndGetImageData() {
    const v = videoRef.current, c = canvasRef.current;
    if (!v || !c || !v.videoWidth) return null;
    c.width = v.videoWidth; c.height = v.videoHeight;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(v, 0, 0, c.width, c.height);
    return ctx.getImageData(0, 0, c.width, c.height);
  }

  // ===== API calls =====
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
    // Nếu có frames thì gửi frames; không thì fallback 1 ảnh như cũ
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

  // ===== Nhận diện nhanh: cập nhật state + ref ngay trong frame =====
  async function recognizeTick(ts) {
    if (cooldown || loading) { dlog("skip recognize: cooldown/loading"); return; }
    if (ts - lastRecognizeAtRef.current < RECOGNIZE_EVERY) { return; }
    lastRecognizeAtRef.current = ts;

    const res = await apiRecognize();
    if (!res || !res.ok) {
      dlog("recognize failed or not ok");
      setMatched(null);
      matchedRef.current = null;
      setPreviewToken(null);
      previewTokenRef.current = null;
      setStableStart(null);
      stableStartRef.current = null;
      return;
    }

    const nv = res.data?.nhan_vien || null;
    const token = res.data?.preview_token || null;

    setMatched((prev) => {
      const changed = !prev || (nv && prev.id !== nv.id);
      if (changed || !stableStartRef.current) {
        const now = performance.now();
        stableStartRef.current = now; // mốc ổn định dùng cho logic
        setStableStart(now);          // chỉ phục vụ UI hiển thị
        dlog("recognized new or (re)start stable:", nv?.id, nv?.ho_ten);
      }
      return nv;
    });

    matchedRef.current = nv;             // tên dùng ngay trong frame
    setPreviewToken(token);
    previewTokenRef.current = token;     // token dùng ngay trong frame
  }

  // ===== Vòng lặp chính =====
  async function loop(ts) {
    if (!ready || cooldown || loading) {
      rafRef.current = requestAnimationFrame(loop);
      return;
    }

    const v = videoRef.current;
    if (!v || !v.videoWidth) {
      rafRef.current = requestAnimationFrame(loop);
      return;
    }

    try {
      if (window.FaceDetector) {
        const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 3 });
        const faces = await detector.detect(v);

        if (faces && faces.length) {
          // 1) Nhận diện TRƯỚC để có tên/token mới nhất
          await recognizeTick(ts);

          // 2) Vẽ khung với tên NV mới nhất (nếu có)
          const nvNow = matchedRef.current;
          const label = nvNow
            ? ` ${nvNow.ho_ten}${stableStartRef.current ? "" : ""}`
            : "Chưa tìm thấy dữ liệu nhân viên"; // để trống nếu chưa match
          drawBoxes(faces, label);

          // 3) Nếu đã đủ ổn định + ảnh đủ nét → chấm công
          const tokenNow = previewTokenRef.current; // dùng token mới nhất
          const stableElapsed = stableStartRef.current
            ? (performance.now() - stableStartRef.current)
            : 0;
          const enoughStable = !!(nvNow && stableElapsed >= STABLE_MS);

          dlog("check conditions:", {
            nvId: nvNow?.id,
            ho_ten: nvNow?.ho_ten,
            stableElapsed: Math.round(stableElapsed),
            enoughStable,
            hasToken: !!tokenNow,
          });

          if (enoughStable && tokenNow) {
            const imgData = drawToCanvasAndGetImageData();
            const sharp = imgData ? varianceOfLaplacian(imgData) : 0;
            dlog("sharp=", Math.round(sharp), "threshold=", BLUR_THRESHOLD);

            if (sharp >= BLUR_THRESHOLD) {
              // Gom 6–8 frames (~1.2s) để BE làm liveness thụ động
              const frames = await collectFrames(2500, 120, 0.76);
              const result = await apiCheckinWithToken(tokenNow, frames);
              if (result.ok) {
                const message = result.data?.message || "Thành công";
                const nvName =
                  (result.data?.nhan_vien && result.data.nhan_vien.ho_ten) ||
                  (nvNow && nvNow.ho_ten) || "";
                const time = result.data?.time || "";
                showModal(
                  `✅ ${message} <strong style="font-weight:900;">${nvName}</strong><br/>
                   <small>Thời gian: <strong style="font-weight:900;">${time}</strong></small>`,
                  "success"
                );
                setCooldown(true);
                setTimeout(() => setCooldown(false), COOLDOWN_MS);
              } else {
                const nvName =
                  (result.data?.name || (nvNow && nvNow.ho_ten))
                    ? ` <strong style="font-weight:900;">${result.data?.name || nvNow.ho_ten}</strong>`
                    : "";
                showModal(`❌ ${result.data?.message || "Chấm công thất bại"}${nvName}`, "danger");
              }

              // reset nhận diện cho lượt sau
              setMatched(null);
              matchedRef.current = null;
              setPreviewToken(null);
              previewTokenRef.current = null;
              setStableStart(null);
              stableStartRef.current = null;
            } else {
              dlog("blocked: image too blur");
            }
          } else {
            if (!nvNow) dlog("blocked: no matched nv");
            else if (!tokenNow) dlog("blocked: no preview token");
            else dlog("blocked: not enough stable ms");
          }
        } else {
          if (faces) dlog("no faces");
          clearOverlay();
          // mất mặt → reset
          setMatched(null);
          matchedRef.current = null;
          setPreviewToken(null);
          previewTokenRef.current = null;
          setStableStart(null);
          stableStartRef.current = null;
        }
      } else {
        dlog("FaceDetector not supported");
        clearOverlay();
      }
    } catch (e) {
      dlog("loop error:", e);
      clearOverlay();
    } finally {
      rafRef.current = requestAnimationFrame(loop);
    }
  }

  // ===== Lifecycle =====
  useEffect(() => {
    let stream = null;
    const playOnceRef = { current: false }; // chặn gọi play() nhiều lần

    const tryPlay = (video) => {
      if (!video || playOnceRef.current) return;
      playOnceRef.current = true;
      // playsInline + muted giúp autoplay ổn trên iOS/Chrome
      video.playsInline = true;
      video.muted = true;
      syncOverlaySize();
      video.play().then(() => {
        setReady(true);
        dlog("camera ready");
      }).catch((err) => {
        // AbortError do load mới -> bỏ qua, cho phép oncanplay gọi lại
        if (err?.name === "AbortError") {
          playOnceRef.current = false; // cho phép thử lại khi canplay
        } else {
          console.warn("video.play() error:", err);
        }
      });
    };

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 640, height: 480 },
          audio: false,
        });
        const video = videoRef.current;
        if (video) {
          // Gắn handlers TRƯỚC khi gán srcObject để không bỏ lỡ sự kiện
          const onLoadedMeta = () => tryPlay(video);
          const onCanPlay = () => tryPlay(video);
          video.addEventListener("loadedmetadata", onLoadedMeta);
          video.addEventListener("canplay", onCanPlay);

          video.srcObject = stream;
          // Nếu HMR hoặc readyState đã sẵn sàng, thử play ngay
          if (video.readyState >= 2) tryPlay(video);

          // cleanup handlers khi unmount
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
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      } else if (!rafRef.current && ready) {
        rafRef.current = requestAnimationFrame(loop);
      }
    };
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    if (ready && !rafRef.current) {
      rafRef.current = requestAnimationFrame(loop);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  return (
    <div
      className="container py-5 text-center"
      style={{
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        backgroundColor: "#f8f9fa",
      }}
    >
      <h2 className="mb-3" style={{ fontWeight: 600, color: "#343a40" }}>
        Chấm công
      </h2>
      <p className="text-muted mb-2">
        💡 Hệ thống nhận diện tên trước, sau đó tự chụp lại sau 2 giây ổn định để chấm công.
      </p>

      {/* Video + overlay */}
      <div className="position-relative d-inline-block" style={{ width: "100%", maxWidth: 500 }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{
            width: "100%",
            height: "auto",
            borderRadius: 12,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            border: "2px solid #dee2e6",
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
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>

      <div className="mt-3">
        {matched && (
          <div className="mb-2">
          <strong>{stableStart && <span> · đang chờ 2s…</span>}</strong>
            
          </div>
        )}
        {loading ? (
          <span className="badge bg-warning text-dark px-3 py-2">Đang xử lý…</span>
        ) : cooldown ? (
          <span className="badge bg-secondary px-3 py-2">Vui lòng đợi {COOLDOWN_MS / 1000}s</span>
        ) : ready ? (
          <span className="badge bg-success px-3 py-2">Sẵn sàng</span>
        ) : (
          <span className="badge bg-danger px-3 py-2">Camera chưa sẵn sàng</span>
        )}
      </div>

      {modalOpen && (
        <div className="modal show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header"><h5 className="modal-title">Thông báo</h5></div>
              <div className="modal-body" dangerouslySetInnerHTML={{ __html: modalHtml }} />
              <div className="modal-footer">
      
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

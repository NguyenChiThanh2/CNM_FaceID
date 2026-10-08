// src/lib/faceDetectorFallback.js
// FaceDetector ổn định cho production — ít log, pin version, có fallback & singleton.

const MEDIAPIPE_WASM_VERSION = "0.10.14";
const MEDIAPIPE_WASM_BASE =
    `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_WASM_VERSION}/wasm`;

// Ưu tiên model version ổn định
const REMOTE_MODELS = [
    "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
    "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float32/1/blaze_face_short_range.tflite",
    "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/int8/1/blaze_face_short_range.tflite",
];

let _detector = null;
let _destroy = null;
let _initPromise = null;

export async function createFaceDetector(options = {}) {
    if (_detector) return { name: "mediapipe-face-detector", detect: detectWrapper };
    if (_initPromise) return _initPromise;

    _initPromise = (async () => {
        const {
            minDetectionConfidence = 0.35,
            runningMode = "VIDEO",
            modelUrls = REMOTE_MODELS,
            wasmBase = MEDIAPIPE_WASM_BASE,
        } = options;

        const { FaceDetector, FilesetResolver } = await import("@mediapipe/tasks-vision");
        const vision = await FilesetResolver.forVisionTasks(wasmBase);

        for (const url of modelUrls) {
            try {
                _detector = await FaceDetector.createFromOptions(vision, {
                    baseOptions: { modelAssetPath: url },
                    runningMode,
                    minDetectionConfidence,
                });
                break;
            } catch {
                continue;
            }
        }

        if (!_detector) {
            return { name: "mediapipe-init-failed", async detect() { return []; } };
        }

        _destroy = async () => {
            try { if (_detector?.close) await _detector.close(); } catch { }
            _detector = null;
            _initPromise = null;
        };

        return { name: "mediapipe-face-detector", detect: detectWrapper };
    })();

    return _initPromise;
}

async function detectWrapper(videoEl) {
    if (!_detector || !videoEl) return [];
    const ts = performance.now();
    const res = _detector.detectForVideo(videoEl, ts);
    const faces = res?.detections || [];
    return faces.map((f) => {
        const bb = f.boundingBox || {};
        return {
            boundingBox: {
                x: bb.originX ?? bb.x ?? 0,
                y: bb.originY ?? bb.y ?? 0,
                width: bb.width ?? 0,
                height: bb.height ?? 0,
            },
        };
    });
}

export async function destroyFaceDetector() {
    if (_destroy) await _destroy();
    _destroy = null;
}

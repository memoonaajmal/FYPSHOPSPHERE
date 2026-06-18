"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import {
  FilesetResolver,
  HandLandmarker,
  FaceLandmarker,
  PoseLandmarker,
} from "@mediapipe/tasks-vision";
import styles from "../src/styles/ProductDetails.module.css";

const VISION_WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";


function sampleBgColor(data, w, h) {
  const patches = [
    [0, 0], [w - 5, 0], [0, h - 5], [w - 5, h - 5],
  ];
  const samples = [];
  for (const [ox, oy] of patches) {
    for (let dy = 0; dy < 5; dy++) {
      for (let dx = 0; dx < 5; dx++) {
        const i = ((oy + dy) * w + (ox + dx)) * 4;
        samples.push([data[i], data[i + 1], data[i + 2]]);
      }
    }
  }
  const med = (arr) => { arr.sort((a, b) => a - b); return arr[Math.floor(arr.length / 2)]; };
  return [
    med(samples.map((s) => s[0])),
    med(samples.map((s) => s[1])),
    med(samples.map((s) => s[2])),
  ];
}

function colorDist(r1, g1, b1, r2, g2, b2) {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

function floodFillMask(data, w, h, bgR, bgG, bgB, tolerance = 42) {
  const mask = new Uint8Array(w * h);
  const visited = new Uint8Array(w * h);
  const queue = [];
  const enqueue = (x, y) => {
    const idx = y * w + x;
    if (visited[idx]) return;
    visited[idx] = 1;
    const pi = idx * 4;
    if (colorDist(data[pi], data[pi + 1], data[pi + 2], bgR, bgG, bgB) < tolerance) {
      mask[idx] = 1;
      queue.push(idx);
    }
  };
  for (let x = 0; x < w; x++) { enqueue(x, 0); enqueue(x, h - 1); }
  for (let y = 0; y < h; y++) { enqueue(0, y); enqueue(w - 1, y); }
  const dirs = [-1, 1, -w, w];
  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    for (const d of dirs) {
      const nb = cur + d;
      if (nb < 0 || nb >= w * h) continue;
      if (d === -1 && cur % w === 0) continue;
      if (d === 1 && cur % w === w - 1) continue;
      if (visited[nb]) continue;
      visited[nb] = 1;
      const pi = nb * 4;
      if (colorDist(data[pi], data[pi + 1], data[pi + 2], bgR, bgG, bgB) < tolerance) {
        mask[nb] = 1;
        queue.push(nb);
      }
    }
  }
  return mask;
}

function shadowAlpha(r, g, b, bgR, bgG, bgB, shadowStrength = 0.85) {
  const dist = colorDist(r, g, b, bgR, bgG, bgB);
  const bgLum = (bgR + bgG + bgB) / 3;
  const pixLum = (r + g + b) / 3;
  const shadowRange = 90;
  if (dist < shadowRange && pixLum < bgLum) {
    const t = 1 - dist / shadowRange;
    return Math.max(0, 1 - t * shadowStrength);
  }
  return 1;
}

function featherMask(floatAlpha, w, h, radius = 2) {
  const out = new Float32Array(floatAlpha.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0, count = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const ny = y + dy, nx = x + dx;
          if (ny < 0 || ny >= h || nx < 0 || nx >= w) continue;
          sum += floatAlpha[ny * w + nx];
          count++;
        }
      }
      out[y * w + x] = sum / count;
    }
  }
  return out;
}

function removeBackground(img, { tolerance = 42, shadowStrength = 0.85, featherRadius = 2 } = {}) {
  return new Promise((resolve) => {
    const c = document.createElement("canvas");
    // willReadFrequently tells Chrome's compositor to keep this canvas in CPU
    // memory — avoids the silent failure when getImageData hits a GPU-backed canvas.
    const ctx = c.getContext("2d", { willReadFrequently: true });
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);
    const { width: w, height: h } = c;
    let imageData;
    try {
      imageData = ctx.getImageData(0, 0, w, h);
    } catch {
      // Canvas tainted (cross-origin) — skip removal, use raw image
      resolve(img);
      return;
    }
    const { data } = imageData;
    const [bgR, bgG, bgB] = sampleBgColor(data, w, h);
    const mask = floodFillMask(data, w, h, bgR, bgG, bgB, tolerance);
    const floatAlpha = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) {
      if (mask[i]) {
        floatAlpha[i] = 0;
      } else {
        const pi = i * 4;
        floatAlpha[i] = shadowAlpha(data[pi], data[pi + 1], data[pi + 2], bgR, bgG, bgB, shadowStrength);
      }
    }
    const smoothAlpha = featherRadius > 0 ? featherMask(floatAlpha, w, h, featherRadius) : floatAlpha;
    for (let i = 0; i < w * h; i++) {
      data[i * 4 + 3] = Math.round(smoothAlpha[i] * 255);
    }
    ctx.putImageData(imageData, 0, 0);
    const out = new Image();
    out.src = c.toDataURL("image/png");
    out.onload = () => resolve(out);
  });
}


function waitForVideoReady(video) {
  return new Promise((resolve) => {
    if (video.readyState >= 2 && video.videoWidth > 0) {
      resolve();
      return;
    }
    const onReady = () => {
      video.removeEventListener("loadedmetadata", onReady);
      video.removeEventListener("loadeddata", onReady);
      resolve();
    };
    video.addEventListener("loadedmetadata", onReady);
    video.addEventListener("loadeddata", onReady);
  });
}



export default function ARViewer({ product, baseUrl, openAnalyze = false, onClose = () => {} }) {
  const webcamRef    = useRef(null);
  const canvasRef    = useRef(null);

  const isProcessing = useRef(false);
  const rafId        = useRef(null);

  const [analyzeMode, setAnalyzeMode]   = useState(openAnalyze);
  const [overlayReady, setOverlayReady] = useState(null);
  const [overlayError, setOverlayError] = useState(false);
  const [detectors, setDetectors]       = useState({});
  const [measurements, setMeasurements] = useState({ recommendations: {} });

  // ── Overlay image loader ────────────────────────────────────────────────
  const loadOverlayImage = useCallback(() =>
    new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = `${baseUrl.replace(/\/$/, "")}/images/${product.imageFilename}`;
      img.onload = async () => {
        try {
          const cleaned = await removeBackground(img, {
            tolerance: 42,
            shadowStrength: 0.85,
            featherRadius: 2,
          });
          resolve(cleaned);
        } catch {
          resolve(img);
        }
      };
      img.onerror = () => { setOverlayError(true); resolve(null); };
    }),
  [baseUrl, product.imageFilename]);

  // ── Smoothing helpers ───────────────────────────────────────────────────
  const distPx = (a, b, w) => Math.hypot((a.x - b.x) * w, (a.y - b.y) * w);
  const smooth = (p, n, a = 0.25) => (p == null ? n : p * (1 - a) + n * a);

  // ── Load MediaPipe + overlay ────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    (async () => {
      let vision;
      try {
        vision = await FilesetResolver.forVisionTasks(VISION_WASM_URL);
      } catch (err) {
        console.error("FilesetResolver failed — WASM load error:", err);
        return;
      }

      const load = async (C, url, opt) => {
        try {
          return await C.createFromOptions(vision, {
            baseOptions: { modelAssetPath: url },
            runningMode: "VIDEO",
            ...opt,
          });
        } catch (err) {
          console.warn("Detector load failed:", url, err);
          return null;
        }
      };

      const [hand, face, pose] = await Promise.all([
        load(HandLandmarker,
          "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          { numHands: 2 }),
        load(FaceLandmarker,
          "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          { numFaces: 1 }),
        load(PoseLandmarker,
          "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker/float16/1/pose_landmarker.task",
          { numPoses: 1 }),
      ]);

      if (!mounted) return;
      setDetectors({ hand, face, pose });
      setOverlayReady(await loadOverlayImage());
    })();
    return () => { mounted = false; };
  }, [loadOverlayImage]);

  // ── Main render loop ────────────────────────────────────────────────────
  useEffect(() => {
    if (!detectors.face && !detectors.hand && !detectors.pose) return;

    let isMounted = true;
    const sm = {};

    const startLoop = async () => {
      const video = webcamRef.current?.video;
      const c     = canvasRef.current;
      if (!video || !c) return;

      const ctx = c.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      // FIX 3 — wait until Chrome has actual video dimensions before looping
      await waitForVideoReady(video);
      if (!isMounted) return;

      const draw = async () => {
        if (!isMounted) return;

   
        if (isProcessing.current) {
          rafId.current = requestAnimationFrame(draw);
          return;
        }

        isProcessing.current = true;

        try {
          ctx.clearRect(0, 0, c.width, c.height);
          ctx.drawImage(video, 0, 0, c.width, c.height);

          const now = performance.now();

          const [faceR, handR, poseR] = await Promise.all([
            detectors.face?.detectForVideo(video, now) ?? null,
            detectors.hand?.detectForVideo(video, now) ?? null,
            detectors.pose?.detectForVideo(video, now) ?? null,
          ]);

          const rec = {};

          if (faceR?.faceLandmarks?.[0]) {
            const f  = faceR.faceLandmarks[0];
            const le = f[33], re = f[263], ch = f[152];
            const fh = f[10] || { x: (le.x + re.x) / 2, y: f[1].y - (ch.y - f[1].y) * 1.1 };
            sm.ipd = smooth(sm.ipd, distPx(le, re, c.width));
            sm.fw  = smooth(sm.fw,  Math.abs(re.x - le.x) * c.width * 2);
            sm.fh  = smooth(sm.fh,  Math.abs(ch.y - fh.y) * c.height);
            rec.glasses = { width_px: Math.round(sm.ipd * 2.05) };
          }

          if (poseR?.poseLandmarks?.[0]) {
            const p = poseR.poseLandmarks[0];
            sm.sw = smooth(sm.sw, distPx(p[11], p[12], c.width));
          }
          if (handR?.landmarks?.[0]) {
            const h = handR.landmarks[0];
            sm.wr = smooth(sm.wr, distPx(h[0], h[9], c.width));
          }

          setMeasurements({
            ipd_px:           sm.ipd && Math.round(sm.ipd),
            shoulderWidth_px: sm.sw  && Math.round(sm.sw),
            wrist_est_px:     sm.wr  && Math.round(sm.wr),
            recommendations:  rec,
          });

          // ── Overlay draw ────────────────────────────────────────────────
          const t = product.articleType?.toLowerCase() || "";
          const o = overlayReady;

          if (o) {
            if ((t.includes("glasses") || t.includes("eyewear")) &&
                faceR?.faceLandmarks?.[0] && sm.ipd) {
              const f  = faceR.faceLandmarks[0];
              const le = f[33], re = f[263];
              const cx = ((le.x + re.x) / 2) * c.width;
              const cy = ((le.y + re.y) / 2) * c.height;
              const w  = sm.ipd * 1.6;
              const h  = w * (o.naturalHeight / o.naturalWidth);
              ctx.drawImage(o, cx - w / 2, cy - h / 1.8, w, h);
            }
            else if (t.includes("ring") && handR?.landmarks?.[0]) {
              const hand             = handR.landmarks[0];
              const baseJoint        = hand[13];
              const nextJoint        = hand[15];
              const fractionalLandmark = {
                x: baseJoint.x + (nextJoint.x - baseJoint.x) * 0.3,
                y: baseJoint.y + (nextJoint.y - baseJoint.y) * 0.3,
              };
              const middlePalm = hand[9];
              const ringSize   = Math.max(18, distPx(baseJoint, middlePalm, c.width) * 2.1);
              ctx.drawImage(
                o,
                fractionalLandmark.x * c.width  - ringSize / 2,
                fractionalLandmark.y * c.height - ringSize / 2,
                ringSize, ringSize
              );
            }
            else if (t.includes("watch") && handR?.landmarks?.[0]) {
              const hand         = handR.landmarks[0];
              const wrist        = hand[0];
              const indexBase    = hand[9];
              const middlePalm   = hand[9];
              const offsetFactor = 0.4;
              const adjustedWrist = {
                x: wrist.x + (wrist.x - indexBase.x) * offsetFactor,
                y: wrist.y + (wrist.y - indexBase.y) * offsetFactor,
              };
              const watchWidth  = distPx(wrist, middlePalm, c.width) * 1.5;
              const watchHeight = watchWidth * 0.65;
              ctx.drawImage(
                o,
                adjustedWrist.x * c.width  - watchWidth  / 2,
                adjustedWrist.y * c.height - watchHeight / 2,
                watchWidth, watchHeight
              );
            }
          }
        } catch (err) {
          console.warn("AR frame error (non-fatal):", err);
        } finally {
          // Always release the lock — the loop must continue even after errors
          isProcessing.current = false;
        }

        rafId.current = requestAnimationFrame(draw);
      };

      rafId.current = requestAnimationFrame(draw);
    };

    startLoop();

    return () => {
      isMounted = false;
      if (rafId.current) cancelAnimationFrame(rafId.current);
      isProcessing.current = false;
    };
  }, [detectors, overlayReady, product]);

  return (
    <div className={styles.arModal}>
      <div
        className={styles.arBackdrop}
        onClick={() => { onClose(); setAnalyzeMode(false); }}
      />
      <div className={styles.arContentLarge}>
        <Webcam
          ref={webcamRef}
style={{ visibility: "hidden", position: "absolute", width: 1, height: 1 }}          videoConstraints={{ facingMode: "user" }}
          crossOrigin="anonymous"
        />
        <canvas
          ref={canvasRef}
          className={styles.overlayCanvasLarge}
          width={960}
          height={720}
        />

        {analyzeMode && (
          <div className={styles.analyzePanel}>
            <strong>Live analysis</strong>
            <div>
              IPD: {measurements.ipd_px ?? "—"} | Shoulder: {measurements.shoulderWidth_px ?? "—"}
            </div>
          </div>
        )}

        {overlayError && (
          <div className={styles.analyzePanel} style={{ bottom: 60 }}>
            ⚠ Could not load product image for AR overlay
          </div>
        )}

        <button
          className={styles.closeARLarge}
          onClick={() => { onClose(); setAnalyzeMode(false); }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
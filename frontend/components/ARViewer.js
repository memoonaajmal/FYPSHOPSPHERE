"use client";

import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import {
  FilesetResolver,
  HandLandmarker,
  FaceLandmarker,
  PoseLandmarker,
} from "@mediapipe/tasks-vision";
import styles from "../src/styles/ProductDetails.module.css";

export default function ARViewer({ product, baseUrl, openAnalyze = false, onClose = () => {} }) {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [analyzeMode, setAnalyzeMode] = useState(openAnalyze);
  const [overlayReady, setOverlayReady] = useState(null);
  const [detectors, setDetectors] = useState({});
  const [measurements, setMeasurements] = useState({ recommendations: {} });

  const loadOverlayImage = () =>
    new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = `${baseUrl.replace(/\/$/, "")}/images/${product.imageFilename}`;
      img.onload = () => {
        const c = document.createElement("canvas");
        const ctx = c.getContext("2d");
        c.width = img.width;
        c.height = img.height;
        ctx.drawImage(img, 0, 0);
        const d = ctx.getImageData(0, 0, img.width, img.height);
        for (let i = 0; i < d.data.length; i += 4) {
          if (d.data[i] > 240 && d.data[i + 1] > 240 && d.data[i + 2] > 240) d.data[i + 3] = 0;
        }
        ctx.putImageData(d, 0, 0);
        const t = new Image();
        t.src = c.toDataURL();
        t.onload = () => resolve(t);
      };
      img.onerror = () => resolve(null);
    });

  const distPx = (a, b, w) => Math.hypot((a.x - b.x) * w, (a.y - b.y) * w);
  const smooth = (p, n, a = 0.25) => (p == null ? n : p * (1 - a) + n * a);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      const load = async (C, url, opt) =>
        C.createFromOptions(vision, {
          baseOptions: { modelAssetPath: url },
          runningMode: "VIDEO",
          ...opt,
        }).catch(() => null);

      const [hand, face, pose] = await Promise.all([
        load(
          HandLandmarker,
          "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          { numHands: 2 }
        ),
        load(
          FaceLandmarker,
          "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          { numFaces: 1 }
        ),
        load(
          PoseLandmarker,
          "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker/float16/1/pose_landmarker.task",
          { numPoses: 1 }
        ),
      ]);
      if (!mounted) return;
      setDetectors({ hand, face, pose });
      setOverlayReady(await loadOverlayImage());
    })();
    return () => (mounted = false);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const v = webcamRef.current?.video,
      c = canvasRef.current,
      ctx = c?.getContext("2d");
    if (!v || !ctx) return;

    const sm = {};
    const draw = async () => {
      if (!isMounted) return;
      if (v.readyState < 2) return requestAnimationFrame(draw);

      ctx.clearRect(0, 0, c.width, c.height);
      ctx.drawImage(v, 0, 0, c.width, c.height);

      const now = performance.now();
      const [faceR, handR, poseR] = await Promise.all([
        detectors.face?.detectForVideo(v, now),
        detectors.hand?.detectForVideo(v, now),
        detectors.pose?.detectForVideo(v, now),
      ]);

      const rec = {};
      // Face detection for eyewear
      if (faceR?.faceLandmarks?.[0]) {
        const f = faceR.faceLandmarks[0],
          le = f[33],
          re = f[263],
          ch = f[152],
          fh = f[10] || { x: (le.x + re.x) / 2, y: f[1].y - (ch.y - f[1].y) * 1.1 };
        sm.ipd = smooth(sm.ipd, distPx(le, re, c.width));
        sm.fw = smooth(sm.fw, Math.abs(re.x - le.x) * c.width * 2);
        sm.fh = smooth(sm.fh, Math.abs(ch.y - fh.y) * c.height);
        rec.glasses = { width_px: Math.round(sm.ipd * 2.05) };
      }

      // Pose and Hand detection
      if (poseR?.poseLandmarks?.[0]) {
        const p = poseR.poseLandmarks[0],
          ls = p[11],
          rs = p[12];
        sm.sw = smooth(sm.sw, distPx(ls, rs, c.width));
      }
      if (handR?.landmarks?.[0]) {
        const h = handR.landmarks[0],
          w = h[0],
          m = h[9];
        sm.wr = smooth(sm.wr, distPx(w, m, c.width));
      }

      setMeasurements({
        ipd_px: sm.ipd && Math.round(sm.ipd),
        shoulderWidth_px: sm.sw && Math.round(sm.sw),
        wrist_est_px: sm.wr && Math.round(sm.wr),
        recommendations: rec,
      });

      // ✅ Overlay placement (fixed eyewear)
      const t = product.articleType?.toLowerCase() || "";
      const o = overlayReady;
      if (o) {
        if (t.includes("glasses") || t.includes("eyewear")) {
          if (faceR?.faceLandmarks?.[0] && sm.ipd) {
            const f = faceR.faceLandmarks[0];
            const le = f[33];
            const re = f[263];
            const cx = ((le.x + re.x) / 2) * c.width;
            const cy = ((le.y + re.y) / 2) * c.height;
            const w = rec.glasses.width_px;
            const h = w * 0.45;
            ctx.drawImage(o, cx - w / 2, cy - h / 1.8, w, h);
          }
        }else if (t.includes("ring") && handR?.landmarks?.[0]) {
  const hand = handR.landmarks[0];

  // Landmark 13 (base/knuckle) and 14 (first finger joint)
  const baseJoint = hand[13];
  const nextJoint = hand[15];

  // Simulate "landmark 13.3" — 30% of the way from 13 to 14
  const fractionalLandmark = {
    x: baseJoint.x + (nextJoint.x - baseJoint.x) * 0.3,
    y: baseJoint.y + (nextJoint.y - baseJoint.y) * 0.3,
    z: baseJoint.z + (nextJoint.z - baseJoint.z) * 0.3,
  };

  // Use the middle of the palm (landmark 9) for approximate scaling
  const middlePalm = hand[9];
  const ringSize = Math.max(18, distPx(baseJoint, middlePalm, c.width) * 2.1);

  // Draw ring slightly up the finger
  ctx.drawImage(
    o,
    fractionalLandmark.x * c.width - ringSize / 2,
    fractionalLandmark.y * c.height - ringSize / 2,
    ringSize,
    ringSize
  );
}
else if (t.includes("watch") && handR?.landmarks?.[0]) {
  const hand = handR.landmarks[0];

  // Wrist and base of index finger define the hand-arm direction
  const wrist = hand[0];
  const indexBase = hand[9];
  const middlePalm = hand[9];

  // Move the watch slightly up the wrist (along the forearm)
  // Try between -0.15 and -0.3 for subtle offset
  const offsetFactor = 0.4;

  // Compute adjusted position (a bit above the wrist)
  const adjustedWrist = {
    x: wrist.x + (wrist.x - indexBase.x) * offsetFactor,
    y: wrist.y + (wrist.y - indexBase.y) * offsetFactor,
    z: wrist.z + (wrist.z - indexBase.z) * offsetFactor,
  };

  // Watch size based on wrist-to-palm distance
  const watchWidth = distPx(wrist, middlePalm, c.width) * 1.5;
  const watchHeight = watchWidth * 0.65;

  // Draw the watch image centered on adjusted wrist position
  ctx.drawImage(
    o,
    adjustedWrist.x * c.width - watchWidth / 2,
    adjustedWrist.y * c.height - watchHeight / 2,
    watchWidth,
    watchHeight
  );
}


      }

      requestAnimationFrame(draw);
    };
    draw();
    return () => (isMounted = false);
  }, [detectors, overlayReady, product]);

  return (
    <div className={styles.arModal}>
      <div
        className={styles.arBackdrop}
        onClick={() => {
          onClose();
          setAnalyzeMode(false);
        }}
      />
      <div className={styles.arContentLarge}>
        <Webcam ref={webcamRef} style={{ display: "none" }} videoConstraints={{ facingMode: "user" }} />
        <canvas ref={canvasRef} className={styles.overlayCanvasLarge} width={960} height={720} />
        {analyzeMode && (
          <div className={styles.analyzePanel}>
            <strong>Live analysis</strong>
            <div>
              IPD: {measurements.ipd_px ?? "-"} | Shoulder: {measurements.shoulderWidth_px ?? "-"}
            </div>
          </div>
        )}
        <button
          className={styles.closeARLarge}
          onClick={() => {
            onClose();
            setAnalyzeMode(false);
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

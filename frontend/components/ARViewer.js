"use client";

import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import {
  FilesetResolver,
  HandLandmarker,
  FaceLandmarker,
  PoseLandmarker,
} from "@mediapipe/tasks-vision";

// IMPORTANT: update this path if your styles live elsewhere.
// The component expects the same class names as your original styles.
import styles from "../src/styles/ProductDetails.module.css";

/**
 * ARViewer
 *
 * Props:
 *  - product: product object (same as in your page)
 *  - baseUrl: BASE_URL string (pass process.env.NEXT_PUBLIC_BASE_URL)
 *  - openAnalyze (optional boolean): if true opens in analyze mode
 *  - onClose: callback called when user closes AR viewer
 *
 * Behavior: replicates your original AR modal and detection loop exactly.
 */
export default function ARViewer({ product, baseUrl, openAnalyze = false, onClose = () => {} }) {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  const [analyzeMode, setAnalyzeMode] = useState(openAnalyze);
  const [handDetector, setHandDetector] = useState(null);
  const [faceDetector, setFaceDetector] = useState(null);
  const [poseDetector, setPoseDetector] = useState(null);
  const [overlayReady, setOverlayReady] = useState(null);
  const [measurements, setMeasurements] = useState({
    ipd_px: null,
    faceWidth_px: null,
    faceHeight_px: null,
    shoulderWidth_px: null,
    torsoHeight_px: null,
    wrist_est_px: null,
    ring_knuckle_px: null,
    recommendations: {},
  });

  // Load overlay image and make white background transparent (same function)
  const loadOverlayImage = () =>
    new Promise((resolve) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.src = `${baseUrl.replace(/\/$/, "")}/images/${product.imageFilename}`;
      img.onload = () => {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const tctx = tempCanvas.getContext("2d");
        tctx.drawImage(img, 0, 0);
        const imgData = tctx.getImageData(0, 0, img.width, img.height);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
          if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) {
            data[i + 3] = 0;
          }
        }

        tctx.putImageData(imgData, 0, 0);
        const transparentImg = new window.Image();
        transparentImg.src = tempCanvas.toDataURL();
        transparentImg.onload = () => resolve(transparentImg);
      };
      img.onerror = () => {
        console.error("Overlay image failed to load");
        resolve(null);
      };
    });

  // Distance inline helper (exact same math as yours)
  const distPx = (a, b, canvasWidth) => {
    return Math.sqrt(Math.pow((a.x - b.x) * canvasWidth, 2) + Math.pow((a.y - b.y) * canvasWidth, 2));
  };

  // Exponential smoothing helper
  function smooth(prev, next, alpha = 0.25) {
    if (prev == null) return next;
    return prev * (1 - alpha) + next * alpha;
  }

  // Initialize mediapipe detectors & overlay on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        // Hand detector
        try {
          const hd = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            },
            runningMode: "VIDEO",
            numHands: 2,
          });
          if (mounted) setHandDetector(hd);
        } catch (e) {
          console.warn("Hand model failed:", e);
          if (mounted) setHandDetector(null);
        }

        // Face detector
        try {
          const fd = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            },
            runningMode: "VIDEO",
            numFaces: 1,
          });
          if (mounted) setFaceDetector(fd);
        } catch (e) {
          console.warn("Face model failed:", e);
          if (mounted) setFaceDetector(null);
        }

        // Pose detector
        try {
          const pd = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker/float16/1/pose_landmarker.task",
            },
            runningMode: "VIDEO",
            numPoses: 1,
          });
          if (mounted) setPoseDetector(pd);
        } catch (e) {
          console.warn("Pose model failed:", e);
          if (mounted) setPoseDetector(null);
        }

        // Load overlay image
        const overlayImg = await loadOverlayImage();
        if (mounted) setOverlayReady(overlayImg);
      } catch (err) {
        console.warn("AR initialization error:", err);
      }
    })();

    return () => {
      mounted = false;
      // Optionally release mediapipe detectors (if those classes support a close/dispose)
      // safe to set states to null
      setHandDetector(null);
      setFaceDetector(null);
      setPoseDetector(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  // Detection & draw loop (nearly identical to your page version)
  useEffect(() => {
    let isMounted = true;
    if (!webcamRef.current) return;
    const video = webcamRef.current.video;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // local smoothed values
    let sm = {
      ipd_px: null,
      faceWidth_px: null,
      faceHeight_px: null,
      shoulderWidth_px: null,
      torsoHeight_px: null,
      wrist_px: null,
      ringKnuckle_px: null,
    };

    const processFrame = async () => {
      if (!isMounted) return;
      try {
        if (!video || video.readyState < 2) {
          requestAnimationFrame(processFrame);
          return;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        let faceResult = null;
        let handResult = null;
        let poseResult = null;

        if (faceDetector) {
          try {
            faceResult = await faceDetector.detectForVideo(video, performance.now());
          } catch (e) {}
        }
        if (handDetector) {
          try {
            handResult = await handDetector.detectForVideo(video, performance.now());
          } catch (e) {}
        }
        if (poseDetector) {
          try {
            poseResult = await poseDetector.detectForVideo(video, performance.now());
          } catch (e) {}
        }

        // --- Face measurements & drawing ---
        if (faceResult && faceResult.faceLandmarks?.length > 0) {
          const face = faceResult.faceLandmarks[0];
          const leftEye = face[33];
          const rightEye = face[263];
          const nose = face[1];
          const chin = face[152];
          const forehead = face[10] || { x: (leftEye.x + rightEye.x) / 2, y: nose.y - (chin.y - nose.y) * 1.1 };

          const ipd = distPx(leftEye, rightEye, canvas.width);
          const fWidth = Math.abs(rightEye.x - leftEye.x) * canvas.width * 2.0;
          const fHeight = Math.abs(chin.y - forehead.y) * canvas.height;

          sm.ipd_px = smooth(sm.ipd_px, ipd);
          sm.faceWidth_px = smooth(sm.faceWidth_px, fWidth);
          sm.faceHeight_px = smooth(sm.faceHeight_px, fHeight);

          // draw visual guides
          ctx.beginPath();
          ctx.arc(((leftEye.x + rightEye.x) / 2) * canvas.width, ((leftEye.y + rightEye.y) / 2) * canvas.height, 4, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(0,200,255,0.9)";
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(leftEye.x * canvas.width, leftEye.y * canvas.height);
          ctx.lineTo(rightEye.x * canvas.width, rightEye.y * canvas.height);
          ctx.strokeStyle = "rgba(0,200,255,0.8)";
          ctx.lineWidth = 2;
          ctx.stroke();

          const fw = sm.faceWidth_px;
          const fh = sm.faceHeight_px;
          const fcx = ((leftEye.x + rightEye.x) / 2) * canvas.width;
          const fcy = ((forehead.y + chin.y) / 2) * canvas.height;
          ctx.strokeStyle = "rgba(255,255,255,0.9)";
          ctx.lineWidth = 2;
          ctx.strokeRect(fcx - fw / 2, fcy - fh / 2, fw, fh);
        }

        // --- Pose ---
        let shouldersPx = null;
        let torsoPx = null;
        if (poseResult && poseResult.poseLandmarks?.length > 0) {
          const pose = poseResult.poseLandmarks[0];
          const leftShoulder = pose[11] || pose[5];
          const rightShoulder = pose[12] || pose[6];
          const leftHip = pose[23] || pose[11];
          const rightHip = pose[24] || pose[12];

          if (leftShoulder && rightShoulder) {
            shouldersPx = distPx(leftShoulder, rightShoulder, canvas.width);
            sm.shoulderWidth_px = smooth(sm.shoulderWidth_px, shouldersPx);

            ctx.beginPath();
            ctx.moveTo(leftShoulder.x * canvas.width, leftShoulder.y * canvas.height);
            ctx.lineTo(rightShoulder.x * canvas.width, rightShoulder.y * canvas.height);
            ctx.strokeStyle = "rgba(255,180,0,0.9)";
            ctx.lineWidth = 3;
            ctx.stroke();
          }

          if (leftShoulder && leftHip) {
            const tor = Math.abs(leftShoulder.y - leftHip.y) * canvas.height;
            sm.torsoHeight_px = smooth(sm.torsoHeight_px, tor);
            torsoPx = sm.torsoHeight_px;

            const centerX = ((leftShoulder.x + rightShoulder.x) / 2) * canvas.width;
            ctx.strokeStyle = "rgba(200,100,255,0.8)";
            ctx.lineWidth = 2;
            const tw = sm.shoulderWidth_px || canvas.width * 0.4;
            const th = torsoPx || canvas.height * 0.4;
            ctx.strokeRect(centerX - tw / 2, leftShoulder.y * canvas.height, tw, th);
          }
        }

        // --- Hand / ring / wrist ---
        if (handResult && handResult.landmarks?.length > 0) {
          const hand = handResult.landmarks[0];
          const wrist = hand[0];
          const middleKnuckle = hand[9];
          const ringKnuckle = hand[13];

          const handScalePx = distPx(wrist, middleKnuckle, canvas.width);
          sm.wrist_px = smooth(sm.wrist_px, handScalePx);
          sm.ringKnuckle_px = smooth(sm.ringKnuckle_px, distPx(ringKnuckle, middleKnuckle, canvas.width) || sm.ringKnuckle_px);

          ctx.fillStyle = "rgba(0,240,120,0.9)";
          ctx.beginPath();
          ctx.arc(wrist.x * canvas.width, wrist.y * canvas.height, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(ringKnuckle.x * canvas.width, ringKnuckle.y * canvas.height, 4, 0, Math.PI * 2);
          ctx.fill();
        }

        // --- Recommendations & measurements update (same heuristics) ---
        const rec = {};

        if (sm.ipd_px) {
          const gWidthPx = sm.ipd_px * 2.05;
          rec.glasses = {
            width_px: Math.round(gWidthPx),
            note: "Recommended glasses frame width (px). Calibrate to convert px → mm.",
          };
        }

        if (sm.faceWidth_px && sm.torsoHeight_px) {
          const neckProxyPx = sm.faceWidth_px * 0.9;
          rec.necklaces = {
            choker_px: Math.round(neckProxyPx),
            princess_px: Math.round(neckProxyPx * 1.3),
            matinee_px: Math.round(neckProxyPx * 1.6),
            note: "These are pixel widths approximating necklace horizontal span. Convert with calibration for real units.",
          };
        }

        if (sm.wrist_px) {
          const circProxyPx = sm.wrist_px * 3.0;
          rec.watch = {
            circ_px: Math.round(circProxyPx),
            suggested_case_px: Math.round(sm.wrist_px * 1.6),
            note: "Approximate wrist circumference proxy and suggested watch case width (px).",
          };
        }

        if (sm.ringKnuckle_px) {
          const ringCircPx = sm.ringKnuckle_px * 3.14;
          rec.ring = {
            circ_px: Math.round(ringCircPx),
            suggested_diameter_px: Math.round(ringCircPx / Math.PI),
            note: "Estimated ring diameter in px. For mm convert via calibration.",
          };
        }

        setMeasurements((prev) => ({
          ipd_px: sm.ipd_px ? Math.round(sm.ipd_px) : null,
          faceWidth_px: sm.faceWidth_px ? Math.round(sm.faceWidth_px) : null,
          faceHeight_px: sm.faceHeight_px ? Math.round(sm.faceHeight_px) : null,
          shoulderWidth_px: sm.shoulderWidth_px ? Math.round(sm.shoulderWidth_px) : null,
          torsoHeight_px: sm.torsoHeight_px ? Math.round(sm.torsoHeight_px) : null,
          wrist_est_px: sm.wrist_px ? Math.round(sm.wrist_px) : null,
          ring_knuckle_px: sm.ringKnuckle_px ? Math.round(sm.ringKnuckle_px) : null,
          recommendations: rec,
        }));

        // --- Overlay drawing (same conditions + logic) ---
        if (overlayReady && product) {
          const type = product.articleType?.toLowerCase() || "";

          if (
            type.includes("glasses") ||
            type.includes("sunglasses") ||
            type.includes("spectacles") ||
            type.includes("eyewear")
          ) {
            if (sm.ipd_px) {
              const glassesWidth = rec.glasses.width_px;
              const glassesHeight = Math.round(glassesWidth * 0.45);
              if (faceResult && faceResult.faceLandmarks?.length > 0) {
                const faceLm = faceResult.faceLandmarks[0];
                const cx = ((faceLm[33].x + faceLm[263].x) / 2) * canvas.width;
                const cy = faceLm[1].y * canvas.height - glassesHeight * 0.35;
                ctx.drawImage(overlayReady, cx - glassesWidth / 2, cy - glassesHeight / 2, glassesWidth, glassesHeight);
              }
            }
          } else if (type.includes("necklace") || type.includes("pendant")) {
            if (measurements.faceWidth_px) {
              const neckWidth = rec.necklaces ? rec.necklaces.princess_px : Math.round(measurements.faceWidth_px * 1.3);
              const neckHeight = Math.round(neckWidth * 0.45);
              if (faceResult && faceResult.faceLandmarks?.length > 0) {
                const faceLm = faceResult.faceLandmarks[0];
                const centerX = ((faceLm[33].x + faceLm[263].x) / 2) * canvas.width;
                const y = faceLm[152].y * canvas.height + neckHeight * 0.1;
                ctx.drawImage(overlayReady, centerX - neckWidth / 2, y, neckWidth, neckHeight);
              }
            }
          } else if (type.includes("earring") || type.includes("ear ring")) {
            if (faceResult && faceResult.faceLandmarks?.length > 0) {
              const faceLm = faceResult.faceLandmarks[0];
              const leftEar = faceLm[234];
              const rightEar = faceLm[454];
              const earSize = (measurements.faceWidth_px || canvas.width * 0.15) * 0.4;
              if (leftEar && rightEar) {
                ctx.drawImage(overlayReady, leftEar.x * canvas.width - earSize / 2, leftEar.y * canvas.height - earSize / 2, earSize, earSize);
                ctx.drawImage(overlayReady, rightEar.x * canvas.width - earSize / 2, rightEar.y * canvas.height - earSize / 2, earSize, earSize);
              }
            }
          } else if (type.includes("watch")) {
            if (handResult && handResult.landmarks?.length > 0) {
              const hand = handResult.landmarks[0];
              const wrist = hand[0];
              const middleKnuckle = hand[9];

              const wristWidth = distPx(wrist, middleKnuckle, canvas.width);
              const watchWidth = wristWidth * 1.5;
              const watchHeight = watchWidth * 0.65;
              const wristX = wrist.x * canvas.width;
              const wristY = wrist.y * canvas.height;
              const offsetY = watchHeight * 0.5;
              ctx.drawImage(overlayReady, wristX - watchWidth / 2, wristY - offsetY, watchWidth, watchHeight);
            }
          } else if (type.includes("ring") || type.includes("finger")) {
            if (handResult && handResult.landmarks?.length > 0) {
              const hand = handResult.landmarks[0];
              const ringKnuckle = hand[13];
              const middleKnuckle = hand[9];
              const ringSize = Math.max(18, Math.round(distPx(ringKnuckle, middleKnuckle, canvas.width) * 1.2));
              ctx.drawImage(overlayReady, ringKnuckle.x * canvas.width - ringSize / 2, ringKnuckle.y * canvas.height - ringSize / 2, ringSize, ringSize);
            }
          }
        }

        // --- Measurement panel ---
        const panelW = 260;
        const panelH = 180;
        const px = canvas.width - panelW - 12;
        const py = 12;
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.fillRect(px, py, panelW, panelH);
        ctx.fillStyle = "#fff";
        ctx.font = "12px sans-serif";
        ctx.fillText("Measurements (px, approx)", px + 8, py + 18);
        let line = 1;
        function writeLine(label, value) {
          ctx.fillStyle = "#fff";
          ctx.fillText(`${label}: ${value ?? "-"}`, px + 8, py + 18 + line * 16);
          line++;
        }
        writeLine("IPD", measurements.ipd_px);
        writeLine("Face W", measurements.faceWidth_px);
        writeLine("Face H", measurements.faceHeight_px);
        writeLine("Shoulder W", measurements.shoulderWidth_px);
        writeLine("Torso H", measurements.torsoHeight_px);
        writeLine("Wrist est", measurements.wrist_est_px);

        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.font = "10px sans-serif";
        ctx.fillText("Tip: for mm/cm convert using a known object held at same depth.", px + 8, py + panelH - 10);
      } catch (err) {
        console.warn("Frame analysis error:", err);
      }

      requestAnimationFrame(processFrame);
    };

    processFrame();

    return () => {
      isMounted = false;
    };
  }, [faceDetector, handDetector, poseDetector, overlayReady, product, measurements]);

  // Render: same structure as your page's modal
  return (
    <div className={styles.arModal}>
      <div className={styles.arBackdrop} onClick={() => { onClose(); setAnalyzeMode(false); }}></div>
      <div className={styles.arContentLarge}>
        <Webcam
          ref={webcamRef}
          style={{ display: "none" }}
          videoConstraints={{ facingMode: "user" }}
        />
        <canvas ref={canvasRef} className={styles.overlayCanvasLarge} width={960} height={720} />
        {analyzeMode && (
          <div style={{ position: "absolute", left: 24, top: 24, background: "rgba(0,0,0,0.6)", padding: 10, borderRadius: 8, color: "#fff", fontSize: 13 }}>
            <div><strong>Live analysis</strong></div>
            <div style={{ marginTop: 6 }}>
              IPD: {measurements.ipd_px ?? "-"} px<br />
              FaceW: {measurements.faceWidth_px ?? "-"} px<br />
              Shoulders: {measurements.shoulderWidth_px ?? "-"} px
            </div>
            <div style={{ marginTop: 8, fontSize: 11, opacity: 0.9 }}>
              Tip: For real-world units, hold a card (85.6mm) at same depth and enter its pixel width into settings.
            </div>
          </div>
        )}
        <button className={styles.closeARLarge} onClick={() => { onClose(); setAnalyzeMode(false); }}>
          ✕
        </button>
      </div>
    </div>
  );
}

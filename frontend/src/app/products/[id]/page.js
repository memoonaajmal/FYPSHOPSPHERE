"use client";

import React, { useEffect, useState, useRef } from "react";
import NextImage from "next/image"; // ✅ renamed import to avoid conflict
import { notFound } from "next/navigation";
import { useDispatch } from "react-redux";
import { addItemToCart } from "../../../../redux/CartSlice";
import { addToWishlist } from "../../../../redux/WishlistSlice";
import styles from "../../../styles/ProductDetails.module.css";
import MiniCart from "../../../../components/MiniCart";
import MiniWishlist from "../../../../components/MiniWishlist";
import Webcam from "react-webcam";
import { Camera } from "lucide-react";
import {
  FilesetResolver,
  HandLandmarker,
  FaceLandmarker,
} from "@mediapipe/tasks-vision";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

async function fetchProduct(productId) {
  const res = await fetch(`${BASE_URL}/api/products/${productId}`, {
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch product");
  return res.json();
}

export default function ProductDetailsPage({ params: paramsPromise }) {
  const params = React.use(paramsPromise);
  const { id } = params;
  const dispatch = useDispatch();

  // === State variables ===
  const [product, setProduct] = useState(null);
  const [miniCartVisible, setMiniCartVisible] = useState(false);
  const [miniWishlistVisible, setMiniWishlistVisible] = useState(false);

  const [showAR, setShowAR] = useState(false);
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [arMode, setArMode] = useState(null);
  const [detector, setDetector] = useState(null);
  const [overlayReady, setOverlayReady] = useState(null);

  // === Fetch Product ===
  useEffect(() => {
    async function loadProduct() {
      const data = await fetchProduct(id);
      if (!data) notFound();
      else setProduct(data);
    }
    if (id) loadProduct();
  }, [id]);

  // === Recently viewed + detect AR mode ===
  useEffect(() => {
    if (!product) return;
    const viewed = JSON.parse(localStorage.getItem("recentlyViewed")) || [];
    const filtered = viewed.filter((p) => p._id !== product._id);
    filtered.unshift({
      _id: product._id,
      productDisplayName: product.productDisplayName,
      price: product.price,
      imageFilename: product.imageFilename,
      storeId: product.storeId,
    });
    const limited = filtered.slice(0, 5);
    localStorage.setItem("recentlyViewed", JSON.stringify(limited));

    const type = product.articleType?.toLowerCase() || "";
    if (type.includes("watch")) setArMode("hand");
    else if (type.includes("necklace") || type.includes("jewellery"))
      setArMode("face");
    else setArMode(null);
  }, [product]);

  // === Make overlay transparent (fixed Image constructor) ===
  const loadOverlayImage = () =>
    new Promise((resolve) => {
      const img = new window.Image(); // ✅ use browser Image explicitly
      img.crossOrigin = "anonymous";
      img.src = `${BASE_URL.replace(/\/$/, "")}/images/${product.imageFilename}`;
      img.onload = () => {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const tctx = tempCanvas.getContext("2d");
        tctx.drawImage(img, 0, 0);
        const imgData = tctx.getImageData(0, 0, img.width, img.height);
        const data = imgData.data;

        // Make white background transparent
        for (let i = 0; i < data.length; i += 4) {
          if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) {
            data[i + 3] = 0;
          }
        }

        tctx.putImageData(imgData, 0, 0);
        const transparentImg = new window.Image(); // ✅ again use native
        transparentImg.src = tempCanvas.toDataURL();
        transparentImg.onload = () => resolve(transparentImg);
      };
      img.onerror = () => {
        console.error("Overlay image failed to load");
        resolve(null);
      };
    });

  // === Add to Cart ===
  const handleAddToCart = () => {
    dispatch(
      addItemToCart({
        id: product._id,
        name: product.productDisplayName,
        price: product.price,
        image: `${BASE_URL}/images/${product.imageFilename}`,
        storeId: product.storeId,
      })
    );
    setMiniCartVisible(true);
    setTimeout(() => setMiniCartVisible(false), 3000);
  };

  // === Add to Wishlist ===
  const handleAddToWishlist = () => {
    dispatch(
      addToWishlist({
        id: product._id,
        name: product.productDisplayName,
        price: product.price,
        image: `${BASE_URL}/images/${product.imageFilename}`,
        storeId: product.storeId,
      })
    );
    setMiniWishlistVisible(true);
    setTimeout(() => setMiniWishlistVisible(false), 3000);
  };

  // === AR Button Click ===
  const handleARClick = async () => {
    setShowAR(true);
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    let createdDetector;
    if (arMode === "hand") {
      createdDetector = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
        },
        runningMode: "VIDEO",
        numHands: 1,
      });
    } else if (arMode === "face") {
      createdDetector = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        },
        runningMode: "VIDEO",
        numFaces: 1,
      });
    }

    setDetector(createdDetector);
    const overlayImg = await loadOverlayImage();
    setOverlayReady(overlayImg);
  };

  // === Detection Loop (always declared) ===
  useEffect(() => {
    if (!showAR || !detector || !webcamRef.current || !overlayReady) return;
    let isMounted = true;
    const video = webcamRef.current.video;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const processFrame = async () => {
      if (!isMounted) return;
      if (!video || video.readyState < 2) {
        requestAnimationFrame(processFrame);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      try {
        const results = await detector.detectForVideo(video, performance.now());

        // === Hand AR ===
        if (arMode === "hand" && results.landmarks?.length > 0) {
          const landmarks = results.landmarks[0];
          const wrist = landmarks[0];
          const middleKnuckle = landmarks[9];
          const dx = middleKnuckle.x - wrist.x;
          const dy = middleKnuckle.y - wrist.y;
          const wristSize = Math.sqrt(dx * dx + dy * dy);
          const scale = Math.max(60, wristSize * 1000);
          const x = wrist.x * canvas.width;
          const y = wrist.y * canvas.height;
          ctx.drawImage(overlayReady, x - scale / 2, y - scale / 2, scale, scale);
        }

        // === Face AR ===
        if (arMode === "face" && results.faceLandmarks?.length > 0) {
          const face = results.faceLandmarks[0];
          const chin = face[152];
          const left = face[234];
          const right = face[454];
          const faceWidth = Math.abs(right.x - left.x) * canvas.width;
          const x = chin.x * canvas.width;
          const y = chin.y * canvas.height;
          ctx.drawImage(
            overlayReady,
            x - faceWidth / 2,
            y - faceWidth * 1.2,
            faceWidth,
            faceWidth
          );
        }
      } catch (err) {
        console.warn("AR frame skipped:", err);
      }

      requestAnimationFrame(processFrame);
    };

    processFrame();
    return () => {
      isMounted = false;
    };
  }, [showAR, detector, arMode, overlayReady]);

  // === Loading state ===
  if (!product) return <p>Loading product details...</p>;

  const imageSrc = `${BASE_URL.replace(/\/$/, "")}/images/${product.imageFilename}`;

  // === Render ===
  return (
    <div className={styles.container}>
      <div className={styles.imageWrapper}>
        <NextImage src={imageSrc} alt={product.productDisplayName} width={500} height={500} />
        <button className={styles.cameraIcon} onClick={handleARClick}>
          <Camera size={22} />
        </button>
      </div>

      <div className={styles.details}>
        <h1>{product.productDisplayName}</h1>
        <p className={styles.price}>
          {product.price ? `PKR ${product.price.toLocaleString()}` : "Price not available"}
        </p>
        <p><strong>Color:</strong> {product.baseColour}</p>
        <p><strong>Type:</strong> {product.articleType}</p>

        <div className={styles.actions}>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleAddToCart}>
            Add to Cart
          </button>
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={handleAddToWishlist}>
            Wishlist
          </button>
        </div>
      </div>

      <MiniCart visible={miniCartVisible} onClose={() => setMiniCartVisible(false)} />
      <MiniWishlist visible={miniWishlistVisible} onClose={() => setMiniWishlistVisible(false)} />

      {showAR && (
        <div className={styles.arModal}>
          <div className={styles.arBackdrop} onClick={() => setShowAR(false)}></div>
          <div className={styles.arContentLarge}>
            <Webcam
              ref={webcamRef}
              style={{ display: "none" }}
              videoConstraints={{ facingMode: "user" }}
            />
            <canvas ref={canvasRef} className={styles.overlayCanvasLarge} width={960} height={720} />
            {arMode === "face" && (
              <div className={styles.faceGuideLarge}>
                <p>🧍 Please center your face in the frame</p>
              </div>
            )}
            <button className={styles.closeARLarge} onClick={() => setShowAR(false)}>
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

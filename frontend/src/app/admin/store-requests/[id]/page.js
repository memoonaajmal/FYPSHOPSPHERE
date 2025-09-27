"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "../../styles/AdminDashboard.module.css";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export default function StoreRequestDetail() {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [storeCreated, setStoreCreated] = useState(false); // ✅ new state
  const router = useRouter();

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/admin/store-requests/${id}`, {
          credentials: "include",
        });

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const data = await res.json();
        setRequest(data);
      } catch (err) {
        console.error("Error fetching store request:", err);
        setRequest(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [id]);

  const updateStatus = async (status) => {
    if (!["approved", "rejected"].includes(status)) return;

    setUpdating(true);
    try {
      const res = await fetch(`${BASE_URL}/api/admin/store-requests/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();
      setRequest(data.request); // update local request object

      if (status === "approved") {
        setStoreCreated(true); // ✅ show store created message
      } else {
        setStoreCreated(false);
      }

      alert(`Store request ${status} successfully!`);
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <p style={{ padding: "24px" }}>Loading store request...</p>;
  if (!request) return <p style={{ padding: "24px" }}>Store request not found.</p>;

  return (
    <div className={styles.dashboard}>
      <h1 className={styles.title}>Store Request Details</h1>
      <button onClick={() => router.back()} style={{ marginBottom: "16px" }}>
        ← Back
      </button>

      <div className={styles.card}>
        <h2>{request.storeName}</h2>
        <p><strong>Seller:</strong> {request.ownerFullName || request.sellerId?.ownerFullName}</p>
        <p><strong>Business:</strong> {request.businessName || request.sellerId?.businessName}</p>
        <p><strong>Email:</strong> {request.email || request.sellerId?.email}</p>
        <p><strong>Phone:</strong> {request.phoneNumber || request.sellerId?.phoneNumber}</p>
        <p><strong>Category:</strong> {request.category}</p>
        <p>
          <strong>Status:</strong> {request.status}
          {storeCreated && (
            <span style={{ color: "green", fontWeight: "bold", marginLeft: "10px" }}>
              ✅ Store has been created!
            </span>
          )}
        </p>
        <p><strong>Submitted:</strong> {new Date(request.createdAt).toLocaleString()}</p>

        <h3>Address</h3>
        <p>{request.streetAddress}, {request.city}, {request.state}, {request.postalCode}</p>

        <h3>Verification / Identification</h3>
        <p><strong>CNIC Number:</strong> {request.cnicNumber || "N/A"}</p>
        {request.cnicImageUrl && <img src={request.cnicImageUrl} alt="CNIC" style={{ maxWidth: "300px" }} />}

        <h3>Branding</h3>
        {request.logoUrl && <img src={request.logoUrl} alt="Logo" style={{ maxWidth: "150px" }} />}
        {request.bannerUrl && <img src={request.bannerUrl} alt="Banner" style={{ maxWidth: "300px" }} />}
        
        {request.description && (
          <>
            <h3>Description</h3>
            <p>{request.description}</p>
          </>
        )}

        {/* Approve / Reject buttons */}
        <div style={{ marginTop: "20px" }}>
          <button
            onClick={() => updateStatus("approved")}
            disabled={updating || request.status === "approved"}
            style={{ marginRight: "10px", backgroundColor: "green", color: "white", padding: "8px 16px", cursor: "pointer" }}
          >
            Approve
          </button>
          <button
            onClick={() => updateStatus("rejected")}
            disabled={updating || request.status === "rejected"}
            style={{ backgroundColor: "red", color: "white", padding: "8px 16px", cursor: "pointer" }}
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

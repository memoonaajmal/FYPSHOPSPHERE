"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "../../styles/AllStoreRequestDetail.module.css";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

function getBadgeClass(status) {
  switch (status?.toLowerCase()) {
    case "pending":  return styles.badgePending;
    case "approved": return styles.badgeApproved;
    case "rejected": return styles.badgeRejected;
    default:         return styles.badgeDefault;
  }
}

function getInitials(name = "") {
  return name.trim().charAt(0).toUpperCase() || "S";
}

export default function StoreRequestDetail() {
  const { id } = useParams();
  const router  = useRouter();

  const [request,      setRequest]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [updating,     setUpdating]     = useState(false);
  const [storeCreated, setStoreCreated] = useState(false);

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
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setRequest(data.request);
      setStoreCreated(status === "approved");
      alert(`Store request ${status} successfully!`);
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <p className={styles.loading}>Loading store request…</p>;
  if (!request) return <p className={styles.error}>Store request not found.</p>;

  const ownerName  = request.ownerFullName  || request.sellerId?.ownerFullName;
  const business   = request.businessName   || request.sellerId?.businessName;
  const email      = request.email          || request.sellerId?.email;
  const phone      = request.phoneNumber    || request.sellerId?.phoneNumber;
  const address    = [request.streetAddress, request.city, request.state, request.postalCode]
                       .filter(Boolean).join(", ");
  const submitted  = new Date(request.createdAt).toLocaleString("en-US", {
    month: "long", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className={styles.dashboard}>

      {/* ── Header ── */}
      <div className={styles.header}>
      <div className={styles.headerInner}>
  <h1 className={styles.titleWithArrow}>
    <span
      className={styles.backArrow}
      onClick={() => router.back()}
    >
      ←
    </span>
    Store Request Details
  </h1>
</div>
      </div>

      {/* ── Content ── */}
      <div className={styles.content}>
        <div className={styles.grid}>

          {/* ── Store Overview (full width) ── */}
          <div className={`${styles.card} ${styles.gridFull}`}>
            <div className={styles.storeHero}>
              <div className={styles.storeAvatar}>
                {getInitials(request.storeName)}
              </div>
              <div>
                <div className={styles.storeName}>{request.storeName}</div>
                {business && <div className={styles.storeSub}>{business}</div>}
              </div>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
                <span className={`${styles.badge} ${getBadgeClass(request.status)}`}>
                  {request.status}
                </span>
                {storeCreated && (
                  <span className={styles.successTag}>✓ Store Created</span>
                )}
              </div>
            </div>
          </div>

          {/* ── Seller Info ── */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>👤</div>
              <h3 className={styles.cardTitle}>Seller Information</h3>
            </div>
            <div className={styles.cardBody}>
              {ownerName && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Full Name</span>
                  <span className={styles.infoValue}>{ownerName}</span>
                </div>
              )}
              {email && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Email</span>
                  <span className={styles.infoValue}>{email}</span>
                </div>
              )}
              {phone && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Phone</span>
                  <span className={styles.infoValue}>{phone}</span>
                </div>
              )}
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Submitted</span>
                <span className={styles.infoValue}>{submitted}</span>
              </div>
            </div>
          </div>

          {/* ── Store Details ── */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>🏪</div>
              <h3 className={styles.cardTitle}>Store Details</h3>
            </div>
            <div className={styles.cardBody}>
              {request.category && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Category</span>
                  <span className={styles.infoValue}>{request.category}</span>
                </div>
              )}
              {address && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Address</span>
                  <span className={styles.infoValue}>{address}</span>
                </div>
              )}
            </div>
          </div>

          {/* ── CNIC Verification ── */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>🪪</div>
              <h3 className={styles.cardTitle}>Verification / ID</h3>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>CNIC Number</span>
                <span className={styles.infoValue}>{request.cnicNumber || "N/A"}</span>
              </div>
            </div>
            {request.cnicImageUrl && (
              <div className={styles.imageWrapper}>
                <img
                  src={`${BASE_URL}/${request.cnicImageUrl}`}
                  alt="CNIC"
                  className={styles.image}
                />
              </div>
            )}
          </div>

          {/* ── Branding ── */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>🎨</div>
              <h3 className={styles.cardTitle}>Branding</h3>
            </div>
            <div className={styles.imageWrapper}>
              {request.logoUrl && (
                <img
                  src={`${BASE_URL}/${request.logoUrl}`}
                  alt="Logo"
                  className={styles.imageSmall}
                />
              )}
              {request.bannerUrl && (
                <img
                  src={`${BASE_URL}/${request.bannerUrl}`}
                  alt="Banner"
                  className={styles.image}
                />
              )}
              {!request.logoUrl && !request.bannerUrl && (
                <p style={{ color: "var(--muted)", fontSize: "13px", padding: "0 0 8px" }}>
                  No branding assets provided.
                </p>
              )}
            </div>
          </div>

          {/* ── Description (full width, only if present) ── */}
          {request.description && (
            <div className={`${styles.card} ${styles.gridFull}`}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIcon}>📝</div>
                <h3 className={styles.cardTitle}>Description</h3>
              </div>
              <p className={styles.description}>{request.description}</p>
            </div>
          )}

          {/* ── Action Buttons (full width, only if pending) ── */}
          {request.status === "pending" && (
            <div className={`${styles.buttonGroup} ${styles.gridFull}`}>
              <button
                onClick={() => {
                  if (window.confirm("Are you sure you want to approve this request?")) {
                    updateStatus("approved");
                  }
                }}
                disabled={updating}
                className={`${styles.button} ${styles.approveButton}`}
              >
                {updating ? "Updating…" : "✓ Approve Store"}
              </button>
              <button
                onClick={() => {
                  if (window.confirm("Are you sure you want to reject this request?")) {
                    updateStatus("rejected");
                  }
                }}
                disabled={updating}
                className={`${styles.button} ${styles.rejectButton}`}
              >
                {updating ? "Updating…" : "✕ Reject Request"}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
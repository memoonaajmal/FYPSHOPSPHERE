"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "../styles/AllStoreRequest.module.css";

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

export default function StoreRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/admin/store-requests`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setRequests(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching store requests:", err);
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  const counts = requests.reduce(
    (acc, r) => {
      const s = r.status?.toLowerCase();
      if (s === "pending")  acc.pending++;
      if (s === "approved") acc.approved++;
      if (s === "rejected") acc.rejected++;
      return acc;
    },
    { pending: 0, approved: 0, rejected: 0 }
  );

  if (loading)
    return (
      <div className={styles.dashboard}>
        <div className={styles.header}>
          <h1 className={styles.title}>Seller Store Requests</h1>
          <p className={styles.subtitle}>Review and manage seller applications</p>
        </div>
        <p className={styles.loadingText}>Loading store requests…</p>
      </div>
    );

  return (
    <div className={styles.dashboard}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <h1 className={styles.title}>Seller Store Requests</h1>
        <p className={styles.subtitle}>Review and manage seller applications</p>
      </div>

      {/* ── Content ── */}
      <div className={styles.content}>

        {/* Stats bar */}
        {requests.length > 0 && (
          <div className={styles.statsBar}>
            <div className={styles.statPill}>
              <span className={`${styles.statDot} ${styles.dotAll}`} />
              {requests.length} Total
            </div>
            {counts.pending > 0 && (
              <div className={styles.statPill}>
                <span className={`${styles.statDot} ${styles.dotPending}`} />
                {counts.pending} Pending
              </div>
            )}
            {counts.approved > 0 && (
              <div className={styles.statPill}>
                <span className={`${styles.statDot} ${styles.dotApproved}`} />
                {counts.approved} Approved
              </div>
            )}
            {counts.rejected > 0 && (
              <div className={styles.statPill}>
                <span className={`${styles.statDot} ${styles.dotRejected}`} />
                {counts.rejected} Rejected
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {requests.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📭</div>
            <p className={styles.emptyText}>No store requests found.</p>
          </div>
        ) : (
          <div className={styles.tablePanel}>

            {/* Table Header */}
            <div className={styles.tableHeader}>
              <div className={styles.tableHeaderCell}>Store</div>
              <div className={`${styles.tableHeaderCell} ${styles.colSeller}`}>Seller</div>
              <div className={`${styles.tableHeaderCell} ${styles.colEmail}`}>Email</div>
              <div className={styles.tableHeaderCell}>Status</div>
              <div className={`${styles.tableHeaderCell} ${styles.colBusiness}`}>Submitted</div>
              <div />
            </div>

            {/* Table Rows */}
            {requests.map((req) => {
              const storeName  = req.storeName;
              const ownerName  = req.ownerFullName  || req.sellerId?.ownerFullName;
              const business   = req.businessName   || req.sellerId?.businessName;
              const email      = req.email          || req.sellerId?.email;
              const status     = req.status;
              const submitted  = new Date(req.createdAt).toLocaleString("en-US", {
                month: "short", day: "numeric", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              });

              return (
                <Link
                  key={req._id}
                  href={`/admin/store-requests/${req._id}`}
                  className={styles.tableRow}
                >
                  {/* Store + avatar */}
                  <div className={styles.storeCell}>
                    <div className={styles.storeAvatar}>
                      {getInitials(storeName)}
                    </div>
                    <div>
                      <div className={styles.storeName}>{storeName}</div>
                      {business && (
                        <div className={styles.storeBusiness}>{business}</div>
                      )}
                    </div>
                  </div>

                  {/* Seller */}
                  <div className={`${styles.sellerName} ${styles.colSeller}`}>
                    {ownerName || "—"}
                  </div>

                  {/* Email */}
                  <div className={`${styles.emailText} ${styles.colEmail}`}>
                    {email || "—"}
                  </div>

                  {/* Status badge */}
                  <div>
                    <span className={`${styles.badge} ${getBadgeClass(status)}`}>
                      {status}
                    </span>
                  </div>

                  {/* Submitted date */}
                  <div className={`${styles.dateText} ${styles.colBusiness}`}>
                    {submitted}
                  </div>

                  {/* Arrow */}
                  <div className={styles.arrowCell}>›</div>
                </Link>
              );
            })}

          </div>
        )}
      </div>
    </div>
  );
}
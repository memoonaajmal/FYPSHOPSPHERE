"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "../styles/AdminDashboard.module.css";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export default function StoreRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <p style={{ padding: "24px" }}>Loading store requests...</p>;
  if (requests.length === 0) return <p style={{ padding: "24px" }}>No requests found.</p>;

  return (
    <div className={styles.dashboard}>
      <h1 className={styles.title}>Seller Store Requests</h1>
      <div className={styles.grid}>
        {requests.map((req) => (
          <Link key={req._id} href={`/admin/store-requests/${req._id}`}>
            <div className={styles.card} style={{ cursor: "pointer" }}>
              <h2>{req.storeName}</h2>
              <p><strong>Seller:</strong> {req.ownerFullName || req.sellerId?.ownerFullName}</p>
              <p><strong>Business:</strong> {req.businessName || req.sellerId?.businessName}</p>
              <p><strong>Email:</strong> {req.email || req.sellerId?.email}</p>
              <p><strong>Status:</strong> {req.status}</p>
              <p><strong>Submitted:</strong> {new Date(req.createdAt).toLocaleString()}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

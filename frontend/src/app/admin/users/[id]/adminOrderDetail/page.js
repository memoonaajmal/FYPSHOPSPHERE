"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import styles from "../../../styles/AdminOrderDetailPage.module.css";
import AdminOrderCard from "../../../../../../components/AdminOrderCard";
import OrderPagination from "../../../../../../components/OrderPagination"; // ✅ import your pagination component

export default function AdminOrderDetailPage() {
  const { id: userId } = useParams();
  const params = useSearchParams();
  const currentPage = parseInt(params.get("page") || "1", 10);

  const [firebaseUser, setFirebaseUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
    return () => unsubscribe();
  }, []);

  const fetchWithAuth = async (url, options = {}) => {
    if (!firebaseUser) throw new Error("User not logged in");
    const token = await firebaseUser.getIdToken();
    return fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
  };

  useEffect(() => {
    if (!userId || !firebaseUser) return;

    const fetchOrders = async () => {
      try {
        setLoadingOrders(true);

        const res = await fetchWithAuth(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/orders?sellerId=${userId}&page=${currentPage}&limit=5`
        );
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();

        setOrders(Array.isArray(data.orders) ? data.orders : []);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        console.error("Error fetching seller orders:", err);
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchOrders();
  }, [userId, firebaseUser, currentPage]);

 return (
   <div className={styles.container}>
  <h2 className={styles.sectionTitle}>User Orders</h2>

  {loadingOrders ? (
    <p>Loading...</p>
  ) : orders.length > 0 ? (
    <>
      <div className={styles.ordersGrid}>
        {orders.map((order) => (
          <AdminOrderCard key={order._id} order={order} />
        ))}
      </div>

      <OrderPagination totalPages={totalPages} />
    </>
  ) : (
    <p>No orders found</p>
  )}
</div>

  );
}

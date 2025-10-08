"use client";

import { useEffect, useState } from "react";
import { auth } from "../../../../firebase/config";
import styles from "../styles/SellerOrdersPage.module.css";
import SellerOrderCard from "../../../../components/SellerOrderCard";
import OrderPagination from "../../../../components/OrderPagination";
import { useSearchParams } from "next/navigation";

export default function SellerOrdersPage() {
  const params = useSearchParams();
  const page = parseInt(params.get("page") || "1", 10);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [storeId, setStoreId] = useState(null);

  // ✅ Fetch storeId of logged-in seller
  useEffect(() => {
    const fetchStoreId = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/seller/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setStoreId(data.storeId);
      }
    };

    fetchStoreId();
  }, []);

  // ✅ Fetch orders from backend
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        setError("Not logged in");
        setLoading(false);
        return;
      }

      const token = await user.getIdToken();
      const queryParams = new URLSearchParams({ page });

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/seller/orders?${queryParams.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);

      const data = await res.json();
      let ordersList = Array.isArray(data.orders) ? data.orders : [];

      // ✅ Determine payment status for current store
      if (storeId) {
        ordersList = ordersList.map((order) => {
          const myItems = order.items.filter((it) => it.storeId === storeId);
          let myPaymentStatus = "pending";

          if (myItems.every((it) => it.itemPaymentStatus === "paid")) {
            myPaymentStatus = "paid";
          } else if (myItems.every((it) => it.itemPaymentStatus === "returned")) {
            myPaymentStatus = "returned";
          }

          return { ...order, myPaymentStatus };
        });
      }

      setOrders(ordersList);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("❌ Fetch orders error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (storeId) fetchOrders();
  }, [page, storeId]);

  if (loading) return <p className={styles.message}>Loading your orders...</p>;
  if (error)
    return <p className={`${styles.message} ${styles.error}`}>Error: {error}</p>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Order History</h1>

      {/* Animated info text above the table */}
      <div className={styles.tableInfo}>
        Here you can view and manage all orders placed in your store.
        {"\n"}
        Click "View" to see order details or update status.
      </div>

      {/* ✅ Orders Table Component */}
      {orders.length === 0 ? (
        <p className={styles.message}>No orders found for your store yet.</p>
      ) : (
        <SellerOrderCard orders={orders} page={page} />
      )}

      {/* ✅ Pagination */}
      {totalPages > 1 && <OrderPagination totalPages={totalPages} />}
    </div>
  );
}

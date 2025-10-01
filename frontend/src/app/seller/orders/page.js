"use client";

import { useEffect, useState } from "react";
import { auth } from "../../../../firebase/config";
import styles from "../styles/SellerOrdersPage.module.css";

// ✅ Components
import OrderCard from "../../../../components/SellerOrderCard";
import OrderPagination from "../../../../components/OrderPagination";

import { useSearchParams } from "next/navigation";

export default function SellerOrdersPage() {
  const params = useSearchParams();
  const page = parseInt(params.get("page") || "1", 10); // get page from URL

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [storeId, setStoreId] = useState(null); // ✅ storeId of logged-in seller

  // ✅ Fetch storeId for logged-in seller
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
        setStoreId(data.storeId); // backend must return storeId
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

      // ✅ Derive `myPaymentStatus` per order based on this seller's items
      if (storeId) {
        ordersList = ordersList.map(order => {
          const myItems = order.items.filter(it => it.storeId === storeId);
          const myPaymentStatus = myItems.every(it => it.itemPaymentStatus === "paid")
            ? "paid"
            : "pending";
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

  // ✅ Fetch orders on load / page change / storeId available
  useEffect(() => {
    if (storeId) fetchOrders();
  }, [page, storeId]);

  if (loading) return <p className={styles.message}>Loading your orders...</p>;
  if (error)
    return <p className={`${styles.message} ${styles.error}`}>Error: {error}</p>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Orders for My Store</h1>

      {/* ✅ Orders List */}
      {orders.length === 0 ? (
        <p className={styles.message}>No orders found for your store yet.</p>
      ) : (
        <div className={styles.orderList}>
          {orders.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              storeId={storeId}
              onStatusUpdated={fetchOrders} // refresh after marking paid
            />
          ))}
        </div>
      )}

      {/* ✅ Pagination */}
      {totalPages > 1 && <OrderPagination totalPages={totalPages} />}
    </div>
  );
}

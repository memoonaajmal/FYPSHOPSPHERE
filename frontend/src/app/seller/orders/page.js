"use client";
import { useEffect, useState } from "react";
import { auth } from "../../../../firebase/config";

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setError("Not logged in");
          setLoading(false);
          return;
        }

        const token = await user.getIdToken();

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/seller/orders`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) {
          throw new Error(`Error ${res.status}: ${await res.text()}`);
        }

        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("❌ Fetch orders error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) return <p className="p-4">Loading your orders...</p>;
  if (error) return <p className="p-4 text-red-600">Error: {error}</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Orders for My Store</h1>
      {orders.length === 0 ? (
        <p>No orders found for your store yet.</p>
      ) : (
        <ul className="space-y-6">
          {orders.map((order) => (
            <li key={order._id} className="border rounded p-4 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <p className="font-semibold text-lg">
                    {order.firstName} {order.lastName}
                  </p>
                  <p className="text-gray-600">{order.email} | {order.phone}</p>
                  <p className="text-gray-600">Address: {order.houseAddress}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">Order Total: ${order.grandTotal}</p>
                  <p className="text-sm text-gray-500">Status: {order.paymentStatus}</p>
                  {order.trackingId && <p className="text-sm text-gray-500">Tracking: {order.trackingId}</p>}
                  <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <ul className="mt-2 pl-4 list-disc">
                {order.items.map((item, idx) => (
                  <li key={idx}>
                    {item.name} — {item.quantity} × ${item.price} = ${item.price * item.quantity}
                  </li>
                ))}
              </ul>

              <p className="mt-2 font-semibold">
                Seller Items Total: ${order.itemsTotal}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

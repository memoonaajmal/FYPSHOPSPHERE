"use client";
import ProtectedRoute from "../../../../components/ProtectedRoute";

export default function SellerDashboard() {
  return (
    <ProtectedRoute role="seller">
      <div>
        <h1>Seller Dashboard</h1>
        <p>Manage your products and orders.</p>
      </div>
    </ProtectedRoute>
  );
}

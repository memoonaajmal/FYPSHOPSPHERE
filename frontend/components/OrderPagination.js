"use client";

import { useRouter, useSearchParams } from "next/navigation";
import styles from "./styles/OrderPagination.module.css";

export default function OrderPagination({ totalPages }) {
  const router = useRouter();
  const params = useSearchParams();
  const page = parseInt(params.get("page") || "1", 10); // current page from URL, default 1

  if (totalPages <= 1) return null;

  const goToPage = (p) => {
    if (p >= 1 && p <= totalPages) {
      const query = new URLSearchParams(params.toString());
      query.set("page", String(p));
      router.push(`?${query.toString()}`);
    }
  };

  return (
    <div className={styles.pagination}>
      {/* Previous Button */}
      <button
        className={styles.btn}
        onClick={() => goToPage(page - 1)}
        disabled={page === 1}
      >
        Previous
      </button>

      {/* Page Numbers */}
      {[...Array(totalPages)].map((_, i) => {
        const current = i + 1;
        return (
          <button
            key={current}
            className={`${styles.btn} ${page === current ? styles.active : ""}`}
            onClick={() => goToPage(current)}
          >
            {current}
          </button>
        );
      })}

      {/* Next Button */}
      <button
        className={styles.btn}
        onClick={() => goToPage(page + 1)}
        disabled={page === totalPages}
      >
        Next
      </button>
    </div>
  );
}

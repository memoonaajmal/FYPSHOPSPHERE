'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './styles/Pagination.module.css';

export default function Pagination({ page, totalPages }) {
  const router = useRouter();
  const params = useSearchParams();

  function go(to) {
    const q = new URLSearchParams(params.toString());
    q.set('page', String(to));
    router.push(`/products?${q.toString()}`);
  }

  return (
    <div className={styles.pagination}>
      {/* Prev Button */}
      <button
        disabled={page <= 1}
        onClick={() => go(page - 1)}
        className={styles.btn}
      >
        Prev
      </button>

      {/* Page Numbers */}
      {Array.from({ length: totalPages }, (_, i) => {
        const pageNum = i + 1;
        return (
          <button
            key={pageNum}
            onClick={() => go(pageNum)}
            className={`${styles.btn} ${pageNum === page ? styles.active : ''}`}
          >
            {pageNum}
          </button>
        );
      })}

      {/* Next Button */}
      <button
        disabled={page >= totalPages}
        onClick={() => go(page + 1)}
        className={styles.btn}
      >
        Next
      </button>
    </div>
  );
}

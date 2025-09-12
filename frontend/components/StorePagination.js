'use client';
import styles from './styles/Pagination.module.css';

export default function Pagination({ page, totalPages, onPageChange }) {

  const go = (to) => {
    if (onPageChange) onPageChange(to);
  };

  return (
    <div className={styles.pagination}>
      <button
        disabled={page <= 1}
        onClick={() => go(page - 1)}
        className={styles.btn}
      >
        Prev
      </button>

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

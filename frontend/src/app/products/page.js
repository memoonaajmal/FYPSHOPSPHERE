export const dynamic = 'force-dynamic';
import SearchFilterBar from '../../../components/FilterBar';
import ProductCard from '../../../components/ProductCard';
import Pagination from '../../../components/Pagination';
import styles from '../../styles/ProductsPage.module.css'; 

export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

async function fetchProducts(searchParams) {
  const params = await searchParams;
  const q = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    )
  ).toString();

  const res = await fetch(`${BASE_URL}/api/products?${q}`);
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

export default async function ProductsPage({ searchParams }) {
  let productsData = { data: [], page: 1, totalPages: 1 };
  try {
    productsData = await fetchProducts(searchParams);
  } catch (err) {
    console.error('Error fetching products:', err);
  }

  const { data, page, totalPages } = productsData;

  return (
    <div className={styles.container}>
     

<div className={styles.productsGrid}>
  {data.length > 0 ? (
    data.map((p) => <ProductCard key={p.productId || p._id} product={p} />)
  ) : (
    <p className={styles.noProducts}>No products found.</p>
  )}
</div>


      <Pagination page={page} totalPages={totalPages} />
    </div>
  );
}

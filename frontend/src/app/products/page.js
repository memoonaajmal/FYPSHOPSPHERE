export const dynamic = 'force-dynamic';
import SearchFilterBar from '../../../components/FilterBar';
import ProductCard from '../../../components/ProductCard';
import Pagination from '../../../components/Pagination';
export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;


async function fetchProducts(searchParams) {
 const params = await searchParams;
  const q = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    )
  ).toString();

  const res = await fetch(`${BASE_URL}/api/products?${q}`, {
    
  });

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
    <div style={{ maxWidth: '800px', margin: 'auto', padding: '1rem' }}>
      <SearchFilterBar />
     <div className="grid md:grid-cols-2 gap-3 mt-4">
  {data.length > 0 ? (
    data.map((p) => (
      <ProductCard key={p._id} product={p} /> // ✅ fixed
    ))
  ) : (
    <p>No products found.</p>
  )}
</div>

      <Pagination page={page} totalPages={totalPages} />
    </div>
  );
}

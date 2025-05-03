'use client';

import { useEffect, useState } from 'react';
import ProductFormModal from '@/components/product/ProductFormModal';

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (!res.ok) {
        throw new Error(`Failed to fetch products: ${res.status}`);
      }

      const data = await res.json();

      if (!Array.isArray(data)) {
        console.error("Unexpected API response format:", data);
        setProducts([]);
        return;
      }

      setProducts(data);
      setFilteredProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
      setFilteredProducts([]);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this product?')) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    fetchProducts();
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between mb-4 gap-4">
        <h2 className="text-2xl font-bold">Products</h2>
        <div className="flex flex-1 sm:justify-end gap-2">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border rounded w-full sm:w-64"
          />
          <button
            onClick={() => {
              setEditingProduct(null);
              setModalOpen(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            + Add Product
          </button>
        </div>
      </div>

      <table className="w-full text-left border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Image</th>
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Description</th>
            <th className="p-2 border">Price</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product: Product) => (
              <tr key={product.id}>
                <td className="border p-2">
                  {product.image ? (
                    <img src={product.image} alt="" className="w-12 h-12 object-cover" />
                  ) : (
                    '—'
                  )}
                </td>
                <td className="border p-2">{product.name}</td>
                <td className="border p-2">{product.description}</td>
                <td className="border p-2">KES {product.price?.toLocaleString()}</td>
                <td className="border p-2">
                  <button
                    className="text-blue-600 hover:underline mr-2"
                    onClick={() => handleEdit(product)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-600 hover:underline"
                    onClick={() => handleDelete(product.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="p-4 text-center">No products found</td>
            </tr>
          )}
        </tbody>
      </table>

      <ProductFormModal
        open={modalOpen}
        setOpen={setModalOpen}
        fetchProducts={fetchProducts}
        editingProduct={editingProduct}
      />
    </div>
  );
}

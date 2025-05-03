'use client';

import { useEffect, useState } from 'react';


export default function ProductFormModal({
  open,
  setOpen,
  fetchProducts,
  editingProduct,
}: any) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
  });

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name || '',
        description: editingProduct.description || '',
        price: editingProduct.price || '',
        image: editingProduct.image || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
        image: '',
      });
    }
  }, [editingProduct]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const method = editingProduct ? 'PATCH' : 'POST';
    const url = editingProduct
      ? `/api/products/${editingProduct.id}`
      : '/api/products';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        price: parseFloat(formData.price),
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      console.error('Failed to save:', error);
      return;
    }

    setOpen(false);
    fetchProducts();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-md w-full max-w-lg shadow-lg space-y-4">
        <h2 className="text-xl font-semibold">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>

        <input
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />

        <textarea
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        <input
          name="price"
          type="number"
          step="0.01"
          placeholder="Price"
          value={formData.price}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        <input
          name="image"
          placeholder="Image URL"
          value={formData.image}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-4 py-2 rounded border"
          >
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">
            {editingProduct ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
}

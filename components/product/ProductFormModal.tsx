import { useEffect, useState } from 'react';

type Vendor = {
  id: number;
  name: string;
  website: string;
  logo: string;
};

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  url: string; // Added URL field
  vendorId: number | null;
  vendor: Vendor | null;
};

type ProductFormModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  fetchProducts: () => void;
  editingProduct: Product | null;
};

export default function ProductFormModal({
  open,
  setOpen,
  fetchProducts,
  editingProduct,
}: ProductFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    url: '', // Added URL field
    vendorId: '',
  });

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchVendors();
    }
  }, [open]);

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name || '',
        description: editingProduct.description || '',
        price: String(editingProduct.price) || '',
        image: editingProduct.image || '',
        url: editingProduct.url || '', // Added URL field
        vendorId: editingProduct.vendorId?.toString() || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
        image: '',
        url: '', // Added URL field
        vendorId: '',
      });
    }
    setError(null);
  }, [editingProduct, open]);

  const fetchVendors = async () => {
    setIsLoadingVendors(true);
    try {
      const response = await fetch('/api/vendors');
      if (!response.ok) {
        throw new Error('Failed to fetch vendors');
      }
      const data = await response.json();
      setVendors(data);
    } catch (err) {
      console.error('Error fetching vendors:', err);
      setError('Failed to load vendors');
    } finally {
      setIsLoadingVendors(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const method = editingProduct ? 'PATCH' : 'POST';
      const url = editingProduct
        ? `/api/products/${editingProduct.id}`
        : '/api/products';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price) || 0,
          vendorId: formData.vendorId ? parseInt(formData.vendorId) : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: `Server error: ${response.status}`
        }));
        throw new Error(errorData.error || 'Failed to save product');
      }

      await response.json();
      setOpen(false);
      fetchProducts();
    } catch (err) {
      console.error('Error saving product:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-md w-full max-w-lg shadow-lg space-y-4">
        <h2 className="text-xl font-semibold">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Product Name</label>
            <input
              id="name"
              name="name"
              placeholder="Product Name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border p-2 rounded mt-1"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              id="description"
              name="description"
              placeholder="Description"
              value={formData.description}
              onChange={handleChange}
              className="w-full border p-2 rounded mt-1"
              rows={3}
            />
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price (KES)</label>
            <input
              id="price"
              name="price"
              type="number"
              step="0.01"
              placeholder="Price"
              value={formData.price}
              onChange={handleChange}
              className="w-full border p-2 rounded mt-1"
              required
            />
          </div>

          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700">Image URL</label>
            <input
              id="image"
              name="image"
              placeholder="Image URL"
              value={formData.image}
              onChange={handleChange}
              className="w-full border p-2 rounded mt-1"
            />
          </div>

          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700">Product URL</label>
            <input
              id="url"
              name="url"
              placeholder="Product URL"
              value={formData.url}
              onChange={handleChange}
              className="w-full border p-2 rounded mt-1"
              type="url"
            />
          </div>

          <div className="border-t pt-4 mt-4">
            <h3 className="font-medium text-gray-900 mb-2">Vendor Information</h3>
            
            <div>
              <label htmlFor="vendorId" className="block text-sm font-medium text-gray-700">Select Vendor</label>
              <select
                id="vendorId"
                name="vendorId"
                value={formData.vendorId}
                onChange={handleChange}
                className="w-full border p-2 rounded mt-1"
                disabled={isLoadingVendors}
              >
                <option value="">-- Select a vendor --</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
              {isLoadingVendors && (
                <p className="text-sm text-gray-500 mt-1">Loading vendors...</p>
              )}
            </div>

            {formData.vendorId && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <h4 className="text-sm font-medium text-gray-700">Selected Vendor Details</h4>
                {vendors.find(v => v.id.toString() === formData.vendorId)?.logo && (
                  <img 
                    src={vendors.find(v => v.id.toString() === formData.vendorId)?.logo} 
                    alt="Vendor logo" 
                    className="h-10 w-10 object-contain mt-2"
                  />
                )}
                <p className="text-sm mt-1">
                  <a 
                    href={vendors.find(v => v.id.toString() === formData.vendorId)?.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {vendors.find(v => v.id.toString() === formData.vendorId)?.website}
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-4 py-2 rounded border hover:bg-gray-100"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 flex items-center"
            disabled={isSubmitting || isLoadingVendors}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {editingProduct ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>{editingProduct ? 'Update' : 'Create'}</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
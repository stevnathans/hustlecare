'use client'

import { useEffect, useState } from 'react'
import { Dialog } from '@headlessui/react'
import { PlusIcon } from '@heroicons/react/24/solid'

type Requirement = {
  id: number
  name: string
  description?: string
  image?: string
  category: string
  businessId: number
  necessity: 'Required' | 'Optional'
  productCount: number
  commentCount: number
  business: {
    name: string
  }
}

type Business = {
  id: number
  name: string
  description?: string
  image?: string
}

// Add this type definition for your form data
type FormData = {
  name: string
  description: string
  image: string
  category: string
  businessId: string | number
  necessity: 'Required' | 'Optional'
}

const defaultForm: FormData = {
  name: '',
  description: '',
  image: '',
  category: '',
  businessId: '',
  necessity: 'Required',
}

export default function RequirementsPage() {
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [formData, setFormData] = useState<FormData>(defaultForm) // Changed from 'any' to 'FormData'
  const [isOpen, setIsOpen] = useState(false)
  const [editingRequirement, setEditingRequirement] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [businessOptions, setBusinessOptions] = useState<Business[]>([])

  useEffect(() => {
    fetchRequirements()
    fetchOptions()
  }, [])

  const fetchRequirements = async () => {
    try {
      const res = await fetch('/api/requirements')
      if (!res.ok) {
        throw new Error(`Failed to fetch requirements: ${res.status}`);
      }
  
      const data = await res.json();
  
      if (!Array.isArray(data)) {
        console.error("Unexpected API response format:", data);
        setRequirements([]); // Set to an empty array to avoid errors
        return;
      }
  
      setRequirements(data);
    } catch (error) {
      console.error("Error fetching requirements:", error);
      setRequirements([]); // Ensure it's always an array
    }
  };
  

  const fetchOptions = async () => {
    const [bizRes] = await Promise.all([
      fetch('/api/businesses'),
    ])
    const businesses = await bizRes.json()
    setBusinessOptions(businesses)
  }

  const filtered = Array.isArray(requirements)
  ? requirements.filter((req) =>
      req.name.toLowerCase().includes(search.toLowerCase())
    )
  : [];

  const openNewModal = () => {
    setFormData(defaultForm)
    setEditingRequirement(null)
    setIsOpen(true)
  }

  const openEditModal = (req: Requirement) => {
    setFormData({
      name: req.name,
      description: req.description || '',
      image: req.image || '',
      category: req.category,
      businessId: String(req.businessId),
      necessity: req.necessity,
    })
    setEditingRequirement(req.id)
    setIsOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this requirement?')) return
    await fetch(`/api/requirements/${id}`, {
      method: 'DELETE',
    })
    fetchRequirements()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    try {
      const method = editingRequirement ? "PATCH" : "POST";
      const url = editingRequirement
        ? `/api/requirements/${editingRequirement}`
        : "/api/requirements";
  
      const payload = {
        ...formData,
        businessId: Number(formData.businessId),
        // Note: Removed categoryId as it's not in your FormData type
      };
  
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
  
      if (!res.ok) {
        const error = await res.json();
        console.error("Failed to save requirement:", error);
        return;
      }
  
      setIsOpen(false);
      fetchRequirements();
    } catch (error) {
      console.error("Failed to submit:", error);
    }
  };
  

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Requirements</h1>
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search..."
            className="border px-3 py-2 rounded-md"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            onClick={openNewModal}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Requirement
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border rounded-md">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left px-4 py-2">Name</th>
              <th className="text-left px-4 py-2">Description</th>
              <th className="text-left px-4 py-2">Image</th>
              <th className="text-left px-4 py-2">Category</th>
              <th className="text-left px-4 py-2">Business</th>
              <th className="text-left px-4 py-2">Necessity</th>
              <th className="text-left px-4 py-2">Comments</th>
              <th className="text-left px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((req) => (
              <tr key={req.id} className="border-t">
                <td className="px-4 py-2 font-medium">{req.name}</td>
                <td className="px-4 py-2">{req.description}</td>
                <td className="px-4 py-2">
                  {req.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={req.image}
                      alt={req.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                </td>
                <td className="px-4 py-2">{req.category}</td>
                <td className="px-4 py-2">{req.business?.name}</td>
                <td
                  className={`px-4 py-2 font-semibold ${
                    req.necessity === 'Required'
                      ? 'text-green-600'
                      : 'text-orange-500'
                  }`}
                >
                  {req.necessity}
                </td>
                <td className="px-4 py-2">{req.productCount}</td>
                <td className="px-4 py-2">{req.commentCount}</td>
                <td className="px-4 py-2 space-x-2">
                  <button
                    onClick={() => openEditModal(req)}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(req.id)}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-md p-6 w-full max-w-md">
            <Dialog.Title className="text-xl font-bold mb-4">
              {editingRequirement ? 'Edit Requirement' : 'Add Requirement'}
            </Dialog.Title>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Name"
                className="w-full border px-3 py-2 rounded"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <textarea
                placeholder="Description"
                className="w-full border px-3 py-2 rounded"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <input
                type="text"
                placeholder="Image URL"
                className="w-full border px-3 py-2 rounded"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              />
              <select
                className="w-full border px-3 py-2 rounded"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              >
                <option value="">Select Category</option>
                {['Equipment', 'Software', 'Documents', 'Legal', 'Branding Resources', 'Operating Expenses'].map((cat) => (
  <option key={cat} value={cat}>
    {cat}
  </option>
))}

              </select>
              <select
                className="w-full border px-3 py-2 rounded"
                value={formData.businessId}
                onChange={(e) =>
                  setFormData({ ...formData, businessId: e.target.value })
                }
                
                required
              >
                <option value="">Select Business</option>
                {businessOptions.map((biz) => (
                  <option key={biz.id} value={biz.id}>
                    {biz.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-4">
  <label className="flex items-center gap-2">
    <input
      type="radio"
      name="necessity"
      value="Required"
      checked={formData.necessity === 'Required'}
      onChange={(e) => setFormData({ ...formData, necessity: e.target.value as 'Required' | 'Optional' })}
    />
    <span className="text-green-600 font-medium">Required</span>
  </label>
  <label className="flex items-center gap-2">
    <input
      type="radio"
      name="necessity"
      value="Optional"
      checked={formData.necessity === 'Optional'}
      onChange={(e) => setFormData({ ...formData, necessity: e.target.value as 'Required' | 'Optional' })}
    />
    <span className="text-orange-500 font-medium">Optional</span>
  </label>
</div>


              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-gray-300 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {editingRequirement ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  )
}
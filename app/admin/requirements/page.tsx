'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import RequirementCSVImport from '@/components/RequirementCSVImport'; 

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
  const [formData, setFormData] = useState<FormData>(defaultForm)
  const [isOpen, setIsOpen] = useState(false)
  const [editingRequirement, setEditingRequirement] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [businessOptions, setBusinessOptions] = useState<Business[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

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
        setRequirements([]);
        return;
      }
  
      setRequirements(data);
    } catch (error) {
      console.error("Error fetching requirements:", error);
      setRequirements([]);
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

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} requirement(s)?`)) return
    
    try {
      await Promise.all(
        Array.from(selectedIds).map(id =>
          fetch(`/api/requirements/${id}`, {
            method: 'DELETE',
          })
        )
      )
      setSelectedIds(new Set())
      fetchRequirements()
    } catch (error) {
      console.error("Failed to delete requirements:", error)
    }
  }

  const toggleSelection = (id: number) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map(req => req.id)))
    }
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

  const allSelected = filtered.length > 0 && selectedIds.size === filtered.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < filtered.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-6 lg:p-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-1">Requirements</h1>
              <p className="text-slate-600">Manage your business requirements and dependencies</p>
            </div>
            <div className="flex items-center gap-3">
              <RequirementCSVImport onImportComplete={fetchRequirements} />
              <button
                onClick={openNewModal}
                className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md font-medium"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Requirement
              </button>
            </div>
          </div>
          
          {/* Search Bar and Bulk Actions */}
          <div className="mt-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative max-w-md flex-1">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search requirements..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                <span className="text-sm font-medium text-blue-900">
                  {selectedIds.size} selected
                </span>
                <button
                  onClick={handleBulkDelete}
                  className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors font-medium"
                >
                  <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Selected
                </button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="text-slate-600 hover:text-slate-800 text-sm font-medium"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 w-12">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={input => {
                        if (input) {
                          input.indeterminate = someSelected
                        }
                      }}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">Name</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">Description</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">Image</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">Category</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">Business</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">Necessity</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filtered.map((req) => (
                  <tr 
                    key={req.id} 
                    className={`transition-colors ${
                      selectedIds.has(req.id) ? 'bg-blue-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(req.id)}
                        onChange={() => toggleSelection(req.id)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{req.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600 max-w-xs truncate">{req.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      {req.image && (
                        <div className="relative w-12 h-12">
                          <Image
                            src={req.image}
                            alt={req.name}
                            fill
                            className="object-cover rounded-lg border border-slate-200"
                            sizes="48px"
                          />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        {req.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900">{req.business?.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        req.necessity === 'Required'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {req.necessity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600">{req.productCount}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600">{req.commentCount}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(req)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(req.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500">No requirements found</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                {editingRequirement ? 'Edit Requirement' : 'Add New Requirement'}
              </h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Name *</label>
                  <input
                    type="text"
                    placeholder="Enter requirement name"
                    className="w-full border border-slate-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                  <textarea
                    placeholder="Enter description"
                    className="w-full border border-slate-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow resize-none"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Image URL</label>
                  <input
                    type="text"
                    placeholder="https://example.com/image.jpg"
                    className="w-full border border-slate-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Category *</label>
                  <select
                    className="w-full border border-slate-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
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
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Business *</label>
                  <select
                    className="w-full border border-slate-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                    value={formData.businessId}
                    onChange={(e) => setFormData({ ...formData, businessId: e.target.value })}
                    required
                  >
                    <option value="">Select Business</option>
                    {businessOptions.map((biz) => (
                      <option key={biz.id} value={biz.id}>
                        {biz.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">Necessity *</label>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="necessity"
                        value="Required"
                        checked={formData.necessity === 'Required'}
                        onChange={(e) => setFormData({ ...formData, necessity: e.target.value as 'Required' | 'Optional' })}
                        className="w-4 h-4 text-green-600"
                      />
                      <span className="text-green-700 font-medium group-hover:text-green-800">Required</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="necessity"
                        value="Optional"
                        checked={formData.necessity === 'Optional'}
                        onChange={(e) => setFormData({ ...formData, necessity: e.target.value as 'Required' | 'Optional' })}
                        className="w-4 h-4 text-amber-600"
                      />
                      <span className="text-amber-700 font-medium group-hover:text-amber-800">Optional</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md font-medium"
                  >
                    {editingRequirement ? 'Update Requirement' : 'Create Requirement'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
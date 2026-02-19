/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import Image from 'next/image'
import RequirementCSVImport from '@/components/RequirementCSVImport'

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

type SortField = 'name' | 'category' | 'business' | 'necessity' | 'productCount' | 'commentCount'
type SortDir = 'asc' | 'desc'
type ViewMode = 'table' | 'cards'

const CATEGORIES = ['Equipment', 'Software', 'Documents', 'Legal', 'Branding', 'Operating Expenses']

const CATEGORY_COLORS: Record<string, string> = {
  Equipment: 'bg-blue-100 text-blue-800',
  Software: 'bg-purple-100 text-purple-800',
  Documents: 'bg-yellow-100 text-yellow-800',
  Legal: 'bg-red-100 text-red-800',
  Branding: 'bg-pink-100 text-pink-800',
  'Operating Expenses': 'bg-teal-100 text-teal-800',
}

const defaultForm: FormData = {
  name: '',
  description: '',
  image: '',
  category: '',
  businessId: '',
  necessity: 'Required',
}

function SortIcon({ field, sortField, sortDir }: { field: string; sortField: string; sortDir: SortDir }) {
  if (sortField !== field) return (
    <svg className="h-3.5 w-3.5 text-slate-300 ml-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
    </svg>
  )
  return sortDir === 'asc' ? (
    <svg className="h-3.5 w-3.5 text-blue-600 ml-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  ) : (
    <svg className="h-3.5 w-3.5 text-blue-600 ml-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

export default function RequirementsPage() {
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [formData, setFormData] = useState<FormData>(defaultForm)
  const [isOpen, setIsOpen] = useState(false)
  const [editingRequirement, setEditingRequirement] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [businessOptions, setBusinessOptions] = useState<Business[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false)

  // New state
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [filterBusiness, setFilterBusiness] = useState<string>('')
  const [filterNecessity, setFilterNecessity] = useState<string>('')
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [groupBy, setGroupBy] = useState<'none' | 'category' | 'business' | 'necessity'>('none')
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    fetchRequirements()
    fetchOptions()
  }, [])

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchRequirements = async () => {
    try {
      const res = await fetch('/api/requirements')
      if (!res.ok) throw new Error(`Failed to fetch requirements: ${res.status}`)
      const data = await res.json()
      if (!Array.isArray(data)) { setRequirements([]); return }
      setRequirements(data)
    } catch (error) {
      console.error('Error fetching requirements:', error)
      setRequirements([])
    }
  }

  const fetchOptions = async () => {
    const [bizRes] = await Promise.all([fetch('/api/businesses')])
    const businesses = await bizRes.json()
    setBusinessOptions(businesses)
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const activeFilterCount = [filterCategory, filterBusiness, filterNecessity].filter(Boolean).length

  const filtered = useMemo(() => {
    if (!Array.isArray(requirements)) return []
    return requirements
      .filter(req =>
        req.name.toLowerCase().includes(search.toLowerCase()) ||
        req.description?.toLowerCase().includes(search.toLowerCase()) ||
        req.category.toLowerCase().includes(search.toLowerCase()) ||
        req.business?.name.toLowerCase().includes(search.toLowerCase())
      )
      .filter(req => !filterCategory || req.category === filterCategory)
      .filter(req => !filterBusiness || String(req.businessId) === filterBusiness)
      .filter(req => !filterNecessity || req.necessity === filterNecessity)
      .sort((a, b) => {
        let valA: string | number = ''
        let valB: string | number = ''
        switch (sortField) {
          case 'name': valA = a.name; valB = b.name; break
          case 'category': valA = a.category; valB = b.category; break
          case 'business': valA = a.business?.name || ''; valB = b.business?.name || ''; break
          case 'necessity': valA = a.necessity; valB = b.necessity; break
          case 'productCount': valA = a.productCount; valB = b.productCount; break
          case 'commentCount': valA = a.commentCount; valB = b.commentCount; break
        }
        if (typeof valA === 'string') {
          return sortDir === 'asc' ? valA.localeCompare(valB as string) : (valB as string).localeCompare(valA)
        }
        return sortDir === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number)
      })
  }, [requirements, search, filterCategory, filterBusiness, filterNecessity, sortField, sortDir])

  const grouped = useMemo(() => {
    if (groupBy === 'none') return { '': filtered }
    const groups: Record<string, Requirement[]> = {}
    filtered.forEach(req => {
      const key = groupBy === 'business' ? req.business?.name || 'Unknown'
        : groupBy === 'category' ? req.category
        : req.necessity
      if (!groups[key]) groups[key] = []
      groups[key].push(req)
    })
    return Object.fromEntries(Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)))
  }, [filtered, groupBy])

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

  const openDeleteConfirm = (id: number) => {
    setDeletingId(id)
    setDeleteConfirmOpen(true)
  }

  const handleDelete = async () => {
    if (deletingId === null) return
    await fetch(`/api/requirements/${deletingId}`, { method: 'DELETE' })
    setDeleteConfirmOpen(false)
    setDeletingId(null)
    fetchRequirements()
    showToast('Requirement deleted successfully')
  }

  const openBulkDeleteConfirm = () => {
    if (selectedIds.size === 0) return
    setBulkDeleteConfirmOpen(true)
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    try {
      await Promise.all(
        Array.from(selectedIds).map(id => fetch(`/api/requirements/${id}`, { method: 'DELETE' }))
      )
      setSelectedIds(new Set())
      setBulkDeleteConfirmOpen(false)
      fetchRequirements()
      showToast(`${selectedIds.size} requirements deleted`)
    } catch (error) {
      console.error('Failed to delete requirements:', error)
      showToast('Failed to delete some requirements', 'error')
    }
  }

  const toggleSelection = (id: number) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) newSelected.delete(id)
    else newSelected.add(id)
    setSelectedIds(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(filtered.map(req => req.id)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const method = editingRequirement ? 'PATCH' : 'POST'
      const url = editingRequirement ? `/api/requirements/${editingRequirement}` : '/api/requirements'
      const payload = { ...formData, businessId: Number(formData.businessId) }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const error = await res.json()
        console.error('Failed to save requirement:', error)
        showToast('Failed to save requirement', 'error')
        return
      }
      setIsOpen(false)
      fetchRequirements()
      showToast(editingRequirement ? 'Requirement updated' : 'Requirement created')
    } catch (error) {
      console.error('Failed to submit:', error)
      showToast('Something went wrong', 'error')
    }
  }

  const clearAllFilters = () => {
    setSearch('')
    setFilterCategory('')
    setFilterBusiness('')
    setFilterNecessity('')
  }

  const allSelected = filtered.length > 0 && selectedIds.size === filtered.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < filtered.length
  const deletingRequirement = deletingId ? requirements.find(r => r.id === deletingId) : null

  const stats = useMemo(() => ({
    total: requirements.length,
    required: requirements.filter(r => r.necessity === 'Required').length,
    optional: requirements.filter(r => r.necessity === 'Optional').length,
    categories: new Set(requirements.map(r => r.category)).size,
  }), [requirements])

  const SortableTH = ({ field, label }: { field: SortField; label: string }) => (
    <th
      className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer select-none hover:text-slate-900 hover:bg-slate-100 transition-colors"
      onClick={() => handleSort(field)}
    >
      {label}
      <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
    </th>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50/30">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all animate-in slide-in-from-top-2 ${
          toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
        }`}>
          {toast.type === 'success' ? (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {toast.message}
        </div>
      )}

      <div className="max-w-7xl mx-auto p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-1">Requirements</h1>
              <p className="text-slate-500 text-sm">Manage your business requirements and dependencies</p>
            </div>
            <div className="flex items-center gap-3">
              <RequirementCSVImport onImportComplete={fetchRequirements} />
              <button
                onClick={openNewModal}
                className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md font-medium text-sm"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Requirement
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total', value: stats.total, color: 'bg-slate-900 text-white' },
              { label: 'Required', value: stats.required, color: 'bg-green-600 text-white' },
              { label: 'Optional', value: stats.optional, color: 'bg-amber-500 text-white' },
              { label: 'Categories', value: stats.categories, color: 'bg-blue-600 text-white' },
            ].map(stat => (
              <div key={stat.label} className={`${stat.color} rounded-xl px-4 py-3 flex items-center justify-between shadow-sm`}>
                <span className="text-sm font-medium opacity-90">{stat.label}</span>
                <span className="text-2xl font-bold">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Controls Bar */}
        <div className="mb-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name, description, category..."
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm text-sm"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Filters toggle */}
              <button
                onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                className={`inline-flex items-center px-3.5 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  isFiltersExpanded || activeFilterCount > 0
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-2 bg-blue-600 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Group by */}
              <select
                value={groupBy}
                onChange={e => setGroupBy(e.target.value as typeof groupBy)}
                className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              >
                <option value="none">No grouping</option>
                <option value="category">Group by Category</option>
                <option value="business">Group by Business</option>
                <option value="necessity">Group by Necessity</option>
              </select>

              {/* View toggle */}
              <div className="flex rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2.5 transition-colors ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                  title="Table view"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 6h18M3 14h18M3 18h18" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-2.5 transition-colors ${viewMode === 'cards' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                  title="Card view"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Filter Panel */}
          {isFiltersExpanded && (
            <div className="flex flex-wrap gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <select
                value={filterBusiness}
                onChange={e => setFilterBusiness(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Businesses</option>
                {businessOptions.map(biz => (
                  <option key={biz.id} value={String(biz.id)}>{biz.name}</option>
                ))}
              </select>

              <select
                value={filterNecessity}
                onChange={e => setFilterNecessity(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Any Necessity</option>
                <option value="Required">Required</option>
                <option value="Optional">Optional</option>
              </select>

              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="px-3 py-2 text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1.5"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear all
                </button>
              )}
            </div>
          )}

          {/* Bulk actions */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 bg-blue-50 px-4 py-2.5 rounded-xl border border-blue-200">
              <span className="text-sm font-medium text-blue-900">{selectedIds.size} selected</span>
              <button
                onClick={openBulkDeleteConfirm}
                className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                <svg className="h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Selected
              </button>
              <button onClick={() => setSelectedIds(new Set())} className="text-slate-500 hover:text-slate-700 text-sm">
                Clear
              </button>
            </div>
          )}

          {/* Results count */}
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>
              Showing <span className="font-medium text-slate-700">{filtered.length}</span> of{' '}
              <span className="font-medium text-slate-700">{requirements.length}</span> requirements
            </span>
            {(search || activeFilterCount > 0) && (
              <button onClick={clearAllFilters} className="text-blue-600 hover:text-blue-700 font-medium">
                Clear search & filters
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {Object.entries(grouped).map(([groupKey, groupReqs]) => (
          <div key={groupKey} className="mb-6">
            {groupBy !== 'none' && groupKey && (
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">{groupKey}</h2>
                <span className="text-xs bg-slate-200 text-slate-600 rounded-full px-2 py-0.5">{groupReqs.length}</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
            )}

            {viewMode === 'table' ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-4 w-12">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            ref={input => { if (input) input.indeterminate = someSelected }}
                            onChange={toggleSelectAll}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </th>
                        <SortableTH field="name" label="Name" />
                        <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Description</th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Image</th>
                        <SortableTH field="category" label="Category" />
                        <SortableTH field="business" label="Business" />
                        <SortableTH field="necessity" label="Necessity" />
                        <SortableTH field="productCount" label="Products" />
                        <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {groupReqs.map(req => (
                        <tr
                          key={req.id}
                          className={`transition-colors ${selectedIds.has(req.id) ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
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
                            <div className="font-medium text-slate-900 text-sm">{req.name}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-slate-500 max-w-xs truncate">{req.description}</div>
                          </td>
                          <td className="px-6 py-4">
                            {req.image && (
                              <div className="relative w-10 h-10">
                                <Image src={req.image} alt={req.name} fill className="object-cover rounded-lg border border-slate-200" sizes="40px" />
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[req.category] || 'bg-slate-100 text-slate-800'}`}>
                              {req.category}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-slate-900">{req.business?.name}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              req.necessity === 'Required' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {req.necessity}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-slate-500 flex items-center gap-1">
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                                </svg>
                                {req.productCount}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              <button onClick={() => openEditModal(req)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button onClick={() => openDeleteConfirm(req.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
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
                {groupReqs.length === 0 && (
                  <div className="text-center py-16">
                    <svg className="h-12 w-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-slate-400 font-medium">No requirements found</p>
                    <p className="text-slate-400 text-sm mt-1">Try adjusting your search or filters</p>
                  </div>
                )}
              </div>
            ) : (
              /* Card View */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupReqs.map(req => (
                  <div
                    key={req.id}
                    className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-all overflow-hidden ${
                      selectedIds.has(req.id) ? 'border-blue-400 ring-2 ring-blue-200' : 'border-slate-200'
                    }`}
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(req.id)}
                            onChange={() => toggleSelection(req.id)}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer mt-0.5"
                          />
                          {req.image && (
                            <div className="relative w-9 h-9 flex-shrink-0">
                              <Image src={req.image} alt={req.name} fill className="object-cover rounded-lg border border-slate-200" sizes="36px" />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEditModal(req)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button onClick={() => openDeleteConfirm(req.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <h3 className="font-semibold text-slate-900 text-sm mb-1 line-clamp-1">{req.name}</h3>
                      {req.description && (
                        <p className="text-slate-500 text-xs line-clamp-2 mb-3">{req.description}</p>
                      )}

                      <div className="flex flex-wrap gap-1.5 mt-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[req.category] || 'bg-slate-100 text-slate-800'}`}>
                          {req.category}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          req.necessity === 'Required' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {req.necessity}
                        </span>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>{req.business?.name}</span>
                        <div className="flex items-center gap-2.5">
                          <span className="flex items-center gap-1">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                            </svg>
                            {req.productCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            {req.commentCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {groupReqs.length === 0 && (
                  <div className="col-span-full text-center py-16">
                    <p className="text-slate-400 font-medium">No requirements found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">
                  {editingRequirement ? 'Edit Requirement' : 'Add New Requirement'}
                </h2>
                <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Name *</label>
                  <input
                    type="text"
                    placeholder="Enter requirement name"
                    className="w-full border border-slate-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                  <textarea
                    placeholder="Enter description"
                    className="w-full border border-slate-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                    rows={3}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Image URL</label>
                  <input
                    type="text"
                    placeholder="https://example.com/image.jpg"
                    className="w-full border border-slate-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    value={formData.image}
                    onChange={e => setFormData({ ...formData, image: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Category *</label>
                    <select
                      className="w-full border border-slate-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      required
                    >
                      <option value="">Select Category</option>
                      {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Business *</label>
                    <select
                      className="w-full border border-slate-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      value={formData.businessId}
                      onChange={e => setFormData({ ...formData, businessId: e.target.value })}
                      required
                    >
                      <option value="">Select Business</option>
                      {businessOptions.map(biz => <option key={biz.id} value={biz.id}>{biz.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Necessity *</label>
                  <div className="flex gap-4">
                    {(['Required', 'Optional'] as const).map(val => (
                      <label key={val} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.necessity === val
                          ? val === 'Required' ? 'border-green-500 bg-green-50' : 'border-amber-500 bg-amber-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}>
                        <input
                          type="radio"
                          name="necessity"
                          value={val}
                          checked={formData.necessity === val}
                          onChange={e => setFormData({ ...formData, necessity: e.target.value as 'Required' | 'Optional' })}
                          className="sr-only"
                        />
                        <span className={`text-sm font-medium ${
                          formData.necessity === val
                            ? val === 'Required' ? 'text-green-700' : 'text-amber-700'
                            : 'text-slate-600'
                        }`}>{val}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium text-sm"
                  >
                    {editingRequirement ? 'Update' : 'Create'} Requirement
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirmOpen(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Delete Requirement</h3>
              <p className="text-slate-600 text-center mb-6 text-sm">
                Are you sure you want to delete <span className="font-semibold text-slate-900">&quot;{deletingRequirement?.name}&quot;</span>? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setDeleteConfirmOpen(false)} className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium text-sm">Cancel</button>
                <button onClick={handleDelete} className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {bulkDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setBulkDeleteConfirmOpen(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Delete Multiple Requirements</h3>
              <p className="text-slate-600 text-center mb-6 text-sm">
                Are you sure you want to delete <span className="font-semibold text-slate-900">{selectedIds.size} requirement{selectedIds.size !== 1 ? 's' : ''}</span>? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setBulkDeleteConfirmOpen(false)} className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium text-sm">Cancel</button>
                <button onClick={handleBulkDelete} className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm">
                  Delete {selectedIds.size} Requirement{selectedIds.size !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
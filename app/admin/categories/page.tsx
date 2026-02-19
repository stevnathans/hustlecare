'use client';
import { useEffect, useState, useMemo } from 'react';
import {
  Search, Plus, Edit2, Trash2, Tag, ExternalLink, X
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { getCategoryIcon } from '@/components/CategoryCard';

type Category = {
  id: number;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  _count: { businesses: number };
};

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function AdminCategoriesPage() {
  const [categories, setCategories]       = useState<Category[]>([]);
  const [search, setSearch]               = useState('');
  const [loading, setLoading]             = useState(false);
  const [isModalOpen, setIsModalOpen]     = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedIds, setSelectedIds]     = useState<number[]>([]);
  const [formData, setFormData]           = useState({ name: '', slug: '' });
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  useEffect(() => { fetchCategories(); }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.filter((c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q));
  }, [categories, search]);

  async function fetchCategories() {
    try {
      const res = await fetch('/api/admin/categories');
      if (res.ok) setCategories(await res.json());
    } catch {
      toast.error('Failed to load categories');
    }
  }

  // ── Modal helpers ──────────────────────────────────────────────────────────

  function openCreateModal() {
    setFormData({ name: '', slug: '' });
    setSlugManuallyEdited(false);
    setEditingCategory(null);
    setIsModalOpen(true);
  }

  function openEditModal(cat: Category) {
    setFormData({ name: cat.name, slug: cat.slug });
    setSlugManuallyEdited(true); // treat existing slug as manually set
    setEditingCategory(cat);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingCategory(null);
  }

  function handleNameChange(name: string) {
    setFormData((prev) => ({
      name,
      slug: slugManuallyEdited ? prev.slug : generateSlug(name),
    }));
  }

  function handleSlugChange(slug: string) {
    setSlugManuallyEdited(true);
    setFormData((prev) => ({ ...prev, slug }));
  }

  // ── CRUD ───────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) { toast.error('Name is required'); return; }
    if (!formData.slug.trim()) { toast.error('Slug is required'); return; }

    setLoading(true);
    try {
      const method = editingCategory ? 'PATCH' : 'POST';
      const body   = editingCategory
        ? { id: editingCategory.id, ...formData }
        : formData;

      const res = await fetch('/api/admin/categories', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      toast.success(editingCategory ? 'Category updated!' : 'Category created!');
      closeModal();
      fetchCategories();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number, businessCount: number) {
    if (businessCount > 0) {
      toast.error(
        `Cannot delete — ${businessCount} business${businessCount !== 1 ? 'es are' : ' is'} using this category.`
      );
      return;
    }
    if (!confirm('Delete this category?')) return;

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');

      toast.success('Category deleted');
      fetchCategories();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    }
  }

  async function handleBulkDelete() {
    const blocked = categories.filter(
      (c) => selectedIds.includes(c.id) && c._count.businesses > 0
    );
    if (blocked.length > 0) {
      toast.error(
        `${blocked.length} categor${blocked.length > 1 ? 'ies have' : 'y has'} businesses attached and cannot be deleted.`
      );
      return;
    }
    if (!confirm(`Delete ${selectedIds.length} categories?`)) return;

    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch('/api/admin/categories', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
          })
        )
      );
      toast.success(`${selectedIds.length} categories deleted`);
      setSelectedIds([]);
      fetchCategories();
    } catch {
      toast.error('Bulk delete failed');
    }
  }

  // ── Selection ──────────────────────────────────────────────────────────────

  function toggleSelectAll() {
    setSelectedIds(
      selectedIds.length === filtered.length ? [] : filtered.map((c) => c.id)
    );
  }

  function toggleSelect(id: number) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-500 mt-1">
            Manage business categories — {categories.length} total
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              <Trash2 className="h-4 w-4" />
              Delete {selectedIds.length}
            </button>
          )}
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
          >
            <Plus className="h-4 w-4" />
            Add Category
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search categories…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filtered.length && filtered.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Slug
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Businesses
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide hidden md:table-cell">
                  Created
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((cat) => {
                const Icon = getCategoryIcon(cat.name);
                return (
                  <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(cat.id)}
                        onChange={() => toggleSelect(cat.id)}
                        className="rounded border-gray-300"
                      />
                    </td>

                    {/* Name + icon */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4" strokeWidth={1.75} />
                        </div>
                        <span className="font-medium text-gray-900 text-sm">{cat.name}</span>
                      </div>
                    </td>

                    {/* Slug */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <code className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {cat.slug}
                        </code>
                        <a
                          href={`/categories/${cat.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-300 hover:text-emerald-500 transition-colors"
                          title="View public page"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>

                    {/* Business count */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                        cat._count.businesses > 0
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {cat._count.businesses}
                        <span className="font-normal">
                          {cat._count.businesses === 1 ? ' business' : ' businesses'}
                        </span>
                      </span>
                    </td>

                    {/* Created */}
                    <td className="px-4 py-3 text-xs text-gray-400 hidden md:table-cell">
                      {new Date(cat.createdAt).toLocaleDateString('en-US', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(cat)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id, cat._count.businesses)}
                          className={`p-2 rounded-lg transition-colors ${
                            cat._count.businesses > 0
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-red-500 hover:bg-red-50'
                          }`}
                          title={
                            cat._count.businesses > 0
                              ? 'Cannot delete — has businesses'
                              : 'Delete'
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Tag className="w-5 h-5 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">
              {search ? `No categories match "${search}"` : 'No categories yet'}
            </p>
            {!search && (
              <button
                onClick={openCreateModal}
                className="mt-3 text-xs text-emerald-600 hover:text-emerald-700 font-medium underline underline-offset-2"
              >
                Create your first category
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Modal ─────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/40" onClick={closeModal} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-xl p-6 w-full max-w-md shadow-xl">

              {/* Modal header */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900">
                  {editingCategory ? 'Edit Category' : 'New Category'}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Technology"
                    className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    autoFocus
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">
                      /categories/
                    </span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      placeholder="technology"
                      className="w-full border border-gray-300 pl-24 pr-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Auto-generated from name. Edit manually if needed.
                  </p>
                </div>

                {/* Preview */}
                {formData.name && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    {(() => {
                      const Icon = getCategoryIcon(formData.name);
                      return (
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4" strokeWidth={1.75} />
                        </div>
                      );
                    })()}
                    <div>
                      <p className="text-sm font-medium text-gray-800">{formData.name}</p>
                      <p className="text-xs text-gray-400">/categories/{formData.slug || '…'}</p>
                    </div>
                  </div>
                )}

                {/* Footer buttons */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Saving…' : editingCategory ? 'Save Changes' : 'Create Category'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
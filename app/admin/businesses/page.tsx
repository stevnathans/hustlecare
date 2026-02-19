'use client';
import { useEffect, useState, useMemo } from "react";
import BusinessCSVImport from '@/components/BusinessCSVImport';
import Image from "next/image";
import {
  Search, Plus, Edit2, Trash2, Eye, EyeOff, Download, Tag, Filter, X,
  ArrowUpDown, ArrowUp, ArrowDown, Grid, List, Copy, ExternalLink,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

type Category = { id: number; name: string; };
type Business = {
  id: number; name: string; description?: string; image?: string; slug: string;
  published: boolean; category?: Category | null; createdAt: string; updatedAt: string;
  _count?: { requirements: number; };
};

type SortField = 'name' | 'createdAt' | 'requirements' | 'category';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'table' | 'grid';

const CREATE_NEW = "__CREATE_NEW__";

export default function BusinessesAdminPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [newCategoryName, setNewCategoryName] = useState("");

  const [formData, setFormData] = useState({
    name: "", description: "", image: "", slug: "", published: true,
  });

  useEffect(() => {
    fetchBusinesses();
    fetchCategories();
  }, []);

  const filteredAndSortedBusinesses = useMemo(() => {
    let filtered = businesses;

    if (search) {
      filtered = filtered.filter((b) =>
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.description?.toLowerCase().includes(search.toLowerCase()) ||
        b.category?.name.toLowerCase().includes(search.toLowerCase()) ||
        b.slug.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (categoryFilter !== "all") {
      if (categoryFilter === "uncategorized") {
        filtered = filtered.filter((b) => !b.category);
      } else {
        filtered = filtered.filter((b) => b.category?.id === Number(categoryFilter));
      }
    }

    if (statusFilter === "published") {
      filtered = filtered.filter((b) => b.published);
    } else if (statusFilter === "draft") {
      filtered = filtered.filter((b) => !b.published);
    }

    if (dateFilter !== "all") {
      const now = new Date();
      filtered = filtered.filter((b) => {
        const createdDate = new Date(b.createdAt);
        const diffDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        if (dateFilter === "today") return diffDays === 0;
        if (dateFilter === "week") return diffDays <= 7;
        if (dateFilter === "month") return diffDays <= 30;
        return true;
      });
    }

    filtered.sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';

      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'createdAt':
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
          break;
        case 'requirements':
          aVal = a._count?.requirements || 0;
          bVal = b._count?.requirements || 0;
          break;
        case 'category':
          aVal = a.category?.name.toLowerCase() || '';
          bVal = b.category?.name.toLowerCase() || '';
          break;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [businesses, search, categoryFilter, statusFilter, dateFilter, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-50" />;
    return sortOrder === 'asc' 
      ? <ArrowUp className="h-3 w-3 ml-1" />
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  const fetchBusinesses = async () => {
    try {
      const res = await fetch("/api/admin/businesses");
      if (res.ok) {
        const data = await res.json();
        setBusinesses(data);
      }
    } catch (error) {
      console.error("Failed to fetch businesses:", error);
      toast.error("Failed to load businesses");
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const resolveCategoryName = (): string => {
    if (selectedCategoryId === CREATE_NEW) return newCategoryName.trim();
    if (selectedCategoryId === "") return "";
    return categories.find((c) => c.id === Number(selectedCategoryId))?.name ?? "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCategoryId === CREATE_NEW && !newCategoryName.trim()) {
      toast.error("Please enter a name for the new category");
      return;
    }
    setLoading(true);
    try {
      const categoryName = resolveCategoryName();
      const method = editingBusiness ? "PATCH" : "POST";
      const body = editingBusiness
        ? { ...formData, id: editingBusiness.id, categoryName }
        : { ...formData, categoryName };
      const res = await fetch("/api/admin/businesses", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to save business");
      toast.success(editingBusiness ? "Business updated!" : "Business created!");
      closeModal();
      fetchBusinesses();
      fetchCategories();
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    try {
      const res = await fetch("/api/admin/businesses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
      toast.success("Business deleted!");
      fetchBusinesses();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to delete");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} businesses?`)) return;
    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch("/api/admin/businesses", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
          })
        )
      );
      toast.success(`${selectedIds.length} businesses deleted!`);
      setSelectedIds([]);
      fetchBusinesses();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete");
    }
  };

  const handleBulkPublish = async (publish: boolean) => {
    if (selectedIds.length === 0) return;
    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch("/api/admin/businesses", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, published: publish }),
          })
        )
      );
      toast.success(`${selectedIds.length} businesses ${publish ? 'published' : 'unpublished'}!`);
      setSelectedIds([]);
      fetchBusinesses();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update");
    }
  };

  const handleTogglePublish = async (business: Business) => {
    try {
      const res = await fetch("/api/admin/businesses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: business.id, published: !business.published }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success(business.published ? "Unpublished" : "Published");
      fetchBusinesses();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update");
    }
  };

  const handleExport = () => {
    const csv = [
      ["ID", "Name", "Slug", "Category", "Published", "Requirements", "Created"],
      ...filteredAndSortedBusinesses.map((b) => [
        b.id, b.name, b.slug, b.category?.name || "",
        b.published ? "Yes" : "No", b._count?.requirements || 0,
        new Date(b.createdAt).toLocaleDateString(),
      ]),
    ].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `businesses-${new Date().toISOString()}.csv`;
    a.click();
    toast.success("Exported!");
  };

  const copySlug = (slug: string) => {
    navigator.clipboard.writeText(slug);
    toast.success("Slug copied!");
  };

  const resetCategoryState = (business?: Business) => {
    setSelectedCategoryId(business?.category ? String(business.category.id) : "");
    setNewCategoryName("");
  };

  const openModal = () => {
    setFormData({ name: "", description: "", image: "", slug: "", published: true });
    setEditingBusiness(null);
    resetCategoryState();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBusiness(null);
    resetCategoryState();
  };

  const openEditModal = (business: Business) => {
    setFormData({
      name: business.name,
      description: business.description || "",
      image: business.image || "",
      slug: business.slug,
      published: business.published,
    });
    setEditingBusiness(business);
    resetCategoryState(business);
    setIsModalOpen(true);
  };

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.length === filteredAndSortedBusinesses.length
      ? []
      : filteredAndSortedBusinesses.map((b) => b.id)
    );
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setStatusFilter("all");
    setDateFilter("all");
  };

  const activeFiltersCount = [
    search !== "", categoryFilter !== "all", statusFilter !== "all", dateFilter !== "all"
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Businesses</h1>
          <p className="text-gray-500 mt-1">{filteredAndSortedBusinesses.length} of {businesses.length} businesses</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {selectedIds.length > 0 && (
            <>
              <button onClick={() => handleBulkPublish(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                <Eye className="h-4 w-4" />Publish {selectedIds.length}
              </button>
              <button onClick={() => handleBulkPublish(false)} className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm">
                <EyeOff className="h-4 w-4" />Unpublish {selectedIds.length}
              </button>
              <button onClick={handleBulkDelete} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">
                <Trash2 className="h-4 w-4" />Delete {selectedIds.length}
              </button>
            </>
          )}
          <BusinessCSVImport onImportComplete={() => { fetchBusinesses(); fetchCategories(); }} />
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <Download className="h-4 w-4" />Export
          </button>
          <button onClick={openModal} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="h-4 w-4" />Add
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border rounded-lg" />
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg ${showFilters || activeFiltersCount > 0 ? 'bg-blue-50 border-blue-300 text-blue-700' : 'hover:bg-gray-50'}`}>
            <Filter className="h-4 w-4" />Filters{activeFiltersCount > 0 && <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">{activeFiltersCount}</span>}
          </button>
          <div className="flex border rounded-lg overflow-hidden">
            <button onClick={() => setViewMode('table')} className={`p-2.5 ${viewMode === 'table' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}><List className="h-4 w-4" /></button>
            <button onClick={() => setViewMode('grid')} className={`p-2.5 border-l ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}><Grid className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="bg-gray-50 border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Filters</h3>
            <button onClick={clearFilters} className="text-sm text-blue-600">Clear all</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="border rounded-lg px-3 py-2">
              <option value="all">All categories</option>
              <option value="uncategorized">Uncategorized</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded-lg px-3 py-2">
              <option value="all">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="border rounded-lg px-3 py-2">
              <option value="all">All time</option>
              <option value="today">Today</option>
              <option value="week">This week</option>
              <option value="month">This month</option>
            </select>
          </div>
        </div>
      )}

      {viewMode === 'table' ? (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left"><input type="checkbox" checked={selectedIds.length === filteredAndSortedBusinesses.length && filteredAndSortedBusinesses.length > 0} onChange={toggleSelectAll} className="rounded" /></th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Image</th>
                  <th className="px-4 py-3 text-left"><button onClick={() => handleSort('name')} className="group flex items-center text-xs font-semibold text-gray-600 uppercase hover:text-gray-900">Name<SortIcon field="name" /></button></th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Slug</th>
                  <th className="px-4 py-3 text-left"><button onClick={() => handleSort('category')} className="group flex items-center text-xs font-semibold text-gray-600 uppercase hover:text-gray-900">Category<SortIcon field="category" /></button></th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-left"><button onClick={() => handleSort('requirements')} className="group flex items-center text-xs font-semibold text-gray-600 uppercase hover:text-gray-900">Requirements<SortIcon field="requirements" /></button></th>
                  <th className="px-4 py-3 text-left"><button onClick={() => handleSort('createdAt')} className="group flex items-center text-xs font-semibold text-gray-600 uppercase hover:text-gray-900">Created<SortIcon field="createdAt" /></button></th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredAndSortedBusinesses.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4"><input type="checkbox" checked={selectedIds.includes(b.id)} onChange={() => toggleSelect(b.id)} className="rounded" /></td>
                    <td className="px-4 py-4">{b.image ? <Image src={b.image} alt={b.name} width={48} height={48} className="w-12 h-12 rounded-lg object-cover" /> : <div className="w-12 h-12 rounded-lg bg-gray-100" />}</td>
                    <td className="px-4 py-4"><p className="font-semibold text-gray-900">{b.name}</p>{b.description && <p className="text-sm text-gray-500 truncate max-w-xs">{b.description}</p>}</td>
                    <td className="px-4 py-4"><div className="flex items-center gap-2"><code className="text-sm bg-gray-100 px-2 py-1 rounded">{b.slug}</code><button onClick={() => copySlug(b.slug)} title="Copy"><Copy className="h-3 w-3" /></button><a href={`/${b.slug}`} target="_blank" rel="noopener noreferrer" title="View"><ExternalLink className="h-3 w-3" /></a></div></td>
                    <td className="px-4 py-4">{b.category ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"><Tag className="h-3 w-3" />{b.category.name}</span> : <span className="text-gray-400">—</span>}</td>
                    <td className="px-4 py-4"><button onClick={() => handleTogglePublish(b)} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${b.published ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>{b.published ? <><Eye className="h-3 w-3" />Published</> : <><EyeOff className="h-3 w-3" />Draft</>}</button></td>
                    <td className="px-4 py-4 text-gray-600">{b._count?.requirements || 0}</td>
                    <td className="px-4 py-4 text-sm text-gray-500">{new Date(b.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-4 text-right"><div className="flex items-center justify-end gap-2"><button onClick={() => openEditModal(b)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit"><Edit2 className="h-4 w-4" /></button><button onClick={() => handleDelete(b.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Delete"><Trash2 className="h-4 w-4" /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredAndSortedBusinesses.length === 0 && <div className="text-center py-12 text-gray-500">{search || activeFiltersCount > 0 ? "No matches" : "No businesses"}</div>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedBusinesses.map((b) => (
            <div key={b.id} className="bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-shadow">
              {b.image && <Image src={b.image} alt={b.name} width={400} height={200} className="w-full h-48 object-cover" />}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2"><h3 className="font-semibold text-lg">{b.name}</h3><input type="checkbox" checked={selectedIds.includes(b.id)} onChange={() => toggleSelect(b.id)} className="rounded" /></div>
                {b.description && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{b.description}</p>}
                <div className="flex items-center gap-2 mb-3">{b.category && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"><Tag className="h-3 w-3" />{b.category.name}</span>}<span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${b.published ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>{b.published ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}{b.published ? "Published" : "Draft"}</span></div>
                <div className="text-xs text-gray-500 mb-3">{b._count?.requirements || 0} requirements • {new Date(b.createdAt).toLocaleDateString()}</div>
                <div className="flex gap-2"><button onClick={() => openEditModal(b)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"><Edit2 className="h-3 w-3" />Edit</button><button onClick={() => handleDelete(b.id)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"><Trash2 className="h-3 w-3" />Delete</button></div>
              </div>
            </div>
          ))}
          {filteredAndSortedBusinesses.length === 0 && <div className="col-span-full text-center py-12 text-gray-500">{search || activeFiltersCount > 0 ? "No matches" : "No businesses"}</div>}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={closeModal} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
              <h2 className="text-xl font-bold mb-4">{editingBusiness ? "Edit" : "Add"} Business</h2>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium mb-1">Name</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) })} className="w-full border px-3 py-2 rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1">Slug</label><input type="text" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} className="w-full border px-3 py-2 rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1">Category</label><select value={selectedCategoryId} onChange={(e) => { setSelectedCategoryId(e.target.value); if (e.target.value !== CREATE_NEW) setNewCategoryName(""); }} className="w-full border px-3 py-2 rounded-lg bg-white"><option value="">No category</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}<option value={CREATE_NEW}>+ Create new</option></select>{selectedCategoryId === CREATE_NEW && <input type="text" placeholder="Category name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="mt-2 w-full border border-purple-300 px-3 py-2 rounded-lg" autoFocus />}</div>
                <div><label className="block text-sm font-medium mb-1">Description</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full border px-3 py-2 rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1">Image URL</label><input type="text" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} className="w-full border px-3 py-2 rounded-lg" /></div>
                <div className="flex items-center gap-2"><input type="checkbox" id="published" checked={formData.published} onChange={(e) => setFormData({ ...formData, published: e.target.checked })} className="rounded" /><label htmlFor="published" className="text-sm font-medium">Publish</label></div>
                <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={closeModal} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button><button type="button" onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{loading ? "Saving..." : editingBusiness ? "Update" : "Create"}</button></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
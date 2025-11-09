'use client';
import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Download
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

type Business = {
  id: number;
  name: string;
  description?: string;
  image?: string;
  slug: string;
  published: boolean;
  _count?: {
    requirements: number;
  };
};

export default function BusinessesAdminPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: "",
    slug: "",
    published: true,
  });

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const filteredBusinesses = useMemo(() => {
    if (!search) return businesses;
    return businesses.filter(
      (b) =>
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.description?.toLowerCase().includes(search.toLowerCase())
    );
  }, [businesses, search]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const method = editingBusiness ? "PATCH" : "POST";
      const body = editingBusiness
        ? { ...formData, id: editingBusiness.id }
        : formData;

      const res = await fetch("/api/admin/businesses", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to save business");

      toast.success(
        editingBusiness
          ? "Business updated successfully!"
          : "Business created successfully!"
      );
      closeModal();
      fetchBusinesses();
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this business?")) return;

    try {
      const res = await fetch("/api/admin/businesses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error("Failed to delete business");
      toast.success("Business deleted successfully!");
      fetchBusinesses();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete business");
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
      toast.error("Failed to delete businesses");
    }
  };

  const handleTogglePublish = async (business: Business) => {
    try {
      const res = await fetch("/api/admin/businesses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: business.id,
          published: !business.published,
        }),
      });

      if (!res.ok) throw new Error("Failed to update");
      toast.success(
        business.published ? "Business unpublished" : "Business published"
      );
      fetchBusinesses();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status");
    }
  };

  const handleExport = () => {
    const csv = [
      ["ID", "Name", "Slug", "Description", "Published", "Requirements"],
      ...filteredBusinesses.map((b) => [
        b.id,
        b.name,
        b.slug,
        b.description || "",
        b.published ? "Yes" : "No",
        b._count?.requirements || 0,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `businesses-${new Date().toISOString()}.csv`;
    a.click();
    toast.success("Exported successfully!");
  };

  const openModal = () => {
    setFormData({
      name: "",
      description: "",
      image: "",
      slug: "",
      published: true,
    });
    setEditingBusiness(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBusiness(null);
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
    setIsModalOpen(true);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredBusinesses.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredBusinesses.map((b) => b.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Businesses</h1>
          <p className="text-gray-500 mt-1">
            Manage your business listings and requirements
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete {selectedIds.length}
            </button>
          )}
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <button
            onClick={openModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Business
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search businesses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.length === filteredBusinesses.length &&
                      filteredBusinesses.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Image
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Slug
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Requirements
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredBusinesses.map((business) => (
                <tr
                  key={business.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(business.id)}
                      onChange={() => toggleSelect(business.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-4">
                    {business.image ? (
                      <Image
                        src={business.image}
                        alt={business.name}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No image</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {business.name}
                      </p>
                      {business.description && (
                        <p className="text-sm text-gray-500 truncate max-w-xs">
                          {business.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {business.slug}
                    </code>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => handleTogglePublish(business)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        business.published
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {business.published ? (
                        <>
                          <Eye className="h-3 w-3" />
                          Published
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3" />
                          Draft
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-4 text-gray-600">
                    {business._count?.requirements || 0}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(business)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(business.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredBusinesses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {search ? "No businesses match your search" : "No businesses yet"}
            </p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={closeModal}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingBusiness ? "Edit Business" : "Add Business"}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setFormData({
                        ...formData,
                        name,
                        slug: generateSlug(name),
                      });
                    }}
                    className="w-full border border-gray-300 px-3 py-2 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    className="w-full border border-gray-300 px-3 py-2 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="w-full border border-gray-300 px-3 py-2 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image URL
                  </label>
                  <input
                    type="text"
                    value={formData.image}
                    onChange={(e) =>
                      setFormData({ ...formData, image: e.target.value })
                    }
                    className="w-full border border-gray-300 px-3 py-2 rounded-lg"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="published"
                    checked={formData.published}
                    onChange={(e) =>
                      setFormData({ ...formData, published: e.target.checked })
                    }
                    className="rounded border-gray-300"
                  />
                  <label
                    htmlFor="published"
                    className="text-sm font-medium text-gray-700"
                  >
                    Publish immediately
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? "Saving..." : editingBusiness ? "Update" : "Create"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
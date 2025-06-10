"use client";

import { useEffect, useState, useMemo } from "react";
import { Dialog } from "@headlessui/react";
import { PlusIcon } from "@heroicons/react/24/solid";
import { Toaster, toast } from "react-hot-toast";

type Business = {
  id: number;
  name: string;
  description?: string;
  image?: string;
  slug: string;  
  location?: string;
};

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [search, setSearch] = useState("");
  const [businessToDelete, setBusinessToDelete] = useState<Business | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: "",
    slug: "",  
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const filteredBusinesses = useMemo(() => {
    if (!search) return businesses;
    return businesses.filter(business => 
      business.name.toLowerCase().includes(search.toLowerCase()) ||
      (business.description && business.description.toLowerCase().includes(search.toLowerCase()))
    );
  }, [businesses, search]);

  const fetchBusinesses = async () => {
    try {
      const res = await fetch("/api/businesses");
      const data = await res.json();
      setBusinesses(data);
    } catch (error) {
      console.error("Failed to fetch businesses:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingBusiness) {
        // Edit existing
        const res = await fetch("/api/businesses", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingBusiness.id,
            name: formData.name,
            description: formData.description,
            image: formData.image,
            slug: formData.slug,  
          }),
        });

        if (!res.ok) throw new Error("Failed to update business");
        toast.success("Business updated successfully!");
      } else {
        // Create new
        const res = await fetch("/api/businesses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (!res.ok) throw new Error("Failed to create business");
        toast.success("Business created successfully!");
      }
      closeModal();
      fetchBusinesses();
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (business: Business) => {
    setBusinessToDelete(business);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!businessToDelete) return;
    setLoading(true);

    try {
      const res = await fetch("/api/businesses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: businessToDelete.id }),
      });

      if (!res.ok) throw new Error("Failed to delete business");
      toast.success("Business deleted successfully!");
      setIsDeleteModalOpen(false);
      fetchBusinesses();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete!");
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setEditingBusiness(null);
    setFormData({ name: "", description: "", image: "", slug: "" });
  };

  const handleEdit = (business: Business) => {
    setEditingBusiness(business);
    setFormData({
      name: business.name,
      description: business.description || "",
      image: business.image || "",
      slug: business.slug || "",  
    });
    setIsOpen(true);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };
  

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData({ ...formData, name, slug: generateSlug(name) });
  };

  return (
    <div className="p-6">
      <Toaster />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Businesses</h1>
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search by name or description..."
            className="border px-3 py-2 rounded-md w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            onClick={openModal}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Business
          </button>
        </div>
      </div>

      {/* List of businesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBusinesses.length > 0 ? (
          filteredBusinesses.map((business) => (
            <div
              key={business.id}
              className="border p-4 rounded-md shadow-sm hover:shadow-md transition relative"
            >
              <h2 className="text-lg font-semibold">{business.name}</h2>

              {business.image && (
                <img
                  src={business.image}
                  alt={business.name}
                  className="w-full h-40 object-cover rounded-md my-2"
                />
              )}

              <p className="text-gray-600 mb-4">{business.description}</p>

              <div className="flex justify-end space-x-2">
                <button
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  onClick={() => handleEdit(business)}
                >
                  Edit
                </button>
                <button
                  className="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600"
                  onClick={() => confirmDelete(business)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-gray-500">
            {search ? "No businesses match your search" : "No businesses found"}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={isOpen} onClose={closeModal} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-md p-6 w-full max-w-md">
            <Dialog.Title className="text-xl font-bold mb-4">
              {editingBusiness ? "Edit Business" : "Add Business"}
            </Dialog.Title>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={handleNameChange} // Update name and slug
                  className="w-full border px-3 py-2 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  className="w-full border px-3 py-2 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full border px-3 py-2 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Image URL</label>
                <input
                  type="text"
                  value={formData.image}
                  onChange={(e) =>
                    setFormData({ ...formData, image: e.target.value })
                  }
                  className="w-full border px-3 py-2 rounded-md"
                />
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white rounded-md ${
                    loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
                  }`}
                  disabled={loading}
                >
                  {loading ? "Saving..." : editingBusiness ? "Save" : "Create"}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-md p-6 w-full max-w-sm">
            <Dialog.Title className="text-xl font-semibold mb-4">
              Confirm Deletion
            </Dialog.Title>
            <p>Are you sure you want to delete this business?</p>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}

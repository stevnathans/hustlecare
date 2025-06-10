'use client';

import { Vendor } from '@prisma/client';
import { useState } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { deleteVendor } from 'app/actions/vendor-actions';
import { toast } from 'sonner';

interface VendorTableProps {
  vendors: Vendor[];
  onEdit: (vendor: Vendor) => void;
  fetchVendors: () => void;
}

export function VendorTable({ vendors, onEdit, fetchVendors }: VendorTableProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await deleteVendor(id);
      toast.success('Vendor deleted successfully');
      fetchVendors();
    } catch (error) {
      toast.error('Failed to delete vendor');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Vendor
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Website
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Logo
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {vendors.map((vendor) => (
            <tr key={vendor.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{vendor.name}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {vendor.website ? (
                  <a
                    href={vendor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {vendor.website}
                  </a>
                ) : (
                  <span className="text-sm text-gray-400">Not provided</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {vendor.logo ? (
                  <img
                    src={vendor.logo}
                    alt={`${vendor.name} logo`}
                    className="h-10 w-10 object-contain rounded"
                  />
                ) : (
                  <span className="text-sm text-gray-400">No logo</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => onEdit(vendor)}
                    className="p-2 text-indigo-600 hover:text-indigo-900 rounded-md hover:bg-indigo-50 transition-colors"
                    title="Edit vendor"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(vendor.id)}
                    disabled={deletingId === vendor.id}
                    className="p-2 text-red-600 hover:text-red-900 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50"
                    title="Delete vendor"
                  >
                    {deletingId === vendor.id ? (
                      <span className="animate-pulse">...</span>
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {vendors.length === 0 && (
        <div className="bg-white text-center py-12">
          <p className="text-gray-500">No vendors found. Add one to get started.</p>
        </div>
      )}
    </div>
  );
}
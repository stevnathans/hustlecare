'use client';

import { useState, useEffect } from 'react';
import { Vendor } from '@prisma/client';
import { VendorTable } from '@/components/vendors/VendorTable';
import { VendorModal } from '@/components/vendors/VendorModal';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentVendor, setCurrentVendor] = useState<Vendor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchVendors = async () => {
    const response = await fetch('/api/vendors');
    const data = await response.json();
    setVendors(data);
    setFilteredVendors(data);
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    const filtered = vendors.filter(vendor =>
      vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (vendor.website && vendor.website.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredVendors(filtered);
  }, [searchTerm, vendors]);

  const handleEdit = (vendor: Vendor) => {
    setCurrentVendor(vendor);
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    fetchVendors();
    setIsModalOpen(false);
    setCurrentVendor(null);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Vendor Management</h1>
        <div className="flex gap-2">
          <Input
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Vendor
          </Button>
        </div>
      </div>

      <VendorTable 
        vendors={filteredVendors} 
        onEdit={handleEdit}
        fetchVendors={fetchVendors}
      />

      <VendorModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        vendor={currentVendor}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
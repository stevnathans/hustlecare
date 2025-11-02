import { VendorForm } from '@/components/vendors/VendorForm';
import { updateVendor } from 'app/actions/vendor-actions';

interface VendorPageProps {
  params: Promise<{ id: string }>;
}

export default async function VendorPage({ params }: VendorPageProps) {
  const { id } = await params;
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/vendors/${id}`);
  const vendor = await response.json();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Vendor</h1>
      <VendorForm 
        vendor={vendor} 
        onSubmit={(values) => updateVendor(vendor.id, values)} 
      />
    </div>
  );
}
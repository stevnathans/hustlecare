import { VendorForm } from '@/components/vendors/VendorForm';
import { updateVendor } from 'app/actions/vendor-actions';

interface VendorPageProps {
  params: { id: string };
}

export default async function VendorPage({ params }: VendorPageProps) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/vendors/${params.id}`);
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
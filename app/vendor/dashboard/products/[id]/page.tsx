'use client';
// app/vendor/dashboard/products/[id]/page.tsx
import { use } from 'react';
import { ProductFormPage } from '../new/page'; // <-- Changed from ProductForm to ProductFormPage

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  return <ProductFormPage productId={parseInt(id)} />;
}
'use client';
// app/vendor/dashboard/products/[id]/page.tsx
import { use } from 'react';
import { ProductForm } from '../new/page';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ProductForm productId={parseInt(id)} />;
}
'use server';

import { revalidatePath } from 'next/cache';

export async function createVendor(data: { name: string; website?: string; logo?: string }) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/vendors`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to create vendor');
  }

  revalidatePath('/vendors');
  return await response.json();
}

export async function updateVendor(id: number, data: { name: string; website?: string; logo?: string }) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/vendors/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update vendor');
  }

  revalidatePath('/vendors');
  return await response.json();
}

export async function deleteVendor(id: number) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/vendors/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete vendor');
  }

  revalidatePath('/vendors');
}
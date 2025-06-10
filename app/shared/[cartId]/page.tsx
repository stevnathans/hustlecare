'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface CartItemType {
  id: string;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface SharedCartProps {
  params: {
    cartId: string;
  };
}

export default function SharedCartPage({ params }: SharedCartProps) {
  const { cartId } = params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<{
    id: string;
    name: string;
    businessName: string;
    totalCost: number;
    items: CartItemType[];
  } | null>(null);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/shared/${cartId}`);
        
        if (!response.ok) {
          throw new Error('Failed to load shared cart');
        }
        
        const data = await response.json();
        setCart(data);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
        console.error('Error loading shared cart:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [cartId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-lg">Loading shared cart...</p>
        </div>
      </div>
    );
  }

  if (error || !cart) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 p-4 rounded-md text-red-800">
          <p>Error: {error || 'Cart not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Home
          </Link>
          
          <h1 className="text-2xl font-bold mb-2">{cart.name}</h1>
          <p className="text-gray-600 mb-6">
            Business Type: {cart.businessName}
          </p>
          
          <h2 className="text-xl font-semibold mb-4">Items ({cart.items.length})</h2>
          
          <div className="space-y-4 mb-6">
            {cart.items.map((item) => (
              <div key={item.id} className="flex items-center py-3 border-b">
                {item.image && (
                  <div className="relative h-16 w-16 mr-4">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover rounded-md"
                    />
                  </div>
                )}
                
                <div className="flex-grow">
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="text-gray-600">${item.price.toFixed(2)}</p>
                </div>
                
                <div className="text-right">
                  <p className="font-medium">Qty: {item.quantity}</p>
                  <p className="text-gray-600">
                    Subtotal: ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="border-t pt-4">
            <div className="flex justify-between text-lg font-semibold">
              <span>Total Cost:</span>
              <span>${cart.totalCost.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="mt-8">
            <Link
              href={`/business/${cart.businessName.toLowerCase().replace(/\s+/g, '-')}`}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-block"
            >
              Create Your Own List
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
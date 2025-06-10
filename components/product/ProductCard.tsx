'use client';

import React, { useState } from 'react';
import { FiPlus, FiCheck, FiExternalLink, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';
import { useSession } from 'next-auth/react';
import LoginModal from '../LoginModal';

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    description?: string;
    price: number;
    image?: string;
    url?: string;
    vendor?: {
      id: number;
      name: string;
      website?: string;
      logo?: string;
    };
  };
  requirementName: string;
  category: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, requirementName, category }) => {
  const { addToCart, items, removeFromCart } = useCart();
  const [showDetails, setShowDetails] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { data: session } = useSession();
  
  const cartItem = items.find(item => item.productId === product.id);
  const isInCart = !!cartItem;
  const cartQuantity = cartItem?.quantity || 0;

  const handleAddToCart = async () => {
    if (!session) {
      setShowLoginModal(true);
      return;
    }
    
    try {
      await addToCart({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        requirementName,
        category,
        __index: 0
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const handleRemoveFromCart = async () => {
    try {
      await removeFromCart(product.id);
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  const handleGoToShop = (e: React.MouseEvent) => {
  e.stopPropagation();
  if (product.url) {
    window.open(product.url, '_blank');
  }
};

  const toggleDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDetails(!showDetails);
  };

  function handleLogin(): void {
    throw new Error('Function not implemented.');
  }

  return (
    <div className="border rounded-xl shadow-sm overflow-hidden bg-white hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row">
        {/* Product Image - Mobile First */}
        <div className="relative w-full h-48 md:w-40 md:h-auto md:min-h-[160px] bg-gray-50">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-contain p-4"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No Image
            </div>
          )}
        </div>

        {/* Product Content */}
        <div className="flex-1 p-4 flex flex-col">
          {/* Top Section */}
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold line-clamp-2">{product.name}</h3>
              
              {/* Vendor Logo */}
              {product.vendor?.logo && (
                <div className="mt-2 flex items-center">
                  <img
                    src={product.vendor.logo}
                    alt={`${product.vendor.name} logo`}
                    className="h-6 w-auto max-w-[200px] object-contain"
                  />
                </div>
              )}
            </div>

            {/* Price and Add to Cart */}
            <div className="flex flex-col items-end">
              <span className="text-lg font-bold">KSh {product.price.toFixed(2)}</span>
              <div className="mt-2 flex items-center gap-2">
                <div className="mt-2 flex items-center gap-2">
  {isInCart && (
    <span className="text-sm text-green-600 mr-1">
      {cartQuantity} added to list
    </span>
  )}
  <button
    onClick={isInCart ? handleRemoveFromCart : handleAddToCart}
    className={`flex items-center justify-center p-2 rounded-full ${
      isInCart
        ? 'bg-green-100 text-green-700 hover:bg-green-200'
        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
    } transition`}
    aria-label={isInCart ? "Remove from cart" : "Add to cart"}
  >
    {isInCart ? <FiCheck size={18} /> : <FiPlus size={18} />}
  </button>
</div>
              </div>
            </div>
          </div>

          {/* Middle Section - Mobile Only */}
          <div className="mt-3 md:hidden flex justify-between items-center">
            {product.url && (
              <button
                onClick={handleGoToShop}
                className="flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                Go to Shop <FiExternalLink className="ml-1" />
              </button>
            )}
            <button
              onClick={toggleDetails}
              className="flex items-center text-sm text-gray-600 hover:text-gray-800"
            >
              {showDetails ? 'Less details' : 'More details'} 
              {showDetails ? <FiChevronUp className="ml-1" /> : <FiChevronDown className="ml-1" />}
            </button>
          </div>

          {/* Bottom Section - Desktop Only */}
          <div className="mt-4 hidden md:flex justify-between items-center">
            <div className="flex space-x-3">
              {product.vendor?.website && (
                <button
                  onClick={handleGoToShop}
                  className="flex items-center px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition"
                >
                  Go to Shop <FiExternalLink className="ml-1.5" size={14} />
                </button>
              )}
            </div>

            <button
              onClick={toggleDetails}
              className="flex items-center px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition"
            >
              {showDetails ? 'Hide details' : 'Show details'}
              {showDetails ? <FiChevronUp className="ml-1.5" /> : <FiChevronDown className="ml-1.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Details Panel */}
      {showDetails && (
        <div className="px-4 pb-4 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Description</h4>
              <p className="text-sm text-gray-700">
                {product.description || 'No description available'}
              </p>
            </div>
            
            <div className="space-y-3">
              {product.vendor?.name && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Vendor</h4>
                  <p className="text-sm text-gray-700">{product.vendor.name}</p>
                </div>
              )}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Category</h4>
                <p className="text-sm text-gray-700">{category}</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Requirement</h4>
                <p className="text-sm text-gray-700">{requirementName}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
      />
    </div>
  );
};

export default ProductCard;
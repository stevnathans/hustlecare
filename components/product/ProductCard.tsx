import { useState } from 'react';
import { FiPlus, FiCheck } from 'react-icons/fi';
import { FaStar, FaRegStar, FaStarHalfAlt } from 'react-icons/fa';
import { Product } from "@/types/index";
import { useCart } from '@/contexts/CartContext'; // Import the CartContext hook

interface ProductCardProps {
  product: Product;
  businessId: string; // Add businessId prop to ensure consistency
}

export default function ProductCard({
  product,
  businessId, // Receive the businessId directly as a prop
}: ProductCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const { cartItems, addToCart, removeFromCart } = useCart(); // Get cart state and actions

  // Check if the product is already in the cart for THIS business
  const isInCart = cartItems.some(
    item => item.id === product.id && item.businessId === businessId
  );

  // Get the quantity of the product in the cart for THIS business
  const cartQuantity = cartItems.find(
    item => item.id === product.id && item.businessId === businessId
  )?.quantity || 0;

  const handleAddToCart = () => {
    // Use the businessId prop instead of product.business
    addToCart(product, businessId);
  };

  const handleRemoveFromCart = () => {
    // You might want to update removeFromCart to take a businessId parameter as well
    // For now, we'll use the simpler version
    removeFromCart(product.id);
  };

  const renderRatingStars = () => {
    const stars = [];
    const fullStars = Math.floor(product.rating);
    const hasHalfStar = product.rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<FaStar key={i} className="text-yellow-400" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<FaStarHalfAlt key={i} className="text-yellow-400" />);
      } else {
        stars.push(<FaRegStar key={i} className="text-yellow-400" />);
      }
    }
    return stars;
  };

  return (
    <div className="border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white">
      <div className="flex p-4">
        {/* Product Image */}
        <div className="w-28 h-28 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden mr-4">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-semibold truncate">{product.name}</h3>
            <div className="flex items-center ml-2">
              <div className="flex">{renderRatingStars()}</div>
              <span className="text-xs text-gray-500 ml-1">({product.reviews})</span>
            </div>
          </div>

          <div className="flex justify-between items-center mt-2">
            <div className="flex items-center">
              {product.vendorLogo ? (
                <img
                  src={product.vendorLogo}
                  alt="Vendor logo"
                  className="h-6 w-6 object-contain mr-2"
                />
              ) : (
                <span className="text-xs text-gray-500">Vendor</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isInCart && (
                <span className="text-sm text-green-600">
                  {cartQuantity} in list
                </span>
              )}
              <button
                onClick={isInCart ? handleRemoveFromCart : handleAddToCart}
                className={`p-2 rounded-full focus:outline-none focus:ring-2 ${
                  isInCart
                    ? 'bg-green-200 text-green-600 hover:bg-green-200 focus:ring-green-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 focus:ring-gray-300'
                } transition`}
                aria-label={isInCart ? "Remove from list" : "Add to list"}
              >
                {isInCart ? <FiCheck size={18} /> : <FiPlus size={18} />}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center mt-3">
            <span className={`text-lg font-bold ${isInCart ? 'text-green-600' : 'text-gray-800'}`}>
              ${product.price.toLocaleString()}
            </span>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
            >
              {showDetails ? 'Hide ▲' : 'Details ▼'}
            </button>
          </div>
        </div>
      </div>

      {showDetails && (
        <div className="px-4 pb-4 pt-2 border-t bg-gray-50">
          <p className="text-gray-700 text-sm mb-2">{product.description}</p>
          {product.specifications && product.specifications.length > 0 && (
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              {product.specifications.map((spec, idx) => (
                <li key={idx}>{spec}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
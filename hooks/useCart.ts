/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react'
import axios from 'axios'

export interface Product {
  id: number
  name: string
  price: number | null
  image?: string
  description?: string | null
  rating?: number | null
  reviews?: number | null
  vendorLogo?: string
  specifications?: string[]
  
}

export interface CartItem {
  id: string
  productId: number
  quantity: number
  unitPrice: number
  product: Product
}

export interface Cart {
  id: string
  businessId: number
  items: CartItem[]
  totalCost: number | null
}

export function useCart(businessId: number) {
  const [cart, setCart] = useState<Cart | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCart = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await axios.get(`/api/cart/${businessId}`)
      setCart(res.data)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch cart')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (businessId) {
      fetchCart()
    }
  }, [businessId])

  return {
    cart,
    isLoading,
    error,
    refetch: fetchCart,
  }
}

'use client';

import { useCart } from '@/contexts/CartContext';
import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const CostCalculator = () => {
  const { cart, updateItemQuantity, removeItem, clearCart, finalizeCart } = useCart();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!cart) return null;

  const total = cart.items.reduce(
    (acc, item) => acc + item.unitPrice * item.quantity,
    0
  );

  const content = (
    <div className="flex flex-col h-full">
      <h2 className="text-xl font-bold mb-2">Your List</h2>
      <Separator className="mb-4" />

      <div className="flex-1 space-y-2 overflow-y-auto">
        {cart.items.length === 0 ? (
          <p className="text-muted-foreground">No items added yet.</p>
        ) : (
          cart.items.map((item) => (
            <Card key={item.productId} className="flex items-center justify-between p-2">
              <CardContent className="p-0 flex-1">
                <p className="font-medium">{item.productName}</p>
                <p className="text-sm text-muted-foreground">
                  Ksh {item.unitPrice.toFixed(2)} x {item.quantity}
                </p>
              </CardContent>
              <div className="flex items-center space-x-2">
                <Button size="icon" variant="outline" onClick={() => updateItemQuantity(item.productId, item.quantity - 1)} disabled={item.quantity <= 1}>
                  <Minus className="w-4 h-4" />
                </Button>
                <span>{item.quantity}</span>
                <Button size="icon" variant="outline" onClick={() => updateItemQuantity(item.productId, item.quantity + 1)}>
                  <Plus className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => removeItem(item.productId)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      <Separator className="my-4" />

      <div className="space-y-2">
        <p className="font-semibold text-lg">Total: Ksh {total.toFixed(2)}</p>
        <Button className="w-full" onClick={finalizeCart} disabled={cart.items.length === 0}>
          Save List
        </Button>
        <Button className="w-full" variant="outline" onClick={clearCart} disabled={cart.items.length === 0}>
          Clear List
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <Sheet>
          <SheetTrigger asChild>
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-md flex items-center justify-between p-3 z-50">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5" />
                <span>{cart.items.length} items</span>
              </div>
              <div className="font-semibold">Ksh {total.toFixed(2)}</div>
              <Button size="sm" variant="outline">
                View
              </Button>
            </div>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[70%]">
            {content}
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // Desktop version (reuse sidebar layout)
  return (
    <aside className="w-80 fixed right-0 top-0 h-screen bg-white shadow-lg border-l p-4 z-50">
      {content}
    </aside>
  );
};

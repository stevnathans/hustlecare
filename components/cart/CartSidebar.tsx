import { useCart } from '@/contexts/CartContext';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';

export const CartSidebar = () => {
  const { cart, updateItemQuantity, removeItem, clearCart, finalizeCart } = useCart();

  if (!cart) return null;

  const total = cart.items.reduce(
    (acc, item) => acc + item.unitPrice * item.quantity,
    0
  );

  return (
    <aside className="w-full md:w-80 fixed right-0 top-0 h-screen bg-white shadow-lg border-l p-4 flex flex-col z-50">
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
    </aside>
  );
};

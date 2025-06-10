import { useCart } from '@/contexts/CartContext';
import { useParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

type AddToCartButtonProps = {
  product: {
    id: number;
    name: string;
    price: number;
    image?: string;
  };
};

export const AddToCartButton = ({ product }: AddToCartButtonProps) => {
  const { businessId } = useParams() as { businessId: string };
  const { addItem } = useCart();

  const handleAdd = () => {
    addItem({
      productId: product.id,
      productName: product.name,
      unitPrice: product.price,
      quantity: 1,
    });
  };

  return (
    <Button onClick={handleAdd} variant="outline" size="sm">
      <Plus className="w-4 h-4 mr-1" />
      Add
    </Button>
  );
};

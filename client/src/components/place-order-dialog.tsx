import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, ShoppingCart } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Product } from "@shared/schema";

interface PlaceOrderDialogProps {
  open: boolean;
  onClose: () => void;
  product: Product;
}

export function PlaceOrderDialog({ open, onClose, product }: PlaceOrderDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState("1");

  const orderMutation = useMutation({
    mutationFn: async (data: { productId: string; quantity: number }) => {
      const response = await apiRequest("POST", "/api/orders", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Order Placed Successfully",
        description: `Your order for ${product.name} has been placed and is pending confirmation.`,
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Order Failed",
        description: error.message || "Failed to place order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setQuantity("1");
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const orderQuantity = parseInt(quantity);
    if (isNaN(orderQuantity) || orderQuantity < 1) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a valid quantity (minimum 1)",
        variant: "destructive",
      });
      return;
    }

    if (orderQuantity > product.quantity) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${product.quantity} items available in stock`,
        variant: "destructive",
      });
      return;
    }

    orderMutation.mutate({
      productId: product.id,
      quantity: orderQuantity,
    });
  };

  const maxQuantity = Math.min(product.quantity, 100);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5" />
            <span>Place Order</span>
          </DialogTitle>
          <DialogDescription>
            Place an order for {product.name}. Current stock: {product.quantity} units.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="product-name" className="text-right">
              Product
            </Label>
            <div className="col-span-3">
              <Input
                id="product-name"
                value={product.name}
                disabled
                className="bg-muted"
                data-testid="input-product-name"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right">
              Quantity
            </Label>
            <div className="col-span-3">
              <Input
                id="quantity"
                type="number"
                min="1"
                max={maxQuantity}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity"
                data-testid="input-order-quantity"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Max: {maxQuantity} units
              </p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={orderMutation.isPending}
              data-testid="button-cancel-order"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={orderMutation.isPending || product.quantity === 0}
              data-testid="button-confirm-order"
            >
              {orderMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              <span>{orderMutation.isPending ? "Placing Order..." : "Place Order"}</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
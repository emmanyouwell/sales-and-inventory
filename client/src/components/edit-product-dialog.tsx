import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Product } from "@shared/schema";

interface EditProductDialogProps {
  open: boolean;
  onClose: () => void;
  product: Product;
}

export function EditProductDialog({ open, onClose, product }: EditProductDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: product.name,
    description: product.description || "",
    price: product.price.toString(),
    quantity: product.quantity.toString(),
    weighted: product.weighted || false,
  });

  // 🧩 Ensure form resets when product changes (important!)
  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        description: product.description || "",
        price: product.price.toString(),
        quantity: product.quantity.toString(),
        weighted: product.weighted || false,
      });
    }
  }, [product]);

  const mutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", `/api/products/${product.id}`, {
        ...form,
        price: parseFloat(form.price),
        quantity: parseInt(form.quantity),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "✅ Product Updated",
        description: "Changes saved successfully.",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "❌ Error",
        description: error?.message || "Failed to update product.",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Product Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <Label>Description</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div>
            <Label>Price (₱)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </div>

          <div>
            <Label>Quantity</Label>
            <Input
              type="number"
              min="0"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Needs to be weighted (Price per kilo)</Label>
            <Switch
              checked={form.weighted}
              onCheckedChange={(checked) =>
                setForm({ ...form, weighted: checked })
              }
            />
          </div>

          <Button
            className="w-full"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export function AddProductDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [form, setForm] = useState({
    id: "",
    name: "",
    description: "",
    price: "",
    quantity: "",
    weighted: false,
    category: "", // 🆕 Add category
  });

  const resetForm = () =>
    setForm({
      id: "",
      name: "",
      description: "",
      price: "",
      quantity: "",
      weighted: false,
      category: "",
    });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.id || !form.name || !form.price || !form.quantity || !form.category) {
        throw new Error("Please fill in all required fields, including category.");
      }

      await apiRequest("POST", "/api/products", {
        id: form.id.trim(),
        name: form.name.trim(),
        description: form.description.trim(),
        price: parseFloat(form.price),
        quantity: parseInt(form.quantity),
        weighted: form.weighted,
        category: form.category, // 🆕 Send category to backend
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "✅ Product Added",
        description: "New product successfully added and displayed in the table.",
      });
      resetForm();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "❌ Error",
        description: error.message || "Failed to add product.",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Product ID *</Label>
            <Input
              value={form.id}
              onChange={(e) => setForm({ ...form, id: e.target.value })}
              placeholder="Enter Product ID (e.g. PRD-001)"
            />
          </div>

          <div>
            <Label>Product Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Enter product name"
            />
          </div>

          <div>
            <Label>Category *</Label>
            <Select
              value={form.category}
              onValueChange={(value) => setForm({ ...form, category: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Hand Tools">Hand Tools</SelectItem>
                <SelectItem value="Power Tools">Power Tools</SelectItem>
                <SelectItem value="Fasteners & Fittings">Fasteners & Fittings</SelectItem>
                <SelectItem value="Electrical Supplies">Electrical Supplies</SelectItem>
                <SelectItem value="Plumbing Supplies">Plumbing Supplies</SelectItem>
                <SelectItem value="Construction Materials">Construction Materials</SelectItem>
                <SelectItem value="Safety Gear">Safety Gear</SelectItem>
                <SelectItem value="Cleaning & Maintenance">Cleaning & Maintenance</SelectItem>
                <SelectItem value="Outdoor & Garden">Outdoor & Garden</SelectItem>
                <SelectItem value="Automotive & Industrial">Automotive & Industrial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Description</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Enter product description"
            />
          </div>

          <div>
            <Label>Price (₱) *</Label>
            <Input
              type="number"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="Enter price"
            />
          </div>

          <div>
            <Label>Quantity *</Label>
            <Input
              type="number"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              placeholder="Enter quantity"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Weighted (price per kilo)</Label>
            <Switch
              checked={form.weighted}
              onCheckedChange={(checked) => setForm({ ...form, weighted: checked })}
            />
          </div>

          <Button
            className="w-full"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Adding..." : "Add Product"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

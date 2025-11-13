import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../client/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../client/src/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../client/src/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../client/src/components/ui/dialog";
import { Input } from "../client/src/components/ui/input";
import { Label } from "../client/src/components/ui/label";
import { Badge } from "../client/src/components/ui/badge";
import { useToast } from "../client/src/hooks/use-toast";
import { Loader2, Plus, Edit, Trash2, Package } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../client/src/components/ui/alert-dialog";
import { useLocation } from "wouter";
import { apiRequest } from "../client/src/lib/queryClient";
import type { Product } from "../shared/schema";

interface ProductFormData {
  name: string;
  quantity: number;
}

export default function ProductsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({ name: "", quantity: 0 });

  // Fetch products
  const { data: products = [], isLoading, error } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    retry: 1,
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: (data: ProductFormData) => apiRequest("POST", "/api/products", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsAddDialogOpen(false);
      setFormData({ name: "", quantity: 0 });
      toast({
        title: "Success",
        description: "Product added successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add product",
        variant: "destructive",
      });
    },
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductFormData }) => 
      apiRequest("PUT", `/api/products/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setEditingProduct(null);
      setFormData({ name: "", quantity: 0 });
      toast({
        title: "Success",
        description: "Product updated successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update product",
        variant: "destructive",
      });
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Product deleted successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Product name is required",
        variant: "destructive",
      });
      return;
    }

    if (formData.quantity < 0) {
      toast({
        title: "Error",
        description: "Quantity must be non-negative",
        variant: "destructive",
      });
      return;
    }

    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data: formData });
    } else {
      createProductMutation.mutate(formData);
    }
  };

  const startEditing = (product: Product) => {
    setEditingProduct(product);
    setFormData({ name: product.name, quantity: product.quantity });
  };

  const cancelEditing = () => {
    setEditingProduct(null);
    setFormData({ name: "", quantity: 0 });
  };

  const getStatusBadge = (quantity: number) => {
    if (quantity > 20) {
      return <Badge className="bg-green-500 hover:bg-green-600" data-testid={`status-good`}>Good</Badge>;
    } else {
      return <Badge variant="destructive" data-testid={`status-low`}>Running low</Badge>;
    }
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <p className="text-destructive">Failed to load products. Please try refreshing the page.</p>
            <Button 
              onClick={() => setLocation("/profile")} 
              variant="outline" 
              className="mt-4"
              data-testid="button-back-to-profile"
            >
              Back to Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
            Product Inventory
          </h1>
          <p className="text-muted-foreground" data-testid="text-page-description">
            Manage your product inventory and stock levels
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-product">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="dialog-add-product">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>
                  Enter the product details below to add it to your inventory.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="product-name">Product Name</Label>
                    <Input
                      id="product-name"
                      value={formData.name}
                      onChange={(e: { target: { value: any; }; }) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter product name"
                      data-testid="input-product-name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="product-quantity">Quantity</Label>
                    <Input
                      id="product-quantity"
                      type="number"
                      min="0"
                      value={formData.quantity}
                      onChange={(e: { target: { value: string; }; }) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                      placeholder="Enter quantity"
                      data-testid="input-product-quantity"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createProductMutation.isPending}
                    data-testid="button-submit-add-product"
                  >
                    {createProductMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Product"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Button 
            variant="outline" 
            onClick={() => setLocation("/profile")}
            data-testid="button-back-to-profile"
          >
            Back to Profile
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Product Inventory
          </CardTitle>
          <CardDescription>
            {products.length} {products.length === 1 ? 'product' : 'products'} in inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8" data-testid="loading-products">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading products...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8" data-testid="empty-products">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No products found</h3>
              <p className="text-muted-foreground mb-4">Get started by adding your first product.</p>
              <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-first-product">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id} data-testid={`row-product-${product.id}`}>
                    <TableCell className="font-mono text-sm" data-testid={`text-product-id-${product.id}`}>
                      {product.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="font-medium" data-testid={`text-product-name-${product.id}`}>
                      {product.name}
                    </TableCell>
                    <TableCell data-testid={`text-product-quantity-${product.id}`}>
                      {product.quantity}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(product.quantity)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Dialog open={editingProduct?.id === product.id} onOpenChange={(open) => !open && cancelEditing()}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => startEditing(product)}
                              data-testid={`button-edit-${product.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent data-testid={`dialog-edit-product-${product.id}`}>
                            <DialogHeader>
                              <DialogTitle>Edit Product</DialogTitle>
                              <DialogDescription>
                                Update the product details below.
                              </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit}>
                              <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                  <Label htmlFor="edit-product-name">Product Name</Label>
                                  <Input
                                    id="edit-product-name"
                                    value={formData.name}
                                    onChange={(e: { target: { value: any; }; }) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Enter product name"
                                    data-testid="input-edit-product-name"
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="edit-product-quantity">Quantity</Label>
                                  <Input
                                    id="edit-product-quantity"
                                    type="number"
                                    min="0"
                                    value={formData.quantity}
                                    onChange={(e: { target: { value: string; }; }) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                                    placeholder="Enter quantity"
                                    data-testid="input-edit-product-quantity"
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button type="button" variant="outline" onClick={cancelEditing}>
                                  Cancel
                                </Button>
                                <Button 
                                  type="submit" 
                                  disabled={updateProductMutation.isPending}
                                  data-testid="button-submit-edit-product"
                                >
                                  {updateProductMutation.isPending ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Updating...
                                    </>
                                  ) : (
                                    "Update Product"
                                  )}
                                </Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-destructive hover:text-destructive"
                              data-testid={`button-delete-${product.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent data-testid={`dialog-delete-product-${product.id}`}>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Product</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{product.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteProductMutation.mutate(product.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                disabled={deleteProductMutation.isPending}
                                data-testid="button-confirm-delete"
                              >
                                {deleteProductMutation.isPending ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Deleting...
                                  </>
                                ) : (
                                  "Delete"
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
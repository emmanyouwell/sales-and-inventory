import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/context/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Plus, Edit, ArrowLeft, ShoppingCart } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { AddProductDialog } from "@/components/add-product-dialog";
import { EditProductDialog } from "@/components/edit-product-dialog";
import { PlaceOrderDialog } from "@/components/place-order-dialog";

import type { Product } from "@shared/schema";

export default function Products() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [filterCategory, setFilterCategory] = useState("all");

  // 🔒 Redirect to login if not authenticated
  useEffect(() => {
    if (!user) setLocation("/login");
  }, [user, setLocation]);

  // 📦 Fetch products with react-query
  const {
    data: products = [],
    isLoading,
    error,
  } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await fetch("/api/products", { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to fetch products: ${res.status}`);
      return res.json();
    },
    enabled: !!user,
  });

  // 🧩 Debugging logs
  useEffect(() => {
    console.log("📦 Products fetched:", products);
    console.log("isLoading:", isLoading);
    console.log("error:", error);
  }, [products, isLoading, error]);

  // 🧮 Apply category filter
  const filteredProducts =
    filterCategory === "all"
      ? products
      : products.filter((p) => p.category === filterCategory);

  // 🧰 Action handlers
  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setShowEditDialog(true);
  };

  const handlePlaceOrder = (product: Product) => {
    setSelectedProduct(product);
    setShowOrderDialog(true);
  };

  // 👤 Permissions
  const canManageProducts = ["admin", "staff", "supplier"].includes(
    user?.role ?? ""
  );
  const canPlaceOrders = user?.role === "user";

  // 🧱 Table columns
  const columns = [
    {
      header: "Product ID",
      accessorKey: "id",
      cell: ({ row }: any) => (
        <span className="font-mono text-sm">{row.original.id}</span>
      ),
    },
    {
      header: "Name",
      accessorKey: "name",
      cell: ({ row }: any) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      header: "Category",
      accessorKey: "category",
      cell: ({ row }: any) => (
        <Badge variant="outline" className="text-xs">
          {row.original.category || "Uncategorized"}
        </Badge>
      ),
    },
    {
      header: "Description",
      accessorKey: "description",
      cell: ({ row }: any) => <span>{row.original.description || "—"}</span>,
    },
    {
      header: "Price",
      accessorKey: "price",
      cell: ({ row }: any) => (
        <span>
          ₱{row.original.price.toFixed(2)}{" "}
          {row.original.weighted ? "/ kilo" : ""}
        </span>
      ),
    },
    {
      header: "On Stock",
      accessorKey: "quantity",
      cell: ({ row }: any) => <span>{row.original.quantity}</span>,
    },
    {
      header: "Status",
      cell: ({ row }: any) => {
        const q = row.original.quantity;
        const status = q <= 1 ? "critical" : q <= 5 ? "low" : "good";
        const statusText =
          q <= 1 ? "Critical" : q <= 5 ? "Running low" : "Good";
        return (
          <Badge
            variant={
              status === "critical" || status === "low"
                ? "destructive"
                : "default"
            }
            className={
              status === "good" ? "border-green-500/20 text-green-500" : ""
            }
          >
            {statusText}
          </Badge>
        );
      },
    },
    {
      header: "Actions",
      cell: ({ row }: any) => (
        <div className="flex items-center justify-end gap-2">
          {canPlaceOrders && (
            <Button
              variant="default"
              size="sm"
              onClick={() => handlePlaceOrder(row.original)}
              disabled={row.original.quantity === 0}
            >
              <ShoppingCart className="w-4 h-4 mr-1" />
              Order
            </Button>
          )}
          {canManageProducts && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(row.original)}
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Product Inventory
            </h1>
            <p className="text-muted-foreground">
              Manage your product inventory and stock levels
            </p>
          </div>
          <div className="flex gap-2">
            {canManageProducts && (
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            )}
            {/* ✅ Fixed nested <a> issue */}
            <Button asChild variant="outline">
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 items-center mb-4">
          <span className="font-medium">Filter by Category:</span>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Hand Tools">Hand Tools</SelectItem>
              <SelectItem value="Power Tools">Power Tools</SelectItem>
              <SelectItem value="Fasteners & Fittings">
                Fasteners & Fittings
              </SelectItem>
              <SelectItem value="Electrical Supplies">
                Electrical Supplies
              </SelectItem>
              <SelectItem value="Plumbing Supplies">
                Plumbing Supplies
              </SelectItem>
              <SelectItem value="Construction Materials">
                Construction Materials
              </SelectItem>
              <SelectItem value="Safety Gear">Safety Gear</SelectItem>
              <SelectItem value="Cleaning & Maintenance">
                Cleaning & Maintenance
              </SelectItem>
              <SelectItem value="Outdoor & Garden">
                Outdoor & Garden
              </SelectItem>
              <SelectItem value="Automotive & Industrial">
                Automotive & Industrial
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Product Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Product Inventory
              <Badge variant="secondary" className="ml-auto">
                {filteredProducts.length} products
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading products...</div>
            ) : error ? (
              <div className="text-center text-red-500 py-8">
                Failed to load products.
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No products found.
              </div>
            ) : (
              <DataTable columns={columns} data={filteredProducts} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <AddProductDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
      />

      {selectedProduct && (
        <EditProductDialog
          open={showEditDialog}
          onClose={() => {
            setShowEditDialog(false);
            setSelectedProduct(null);
          }}
          product={selectedProduct}
        />
      )}

      {selectedProduct && (
        <PlaceOrderDialog
          open={showOrderDialog}
          onClose={() => {
            setShowOrderDialog(false);
            setSelectedProduct(null);
          }}
          product={selectedProduct}
        />
      )}
    </div>
  );
}

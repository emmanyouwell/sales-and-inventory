import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/context/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  AlertTriangle,
  DollarSign,
  User,
  LogOut,
  ShoppingCart,
  Menu,
  LayoutDashboard,
} from "lucide-react";

interface Stats {
  totalProducts: number;
  lowStockItems: number;
  totalValue: number | null;
  lowStockProducts: Array<{ id: string; name: string; quantity: number }>;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user) setLocation("/login");
  }, [user, setLocation]);

  const { data: stats, isLoading } = useQuery<Stats>({ queryKey: ["/api/stats"], enabled: !!user });

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  if (!user) return null;

  const isAdminOrStaff = user.role === "admin" || user.role === "staff";

  const formatPeso = (value: number | null | undefined) => {
    if (value == null) return "₱0.00";
    return value.toLocaleString("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    });
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* MOBILE HEADER */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-card border-b px-4 py-3 flex items-center justify-between z-40">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
          <Menu className="w-6 h-6" />
        </Button>
        <h1 className="text-lg font-semibold">Dashboard</h1>
      </div>

      {/* SIDEBAR */}
      <aside
        className={`fixed lg:static top-0 left-0 h-full w-64 bg-card border-r shadow-md z-50 transform transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="p-5 border-b">
          <h2 className="text-xl font-bold">BLCM</h2>
          <p className="text-sm text-muted-foreground">Welcome, {user.firstName}</p>
        </div>

        <nav className="flex flex-col p-4 space-y-2">
          <Link href="/dashboard">
            <Button variant="ghost" className="w-full justify-start">
              <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
            </Button>
          </Link>
          <Link href="/products">
            <Button variant="ghost" className="w-full justify-start">
              <Package className="w-4 h-4 mr-2" /> Products
            </Button>
          </Link>
          <Link href="/orders">
            <Button variant="ghost" className="w-full justify-start">
              <ShoppingCart className="w-4 h-4 mr-2" /> Reports
            </Button>
          </Link>
          <Link href="/profile">
            <Button variant="ghost" className="w-full justify-start">
              <User className="w-4 h-4 mr-2" /> Profile
            </Button>
          </Link>
          {user.role === "staff" && (
            <Link href="/transaction">
              <Button variant="ghost" className="w-full justify-start">
                <DollarSign className="w-4 h-4 mr-2" /> Create New Transaction
              </Button>
            </Link>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start text-red-500"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </nav>
      </aside>

      {/* OVERLAY FOR MOBILE */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 lg:hidden z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 mt-14 lg:mt-0">
        <div className={`grid grid-cols-1 ${isAdminOrStaff ? "md:grid-cols-3" : "md:grid-cols-2"} gap-6 mb-8`}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? "..." : stats?.totalProducts ?? 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{isLoading ? "..." : stats?.lowStockItems ?? 0}</div>
            </CardContent>
          </Card>

          {isAdminOrStaff && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? "..." : formatPeso(stats?.totalValue)}</div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <p>System initialized successfully — Just now</p>
                <p>Welcome to BLCM Dashboard — 2 minutes ago</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Low Stock Alert</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center text-muted-foreground">Loading...</div>
              ) : !stats?.lowStockProducts?.length ? (
                <div className="text-center text-muted-foreground">No low stock items</div>
              ) : (
                <div className="space-y-4">
                  {stats.lowStockProducts.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">Only {item.quantity} left</p>
                      </div>
                      <Badge variant="destructive">{item.quantity <= 1 ? "Critical" : "Low"}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

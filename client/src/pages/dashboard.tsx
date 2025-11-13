import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/context/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, AlertTriangle, DollarSign, User, LogOut, ShoppingCart } from "lucide-react";

interface Stats {
  totalProducts: number;
  lowStockItems: number;
  totalValue: number | null; // allow null if server hides it for non-admins
  lowStockProducts: Array<{
    id: string;
    name: string;
    quantity: number;
  }>;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!user) setLocation("/login");
  }, [user, setLocation]);

  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
    enabled: !!user,
  });

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  if (!user) return null;

  const isAdminOrStaff = user.role === "admin" || user.role === "staff";

  // ✅ Peso currency formatter
  const formatPeso = (value: number | null | undefined) => {
    if (value == null) return "₱0.00";
    return value.toLocaleString("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b" data-testid="dashboard-header">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground" data-testid="page-title">
                  Dashboard
                </h1>
                <p className="text-sm text-muted-foreground" data-testid="dashboard-subtitle">
                  Welcome back, {user.firstName || user.username}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Link href="/products">
                <Button variant="outline" size="sm" data-testid="button-products">
                  <Package className="w-4 h-4 mr-2" />
                  Products
                </Button>
              </Link>
              <Link href="/orders">
                <Button variant="outline" size="sm" data-testid="button-orders">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Reports
                </Button>
              </Link>

              <Link href="/profile">
                <Button variant="outline" size="sm" data-testid="button-profile">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Button>
                {user.role === "staff" && (
                  <Link href="/transaction">
                    <Button variant="outline" size="sm" data-testid="button-transaction">
                     <DollarSign className="w-4 h-4 mr-2" />
                 Create New Transaction
            </Button>
          </Link>
            )}
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout} data-testid="button-logout">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div
          className={`grid grid-cols-1 ${isAdminOrStaff ? "md:grid-cols-3" : "md:grid-cols-2"} gap-6 mb-8`}
        >
          {/* Total Products */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "..." : stats?.totalProducts ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">+2 from last month</p>
            </CardContent>
          </Card>

          {/* Low Stock Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {isLoading ? "..." : stats?.lowStockItems ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>

          {/* ✅ Total Value — in Peso currency */}
          {isAdminOrStaff && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? "..." : formatPeso(stats?.totalValue)}
                </div>
                <p className="text-xs text-muted-foreground">+5.2% from last month</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Activity and Low Stock */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      System initialized successfully
                    </p>
                    <p className="text-sm text-muted-foreground">Just now</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-accent rounded-full" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      Welcome to BLCM Dashboard
                    </p>
                    <p className="text-sm text-muted-foreground">2 minutes ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Low Stock Alert */}
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
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Only {item.quantity} left in stock
                        </p>
                      </div>
                      <Badge variant="destructive">
                        {item.quantity <= 1 ? "Critical" : "Low"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

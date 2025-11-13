import { useAuth } from "../attached_assets/use-auth_1757427482427";
import { Button } from "../client/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../client/src/components/ui/card";
import { Shield, Users, ShoppingBag, DollarSign, LogOut, User, Plus, RotateCcw, FileText, Settings, UserCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function AdminPage() {
  const { user, logout, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="admin-page min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Admin Header */}
        <header className="bg-card rounded-xl shadow-lg p-6 mb-8" data-testid="admin-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-destructive rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-destructive-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground" data-testid="page-title">
                  Admin Dashboard
                </h1>
                <p className="text-muted-foreground" data-testid="admin-subtitle">
                  System administration panel
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setLocation("/profile")}
                variant="outline"
                className="transition-colors"
                data-testid="button-admin-profile"
              >
                <UserCircle className="w-4 h-4 mr-2" />
                Profile
              </Button>
              <Button
                onClick={() => logout()}
                variant="secondary"
                className="transition-colors"
                data-testid="button-admin-logout"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Admin Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card data-testid="stat-users">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground" data-testid="text-total-users-label">
                    Total Users
                  </p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-total-users-count">
                    1,247
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-orders">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground" data-testid="text-active-orders-label">
                    Active Orders
                  </p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-active-orders-count">
                    89
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-revenue">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground" data-testid="text-revenue-label">
                    Revenue
                  </p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-revenue-amount">
                    $12,847
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-system">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground" data-testid="text-system-status-label">
                    System Status
                  </p>
                  <p className="text-2xl font-bold text-green-600" data-testid="text-system-status">
                    Online
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <div className="relative">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-3 h-3 bg-green-500 rounded-full pulse-ring"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card data-testid="card-user-management">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-foreground" data-testid="text-user-management-title">
                User Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  variant="default"
                  className="w-full justify-start"
                  data-testid="button-view-users"
                >
                  <User className="w-4 h-4 mr-2" />
                  View All Users
                </Button>
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  data-testid="button-create-user"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New User
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  data-testid="button-reset-passwords"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset User Passwords
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-system-operations">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-foreground" data-testid="text-system-operations-title">
                System Operations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  variant="default"
                  className="w-full justify-start"
                  data-testid="button-view-logs"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  View System Logs
                </Button>
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  data-testid="button-manage-orders"
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Manage Orders
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  data-testid="button-system-settings"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  System Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

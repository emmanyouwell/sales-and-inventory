import { useAuth } from "../attached_assets/use-auth_1757427482427";
import { Button } from "../client/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../client/src/components/ui/card";
import { Mail, User, CheckCircle, Settings, LogOut, UserCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function HomePage() {
  const { user, logout, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
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

  if (!user) {
    return null;
  }

  return (
    <div className="home-page min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="bg-card rounded-xl shadow-lg p-6 mb-8" data-testid="home-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <Mail className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground" data-testid="page-title">
                  User Dashboard
                </h1>
                <p className="text-muted-foreground" data-testid="welcome-message">
                  Welcome back, {user.firstName || user.username}!
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setLocation("/profile")}
                variant="outline"
                className="transition-colors"
                data-testid="button-profile"
              >
                <UserCircle className="w-4 h-4 mr-2" />
                Profile
              </Button>
              <Button
                onClick={() => logout()}
                variant="secondary"
                className="transition-colors"
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-xl transition-shadow cursor-pointer" data-testid="card-profile">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground" data-testid="text-profile-title">
                    Profile
                  </h3>
                  <p className="text-sm text-muted-foreground" data-testid="text-profile-description">
                    Manage your account
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-shadow cursor-pointer" data-testid="card-orders">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground" data-testid="text-orders-title">
                    Orders
                  </h3>
                  <p className="text-sm text-muted-foreground" data-testid="text-orders-description">
                    View your orders
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-shadow cursor-pointer" data-testid="card-settings">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Settings className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground" data-testid="text-settings-title">
                    Settings
                  </h3>
                  <p className="text-sm text-muted-foreground" data-testid="text-settings-description">
                    Account preferences
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card data-testid="card-activity">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-foreground" data-testid="text-activity-title">
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-secondary/50 rounded-lg" data-testid="activity-item-1">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-foreground" data-testid="text-activity-1">
                    Profile updated successfully
                  </p>
                  <p className="text-xs text-muted-foreground" data-testid="text-activity-time-1">
                    2 hours ago
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-4 bg-secondary/50 rounded-lg" data-testid="activity-item-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-foreground" data-testid="text-activity-2">
                    Order #1234 completed
                  </p>
                  <p className="text-xs text-muted-foreground" data-testid="text-activity-time-2">
                    1 day ago
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

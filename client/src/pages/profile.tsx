import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/context/AuthProvider";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, LogOut, Package, Home, ArrowLeft, Edit3, Save, X, Key } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function Profile() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    supply: "",
    supplyQuantity: "",
  });

  useEffect(() => {
    if (!user) {
      setLocation("/login");
    } else {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        supply: user.supply || "",
        supplyQuantity: user.supplyQuantity?.toString() || "",
      });
    }
  }, [user, setLocation]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", "/api/profile", data);
      return response.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["/api/me"], updatedUser);
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  const handleSave = () => {
    const updateData: any = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
    };

    if (user?.role === "supplier") {
      updateData.supply = formData.supply;
      updateData.supplyQuantity = formData.supplyQuantity
        ? parseInt(formData.supplyQuantity)
        : undefined;
    }

    updateMutation.mutate(updateData);
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        supply: user.supply || "",
        supplyQuantity: user.supplyQuantity?.toString() || "",
      });
    }
    setIsEditing(false);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b" data-testid="profile-header">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="outline" size="sm" data-testid="button-back">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-foreground" data-testid="page-title">
                    User Profile
                  </h1>
                  <p className="text-sm text-muted-foreground" data-testid="profile-subtitle">
                    Manage your account information
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* ✅ Show Reset Password button only for Admins */}
              {user?.role?.toLowerCase() === "admin" && (
                <Link href="/reset-staff-password">
                  <Button variant="outline" size="sm" data-testid="button-reset-password">
                    <Key className="w-4 h-4 mr-2" />
                    Reset Password
                  </Button>
                </Link>
              )}

              <Link href="/products">
                <Button variant="outline" size="sm" data-testid="button-products">
                  <Package className="w-4 h-4 mr-2" />
                  Products
                </Button>
              </Link>

              <Link href="/dashboard">
                <Button variant="outline" size="sm" data-testid="button-home">
                  <Home className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>

              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Profile Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card data-testid="profile-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold" data-testid="card-title">
                  Profile Information
                </CardTitle>
                <div className="flex space-x-2">
                  {!isEditing ? (
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                      data-testid="button-edit"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={handleSave}
                        disabled={updateMutation.isPending}
                        data-testid="button-save"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                        data-testid="button-cancel"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <form className="space-y-6">
                {/* Read-only fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-foreground font-medium text-sm">Username</Label>
                    <Input
                      value={user.username}
                      readOnly
                      className="bg-muted text-muted-foreground"
                      data-testid="input-username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground font-medium text-sm">Role</Label>
                    <Input
                      value={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      readOnly
                      className="bg-muted text-muted-foreground"
                      data-testid="input-role"
                    />
                  </div>
                </div>

                {/* Editable fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-foreground font-medium text-sm">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                      readOnly={!isEditing}
                      className={!isEditing ? "bg-muted text-muted-foreground" : ""}
                      data-testid="input-firstName"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-foreground font-medium text-sm">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                      readOnly={!isEditing}
                      className={!isEditing ? "bg-muted text-muted-foreground" : ""}
                      data-testid="input-lastName"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground font-medium text-sm">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    readOnly={!isEditing}
                    className={!isEditing ? "bg-muted text-muted-foreground" : ""}
                    data-testid="input-email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-foreground font-medium text-sm">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phone: e.target.value.replace(/[^0-9]/g, ""),
                      }))
                    }
                    readOnly={!isEditing}
                    maxLength={11}
                    className={!isEditing ? "bg-muted text-muted-foreground" : ""}
                    data-testid="input-phone"
                  />
                </div>

                {user.role === "supplier" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="supply" className="text-foreground font-medium text-sm">
                        Supply Type
                      </Label>
                      <Input
                        id="supply"
                        value={formData.supply}
                        onChange={(e) => setFormData((prev) => ({ ...prev, supply: e.target.value }))}
                        readOnly={!isEditing}
                        className={!isEditing ? "bg-muted text-muted-foreground" : ""}
                        data-testid="input-supply"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="supplyQuantity" className="text-foreground font-medium text-sm">
                        Supply Quantity
                      </Label>
                      <Input
                        id="supplyQuantity"
                        type="number"
                        min="1"
                        value={formData.supplyQuantity}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            supplyQuantity: e.target.value,
                          }))
                        }
                        readOnly={!isEditing}
                        className={!isEditing ? "bg-muted text-muted-foreground" : ""}
                        data-testid="input-supplyQuantity"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <div className="space-y-2">
                    <Label className="text-foreground font-medium text-sm">
                      Account Created
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "Unknown"}
                    </p>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

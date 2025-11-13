import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../client/src/lib/queryClient";
import { useAuth } from "../attached_assets/use-auth_1757427482427";
import { useLocation } from "wouter";
import { Button } from "../client/src/components/ui/button";
import { Input } from "../client/src/components/ui/input";
import { Label } from "../client/src/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../client/src/components/ui/card";
import { Alert, AlertDescription } from "../client/src/components/ui/alert";
import { User, Edit3, Save, X, LogOut, Home, ArrowLeft, Package } from "lucide-react";
import { useToast } from "../client/src/hooks/use-toast";

const updateProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().regex(/^[0-9]{11}$/).optional(),
  nationality: z.string().optional(),
  supply: z.string().optional(),
  supplyQuantity: z.number().positive().optional(),
});

type UpdateProfileForm = z.infer<typeof updateProfileSchema>;

interface UserProfile {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  nationality?: string;
  role: string;
  supply?: string;
  supplyQuantity?: number;
  createdAt: string;
}

export default function ProfilePage() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<UpdateProfileForm>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      supply: "",
      supplyQuantity: undefined,
    },
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [user, authLoading, setLocation]);

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ["/api/profile"],
    queryFn: async () => {
      const response = await fetch("/api/profile", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch profile");
      return response.json();
    },
    enabled: !!user,
  });

  // Update form values when profile data loads
  useEffect(() => {
    if (profile) {
      form.reset({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        email: profile.email || "",
        phone: profile.phone || "",
        nationality: profile.nationality || "",
        supply: profile.supply || "",
        supplyQuantity: profile.supplyQuantity || undefined,
      });
    }
  }, [profile, form]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateProfileForm) => {
      const response = await apiRequest("PUT", "/api/profile", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/profile"], data.user);
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UpdateProfileForm) => {
    // Convert supplyQuantity to number if provided
    const submitData = {
      ...data,
      supplyQuantity: data.supplyQuantity ? Number(data.supplyQuantity) : undefined,
    };
    updateProfileMutation.mutate(submitData);
  };

  const handleCancel = () => {
    if (profile) {
      form.reset({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        email: profile.email || "",
        phone: profile.phone || "",
        nationality: profile.nationality || "",
        supply: profile.supply || "",
        supplyQuantity: profile.supplyQuantity || undefined,
      });
    }
    setIsEditing(false);
  };

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    form.setValue("phone", value);
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b" data-testid="profile-header">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setLocation(user.role === "admin" ? "/admin" : "/home")}
                className="p-2"
                data-testid="button-back"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-foreground" />
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
              <Button
                variant="ghost"
                onClick={() => setLocation("/products")}
                data-testid="button-products"
              >
                <Package className="w-4 h-4 mr-2" />
                Products
              </Button>
              <Button
                variant="ghost"
                onClick={() => setLocation(user.role === "admin" ? "/admin" : "/home")}
                data-testid="button-home"
              >
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <Button
                variant="ghost"
                onClick={() => logout()}
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card data-testid="profile-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold text-foreground" data-testid="card-title">
                  Profile Information
                </CardTitle>
                {!isEditing ? (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    data-testid="button-edit"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button
                      onClick={form.handleSubmit(onSubmit)}
                      disabled={updateProfileMutation.isPending}
                      data-testid="button-save"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      disabled={updateProfileMutation.isPending}
                      data-testid="button-cancel"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                {/* Read-only fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-foreground font-medium">Username</Label>
                    <Input
                      value={profile.username}
                      readOnly
                      className="bg-muted text-muted-foreground"
                      data-testid="input-username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground font-medium">Role</Label>
                    <Input
                      value={profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                      readOnly
                      className="bg-muted text-muted-foreground"
                      data-testid="input-role"
                    />
                  </div>
                </div>

                {/* Editable fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-foreground font-medium">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="Enter first name"
                      readOnly={!isEditing}
                      data-testid="input-firstName"
                      {...form.register("firstName")}
                      className={!isEditing ? "bg-muted text-muted-foreground" : ""}
                    />
                    {form.formState.errors.firstName && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.firstName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-foreground font-medium">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Enter last name"
                      readOnly={!isEditing}
                      data-testid="input-lastName"
                      {...form.register("lastName")}
                      className={!isEditing ? "bg-muted text-muted-foreground" : ""}
                    />
                    {form.formState.errors.lastName && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    readOnly={!isEditing}
                    data-testid="input-email"
                    {...form.register("email")}
                    className={!isEditing ? "bg-muted text-muted-foreground" : ""}
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-foreground font-medium">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="09171234567"
                      maxLength={11}
                      readOnly={!isEditing}
                      data-testid="input-phone"
                      {...form.register("phone")}
                      onChange={isEditing ? handlePhoneInput : undefined}
                      className={!isEditing ? "bg-muted text-muted-foreground" : ""}
                    />
                    {form.formState.errors.phone && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nationality" className="text-foreground font-medium">
                      Nationality
                    </Label>
                    <Input
                      id="nationality"
                      type="text"
                      placeholder="Enter nationality"
                      readOnly={!isEditing}
                      data-testid="input-nationality"
                      {...form.register("nationality")}
                      className={!isEditing ? "bg-muted text-muted-foreground" : ""}
                    />
                    {form.formState.errors.nationality && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.nationality.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Supplier fields */}
                {profile.role === "supplier" && (
                  <div className="space-y-4 p-4 bg-secondary/20 rounded-lg" data-testid="supplier-section">
                    <h3 className="text-lg font-medium text-foreground">Supplier Information</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="supply" className="text-foreground font-medium">
                        Supply to Offer
                      </Label>
                      <Input
                        id="supply"
                        type="text"
                        placeholder="What do you supply?"
                        readOnly={!isEditing}
                        data-testid="input-supply"
                        {...form.register("supply")}
                        className={!isEditing ? "bg-muted text-muted-foreground" : ""}
                      />
                      {form.formState.errors.supply && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.supply.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="supplyQuantity" className="text-foreground font-medium">
                        Quantity of Products
                      </Label>
                      <Input
                        id="supplyQuantity"
                        type="number"
                        min="1"
                        placeholder="Enter quantity"
                        readOnly={!isEditing}
                        data-testid="input-supplyQuantity"
                        {...form.register("supplyQuantity", { valueAsNumber: true })}
                        className={!isEditing ? "bg-muted text-muted-foreground" : ""}
                      />
                      {form.formState.errors.supplyQuantity && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.supplyQuantity.message}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Account created date */}
                <div className="pt-4 border-t">
                  <div className="space-y-2">
                    <Label className="text-foreground font-medium">Account Created</Label>
                    <Input
                      value={new Date(profile.createdAt).toLocaleDateString()}
                      readOnly
                      className="bg-muted text-muted-foreground"
                      data-testid="input-createdAt"
                    />
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
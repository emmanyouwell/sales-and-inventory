// src/pages/register.tsx (or wherever your component lives)
import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface RegisterData {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  confirmPassword: string;
  email: string;
  phone: string;
  role: string;
  supply?: string;
  supplyQuantity?: number;
}

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<RegisterData>({
    firstName: "",
    lastName: "",
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    phone: "",
    role: "user",
  });

  const handleInputChange = (field: keyof RegisterData, value: string | number | undefined) => {
    setFormData(prev => {
      // Keep types consistent: supplyQuantity as number | undefined
      return { ...prev, [field]: value } as RegisterData;
    });
  };

  const validateLocally = (data: RegisterData) => {
    // Mirror the backend rules
    if (!data.firstName || !data.lastName || !data.username || !data.password || !data.confirmPassword || !data.email || !data.phone) {
      throw new Error("Please fill in all required fields");
    }

    // Password rules: at least 8 chars, uppercase, lowercase, number, special
    if (data.password.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(data.password)) {
      throw new Error("Password must include uppercase, lowercase, number, and special character");
    }

    if (data.password !== data.confirmPassword) {
      throw new Error("Passwords do not match");
    }

    if (!/^[0-9]{11}$/.test(String(data.phone))) {
      throw new Error("Phone number must be 11 digits");
    }

    if (data.role === "supplier") {
      if (!data.supply || data.supplyQuantity === undefined || Number.isNaN(data.supplyQuantity) || Number(data.supplyQuantity) <= 0) {
        throw new Error("Supply type and positive quantity are required for suppliers");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Local validation (user-friendly before hitting server)
      validateLocally(formData);

      // Prepare payload: ensure supplyQuantity is either a number or undefined
      const payload: any = {
        ...formData,
        supplyQuantity: formData.supplyQuantity === undefined ? undefined : Number(formData.supplyQuantity),
      };

      // Keep confirmPassword — server's registerSchema expects it (server will strip before persisting)
      const response = await apiRequest("POST", "/api/register", payload);

      toast({
        title: "Success",
        description: "Account created successfully! You can now login.",
      });

      setLocation("/login");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Registration failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary to-accent">
      <div className="w-full max-w-lg">
        <div className="login-container shadow-2xl border-0 rounded-lg">
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2" data-testid="register-title">
                Add Account
              </h1>
              <p className="text-muted-foreground" data-testid="register-subtitle">
                Join us today
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-foreground font-medium text-sm">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Enter first name"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    data-testid="input-firstName"
                    className="h-10 transition-all duration-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-foreground font-medium text-sm">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Enter last name"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    data-testid="input-lastName"
                    className="h-10 transition-all duration-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="text-foreground font-medium text-sm">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                  data-testid="input-username"
                  className="h-10 transition-all duration-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground font-medium text-sm">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    data-testid="input-password"
                    className="h-10 transition-all duration-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-foreground font-medium text-sm">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    data-testid="input-confirmPassword"
                    className="h-10 transition-all duration-200"
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
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  data-testid="input-email"
                  className="h-10 transition-all duration-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-foreground font-medium text-sm">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="09171234567"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value.replace(/[^0-9]/g, ''))}
                    maxLength={11}
                    data-testid="input-phone"
                    className="h-10 transition-all duration-200"
                  />
                </div>

               
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-foreground font-medium text-sm">
                  Role
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleInputChange("role", value)}
                  data-testid="select-role"
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="supplier">Supplier</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.role === "supplier" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="supply" className="text-foreground font-medium text-sm">
                        Supply Type
                      </Label>
                      <Input
                        id="supply"
                        type="text"
                        placeholder="What do you supply?"
                        value={formData.supply || ""}
                        onChange={(e) => handleInputChange("supply", e.target.value)}
                        data-testid="input-supply"
                        className="h-10 transition-all duration-200"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="supplyQuantity" className="text-foreground font-medium text-sm">
                        Quantity
                      </Label>
                      <Input
                        id="supplyQuantity"
                        type="number"
                        min="1"
                        placeholder="Supply quantity"
                        value={formData.supplyQuantity !== undefined ? String(formData.supplyQuantity) : ""}
                        onChange={(e) => {
                          const raw = e.target.value;
                          handleInputChange("supplyQuantity", raw === "" ? undefined : Number(raw));
                        }}
                        data-testid="input-supplyQuantity"
                        className="h-10 transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 font-medium transition-all duration-200"
                data-testid="button-register"
              >
                {isLoading && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                <span>{isLoading ? "Creating Account..." : "Create Account"}</span>
              </Button>
            </form>

            <div className="mt-6 text-center">
              <div className="flex items-center justify-center space-x-2">
                <span className="text-muted-foreground text-sm">
                  Already have an account?
                </span>
                <Link href="/login">
                  <button
                    type="button"
                    className="text-primary hover:text-primary/80 text-sm font-medium underline"
                  >
                    Sign in here
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

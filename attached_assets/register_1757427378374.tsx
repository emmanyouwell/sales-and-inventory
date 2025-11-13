import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "../client/src/lib/queryClient";
import { useLocation } from "wouter";
import { Button } from "../client/src/components/ui/button";
import { Input } from "../client/src/components/ui/input";
import { Label } from "../client/src/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../client/src/components/ui/select";
import { Card, CardContent } from "../client/src/components/ui/card";
import { Alert, AlertDescription } from "../client/src/components/ui/alert";
import { UserPlus, Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "../client/src/hooks/use-toast";

const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string()
    .min(6, "Password must be at least 6 characters")
    .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must include uppercase, lowercase, and number"),
  confirmPassword: z.string(),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^[0-9]{11}$/, "Phone number must be 11 digits"),
  nationality: z.string().min(1, "Nationality is required"),
  birthdate: z.string().min(1, "Birthdate is required"),
  role: z.enum(["user", "staff", "admin", "supplier"]).default("user"),
  supply: z.string().optional(),
  supplyQuantity: z.number().positive().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.role === "supplier") {
    return data.supply && data.supplyQuantity;
  }
  return true;
}, {
  message: "Supply and quantity are required for suppliers",
  path: ["supply"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const [showSupplierFields, setShowSupplierFields] = useState(false);
  const { toast } = useToast();

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      password: "",
      confirmPassword: "",
      email: "",
      phone: "",
      birthdate: "",
      role: "user",
      supply: "",
      supplyQuantity: undefined,
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      const response = await apiRequest("POST", "/api/register", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Registration Successful!",
        description: "Your account has been created. You can now log in.",
      });
      setLocation("/login");
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "An error occurred during registration",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegisterForm) => {
    // Convert supplyQuantity to number if provided
    const submitData = {
      ...data,
      supplyQuantity: data.supplyQuantity ? Number(data.supplyQuantity) : undefined,
    };
    registerMutation.mutate(submitData);
  };

  const handleRoleChange = (value: string) => {
    form.setValue("role", value as "user" | "staff" | "admin" | "supplier");
    setShowSupplierFields(value === "supplier");
    
    if (value !== "supplier") {
      form.setValue("supply", "");
      form.setValue("supplyQuantity", undefined);
    }
  };

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    form.setValue("phone", value);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary to-purple-600">
      <div className="w-full max-w-lg">
        <Card className="login-container shadow-2xl border-0">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2" data-testid="register-title">
                Create Account
              </h1>
              <p className="text-muted-foreground" data-testid="register-subtitle">
                Join us today
              </p>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-foreground font-medium">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Enter first name"
                    data-testid="input-firstName"
                    {...form.register("firstName")}
                    className="h-10 transition-all duration-200"
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
                    data-testid="input-lastName"
                    {...form.register("lastName")}
                    className="h-10 transition-all duration-200"
                  />
                  {form.formState.errors.lastName && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthdate" className="text-foreground font-medium">
                  Birthdate
                </Label>
                <Input
                  id="birthdate"
                  type="date"
                  data-testid="input-birthdate"
                  {...form.register("birthdate")}
                  className="h-10 transition-all duration-200"
                />
                {form.formState.errors.birthdate && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.birthdate.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="text-foreground font-medium">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Choose a username"
                  data-testid="input-username"
                  {...form.register("username")}
                  className="h-10 transition-all duration-200"
                />
                {form.formState.errors.username && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.username.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground font-medium">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create password"
                    data-testid="input-password"
                    {...form.register("password")}
                    className="h-10 transition-all duration-200"
                  />
                  {form.formState.errors.password && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-foreground font-medium">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm password"
                    data-testid="input-confirmPassword"
                    {...form.register("confirmPassword")}
                    className="h-10 transition-all duration-200"
                  />
                  {form.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.confirmPassword.message}
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
                  data-testid="input-email"
                  {...form.register("email")}
                  className="h-10 transition-all duration-200"
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
                    data-testid="input-phone"
                    {...form.register("phone")}
                    onChange={handlePhoneInput}
                    className="h-10 transition-all duration-200"
                  />
                  {form.formState.errors.phone && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.phone.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-foreground font-medium">
                  Role
                </Label>
                <Select onValueChange={handleRoleChange} defaultValue="user">
                  <SelectTrigger className="h-10" data-testid="select-role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="supplier">Supplier</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.role && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.role.message}
                  </p>
                )}
              </div>

              {showSupplierFields && (
                <div className="space-y-4 p-4 bg-secondary/20 rounded-lg" data-testid="supplier-fields">
                  <div className="space-y-2">
                    <Label htmlFor="supply" className="text-foreground font-medium">
                      Supply to Offer
                    </Label>
                    <Input
                      id="supply"
                      type="text"
                      placeholder="What do you supply?"
                      data-testid="input-supply"
                      {...form.register("supply")}
                      className="h-10 transition-all duration-200"
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
                      data-testid="input-supplyQuantity"
                      {...form.register("supplyQuantity", { valueAsNumber: true })}
                      className="h-10 transition-all duration-200"
                    />
                    {form.formState.errors.supplyQuantity && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.supplyQuantity.message}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 font-medium transition-all duration-200"
                disabled={registerMutation.isPending}
                data-testid="button-register"
              >
                {registerMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 font-medium transition-all duration-200"
                onClick={() => setLocation("/login")}
                data-testid="button-back-to-login"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
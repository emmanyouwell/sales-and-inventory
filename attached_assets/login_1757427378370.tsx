import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../attached_assets/use-auth_1757427482427";
import { Button } from "../client/src/components/ui/button";
import { Input } from "../client/src/components/ui/input";
import { Label } from "../client/src/components/ui/label";
import { Card, CardContent } from "../client/src/components/ui/card";
import { Alert, AlertDescription } from "../client/src/components/ui/alert";
import { Lock, Loader2 } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, isLoginPending, loginError, user } = useAuth();
  const [cooldownUntil, setCooldownUntil] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      window.location.href = user.role === "admin" ? "/admin" : "/home";
    }
  }, [user]);

  // Handle cooldown timer
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    if (cooldownUntil) {
      interval = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(
          0,
          Math.ceil((cooldownUntil.getTime() - now) / 1000)
        );

        setTimeRemaining(remaining);

        if (remaining <= 0) {
          setCooldownUntil(null);
          setTimeRemaining(0);
          localStorage.removeItem("cooldownUntil");
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [cooldownUntil]);

  // Check for stored cooldown on mount
  useEffect(() => {
    const storedCooldown = localStorage.getItem("cooldownUntil");
    if (storedCooldown) {
      const cooldownDate = new Date(storedCooldown);
      if (cooldownDate > new Date()) {
        setCooldownUntil(cooldownDate);
      } else {
        localStorage.removeItem("cooldownUntil");
      }
    }
  }, []);

  const onSubmit = (data: LoginForm) => {
    if (cooldownUntil && cooldownUntil > new Date()) return;

    login(data.username, data.password).catch((error: any) => {
      // Handle cooldown from server response
      if (error?.message?.includes("cooldownUntil")) {
        try {
          const errorData = JSON.parse(error.message.split(": ")[1]);
          if (errorData.cooldownUntil) {
            const cooldownDate = new Date(errorData.cooldownUntil);
            setCooldownUntil(cooldownDate);
            localStorage.setItem("cooldownUntil", cooldownDate.toISOString());
          }
        } catch {
          // Fallback parsing for simple cooldown messages
          if (error.message.includes("5 minutes")) {
            const cooldownDate = new Date(Date.now() + 5 * 60 * 1000);
            setCooldownUntil(cooldownDate);
            localStorage.setItem("cooldownUntil", cooldownDate.toISOString());
          } else if (error.message.includes("1 minute")) {
            const cooldownDate = new Date(Date.now() + 1 * 60 * 1000);
            setCooldownUntil(cooldownDate);
            localStorage.setItem("cooldownUntil", cooldownDate.toISOString());
          }
        }
      }
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Always boolean
  const isInCooldown: boolean =
    cooldownUntil ? cooldownUntil.getTime() > Date.now() : false;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary to-purple-600">
      <div className="w-full max-w-md">
        <Card className="login-container shadow-2xl border-0">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1
                className="text-2xl font-bold text-foreground mb-2"
                data-testid="login-title"
              >
                Welcome Back
              </h1>
              <p className="text-muted-foreground" data-testid="login-subtitle">
                Sign in to your account
              </p>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {loginError && (
                <Alert variant="destructive" data-testid="error-message">
                  <AlertDescription>
                    {loginError.message && loginError.message.includes(":")
                      ? loginError.message.split(": ")[1]
                      : loginError.message || "Login failed"}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username" className="text-foreground font-medium">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  autoComplete="username"
                  data-testid="input-username"
                  {...form.register("username")}
                  className="h-12 transition-all duration-200"
                />
                {form.formState.errors.username && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.username.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  data-testid="input-password"
                  {...form.register("password")}
                  className="h-12 transition-all duration-200"
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12 font-medium transition-all duration-200"
                disabled={!!isLoginPending || isInCooldown}
                data-testid="button-login"
              >
                {isLoginPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>

              {isInCooldown && (
                <Alert
                  className="bg-accent/50 border-border text-accent-foreground"
                  data-testid="cooldown-message"
                >
                  <AlertDescription className="text-center">
                    <p className="font-medium mb-2">⏳ Please wait before trying again.</p>
                    <div className="text-lg font-mono" data-testid="timer-display">
                      {formatTime(timeRemaining)}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </form>
            <div className="mt-6 text-center space-y-4">
           <div className="flex items-center justify-center space-x-2">
           <span className="text-muted-foreground text-sm">
               Don't have an account?
           </span>
             <button
            type="button"
           onClick={() => (window.location.href = "/register")}
           className="text-primary hover:text-primary/80 text-sm font-medium underline"
            data-testid="link-register"
    >
             Create one here
           </button>
  </div>
</div>

            
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, UserPlus, Loader2 } from "lucide-react";
import { Link } from "wouter";

export default function Login() {
  const [, setLocation] = useLocation();
  const { user, login, isLoginPending, loginError } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [cooldownTime, setCooldownTime] = useState(0);

  useEffect(() => {
    if (user) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (cooldownTime > 0) {
      interval = setInterval(() => {
        setCooldownTime(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldownTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await login(username, password);
      toast({
        title: "Success",
        description: "Login successful!",
      });
      setLocation("/dashboard");
    } catch (error: any) {
      if (error.message.includes("cooldown") || error.message.includes("locked")) {
        setCooldownTime(300); // 5 minutes
      }
      toast({
        title: "Error",
        description: error.message || "Login failed",
        variant: "destructive",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
   <div className="min-h-screen flex items-center justify-center bg-black">


      <div className="w-full max-w-md">
        <div className="login-container shadow-2xl border-0 rounded-lg">
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2" data-testid="login-title">
                BLCM Hardware Login
              </h1>
              <p className="text-muted-foreground" data-testid="login-subtitle">
                Get Started
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {loginError && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-3">
                  <p className="text-sm">{loginError.message}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="username" className="text-foreground font-medium text-sm">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  data-testid="input-username"
                  className="h-12 transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground font-medium text-sm">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  data-testid="input-password"
                  className="h-12 transition-all duration-200"
                />
              </div>

              {cooldownTime > 0 && (
                <div className="bg-accent/10 border border-accent/20 text-accent-foreground rounded-lg p-3" data-testid="cooldown-message">
                  <div className="text-center">
                    <p className="font-medium mb-2">⏳ Please wait before trying again.</p>
                    <div className="text-lg font-mono" data-testid="timer-display">
                      {formatTime(cooldownTime)}
                    </div>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoginPending || cooldownTime > 0}
                className="w-full h-12 font-medium transition-all duration-200"
                data-testid="button-login"
              >
                {isLoginPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                <span>{isLoginPending ? "Signing In..." : "Sign In"}</span>
              </Button>
            </form>

            <div className="mt-6 text-center space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <span className="text-muted-foreground text-sm">
                  Don't have an account?
                </span>
                <Link href="/register">
                  <button
                    type="button"
                    className="text-primary hover:text-primary/80 text-sm font-medium underline"
                    data-testid="link-register"
                  >
                    Create one here
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

import * as React from "react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { KeyRound, RefreshCcw } from "lucide-react";

/**
 * Admin page to reset passwords for staff and supplier accounts
 */
export default function ResetStaffPassword() {
  const [users, setUsers] = useState<any[]>([]);
  const [passwords, setPasswords] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch all staff and supplier accounts
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/accounts");
      if (!res.ok) throw new Error("Failed to load accounts");
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to load accounts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle password reset
  const handleReset = async (username: string) => {
    const newPassword = passwords[username];
    if (!newPassword || newPassword.trim().length < 6) {
      toast({
        title: "Invalid Password",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Reset failed");

      toast({
        title: "Success",
        description: `Password reset for ${username}`,
      });

      setPasswords((prev) => ({ ...prev, [username]: "" }));
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Clean, well-formed JSX
  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-md border">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <KeyRound className="w-5 h-5" />
              Reset Staff & Supplier Passwords
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchUsers}
              disabled={loading}
            >
              <RefreshCcw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
          </CardHeader>

          <CardContent>
            {loading && (
              <p className="text-sm text-muted-foreground">
                Loading accounts...
              </p>
            )}

            {!loading && users.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No staff or supplier accounts found.
              </p>
            )}

            {!loading &&
              users.map((u) => (
                <div
                  key={u.id}
                  className="border-b py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-semibold text-foreground">
                      {u.username}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Role:{" "}
                      {u.role
                        ? u.role.charAt(0).toUpperCase() + u.role.slice(1)
                        : "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Created:{" "}
                      {u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString()
                        : "Unknown"}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                    <div className="flex flex-col">
                      <Label
                        htmlFor={`password-${u.username}`}
                        className="text-sm mb-1"
                      >
                        New Password
                      </Label>
                      <Input
                        id={`password-${u.username}`}
                        type="password"
                        placeholder="Enter new password"
                        value={passwords[u.username] || ""}
                        onChange={(e) =>
                          setPasswords((prev) => ({
                            ...prev,
                            [u.username]: e.target.value,
                          }))
                        }
                        className="sm:w-60"
                      />
                    </div>

                    <Button
                      type="button"
                      onClick={() => handleReset(u.username)}
                      disabled={loading}
                      className="mt-2 sm:mt-5"
                    >
                      Reset Password
                    </Button>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

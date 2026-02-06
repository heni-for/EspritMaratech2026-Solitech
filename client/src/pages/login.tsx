import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, LogIn, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, isLoggingIn } = useAuth();
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const user = await login({ username, password });
      if (user.role === "admin") navigate("/");
      else if (user.role === "trainer") navigate("/trainer");
      else navigate("/my");
    } catch (err: any) {
      const msg = err?.message || "Login failed";
      if (msg.includes("Invalid credentials")) {
        setError("Invalid username or password");
      } else {
        setError("Login failed. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-md bg-primary mb-3">
            <GraduationCap className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold" data-testid="text-login-title">ASTBA</h1>
          <p className="text-sm text-muted-foreground">Training & Attendance Tracking</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base text-center">Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  data-testid="input-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  autoComplete="username"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  data-testid="input-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-destructive" data-testid="text-login-error">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoggingIn}
                data-testid="button-login"
              >
                {isLoggingIn ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="h-4 w-4" />
                )}
                <span className="ml-2">{isLoggingIn ? "Signing in..." : "Sign In"}</span>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

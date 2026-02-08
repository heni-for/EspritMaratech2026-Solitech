import { useLocation } from "wouter";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { GraduationCap, LogIn, Loader2, ArrowLeft, Camera } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ThemeToggle } from "@/components/theme-toggle";
import { FaceLogin } from "@/components/face-login";
import { useState } from "react";

const loginSchema = z.object({
  username: z.string().min(1, "Nom d'utilisateur requis"),
  password: z.string().min(1, "Mot de passe requis"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, isLoggingIn } = useAuth();
  const [, navigate] = useLocation();
  const [useFaceLogin, setUseFaceLogin] = useState(false);
  const [isFaceLoggingIn, setIsFaceLoggingIn] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const user = await login(values);
      if (user.role === "admin") navigate("/");
      else if (user.role === "trainer") navigate("/trainer");
      else navigate("/my");
    } catch (err: any) {
      const msg = err?.message || "Login failed";
      if (msg.includes("Invalid credentials")) {
        form.setError("root", { message: "Identifiant ou mot de passe incorrect" });
      } else {
        form.setError("root", { message: "Echec de la connexion. Veuillez reessayer." });
      }
    }
  };

  const handleFaceLogin = async (faceData: string) => {
    try {
      setIsFaceLoggingIn(true);
      const response = await fetch("/api/face-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ faceData }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Face recognition failed");
      }

      const user = await response.json();
      if (user.role === "admin") navigate("/");
      else if (user.role === "trainer") navigate("/trainer");
      else navigate("/my");
    } catch (err: any) {
      throw new Error(err.message || "Face login failed");
    } finally {
      setIsFaceLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm">
        <div className="mb-4 flex justify-start">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
          </Link>
        </div>
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center justify-center w-14 h-14 rounded-md mb-3 bg-primary">
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold" data-testid="text-login-title">ASTBA</h1>
          <p className="text-sm text-muted-foreground" data-testid="text-login-subtitle">Suivi de formation et presences</p>
        </div>

        <Card>
          <CardHeader className="pb-4 relative">
            <div className="absolute right-3 top-3">
              <ThemeToggle />
            </div>
            <CardTitle className="text-base text-center" data-testid="text-login-card-title">Connexion</CardTitle>
          </CardHeader>
          <CardContent>
            {!useFaceLogin ? (
              <div className="space-y-4">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom d'utilisateur</FormLabel>
                          <FormControl>
                            <Input
                              data-testid="input-username"
                              placeholder="Saisissez votre identifiant"
                              autoComplete="username"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mot de passe</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              data-testid="input-password"
                              placeholder="Saisissez votre mot de passe"
                              autoComplete="current-password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.formState.errors.root && (
                      <p className="text-sm text-destructive" data-testid="text-login-error">
                        {form.formState.errors.root.message}
                      </p>
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
                      <span className="ml-2">{isLoggingIn ? "Connexion..." : "Se connecter"}</span>
                    </Button>
                  </form>
                </Form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-500">Ou</span>
                  </div>
                </div>

                <Button
                  onClick={() => setUseFaceLogin(true)}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <Camera className="h-4 w-4" />
                  Connexion par visage
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <FaceLogin onLogin={handleFaceLogin} isLoading={isFaceLoggingIn} />
                <Button
                  onClick={() => setUseFaceLogin(false)}
                  variant="outline"
                  className="w-full"
                  disabled={isFaceLoggingIn}
                >
                  Retour à la connexion standard
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { User, Shield, Bell, LogOut, Building2, Lock } from "lucide-react";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [email, setEmail] = useState(user?.username ?? "");
  const [phone, setPhone] = useState("");
  const [lang, setLang] = useState("FR");
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyPush, setNotifyPush] = useState(false);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profil</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gerer votre compte administrateur
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Infos personnelles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Nom / Prenom</label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Email</label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Telephone (optionnel)</label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Photo de profil</label>
                  <Input type="file" />
                </div>
              </div>
              <Button variant="outline" size="sm">
                Enregistrer
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Securite</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" size="sm">Changer mot de passe</Button>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">2FA</span>
                <Switch />
              </div>
              <div className="text-xs text-muted-foreground">
                Dernieres connexions: A venir
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Langue</span>
                <select
                  className="h-9 rounded-md border bg-background px-2 text-sm"
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
                >
                  <option value="FR">FR</option>
                  <option value="AR">AR</option>
                  <option value="EN">EN</option>
                </select>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Notifications email</span>
                <Switch checked={notifyEmail} onCheckedChange={setNotifyEmail} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Notifications push</span>
                <Switch checked={notifyPush} onCheckedChange={setNotifyPush} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Role & permissions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Role</span>
                <Badge variant="secondary">{user?.role ?? "admin"}</Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Permissions: lecture, export, gestion formations
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Mon association</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="font-medium">ASTBA</div>
              <div className="text-xs text-muted-foreground">Adresse / contact</div>
              <Button variant="outline" size="sm">Modifier</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <LogOut className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Deconnexion</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" size="sm" onClick={() => logout()}>
                Se deconnecter
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

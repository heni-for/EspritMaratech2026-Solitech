import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { applyAccessibility, defaultAccessibility, loadAccessibility, saveAccessibility } from "@/lib/accessibility";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { getBrowserRecognition, browserTtsSpeak, fileToBase64 } from "@/lib/speech";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SettingsPage() {
  const [settings, setSettings] = useState(defaultAccessibility);

  useEffect(() => {
    const saved = loadAccessibility();
    setSettings(saved);
    applyAccessibility(saved);
  }, []);

  const update = (patch: Partial<typeof settings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveAccessibility(next);
    applyAccessibility(next);
  };

  const [speechProvider, setSpeechProvider] = useState<"browser" | "azure" | "google">("browser");
  const [ttsText, setTtsText] = useState("Bonjour, ceci est un test de synthese vocale.");
  const [ttsLanguage, setTtsLanguage] = useState("fr-FR");
  const [ttsLoading, setTtsLoading] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const [sttLanguage, setSttLanguage] = useState("fr-FR");
  const [sttTranscript, setSttTranscript] = useState("");
  const [sttError, setSttError] = useState<string | null>(null);
  const [sttLoading, setSttLoading] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef("");

  const startBrowserStt = () => {
    setSttError(null);
    const recognition = getBrowserRecognition();
    if (!recognition) {
      setSttError("Reconnaissance vocale non supportee sur ce navigateur.");
      return;
    }

    recognition.lang = sttLanguage;
    recognition.interimResults = true;
    recognition.continuous = false;
    finalTranscriptRef.current = "";

    recognition.onresult = (event) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript || "";
        if (result.isFinal) {
          finalTranscriptRef.current += `${text} `;
        } else {
          interimTranscript += text;
        }
      }
      const combined = `${finalTranscriptRef.current}${interimTranscript}`.trim();
      setSttTranscript(combined);
    };

    recognition.onerror = (event) => {
      setSttError(event.error || "Erreur de reconnaissance vocale.");
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stopBrowserStt = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const handleSpeak = async () => {
    setTtsError(null);
    if (!ttsText.trim()) {
      setTtsError("Entrez un texte a lire.");
      return;
    }

    if (speechProvider === "browser") {
      try {
        browserTtsSpeak(ttsText, ttsLanguage);
      } catch (error: any) {
        setTtsError(error?.message || "Synthese vocale indisponible.");
      }
      return;
    }

    try {
      setTtsLoading(true);
      const res = await apiRequest("POST", "/api/speech/tts", {
        provider: speechProvider,
        text: ttsText,
        language: ttsLanguage,
      });
      const payload = await res.json();
      const audio = new Audio(`data:${payload.contentType};base64,${payload.audioBase64}`);
      await audio.play();
    } catch (error: any) {
      setTtsError(error?.message || "Erreur de synthese vocale.");
    } finally {
      setTtsLoading(false);
    }
  };

  const handleTranscribeFile = async () => {
    setSttError(null);
    if (!audioFile) {
      setSttError("Choisissez un fichier audio.");
      return;
    }

    try {
      setSttLoading(true);
      const audioBase64 = await fileToBase64(audioFile);
      const res = await apiRequest("POST", "/api/speech/stt", {
        provider: speechProvider,
        audioBase64,
        contentType: audioFile.type || "audio/wav",
        language: sttLanguage,
      });
      const payload = await res.json();
      setSttTranscript(payload.transcript || "");
    } catch (error: any) {
      setSttError(error?.message || "Erreur de transcription.");
    } finally {
      setSttLoading(false);
    }
  };

  const techniques = [
    {
      id: "color",
      title: "Information ne repose pas seulement sur la couleur",
      how: "Statut affiche par couleur, texte et icone.",
      example: (
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">
              Choisir texte ou couleur (icone toujours presente).
            </div>
          </div>
          <div className="w-56">
            <Select
              value={settings.statusDisplay}
              onValueChange={(v) => update({ statusDisplay: v as "text" | "color" })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Texte + icone</SelectItem>
                <SelectItem value="color">Couleur + icone</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      ),
    },
    {
      id: "alt",
      title: "Texte alternatif pour les icones",
      how: "Chaque icone utile a un libelle lu par lecteur d'ecran.",
      example: (
        <div className="flex items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground">
            Exemple: <span className="font-medium">aria-label=&quot;Generer le certificat&quot;</span>
          </div>
          <div className="w-56">
            <Select
              value={settings.iconLabels ? "on" : "off"}
              onValueChange={(v) => update({ iconLabels: v === "on" })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="on">Activer les libelles</SelectItem>
                <SelectItem value="off">Desactiver les libelles</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      ),
    },
    {
      id: "semantic",
      title: "Structure semantique (H1, H2, H3)",
      how: "Chaque page a un titre principal et des sections hierarchisees.",
      example: (
        <div className="text-xs text-muted-foreground">
          H1: Tableau de bord &bull; H2: Formations &bull; H3: Niveau 2
        </div>
      ),
    },
    {
      id: "keyboard",
      title: "Acces clavier + ordre logique",
      how: "Tab pour naviguer, Entree/Espace pour activer, Echap pour fermer.",
      example: (
        <div className="text-xs text-muted-foreground">
          Ordre: menu &rarr; contenu &rarr; actions
        </div>
      ),
    },
    {
      id: "media",
      title: "Sous-titres ou transcription pour audio/video",
      how: "Chaque video a des sous-titres ou une transcription.",
      example: (
        <div className="text-xs text-muted-foreground">
          Exemple: transcription affichee sous la video.
        </div>
      ),
    },
    {
      id: "notifications",
      title: "Notifications visibles (pas uniquement sonores)",
      how: "Toast, modal ou bandeau affiche un message clair.",
      example: (
        <div className="text-xs text-muted-foreground">
          Exemple: &quot;Presence enregistree avec succes&quot;.
        </div>
      ),
    },
    {
      id: "cognitive",
      title: "Eviter la surcharge cognitive",
      how: "Une action principale par ecran, informations groupees.",
      example: (
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Action principale</Badge>
          <Badge variant="secondary">Infos groupees</Badge>
          <Badge variant="secondary">Espacement clair</Badge>
        </div>
      ),
    },
    {
      id: "errors",
      title: "Erreurs claires avec solution",
      how: "Message dit ce qui ne va pas et comment corriger.",
      example: (
        <div className="text-xs text-muted-foreground">
          &quot;Impossible de generer le certificat : l'eleve n'a pas valide les 4 niveaux.&quot;
        </div>
      ),
    },
    {
      id: "timeouts",
      title: "Pas de limite de temps stricte",
      how: "Formulaires sans expiration brutale, avertissement si timeout.",
      example: (
        <div className="text-xs text-muted-foreground">
          Exemple: alerte + bouton pour prolonger la session.
        </div>
      ),
    },
    {
      id: "undo",
      title: "Annuler ou corriger facilement",
      how: "Confirmation avant actions critiques ou bouton Annuler.",
      example: (
        <div className="text-xs text-muted-foreground">
          Exemple: &quot;Voulez-vous vraiment supprimer cet eleve ?&quot;
        </div>
      ),
    },
    {
      id: "screen-readers",
      title: "Compatible lecteurs d'ecran",
      how: "Boutons natifs, labels associes aux champs, tableaux avec en-tetes.",
      example: (
        <div className="text-xs text-muted-foreground">
          Exemple: label + input, thead + th.
        </div>
      ),
    },
    {
      id: "aria",
      title: "ARIA utilise correctement",
      how: "ARIA uniquement quand necessaire (dialogues, alertes).",
      example: (
        <div className="text-xs text-muted-foreground">
          Exemple: role=&quot;dialog&quot; et aria-live=&quot;assertive&quot;.
        </div>
      ),
    },
  ];

  const tools = [
    {
      id: "frontend",
      title: "Frontend (UI accessible)",
      items: [
        "React + Vite",
        "TailwindCSS",
        "shadcn/ui (Radix)",
        "Radix UI",
        "React Aria (Adobe)",
        "Headless UI",
      ],
    },
    {
      id: "keyboard-aria",
      title: "Navigation clavier & ARIA",
      items: [
        "HTML semantique (button, label, fieldset, table, th)",
        "ARIA uniquement si necessaire (modals, alerts, custom)",
        "Gestion du focus (focus-trap-react ou React Aria)",
      ],
    },
    {
      id: "audit",
      title: "Audit & tests accessibilite",
      items: [
        "Lighthouse (Chrome DevTools)",
        "axe DevTools (extension)",
        "jest-axe (CI)",
        "@testing-library/react + user-event (clavier)",
      ],
    },
    {
      id: "colors",
      title: "Couleurs & contrastes",
      items: [
        "Color contrast checker",
        "Tokens CSS (modes high contrast, dark mode optionnel)",
      ],
    },
    {
      id: "media",
      title: "Sous-titres / transcription",
      items: [
        "<track kind=\"captions\"> pour video",
        "Zone transcription sous le media",
        "Web Speech API (TTS/STT) si aide vocale",
        "Azure Speech / Google STT si besoin robuste",
      ],
    },
    {
      id: "pdf",
      title: "PDF certificat accessible",
      items: [
        "Generation HTML -> PDF (Puppeteer)",
        "Texte reelement selectable (pas image)",
        "Titres lisibles + contraste correct",
      ],
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Parametres d'accessibilite</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Parametres essentiels pour tous les handicaps (WCAG).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Visuel (vue, daltonisme)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="font-medium">Taille de police</div>
              <div className="text-xs text-muted-foreground">Zoom sans casser la mise en page.</div>
            </div>
            <div className="w-56">
              <Slider
                value={[Math.round(settings.fontScale * 100)]}
                min={100}
                max={140}
                step={5}
                onValueChange={(v) => update({ fontScale: v[0] / 100 })}
              />
              <div className="text-xs text-muted-foreground mt-1">{Math.round(settings.fontScale * 100)}%</div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="font-medium">Contraste eleve</div>
              <div className="text-xs text-muted-foreground">Texte et arriere-plan plus differencies.</div>
            </div>
            <Switch checked={settings.highContrast} onCheckedChange={(v) => update({ highContrast: v })} />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="font-medium">Focus visible renforce</div>
              <div className="text-xs text-muted-foreground">Aide la navigation clavier.</div>
            </div>
            <Switch checked={settings.strongFocus} onCheckedChange={(v) => update({ strongFocus: v })} />
          </div>

        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Moteur et neurologique</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="font-medium">Reduire les animations</div>
              <div className="text-xs text-muted-foreground">Transitions douces, pas de clignotements.</div>
            </div>
            <Switch checked={settings.reduceMotion} onCheckedChange={(v) => update({ reduceMotion: v })} />
          </div>

          <div className="text-xs text-muted-foreground">
            La navigation clavier est supportee. Le bouton "Aller au contenu" est disponible.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cognitif et comprehension</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Langage simple</Badge>
            <Badge variant="secondary">Etapes claires</Badge>
            <Badge variant="secondary">Icones + texte</Badge>
            <Badge variant="secondary">Erreurs explicites</Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            Les actions sensibles demandent confirmation (suppression).
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Techniques d'accessibilite</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {techniques.map((technique) => (
            <div key={technique.id} className="space-y-1.5">
              <h3 className="text-sm font-semibold">{technique.title}</h3>
              <p className="text-xs text-muted-foreground">{technique.how}</p>
              {technique.example}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Technologies et outils (WCAG)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {tools.map((group) => (
            <div key={group.id} className="space-y-2">
              <h3 className="text-sm font-semibold">{group.title}</h3>
              <div className="flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <Badge key={item} variant="secondary">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">TTS / STT (fonctionnel)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <div className="text-sm font-medium">Provider</div>
              <Select value={speechProvider} onValueChange={(v) => setSpeechProvider(v as "browser" | "azure" | "google")}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="browser">Navigateur (Web Speech API)</SelectItem>
                  <SelectItem value="azure">Azure Speech</SelectItem>
                  <SelectItem value="google">Google Speech</SelectItem>
                </SelectContent>
              </Select>
              {speechProvider !== "browser" && (
                <p className="text-xs text-muted-foreground">
                  Requiert des clefs API cote serveur (Azure/Google).
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <div className="text-sm font-medium">Langue TTS</div>
              <Input
                value={ttsLanguage}
                onChange={(e) => setTtsLanguage(e.target.value)}
                placeholder="fr-FR"
              />
            </div>
            <div className="space-y-1.5">
              <div className="text-sm font-medium">Langue STT</div>
              <Input
                value={sttLanguage}
                onChange={(e) => setSttLanguage(e.target.value)}
                placeholder="fr-FR"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="text-sm font-semibold">Synthese vocale (TTS)</div>
              <Textarea
                value={ttsText}
                onChange={(e) => setTtsText(e.target.value)}
                placeholder="Texte a lire..."
              />
              <div className="flex items-center gap-2">
                <Button onClick={handleSpeak} disabled={ttsLoading}>
                  {ttsLoading ? "Lecture..." : "Lire le texte"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    window.speechSynthesis?.cancel();
                  }}
                  disabled={speechProvider !== "browser"}
                >
                  Stop
                </Button>
              </div>
              {ttsError && <p className="text-xs text-red-500">{ttsError}</p>}
            </div>

            <div className="space-y-3">
              <div className="text-sm font-semibold">Reconnaissance vocale (STT)</div>
              {speechProvider === "browser" ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Button onClick={startBrowserStt} disabled={isListening}>
                      Demarrer
                    </Button>
                    <Button variant="outline" onClick={stopBrowserStt} disabled={!isListening}>
                      Arreter
                    </Button>
                  </div>
                  <Textarea value={sttTranscript} readOnly placeholder="Transcription..." />
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                  />
                  <Button onClick={handleTranscribeFile} disabled={sttLoading}>
                    {sttLoading ? "Transcription..." : "Transcrire le fichier"}
                  </Button>
                  <Textarea value={sttTranscript} readOnly placeholder="Transcription..." />
                </div>
              )}
              {sttError && <p className="text-xs text-red-500">{sttError}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => update(defaultAccessibility)}
        >
          Reinitialiser
        </Button>
      </div>
    </div>
  );
}


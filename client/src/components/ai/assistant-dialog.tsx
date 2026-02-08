import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Mic, Send, Sparkles, X, MessageSquare } from "lucide-react";
import { useLocation } from "wouter";
import { useTheme } from "@/components/theme-provider";

type ChatMessage = { role: "user" | "assistant"; content: string };

interface StudentDashboardData {
  student: { id: string; firstName: string; lastName: string };
  formations: Array<{
    training: { id: string; name: string };
    currentLevel: number;
    progress: number;
    absentCount: number;
    attendedSessions: number;
    totalSessions: number;
  }>;
  attendanceHistory?: Array<{
    sessionTitle: string;
    trainingName: string;
    levelName: string;
    date?: string;
    status: "present" | "absent" | "not_marked";
    note?: string | null;
    comment?: string | null;
  }>;
  certificates?: Array<{
    id: string;
    trainingName: string;
    certificateNumber: string;
    issuedAt: string;
    trainerName?: string;
  }>;
}

export function AssistantDialog() {
  const { user } = useAuth();
  const isStudent = user?.role === "student";
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [phase, setPhase] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [language, setLanguage] = useState<"fr-FR" | "ar-SA" | "ar-TN">("fr-FR");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [cloudTts, setCloudTts] = useState(true);
  const [ttsProvider, setTtsProvider] = useState<"azure" | "google">("azure");
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  const { data: dashboard } = useQuery<StudentDashboardData>({
    queryKey: ["/api/my/dashboard"],
    enabled: isStudent,
  });

  const contextText = useMemo(() => {
    if (!dashboard) return "";
    const studentName = `${dashboard.student.firstName} ${dashboard.student.lastName}`;
    const todayKey = new Date().toISOString().split("T")[0];
    const attendance = dashboard.attendanceHistory || [];
    const todaySessions = attendance.filter((a) => a.date && a.date.startsWith(todayKey));
    const todayLines =
      todaySessions.length > 0
        ? todaySessions.map((s) => `- ${s.trainingName} | ${s.levelName} | ${s.sessionTitle} | statut ${s.status}`).join("\n")
        : "- aucune seance datee aujourd'hui";
    const totalAbsences = dashboard.formations.reduce((acc, f) => acc + (f.absentCount || 0), 0);
    const formations = dashboard.formations.map((f) => {
      const progress = f.totalSessions > 0 ? Math.round((f.attendedSessions / f.totalSessions) * 100) : f.progress || 0;
      return `- ${f.training.name}: niveau ${f.currentLevel}, progression ${progress}%, absences ${f.absentCount}, seances ${f.attendedSessions}/${f.totalSessions}`;
    });
    return [
      `Eleve: ${studentName}`,
      `Total absences: ${totalAbsences}`,
      `Formations:\n${formations.join("\n")}`,
      `Seances aujourd'hui:\n${todayLines}`,
    ].join("\n");
  }, [dashboard]);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const rec = new SpeechRecognition();
    rec.lang = language === "ar-TN" ? "ar-SA" : language;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    setPhase("listening");
    rec.onresult = (event: any) => {
      const result = event.results?.[0]?.[0];
      const text = result?.transcript || "";
      const detected = result?.lang || rec.lang;
      if (detected?.startsWith("ar")) {
        setLanguage("ar-SA");
      } else if (detected?.startsWith("fr")) {
        setLanguage("fr-FR");
      }
      if (text) setInput((prev) => (prev ? `${prev} ${text}` : text));
    };
    rec.onend = () => {
      setListening(false);
      if (phase === "listening") setPhase("thinking");
      if (input.trim()) {
        sendMessage();
      } else {
        setPhase("idle");
      }
    };
    rec.start();
    recognitionRef.current = rec;
    setListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop?.();
    setListening(false);
    setPhase("idle");
  };

  const ensureVoices = () =>
    new Promise<void>((resolve) => {
      if (!("speechSynthesis" in window)) return resolve();
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) return resolve();
      const handler = () => {
        window.speechSynthesis.removeEventListener("voiceschanged", handler);
        resolve();
      };
      window.speechSynthesis.addEventListener("voiceschanged", handler);
      setTimeout(() => {
        window.speechSynthesis.removeEventListener("voiceschanged", handler);
        resolve();
      }, 1500);
    });

  const playSpeech = async (text: string) => {
    const lang = language === "ar-TN" ? "ar-SA" : language;
    const forceCloud = lang.startsWith("ar");
    if (cloudTts || forceCloud) {
      try {
        const ttsRes = await apiRequest("POST", "/api/speech/tts", {
          provider: ttsProvider,
          text,
          language: lang,
        });
        const tts = await ttsRes.json();
        if (tts?.audioBase64) {
          const audio = new Audio(`data:${tts.contentType || "audio/wav"};base64,${tts.audioBase64}`);
          audioRef.current = audio;
          setPhase("speaking");
          audio.onended = () => setPhase("idle");
          await audio.play();
          return;
        }
      } catch {
        if (!forceCloud) setCloudTts(false);
      }
    }
    if ("speechSynthesis" in window) {
      await ensureVoices();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = lang;
      const voices = window.speechSynthesis.getVoices();
      const match = voices.find((v) =>
        utter.lang.startsWith("ar")
          ? v.lang.startsWith("ar")
          : utter.lang.startsWith("fr")
          ? v.lang.startsWith("fr")
          : false
      );
      if (match) utter.voice = match;
      window.speechSynthesis.cancel();
      setPhase("speaking");
      utter.onend = () => setPhase("idle");
      window.speechSynthesis.speak(utter);
    }
  };

  const detectLanguageFromText = (text: string) => {
    const hasArabic = /[\u0600-\u06FF]/.test(text);
    if (hasArabic) return "ar-SA";
    return "fr-FR";
  };

  const detectIntent = (text: string) => {
    const t = text.toLowerCase();
    const hasArabic = /[\u0600-\u06FF]/.test(text);
    if (/jour d'aujourd'hui|quel jour|what day/.test(t) || /\u0634\u0646\u0648 \u0646\u0647\u0627\u0631 \u0627\u0644\u064a\u0648\u0645|\u0646\u0647\u0627\u0631 \u0627\u0644\u064a\u0648\u0645/.test(text)) return "day";
    if (/heure|time/.test(t) || /\u0642\u062f\u0627\u0634 \u0627\u0644\u0648\u0642\u062a|\u0634\u0646\u0648 \u0627\u0644\u0648\u0642\u062a|\u0627\u0644\u0633\u0627\u0639\u0629/.test(text)) return "time";
    if (/mon nom|mon prenom|mon nom complet/.test(t) || /\u0627\u0633\u0645\u064a|\u0634\u0646\u064a\u0629 \u0627\u0633\u0645\u064a|\u0634\u0646\u064a \u0647\u064a \u0627\u0633\u0645\u064a/.test(text)) return "name";
    if (/derniere formation|derni\u00e8re formation/.test(t) || /\u0627\u062e\u0631 \u0641\u0648\u0631\u0645\u0627\u0633\u064a\u0648\u0646|\u0622\u062e\u0631 \u0641\u0648\u0631\u0645\u0627\u0633\u064a\u0648\u0646/.test(text)) return "lastFormation";
    if (/combien.*formation|nombre.*formations|mes formations/.test(t) || /\u0642\u062f\u0627\u0634 \u0645\u0646 \u0641\u0631\u0645\u0627\u0633\u064a\u0648\u0646|\u0642\u062f\u0627\u0634 \u0641\u0648\u0631\u0645\u0627\u0633\u064a\u0648\u0646|\u0642\u062f\u0627\u0634 \u062a\u0643\u0648\u064a\u0646/.test(text)) return "formationsCount";
    if (/absences|absent/.test(t) || /\u0642\u062f\u0627\u0634 \u0639\u0646\u062f\u064a \u0645\u0646 \u063a\u064a\u0627\u0628|\u063a\u064a\u0627\u0628\u0627\u062a/.test(text)) return "absencesCount";
    if (/progress|progression/.test(t) || /\u0628\u0631\u0648\u062c\u0631\u064a\u0632|\u062a\u0642\u062f\u0645/.test(text)) return "progressOpinion";
    if (/niveau actuel|mon niveau/.test(t) || /\u0627\u0644\u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u062d\u0627\u0644\u064a|\u0645\u0633\u062a\u0648\u0627\u064a/.test(text)) return "currentLevel";
    if (/prochaine formation|formation suivante/.test(t) || /\u0627\u0644\u0641\u0631\u0645\u0627\u0633\u064a\u0648\u0646 \u0627\u0644\u0644\u064a \u0628\u0639\u062f\u0647\u0627|\u0627\u0644\u0641\u0631\u0645\u0627\u0633\u064a\u0648\u0646 \u0627\u0644\u062c\u0627\u064a\u0629/.test(text)) return "nextFormation";
    if (hasArabic && /\u0627\u0644\u064a\u0648\u0645|\u062a\u0648\u0627|\u0636\u0648\u064a\u0643\u0627/.test(text)) return "todaySessions";
    if (!hasArabic && /aujourd|today/.test(t)) return "todaySessions";
    return "profile";
  };

  const detectAction = (text: string) => {
    const t = text.toLowerCase();
    if (/ouvrir.*formation|open.*training/.test(t) || /\u0627\u0641\u062a\u062d \u0641\u0648\u0631\u0645\u0627\u0633\u064a\u0648\u0646/.test(text)) return "navTrainings";
    if (/historique|attendance/.test(t) || /\u0627\u0641\u062a\u062d \u0627\u0644\u062d\u0636\u0648\u0631|\u0627\u0644\u063a\u064a\u0627\u0628/.test(text)) return "navAttendance";
    if (/certificat|certificate/.test(t) || /\u0627\u0641\u062a\u062d \u0627\u0644\u0634\u0647\u0627\u062f\u0627\u062a/.test(text)) return "navCertificates";
    if (/parametre|settings/.test(t) || /\u0627\u0641\u062a\u062d \u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a/.test(text)) return "navSettings";
    if (/dark|sombre/.test(t) || /\u062f\u0627\u0631\u0643|\u0627\u0633\u0648\u062f/.test(text)) return "darkTheme";
    if (/download.*certificate|telecharger.*certificate/.test(t) || /\u062a\u0646\u0632\u064a\u0644 \u0627\u062e\u0631 \u0634\u0647\u0627\u062f\u0629|\u062d\u0645\u0651\u0644 \u0627\u0644\u0634\u0647\u0627\u062f\u0629/.test(text)) return "downloadLastCertificate";
    if (/email.*certificate|envoyer.*certificate/.test(t) || /\u0627\u0628\u0639\u062b \u0627\u0644\u0634\u0647\u0627\u062f\u0629 \u0628\u0627\u0644\u0627\u064a\u0645\u064a\u0644|\u0627\u0628\u0639\u062b\u0647\u0627 \u0644\u064a \u0628\u0627\u0644\u0627\u064a\u0645\u064a\u0644/.test(text)) return "emailLastCertificate";
    return null;
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    if (!isStudent || !dashboard) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            language.startsWith("ar")
              ? "ما نجمش نوصل لملفك. لازم تدخل بحساب طالب."
              : "Je n'ai pas acces a votre profil. Connectez-vous en tant qu'etudiant.",
        },
      ]);
      return;
    }
    const action = detectAction(input.trim());
    const isArabicInput = /[\u0600-\u06FF]/.test(input);
    if (action === "navTrainings") {
      setLocation("/my/trainings");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: isArabicInput ? "\u0641\u062a\u062d\u062a \u0635\u0641\u062d\u0629 \u0627\u0644\u0641\u0648\u0631\u0645\u0627\u0633\u064a\u0648\u0646." : "Ouverture de vos formations." },
      ]);
      return;
    }
    if (action === "navAttendance") {
      setLocation("/my/attendance");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: isArabicInput ? "\u0641\u062a\u062d\u062a \u0635\u0641\u062d\u0629 \u0627\u0644\u062d\u0636\u0648\u0631." : "Ouverture de l'historique des presences." },
      ]);
      return;
    }
    if (action === "navCertificates") {
      setLocation("/my/certificates");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: isArabicInput ? "\u0641\u062a\u062d\u062a \u0635\u0641\u062d\u0629 \u0627\u0644\u0634\u0647\u0627\u062f\u0627\u062a." : "Ouverture de vos certificats." },
      ]);
      return;
    }
    if (action === "navSettings") {
      setLocation("/settings");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: isArabicInput ? "\u0641\u062a\u062d\u062a \u0635\u0641\u062d\u0629 \u0627\u0644\u0627\u0639\u062f\u0627\u062f\u0627\u062a." : "Ouverture des parametres." },
      ]);
      return;
    }
    if (action === "darkTheme") {
      if (theme !== "dark") toggleTheme();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: isArabicInput ? "\u0641\u0639\u0644\u062a \u0627\u0644\u062b\u064a\u0645 \u0627\u0644\u063a\u0627\u0645\u0642." : "Theme sombre active." },
      ]);
      return;
    }
    if (action === "downloadLastCertificate") {
      const last = dashboard.certificates?.[dashboard.certificates.length - 1];
      if (!last) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: isArabicInput ? "\u0645\u0627 \u062b\u0645\u0627\u0634 \u0634\u0647\u0627\u062f\u0627\u062a \u0645\u062a\u0627\u062d\u0629." : "Aucun certificat disponible." },
        ]);
        return;
      }
      const studentName = `${dashboard.student.firstName} ${dashboard.student.lastName}`;
      const html = `
        <div style="font-family:Arial,sans-serif;padding:24px">
          <h2>Certificate</h2>
          <p>Student: ${studentName}</p>
          <p>Training: ${last.trainingName}</p>
          <p>Certificate number: ${last.certificateNumber}</p>
          <p>Issued at: ${last.issuedAt}</p>
        </div>
      `;
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `certificate-${last.certificateNumber}.html`;
      a.click();
      URL.revokeObjectURL(url);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: isArabicInput ? "\u062a\u0645 \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0634\u0647\u0627\u062f\u0629." : "Certificat telecharge." },
      ]);
      return;
    }
    if (action === "emailLastCertificate") {
      const last = dashboard.certificates?.[dashboard.certificates.length - 1];
      if (!last) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: isArabicInput ? "\u0645\u0627 \u062b\u0645\u0627\u0634 \u0634\u0647\u0627\u062f\u0627\u062a \u0645\u062a\u0627\u062d\u0629." : "Aucun certificat disponible." },
        ]);
        return;
      }
      await apiRequest("POST", "/api/my/certificates/last/email", {});
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: isArabicInput ? "\u0628\u0639\u062b\u062a \u0627\u0644\u0634\u0647\u0627\u062f\u0629 \u0628\u0627\u0644\u0627\u064a\u0645\u064a\u0644." : "Certificat envoye par email." },
      ]);
      return;
    }
    const detectedLang = detectLanguageFromText(input);
    setLanguage(detectedLang as "fr-FR" | "ar-SA" | "ar-TN");
    const nextMessages = [...messages, { role: "user", content: input.trim() }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);
    setPhase("thinking");
    try {
      const res = await apiRequest("POST", "/api/ai/chat", {
        messages: nextMessages,
        context: contextText,
        language: detectedLang,
        profile: dashboard || null,
        intent: detectIntent(input.trim()),
      });
      const data = await res.json();
      const reply = data.reply || "...";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      if (autoSpeak) {
        await playSpeech(reply);
      }
    } catch (err: any) {
      const msg = typeof err?.message === "string" ? err.message : "Erreur assistant IA";
      setError(msg);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Désolé, je n'ai pas pu répondre. Vérifiez la configuration (GROQ_API_KEY)." },
      ]);
    } finally {
      setLoading(false);
      if (listening) {
        setTimeout(() => {
          startListening();
        }, 300);
      }
    }
  };

  return (
    <>
      {!open && (
        <button
          className="fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-full bg-blue-600 text-white px-4 py-2 shadow-lg hover:bg-blue-700"
          onClick={() => setOpen(true)}
          data-testid="button-ai-assistant"
        >
          <MessageSquare className="h-4 w-4" />
          Assistant
        </button>
      )}

      {open && (
        <div className="fixed right-4 bottom-4 z-50 w-[360px] max-h-[80vh] rounded-2xl border bg-background shadow-2xl flex flex-col">
          <div className="flex items-center justify-between p-3 border-b">
            <div className="flex items-center gap-2 font-semibold">
              <Sparkles className="h-4 w-4" />
              Assistant IA
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={listening ? "default" : "outline"}
                size="icon"
                onClick={listening ? stopListening : startListening}
                data-testid="button-mic"
              >
                <Mic className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Fermer">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="px-3 pt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${phase === "listening" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100"}`}>
                <span className={`h-2 w-2 rounded-full ${phase === "listening" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                {phase === "listening" ? "En écoute" : phase === "thinking" ? "Réflexion" : phase === "speaking" ? "Parle" : "Prêt"}
              </span>
              {listening && <span className="text-emerald-600">Micro actif (réponse automatique)</span>}
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 pt-3">
            <Badge variant={language === "fr-FR" ? "default" : "outline"} className="cursor-pointer" onClick={() => setLanguage("fr-FR")}>
              FR
            </Badge>
            <Badge variant={language === "ar-SA" ? "default" : "outline"} className="cursor-pointer" onClick={() => setLanguage("ar-SA")}>
              AR
            </Badge>
            <Badge variant={language === "ar-TN" ? "default" : "outline"} className="cursor-pointer" onClick={() => setLanguage("ar-TN")}>
              Derja (TN)
            </Badge>
            <span className="text-xs text-muted-foreground ml-auto">
              Micro: {language === "ar-TN" ? "ar-SA" : language}
            </span>
          </div>

          <div className="px-3 pb-3 pt-2">
            <div className="border rounded-lg p-3 h-[320px] overflow-auto bg-muted/20">
          {messages.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Posez une question sur vos formations, votre niveau, vos absences, ou votre progression.
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((m, idx) => (
                <div key={idx} className={`text-sm ${m.role === "user" ? "text-right" : "text-left"}`}>
                  <div className={`inline-block rounded-lg px-3 py-2 ${m.role === "user" ? "bg-blue-600 text-white" : "bg-white border"}`}>
                    {m.content}
                  </div>
                  {m.role === "assistant" && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      <button className="underline" onClick={() => playSpeech(m.content)}>
                        Lire
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="text-xs text-muted-foreground">L'assistant écrit...</div>
                  )}
                </div>
              )}
            </div>
            {error && (
              <div className="mt-2 text-xs text-red-600">
                {error}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 p-3 border-t">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={autoSpeak}
                onChange={(e) => setAutoSpeak(e.target.checked)}
              />
              Voix auto
            </label>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={cloudTts}
                onChange={(e) => setCloudTts(e.target.checked)}
              />
              Voix cloud
            </label>
            {cloudTts && (
              <select
                className="text-xs border rounded px-2 py-1 bg-white"
                value={ttsProvider}
                onChange={(e) => setTtsProvider(e.target.value as "azure" | "google")}
              >
                <option value="azure">Azure</option>
                <option value="google">Google</option>
              </select>
            )}
            <Input
              placeholder="Ecrivez votre question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
            />
            <Button onClick={sendMessage} disabled={loading} data-testid="button-send">
              <Send className="h-4 w-4 mr-1.5" />
              Envoyer
            </Button>
          </div>
        </div>
      )}
    </>
  );
}


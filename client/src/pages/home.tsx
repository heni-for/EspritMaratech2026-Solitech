import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import {
  GraduationCap,
  Award,
  Users,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Globe,
  Star,
  ArrowUpRight,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const quickStats = [
  { label: "Cours en ligne", value: "120+" },
  { label: "Eleves actifs", value: "16 500+" },
  { label: "Formateurs", value: "320+" },
  { label: "Taux reussite", value: "97%" },
];

const popularCourses = [
  { title: "Developpement Web", domain: "Sciences et technologies", tag: "Popular", level: "Niveau 2", price: "Gratuit" },
  { title: "Data & IA", domain: "Sciences et technologies", tag: "Nouveau", level: "Niveau 3", price: "Premium" },
  { title: "Design Graphique", domain: "Arts/Culture", tag: "Top", level: "Niveau 2", price: "Gratuit" },
  { title: "Cybersecurite", domain: "Sciences et technologies", tag: "Hot", level: "Niveau 1", price: "Gratuit" },
];

function AnimatedStat({ value, label }: { value: string; label: string }) {
  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      let current = 0;
      const increment = Math.ceil(numValue / 30);
      const interval = setInterval(() => {
        current += increment;
        if (current >= numValue) {
          setDisplayValue(value);
          clearInterval(interval);
        } else {
          setDisplayValue(current.toString());
        }
      }, 30);
      return () => clearInterval(interval);
    }
  }, [value]);

  return (
    <div className="space-y-1 animate-fade-in">
      <div className="text-2xl font-bold text-slate-900">{displayValue}</div>
      <div>{label}</div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-900"
      style={{ fontFamily: '"Plus Jakarta Sans", "Segoe UI", sans-serif' }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap');
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(15, 23, 42, 0.1);
          }
          50% {
            box-shadow: 0 0 30px rgba(2, 132, 199, 0.2);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes gradient-shift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }

        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }

        .animate-slide-in-right {
          animation: slideInRight 0.6s ease-out forwards;
        }

        .animate-slide-in-left {
          animation: slideInLeft 0.6s ease-out forwards;
        }

        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient-shift 3s ease infinite;
        }

        .smooth-transition {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .nav-hover {
          position: relative;
        }

        .nav-hover::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 2px;
          background: linear-gradient(to right, #0284c7, #06b6d4);
          transition: width 0.3s ease;
        }

        .nav-hover:hover::after {
          width: 100%;
        }

        .card-hover {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .card-hover:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(2, 132, 199, 0.15);
        }

        .btn-hover {
          position: relative;
          overflow: hidden;
        }

        .btn-hover::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.2);
          transition: left 0.5s ease;
        }

        .btn-hover:hover::before {
          left: 100%;
        }

        .stat-card {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .stat-card:hover {
          transform: scale(1.05);
        }

        .gradient-text {
          background: linear-gradient(135deg, #0284c7 0%, #06b6d4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .backdrop-blur-sm {
          backdrop-filter: blur(10px);
        }

        .shadow-glow {
          box-shadow: 0 0 30px rgba(2, 132, 199, 0.2), 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        /* Stagger animations */
        .stagger-1 { animation-delay: 0.1s; }
        .stagger-2 { animation-delay: 0.2s; }
        .stagger-3 { animation-delay: 0.3s; }
        .stagger-4 { animation-delay: 0.4s; }
      `}</style>

      <header className="sticky top-0 z-50 border-b border-slate-200/30 bg-white/80 backdrop-blur-md smooth-transition">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3 smooth-transition hover:scale-105">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600/20 to-cyan-600/20 smooth-transition hover:shadow-glow">
              <img src="/logocertif.png" alt="ASTBA Logo" className="h-7 w-7 object-contain animate-float" />
            </div>
            <div>
              <div className="text-lg font-semibold" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                ASTBA EDU
              </div>
              <div className="text-xs text-slate-400">Plateforme de formation</div>
            </div>
          </div>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a className="nav-hover smooth-transition" href="#home">Accueil</a>
            <a className="nav-hover smooth-transition" href="#courses">Cours</a>
            <a className="nav-hover smooth-transition" href="#features">Features</a>
            <a className="nav-hover smooth-transition" href="#about">A propos</a>
            <a className="nav-hover smooth-transition" href="#contact">Contact</a>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login">
              <Button className="gap-2 btn-hover rounded-full bg-gradient-to-r from-sky-600 to-cyan-600 px-5 text-white hover:shadow-lg">
                Se connecter
                <ArrowRight className="h-4 w-4 smooth-transition group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section id="home" className="relative overflow-hidden">
        <div className="absolute -top-40 right-0 h-96 w-96 rounded-full bg-sky-200/30 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-amber-200/30 blur-3xl animate-pulse" />
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-4 py-16 md:grid-cols-[1.1fr_0.9fr] md:py-24">
          <div className="space-y-6">
            <div className="animate-fade-in-up inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 smooth-transition hover:bg-sky-100 hover:shadow-md">
              <Sparkles className="h-4 w-4 animate-spin" style={{ animationDuration: '3s' }} />
              Formation en ligne nouvelle generation
            </div>
            <h1
              className="animate-fade-in-up stagger-1 text-4xl font-extrabold leading-tight md:text-5xl lg:text-6xl"
              style={{ fontFamily: '"Space Grotesk", sans-serif' }}
            >
              Online Education
              <span className="block bg-gradient-to-r from-sky-600 to-cyan-500 bg-clip-text text-transparent">Feel like real classroom</span>
            </h1>
            <p className="animate-fade-in-up stagger-2 text-base text-slate-600 md:text-lg leading-relaxed">
              Centralisez les formations, presences, niveaux et certifications sur une
              plateforme moderne et intuitive pour les eleves, formateurs et administrateurs.
            </p>
            <div className="animate-fade-in-up stagger-3 flex flex-wrap items-center gap-3">
              <Link href="/login">
                <Button className="gap-2 btn-hover rounded-full bg-gradient-to-r from-sky-600 to-cyan-600 px-6 py-6 text-white hover:shadow-lg">
                  Commencer maintenant
                  <ArrowRight className="h-4 w-4 smooth-transition" />
                </Button>
              </Link>
              <Button variant="outline" className="rounded-full border-slate-300 px-6 py-6 smooth-transition hover:border-sky-400 hover:bg-sky-50">
                Voir nos cours
              </Button>
            </div>
            <div className="animate-fade-in-up stagger-4 flex flex-wrap items-center gap-6 text-sm text-slate-600">
              <span className="inline-flex items-center gap-2 smooth-transition hover:text-slate-900">
                <CheckCircle2 className="h-4 w-4 text-sky-600" />
                Certificats verifies
              </span>
              <span className="inline-flex items-center gap-2 smooth-transition hover:text-slate-900">
                <Globe className="h-4 w-4 text-sky-600" />
                Accessible partout
              </span>
            </div>
          </div>

          <div className="relative animate-slide-in-right">
            <div className="absolute right-8 top-0 flex items-center gap-2 rounded-2xl bg-white/90 backdrop-blur px-4 py-2 text-xs font-semibold text-slate-700 shadow-md smooth-transition hover:shadow-lg animate-fade-in-up">
              <Star className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
              7500+ eleves actifs
            </div>
            <div className="absolute bottom-4 left-4 rounded-2xl bg-white/90 backdrop-blur px-4 py-3 text-xs font-semibold text-slate-700 shadow-md smooth-transition hover:shadow-lg animate-fade-in-up stagger-2">
              16500+ heures d'apprentissage
            </div>
            <div className="mx-auto flex h-[420px] w-[320px] items-center justify-center rounded-[180px] bg-gradient-to-br from-sky-100 to-sky-300 shadow-2xl animate-float">
              <div className="flex h-[360px] w-[260px] flex-col items-center justify-center rounded-[160px] bg-white shadow-xl smooth-transition hover:shadow-2xl">
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-sky-500 smooth-transition hover:scale-110">
                  <img src="/logocertif.png" alt="ASTBA" className="h-12 w-12" />
                </div>
                <div className="mt-6 text-center">
                  <div className="text-lg font-semibold" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                    Elevation
                  </div>
                  <div className="text-xs text-slate-500">Programme ASTBA</div>
                </div>
                <div className="mt-6 grid w-full grid-cols-2 gap-4 px-6 text-center text-xs">
                  <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 py-3 smooth-transition hover:shadow-md">
                    <div className="text-base font-semibold text-slate-900">12</div>
                    Modules
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 py-3 smooth-transition hover:shadow-md">
                    <div className="text-base font-semibold text-slate-900">4</div>
                    Niveaux
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200/50 bg-white/50 backdrop-blur">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-6 px-4 py-10 text-center text-sm text-slate-600 md:grid-cols-4">
          {quickStats.map((stat, idx) => (
            <div key={stat.label} className={`space-y-1 animate-fade-in-up stagger-${idx + 1} stat-card`}>
              <AnimatedStat value={stat.value} label={stat.label} />
            </div>
          ))}
        </div>
      </section>

      <section id="about" className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[0.9fr_1.1fr]">
          <div className="relative animate-slide-in-left">
            <div className="absolute -left-6 top-6 h-24 w-24 rounded-3xl border border-slate-200 bg-white smooth-transition hover:scale-110" />
            <div className="absolute -bottom-6 right-10 h-20 w-20 rounded-full border border-slate-200 bg-white smooth-transition hover:scale-110" />
            <div className="flex items-center justify-center rounded-3xl bg-gradient-to-br from-slate-100 to-slate-50 p-6 smooth-transition hover:shadow-lg">
              <div className="grid w-full grid-cols-2 gap-4">
                <div className="card-hover h-40 rounded-2xl bg-white p-4 shadow-sm">
                  <div className="text-xs text-slate-500">Cours en ligne</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">120+</div>
                </div>
                <div className="card-hover h-40 rounded-2xl bg-white p-4 shadow-sm">
                  <div className="text-xs text-slate-500">Sessions actives</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">48</div>
                </div>
                <div className="card-hover col-span-2 h-32 rounded-2xl bg-gradient-to-br from-sky-600 to-cyan-600 p-4 text-white">
                  <div className="text-xs text-sky-100">Accompagnement</div>
                  <div className="mt-2 text-xl font-semibold">Support & feedback continu</div>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4 animate-slide-in-right">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 smooth-transition hover:bg-amber-100 hover:shadow-md">
              <BookOpen className="h-4 w-4" />
              Learn, track, certify
            </div>
            <h2
              className="text-3xl font-bold leading-tight"
              style={{ fontFamily: '"Space Grotesk", sans-serif' }}
            >
              Dive into our Online Courses
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              ASTBA EDU combine suivi de presence, progression par niveau et certificats pour
              booster la reussite. Les eleves accedent aux ressources et les formateurs gardent
              une vue claire sur l'avancement.
            </p>
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-center gap-2 smooth-transition hover:translate-x-1 hover:text-slate-900">
                <CheckCircle2 className="h-4 w-4 text-sky-600 flex-shrink-0" />
                Tracking automatique des presences
              </div>
              <div className="flex items-center gap-2 smooth-transition hover:translate-x-1 hover:text-slate-900">
                <CheckCircle2 className="h-4 w-4 text-sky-600 flex-shrink-0" />
                Validation des niveaux et certificats
              </div>
              <div className="flex items-center gap-2 smooth-transition hover:translate-x-1 hover:text-slate-900">
                <CheckCircle2 className="h-4 w-4 text-sky-600 flex-shrink-0" />
                Tableaux de bord personnalisables
              </div>
            </div>
            <Button className="btn-hover mt-2 rounded-full bg-gradient-to-r from-slate-900 to-slate-800 px-6 text-white hover:shadow-lg">
              En savoir plus
            </Button>
          </div>
        </div>
      </section>

      <section id="courses" className="bg-gradient-to-b from-slate-100/50 to-white py-16">
        <div className="mx-auto w-full max-w-6xl px-4">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div className="animate-fade-in-up">
              <div className="text-sm font-semibold text-sky-600">Popular courses</div>
              <h2 className="text-3xl font-bold" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                Our Popular Online Courses
              </h2>
            </div>
            <Button variant="outline" className="btn-hover rounded-full border-slate-300 smooth-transition hover:border-sky-400 hover:bg-sky-50">
              Tout voir
              <ArrowUpRight className="ml-2 h-4 w-4 smooth-transition hover:translate-y-0.5" />
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {popularCourses.map((course, idx) => (
              <Card key={course.title} className={`card-hover border-0 shadow-sm bg-white animate-fade-in-up stagger-${(idx % 4) + 1}`}>
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 smooth-transition hover:bg-sky-100">
                      {course.tag}
                    </span>
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      course.domain === "Sciences et technologies" 
                        ? "bg-emerald-50 text-emerald-700" 
                        : "bg-purple-50 text-purple-700"
                    }`}>
                      {course.domain}
                    </span>
                  </div>
                  <div className="card-hover h-28 rounded-2xl bg-gradient-to-br from-sky-200 via-sky-100 to-amber-100 smooth-transition hover:from-sky-300 hover:to-amber-200" />
                  <div className="text-base font-semibold text-slate-900">{course.title}</div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="rounded-full bg-slate-100 px-2 py-1">{course.price}</span>
                    <span>{course.level}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="mb-8 animate-fade-in-up text-center">
          <h2 className="text-3xl font-bold" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
            Tout ce qu'il faut pour reussir
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          {[
            {
              title: "Gestion eleves",
              icon: Users,
              color: "bg-sky-50 text-sky-700",
              text: "Suivi des profils, presences et progression par niveau.",
            },
            {
              title: "Formations",
              icon: BookOpen,
              color: "bg-amber-50 text-amber-700",
              text: "Structurez vos formations en niveaux et sessions.",
            },
            {
              title: "Certifications",
              icon: Award,
              color: "bg-emerald-50 text-emerald-700",
              text: "Generation automatique des certificats valides.",
            },
            {
              title: "Equipe",
              icon: GraduationCap,
              color: "bg-slate-100 text-slate-700",
              text: "Coordination simple entre admin, formateurs et eleves.",
            },
          ].map((item, idx) => (
            <div key={item.title} className={`card-hover rounded-3xl border border-slate-200 bg-white p-6 shadow-sm animate-fade-in-up stagger-${(idx % 4) + 1}`}>
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${item.color} smooth-transition`}>
                <item.icon className="h-5 w-5" />
              </div>
              <div className="text-lg font-semibold text-slate-900">{item.title}</div>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="contact" className="mx-auto w-full max-w-6xl px-4 pb-20">
        <div className="animate-fade-in-up rounded-3xl border border-slate-200 bg-gradient-to-br from-sky-50 to-white p-8 shadow-sm smooth-transition hover:shadow-lg hover:border-sky-300 md:p-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <div>
                <div className="text-sm font-semibold text-sky-600 mb-2">Ready to start?</div>
                <h2 className="text-3xl font-bold leading-tight" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                  Creer votre espace de formation
                </h2>
              </div>
              <p className="text-base text-slate-600 leading-relaxed">
                Rejoignez ASTBA EDU pour centraliser vos formations, suivre les presences
                et offrir des certificats verifies a vos eleves.
              </p>

              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="flex items-start gap-4 card-hover p-4 rounded-xl smooth-transition hover:bg-white">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 text-sky-600 flex-shrink-0">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Telephone</div>
                    <a href="tel:21928627" className="text-sm text-slate-600 hover:text-sky-600 smooth-transition">
                      +216 21 928 627
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 card-hover p-4 rounded-xl smooth-transition hover:bg-white">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 flex-shrink-0">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Email</div>
                    <a href="mailto:assocoation.sc.tech.ba@gmail.com" className="text-sm text-slate-600 hover:text-sky-600 smooth-transition break-all">
                      assocoation.sc.tech.ba@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 card-hover p-4 rounded-xl smooth-transition hover:bg-white">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 flex-shrink-0">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Adresse</div>
                    <p className="text-sm text-slate-600">
                      2 Rue jalata<br />
                      Ben Arous
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center gap-3">
              <Link href="/login">
                <Button className="btn-hover w-full rounded-full bg-gradient-to-r from-sky-600 to-cyan-600 text-white hover:shadow-lg">
                  Se connecter
                </Button>
              </Link>
              <a href="mailto:assocoation.sc.tech.ba@gmail.com">
                <Button variant="outline" className="btn-hover w-full rounded-full border-slate-300 smooth-transition hover:border-sky-400 hover:bg-sky-50">
                  Nous contacter
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200/50 bg-white/50 backdrop-blur smooth-transition">
        <div className="mx-auto w-full max-w-6xl px-4 py-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 mb-6">
            <div>
              <div className="text-sm font-semibold text-slate-900 mb-2">A Propos</div>
              <p className="text-xs text-slate-500">
                ASTBA EDU - Plateforme de formation moderne pour gérer vos formations, presences et certifications.
              </p>
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900 mb-2">Contact</div>
              <div className="text-xs text-slate-500 space-y-1">
                <div>📧 assocoation.sc.tech.ba@gmail.com</div>
                <div>📱 +216 21 928 627</div>
                <div>📍 2 Rue jalata, Ben Arous</div>
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900 mb-2">Liens Rapides</div>
              <div className="text-xs text-slate-500 space-y-1">
                <a href="#courses" className="hover:text-sky-600 block smooth-transition">Nos Cours</a>
                <a href="#features" className="hover:text-sky-600 block smooth-transition">Features</a>
                <a href="#about" className="hover:text-sky-600 block smooth-transition">A Propos</a>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-200/50 pt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 hover:text-slate-700">
            <span>© {new Date().getFullYear()} ASTBA EDU. Tous droits reserves.</span>
            <span>2 Rue jalata, Ben Arous - Tunisie</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

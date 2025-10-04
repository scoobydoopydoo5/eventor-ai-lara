import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ThemeSelector } from "@/components/ThemeSelector";
import { AuthButton } from "@/components/AuthButton";
import { WelcomeTour } from "@/components/WelcomeTour";
import {
  FiStar as Sparkles,
  FiCalendar as Calendar,
  FiUsers as Users,
  FiTrendingUp as TrendingUp,
  FiClock as Clock,
  FiDollarSign,
  FiBook,
  FiMenu,
  FiX,
  FiUser,
} from "react-icons/fi";
import { Planet, IceCream, Cat } from "react-kawaii";
import { useKawaiiTheme } from "@/hooks/useKawaiiTheme";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import academyxLogo from "@/assets/academyx-logo.png";
import { Step } from "react-joyride";
import { ShootingStars } from "@/components/ui/shooting-stars";
import { StarsBackground } from "@/components/ui/stars-background";
import { Heart } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { MaskContainer } from "@/components/ui/svg-mask-effect";

const homepageSteps: Step[] = [
  {
    target: '[data-tour="hero"]',
    content:
      "Welcome to eventor.ai! Please use on laptop for better experience! Also Please go to /pricing from navbar then get VIP Access to get unlimited balloons for testing!.",
    disableBeacon: true,
  },

  {
    target: '[data-tour="create-event"]',
    content:
      "Click here to start planning your first event with AI assistance.",
  },
  {
    target: '[data-tour="features"]',
    content:
      "Explore our powerful features including AI planning, scheduling, and budget tracking.",
  },
  {
    target: '[data-tour="how-it-works"]',
    content: "Learn how easy it is to plan events in just three simple steps.",
  },
];

export default function Index() {
  const navigate = useNavigate();
  const { kawaiiColor } = useKawaiiTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useEffect(() => {
    const existing = localStorage.getItem("play_tictactoe_loading");
    if (existing === null) {
      localStorage.setItem("play_tictactoe_loading", "true");
    }
  }, []);

  const navigationItems = [
    { label: "Docs", icon: FiBook, onClick: () => navigate("/docs") },
    {
      label: "Pricing",
      icon: FiDollarSign,
      onClick: () => navigate("/pricing"),
    },
  ];

  const features = [
    {
      icon: <Sparkles className="h-6 w-6 text-primary" />,
      title: "AI-Powered Planning",
      description:
        "Let AI generate personalized event plans based on your preferences",
    },
    {
      icon: <Calendar className="h-6 w-6 text-primary" />,
      title: "Smart Scheduling",
      description:
        "Automatic timeline generation with weather-aware recommendations",
    },
    {
      icon: <Users className="h-6 w-6 text-primary" />,
      title: "Guest Management",
      description: "Track invitations, RSVPs, and communicate with attendees",
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-primary" />,
      title: "Budget Tracking",
      description: "Real-time budget monitoring with smart expense insights",
    },
  ];
  const { isSignedIn } = useUser();

  return (
    <div className="min-h-screen bg-background">
      <WelcomeTour steps={homepageSteps} />
      <ShootingStars className="pointer-events-none" />
      <StarsBackground className="pointer-events-none" />
      <header className="border-b border-border bg-card sticky top-0 z-50 backdrop-blur-sm bg-card/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/">
            <h1 className="hover:rotate-[5deg] hover:scale-110 transition-all text-2xl font-bold text-gradient">
              eventor.ai
            </h1>
          </Link>{" "}
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/docs")}
              className="gap-2"
            >
              <FiBook className="h-4 w-4" />
              Docs
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/pricing")}
              className="gap-2"
            >
              <FiDollarSign className="h-4 w-4" />
              Pricing
            </Button>
            {isSignedIn && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/profile")}
                data-tour="profile"
              >
                <FiUser className="h-5 w-5" />
              </Button>
            )}
            <ThemeSelector />
            <AuthButton />
          </div>
          {/* Mobile Menu */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeSelector />
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <FiMenu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <div className="flex flex-col gap-4 mt-8">
                  {navigationItems.map((item) => (
                    <Button
                      key={item.label}
                      variant="ghost"
                      onClick={() => {
                        item.onClick();
                        setMobileMenuOpen(false);
                      }}
                      className="justify-start gap-2"
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  ))}{" "}
                  {isSignedIn && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate("/profile")}
                      data-tour="profile"
                    >
                      <FiUser className="h-5 w-5" />
                    </Button>
                  )}
                  <ThemeSelector />
                  <div className="pt-4 border-t">
                    <AuthButton />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-16">
          {/* Hero Section */}
          <section
            className="text-center space-y-6 animate-fade-in"
            data-tour="hero"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              AI-Powered Event Planning
            </div>

            <h2 className="text-5xl md:text-6xl font-bold leading-tight">
              Plan Your Perfect
              <br />
              <span className="text-gradient">Event with AI</span>
            </h2>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From birthday parties to corporate events, let AI handle the
              details while you focus on what matters most.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 pt-4">
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/surveys")}
                  className="hidden sm:flex"
                >
                  Earn Balloons
                </Button>
                <Button
                  size="lg"
                  onClick={() => navigate("/dashboard")}
                  className="gap-2 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 shadow-elegant w-full sm:w-auto"
                  data-tour="create-event"
                >
                  <Sparkles className="h-5 w-5" />
                  Create Event
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/find-events")}
                  className="w-full sm:w-auto"
                >
                  Find Events
                </Button>
              </div>
            </div>
          </section>
          {/* Features Grid */}
          <section
            className="grid md:grid-cols-2 gap-6 animate-slide-up"
            data-tour="features"
          >
            {features.map((feature, idx) => (
              <Card
                key={idx}
                className="shadow-card hover:shadow-elegant transition-smooth"
              >
                <CardHeader>
                  <div className="mb-2">{feature.icon}</div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </section>
          {/* Palestine Freedom Section */}
          <section className="relative overflow-hidden rounded-3xl shadow-elegant animate-fade-in">
            {/* Full Width Image */}
            <div className="relative w-full h-[600px] md:h-[700px]">
              <img
                src={
                  "https://static.vecteezy.com/system/resources/previews/025/682/958/non_2x/jerusalem-palestinian-al-aqsa-mosque-cartoon-illustration-free-vector.jpg"
                }
                alt="Al-Aqsa Mosque - Jerusalem"
                className="transition-all hover:scale-110 absolute inset-0 w-full h-full object-cover"
              />
              {/* Overlay for better text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
            </div>

            {/* Text Content Overlay */}
            <div className="relative -mt-80 z-10 px-8 md:px-16 pb-12 md:pb-16">
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/90 backdrop-blur-sm border border-primary">
                  <Heart className="h-4 w-4 text-primary-foreground animate-pulse" />
                  <span className="text-sm font-semibold text-primary-foreground">
                    The Event We're All Waiting For
                  </span>
                </div>

                <h3 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                  <span className="text-gradient">Witnessing the End</span>
                  <br />
                  <span className="text-foreground">of Occupation</span>
                </h3>

                <div className="space-y-4 text-lg md:text-xl text-muted-foreground">
                  <p className="leading-relaxed">
                    The moment we stand together to witness the liberation of
                    our people, the end of genocide in Gaza, and the restoration
                    of justice.
                  </p>
                  <p className="leading-relaxed font-semibold text-foreground">
                    When we finally pray together in Al-Aqsa Mosque as free
                    people.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <div className="h-1 w-20 bg-gradient-to-r from-primary to-transparent rounded-full"></div>
                  <span className="text-sm text-muted-foreground italic">
                    From the river to the sea, Palestine will be free 🇵🇸
                  </span>
                </div>
              </div>
            </div>
          </section>
          {/* How It Works */}
          <section
            className="space-y-8 animate-fade-in"
            data-tour="how-it-works"
          >
            {" "}
            <MaskContainer
              revealText={
                <p className="mx-auto max-w-4xl text-center text-4xl font-bold text-slate-800 dark:text-white">
                  HOVER to see how it works!{" "}
                </p>
              }
              className="h-[40rem] rounded-md border text-white dark:text-black"
            >
              <div className="text-center space-y-2">
                <div className="flex justify-center mb-4">
                  <IceCream size={100} mood="blissful" color={kawaiiColor} />
                </div>
                <h3 className="text-3xl font-bold">How It Works</h3>
                <p className="text-muted-foreground">
                  Get your event planned in three simple steps
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    step: "1",
                    title: "Share Your Vision",
                    description:
                      "Tell us about your event, preferences, and requirements",
                  },
                  {
                    step: "2",
                    title: "AI Creates Plan",
                    description:
                      "Our AI generates a comprehensive event plan tailored to you",
                  },
                  {
                    step: "3",
                    title: "Manage & Execute",
                    description:
                      "Track tasks, budget, and guests all in one place",
                  },
                ].map((item, idx) => (
                  <Card key={idx} className="text-center shadow-card">
                    <CardContent className="pt-6 space-y-4">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 text-primary text-xl font-bold">
                        {item.step}
                      </div>
                      <h4 className="font-semibold text-lg">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </MaskContainer>
          </section>
          {/* CTA Section */}
          <section className="text-center space-y-6 py-16 animate-fade-in">
            <div className="flex justify-center mb-4">
              <Cat size={120} mood="excited" color={kawaiiColor} />
            </div>
            <h3 className="text-4xl font-bold">Ready to Get Started?</h3>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join thousands of event planners who trust eventor.ai to bring
              their visions to life.
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/create")}
              className="gap-2 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 shadow-elegant"
            >
              <Clock className="h-5 w-5" />
              Start Planning Now
            </Button>
          </section>{" "}
          <section className="py-16 overflow-hidden">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-muted-foreground/60">
                Made by <span className="text-primary">Lara</span> for:
              </h3>
            </div>
            <div className="relative">
              <div className="flex animate-[scroll_20s_linear_infinite] hover:[animation-play-state:paused]">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-12 px-12 shrink-0"
                  >
                    <img
                      src={
                        "https://www.supplychain247.com/images/logos/agility_logo_600.png"
                      }
                      alt="Agility"
                      className="h-12 object-contain opacity-60 hover:opacity-100 transition-opacity"
                    />
                    <span className="text-3xl font-bold text-muted-foreground/40">
                      ×
                    </span>
                    <img
                      src={academyxLogo}
                      alt="AcademyX"
                      className="h-12 object-contain opacity-60 hover:opacity-100 transition-opacity"
                    />
                    <span className="text-3xl font-bold text-muted-foreground/40">
                      ×
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
          {/* Sticky Lovable Button */}
          {/* Sticky Lovable Link */}
          <a
            href="https://preview--eventor-ai-lara.lovable.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex fixed bottom-4 right-4 gap-2 items-center px-4 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg shadow-lg hover:opacity-90 z-50"
          >
            <Heart className="h-5 w-5" />
          </a>
        </div>
      </main>

      <footer className="border-t border-border bg-card mt-16">
        <div className="container mx-auto px-4 py-8 text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            © 2025 eventor.ai. Powered by AI.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <p className="text-xs text-muted-foreground">
              Site made by <span className="font-semibold">Lara</span> for
            </p>
            <div className="flex items-center gap-4">
              <img
                src={academyxLogo}
                alt="AcademyX"
                className="h-8 object-contain"
              />
              <span className="text-xs text-muted-foreground">x</span>
              <img
                src={
                  "https://www.supplychain247.com/images/logos/agility_logo_600.png"
                }
                alt="AcademyX"
                className="h-12 object-contain"
              />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

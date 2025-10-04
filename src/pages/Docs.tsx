import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ThemeSelector } from "@/components/ThemeSelector";
import academyxLogo from "@/assets/academyx-logo.png";
import {
  FiArrowLeft,
  FiHome,
  FiCalendar,
  FiUsers,
  FiDollarSign,
  FiCheckSquare,
  FiClock,
  FiMapPin,
  FiMessageSquare,
  FiGift,
  FiTrendingUp,
  FiStar,
  FiAward,
  FiShare2,
  FiFileText,
  FiList,
  FiPhone,
  FiVideo,
  FiMail,
  FiBarChart2,
  FiSettings,
  FiSearch,
  FiLayers,
  FiCloud,
  FiSun,
  FiUmbrella,
  FiHeart,
  FiShoppingBag,
  FiCoffee,
  FiMusic,
  FiCamera,
  FiBook,
} from "react-icons/fi";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import carouselImage1 from "@/assets/docs-carousel-1.jpg";
import carouselImage2 from "@/assets/docs-carousel-2.jpg";
import carouselImage3 from "@/assets/docs-carousel-3.jpg";
import carouselImage5 from "@/assets/docs-carousel-5.jpg";
import carouselImage6 from "@/assets/docs-carousel-6.jpg";
import carouselImage7 from "@/assets/docs-carousel-7.jpg";
import carouselImage8 from "@/assets/docs-carousel-8.jpg";
import carouselImage9 from "@/assets/docs-carousel-9.jpg";
import carouselImage4 from "@/assets/docs-carousel-4.jpg";

export default function Docs() {
  const navigate = useNavigate();

  const carouselItems = [
    {
      image: carouselImage1,
      title: "AI-Powered Dashboard",
      description: "Manage all your events in one beautiful interface",
      link: "/dashboard",
      linkText: "Go to Dashboard",
    },
    {
      image: carouselImage1,
      title: "AI-Powered Dashboard",
      description: "Manage all your events in one beautiful interface",
      link: "/dashboard",
      linkText: "Go to Dashboard",
    },
    {
      image: carouselImage2,
      title: "Beautiful Invitations",
      description: "Create stunning AI-generated invitations",
      link: "/create",
      linkText: "Create Event",
    },
    {
      image: carouselImage3,
      title: "Guest Management",
      description: "Track RSVPs and manage check-ins effortlessly",
      link: "/find-events",
      linkText: "Find Events",
    },
    {
      image: carouselImage4,
      title: "Budget Tracking",
      description: "Keep your event finances under control",
      link: "/pricing",
      linkText: "View Pricing",
    },
    {
      image: carouselImage5,
      title: "Budget Tracking",
      description: "Keep your event finances under control",
      link: "/pricing",
      linkText: "View Pricing",
    },
    {
      image: carouselImage6,
      title: "Budget Tracking",
      description: "Keep your event finances under control",
      link: "/pricing",
      linkText: "View Pricing",
    },
    {
      image: carouselImage7,
      title: "Budget Tracking",
      description: "Keep your event finances under control",
      link: "/pricing",
      linkText: "View Pricing",
    },
    {
      image: carouselImage8,
      title: "Budget Tracking",
      description: "Keep your event finances under control",
      link: "/pricing",
      linkText: "View Pricing",
    },
    {
      image: carouselImage9,
      title: "Budget Tracking",
      description: "Keep your event finances under control",
      link: "/pricing",
      linkText: "View Pricing",
    },
  ];

  const pageCategories = [
    {
      category: "Getting Started",
      icon: <FiHome className="h-5 w-5" />,
      pages: [
        {
          name: "Home",
          path: "/",
          icon: <FiHome />,
          description: "Landing page with features and quick start guide",
        },
        {
          name: "Dashboard",
          path: "/dashboard",
          icon: <FiLayers />,
          description:
            "Your event management hub - view and manage all your events",
        },
        {
          name: "Create Event",
          path: "/create",
          icon: <FiCalendar />,
          description: "Start planning a new event with AI assistance",
        },
      ],
    },
    {
      category: "Event Planning",
      icon: <FiCalendar className="h-5 w-5" />,
      pages: [
        {
          name: "Event Planner",
          path: "/event/:eventId/plan",
          icon: <FiCheckSquare />,
          description:
            "Comprehensive planner with tasks, calendar, and timeline views",
        },
        {
          name: "Event Details",
          path: "/event/:eventId/details",
          icon: <FiFileText />,
          description: "Manage event information, description, and settings",
        },
        {
          name: "Budget",
          path: "/event/:eventId/budget",
          icon: <FiDollarSign />,
          description:
            "Track expenses, estimated vs actual costs, and budget insights",
        },
        {
          name: "Timeline",
          path: "/event/:eventId/timeline",
          icon: <FiClock />,
          description: "Visual timeline of your event schedule and milestones",
        },
        {
          name: "Full Plan",
          path: "/event/:eventId/full-plan",
          icon: <FiList />,
          description: "Complete overview of all event aspects in one place",
        },
        {
          name: "Theme",
          path: "/event/:eventId/theme",
          icon: <FiStar />,
          description:
            "Choose and customize your event theme with AI suggestions",
        },
        {
          name: "Location",
          path: "/event/:eventId/location",
          icon: <FiMapPin />,
          description: "Event venue details with interactive map",
        },
      ],
    },
    {
      category: "Guest Management",
      icon: <FiUsers className="h-5 w-5" />,
      pages: [
        {
          name: "Guests",
          path: "/event/:eventId/guests",
          icon: <FiUsers />,
          description: "View and manage guest list, RSVPs, and attendance",
        },
        {
          name: "Invitations",
          path: "/event/:eventId/invites",
          icon: <FiMail />,
          description: "Create and send beautiful invitations with AI",
        },
        {
          name: "Tickets",
          path: "/event/:eventId/manage-tickets",
          icon: <FiAward />,
          description: "Manage ticket sales, pricing, and attendee check-ins",
        },
        {
          name: "Check-In",
          path: "/check-in/:eventId/:attendeeName",
          icon: <FiCheckSquare />,
          description: "QR code-based check-in system for attendees",
        },
      ],
    },
    {
      category: "Event Features",
      icon: <FiStar className="h-5 w-5" />,
      pages: [
        {
          name: "Food & Catering",
          path: "/event/:eventId/food",
          icon: <FiCoffee />,
          description: "Menu planning, recipes, and vendor recommendations",
        },
        {
          name: "Decorations",
          path: "/event/:eventId/decor",
          icon: <FiMusic />,
          description: "Decoration ideas and DIY instructions with AI help",
        },
        {
          name: "Souvenirs",
          path: "/event/:eventId/souvenirs",
          icon: <FiGift />,
          description: "Gift ideas and souvenir suggestions for guests",
        },
        {
          name: "Speeches",
          path: "/event/:eventId/speeches",
          icon: <FiMessageSquare />,
          description: "AI-generated speech drafts and talking points",
        },
        {
          name: "FAQs",
          path: "/event/:eventId/faqs",
          icon: <FiFileText />,
          description: "Auto-generated frequently asked questions for guests",
        },
        {
          name: "Weather",
          path: "/event/:eventId/weather",
          icon: <FiSun />,
          description: "Weather forecast and backup plan recommendations",
        },
        {
          name: "Flights",
          path: "/event/:eventId/flights",
          icon: <FiCloud />,
          description: "Flight search and travel coordination for guests",
        },
        {
          name: "Sponsors",
          path: "/event/:eventId/sponsors",
          icon: <FiTrendingUp />,
          description: "Manage sponsors and generate outreach emails",
        },
        {
          name: "Memories",
          path: "/event/:eventId/memories",
          icon: <FiCamera />,
          description: "Photo gallery and memory collection from your event",
        },
      ],
    },
    {
      category: "Communication",
      icon: <FiMessageSquare className="h-5 w-5" />,
      pages: [
        {
          name: "Event Chat",
          path: "/event/:eventId/chat",
          icon: <FiMessageSquare />,
          description: "AI-powered chatbot for event planning questions",
        },
        {
          name: "Video Call",
          path: "/event/:eventId/call",
          icon: <FiVideo />,
          description: "Integrated video calling for planning meetings",
        },
        {
          name: "Blogs",
          path: "/event/:eventId/blogs",
          icon: <FiBook />,
          description: "Create and share blog posts about your event",
        },
      ],
    },
    {
      category: "Interactive Games",
      icon: <FiStar className="h-5 w-5" />,
      pages: [
        {
          name: "AI Trivia",
          path: "/event/:eventId/games/trivia/:roomCode",
          icon: <FiAward />,
          description: "AI-generated trivia games for guests",
        },
        {
          name: "Jeopardy",
          path: "/event/:eventId/games/jeopardy/:roomCode",
          icon: <FiAward />,
          description: "Custom Jeopardy-style game show",
        },
        {
          name: "Quiz Game",
          path: "/event/:eventId/games/quizizz/:roomCode",
          icon: <FiAward />,
          description: "Interactive quiz competitions",
        },
        {
          name: "Ice Breakers",
          path: "/event/:eventId/games/icebreakers/:roomCode",
          icon: <FiUsers />,
          description: "Fun ice breaker activities for guests",
        },
        {
          name: "Jokes",
          path: "/event/:eventId/games/jokes/:roomCode",
          icon: <FiStar />,
          description: "AI-generated jokes and humor",
        },
        {
          name: "Emoji Guess",
          path: "/event/:eventId/games/emoji/:roomCode",
          icon: <FiStar />,
          description: "Emoji guessing game",
        },
        {
          name: "Random Task",
          path: "/event/:eventId/games/task/:roomCode",
          icon: <FiCheckSquare />,
          description: "Random challenge generator",
        },
        {
          name: "Event Winner",
          path: "/event/:eventId/event-winner",
          icon: <FiAward />,
          description: "Random winner selector for raffles",
        },
      ],
    },
    {
      category: "Attendee Tools",
      icon: <FiUsers className="h-5 w-5" />,
      pages: [
        {
          name: "Attendee Dashboard",
          path: "/attendee/:eventId",
          icon: <FiCalendar />,
          description: "Personalized dashboard for event attendees",
        },
        {
          name: "Gift Ideas",
          path: "/attendee/:eventId/gifts",
          icon: <FiGift />,
          description: "AI-powered gift recommendations",
        },
        {
          name: "Outfit Planner",
          path: "/attendee/:eventId/outfits",
          icon: <FiShoppingBag />,
          description: "Outfit suggestions based on event theme",
        },
        {
          name: "Event Guide",
          path: "/attendee/:eventId/guide",
          icon: <FiBook />,
          description: "Complete guide for attendees",
        },
        {
          name: "Etiquette Tips",
          path: "/attendee/:eventId/etiquette",
          icon: <FiHeart />,
          description: "Event etiquette and protocol guidance",
        },
      ],
    },
    {
      category: "Other Features",
      icon: <FiSettings className="h-5 w-5" />,
      pages: [
        {
          name: "Find Events",
          path: "/find-events",
          icon: <FiSearch />,
          description: "Discover public events in your area",
        },
        {
          name: "Join by Code",
          path: "/join-by-code",
          icon: <FiShare2 />,
          description: "Join private events using access code",
        },
        {
          name: "Surveys",
          path: "/surveys",
          icon: <FiBarChart2 />,
          description: "Create and manage event surveys",
        },
        {
          name: "Profile",
          path: "/profile",
          icon: <FiUsers />,
          description: "Manage your profile and account settings",
        },
        {
          name: "Pricing",
          path: "/pricing",
          icon: <FiDollarSign />,
          description: "View pricing plans and balloon packages",
        },
      ],
    },
  ];

  const usageGuide = [
    {
      step: "1",
      title: "Create Your Event",
      description:
        'Start by clicking "Create Event" on your dashboard. Fill in basic details like event name, date, location, and budget. Our AI will use this to generate personalized recommendations.',
      tips: [
        "Be specific about your event type",
        "Set a realistic budget range",
        "Add location for weather insights",
      ],
    },
    {
      step: "2",
      title: "AI-Powered Planning",
      description:
        "Once created, eventor.ai generates a comprehensive plan including timeline, budget breakdown, vendor suggestions, and task lists. Review and customize any AI suggestions to match your vision.",
      tips: [
        "Review the AI-generated timeline",
        "Adjust budget allocations as needed",
        "Add or modify tasks in the planner",
      ],
    },
    {
      step: "3",
      title: "Manage Guests & Invites",
      description:
        "Add guests to your list, create beautiful AI-generated invitations, and track RSVPs. Set up ticketing if needed and manage check-ins on event day.",
      tips: [
        "Upload guest lists via CSV",
        "Customize invitation templates",
        "Enable QR code check-in for large events",
      ],
    },
    {
      step: "4",
      title: "Enhance Your Event",
      description:
        "Explore additional features like food planning, decorations, games, and communication tools. Use the AI chat to get instant help with any planning questions.",
      tips: [
        "Try AI-generated speeches",
        "Set up interactive games for guests",
        "Use weather forecasts for planning",
      ],
    },
    {
      step: "5",
      title: "Execute & Enjoy",
      description:
        "Track tasks as they complete, manage check-ins, and use real-time tools during your event. After the event, collect memories and share highlights.",
      tips: [
        "Monitor the timeline on event day",
        "Use video call for remote attendees",
        "Collect photos in Memories section",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <FiArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gradient">
              eventor.ai Documentation
            </h1>
          </div>
          <ThemeSelector />
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Hero Carousel */}

          <Separator className="my-8" />

          {/* Introduction */}
          <section className="text-center space-y-4 animate-fade-in">
            <Badge variant="secondary" className="mb-2">
              Complete Documentation
            </Badge>
            <h2 className="text-4xl font-bold">Welcome to eventor.ai</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Your comprehensive guide to mastering AI-powered event planning.
              Explore all features, learn best practices, and discover how to
              create unforgettable events.
            </p>
          </section>

          <Separator className="my-8" />
          <section className="animate-fade-in">
            <Carousel className="w-full max-w-5xl mx-auto">
              <CarouselContent>
                {carouselItems.map((item, index) => (
                  <CarouselItem key={index}>
                    <div className="space-y-4">
                      <div className="relative rounded-xl overflow-hidden shadow-elegant">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-[400px] md:h-[500px] object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                          <h3 className="text-2xl md:text-3xl font-bold mb-2">
                            {item.title}
                          </h3>
                          <p className="text-lg text-white/90">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-center">
                        <Button
                          onClick={() => navigate(item.link)}
                          variant="outline"
                          size="lg"
                          className="gap-2"
                        >
                          {item.linkText}
                          <FiArrowLeft className="h-4 w-4 rotate-180" />
                        </Button>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-4" />
              <CarouselNext className="right-4" />
            </Carousel>
          </section>
          {/* Quick Start Guide */}
          <section className="space-y-6 animate-slide-up">
            <div className="text-center space-y-2">
              <h3 className="text-3xl font-bold">Quick Start Guide</h3>
              <p className="text-muted-foreground">
                Get started with eventor.ai in 5 easy steps
              </p>
            </div>

            <div className="space-y-4">
              {usageGuide.map((item, idx) => (
                <Card
                  key={idx}
                  className="shadow-card hover:shadow-elegant transition-smooth animate-fade-in"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xl font-bold">
                        {item.step}
                      </div>
                      <div className="flex-1 space-y-2">
                        <CardTitle>{item.title}</CardTitle>
                        <CardDescription>{item.description}</CardDescription>
                        <div className="pt-2 space-y-1">
                          {item.tips.map((tip, tipIdx) => (
                            <div
                              key={tipIdx}
                              className="flex items-center gap-2 text-sm text-muted-foreground"
                            >
                              <FiCheckSquare className="h-4 w-4 text-primary" />
                              <span>{tip}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </section>

          <Separator className="my-8" />

          {/* All Pages by Category */}
          <section className="space-y-8">
            <div className="text-center space-y-2">
              <h3 className="text-3xl font-bold">All Features & Pages</h3>
              <p className="text-muted-foreground">
                Explore everything eventor.ai has to offer
              </p>
            </div>

            {pageCategories.map((category, catIdx) => (
              <div
                key={catIdx}
                className="space-y-4 animate-fade-in"
                style={{ animationDelay: `${catIdx * 0.05}s` }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {category.icon}
                  </div>
                  <h4 className="text-2xl font-bold">{category.category}</h4>
                  <div className="flex-1 h-px bg-border ml-4" />
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.pages.map((page, pageIdx) => {
                    const isDisabled =
                      page.path.includes(":eventId") ||
                      page.path.includes(":roomCode") ||
                      page.path.includes(":attendeeName");
                    const displayPath = isDisabled ? page.path : page.path;

                    return (
                      <Card
                        key={pageIdx}
                        className={`shadow-card hover-scale transition-smooth group ${
                          !isDisabled
                            ? "cursor-pointer hover:shadow-elegant"
                            : "opacity-75"
                        }`}
                        onClick={() => !isDisabled && navigate(page.path)}
                      >
                        <CardHeader>
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-smooth">
                              {page.icon}
                            </div>
                            <div className="flex-1 space-y-1">
                              <CardTitle className="text-base group-hover:text-primary transition-smooth">
                                {page.name}
                              </CardTitle>
                              <CardDescription className="text-xs line-clamp-2">
                                {page.description}
                              </CardDescription>
                              {isDisabled && (
                                <Badge
                                  variant="outline"
                                  className="text-xs mt-2"
                                >
                                  Requires Event ID
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>

          <Separator className="my-8" />

          {/* Key Features */}
          <section className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <h3 className="text-3xl font-bold">Key Features</h3>
              <p className="text-muted-foreground">
                What makes eventor.ai special
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  icon: <FiStar className="h-6 w-6" />,
                  title: "AI-Powered Intelligence",
                  description:
                    "From event planning to speeches, our AI assists you at every step",
                },
                {
                  icon: <FiCalendar className="h-6 w-6" />,
                  title: "Comprehensive Planning",
                  description:
                    "Tasks, budgets, timelines, and guest management all in one place",
                },
                {
                  icon: <FiCloud className="h-6 w-6" />,
                  title: "Weather Integration",
                  description:
                    "Real-time weather forecasts and automatic backup plan suggestions",
                },
                {
                  icon: <FiUsers className="h-6 w-6" />,
                  title: "Guest Experience",
                  description:
                    "Interactive games, personalized dashboards, and seamless check-ins",
                },
              ].map((feature, idx) => (
                <Card
                  key={idx}
                  className="shadow-card hover:shadow-elegant transition-smooth"
                >
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-primary/10 text-primary">
                        {feature.icon}
                      </div>
                      <div className="space-y-1">
                        <CardTitle>{feature.title}</CardTitle>
                        <CardDescription>{feature.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </section>

          {/* Credits */}
          <section className="text-center space-y-4 py-8 animate-fade-in">
            <Separator className="mb-8" />
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Site made by{" "}
                <span className="font-semibold text-primary">Lara</span> for{" "}
                <span className="font-semibold text-primary">
                  AcademyX x Agility
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                Powered by eventor.ai - AI-Powered Event Planning Platform
              </p>
            </div>
          </section>

          {/* CTA */}
          <section className="text-center space-y-6 py-12 animate-fade-in">
            <h3 className="text-3xl font-bold">Ready to Start Planning?</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Create your first event and experience the power of AI-assisted
              event planning
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() => navigate("/dashboard")}
                className="gap-2 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 shadow-elegant"
              >
                <FiCalendar className="h-5 w-5" />
                Go to Dashboard
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/")}>
                <FiHome className="h-5 w-5 mr-2" />
                Back to Home
              </Button>
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-border bg-card mt-16">
        <div className="container mx-auto px-4 py-8 text-center space-y-2">
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
              <div className="text-sm font-bold" style={{ color: "#E31E24" }}>
                Agility
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

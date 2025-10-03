import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowRight,
  FiLoader,
  FiZap,
  FiFileText,
  FiArrowLeft,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ThemeSelector } from "@/components/ThemeSelector";
import { AuthButton } from "@/components/AuthButton";
import { TemplateModal } from "@/components/event-wizard/TemplateModal";
import { EnhancedBasicInfoStep } from "@/components/event-wizard/EnhancedBasicInfoStep";
import { EnhancedDetailsStep } from "@/components/event-wizard/EnhancedDetailsStep";
import { EnhancedLocationStep } from "@/components/event-wizard/EnhancedLocationStep";
import { PreferencesStep } from "@/components/event-wizard/PreferencesStep";
import { useToast } from "@/hooks/use-toast";
import { useEvents } from "@/hooks/useEvents";
import { useClerkAuth } from "@/contexts/ClerkAuthContext";
import { useBalloons } from "@/hooks/useBalloons";
import { supabase } from "@/lib/supabase-typed";
import { Badge } from "@/components/ui/badge";
import { Coins } from "lucide-react";
import { ConfettiButton } from "@/components/ConfettiButton";
import { LoadingWithTicTacToe } from "@/components/LoadingWithTicTacToe";

const steps = ["Basic Info", "Details", "Location", "Preferences"];

export default function CreateEvent() {
  const [mode, setMode] = useState<"normal" | "quick" | "super-quick" | null>(
    null
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>({
    plan_mode: "organizer",
    currency: "KWD",
    color_theme: "vibrant",
  });
  const [quickPrompt, setQuickPrompt] = useState("");
  const [superQuickName, setSuperQuickName] = useState("");
  const [creating, setCreating] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [userCountry, setUserCountry] = useState<string>("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createEvent } = useEvents();
  const { userId } = useClerkAuth();

  // Get user location on mount
  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = async () => {
    try {
      // Request location permission
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        }
      );

      // Get country from coordinates using reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
      );
      const data = await response.json();

      if (data.address?.country) {
        setUserCountry(data.address.country);
        // Set default country and location_name for normal mode
        setFormData((prev: any) => ({
          ...prev,
          country: data.address.country,
          location_name: data.address.country,
        }));

        toast({
          title: "Location detected",
          description: `Default location set to ${data.address.country}`,
        });
      }
    } catch (error) {
      console.log(
        "Location access denied or unavailable, defaulting to Kuwait"
      );
      // Default to Kuwait if location unavailable
      setUserCountry("Kuwait");
      setFormData((prev: any) => ({
        ...prev,
        country: "Kuwait",
        location_name: "Kuwait",
      }));
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate("/");
    }
  };

  const { spendBalloons, balloons } = useBalloons();

  const handleQuickCreate = async () => {
    if (mode === "quick" && !quickPrompt.trim()) {
      toast({
        title: "Empty prompt",
        description: "Please describe your event",
        variant: "destructive",
      });
      return;
    }

    if (mode === "super-quick" && !superQuickName.trim()) {
      toast({
        title: "Empty name",
        description: "Please enter event name",
        variant: "destructive",
      });
      return;
    }

    // Check balloons for AI generation
    const cost = mode === "quick" ? 50 : 30;
    const canProceed = await spendBalloons(
      cost,
      `${mode === "quick" ? "Quick" : "Super-Quick"} Event Creation`
    );
    if (!canProceed) return;

    setCreating(true);
    toast({
      title: "Generating event...",
      description: "AI is creating your event",
    });

    try {
      const { data: templateData, error: templateError } =
        await supabase.functions.invoke("generate-template", {
          body: {
            prompt: mode === "quick" ? quickPrompt : superQuickName,
            mode: mode === "quick" ? "quick" : "super-quick",
            country: userCountry, // Include user country
          },
        });

      if (templateError) throw templateError;

      // Generate location name using AI if we have the country
      if (templateData) {
        const locationCountry = userCountry || "Kuwait";
        templateData.country = locationCountry;

        // Use AI to generate a specific location within the country
        try {
          const { data: locationData } = await supabase.functions.invoke(
            "generate-location",
            {
              body: {
                country: locationCountry,
                eventType: templateData.event_type || "event",
                eventDescription: templateData.short_description || "",
              },
            }
          );

          if (locationData?.location_name) {
            templateData.location_name = locationData.location_name;
          } else {
            templateData.location_name = locationCountry;
          }
        } catch (error) {
          console.error("Error generating location:", error);
          templateData.location_name = locationCountry;
        }
      }

      // Create event with template data
      await handleCreatePlan(templateData);
    } catch (error) {
      console.error("Error in quick create:", error);
      toast({
        title: "Error",
        description: "Failed to generate event",
        variant: "destructive",
      });
      setCreating(false);
    }
  };

  const handleCreatePlan = async (dataOverride?: any) => {
    const eventData = dataOverride || formData;

    if (!eventData.name || !eventData.event_type || !eventData.event_date) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in event name, type, and date",
        variant: "destructive",
      });
      return;
    }

    if (!dataOverride) {
      // Check balloons for AI plan generation
      const canProceed = await spendBalloons(
        100,
        "Event Plan Creation with AI"
      );
      if (!canProceed) return;

      setCreating(true);
      toast({
        title: "Creating your event plan...",
        description: "AI is generating a personalized plan for your event",
      });
    }

    try {
      // Create the event first with all required fields properly set
      const eventPayload = {
        ...eventData,
        user_id: userId || null,
        clerk_user_id: userId || null,
        plan_mode: eventData.plan_mode || "organizer",
        estimated_guests: eventData.estimated_guests
          ? parseInt(eventData.estimated_guests)
          : null,
        estimated_budget: eventData.estimated_budget
          ? parseFloat(eventData.estimated_budget)
          : null,
        event_duration: eventData.event_duration
          ? parseInt(eventData.event_duration)
          : null,
      };

      const event = await createEvent(eventPayload, userId);

      if (!event) {
        throw new Error("Failed to create event");
      }

      // If user is not authenticated, add event ID to localStorage
      if (!userId) {
        const ownedEvents = JSON.parse(
          localStorage.getItem("owned_events") || "[]"
        );
        if (!ownedEvents.includes(event.id)) {
          ownedEvents.push(event.id);
          localStorage.setItem("owned_events", JSON.stringify(ownedEvents));
        }
      }

      // Generate comprehensive AI plan using generate-initial-plan
      console.log("Step 1: Calling generate-initial-plan for event:", event.id);
      const { data: initialPlanData, error: initialPlanError } =
        await supabase.functions.invoke("generate-initial-plan", {
          body: { eventId: event.id },
        });

      if (initialPlanError) {
        console.error("Initial plan error:", initialPlanError);
        toast({
          title: "Warning",
          description:
            "Initial plan generation had issues, continuing with basic plan",
        });
      } else {
        console.log("Initial plan generated successfully");
      }

      // Generate AI plan
      console.log("Step 2: Calling generate-event-plan");
      const { data: planData, error: planError } =
        await supabase.functions.invoke("generate-event-plan", {
          body: { eventData },
        });

      if (planError) {
        console.error("Plan generation error:", planError);
        throw new Error(
          `Failed to generate event plan: ${
            planError.message || "Unknown error"
          }`
        );
      }

      console.log("Event plan generated successfully:", planData);

      // Update event with AI-generated data
      console.log("Step 3: Updating event with AI data");
      if (planData?.event) {
        const { error: updateError } = await (supabase as any)
          .from("events")
          .update({
            ai_generated_description: planData.event.description,
            venue_recommendation: planData.event.venue_recommendation,
            name: planData.event.name || eventData.name,
          })
          .eq("id", event.id);

        if (updateError) {
          console.error("Error updating event:", updateError);
          throw new Error(`Failed to update event: ${updateError.message}`);
        }
        console.log("Event updated successfully");
      }

      // Insert tasks
      console.log("Step 4: Inserting tasks");
      if (planData?.tasks && planData.tasks.length > 0) {
        const { error: tasksError } = await (supabase as any)
          .from("tasks")
          .insert(
            planData.tasks.map((task: any, index: number) => ({
              event_id: event.id,
              title: task.title,
              description: task.description,
              category: task.category,
              priority: task.priority,
              status: "todo",
              start_date: task.start_date,
              due_date: task.due_date,
              position: index,
            }))
          );

        if (tasksError) {
          console.error("Error inserting tasks:", tasksError);
          throw new Error(`Failed to create tasks: ${tasksError.message}`);
        }
        console.log(`Inserted ${planData.tasks.length} tasks`);
      }

      // Insert budget items
      console.log("Step 5: Inserting budget items");
      if (planData?.budget && planData.budget.length > 0) {
        const { error: budgetError } = await (supabase as any)
          .from("budget_items")
          .insert(
            planData.budget.map((item: any) => ({
              event_id: event.id,
              item_name: item.item_name,
              category: item.category,
              estimated_cost: item.estimated_cost,
              quantity: item.quantity,
              notes: item.notes,
            }))
          );

        if (budgetError) {
          console.error("Error inserting budget items:", budgetError);
          throw new Error(`Failed to create budget: ${budgetError.message}`);
        }
        console.log(`Inserted ${planData.budget.length} budget items`);
      }

      // Insert timeline events
      console.log("Step 6: Inserting timeline events");
      if (planData?.timeline && planData.timeline.length > 0) {
        const { error: timelineError } = await (supabase as any)
          .from("timeline_events")
          .insert(
            planData.timeline.map((te: any) => ({
              event_id: event.id,
              title: te.title,
              event_type: te.event_type,
              event_time: te.event_time,
              duration_minutes: te.duration_minutes,
              description: te.description,
            }))
          );

        if (timelineError) {
          console.error("Error inserting timeline events:", timelineError);
          throw new Error(
            `Failed to create timeline: ${timelineError.message}`
          );
        }
        console.log(`Inserted ${planData.timeline.length} timeline events`);
      }

      // Insert invites
      console.log("Step 7: Inserting invites");
      if (planData?.invites) {
        const { error: invitesError } = await (supabase as any)
          .from("invites")
          .insert({
            event_id: event.id,
            short_message: planData.invites.short_message,
            long_message: planData.invites.long_message,
            email_template: planData.invites.email_template,
          });

        if (invitesError) {
          console.error("Error inserting invites:", invitesError);
          throw new Error(`Failed to create invites: ${invitesError.message}`);
        }
        console.log("Invites inserted successfully");
      }

      // Generate and insert FAQs
      console.log("Step 8: Generating FAQs");
      try {
        const { data: faqData, error: faqError } =
          await supabase.functions.invoke("generate-faqs", {
            body: { eventData },
          });

        if (faqError) {
          console.error("FAQ generation error:", faqError);
        } else if (faqData?.faqs && faqData.faqs.length > 0) {
          const { error: faqInsertError } = await (supabase as any)
            .from("event_faqs")
            .insert(
              faqData.faqs.map((faq: any) => ({
                event_id: event.id,
                question: faq.question,
                answer: faq.answer,
              }))
            );

          if (faqInsertError) {
            console.error("Error inserting FAQs:", faqInsertError);
          } else {
            console.log(`Inserted ${faqData.faqs.length} FAQs`);
          }
        }
      } catch (error) {
        console.error("Error generating FAQs:", error);
        // Continue even if FAQ generation fails
      }

      // Generate and insert intro speech
      console.log("Step 9: Generating intro speech");
      try {
        const { data: speechData, error: speechError } =
          await supabase.functions.invoke("generate-speech", {
            body: {
              eventData,
              speechType: "intro",
            },
          });

        if (speechError) {
          console.error("Speech generation error:", speechError);
        } else if (speechData?.speech) {
          const { error: speechInsertError } = await (supabase as any)
            .from("event_speeches")
            .insert({
              event_id: event.id,
              speech_type: "intro",
              speech_content: speechData.speech,
            });

          if (speechInsertError) {
            console.error("Error inserting speech:", speechInsertError);
          } else {
            console.log("Speech inserted successfully");
          }
        }
      } catch (error) {
        console.error("Error generating intro speech:", error);
        // Continue even if speech generation fails
      }

      console.log("Event creation completed successfully!");
      toast({
        title: "Success!",
        description:
          "Your event plan, FAQs, and intro speech have been created",
      });

      navigate(`/event/${event.id}`);
    } catch (error: any) {
      console.error("Error creating event plan:", error);
      console.error("Error stack:", error.stack);

      toast({
        title: "Error",
        description:
          error.message || "Failed to create event plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleTemplateSelect = (template: any) => {
    setFormData({ ...formData, ...template });
  };

  const renderModeSelection = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">
          How would you like to create your event?
        </h2>
        <p className="text-muted-foreground">
          Choose the method that works best for you
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card
          className="p-6 cursor-pointer hover:border-primary transition-smooth"
          onClick={() => setMode("normal")}
        >
          <FiFileText className="h-12 w-12 mb-4 text-primary" />
          <h3 className="font-semibold mb-2">Normal Mode</h3>
          <p className="text-sm text-muted-foreground">
            Fill in all details step by step with optional templates
          </p>
        </Card>

        <Card
          className="p-6 cursor-pointer hover:border-primary transition-smooth"
          onClick={() => setMode("quick")}
        >
          <FiZap className="h-12 w-12 mb-4 text-primary" />
          <h3 className="font-semibold mb-2">Quick Prompt</h3>
          <p className="text-sm text-muted-foreground">
            Describe your event in one prompt and let AI fill everything
          </p>
        </Card>

        <Card
          className="p-6 cursor-pointer hover:border-primary transition-smooth"
          onClick={() => setMode("super-quick")}
        >
          <FiLoader className="h-12 w-12 mb-4 text-primary" />
          <h3 className="font-semibold mb-2">Super-Quick</h3>
          <p className="text-sm text-muted-foreground">
            Just enter event name and AI generates everything
          </p>
        </Card>
      </div>
    </div>
  );

  const renderQuickMode = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-2">Describe Your Event</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Tell us about your event and AI will generate all the details
        </p>
        <Textarea
          placeholder="E.g., A tech startup launch party for 100 people with modern theme, outdoor venue, $5000 budget..."
          value={quickPrompt}
          onChange={(e) => setQuickPrompt(e.target.value)}
          rows={6}
          enableVoiceInput
          enableEnhance
        />
      </div>
      <ConfettiButton
        onClick={handleQuickCreate}
        disabled={creating}
        className="w-full"
      >
        {creating ? (
          <>
            <FiLoader className="h-4 w-4 mr-2 animate-spin" />
            Creating...
          </>
        ) : (
          <>
            Generate Event
            <FiArrowRight className="h-4 w-4 ml-2" />
          </>
        )}
      </ConfettiButton>
    </div>
  );

  const renderSuperQuickMode = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-2">Enter Event Name</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Just the name, AI will handle the rest
        </p>
        <Input
          placeholder="E.g., Summer Beach Party"
          value={superQuickName}
          onChange={(e) => setSuperQuickName(e.target.value)}
          className="text-lg"
          enableVoiceInput
          enableEnhance
        />
      </div>
      <ConfettiButton
        onClick={handleQuickCreate}
        disabled={creating}
        className="w-full"
      >
        {creating ? (
          <>
            <FiLoader className="h-4 w-4 mr-2 animate-spin" />
            Creating...
          </>
        ) : (
          <>
            Generate Event
            <FiArrowRight className="h-4 w-4 ml-2" />
          </>
        )}
      </ConfettiButton>
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="flex gap-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTemplateModalOpen(true)}
              >
                <FiFileText className="h-4 w-4 mr-2" />
                Use Template
              </Button>
            </div>
            <EnhancedBasicInfoStep data={formData} onChange={setFormData} />
          </div>
        );
      case 1:
        return <EnhancedDetailsStep data={formData} onChange={setFormData} />;
      case 2:
        return <EnhancedLocationStep data={formData} onChange={setFormData} />;
      case 3:
        return <PreferencesStep data={formData} onChange={setFormData} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/">
            <h1 className="hover:rotate-[5deg] hover:scale-110 transition-all text-2xl font-bold text-gradient">
              eventor.ai
            </h1>
          </Link>{" "}
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Coins className="h-4 w-4" />
              {balloons} Balloons
            </Badge>
            <ThemeSelector />
            <AuthButton />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {mode === null ? (
          <Card className="p-6 shadow-card animate-fade-in">
            {renderModeSelection()}
          </Card>
        ) : mode === "quick" ? (
          <Card className="p-6 shadow-card animate-fade-in">
            <Button
              variant="ghost"
              onClick={() => setMode(null)}
              className="mb-4"
            >
              <FiArrowLeft className="h-4 w-4 mr-2" />
              Back to Mode Selection
            </Button>
            {renderQuickMode()}
          </Card>
        ) : mode === "super-quick" ? (
          <Card className="p-6 shadow-card animate-fade-in">
            <Button
              variant="ghost"
              onClick={() => setMode(null)}
              className="mb-4"
            >
              <FiArrowLeft className="h-4 w-4 mr-2" />
              Back to Mode Selection
            </Button>
            {renderSuperQuickMode()}
          </Card>
        ) : (
          <>
            <div className="mb-8 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-3xl font-bold">Create Your Event</h2>
                <span className="text-sm text-muted-foreground">
                  Step {currentStep + 1} of {steps.length}
                </span>
              </div>

              <Progress value={progress} className="mb-2" />

              <div className="flex justify-between text-xs text-muted-foreground">
                {steps.map((step, idx) => (
                  <span
                    key={step}
                    className={`transition-smooth ${
                      idx === currentStep ? "text-primary font-medium" : ""
                    }`}
                  >
                    {step}
                  </span>
                ))}
              </div>
            </div>

            <Card className="p-6 shadow-card animate-slide-up">
              {renderStep()}
            </Card>

            <div className="flex items-center justify-between mt-6 animate-fade-in">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={creating}
              >
                Back
              </Button>

              {currentStep === steps.length - 1 ? (
                <ConfettiButton
                  onClick={() => handleCreatePlan()}
                  disabled={creating}
                  className="gap-2"
                  rewardType="confetti"
                >
                  {creating ? (
                    <>
                      <FiLoader className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Plan
                      <FiArrowRight className="h-4 w-4" />
                    </>
                  )}
                </ConfettiButton>
              ) : (
                <Button onClick={handleNext} className="gap-2">
                  Next
                  <FiArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </>
        )}

        <TemplateModal
          open={templateModalOpen}
          onClose={() => setTemplateModalOpen(false)}
          onSelectTemplate={handleTemplateSelect}
        />

        <LoadingWithTicTacToe
          isLoading={creating}
          title={
            mode === "quick" || mode === "super-quick"
              ? "Generating Event..."
              : "Creating Event Plan..."
          }
        />
      </div>
    </div>
  );
}

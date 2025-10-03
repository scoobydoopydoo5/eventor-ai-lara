import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-typed";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ChefHat, Store, Loader2, UtensilsCrossed } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useBalloons } from '@/hooks/useBalloons';
import { AuthButton } from '@/components/AuthButton';
import { ThemeSelector } from '@/components/ThemeSelector';
import { useImageGeneration } from '@/hooks/useImageGeneration';

interface Food {
  id: string;
  name: string;
  description: string;
  servingSize: string;
  estimatedCost: string;
  prepTime: string;
  foodType: string;
  reason: string;
  dietaryInfo: string;
}

interface Recipe {
  name: string;
  ingredients: string[];
  steps: { stepNumber: number; instruction: string; time: string }[];
  cookingTime: string;
  difficulty: string;
  tips: string[];
}

interface Vendor {
  id: string;
  name: string;
  type: string;
  address: string;
  description: string;
  estimatedPrice: string;
  contact: string;
}

export default function EventFood() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { spendBalloons } = useBalloons();
  const [isGenerating, setIsGenerating] = useState(false);
  const [foods, setFoods] = useState<Food[]>([]);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [showVendorsModal, setShowVendorsModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const { generateImage } = useImageGeneration();
  const [foodImages, setFoodImages] = useState<Record<string, string>>({});

  const { data: event } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const generateFoodSuggestions = async () => {
    if (!event) return;
    
    const canProceed = await spendBalloons(30, 'Generate Food Suggestions');
    if (!canProceed) return;
    
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("food-suggestions", {
        body: {
          eventType: event.event_type,
          guests: event.estimated_guests,
          budget: event.estimated_budget,
          location: `${event.location_name}, ${event.state}, ${event.country}`,
          date: event.event_date,
          time: event.event_time,
        },
      });

      if (error) throw error;
      const generatedFoods = data.foods || [];
      setFoods(generatedFoods);
      
      // Generate images for each food item
      const images: Record<string, string> = {};
      for (const food of generatedFoods) {
        const image = await generateImage(`Professional food photography of ${food.name}, ${food.description}, appetizing presentation, restaurant quality`, { food });
        if (image) {
          images[food.id] = image;
        }
      }
      setFoodImages(images);
      
      toast({ title: "Food suggestions generated!" });
    } catch (error) {
      console.error("Error generating food suggestions:", error);
      toast({
        title: "Error",
        description: "Failed to generate food suggestions",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const viewRecipe = async (food: Food) => {
    const canProceed = await spendBalloons(20, 'Generate Recipe');
    if (!canProceed) return;

    setSelectedFood(food);
    setLoadingRecipe(true);
    setShowRecipeModal(true);
    setCurrentStep(0);

    try {
      const { data, error } = await supabase.functions.invoke("generate-recipe", {
        body: {
          foodName: food.name,
          servings: event?.estimated_guests || 50,
        },
      });

      if (error) throw error;
      setRecipe(data.recipe);
    } catch (error) {
      console.error("Error generating recipe:", error);
      toast({
        title: "Error",
        description: "Failed to generate recipe",
        variant: "destructive",
      });
    } finally {
      setLoadingRecipe(false);
    }
  };

  const viewVendors = async (food: Food) => {
    const canProceed = await spendBalloons(20, 'Find Food Vendors');
    if (!canProceed) return;

    setSelectedFood(food);
    setLoadingVendors(true);
    setShowVendorsModal(true);

    try {
      const { data, error } = await supabase.functions.invoke("find-food-vendors", {
        body: {
          foodName: food.name,
          location: `${event?.location_name}, ${event?.state}, ${event?.country}`,
        },
      });

      if (error) throw error;
      setVendors(data.vendors || []);
    } catch (error) {
      console.error("Error finding vendors:", error);
      toast({
        title: "Error",
        description: "Failed to find vendors",
        variant: "destructive",
      });
    } finally {
      setLoadingVendors(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/event/${eventId}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gradient">Food & Catering</h1>
              <p className="text-xs text-muted-foreground">AI-suggested food options</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeSelector />
            <AuthButton />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-6">

        {foods.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UtensilsCrossed className="h-16 w-16 mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No food suggestions yet</h3>
              <p className="text-muted-foreground mb-4">Generate AI-powered food suggestions</p>
              <Button onClick={generateFoodSuggestions} disabled={isGenerating}>
                {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Food Suggestions
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex justify-end">
              <Button onClick={generateFoodSuggestions} disabled={isGenerating}>
                {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Regenerate Suggestions
              </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {foods.map((food) => (
                <Card key={food.id}>
                  {foodImages[food.id] && (
                    <div className="h-40 w-full overflow-hidden">
                      <img 
                        src={foodImages[food.id]} 
                        alt={food.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {food.name}
                      <Badge variant="secondary">{food.foodType}</Badge>
                    </CardTitle>
                    <CardDescription>{food.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm space-y-1">
                      <p><strong>Serves:</strong> {food.servingSize}</p>
                      <p><strong>Cost:</strong> {food.estimatedCost}</p>
                      <p><strong>Prep Time:</strong> {food.prepTime}</p>
                      <p><strong>Dietary:</strong> {food.dietaryInfo}</p>
                    </div>
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm"><strong>Why this type:</strong> {food.reason}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => viewRecipe(food)}
                      >
                        <ChefHat className="h-4 w-4 mr-2" />
                        Recipe
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => viewVendors(food)}
                      >
                        <Store className="h-4 w-4 mr-2" />
                        Vendors
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Recipe Modal */}
        <Dialog open={showRecipeModal} onOpenChange={setShowRecipeModal}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Recipe: {selectedFood?.name}</DialogTitle>
            </DialogHeader>
            {loadingRecipe ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : recipe ? (
              <div className="space-y-6">
                <div className="flex gap-4 text-sm">
                  <Badge>{recipe.difficulty}</Badge>
                  <span>⏱️ {recipe.cookingTime}</span>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Ingredients</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {recipe.ingredients.map((ing, i) => (
                      <li key={i}>{ing}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Instructions</h3>
                  <div className="space-y-4">
                    {recipe.steps.map((step) => (
                      <div
                        key={step.stepNumber}
                        className={`p-4 rounded-lg border-2 ${
                          currentStep === step.stepNumber - 1
                            ? "border-primary bg-primary/5"
                            : "border-border"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                            {step.stepNumber}
                          </div>
                          <span className="text-sm text-muted-foreground">⏱️ {step.time}</span>
                        </div>
                        <p>{step.instruction}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                      disabled={currentStep === 0}
                    >
                      Previous Step
                    </Button>
                    <Button
                      onClick={() => setCurrentStep(Math.min(recipe.steps.length - 1, currentStep + 1))}
                      disabled={currentStep === recipe.steps.length - 1}
                    >
                      Next Step
                    </Button>
                  </div>
                </div>

                {recipe.tips.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Tips</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {recipe.tips.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        {/* Vendors Modal */}
        <Dialog open={showVendorsModal} onOpenChange={setShowVendorsModal}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Restaurants & Markets for {selectedFood?.name}</DialogTitle>
            </DialogHeader>
            {loadingVendors ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {vendors.map((vendor) => (
                  <Card key={vendor.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {vendor.name}
                        <Badge variant="outline">{vendor.type}</Badge>
                      </CardTitle>
                      <CardDescription>{vendor.address}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm">{vendor.description}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span><strong>Price:</strong> {vendor.estimatedPrice}</span>
                        {vendor.contact && (
                          <span className="text-primary">{vendor.contact}</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

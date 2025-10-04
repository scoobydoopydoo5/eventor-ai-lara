import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase-typed";
import { useClerkAuth } from "@/contexts/ClerkAuthContext";
import { AuthButton } from "@/components/AuthButton";
import { ThemeSelector } from "@/components/ThemeSelector";
import { Plus, Users, FileText, Coins } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function Surveys() {
  const [surveys, setSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { userId, balloons, isGuest } = useClerkAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("surveys")
        .select("*, survey_responses(count)")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSurveys(data || []);
    } catch (error) {
      console.error("Error fetching surveys:", error);
      toast({
        title: "Error",
        description: "Failed to load surveys",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1
            className="text-2xl font-bold text-gradient cursor-pointer"
            onClick={() => navigate("/")}
          >
            eventor.ai
          </h1>
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

      <main className="container mx-auto px-4 py-8">
        {isGuest && (
          <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg animate-fade-in">
            <p className="text-sm">
              🎈 <strong>Guest Mode:</strong> You have {balloons} free balloons!
              Fill surveys to earn more balloons. Sign in to save your progress
              and earnings.
            </p>
          </div>
        )}

        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Surveys</h2>{" "}
            <h6 className="text-xl font-bold mb-2">For Creators and Users</h6>
            <p className="text-muted-foreground">
              Fill surveys to earn 5 balloons per survey or create your own
              survey and publish it!
            </p>
          </div>
          <Button onClick={() => navigate("/create-survey")} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Survey
          </Button>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-full" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : surveys.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Surveys Yet</h3>
            <p className="text-muted-foreground mb-4">
              Be the first to create a survey and earn balloons from responses!
            </p>
            <Button onClick={() => navigate("/create-survey")}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Survey
            </Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {surveys.map((survey) => (
              <Card
                key={survey.id}
                className="hover:shadow-lg transition-all cursor-pointer"
                onClick={() => navigate(`/survey/${survey.id}`)}
              >
                <CardHeader>
                  <CardTitle className="flex items-start justify-between">
                    <span className="flex-1">{survey.title}</span>
                    <Badge variant="secondary" className="ml-2">
                      +5 🎈
                    </Badge>
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {survey.description || "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {survey.total_questions} questions
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {survey.survey_responses?.[0]?.count || 0} responses
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

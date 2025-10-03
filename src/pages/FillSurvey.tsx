import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase-typed';
import { useClerkAuth } from '@/contexts/ClerkAuthContext';
import { useBalloons } from '@/hooks/useBalloons';
import { AuthButton } from '@/components/AuthButton';
import { ThemeSelector } from '@/components/ThemeSelector';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Coins, CheckCircle } from 'lucide-react';

export default function FillSurvey() {
  const { surveyId } = useParams();
  const [survey, setSurvey] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyFilled, setAlreadyFilled] = useState(false);
  const { userId, balloons } = useClerkAuth();
  const { earnBalloons } = useBalloons();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (surveyId) {
      fetchSurvey();
      checkIfAlreadyFilled();
    }
  }, [surveyId, userId]);

  const fetchSurvey = async () => {
    try {
      const { data: surveyData, error: surveyError } = await (supabase as any)
        .from('surveys')
        .select('*')
        .eq('id', surveyId)
        .eq('is_published', true)
        .single();

      if (surveyError) throw surveyError;

      const { data: questionsData, error: questionsError } = await (supabase as any)
        .from('survey_questions')
        .select('*')
        .eq('survey_id', surveyId)
        .order('position');

      if (questionsError) throw questionsError;

      setSurvey(surveyData);
      setQuestions(questionsData || []);
    } catch (error) {
      console.error('Error fetching survey:', error);
      toast({
        title: "Error",
        description: "Failed to load survey",
        variant: "destructive",
      });
      navigate('/surveys');
    } finally {
      setLoading(false);
    }
  };

  const checkIfAlreadyFilled = async () => {
    if (!userId) {
      // Check localStorage for guests
      const guestResponses = JSON.parse(localStorage.getItem('guest_survey_responses') || '[]');
      if (guestResponses.includes(surveyId)) {
        setAlreadyFilled(true);
      }
      return;
    }

    try {
      const { data, error } = await (supabase as any)
        .from('survey_responses')
        .select('id')
        .eq('survey_id', surveyId)
        .eq('respondent_id', userId)
        .maybeSingle();

      if (!error && data) {
        setAlreadyFilled(true);
      }
    } catch (error) {
      console.error('Error checking responses:', error);
    }
  };

  const handleSubmit = async () => {
    // Validate all questions are answered
    const unanswered = questions.filter(q => !answers[q.id]);
    if (unanswered.length > 0) {
      toast({
        title: "Incomplete survey",
        description: "Please answer all questions",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      if (userId) {
        // Submit response for authenticated users
        const { error: responseError } = await (supabase as any)
          .from('survey_responses')
          .insert({
            survey_id: surveyId,
            respondent_id: userId,
            answers: JSON.stringify(answers),
            credits_awarded: true,
          });

        if (responseError) throw responseError;
      } else {
        // Track in localStorage for guests
        const guestResponses = JSON.parse(localStorage.getItem('guest_survey_responses') || '[]');
        guestResponses.push(surveyId);
        localStorage.setItem('guest_survey_responses', JSON.stringify(guestResponses));
      }

      // Award balloons
      await earnBalloons(5, `Completed survey: ${survey.title}`);

      toast({
        title: "Survey submitted!",
        description: "You earned 5 balloons! 🎈",
      });

      navigate('/surveys');
    } catch (error: any) {
      console.error('Error submitting survey:', error);
      
      if (error?.code === '23505') {
        toast({
          title: "Already submitted",
          description: "You've already filled this survey",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to submit survey",
          variant: "destructive",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gradient cursor-pointer" onClick={() => navigate('/')}>
              eventor.ai
            </h1>
            <div className="flex items-center gap-2">
              <ThemeSelector />
              <AuthButton />
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-8 bg-muted rounded w-3/4 mb-2" />
              <div className="h-4 bg-muted rounded w-full" />
            </CardHeader>
          </Card>
        </main>
      </div>
    );
  }

  if (alreadyFilled) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gradient cursor-pointer" onClick={() => navigate('/')}>
              eventor.ai
            </h1>
            <div className="flex items-center gap-2">
              <ThemeSelector />
              <AuthButton />
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <Card className="p-12 text-center">
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h3 className="text-xl font-semibold mb-2">Already Completed</h3>
            <p className="text-muted-foreground mb-4">
              You've already filled this survey. Thank you for your participation!
            </p>
            <Button onClick={() => navigate('/surveys')}>
              Back to Surveys
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gradient cursor-pointer" onClick={() => navigate('/')}>
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

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {survey.title}
              <Badge variant="secondary">+5 🎈</Badge>
            </CardTitle>
            {survey.description && (
              <CardDescription>{survey.description}</CardDescription>
            )}
          </CardHeader>
        </Card>

        <div className="space-y-6">
          {questions.map((question, idx) => (
            <Card key={question.id}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {idx + 1}. {question.question_text}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {question.question_type === 'multiple_choice' && (
                  <RadioGroup
                    value={answers[question.id]}
                    onValueChange={(value) => setAnswers({ ...answers, [question.id]: value })}
                  >
                    {JSON.parse(question.options || '[]').map((option: string, i: number) => (
                      <div key={i} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`${question.id}-${i}`} />
                        <Label htmlFor={`${question.id}-${i}`}>{option}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
                {question.question_type === 'text' && (
                  <Textarea
                    placeholder="Your answer..."
                    value={answers[question.id] || ''}
                    onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                    rows={4}
                  />
                )}
                {question.question_type === 'rating' && (
                  <RadioGroup
                    value={answers[question.id]}
                    onValueChange={(value) => setAnswers({ ...answers, [question.id]: value })}
                  >
                    <div className="flex gap-4">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <div key={rating} className="flex items-center space-x-2">
                          <RadioGroupItem value={rating.toString()} id={`${question.id}-${rating}`} />
                          <Label htmlFor={`${question.id}-${rating}`}>{rating}</Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-6">
          <CardContent className="pt-6">
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full gap-2"
              size="lg"
            >
              <Coins className="h-4 w-4" />
              {submitting ? 'Submitting...' : 'Submit & Earn 5 Balloons'}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

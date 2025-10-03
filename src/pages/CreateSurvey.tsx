import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase-typed';
import { useClerkAuth } from '@/contexts/ClerkAuthContext';
import { useBalloons } from '@/hooks/useBalloons';
import { AuthButton } from '@/components/AuthButton';
import { ThemeSelector } from '@/components/ThemeSelector';
import { Plus, Trash2, DollarSign, Coins } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

interface Question {
  id: string;
  text: string;
  type: 'multiple_choice' | 'text' | 'rating';
  options?: string[];
}

export default function CreateSurvey() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [currentType, setCurrentType] = useState<'multiple_choice' | 'text' | 'rating'>('multiple_choice');
  const [currentOptions, setCurrentOptions] = useState<string[]>(['', '']);
  const [publishing, setPublishing] = useState(false);
  const { userId, balloons } = useClerkAuth();
  const { spendBalloons } = useBalloons();
  const navigate = useNavigate();
  const { toast } = useToast();

  const COST_PER_QUESTION = 5;
  const totalCost = questions.length * COST_PER_QUESTION;

  const addQuestion = async () => {
    if (!currentQuestion.trim()) {
      toast({
        title: "Empty question",
        description: "Please enter a question",
        variant: "destructive",
      });
      return;
    }

    if (currentType === 'multiple_choice' && currentOptions.filter(o => o.trim()).length < 2) {
      toast({
        title: "Invalid options",
        description: "Multiple choice needs at least 2 options",
        variant: "destructive",
      });
      return;
    }

    // Spend balloons for this question
    const canProceed = await spendBalloons(COST_PER_QUESTION, 'Survey Question Creation');
    if (!canProceed) return;

    const newQuestion: Question = {
      id: Math.random().toString(),
      text: currentQuestion,
      type: currentType,
      options: currentType === 'multiple_choice' ? currentOptions.filter(o => o.trim()) : undefined,
    };

    setQuestions([...questions, newQuestion]);
    setCurrentQuestion('');
    setCurrentOptions(['', '']);
    
    toast({
      title: "Question added",
      description: `${COST_PER_QUESTION} balloons spent`,
    });
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
    toast({
      title: "Question removed",
      description: "Note: Balloons are not refunded for removed questions",
    });
  };

  const publishWithCredits = async () => {
    if (!title.trim() || questions.length === 0) {
      toast({
        title: "Incomplete survey",
        description: "Add a title and at least one question",
        variant: "destructive",
      });
      return;
    }

    setPublishing(true);

    try {
      // Create survey (use 'guest' as creator_id for guests)
      const creatorId = userId || 'guest';
      
      const { data: survey, error: surveyError } = await (supabase as any)
        .from('surveys')
        .insert({
          creator_id: creatorId,
          title,
          description,
          total_questions: questions.length,
          credits_cost: totalCost,
          is_published: true,
        })
        .select()
        .single();

      if (surveyError) throw surveyError;

      // Insert questions
      const questionsData = questions.map((q, idx) => ({
        survey_id: survey.id,
        question_text: q.text,
        question_type: q.type,
        options: q.options ? JSON.stringify(q.options) : null,
        position: idx,
      }));

      const { error: questionsError } = await (supabase as any)
        .from('survey_questions')
        .insert(questionsData);

      if (questionsError) throw questionsError;

      toast({
        title: "Survey published!",
        description: "Your survey is now live",
      });

      navigate('/surveys');
    } catch (error) {
      console.error('Error publishing survey:', error);
      toast({
        title: "Error",
        description: "Failed to publish survey",
        variant: "destructive",
      });
    } finally {
      setPublishing(false);
    }
  };

  const publishWithMoney = () => {
    const amount = (questions.length * 0.05).toFixed(2);
    window.open(`https://pay.com?amount=${amount}&description=${encodeURIComponent(title)}`, '_blank');
    toast({
      title: "Redirecting to payment",
      description: "Complete payment to publish your survey",
    });
  };

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
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Create Survey</h2>
          <p className="text-muted-foreground">
            Pay 5 balloons per question or $0.05 per question
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Survey Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                placeholder="Survey title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="What is this survey about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add Questions</CardTitle>
            <CardDescription>Each question costs 5 balloons or $0.05</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Question</Label>
              <Input
                placeholder="Enter your question"
                value={currentQuestion}
                onChange={(e) => setCurrentQuestion(e.target.value)}
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={currentType} onValueChange={(v: any) => setCurrentType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                  <SelectItem value="text">Text Answer</SelectItem>
                  <SelectItem value="rating">Rating (1-5)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {currentType === 'multiple_choice' && (
              <div>
                <Label>Options</Label>
                {currentOptions.map((option, idx) => (
                  <Input
                    key={idx}
                    className="mb-2"
                    placeholder={`Option ${idx + 1}`}
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...currentOptions];
                      newOptions[idx] = e.target.value;
                      setCurrentOptions(newOptions);
                    }}
                  />
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentOptions([...currentOptions, ''])}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Option
                </Button>
              </div>
            )}
            <Button onClick={addQuestion} className="w-full gap-2">
              <Plus className="h-4 w-4" />
              Add Question (5 balloons)
            </Button>
          </CardContent>
        </Card>

        {questions.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Questions ({questions.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {questions.map((q, idx) => (
                <div key={q.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="font-medium">
                        {idx + 1}. {q.text}
                      </p>
                      <Badge variant="secondary" className="mt-1">
                        {q.type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(q.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  {q.options && (
                    <ul className="ml-4 mt-2 space-y-1">
                      {q.options.map((opt, i) => (
                        <li key={i} className="text-sm text-muted-foreground">
                          • {opt}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {questions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Publish Survey</CardTitle>
              <CardDescription>
                Total cost: {totalCost} balloons or ${(questions.length * 0.05).toFixed(2)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={publishWithCredits}
                disabled={publishing || balloons < totalCost}
                className="w-full gap-2"
              >
                <Coins className="h-4 w-4" />
                Publish with {totalCost} Balloons
              </Button>
              <Button
                onClick={publishWithMoney}
                variant="outline"
                disabled={publishing}
                className="w-full gap-2"
              >
                <DollarSign className="h-4 w-4" />
                Pay ${(questions.length * 0.05).toFixed(2)} with Money
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiPlus, FiEdit2, FiTrash2, FiPieChart, FiRefreshCw, FiTrendingUp, FiTrendingDown, FiHelpCircle, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeSelector } from '@/components/ThemeSelector';
import { useBudget, BudgetItem } from '@/hooks/useBudget';
import { useEvents } from '@/hooks/useEvents';
import { useBalloons } from '@/hooks/useBalloons';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase-typed';
import { useToast } from '@/hooks/use-toast';
import { BudgetItemDialog } from '@/components/budget/BudgetItemDialog';
import { BudgetExplainModal } from '@/components/budget/BudgetExplainModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { CreditCard } from 'react-kawaii';
import { useKawaiiTheme } from '@/hooks/useKawaiiTheme';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B9D', '#C084FC', '#FB923C'];

export default function EventBudget() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { budgetItems, loading, createBudgetItem, updateBudgetItem, deleteBudgetItem, refetch } = useBudget(eventId || '');
  const { events } = useEvents();
  const { spendBalloons } = useBalloons();
  const { toast } = useToast();
  const kawaiiColor = useKawaiiTheme();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<BudgetItem | null>(null);
  const [generating, setGenerating] = useState(false);
  const [explainModalOpen, setExplainModalOpen] = useState(false);
  const [explainItem, setExplainItem] = useState<BudgetItem | null>(null);
  const [budgetFeedback, setBudgetFeedback] = useState<any>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [analysisOpen, setAnalysisOpen] = useState(true);
  const [chartsOpen, setChartsOpen] = useState(true);
  const [itemsOpen, setItemsOpen] = useState(true);
  
  const event = events.find(e => e.id === eventId);
  
  // Calculate metrics
  const totalEstimated = budgetItems.reduce((sum, item) => sum + (item.estimated_cost * item.quantity), 0);
  const totalActual = budgetItems.reduce((sum, item) => sum + ((item.actual_cost || 0) * item.quantity), 0);
  const budgetUsed = event?.estimated_budget ? (totalActual / event.estimated_budget) * 100 : 0;
  const minBudget = totalEstimated * 0.9;
  const maxBudget = totalEstimated * 1.1;
  const averageBudget = totalEstimated;
  const recommendedSavings = totalEstimated * 0.15;
  const extrasBudget = totalEstimated * 0.05;
  const remaining = (event?.estimated_budget || 0) - totalActual;

  // Fetch budget feedback
  useEffect(() => {
    const fetchFeedback = async () => {
      if (!event || budgetItems.length === 0 || loadingFeedback) return;
      
      setLoadingFeedback(true);
      try {
        const { data, error } = await supabase.functions.invoke('budget-feedback', {
          body: { eventData: event, totalEstimated, totalActual }
        });

        if (!error && data && !data.error) {
          setBudgetFeedback(data);
        }
      } catch (error) {
        console.error('Error fetching budget feedback:', error);
      } finally {
        setLoadingFeedback(false);
      }
    };

    if (budgetItems.length > 0 && !budgetFeedback) {
      fetchFeedback();
    }
  }, [event, budgetItems, totalEstimated, totalActual]);

  // Category totals for pie chart
  const categoryTotals = budgetItems.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + (item.estimated_cost * item.quantity);
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(categoryTotals).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  // Bar chart data for estimated vs actual
  const barData = budgetItems.slice(0, 10).map(item => ({
    name: item.item_name.length > 15 ? item.item_name.substring(0, 15) + '...' : item.item_name,
    estimated: item.estimated_cost * item.quantity,
    actual: (item.actual_cost || 0) * item.quantity
  }));

  const handleGenerateBudget = async () => {
    if (!event) return;
    
    // Check and spend balloons (20 balloons for budget generation)
    const canProceed = await spendBalloons(20, 'Budget Generation');
    if (!canProceed) return;
    
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-budget', {
        body: { eventData: event }
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      // Delete existing items
      for (const item of budgetItems) {
        await deleteBudgetItem(item.id);
      }

      // Create new items
      for (const item of data.budget_items) {
        await createBudgetItem(item);
      }

      toast({
        title: "Success",
        description: "Budget generated successfully with AI!",
      });
    } catch (error) {
      console.error('Error generating budget:', error);
      toast({
        title: "Error",
        description: "Failed to generate budget. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async (itemData: Partial<BudgetItem>) => {
    if (editingItem) {
      await updateBudgetItem(editingItem.id, itemData);
      setEditingItem(null);
      toast({ title: "Success", description: "Budget item updated" });
    } else {
      await createBudgetItem(itemData as any);
      toast({ title: "Success", description: "Budget item created" });
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    await deleteBudgetItem(deletingItem.id);
    setDeleteDialogOpen(false);
    setDeletingItem(null);
    toast({ title: "Success", description: "Budget item deleted" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/event/${eventId}`)}
            >
              <FiArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gradient">Budget Tracker</h1>
          </div>
          <ThemeSelector />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex gap-3">
          <Button onClick={handleGenerateBudget} disabled={generating} className="gap-2">
            <FiRefreshCw className={generating ? "animate-spin" : ""} />
            {generating ? 'Generating...' : 'Generate with AI'}
          </Button>
          <Button onClick={() => { setEditingItem(null); setDialogOpen(true); }} variant="outline" className="gap-2">
            <FiPlus className="h-4 w-4" />
            Add Item
          </Button>
        </div>

        <div className="grid gap-6">
          {/* Budget Feedback Alert */}
          {budgetFeedback && budgetFeedback.status !== 'APPROPRIATE' && (
            <Alert variant={budgetFeedback.severity === 'critical' ? 'destructive' : 'default'}>
              <FiTrendingUp className="h-4 w-4" />
              <AlertTitle>{budgetFeedback.title}</AlertTitle>
              <AlertDescription className="mt-2 whitespace-pre-line">
                {budgetFeedback.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Financial Summary */}
          <Collapsible open={summaryOpen} onOpenChange={setSummaryOpen}>
            <Card>
              <CardHeader>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full flex justify-between p-0 h-auto hover:bg-transparent">
                    <CardTitle>Financial Summary</CardTitle>
                    {summaryOpen ? <FiChevronUp className="h-5 w-5" /> : <FiChevronDown className="h-5 w-5" />}
                  </Button>
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Budget</p>
                    <p className="text-2xl font-bold">{event?.currency} {event?.estimated_budget?.toLocaleString() || '0'}</p>
                  </div>
                  <FiPieChart className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Estimated Cost</p>
                    <p className="text-2xl font-bold">{event?.currency} {totalEstimated.toLocaleString()}</p>
                  </div>
                  <FiTrendingUp className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Actual Spent</p>
                    <p className="text-2xl font-bold">{event?.currency} {totalActual.toLocaleString()}</p>
                  </div>
                  <FiTrendingDown className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Remaining</p>
                    <p className="text-2xl font-bold">{event?.currency} {remaining.toLocaleString()}</p>
                  </div>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${remaining >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                    <span className="text-lg">{remaining >= 0 ? '✓' : '!'}</span>
                  </div>
                </div>
              </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Budget Analysis */}
          <Collapsible open={analysisOpen} onOpenChange={setAnalysisOpen}>
            <Card>
              <CardHeader>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full flex justify-between p-0 h-auto hover:bg-transparent">
                    <CardTitle>Budget Analysis</CardTitle>
                    {analysisOpen ? <FiChevronUp className="h-5 w-5" /> : <FiChevronDown className="h-5 w-5" />}
                  </Button>
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Min Budget (Conservative)</p>
                  <p className="text-xl font-bold">{event?.currency} {minBudget.toLocaleString()}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Average Budget</p>
                  <p className="text-xl font-bold">{event?.currency} {averageBudget.toLocaleString()}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Max Budget (w/ Contingency)</p>
                  <p className="text-xl font-bold">{event?.currency} {maxBudget.toLocaleString()}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Recommended Savings (15%)</p>
                  <p className="text-lg font-semibold">{event?.currency} {recommendedSavings.toLocaleString()}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Extras Budget (5%)</p>
                  <p className="text-lg font-semibold">{event?.currency} {extrasBudget.toLocaleString()}</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Budget Used</span>
                  <span>{budgetUsed.toFixed(1)}%</span>
                </div>
                <Progress value={budgetUsed} className="h-2" />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Charts */}
          {budgetItems.length > 0 && (
            <Collapsible open={chartsOpen} onOpenChange={setChartsOpen}>
              <Card>
                <CardHeader>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full flex justify-between p-0 h-auto hover:bg-transparent">
                      <CardTitle>Budget Visualizations</CardTitle>
                      {chartsOpen ? <FiChevronUp className="h-5 w-5" /> : <FiChevronDown className="h-5 w-5" />}
                    </Button>
                  </CollapsibleTrigger>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Budget by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `${event?.currency} ${value.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Estimated vs Actual (Top 10)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip formatter={(value: number) => `${event?.currency} ${value.toLocaleString()}`} />
                      <Legend />
                      <Bar dataKey="estimated" fill="#8884d8" name="Estimated" />
                      <Bar dataKey="actual" fill="#82ca9d" name="Actual" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* Budget Items List */}
          <Collapsible open={itemsOpen} onOpenChange={setItemsOpen}>
            <Card>
              <CardHeader>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full flex justify-between p-0 h-auto hover:bg-transparent">
                    <CardTitle>Budget Items ({budgetItems.length})</CardTitle>
                    {itemsOpen ? <FiChevronUp className="h-5 w-5" /> : <FiChevronDown className="h-5 w-5" />}
                  </Button>
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              ) : budgetItems.length === 0 ? (
                <div className="text-center py-12">
                  <div className="flex justify-center mb-4">
                    <CreditCard size={120} mood="sad" color={kawaiiColor.kawaiiColor} />
                  </div>
                  <p className="text-muted-foreground mb-4">No budget items yet</p>
                  <Button onClick={handleGenerateBudget} disabled={generating}>
                    <FiRefreshCw className={generating ? "animate-spin mr-2" : "mr-2"} />
                    Generate with AI
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {budgetItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium">{item.item_name}</h4>
                          <span className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary capitalize">
                            {item.category}
                          </span>
                        </div>
                        {item.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="font-medium">{event?.currency} {(item.estimated_cost * item.quantity).toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">Est. (Qty: {item.quantity})</p>
                          {item.actual_cost ? (
                            <p className="text-sm text-green-600 font-medium mt-1">
                              Actual: {event?.currency} {(item.actual_cost * item.quantity).toLocaleString()}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => { setExplainItem(item); setExplainModalOpen(true); }}
                            title="Explain this item"
                          >
                            <FiHelpCircle className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => { setEditingItem(item); setDialogOpen(true); }}
                          >
                            <FiEdit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => { setDeletingItem(item); setDeleteDialogOpen(true); }}
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>
      </div>

      <BudgetItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
        item={editingItem}
        currency={event?.currency}
      />

      {explainItem && (
        <BudgetExplainModal
          open={explainModalOpen}
          onOpenChange={setExplainModalOpen}
          item={explainItem}
          eventData={event}
          currency={event?.currency}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Budget Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingItem?.item_name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

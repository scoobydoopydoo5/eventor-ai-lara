import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FiDollarSign as DollarSign, FiPlus as Plus, FiTrendingUp as TrendingUp } from 'react-icons/fi';

const mockExpenses = [
  { id: 1, category: 'Venue', amount: 1500, percentage: 30 },
  { id: 2, category: 'Food & Drinks', amount: 2000, percentage: 40 },
  { id: 3, category: 'Decorations', amount: 500, percentage: 10 },
  { id: 4, category: 'Entertainment', amount: 800, percentage: 16 },
  { id: 5, category: 'Miscellaneous', amount: 200, percentage: 4 },
];

const totalBudget = 5000;
const totalSpent = mockExpenses.reduce((sum, expense) => sum + expense.amount, 0);
const percentageUsed = (totalSpent / totalBudget) * 100;

export function BudgetCard() {
  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Budget
          </CardTitle>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Expense
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Budget Used</span>
            <span className="text-sm font-medium">
              ${totalSpent.toLocaleString()} / ${totalBudget.toLocaleString()}
            </span>
          </div>
          <Progress value={percentageUsed} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {percentageUsed.toFixed(1)}% of total budget
          </p>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium">Expense Breakdown</h4>
          {mockExpenses.map((expense) => (
            <div key={expense.id} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{expense.category}</span>
                <span className="font-medium">${expense.amount.toLocaleString()}</span>
              </div>
              <Progress value={expense.percentage} className="h-1" />
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-border p-4 bg-accent/50">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-sm">Budget Insights</p>
              <p className="text-sm text-muted-foreground">
                You're on track! Consider allocating more budget to food based on guest count.
              </p>
            </div>
          </div>
        </div>

        <Button variant="outline" className="w-full gap-2">
          <TrendingUp className="h-4 w-4" />
          View Detailed Analytics
        </Button>
      </CardContent>
    </Card>
  );
}

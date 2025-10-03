import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FiEdit, FiTrash2, FiChevronDown, FiChevronRight, FiExternalLink } from 'react-icons/fi';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface CollapsibleTaskProps {
  task: any;
  isCompleted?: boolean;
  onToggle: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  getPriorityColor: (priority: string) => "default" | "destructive" | "outline" | "secondary";
}

export function CollapsibleTask({ task, isCompleted, onToggle, onEdit, onDelete, getPriorityColor }: CollapsibleTaskProps) {
  const [expanded, setExpanded] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      className={cn("hover:shadow-md transition-shadow", isCompleted && "opacity-50", isDragging && "z-50")}
    >
      <div className="p-3">
        <div className="flex items-center gap-2">
          <div className="cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          
          <Checkbox
            checked={task.status === 'completed' || isCompleted}
            onCheckedChange={onToggle}
          />
          
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 hover:bg-muted rounded"
          >
            {expanded ? <FiChevronDown className="h-4 w-4" /> : <FiChevronRight className="h-4 w-4" />}
          </button>
          
          <div className="flex-1 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {isOverdue && (
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Overdue" />
              )}
              <h5 className={cn(
                "font-medium text-sm",
                (task.status === 'completed' || isCompleted) && "line-through text-muted-foreground"
              )}>
                {task.title}
              </h5>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant={getPriorityColor(task.priority)}>
                {task.priority}
              </Badge>
              {onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={onEdit}
                >
                  <FiEdit className="h-3 w-3" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={onDelete}
                >
                  <FiTrash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {expanded && (
          <div className="ml-14 mt-3 space-y-2 animate-in slide-in-from-top-2">
            {task.description && (
              <p className="text-sm text-muted-foreground">{task.description}</p>
            )}
            
            {task.notes && (
              <p className="text-xs text-muted-foreground italic bg-muted/30 p-2 rounded">
                💡 {task.notes}
              </p>
            )}
            
            <div className="flex flex-wrap gap-2 text-xs">
              {task.category && (
                <Badge variant="outline">{task.category}</Badge>
              )}
              {task.tags?.map((tag: string) => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
              {task.start_date && (
                <span className="text-muted-foreground">
                  Start: {new Date(task.start_date).toLocaleDateString()}
                  {task.start_time && ` ${task.start_time}`}
                </span>
              )}
              {task.due_date && (
                <span className="text-muted-foreground">
                  Due: {new Date(task.due_date).toLocaleDateString()}
                  {task.due_time && ` ${task.due_time}`}
                </span>
              )}
            </div>
            
            {task.url && (
              <a 
                href={task.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <FiExternalLink className="h-3 w-3" />
                View Resource
              </a>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

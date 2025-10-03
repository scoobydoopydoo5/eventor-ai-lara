import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FiEdit, FiTrash2, FiExternalLink, FiSettings } from 'react-icons/fi';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SortableTaskProps {
  task: any;
  onEdit?: (task: any) => void;
  onDelete?: (taskId: string) => void;
  getPriorityColor: (priority: string) => "default" | "destructive" | "outline" | "secondary";
  columnId: string;
  onSettings?: (task: any) => void;
}

export function SortableTask({ task, onEdit, onDelete, getPriorityColor, columnId, onSettings }: SortableTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: task.id, 
    data: { 
      task, 
      columnId 
    } 
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';

  return (
    <div ref={setNodeRef} style={style} className="w-full">
      <Card className={cn("p-4 bg-card/50 hover:bg-card transition-colors w-full", isDragging && "rotate-2 shadow-2xl ring-2 ring-primary")}>
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
                <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </div>
              {isOverdue && (
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" title="Overdue" />
              )}
              <h5 className="font-medium text-sm truncate">{task.title}</h5>
              {task.url && (
                <a
                  href={task.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <FiExternalLink className="h-3 w-3" />
                  Resource
                </a>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                {task.priority}
              </Badge>
              {onSettings && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSettings(task);
                  }}
                >
                  <FiSettings className="h-3 w-3" />
                </Button>
              )}
              {onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(task);
                  }}
                >
                  <FiEdit className="h-3 w-3" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(task.id);
                  }}
                >
                  <FiTrash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}

          {task.notes && (
            <p className="text-xs text-muted-foreground italic bg-muted/30 p-2 rounded line-clamp-2">
              💡 {task.notes}
            </p>
          )}

          {task.category && (
            <Badge variant="outline" className="text-xs">
              {task.category}
            </Badge>
          )}

          {task.due_date && (
            <p className="text-xs text-muted-foreground">
              Due: {new Date(task.due_date).toLocaleDateString()}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

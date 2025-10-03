import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase-typed';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners, PointerSensor, useSensor, useSensors, DragOverEvent, pointerWithin, rectIntersection } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { FiEdit, FiTrash2, FiExternalLink, FiClock, FiCalendar, FiPlus, FiX, FiCheck } from 'react-icons/fi';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { SortableTask } from './SortableTask';

interface KanbanViewProps {
  event: any;
  tasks: any[];
  onTasksChange: () => void;
  onEditTask?: (task: any) => void;
  onDeleteTask?: (taskId: string) => void;
}

interface Column {
  id: string;
  title: string;
  color: string;
  is_default: boolean;
}


export function KanbanView({ event, tasks, onTasksChange, onEditTask, onDeleteTask }: KanbanViewProps) {
  const { toast } = useToast();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [columns, setColumns] = useState<Column[]>([
    { id: 'todo', title: 'To Do', color: '#94a3b8', is_default: true },
    { id: 'in-progress', title: 'In Progress', color: '#3b82f6', is_default: true },
    { id: 'completed', title: 'Completed', color: '#10b981', is_default: true },
  ]);
  const [newColumnName, setNewColumnName] = useState('');
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [editColumnName, setEditColumnName] = useState('');
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const getTasksByStatus = (status: string) => 
    tasks.filter(t => t.status === status).sort((a, b) => (a.position || 0) - (b.position || 0));

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setOverId(over ? String(over.id) : null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);
    
    if (!over || active.id === over.id) return;

    const taskId = active.id as string;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const overData = over.data.current as any;
    let targetColumnId = overData?.columnId || String(over.id);
    
    const targetColumn = columns.find(col => col.id === targetColumnId);
    if (!targetColumn) {
      const overTask = tasks.find(t => t.id === String(over.id));
      if (overTask) {
        targetColumnId = overTask.status;
      } else {
        return;
      }
    }
    
    if (task.status !== targetColumnId) {
      try {
        const { error } = await (supabase as any)
          .from('tasks')
          .update({ status: targetColumnId, updated_at: new Date().toISOString() })
          .eq('id', taskId);

        if (error) throw error;
        await onTasksChange();
        
        const column = columns.find(c => c.id === targetColumnId);
        toast({ 
          title: "Task moved", 
          description: `Moved to ${column?.title || targetColumnId}` 
        });
      } catch (error) {
        console.error('Error:', error);
        toast({ title: "Error", description: "Failed to move task", variant: "destructive" });
      }
    }
  };

  const handleAddColumn = () => {
    if (!newColumnName.trim()) return;
    
    const newColumn: Column = {
      id: newColumnName.toLowerCase().replace(/\s+/g, '-'),
      title: newColumnName,
      color: '#6366f1',
      is_default: false,
    };
    
    setColumns([...columns, newColumn]);
    setNewColumnName('');
    setIsAddingColumn(false);
    
    toast({
      title: "Column added",
      description: `${newColumnName} column created`,
    });
  };

  const handleRenameColumn = (columnId: string) => {
    if (!editColumnName.trim()) return;
    
    setColumns(columns.map(col => 
      col.id === columnId ? { ...col, title: editColumnName } : col
    ));
    
    setEditingColumn(null);
    setEditColumnName('');
    
    toast({
      title: "Column renamed",
      description: "Column name updated",
    });
  };

  const handleDeleteColumn = async (columnId: string) => {
    const column = columns.find(col => col.id === columnId);
    if (column?.is_default) {
      toast({
        title: "Cannot delete",
        description: "Default columns cannot be deleted",
        variant: "destructive",
      });
      return;
    }
    
    const columnTasks = getTasksByStatus(columnId);
    if (columnTasks.length > 0) {
      toast({
        title: "Cannot delete",
        description: "Move tasks out of this column first",
        variant: "destructive",
      });
      return;
    }
    
    setColumns(columns.filter(col => col.id !== columnId));
    toast({
      title: "Column deleted",
      description: "Column removed successfully",
    });
  };

  const getPriorityColor = (priority: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

  return (
    <DndContext 
      collisionDetection={rectIntersection} 
      onDragStart={handleDragStart} 
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd} 
      sensors={sensors}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold">Kanban Board - {event.name}</h3>
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground">Drag tasks to change status</div>
            {!isAddingColumn ? (
              <Button size="sm" variant="outline" onClick={() => setIsAddingColumn(true)}>
                <FiPlus className="h-4 w-4 mr-1" />
                Add Column
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Column name"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
                  className="w-40 h-8"
                  autoFocus
                />
                <Button size="sm" onClick={handleAddColumn}>
                  <FiCheck className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setIsAddingColumn(false); setNewColumnName(''); }}>
                  <FiX className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
        
        <div className="grid gap-4 overflow-x-auto pb-4" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(320px, 1fr))` }}>
          {columns.map((column) => {
            const columnTasks = getTasksByStatus(column.id);
            const isOver = overId === column.id;
            
            return (
              <div 
                key={column.id} 
                className={cn(
                  "rounded-lg border-2 border-dashed p-4 min-h-[600px] transition-all",
                  isOver && "ring-2 ring-primary border-primary"
                )} 
                style={{ backgroundColor: column.color + '10' }}
                id={column.id}
              >
                <div className="flex items-center justify-between mb-4 pb-3 border-b">
                  {editingColumn === column.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editColumnName}
                        onChange={(e) => setEditColumnName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRenameColumn(column.id)}
                        className="h-8"
                        autoFocus
                      />
                      <Button size="sm" onClick={() => handleRenameColumn(column.id)}>
                        <FiCheck className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setEditingColumn(null); setEditColumnName(''); }}>
                        <FiX className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-lg">{column.title}</h4>
                        <Badge variant="outline">{columnTasks.length}</Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => { setEditingColumn(column.id); setEditColumnName(column.title); }}
                        >
                          <FiEdit className="h-3 w-3" />
                        </Button>
                        {!column.is_default && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleDeleteColumn(column.id)}
                            className="text-destructive"
                          >
                            <FiTrash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <SortableContext items={columnTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                  <ScrollArea className="h-[520px] pr-2">
                    <div className="space-y-2">
                      {columnTasks.length > 0 ? (
                        columnTasks.map((task) => (
                          <SortableTask
                            key={task.id}
                            task={task}
                            columnId={column.id}
                            onEdit={() => onEditTask && onEditTask(task)}
                            onDelete={() => onDeleteTask && onDeleteTask(task.id)}
                            getPriorityColor={getPriorityColor}
                          />
                        ))
                      ) : (
                        <div className="text-center py-12 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                          <p className="font-medium">Drop tasks here</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </SortableContext>
              </div>
            );
          })}
        </div>
      </div>

      <DragOverlay>
        {activeTask ? (
          <Card className="p-3 bg-card/95 shadow-2xl rotate-2 border-2 border-primary w-full max-w-[300px]">
            <div className="p-3">
              <div className="font-semibold">{activeTask.title}</div>
              <Badge variant={getPriorityColor(activeTask.priority)} className="text-xs mt-2">{activeTask.priority}</Badge>
            </div>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

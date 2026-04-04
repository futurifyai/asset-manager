import { useState } from "react";
import {
  useListTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useListUsers,
  useGenerateTasksWithAi,
} from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, Pencil, Sparkles, Calendar } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

type Status = "Pending" | "In Progress" | "Completed";

interface TaskForm {
  name: string;
  description: string;
  assignedTo: string;
  progress: number;
  status: Status;
  dueDate: string;
}

const emptyForm: TaskForm = {
  name: "",
  description: "",
  assignedTo: "",
  progress: 0,
  status: "Pending",
  dueDate: "",
};

function statusBadge(status: string) {
  if (status === "Completed") return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
  if (status === "In Progress") return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">In Progress</Badge>;
  return <Badge variant="secondary">Pending</Badge>;
}

export default function Tasks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAiDialog, setShowAiDialog] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null);
  const [form, setForm] = useState<TaskForm>(emptyForm);
  const [aiDescription, setAiDescription] = useState("");
  const [aiAssignedTo, setAiAssignedTo] = useState("none");
  const [generatedTasks, setGeneratedTasks] = useState<Array<{ name: string; description: string; status: string; progress: number; selected: boolean }>>([]);

  const { data: tasksData, isLoading } = useListTasks(
    filterStatus !== "all" ? { status: filterStatus as Status } : undefined
  );
  const { data: usersData } = useListUsers({ role: "worker" });

  const tasks = tasksData?.data ?? [];
  const workers = usersData?.data ?? [];

  const canManage = user?.role === "admin" || user?.role === "manager";

  const createMutation = useCreateTask({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries();
        setShowCreateDialog(false);
        setForm(emptyForm);
        toast({ title: "Task created successfully" });
      },
      onError: () => toast({ variant: "destructive", title: "Failed to create task" }),
    },
  });

  const updateMutation = useUpdateTask({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries();
        setShowEditDialog(false);
        setEditingTaskId(null);
        setForm(emptyForm);
        toast({ title: "Task updated successfully" });
      },
      onError: () => toast({ variant: "destructive", title: "Failed to update task" }),
    },
  });

  const deleteMutation = useDeleteTask({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries();
        setShowDeleteDialog(false);
        setDeletingTaskId(null);
        toast({ title: "Task deleted" });
      },
      onError: () => toast({ variant: "destructive", title: "Failed to delete task" }),
    },
  });

  const aiMutation = useGenerateTasksWithAi({
    mutation: {
      onSuccess: (data) => {
        if (data.data) {
          setGeneratedTasks(data.data.map((t) => ({ ...t, selected: true })));
        }
        toast({ title: "Tasks generated successfully" });
      },
      onError: () => toast({ variant: "destructive", title: "Failed to generate tasks" }),
    },
  });

  const handleCreate = () => {
    createMutation.mutate({
      data: {
        name: form.name,
        description: form.description,
        assignedTo: form.assignedTo ? parseInt(form.assignedTo, 10) : null,
        progress: form.progress,
        status: form.status,
        dueDate: form.dueDate || null,
      },
    });
  };

  const handleEdit = (task: (typeof tasks)[0]) => {
    setEditingTaskId(task.id);
    setForm({
      name: task.name,
      description: task.description,
      assignedTo: task.assignedTo?.toString() ?? "",
      progress: task.progress,
      status: task.status as Status,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
    });
    setShowEditDialog(true);
  };

  const handleUpdate = () => {
    if (!editingTaskId) return;
    updateMutation.mutate({
      id: editingTaskId.toString(),
      data: {
        name: form.name,
        description: form.description,
        assignedTo: form.assignedTo ? parseInt(form.assignedTo, 10) : null,
        progress: form.progress,
        status: form.status,
        dueDate: form.dueDate || null,
      },
    });
  };

  const handleGenerateAi = () => {
    aiMutation.mutate({
      data: {
        projectDescription: aiDescription,
        assignedTo: aiAssignedTo && aiAssignedTo !== "none" ? parseInt(aiAssignedTo, 10) : null,
      },
    });
  };

  const handleCreateAiTasks = async () => {
    const selected = generatedTasks.filter((t) => t.selected);
    for (const task of selected) {
      await new Promise<void>((resolve) => {
        createMutation.mutate(
          {
            data: {
              name: task.name,
              description: task.description,
              status: task.status as Status,
              progress: 0,
              assignedTo: aiAssignedTo && aiAssignedTo !== "none" ? parseInt(aiAssignedTo, 10) : null,
            },
          },
          { onSettled: () => resolve() }
        );
      });
    }
    setShowAiDialog(false);
    setGeneratedTasks([]);
    setAiDescription("");
    queryClient.invalidateQueries();
    toast({ title: `${selected.length} tasks created from AI suggestions` });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground mt-1">
            {canManage ? "Manage and assign tasks to your team" : "Your assigned tasks"}
          </p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowAiDialog(true)} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Generate with AI
            </Button>
            <Button onClick={() => { setForm(emptyForm); setShowCreateDialog(true); }} className="gap-2">
              <Plus className="h-4 w-4" />
              New Task
            </Button>
          </div>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {["all", "Pending", "In Progress", "Completed"].map((s) => (
          <Button
            key={s}
            variant={filterStatus === s ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus(s)}
          >
            {s === "all" ? "All" : s}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">No tasks found</p>
            {canManage && (
              <Button className="mt-4" onClick={() => { setForm(emptyForm); setShowCreateDialog(true); }}>
                Create your first task
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <Card key={task.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-sm">{task.name}</h3>
                      {statusBadge(task.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{task.description}</p>
                    <div className="flex items-center gap-3">
                      <Progress value={task.progress} className="h-2 flex-1" />
                      <span className="text-xs text-muted-foreground w-8 text-right shrink-0">{task.progress}%</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      {task.assignedToUser && <span>Assigned to: <span className="font-medium text-foreground">{task.assignedToUser.username}</span></span>}
                      {task.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(task.dueDate), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(task)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {canManage && (
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => { setDeletingTaskId(task.id); setShowDeleteDialog(true); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Task Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Task Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter task name" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the task..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Assign To</Label>
                <Select value={form.assignedTo} onValueChange={(v) => setForm({ ...form, assignedTo: v })}>
                  <SelectTrigger><SelectValue placeholder="Select worker" /></SelectTrigger>
                  <SelectContent>
                    {workers.map((w) => <SelectItem key={w.id} value={w.id.toString()}>{w.username}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Status })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Progress ({form.progress}%)</Label>
                <Input type="number" min={0} max={100} value={form.progress} onChange={(e) => setForm({ ...form, progress: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.name || createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {canManage && (
              <>
                <div className="space-y-2">
                  <Label>Task Name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>Assign To</Label>
                  <Select value={form.assignedTo} onValueChange={(v) => setForm({ ...form, assignedTo: v })}>
                    <SelectTrigger><SelectValue placeholder="Select worker" /></SelectTrigger>
                    <SelectContent>
                      {workers.map((w) => <SelectItem key={w.id} value={w.id.toString()}>{w.username}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Status })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Progress ({form.progress}%)</Label>
                <Input type="number" min={0} max={100} value={form.progress} onChange={(e) => setForm({ ...form, progress: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            {canManage && (
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deletingTaskId) deleteMutation.mutate({ id: deletingTaskId.toString() }); }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AI Generate Tasks Dialog */}
      <Dialog open={showAiDialog} onOpenChange={(open) => { setShowAiDialog(open); if (!open) { setGeneratedTasks([]); setAiDescription(""); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Generate Tasks with AI
            </DialogTitle>
          </DialogHeader>
          {generatedTasks.length === 0 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Project Description</Label>
                <Textarea
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                  placeholder="Describe your project and what needs to be done..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Assign All Tasks To (optional)</Label>
                <Select value={aiAssignedTo} onValueChange={setAiAssignedTo}>
                  <SelectTrigger><SelectValue placeholder="Select worker" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {workers.map((w) => <SelectItem key={w.id} value={w.id.toString()}>{w.username}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAiDialog(false)}>Cancel</Button>
                <Button onClick={handleGenerateAi} disabled={!aiDescription || aiMutation.isPending} className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  {aiMutation.isPending ? "Generating..." : "Generate Tasks"}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Select the tasks you want to create:</p>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {generatedTasks.map((task, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border border-border/50">
                    <Checkbox
                      checked={task.selected}
                      onCheckedChange={(checked) => {
                        setGeneratedTasks((prev) => prev.map((t, i) => i === idx ? { ...t, selected: !!checked } : t));
                      }}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-medium">{task.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setGeneratedTasks([])}>Back</Button>
                <Button onClick={handleCreateAiTasks} disabled={!generatedTasks.some((t) => t.selected) || createMutation.isPending}>
                  Create {generatedTasks.filter((t) => t.selected).length} Tasks
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

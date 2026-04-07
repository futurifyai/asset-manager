import { useState } from "react";
import {
  useListUsers,
  useCreateUser,
  useDeleteUser,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, ShieldCheck, Briefcase, Wrench } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

type Role = "admin" | "manager" | "worker";

const roleConfig: Record<Role, { label: string; icon: React.ElementType; badge: string }> = {
  admin: { label: "Admin", icon: ShieldCheck, badge: "bg-red-100 text-red-800 hover:bg-red-100" },
  manager: { label: "Manager", icon: Briefcase, badge: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
  worker: { label: "Worker", icon: Wrench, badge: "bg-green-100 text-green-800 hover:bg-green-100" },
};

export default function Users() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [filterRole, setFilterRole] = useState<string>("all");
  // ✅ Added approverEmail to form state
  const [form, setForm] = useState({ username: "", password: "", role: "worker" as Role, approverEmail: "" });

  const { data: usersData, isLoading } = useListUsers(
    filterRole !== "all" ? { role: filterRole as Role } : undefined
  );
  const users = usersData?.data ?? [];

  const createMutation = useCreateUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries();
        setShowCreateDialog(false);
        // ✅ Reset approverEmail too
        setForm({ username: "", password: "", role: "worker", approverEmail: "" });
        toast({ title: "User request sent! Awaiting approver's confirmation." });
      },
      onError: (err: { message?: string }) => toast({ variant: "destructive", title: "Failed to create user", description: err.message }),
    },
  });

  const deleteMutation = useDeleteUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries();
        setShowDeleteDialog(false);
        setDeletingUserId(null);
        toast({ title: "User deleted" });
      },
      onError: () => toast({ variant: "destructive", title: "Failed to delete user" }),
    },
  });

  // ✅ Now sends approverEmail
  const handleCreate = () => {
    if (!form.username || !form.password || !form.approverEmail) return;
    createMutation.mutate({ data: { username: form.username, password: form.password, role: form.role, approverEmail: form.approverEmail } });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground mt-1">Manage your team members and their roles</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {(["admin", "manager", "worker"] as Role[]).map((role) => {
          const cfg = roleConfig[role];
          const count = (usersData?.data ?? []).filter((u) => u.role === role).length;
          return (
            <Card key={role}>
              <CardContent className="p-5 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <cfg.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground capitalize">{role}s</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex gap-2">
        {["all", "admin", "manager", "worker"].map((r) => (
          <Button key={r} variant={filterRole === r ? "default" : "outline"} size="sm" onClick={() => setFilterRole(r)} className="capitalize">
            {r === "all" ? "All Roles" : r + "s"}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>{users.length} user{users.length !== 1 ? "s" : ""} found</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : users.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">No users found</div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => {
                const cfg = roleConfig[user.role as Role];
                return (
                  <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{user.username}</p>
                        <p className="text-xs text-muted-foreground">Joined {format(new Date(user.createdAt), "MMM d, yyyy")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={cfg.badge}>{cfg.label}</Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => { setDeletingUserId(user.id); setShowDeleteDialog(true); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Username</Label>
              <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="Enter username" />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Enter password" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as Role })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="worker">Worker</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* ✅ New approverEmail field */}
            <div className="space-y-2">
              <Label>Approver Email</Label>
              <Input
                type="email"
                value={form.approverEmail}
                onChange={(e) => setForm({ ...form, approverEmail: e.target.value })}
                placeholder="Enter approver's email"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            {/* ✅ Also disabled if approverEmail is empty */}
            <Button onClick={handleCreate} disabled={!form.username || !form.password || !form.approverEmail || createMutation.isPending}>
              {createMutation.isPending ? "Sending..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. All tasks created by this user may be affected.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deletingUserId) deleteMutation.mutate({ id: deletingUserId.toString() }); }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
import { useGetDashboardSummary, useGetRecentTasks } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Clock, ListTodo, Users, TrendingUp, Activity } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  color,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  description?: string;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          </div>
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function statusBadge(status: string) {
  if (status === "Completed") return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
  if (status === "In Progress") return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">In Progress</Badge>;
  return <Badge variant="secondary">Pending</Badge>;
}

export default function Dashboard() {
  const { data: summaryData, isLoading: summaryLoading } = useGetDashboardSummary();
  const { data: recentData, isLoading: recentLoading } = useGetRecentTasks();

  const summary = summaryData?.data;
  const recentTasks = recentData?.data ?? [];

  const pieData = summary
    ? [
        { name: "Completed", value: summary.completedTasks, color: "#10b981" },
        { name: "In Progress", value: summary.inProgressTasks, color: "#3b82f6" },
        { name: "Pending", value: summary.pendingTasks, color: "#f59e0b" },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back. Here's what's happening.</p>
      </div>

      {summaryLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Tasks" value={summary?.totalTasks ?? 0} icon={ListTodo} color="bg-primary/10 text-primary" />
          <StatCard title="Completed" value={summary?.completedTasks ?? 0} icon={CheckCircle} color="bg-green-100 text-green-700" description={`${summary?.completionRate ?? 0}% completion rate`} />
          <StatCard title="In Progress" value={summary?.inProgressTasks ?? 0} icon={Activity} color="bg-blue-100 text-blue-700" />
          <StatCard title="Pending" value={summary?.pendingTasks ?? 0} icon={Clock} color="bg-amber-100 text-amber-700" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Task Distribution
            </CardTitle>
            <CardDescription>Overview of task statuses across all projects</CardDescription>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : pieData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">No tasks yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [value, "Tasks"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Team Overview
            </CardTitle>
            <CardDescription>Current team composition</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {summaryLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Total Team Members</p>
                    <p className="text-sm text-muted-foreground">Across all roles</p>
                  </div>
                  <span className="text-3xl font-bold text-primary">{summary?.totalUsers ?? 0}</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Active Workers</p>
                    <p className="text-sm text-muted-foreground">Assigned to tasks</p>
                  </div>
                  <span className="text-3xl font-bold text-primary">{summary?.totalWorkers ?? 0}</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Completion Rate</p>
                    <p className="text-sm text-muted-foreground">Overall progress</p>
                  </div>
                  <span className="text-3xl font-bold text-primary">{summary?.completionRate ?? 0}%</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest task updates</CardDescription>
        </CardHeader>
        <CardContent>
          {recentLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : recentTasks.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">No recent activity</div>
          ) : (
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-4 p-4 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm truncate">{task.name}</p>
                      {statusBadge(task.status)}
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress value={task.progress} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground w-8 text-right">{task.progress}%</span>
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-muted-foreground">
                      {task.assignedToUser ? task.assignedToUser.username : "Unassigned"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(task.updatedAt), "MMM d")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

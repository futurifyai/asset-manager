import { useGetDashboardSummary, useGetRecentTasks } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Clock, ListTodo, Users, TrendingUp, Activity } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.35, ease: "easeOut" },
  }),
};

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  color,
  index,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  description?: string;
  color: string;
  index: number;
}) {
  return (
    <motion.div custom={index} initial="hidden" animate="visible" variants={fadeUp}>
      <Card className="hover:shadow-md transition-shadow duration-200">
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
    </motion.div>
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
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back. Here's what's happening.</p>
      </motion.div>

      {summaryLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard index={0} title="Total Tasks" value={summary?.totalTasks ?? 0} icon={ListTodo} color="bg-primary/10 text-primary" />
          <StatCard index={1} title="Completed" value={summary?.completedTasks ?? 0} icon={CheckCircle} color="bg-green-100 text-green-700" description={`${summary?.completionRate ?? 0}% completion rate`} />
          <StatCard index={2} title="In Progress" value={summary?.inProgressTasks ?? 0} icon={Activity} color="bg-blue-100 text-blue-700" />
          <StatCard index={3} title="Pending" value={summary?.pendingTasks ?? 0} icon={Clock} color="bg-amber-100 text-amber-700" />
        </div>
      )}

      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.35, ease: "easeOut" }}
      >
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
                {[
                  { label: "Total Team Members", sub: "Across all roles", value: summary?.totalUsers ?? 0 },
                  { label: "Active Workers", sub: "Assigned to tasks", value: summary?.totalWorkers ?? 0 },
                  { label: "Completion Rate", sub: "Overall progress", value: `${summary?.completionRate ?? 0}%` },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.08, duration: 0.3 }}
                  >
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.sub}</p>
                    </div>
                    <span className="text-3xl font-bold text-primary">{item.value}</span>
                  </motion.div>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.35, ease: "easeOut" }}
      >
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
                {recentTasks.map((task, i) => (
                  <motion.div
                    key={task.id}
                    className="flex items-center gap-4 p-4 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.55 + i * 0.07, duration: 0.3 }}
                  >
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
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

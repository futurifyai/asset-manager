import { useGetReportsOverview } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, CheckCircle, BarChart } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  Pending: "#f59e0b",
  "In Progress": "#3b82f6",
  Completed: "#10b981",
};

export default function Reports() {
  const { data: reportsData, isLoading } = useGetReportsOverview();
  const report = reportsData?.data;

  const pieData = report?.statusBreakdown.filter((s) => s.count > 0).map((s) => ({
    name: s.status,
    value: s.count,
    color: STATUS_COLORS[s.status] ?? "#94a3b8",
  })) ?? [];

  const workerChartData = report?.workerPerformance.map((w) => ({
    name: w.username,
    total: w.totalTasks,
    completed: w.completedTasks,
    rate: w.completionRate,
  })) ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground mt-1">Performance insights and analytics</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Card key={i}><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <BarChart className="h-4 w-4 text-primary" />
                <p className="text-sm text-muted-foreground">Total Tasks</p>
              </div>
              <p className="text-3xl font-bold">{report?.totalTasks ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
              <p className="text-3xl font-bold">{report?.completedTasks ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
              <p className="text-3xl font-bold">{report?.inProgressTasks ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-amber-600" />
                <p className="text-sm text-muted-foreground">Completion Rate</p>
              </div>
              <p className="text-3xl font-bold">{report?.completionRate ?? 0}%</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Task Status Breakdown</CardTitle>
            <CardDescription>Distribution of tasks by current status</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-64 w-full" /> : pieData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">No data</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [value, "Tasks"]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-4">
                  {report?.statusBreakdown.map((s) => (
                    <div key={s.status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS[s.status] }} />
                        <span className="text-sm">{s.status}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={s.percentage} className="w-24 h-1.5" />
                        <span className="text-sm text-muted-foreground w-12 text-right">{s.count} ({s.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Worker Performance</CardTitle>
            <CardDescription>Task completion rates per team member</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-64 w-full" /> : workerChartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">No worker data</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <RechartsBarChart data={workerChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" name="Total Tasks" fill="#94a3b8" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[2, 2, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Worker Performance Details</CardTitle>
          <CardDescription>Individual completion metrics for each team member</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : (report?.workerPerformance ?? []).length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">No worker data available</div>
          ) : (
            <div className="space-y-3">
              {report?.workerPerformance.map((worker) => (
                <div key={worker.userId} className="p-4 rounded-lg border border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{worker.username}</span>
                      <Badge variant="secondary" className="text-xs">{worker.totalTasks} tasks</Badge>
                    </div>
                    <span className="text-sm font-semibold">{worker.completionRate}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={worker.completionRate} className="h-2 flex-1" />
                    <span className="text-xs text-muted-foreground shrink-0">{worker.completedTasks}/{worker.totalTasks}</span>
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

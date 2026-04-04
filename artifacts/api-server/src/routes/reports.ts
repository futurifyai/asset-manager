import { Router, type IRouter } from "express";
import { db, tasksTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/reports/overview", authMiddleware, async (req, res): Promise<void> => {
  const tasks = await db.select().from(tasksTable);
  const users = await db.select().from(usersTable).where(eq(usersTable.role, "worker"));

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "Completed").length;
  const pendingTasks = tasks.filter((t) => t.status === "Pending").length;
  const inProgressTasks = tasks.filter((t) => t.status === "In Progress").length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const workerPerformance = users.map((worker) => {
    const workerTasks = tasks.filter((t) => t.assignedTo === worker.id);
    const workerCompleted = workerTasks.filter((t) => t.status === "Completed").length;
    const workerCompletionRate = workerTasks.length > 0 ? Math.round((workerCompleted / workerTasks.length) * 100) : 0;
    return {
      userId: worker.id,
      username: worker.username,
      totalTasks: workerTasks.length,
      completedTasks: workerCompleted,
      completionRate: workerCompletionRate,
    };
  });

  const statusBreakdown = [
    { status: "Pending", count: pendingTasks, percentage: totalTasks > 0 ? Math.round((pendingTasks / totalTasks) * 100) : 0 },
    { status: "In Progress", count: inProgressTasks, percentage: totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0 },
    { status: "Completed", count: completedTasks, percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0 },
  ];

  res.json({
    status: true,
    message: "OK",
    data: {
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      completionRate,
      workerPerformance,
      statusBreakdown,
    },
  });
});

export default router;

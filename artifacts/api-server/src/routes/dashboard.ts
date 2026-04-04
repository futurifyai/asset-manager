import { Router, type IRouter } from "express";
import { db, tasksTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/dashboard/summary", authMiddleware, async (req, res): Promise<void> => {
  const user = req.user!;

  let tasks;
  if (user.role === "worker") {
    tasks = await db.select().from(tasksTable).where(eq(tasksTable.assignedTo, user.id));
  } else {
    tasks = await db.select().from(tasksTable);
  }

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "Completed").length;
  const pendingTasks = tasks.filter((t) => t.status === "Pending").length;
  const inProgressTasks = tasks.filter((t) => t.status === "In Progress").length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const allUsers = await db.select().from(usersTable);
  const totalUsers = allUsers.length;
  const totalWorkers = allUsers.filter((u) => u.role === "worker").length;

  res.json({
    status: true,
    message: "OK",
    data: {
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      totalUsers,
      totalWorkers,
      completionRate,
    },
  });
});

router.get("/dashboard/recent-tasks", authMiddleware, async (req, res): Promise<void> => {
  const user = req.user!;

  let tasks;
  if (user.role === "worker") {
    tasks = await db
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.assignedTo, user.id))
      .orderBy(desc(tasksTable.updatedAt))
      .limit(5);
  } else {
    tasks = await db.select().from(tasksTable).orderBy(desc(tasksTable.updatedAt)).limit(5);
  }

  const enriched = await Promise.all(
    tasks.map(async (task) => {
      let assignedToUser = null;
      let createdByUser = null;
      if (task.assignedTo) {
        const [u] = await db.select().from(usersTable).where(eq(usersTable.id, task.assignedTo));
        if (u) assignedToUser = { id: u.id, username: u.username, role: u.role, createdAt: u.createdAt };
      }
      const [c] = await db.select().from(usersTable).where(eq(usersTable.id, task.createdBy));
      if (c) createdByUser = { id: c.id, username: c.username, role: c.role, createdAt: c.createdAt };
      return { ...task, assignedToUser, createdByUser };
    })
  );

  res.json({ status: true, message: "OK", data: enriched });
});

export default router;

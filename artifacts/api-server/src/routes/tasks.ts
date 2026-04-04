import { Router, type IRouter } from "express";
import { db, tasksTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authMiddleware, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

async function enrichTask(task: typeof tasksTable.$inferSelect) {
  let assignedToUser = null;
  let createdByUser = null;

  if (task.assignedTo) {
    const [u] = await db.select().from(usersTable).where(eq(usersTable.id, task.assignedTo));
    if (u) assignedToUser = { id: u.id, username: u.username, role: u.role, createdAt: u.createdAt };
  }

  const [c] = await db.select().from(usersTable).where(eq(usersTable.id, task.createdBy));
  if (c) createdByUser = { id: c.id, username: c.username, role: c.role, createdAt: c.createdAt };

  return {
    ...task,
    assignedToUser,
    createdByUser,
  };
}

router.get("/tasks", authMiddleware, async (req, res): Promise<void> => {
  const { status, assignedTo } = req.query as { status?: string; assignedTo?: string };
  const user = req.user!;

  let query = db.select().from(tasksTable);
  const conditions = [];

  if (user.role === "worker") {
    conditions.push(eq(tasksTable.assignedTo, user.id));
  } else if (assignedTo) {
    conditions.push(eq(tasksTable.assignedTo, parseInt(assignedTo, 10)));
  }

  if (status) {
    conditions.push(eq(tasksTable.status, status as "Pending" | "In Progress" | "Completed"));
  }

  let tasks;
  if (conditions.length > 0) {
    tasks = await query.where(and(...conditions));
  } else {
    tasks = await query;
  }

  const enriched = await Promise.all(tasks.map(enrichTask));
  res.json({ status: true, message: "OK", data: enriched });
});

router.post("/tasks", authMiddleware, requireRole("admin", "manager"), async (req, res): Promise<void> => {
  const { name, description, assignedTo, progress, status, dueDate } = req.body ?? {};
  if (!name) {
    res.status(400).json({ status: false, message: "Task name is required" });
    return;
  }

  const [task] = await db.insert(tasksTable).values({
    name,
    description: description ?? "",
    assignedTo: assignedTo ?? null,
    progress: progress ?? 0,
    status: status ?? "Pending",
    dueDate: dueDate ? new Date(dueDate) : null,
    createdBy: req.user!.id,
  }).returning();

  const enriched = await enrichTask(task);
  res.status(201).json({ status: true, message: "Task created", data: enriched });
});

router.get("/tasks/:id", authMiddleware, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ status: false, message: "Invalid ID" });
    return;
  }
  const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, id));
  if (!task) {
    res.status(404).json({ status: false, message: "Task not found" });
    return;
  }
  const enriched = await enrichTask(task);
  res.json({ status: true, message: "OK", data: enriched });
});

router.put("/tasks/:id", authMiddleware, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ status: false, message: "Invalid ID" });
    return;
  }

  const user = req.user!;
  const [existingTask] = await db.select().from(tasksTable).where(eq(tasksTable.id, id));
  if (!existingTask) {
    res.status(404).json({ status: false, message: "Task not found" });
    return;
  }

  // Workers can only update their own assigned tasks (progress/status)
  if (user.role === "worker" && existingTask.assignedTo !== user.id) {
    res.status(403).json({ status: false, message: "Forbidden" });
    return;
  }

  const { name, description, assignedTo, progress, status, dueDate } = req.body ?? {};
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (assignedTo !== undefined) updates.assignedTo = assignedTo;
  if (progress !== undefined) updates.progress = progress;
  if (status !== undefined) updates.status = status;
  if (dueDate !== undefined) updates.dueDate = dueDate ? new Date(dueDate) : null;

  const [task] = await db.update(tasksTable).set(updates).where(eq(tasksTable.id, id)).returning();
  const enriched = await enrichTask(task);
  res.json({ status: true, message: "Task updated", data: enriched });
});

router.delete("/tasks/:id", authMiddleware, requireRole("admin", "manager"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ status: false, message: "Invalid ID" });
    return;
  }
  const [task] = await db.delete(tasksTable).where(eq(tasksTable.id, id)).returning();
  if (!task) {
    res.status(404).json({ status: false, message: "Task not found" });
    return;
  }
  res.json({ status: true, message: "Task deleted" });
});

export default router;

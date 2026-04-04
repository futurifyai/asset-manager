import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { generateToken, authMiddleware } from "../middlewares/auth";

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const { username, password } = req.body ?? {};
  if (!username || !password) {
    res.status(400).json({ status: false, message: "Username and password are required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (!user) {
    res.status(401).json({ status: false, message: "Invalid username or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ status: false, message: "Invalid username or password" });
    return;
  }

  const token = generateToken({ id: user.id, username: user.username, role: user.role as "admin" | "manager" | "worker" });
  res.json({
    status: true,
    message: "Login successful",
    data: {
      token,
      user: { id: user.id, username: user.username, role: user.role, createdAt: user.createdAt },
    },
  });
});

router.post("/auth/register", async (req, res): Promise<void> => {
  const { username, password, role } = req.body ?? {};
  if (!username || !password || !role) {
    res.status(400).json({ status: false, message: "Username, password, and role are required" });
    return;
  }

  const validRoles = ["admin", "manager", "worker"];
  if (!validRoles.includes(role)) {
    res.status(400).json({ status: false, message: "Invalid role" });
    return;
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (existing) {
    res.status(400).json({ status: false, message: "Username already taken" });
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({ username, password: hashed, role }).returning();

  const token = generateToken({ id: user.id, username: user.username, role: user.role as "admin" | "manager" | "worker" });
  res.status(201).json({
    status: true,
    message: "Registration successful",
    data: {
      token,
      user: { id: user.id, username: user.username, role: user.role, createdAt: user.createdAt },
    },
  });
});

router.get("/auth/me", authMiddleware, async (req, res): Promise<void> => {
  const userId = req.user!.id;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ status: false, message: "User not found" });
    return;
  }
  res.json({
    status: true,
    message: "OK",
    data: { id: user.id, username: user.username, role: user.role, createdAt: user.createdAt },
  });
});

export default router;

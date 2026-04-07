import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { sendApprovalEmail } from "../lib/mailer";

const router: IRouter = Router();

function userToDto(user: typeof usersTable.$inferSelect) {
  return { id: user.id, username: user.username, role: user.role, status: user.status, createdAt: user.createdAt };
}

// GET /users
router.get("/users", authMiddleware, requireRole("admin", "manager"), async (req, res): Promise<void> => {
  const { role } = req.query as { role?: string };
  let users;
  if (role) {
    users = await db.select().from(usersTable).where(eq(usersTable.role, role as "admin" | "manager" | "worker"));
  } else {
    users = await db.select().from(usersTable);
  }
  res.json({ status: true, message: "OK", data: users.map(userToDto) });
});

// POST /users - creates pending user and sends approval email
router.post("/users", authMiddleware, requireRole("admin"), async (req, res): Promise<void> => {
  const { username, password, role, approverEmail } = req.body ?? {};

  if (!username || !password || !role || !approverEmail) {
    res.status(400).json({ status: false, message: "Username, password, role, and approverEmail are required" });
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
  const token = randomBytes(32).toString("hex");

  const [user] = await db.insert(usersTable).values({
    username,
    password: hashed,
    role,
    status: "pending",
    approvalToken: token,
    approverEmail,
  }).returning();

  await sendApprovalEmail({
    approverEmail,
    username,
    role,
    token,
    apiBaseUrl: process.env.API_BASE_URL ?? "http://localhost:5000",
  });

  res.status(201).json({ status: true, message: "User creation pending approval. Email sent to approver.", data: userToDto(user) });
});

// GET /users/approve/:token
router.get("/users/approve/:token", async (req, res): Promise<void> => {
  const { token } = req.params;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.approvalToken, token));

  if (!user) {
    res.status(404).send("Invalid or expired approval link.");
    return;
  }

  await db.update(usersTable).set({ status: "approved", approvalToken: null }).where(eq(usersTable.id, user.id));

  res.send(`
    <div style="font-family:Arial;text-align:center;padding:48px;">
      <h2 style="color:#22c55e;">✅ User Approved!</h2>
      <p><b>${user.username}</b> has been approved and can now log in.</p>
    </div>
  `);
});

// GET /users/reject/:token
router.get("/users/reject/:token", async (req, res): Promise<void> => {
  const { token } = req.params;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.approvalToken, token));

  if (!user) {
    res.status(404).send("Invalid or expired approval link.");
    return;
  }

  await db.update(usersTable).set({ status: "rejected", approvalToken: null }).where(eq(usersTable.id, user.id));

  res.send(`
    <div style="font-family:Arial;text-align:center;padding:48px;">
      <h2 style="color:#ef4444;">❌ User Rejected</h2>
      <p><b>${user.username}</b> has been rejected and cannot log in.</p>
    </div>
  `);
});

// GET /users/:id
router.get("/users/:id", authMiddleware, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ status: false, message: "Invalid ID" }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) { res.status(404).json({ status: false, message: "User not found" }); return; }
  res.json({ status: true, message: "OK", data: userToDto(user) });
});

// PUT /users/:id
router.put("/users/:id", authMiddleware, requireRole("admin"), async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ status: false, message: "Invalid ID" }); return; }
  const { username, role } = req.body ?? {};
  const updates: Partial<{ username: string; role: "admin" | "manager" | "worker" }> = {};
  if (username) updates.username = username;
  if (role) updates.role = role;
  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ status: false, message: "User not found" }); return; }
  res.json({ status: true, message: "User updated", data: userToDto(user) });
});

// DELETE /users/:id
router.delete("/users/:id", authMiddleware, requireRole("admin"), async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ status: false, message: "Invalid ID" }); return; }
  const [user] = await db.delete(usersTable).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ status: false, message: "User not found" }); return; }
  res.json({ status: true, message: "User deleted" });
});

export default router;






































// import { Router, type IRouter } from "express";
// import bcrypt from "bcryptjs";
// import { db, usersTable } from "@workspace/db";
// import { eq } from "drizzle-orm";
// import { authMiddleware, requireRole } from "../middlewares/auth";

// const router: IRouter = Router();

// function userToDto(user: typeof usersTable.$inferSelect) {
//   return { id: user.id, username: user.username, role: user.role, createdAt: user.createdAt };
// }

// router.get("/users", authMiddleware, requireRole("admin", "manager"), async (req, res): Promise<void> => {
//   const { role } = req.query as { role?: string };
//   let users;
//   if (role) {
//     users = await db.select().from(usersTable).where(eq(usersTable.role, role as "admin" | "manager" | "worker"));
//   } else {
//     users = await db.select().from(usersTable);
//   }
//   res.json({ status: true, message: "OK", data: users.map(userToDto) });
// });

// router.post("/users", authMiddleware, requireRole("admin"), async (req, res): Promise<void> => {
//   const { username, password, role } = req.body ?? {};
//   if (!username || !password || !role) {
//     res.status(400).json({ status: false, message: "Username, password, and role are required" });
//     return;
//   }
//   const validRoles = ["admin", "manager", "worker"];
//   if (!validRoles.includes(role)) {
//     res.status(400).json({ status: false, message: "Invalid role" });
//     return;
//   }
//   const [existing] = await db.select().from(usersTable).where(eq(usersTable.username, username));
//   if (existing) {
//     res.status(400).json({ status: false, message: "Username already taken" });
//     return;
//   }
//   const hashed = await bcrypt.hash(password, 10);
//   const [user] = await db.insert(usersTable).values({ username, password: hashed, role }).returning();
//   res.status(201).json({ status: true, message: "User created", data: userToDto(user) });
// });

// router.get("/users/:id", authMiddleware, async (req, res): Promise<void> => {
//   const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
//   const id = parseInt(raw, 10);
//   if (isNaN(id)) {
//     res.status(400).json({ status: false, message: "Invalid ID" });
//     return;
//   }
//   const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
//   if (!user) {
//     res.status(404).json({ status: false, message: "User not found" });
//     return;
//   }
//   res.json({ status: true, message: "OK", data: userToDto(user) });
// });

// router.put("/users/:id", authMiddleware, requireRole("admin"), async (req, res): Promise<void> => {
//   const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
//   const id = parseInt(raw, 10);
//   if (isNaN(id)) {
//     res.status(400).json({ status: false, message: "Invalid ID" });
//     return;
//   }
//   const { username, role } = req.body ?? {};
//   const updates: Partial<{ username: string; role: "admin" | "manager" | "worker" }> = {};
//   if (username) updates.username = username;
//   if (role) updates.role = role;

//   const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning();
//   if (!user) {
//     res.status(404).json({ status: false, message: "User not found" });
//     return;
//   }
//   res.json({ status: true, message: "User updated", data: userToDto(user) });
// });

// router.delete("/users/:id", authMiddleware, requireRole("admin"), async (req, res): Promise<void> => {
//   const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
//   const id = parseInt(raw, 10);
//   if (isNaN(id)) {
//     res.status(400).json({ status: false, message: "Invalid ID" });
//     return;
//   }
//   const [user] = await db.delete(usersTable).where(eq(usersTable.id, id)).returning();
//   if (!user) {
//     res.status(404).json({ status: false, message: "User not found" });
//     return;
//   }
//   res.json({ status: true, message: "User deleted" });
// });

// export default router;

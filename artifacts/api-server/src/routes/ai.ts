import { Router, type IRouter } from "express";
import OpenAI from "openai";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

router.post("/ai/generate-tasks", authMiddleware, requireRole("admin", "manager"), async (req, res): Promise<void> => {
  const { projectDescription, assignedTo } = req.body ?? {};
  if (!projectDescription) {
    res.status(400).json({ status: false, message: "Project description is required" });
    return;
  }

  const prompt = `You are a project manager. Given the following project description, generate 5 to 10 specific, actionable tasks.
  
Project: ${projectDescription}

Respond with a JSON array of tasks. Each task must have:
- name: short task name (string)
- description: detailed description of what needs to be done (string)
- status: always "Pending" (string)
- progress: always 0 (number)

Return ONLY the JSON array, no other text.`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.choices[0]?.message?.content ?? "[]";
  logger.info("AI task generation complete");

  let tasks: Array<{ name: string; description: string; status: string; progress: number }> = [];
  try {
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    tasks = JSON.parse(cleaned);
    if (!Array.isArray(tasks)) tasks = [];
  } catch {
    logger.warn("Failed to parse AI response as JSON");
    tasks = [];
  }

  // Normalize and ensure required fields
  tasks = tasks.map((t) => ({
    name: t.name ?? "Untitled Task",
    description: t.description ?? "",
    status: "Pending",
    progress: 0,
    ...(assignedTo ? { assignedTo } : {}),
  }));

  res.json({ status: true, message: "Tasks generated", data: tasks });
});

export default router;

import { Router } from "express";
import { DEFAULT_TEAM, insertScenario } from "../db";
import { scenarioInputSchema } from "../validation";

export const apiRouter = Router();

apiRouter.post("/scenario", async (req, res, next) => {
  const parsed = scenarioInputSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid scenario payload",
      details: parsed.error.flatten(),
    });
    return;
  }

  const input = parsed.data;

  try {
    const row = await insertScenario({
      team: input.team ?? DEFAULT_TEAM,
      env: input.env,
      epic: input.epic,
      scenario: input.scenario,
      identifier: input.identifier,
      link: input.link ?? null,
      data: input.data ? JSON.stringify(input.data) : null,
      note: input.note ?? null,
    });

    res.status(201).json({
      id: row.id,
      team: row.team,
      env: row.env,
      epic: row.epic,
      scenario: row.scenario,
      identifier: row.identifier,
      link: row.link,
      data: row.data ? JSON.parse(row.data) : [],
      note: row.note,
      created_timestamp: row.created_timestamp,
    });
  } catch (err) {
    next(err);
  }
});

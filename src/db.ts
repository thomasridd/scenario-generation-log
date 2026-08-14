import { Pool } from "pg";
import { pgSslConfig } from "./pg-ssl";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

export const pool = new Pool({
  connectionString: databaseUrl,
  ssl: pgSslConfig,
});

export interface ScenarioRow {
  id: number;
  env: string;
  epic: string;
  scenario: string;
  identifier: string;
  link: string | null;
  data: string | null;
  note: string | null;
  created_timestamp: Date;
}

export interface ScenarioListFilters {
  env?: string;
  epic?: string;
  q?: string;
  page: number;
  pageSize: number;
}

export async function insertScenario(input: {
  env: string;
  epic: string;
  scenario: string;
  identifier: string;
  link: string | null;
  data: string | null;
  note: string | null;
}): Promise<ScenarioRow> {
  const { rows } = await pool.query<ScenarioRow>(
    `INSERT INTO scenarios (env, epic, scenario, identifier, link, data, note)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      input.env,
      input.epic,
      input.scenario,
      input.identifier,
      input.link,
      input.data,
      input.note,
    ]
  );
  return rows[0];
}

export async function findScenarioById(
  id: number
): Promise<ScenarioRow | null> {
  const { rows } = await pool.query<ScenarioRow>(
    "SELECT * FROM scenarios WHERE id = $1",
    [id]
  );
  return rows[0] ?? null;
}

export async function updateScenarioNote(
  id: number,
  note: string
): Promise<ScenarioRow | null> {
  const { rows } = await pool.query<ScenarioRow>(
    "UPDATE scenarios SET note = $1 WHERE id = $2 RETURNING *",
    [note, id]
  );
  return rows[0] ?? null;
}

export async function listScenarios(
  filters: ScenarioListFilters
): Promise<{ rows: ScenarioRow[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.env) {
    params.push(filters.env);
    conditions.push(`env = $${params.length}`);
  }
  if (filters.epic) {
    params.push(filters.epic);
    conditions.push(`epic = $${params.length}`);
  }
  if (filters.q) {
    params.push(`%${filters.q}%`);
    conditions.push(
      `(scenario ILIKE $${params.length} OR identifier ILIKE $${params.length})`
    );
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*) FROM scenarios ${whereClause}`,
    params
  );
  const total = Number(countResult.rows[0].count);

  const limit = filters.pageSize;
  const offset = (filters.page - 1) * filters.pageSize;
  const rowsResult = await pool.query<ScenarioRow>(
    `SELECT * FROM scenarios ${whereClause}
     ORDER BY created_timestamp DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  return { rows: rowsResult.rows, total };
}

export async function listDistinctValues(
  column: "env" | "epic"
): Promise<string[]> {
  const { rows } = await pool.query<{ value: string }>(
    `SELECT DISTINCT ${column} AS value FROM scenarios ORDER BY ${column} ASC`
  );
  return rows.map((r) => r.value);
}

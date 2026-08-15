import { Router } from "express";
import {
  findScenarioById,
  listDistinctValues,
  listScenarios,
  updateScenarioNote,
} from "../db";
import { noteInputSchema } from "../validation";

export const webRouter = Router();

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

function parsePositiveInt(
  value: unknown,
  fallback: number,
  max?: number
): number {
  const n = Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) {
    return fallback;
  }
  return max ? Math.min(n, max) : n;
}

function formatTimestamp(value: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(value);
}

function isToday(value: Date): boolean {
  const now = new Date();
  return (
    value.getFullYear() === now.getFullYear() &&
    value.getMonth() === now.getMonth() &&
    value.getDate() === now.getDate()
  );
}

function formatListTimestamp(value: Date): string {
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(value);

  if (isToday(value)) {
    return time;
  }

  const date = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(value);

  return `${time} ${date}`;
}

function toQueryString(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

webRouter.get("/", async (req, res, next) => {
  try {
    const env = typeof req.query.env === "string" ? req.query.env : undefined;
    const epic =
      typeof req.query.epic === "string" ? req.query.epic : undefined;
    const q = typeof req.query.q === "string" ? req.query.q.trim() : undefined;
    const page = parsePositiveInt(req.query.page, 1);
    const pageSize = parsePositiveInt(
      req.query.pageSize,
      DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE
    );

    const [{ rows, total }, envOptions, epicOptions] = await Promise.all([
      listScenarios({ env, epic, q, page, pageSize }),
      listDistinctValues("env"),
      listDistinctValues("epic"),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const currentPage = Math.min(page, totalPages);

    const baseParams = { env, epic, q, pageSize };

    type PaginationItem =
      | { number: number; current: boolean; href: string }
      | { ellipsis: true };

    const paginationItems: PaginationItem[] = [];
    let lastWasEllipsis = false;
    for (let p = 1; p <= totalPages; p++) {
      if (p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1) {
        paginationItems.push({
          number: p,
          current: p === currentPage,
          href: toQueryString({ ...baseParams, page: p }),
        });
        lastWasEllipsis = false;
      } else if (!lastWasEllipsis) {
        paginationItems.push({ ellipsis: true });
        lastWasEllipsis = true;
      }
    }

    const selectedFilterCategories = [];
    if (env) {
      selectedFilterCategories.push({
        heading: { text: "Environment" },
        items: [
          { text: env, href: toQueryString({ ...baseParams, env: undefined, page: 1 }) },
        ],
      });
    }
    if (epic) {
      selectedFilterCategories.push({
        heading: { text: "Epic" },
        items: [
          { text: epic, href: toQueryString({ ...baseParams, epic: undefined, page: 1 }) },
        ],
      });
    }
    if (q) {
      selectedFilterCategories.push({
        heading: { text: "Search" },
        items: [
          { text: q, href: toQueryString({ ...baseParams, q: undefined, page: 1 }) },
        ],
      });
    }

    const pagination =
      totalPages > 1
        ? {
            previous:
              currentPage > 1
                ? { href: toQueryString({ ...baseParams, page: currentPage - 1 }) }
                : undefined,
            next:
              currentPage < totalPages
                ? { href: toQueryString({ ...baseParams, page: currentPage + 1 }) }
                : undefined,
            items: paginationItems,
          }
        : null;

    res.render("index.njk", {
      scenarios: rows.map((row) => ({
        ...row,
        createdFormatted: formatListTimestamp(row.created_timestamp),
      })),
      total,
      totalPages,
      currentPage,
      pageSize,
      envOptions,
      epicOptions,
      filters: { env, epic, q },
      pagination,
      selectedFilterCategories,
      clearFiltersHref: toQueryString({ pageSize }),
      hasFilters: Boolean(env || epic || q),
    });
  } catch (err) {
    next(err);
  }
});

webRouter.get("/scenario/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      res.status(404).render("404.njk");
      return;
    }

    const scenario = await findScenarioById(id);
    if (!scenario) {
      res.status(404).render("404.njk");
      return;
    }

    let data: { field: string; value: string }[] = [];
    if (scenario.data) {
      try {
        data = JSON.parse(scenario.data);
      } catch {
        data = [];
      }
    }

    res.render("scenario.njk", {
      pageTitle: `${scenario.scenario} - Scenario generator log`,
      scenario,
      data,
      createdFormatted: formatTimestamp(scenario.created_timestamp),
    });
  } catch (err) {
    next(err);
  }
});

webRouter.post("/scenario/:id/note", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      res.status(404).render("404.njk");
      return;
    }

    const parsed = noteInputSchema.safeParse({ note: req.body.note ?? "" });
    if (!parsed.success) {
      res.status(400).send("Invalid note");
      return;
    }

    const updated = await updateScenarioNote(id, parsed.data.note);
    if (!updated) {
      res.status(404).render("404.njk");
      return;
    }

    res.redirect(`/scenario/${id}`);
  } catch (err) {
    next(err);
  }
});

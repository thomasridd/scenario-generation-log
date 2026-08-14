import "dotenv/config";
import path from "path";
import express from "express";
import nunjucks from "nunjucks";
import { apiRouter } from "./routes/api";
import { webRouter } from "./routes/web";

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const projectRoot = process.cwd();
const viewsPath = path.join(projectRoot, "src", "views");
nunjucks.configure(
  [
    viewsPath,
    path.join(projectRoot, "node_modules", "govuk-frontend", "dist"),
    path.join(projectRoot, "node_modules", "@ministryofjustice", "frontend"),
  ],
  {
    autoescape: true,
    express: app,
    watch: process.env.NODE_ENV !== "production",
  }
);
app.set("views", viewsPath);
app.set("view engine", "njk");

app.use(express.static(path.join(projectRoot, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", apiRouter);
app.use("/", webRouter);

app.use((req, res) => {
  res.status(404).render("404.njk");
});

app.use(
  (
    err: unknown,
    req: express.Request,
    res: express.Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next: express.NextFunction
  ) => {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
);

app.listen(port, () => {
  console.log(`Scenario generation log listening on http://localhost:${port}`);
});

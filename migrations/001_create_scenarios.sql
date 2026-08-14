CREATE TABLE IF NOT EXISTS scenarios (
  id SERIAL PRIMARY KEY,
  env TEXT NOT NULL,
  epic TEXT NOT NULL,
  scenario TEXT NOT NULL,
  identifier TEXT NOT NULL,
  link TEXT,
  data TEXT,
  note TEXT,
  created_timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS scenarios_created_timestamp_idx ON scenarios (created_timestamp DESC);
CREATE INDEX IF NOT EXISTS scenarios_env_idx ON scenarios (env);
CREATE INDEX IF NOT EXISTS scenarios_epic_idx ON scenarios (epic);

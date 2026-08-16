ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS team TEXT NOT NULL DEFAULT 'development';

CREATE INDEX IF NOT EXISTS scenarios_team_idx ON scenarios (team);

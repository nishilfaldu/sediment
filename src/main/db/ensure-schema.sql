-- Idempotent schema bootstrap. Safe to run on every startup.
-- Source of truth for types/queries is schema.ts; keep this file in sync manually
-- until the app has production users and we need versioned migrations again.

CREATE TABLE IF NOT EXISTS `days` (
	`id` text PRIMARY KEY NOT NULL
);

CREATE TABLE IF NOT EXISTS `items` (
	`id` text PRIMARY KEY NOT NULL,
	`day_id` text NOT NULL,
	`type` text NOT NULL,
	`content` text,
	`source_url` text,
	`title` text,
	`description` text,
	`thumbnail` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`day_id`) REFERENCES `days`(`id`) ON UPDATE no action ON DELETE no action
);

-- Full-text search over item content, title, and description.
-- Uses FTS5 content= mirroring so the virtual table stays in sync
-- with the items table via triggers rather than duplicating data.
CREATE VIRTUAL TABLE IF NOT EXISTS items_fts USING fts5(
  id UNINDEXED,
  day_id UNINDEXED,
  title,
  description,
  content,
  content=items,
  content_rowid=rowid
);

CREATE TRIGGER IF NOT EXISTS items_fts_insert AFTER INSERT ON items BEGIN
  INSERT INTO items_fts (rowid, id, day_id, title, description, content)
  VALUES (new.rowid, new.id, new.day_id, new.title, new.description, new.content);
END;

CREATE TRIGGER IF NOT EXISTS items_fts_update AFTER UPDATE ON items BEGIN
  INSERT INTO items_fts (items_fts, rowid, id, day_id, title, description, content)
  VALUES ('delete', old.rowid, old.id, old.day_id, old.title, old.description, old.content);
  INSERT INTO items_fts (rowid, id, day_id, title, description, content)
  VALUES (new.rowid, new.id, new.day_id, new.title, new.description, new.content);
END;

CREATE TRIGGER IF NOT EXISTS items_fts_delete AFTER DELETE ON items BEGIN
  INSERT INTO items_fts (items_fts, rowid, id, day_id, title, description, content)
  VALUES ('delete', old.rowid, old.id, old.day_id, old.title, old.description, old.content);
END;

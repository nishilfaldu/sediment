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

-- Keep FTS in sync with the items table
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

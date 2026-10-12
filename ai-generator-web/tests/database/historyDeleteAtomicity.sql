\set ON_ERROR_STOP on
-- Synthetic temporary tables only. FK action matches linked catalog metadata:
-- report_export_forms_export_id_fkey: REFERENCES report_exports(id) ON DELETE CASCADE.
CREATE TEMP TABLE report_exports (id integer PRIMARY KEY);
CREATE TEMP TABLE report_forms (id integer PRIMARY KEY);
CREATE TEMP TABLE report_export_forms (
  export_id integer REFERENCES report_exports(id) ON DELETE CASCADE,
  form_id integer REFERENCES report_forms(id) ON DELETE CASCADE
);
-- Force a parent rejection after referential actions have been considered.
CREATE TEMP TABLE export_delete_blocker (export_id integer REFERENCES report_exports(id));
INSERT INTO report_exports VALUES (1);
INSERT INTO report_forms VALUES (10);
INSERT INTO report_export_forms VALUES (1, 10);
INSERT INTO export_delete_blocker VALUES (1);

DO $$
BEGIN
  BEGIN
    DELETE FROM pg_temp.report_exports WHERE id = 1;
    RAISE EXCEPTION 'Expected parent delete to fail';
  EXCEPTION WHEN foreign_key_violation THEN
    NULL;
  END;
  IF (SELECT count(*) FROM pg_temp.report_exports) <> 1
     OR (SELECT count(*) FROM pg_temp.report_export_forms) <> 1 THEN
    RAISE EXCEPTION 'Rejected parent deletion removed history or links';
  END IF;

  DELETE FROM pg_temp.export_delete_blocker WHERE export_id = 1;
  DELETE FROM pg_temp.report_exports WHERE id = 1;
  IF EXISTS (SELECT FROM pg_temp.report_exports)
     OR EXISTS (SELECT FROM pg_temp.report_export_forms) THEN
    RAISE EXCEPTION 'Successful parent deletion did not cascade';
  END IF;
  IF (SELECT count(*) FROM pg_temp.report_forms) <> 1 THEN
    RAISE EXCEPTION 'Deleting history unexpectedly removed a source report';
  END IF;
  RAISE NOTICE 'History deletion atomicity scenarios passed';
END;
$$;

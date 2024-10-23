CREATE TABLE "sequin_events" (
    "id" SERIAL PRIMARY KEY,
    "seq" BIGINT NOT NULL,
    "source_database_id" TEXT NOT NULL,
    "source_table_oid" BIGINT NOT NULL,
    "source_table_schema" TEXT NOT NULL, 
    "source_table_name" TEXT NOT NULL,
    "record_pk" TEXT NOT NULL,
    "record" JSONB NOT NULL,
    "changes" JSONB,
    "action" TEXT NOT NULL,
    "committed_at" TIMESTAMP(3) NOT NULL,
    "inserted_at" TIMESTAMP(3) NOT NULL
);

-- CreateIndexes
CREATE UNIQUE INDEX "sequin_events_source_database_id_seq_record_pk_idx" 
ON "sequin_events"("source_database_id", "seq", "record_pk");

CREATE INDEX "sequin_events_committed_at_idx" 
ON "sequin_events"("committed_at");

CREATE INDEX "sequin_events_seq_idx" 
ON "sequin_events"("seq");

CREATE INDEX "sequin_events_source_table_oid_idx" 
ON "sequin_events"("source_table_oid");
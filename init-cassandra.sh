#!/bin/bash
set -e

echo "Waiting for Cassandra to be ready..."
until cqlsh cassandra -e "DESCRIBE CLUSTER" > /dev/null 2>&1; do
  echo "Cassandra not ready yet, retrying in 5s..."
  sleep 5
done

echo "Cassandra is ready. Initializing schema..."

cqlsh cassandra << EOF
CREATE KEYSPACE IF NOT EXISTS dms
  WITH replication = {'class': 'SimpleStrategy', 'replication_factor': '1'}
  AND durable_writes = true;

DROP TABLE IF EXISTS dms.comments;

CREATE TABLE IF NOT EXISTS dms.comments (
  doc_id     bigint,
  comment_id timeuuid,
  text       text,
  author     text,
  user_id    bigint,
  created_at timestamp,
  PRIMARY KEY ((doc_id), comment_id)
) WITH CLUSTERING ORDER BY (comment_id DESC);
EOF

echo "Cassandra schema initialization complete."
exit 0

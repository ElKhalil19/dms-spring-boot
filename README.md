# dms-spring-boot

## C2 — Documents Service as Kafka Producer

### Topic

| Property | Value |
|---|---|
| Topic name | `dms.documents.uploaded` |
| Partitions | **3** |
| Replication factor | 1 (single-broker dev setup) |

The topic is created explicitly by:
1. **Kafka-init container** (`kafka-init` in `docker-compose.yml`) — runs `kafka-topics.sh --create` at stack startup.
2. **Spring `NewTopic` bean** (`KafkaTopicConfig`) — idempotently creates the topic if it does not already exist when the application connects to the broker.

### Event payload (`DocumentUploadedEvent`)

| Field | Type | Description |
|---|---|---|
| `eventId` | `String` (UUID) | Unique, random event identifier for idempotent consumers |
| `eventTimestamp` | `Instant` | When the event was produced |
| `documentId` | `Long` | Primary key of the persisted `Document` entity |
| `title` | `String` | Human-readable document name |
| `documentCreatedAt` | `LocalDateTime` | Timestamp the document row was first persisted |

**Deliberately left out:**

| Omitted field | Reason |
|---|---|
| Raw file bytes | Far too large for a Kafka message; consumers should fetch from storage directly |
| ACL / permission data | Managed by a dedicated IAM layer; a snapshot would go stale and create consistency issues |
| Tenant / user ID | Not present in the current `Document` entity; add when multi-tenancy is introduced |

### Message key

`documentId` (as a `String`) is used as the Kafka message key.

**Why:** All events for the same document land on the same partition, preserving per-document ordering. This is important if a consumer needs to process a sequence of lifecycle events (uploaded → scanned → approved) for a single document in order.

### Where the event is published

`DocumentService.addDocument()` calls `DocumentEventProducer.publishDocumentUploaded()` **after** the document has been successfully persisted to PostgreSQL via `repository.save()`. Publishing is fire-and-forget (async); a failure to reach Kafka is logged but does not roll back the database transaction, keeping the two concerns loosely coupled.

## Local stack (Docker Compose)

The default `docker-compose.yml` brings up:

- **gateway** (`:8080`) – API entry point and JWT authentication
- **documents** (`:8081`) – PostgreSQL + Redis-backed document store
- **comments** (`:8083`) – Cassandra-backed comments store
- **s3** (`:8010`) + **minio** (`:9000`) – presigned uploads and binary storage
- **kafka** + **zookeeper** – event streaming
- **kafka-consumer** – Python consumer for document events
- **frontend** (`:5173`) – UI served from Nginx

Before uploading files, create the `ensue` bucket in MinIO (http://localhost:9001) using the credentials above.

### Required environment variables

The services rely on these defaults (override via env vars if needed):

| Service | Variable | Default |
|---|---|---|
| documents | `SPRING_DATASOURCE_URL` | `jdbc:postgresql://postgres:5432/dms` |
| documents | `SPRING_DATASOURCE_USERNAME` | `postgres` |
| documents | `SPRING_DATASOURCE_PASSWORD` | `postgres` |
| documents | `SPRING_REDIS_HOST` | `redis` |
| documents | `KAFKA_BOOTSTRAP_SERVERS` | `kafka:29092` |
| comments | `CASSANDRA_CONTACT_POINTS` | `cassandra` |
| s3 | `APP_S3_ENDPOINT` | `http://minio:9000` |
| s3 | `APP_S3_ACCESS_KEY` | `admin` |
| s3 | `APP_S3_SECRET_KEY` | `ensia123456` |
| s3 | `APP_S3_BUCKET` | `ensue` |
| gateway | `APP_JWT_SECRET` | **required** |
| kafka-consumer | `KAFKA_BOOTSTRAP_SERVERS` | `kafka:29092` |
| kafka-consumer | `KAFKA_TOPIC` | `dms.documents.uploaded` |

## Kubernetes manifests

Kubernetes manifests live under [`k8s/`](./k8s). Apply them in this order:

1. `redis.yaml`, `postgres.yaml`, `cassandra.yaml`, `minio.yaml`
2. `zookeeper.yaml`, `kafka.yaml`, `kafka-init-job.yaml`
3. `gateway-secret.yaml` (edit the secret value first)
4. `documents.yaml`, `comments.yaml`, `s3.yaml`, `gateway.yaml`, `kafka-consumer.yaml`, `frontend.yaml`

For Docker Compose, set `APP_JWT_SECRET` in your environment (or a `.env` file) before running.

The manifests assume images tagged as:

- `dms-documents:latest`
- `dms-comments:latest`
- `dms-s3:latest`
- `dms-gateway:latest`
- `dms-kafka-consumer:latest`
- `dms-frontend:latest`

## Primary scenario demo checklist

1. Start the stack with `docker compose up --build` (set `APP_JWT_SECRET` first).
2. Login as `admin@dms.com / admin123`.
3. Open **Admin → Departments**:
   - Create departments: `Finance`, `IT`
   - Create categories: `General`, `Administrative`, `Training`
4. Open **Admin → Users** and create:
   - `u1@ensia.dz`
   - `u2@ensia.dz`
   - `u3@ensia.dz`
5. Back in **Admin → Departments**, assign:
   - `u1` to `IT`
   - `u2` to `Finance`
   - `u3` to both `IT` and `Finance`
6. Login as `u1`, upload a PDF to IT, then add a comment from the document detail page.
7. Login as `u2`, verify only Finance documents are visible, then upload a PDF to Finance.
8. Login as `u3`, verify both IT and Finance documents are visible and downloadable.
9. If `translatedTitle` is produced by downstream processing, the document detail page shows it instead of the raw title.

## Notes on scope

- S3 upload/download is wired through pre-signed URLs and frontend proxying for local/dev compatibility.
- Department access control for document and comment APIs is enforced in the gateway proxy.
- Authentication remains gateway-local JWT in this repository (not a separate auth microservice).

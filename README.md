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


import json
import os
import sys
from datetime import datetime

from kafka import KafkaConsumer


def log(message):
    timestamp = datetime.utcnow().isoformat()
    print(f"[{timestamp}] {message}", flush=True)


def main():
    bootstrap_servers = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
    topic = os.getenv("KAFKA_TOPIC", "dms.documents.uploaded")
    group_id = os.getenv("KAFKA_GROUP_ID", "dms-documents-consumer")

    log(f"Starting consumer for topic={topic} bootstrap={bootstrap_servers}")

    consumer = KafkaConsumer(
        topic,
        bootstrap_servers=bootstrap_servers.split(","),
        group_id=group_id,
        auto_offset_reset="earliest",
        enable_auto_commit=True,
        value_deserializer=lambda m: json.loads(m.decode("utf-8")),
    )

    try:
        for message in consumer:
            payload = message.value
            log(f"Received event: {json.dumps(payload)}")
    except KeyboardInterrupt:
        log("Consumer shutting down.")
    except Exception as exc:
        log(f"Consumer error: {exc}")
        sys.exit(1)


if __name__ == "__main__":
    main()

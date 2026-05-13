import json
import os
import re
import sys
from abc import ABC, abstractmethod
from datetime import datetime
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from kafka import KafkaConsumer, KafkaProducer


def log(message):
    timestamp = datetime.utcnow().isoformat()
    print(f"[{timestamp}] {message}", flush=True)


class TranslationClient(ABC):
    @abstractmethod
    def translate(self, text, source_language, target_language):
        raise NotImplementedError


class HttpTranslationClient(TranslationClient):
    def __init__(self, endpoint, api_key=None, timeout_seconds=20):
        self.endpoint = endpoint
        self.api_key = api_key
        self.timeout_seconds = timeout_seconds

    def translate(self, text, source_language, target_language):
        payload = json.dumps({
            "text": text,
            "sourceLanguage": source_language,
            "targetLanguage": target_language,
        }).encode("utf-8")
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        request = Request(self.endpoint, data=payload, headers=headers, method="POST")
        try:
            with urlopen(request, timeout=self.timeout_seconds) as response:
                body = response.read().decode("utf-8")
        except (HTTPError, URLError) as exc:
            raise RuntimeError(f"Translation API call failed: {exc}") from exc

        parsed = json.loads(body) if body else {}
        translated = parsed.get("translatedText") or parsed.get("translation") or parsed.get("text")
        if not translated:
            raise RuntimeError("Translation API response missing translated text")
        return translated


class PlaceholderTranslationClient(TranslationClient):
    def translate(self, text, source_language, target_language):
        return f"[{target_language.upper()}] {text}"


def detect_source_language(text, configured):
    # Basic heuristic fallback only; replace with a dedicated language detection
    # service/library if higher accuracy is required in production.
    if configured and configured != "auto":
        return configured.lower()
    normalized = text.lower()
    if any(ch in normalized for ch in "éèêàùçôîïâûœ"):
        return "fr"
    english_markers = [" the ", " and ", " is ", " are ", " of ", " to "]
    padded = f" {normalized} "
    if any(marker in padded for marker in english_markers):
        return "en"
    if re.fullmatch(r"[\x00-\x7F\s\d\W]+", text or ""):
        return "en"
    return "fr"


def target_for_source(source_language):
    return "fr" if source_language == "en" else "en"


def entity_payload(topic, payload):
    if topic.endswith("documents.created"):
        return {
            "entityType": "DOCUMENT",
            "entityId": str(payload.get("documentId")),
            "documentId": payload.get("documentId"),
            "text": payload.get("title", ""),
            "sourceLanguage": payload.get("sourceLanguage", "auto"),
        }
    if topic.endswith("comments.created"):
        return {
            "entityType": "COMMENT",
            "entityId": payload.get("commentId"),
            "documentId": payload.get("documentId"),
            "text": payload.get("text", ""),
            "sourceLanguage": payload.get("sourceLanguage", "auto"),
        }
    return None


def main():
    bootstrap_servers = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
    document_topic = os.getenv("KAFKA_DOCUMENT_TOPIC", "dms.documents.created")
    comment_topic = os.getenv("KAFKA_COMMENT_TOPIC", "dms.comments.created")
    translation_topic = os.getenv("KAFKA_TRANSLATION_TOPIC", "dms.translations.completed")
    group_id = os.getenv("KAFKA_GROUP_ID", "dms-translation-consumer")

    provider = os.getenv("TRANSLATION_PROVIDER", "placeholder").lower()
    translation_api_url = os.getenv("TRANSLATION_API_URL", "")
    translation_api_key = os.getenv("TRANSLATION_API_KEY", "")

    if provider == "http" and translation_api_url:
        client = HttpTranslationClient(translation_api_url, translation_api_key)
        log(f"Using HTTP translation provider at {translation_api_url}")
    else:
        client = PlaceholderTranslationClient()
        log("Using placeholder translation provider (configure TRANSLATION_PROVIDER=http and TRANSLATION_API_URL to use external API)")

    consumer = KafkaConsumer(
        document_topic,
        comment_topic,
        bootstrap_servers=bootstrap_servers.split(","),
        group_id=group_id,
        auto_offset_reset="earliest",
        enable_auto_commit=True,
        value_deserializer=lambda m: json.loads(m.decode("utf-8")),
    )

    producer = KafkaProducer(
        bootstrap_servers=bootstrap_servers.split(","),
        value_serializer=lambda v: json.dumps(v).encode("utf-8"),
        key_serializer=lambda v: ("" if v is None else str(v)).encode("utf-8"),
    )

    log(
        "Starting translation consumer for "
        f"topics={document_topic},{comment_topic} bootstrap={bootstrap_servers} output={translation_topic}"
    )

    try:
        for message in consumer:
            payload = message.value
            mapped = entity_payload(message.topic, payload)
            if not mapped or not mapped.get("text"):
                continue

            source_language = detect_source_language(mapped["text"], mapped.get("sourceLanguage"))
            target_language = target_for_source(source_language)

            try:
                translated_text = client.translate(mapped["text"], source_language, target_language)
            except Exception as exc:
                log(f"Translation failed for {mapped['entityType']}:{mapped['entityId']}: {exc}")
                continue

            result = {
                "entityType": mapped["entityType"],
                "entityId": mapped["entityId"],
                "documentId": mapped.get("documentId"),
                "translatedText": translated_text,
                "sourceLanguage": source_language,
                "targetLanguage": target_language,
            }

            producer.send(translation_topic, key=mapped["entityId"], value=result)
            log(f"Published translation result: {json.dumps(result)}")
    except KeyboardInterrupt:
        log("Consumer shutting down.")
    except Exception as exc:
        log(f"Consumer error: {exc}")
        sys.exit(1)


if __name__ == "__main__":
    main()

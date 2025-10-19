# Elasticsearch Setup for Onebox Email Aggregator

This application uses Elasticsearch for powerful email search functionality. You can run Elasticsearch using Docker.

## Quick Start with Docker

### Option 1: Using Docker Run (Simplest)

```bash
docker run -d \
  --name elasticsearch \
  -p 9200:9200 \
  -p 9300:9300 \
  -e "discovery.type=single-node" \
  -e "xpack.security.enabled=false" \
  -e "ES_JAVA_OPTS=-Xms512m -Xmx512m" \
  docker.elastic.co/elasticsearch/elasticsearch:8.11.0
```

### Option 2: Using Docker Compose

Create a `docker-compose.yml` file:

```yaml
version: '3.8'
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: elasticsearch
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
      - "9300:9300"
    volumes:
      - esdata:/usr/share/elasticsearch/data

volumes:
  esdata:
```

Then run:
```bash
docker-compose up -d
```

## Verify Elasticsearch is Running

```bash
curl http://localhost:9200
```

You should see a JSON response with Elasticsearch cluster information.

## Environment Variable

Add this to your `.env` file:
```
ELASTICSEARCH_URL=http://localhost:9200
```

## Note

The application will gracefully handle Elasticsearch being unavailable and fallback to in-memory search. However, for the best search experience and full feature functionality, running Elasticsearch is highly recommended.

## Stopping Elasticsearch

```bash
# If using docker run
docker stop elasticsearch

# If using docker-compose
docker-compose down
```

## Removing Data

```bash
# If using docker run
docker rm elasticsearch

# If using docker-compose
docker-compose down -v
```

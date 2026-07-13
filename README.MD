# TicketFlow local Docker environment

The local stack runs the TicketFlow API, its data services, Keycloak, the NGINX gateway, and observability tools on one Docker network. The backend listens on `0.0.0.0:5000`; public application traffic should normally use NGINX on port `8080`.

## Prerequisites and configuration

- Docker Desktop with Docker Compose v2
- Enough Docker memory for two PostgreSQL instances, Keycloak, Grafana, Prometheus, Jaeger, and Meilisearch
- The host ports listed below must be available

Copy `.env.example` to `.env`, replace every `change-me` value, and keep `.env` out of source control. Do not change `KEYCLOAK_PUBLIC_URL` unless the browser-facing gateway URL changes: its realm URL becomes the token issuer and must exactly match backend validation.

## Start, rebuild, logs, and stop

```bash
docker compose config
docker compose up -d --build
docker compose ps
```

Force a clean image rebuild without deleting persistent data:

```bash
docker compose build --no-cache
docker compose up -d
```

Follow all logs or inspect one service:

```bash
docker compose logs -f --tail=200
docker compose logs --tail=200 backend-api
docker compose logs --tail=200 keycloak
```

Stop containers while preserving data:

```bash
docker compose down
```

## Database and Prisma

The backend container runs `prisma migrate deploy` before starting the API. The same operations can be checked manually:

```bash
docker compose exec backend-api npx prisma validate
docker compose exec backend-api npx prisma generate
docker compose exec backend-api npx prisma migrate deploy
docker compose run --rm backend-api npm run build
```

The seed uses category upserts and is safe to rerun:

```bash
docker compose exec backend-api npx prisma db seed
```

Never use `docker compose down -v`, `docker volume rm`, or `prisma migrate reset` casually. Those commands delete persistent local database or service data. Back up anything important and resolve migration history problems before considering a reset.

## Health and gateway checks

```bash
curl -i http://localhost:8080/gateway-health
curl -i http://localhost:8080/health
curl -i http://localhost:8080/ready
curl -i http://localhost:8080/metrics
curl -i http://localhost:8080/api/tickets
curl -i http://localhost:8080/keycloak/realms/ticketflow/.well-known/openid-configuration
docker compose exec nginx nginx -t
```

`/api/tickets` returns `401 Unauthorized` without a bearer token; that confirms the request reached the API authentication middleware. `/ready` returns `503` until PostgreSQL, Redis, Keycloak JWKS, and Meilisearch are reachable.

## Service URLs and ports

| Service | Host URL or port | Container endpoint |
| --- | --- | --- |
| NGINX gateway | <http://localhost:8080> | `nginx:80` |
| Backend direct debugging | <http://localhost:5000> | `backend-api:5000` |
| Keycloak through gateway | <http://localhost:8080/keycloak> | `keycloak:8080/keycloak` |
| Keycloak direct | <http://localhost:8081/keycloak> | `keycloak:8080/keycloak` |
| Keycloak management | <http://localhost:9000> | `keycloak:9000` |
| PostgreSQL | `localhost:5432` | `postgres:5432` |
| Redis | `localhost:6379` | `redis:6379` |
| Meilisearch | <http://localhost:7700> | `meilisearch:7700` |
| Prometheus | <http://localhost:9090> | `prometheus:9090` |
| Grafana | <http://localhost:3001> | `grafana:3000` |
| Jaeger UI | <http://localhost:16686> | `jaeger:16686` |
| Jaeger OTLP | `localhost:4317` / `localhost:4318` | `jaeger:4317` / `jaeger:4318` |

Change only the host-side values in `.env` if a port conflicts. Keep container ports and Docker service names unchanged. In particular, the API remains `backend-api:5000`, Grafana remains `grafana:3000`, and Keycloak remains `keycloak:8080` internally.

## Troubleshooting

### NGINX returns 502

Run `docker compose ps`, inspect `backend-api` and `nginx` logs, and test `docker compose exec nginx nginx -t`. Confirm the backend is healthy and listening on `0.0.0.0:5000`; NGINX must target `backend-api:5000`, never `localhost`.

### Keycloak issuer or signature errors

Check discovery at the gateway URL and compare its `issuer` with `KEYCLOAK_ISSUER_URL`. The expected issuer is `http://localhost:8080/keycloak/realms/ticketflow`. The backend intentionally downloads keys from the separate internal URL `http://keycloak:8080/keycloak/realms/ticketflow/protocol/openid-connect/certs`. Also verify the token audience is `ticketflow-api` and its authorized party is listed in `KEYCLOAK_ALLOWED_CLIENTS`.

Realm import runs only when the `ticketflow` realm is absent. Editing the import JSON does not overwrite an existing realm in the persistent Keycloak database.

### Prisma generation or migration errors

Inspect `backend-api` and `postgres` logs, verify `DATABASE_URL` uses hostname `postgres` inside Compose, then rerun `prisma validate`, `prisma generate`, and `prisma migrate deploy`. Do not reset the database merely to bypass a failed migration; inspect `_prisma_migrations` and the migration SQL first.

### Redis authentication errors

Keep `REDIS_PASSWORD` consistent for Redis, backend, and worker. Compose constructs the internal URL as `redis://:<password>@redis:6379`; containers must not use `localhost` for Redis.

## Worker status

The worker is intentionally a long-running placeholder. It handles `SIGINT` and `SIGTERM` cleanly and does not register queue processors yet.

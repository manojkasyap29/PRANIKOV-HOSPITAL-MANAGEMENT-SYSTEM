## Kafka Docker / Host networking notes

If Kafka runs in Docker but your application runs on the host (or outside the Docker network), the Kafka broker must advertise an address that the client can resolve and reach. Common fixes:

1. Configure the broker's `advertised.listeners` to an address reachable by the client.

Example `server.properties` (inside broker container):

```
listeners=PLAINTEXT://0.0.0.0:9092
advertised.listeners=PLAINTEXT://localhost:9092
```

Use `localhost:9092` if Docker Desktop forwards the broker port to the host. If using a remote host or VM, set `advertised.listeners=PLAINTEXT://<host-ip>:9092`.

2. Docker Compose example (app and kafka in same compose network):

```yaml
version: '3.8'
services:
  zookeeper:
    image: bitnami/zookeeper:latest
    environment:
      - ALLOW_ANONYMOUS_LOGIN=yes
  kafka:
    image: bitnami/kafka:latest
    environment:
      - KAFKA_BROKER_ID=1
      - KAFKA_ZOOKEEPER_CONNECT=zookeeper:2181
      - KAFKA_LISTENERS=PLAINTEXT://0.0.0.0:9092
      - KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://kafka:9092
    depends_on:
      - zookeeper
  app:
    image: your-app-image
    environment:
      - SPRING_KAFKA_BOOTSTRAP_SERVERS=kafka:9092
    depends_on:
      - kafka
```

- If the app is outside Docker, do NOT advertise `kafka:9092` (a container hostname) — advertise an address resolvable by the client instead (e.g., `localhost` or the host's IP).
- After changing broker config, restart the broker for changes to take effect.

3. Quick verification commands (run on the host where app runs):

```powershell
# DNS check
ping kafka

# Check environment override for spring kafka bootstrap
Get-ChildItem Env:SPRING_KAFKA_BOOTSTRAP_SERVERS

# Start the app forcing localhost bootstrap
java -jar demo-0.0.1-SNAPSHOT.jar --spring.kafka.bootstrap-servers=localhost:9092
```

If you want, I can help craft the exact `advertised.listeners` you need given whether you're using Docker Desktop, Linux Docker, WSL2, or a remote VM. Provide how Kafka is being run and I'll tailor the snippet.

---

Common scenarios and exact settings

1) App on host (Windows) + Kafka in Docker Desktop

 - In broker config (or docker env), set listeners to bind to 0.0.0.0 and advertise `host.docker.internal` so the host can connect:

```properties
# server.properties (or via container env)
listeners=PLAINTEXT://0.0.0.0:9092
advertised.listeners=PLAINTEXT://host.docker.internal:9092
```

Or with Docker images that accept env vars (Confluent/Bitnami):

```yaml
environment:
  - KAFKA_LISTENERS=PLAINTEXT://0.0.0.0:9092
  - KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://host.docker.internal:9092
  # Bitnami variant
  - KAFKA_CFG_LISTENERS=PLAINTEXT://0.0.0.0:9092
  - KAFKA_CFG_ADVERTISED_LISTENERS=PLAINTEXT://host.docker.internal:9092
```

2) App on host + Kafka in Docker on a remote Linux VM or WSL2

 - Determine the host/VM IP reachable from your machine (e.g., use `ipconfig` on Windows or `hostname -I` inside the VM/WSL2). Then set advertised listeners to that IP:

```properties
listeners=PLAINTEXT://0.0.0.0:9092
advertised.listeners=PLAINTEXT://<host-ip>:9092
```

Replace `<host-ip>` with the VM's IP address.

3) App inside Docker Compose with Kafka in same compose

 - Use service name `kafka` as advertised listener and set the app's `SPRING_KAFKA_BOOTSTRAP_SERVERS=kafka:9092`.

```yaml
services:
  kafka:
    image: bitnami/kafka:latest
    environment:
      - KAFKA_LISTENERS=PLAINTEXT://0.0.0.0:9092
      - KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://kafka:9092
  app:
    image: your-app
    environment:
      - SPRING_KAFKA_BOOTSTRAP_SERVERS=kafka:9092
```

Verification commands (run on the host where your application runs)

```powershell
# Check whether 'kafka' resolves
ping kafka

# If using Docker Desktop: check host.docker.internal resolves
ping host.docker.internal

# Test TCP connection to bootstrap address
Test-NetConnection -ComputerName localhost -Port 9092
Test-NetConnection -ComputerName host.docker.internal -Port 9092

# Start the jar forcing bootstrap override
java -jar target\demo-0.0.1-SNAPSHOT.jar --spring.kafka.bootstrap-servers=localhost:9092

# If you have Kafka client tools (inside container or installed), list topics
# (run inside container or on a machine that can reach the broker)
docker exec -it <kafka-container> kafka-topics.sh --bootstrap-server localhost:9092 --list
```

Quick troubleshooting checklist

- If logs show `UnknownHostException: kafka` and your app runs on host, change the broker's `advertised.listeners` to `host.docker.internal` or the host IP.
- If your app is intended to run inside Docker, run it in the same compose/network and advertise `kafka:9092`.
- After updating broker config/env, restart the broker container: `docker-compose down && docker-compose up -d` or restart the container.

If you tell me how you run Kafka (Docker Desktop, Docker on Linux VM, WSL2, Kubernetes, or locally), I will produce the precise docker-compose/server.properties snippet and the exact restart commands.
# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jdk-alpine AS build

WORKDIR /workspace

# Install Maven
RUN apk add --no-cache curl && \
    curl -fsSL https://archive.apache.org/dist/maven/maven-3/3.9.9/binaries/apache-maven-3.9.9-bin.tar.gz \
    | tar -xz -C /opt/ && \
    ln -s /opt/apache-maven-3.9.9/bin/mvn /usr/local/bin/mvn

COPY pom.xml .
# Pre-fetch dependencies (cached layer)
RUN mvn dependency:go-offline -B --no-transfer-progress -q

COPY src ./src
RUN mvn package -DskipTests -B --no-transfer-progress -q

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

COPY --from=build /workspace/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-jar", "app.jar"]

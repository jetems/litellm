

# Stage 1: Builder
FROM python:3.13 AS builder
WORKDIR /app
USER root

# Install build dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY . .

# Build Admin UI
# RUN chmod +x docker/build_admin_ui.sh && ./docker/build_admin_ui.sh

WORKDIR /app/ui/litellm-dashboard
RUN chmod +x build_ui.sh && ./build_ui.sh

WORKDIR /app
# Build Wheels
RUN pip install --no-cache-dir build
RUN rm -rf dist/* && python -m build
WORKDIR /app/enterprise
RUN rm -rf dist/* && python -m build
WORKDIR /app/litellm-proxy-extras
RUN rm -rf dist/* && python -m build
# Generate Prisma Client in Builder
WORKDIR /app

# Stage 2: Runtime
FROM python:3.13 AS runtime
WORKDIR /app
USER root

# Install system dependencies (including nodejs for prisma migrations)
RUN apt-get update && apt-get install -y \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements, docker directory, and schema.prisma
# COPY requirements.txt /app/
COPY docker /app/docker/
# COPY schema.prisma /app/

# Copy built wheels from builder
COPY --from=builder \
    /app/requirements.txt \
    /app/schema.prisma \
    /app/dist/*.whl \
    /app/enterprise/dist/*.whl \
    /app/litellm-proxy-extras/dist/*.whl \
    /app/

# Install requirements (excluding specific packages)
# We exclude litellm-enterprise (installed via wheel) 
# and nodejs-wheel-binaries (not needed as we pre-generate prisma client)
RUN grep -v "litellm-enterprise==0.1.27" requirements.txt > requirements.filtered.txt \
    && pip install --no-cache-dir -r requirements.filtered.txt \
    && rm requirements.filtered.txt

# Install the two generated wheels
RUN pip install *.whl \
    && rm -rf *.whl

RUN sed -i 's/\r$//' docker/install_auto_router.sh && chmod +x docker/install_auto_router.sh && ./docker/install_auto_router.sh

# ensure pyjwt is used, not jwt
RUN pip uninstall jwt -y
RUN pip uninstall PyJWT -y
RUN pip install --no-cache-dir PyJWT==2.9.0
RUN prisma generate
# Setup entrypoint scripts permissions
RUN chmod +x docker/entrypoint.sh docker/prod_entrypoint.sh

# Copy supervisor config
COPY docker/supervisord.conf /etc/supervisord.conf

# Expose port
EXPOSE 4000

# Set entrypoint and command
ENTRYPOINT ["docker/prod_entrypoint.sh"]
CMD ["--port", "4000"]
# LiteLLM 本地开发环境配置与部署指南

## 目录

- [环境准备](#环境准备)
- [本地开发配置](#本地开发配置)
- [企业版 License 配置](#企业版-license-配置)
- [打包与发布](#打包与发布)
- [Docker 部署](#docker-部署)

---

## 环境准备

### 系统要求

- **Python**: 3.9 - 3.13
- **Poetry**: 包管理工具
- **PostgreSQL**: 数据库（可选，用于持久化）
- **Redis**: 缓存（可选，用于分布式部署）


### 克隆项目

```bash
git clone https://github.com/BerriAI/litellm.git
cd litellm
```

---

## 安装独立的 poetry 并配置虚拟环境

### 1. 使用 pipx 进行安装 poetry

```bash
pipx install poetry
```

### 2. 使用 uv 设置虚拟环境

```bash
uv venv --python 3.13
source .venv/bin/activate
```

### 3. 让 Poetry 不再创建自己的 venv，而是装进“当前激活的 venv”：

```bash
poetry config virtualenvs.create false --local
make install-proxy-dev
```

### 4. 配置环境变量

创建 `.env` 文件：

```env
# API Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# 开发配置
LITELLM_MASTER_KEY=sk-1234
DATABASE_URL=postgresql://user:password@localhost:5432/litellm
STORE_MODEL_IN_DB=True

# 企业版 License（可选）
LITELLM_LICENSE="eyJleHBpcmF0aW9uX2RhdGUiOi..."
```

### 5. 生成 Prisma Client

如果使用数据库功能：

```bash
cd litellm/proxy
prisma generate
cd ../..
```

### 6. 配置代理服务器

编辑 `proxy_server_config.yaml`：

```yaml
model_list:
  - model_name: gpt-4
    litellm_params:
      model: openai/gpt-4
      api_key: os.environ/OPENAI_API_KEY

litellm_settings:
  drop_params: True
  num_retries: 3
  request_timeout: 600

general_settings:
  master_key: sk-1234
  store_model_in_db: True
```

### 7. 启动开发服务器

```bash
# 激活虚拟环境
source .venv/bin/activate

# 启动 Proxy Server
litellm --config proxy_server_config.yaml --port 4000

# 或使用 poetry run
poetry run litellm --config proxy_server_config.yaml --port 4000
```

### 8. 启动 Dashboard UI（可选）

```bash
cd ui/litellm-dashboard
npm install
npm run dev
```

Dashboard 默认运行在 `http://localhost:3000`

---

## 企业版 License 配置

### 生成自定义 License

```bash
# 激活虚拟环境
source .venv/bin/activate

# 生成 License（365 天有效期，并更新公钥）
python scripts/generate_license.py --days 365 --max-users 1000 --update-public-key
```

### 参数说明

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `--days` | 365 | License 有效期（天） |
| `--max-users` | 1000 | 最大用户数 |
| `--max-teams` | 100 | 最大团队数 |
| `--user-id` | local-dev | 用户标识 |
| `--update-public-key` | False | 是否更新 LiteLLM 公钥 |

### 配置 License

将生成的 License Key 添加到 `.env`：

```env
LITELLM_LICENSE="eyJleHBpcmF0aW9uX2RhdGUiOi..."
```

> [!IMPORTANT]
> 每次生成新的 License 都需要使用 `--update-public-key` 参数，否则签名验证会失败。



---

## 打包与发布

### 1. 构建分发包

```bash
# 构建 sdist 和 wheel
poetry build

# 输出目录
ls dist/
# litellm-x.x.x.tar.gz     (源码包)
# litellm-x.x.x-py3-none-any.whl  (wheel 包)
```
 
### 2. 版本管理

版本号定义在 `pyproject.toml`：

```toml
[tool.poetry]
name = "litellm"
version = "1.80.11"
```

更新版本：

```bash
poetry version patch  # 1.80.11 -> 1.80.12
poetry version minor  # 1.80.11 -> 1.81.0
poetry version major  # 1.80.11 -> 2.0.0
```

### 3. 发布到 PyPI

```bash
# 发布到 PyPI（需要配置凭证）
poetry publish

# 或发布到私有仓库
poetry publish --repository my-private-repo
```

### 4. 本地安装测试

```bash
# 从构建产物安装
pip install dist/litellm-x.x.x-py3-none-any.whl

# 或以可编辑模式安装
pip install -e .
```

---

## Docker 部署

### 1. 使用官方镜像

```bash
docker pull ghcr.io/berriai/litellm:main-latest

docker run -d \
  -p 4000:4000 \
  -v $(pwd)/proxy_server_config.yaml:/app/config.yaml \
  -e OPENAI_API_KEY=$OPENAI_API_KEY \
  -e LITELLM_MASTER_KEY=sk-1234 \
  ghcr.io/berriai/litellm:main-latest \
  --config /app/config.yaml
```

### 2. Docker Compose

创建 `docker-compose.yml`：

```yaml
version: "3.9"
services:
  litellm:
    image: ghcr.io/berriai/litellm:main-latest
    ports:
      - "4000:4000"
    volumes:
      - ./proxy_server_config.yaml:/app/config.yaml
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - LITELLM_MASTER_KEY=sk-1234
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/litellm
      - LITELLM_LICENSE=${LITELLM_LICENSE}  # 企业版
    command: ["--config", "/app/config.yaml"]
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: litellm
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

启动：

```bash
docker-compose up -d
```

### 3. 自定义 Dockerfile

```dockerfile
FROM python:3.12-slim

WORKDIR /app

# 安装依赖
COPY pyproject.toml poetry.lock ./
RUN pip install poetry && poetry install --extras proxy --no-dev

# 复制源码
COPY litellm/ ./litellm/
COPY enterprise/ ./enterprise/

# 复制配置
COPY proxy_server_config.yaml ./config.yaml

EXPOSE 4000

CMD ["poetry", "run", "litellm", "--config", "config.yaml", "--port", "4000"]
```

---

## 常用命令速查

| 命令 | 说明 |
|------|------|
| `make install-dev` | 安装开发依赖 |
| `make install-proxy-dev` | 安装完整 Proxy 依赖 |
| `make test-unit` | 运行单元测试 |
| `make lint` | 代码检查 |
| `make format` | 代码格式化 |
| `poetry build` | 构建分发包 |
| `poetry publish` | 发布到 PyPI |
| `prisma generate` | 生成 Prisma Client |

---

## 故障排除

### 1. uvloop 导入错误

```
ModuleNotFoundError: No module named 'uvloop'
```

**解决方案**：确保使用 Python 3.12+，或安装 uvloop：

```bash
pip install uvloop
```

### 2. Prisma binaries not found

```
prisma_cleanup.PrismaError: Prisma binaries not found
```

**解决方案**：

```bash
cd litellm/proxy && prisma generate && cd ../..
```

### 3. License 验证失败

**解决方案**：确保公钥已更新：

```bash
python scripts/generate_license.py --days 365 --update-public-key
```

### 4. 数据库连接失败

**解决方案**：检查 `DATABASE_URL` 格式：

```
postgresql://用户名:密码@主机:端口/数据库名
```

# Docker 容器部署指南

## 📋 目录

- [快速开始](#快速开始)
- [环境配置](#环境配置)
- [容器管理](#容器管理)
- [数据持久化](#数据持久化)
- [健康检查](#健康检查)
- [日志管理](#日志管理)
- [资源限制](#资源限制)
- [故障排查](#故障排查)

---

## 快速开始

### 开发环境

```bash
# 方式 1: 使用 Makefile (推荐)
make start

# 方式 2: 使用管理脚本
./scripts/docker-manage.sh start

# 方式 3: 使用 Docker Compose
docker compose up -d
```

### 生产环境

```bash
# 构建镜像
make build

# 启动生产环境
make prod

# 或者
docker compose -f docker-compose.prod.yml up -d
```

---

## 环境配置

### 必需的环境变量

创建 `.env` 文件（参考 `.env.example`）：

```bash
# 应用配置
NODE_ENV=development
APP_PORT=3000

# 数据库配置
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=2ch
POSTGRES_PORT=5432

# Redis 配置
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password  # 生产环境必需

# 管理员配置
ADMIN_IP_HASHES=your_ip_hash_here
```

### 开发 vs 生产环境

| 特性 | 开发环境 | 生产环境 |
|------|---------|---------|
| 配置文件 | `docker-compose.yml` | `docker-compose.prod.yml` |
| 代码挂载 | ✓ 热重载 | ✗ 构建镜像 |
| 资源限制 | ✗ 无限制 | ✓ 有限制 |
| 重启策略 | `unless-stopped` | `always` |
| 健康检查间隔 | 10s | 30s |
| 日志保留 | 3 个文件/10MB | 5 个文件/50MB |

---

## 容器管理

### 常用命令

```bash
# 查看状态
make status
# 或
docker compose ps

# 查看日志
make logs           # 所有服务
make logs-api       # 仅 API 服务

# 进入容器
make shell-api      # 进入 API 容器
make shell-db       # 进入数据库 (psql)
make shell-redis    # 进入 Redis (redis-cli)

# 重启服务
make restart
# 或重启单个服务
docker compose restart api

# 停止服务
make stop
```

### 服务说明

#### 1. API 服务 (api)

- **镜像**: `node:20-alpine`
- **端口**: 3000
- **健康检查**: `GET /health`
- **依赖**: postgres (healthy), redis (healthy)

**开发环境特性**:
- 挂载源代码，支持热重载
- 每次启动时运行 `npm install`

**生产环境特性**:
- 使用构建的 Docker 镜像
- 非 root 用户运行
- 资源限制: CPU 1.0, Memory 512M

#### 2. PostgreSQL (postgres)

- **镜像**: `postgres:16-alpine`
- **端口**: 5432
- **数据卷**: `postgres_data`
- **健康检查**: `pg_isready`

**配置优化**:
- UTF-8 编码
- 共享内存: 128MB (dev) / 256MB (prod)
- 自动运行迁移脚本 (生产环境)

#### 3. Redis (redis)

- **镜像**: `redis:7-alpine`
- **端口**: 6379
- **数据卷**: `redis_data`
- **健康检查**: `redis-cli ping`

**配置优化**:
- AOF 持久化
- 最大内存: 256MB (dev) / 512MB (prod)
- LRU 淘汰策略
- 密码保护 (生产环境)

---

## 数据持久化

### Docker Volumes

所有重要数据都存储在 Docker Volumes 中：

```bash
# 查看 volumes
docker volume ls | grep 2ch-core

# Volumes 列表
postgres_data    # PostgreSQL 数据
redis_data       # Redis 数据
```

### 数据位置

在宿主机上，Docker volumes 通常位于：

```
/var/lib/docker/volumes/2ch-core_postgres_data/_data
/var/lib/docker/volumes/2ch-core_redis_data/_data
```

### 备份与恢复

#### 备份数据库

```bash
# 使用 Makefile
make backup

# 手动备份
docker compose exec -T postgres pg_dump -U postgres 2ch > backup.sql
gzip backup.sql
```

备份文件保存在 `./db/backup/` 目录。

#### 恢复数据库

```bash
# 从备份恢复
make restore FILE=./db/backup/2ch_backup_20260110.sql.gz

# 手动恢复
gunzip -c backup.sql.gz | docker compose exec -T postgres psql -U postgres 2ch
```

#### 数据迁移

```bash
# 运行迁移脚本
make migrate

# 手动运行
docker compose exec -T postgres psql -U postgres -d 2ch \
  -f /docker-entrypoint-initdb.d/001_add_boards.sql
```

---

## 健康检查

### 自动健康检查

所有服务都配置了健康检查：

```yaml
api:
  healthcheck:
    test: wget --spider http://localhost:3000/health
    interval: 10s
    timeout: 5s
    retries: 3
    start_period: 30s
```

### 手动检查

```bash
# 检查所有服务
make health

# 查看容器健康状态
docker compose ps
```

### 健康检查状态

- **starting**: 容器启动中，在 `start_period` 内
- **healthy**: 健康检查通过
- **unhealthy**: 健康检查失败（超过 retries）

---

## 日志管理

### 日志配置

所有容器都使用 JSON 日志驱动，自动轮转：

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"    # 单个日志文件最大 10MB
    max-file: "3"      # 保留 3 个日志文件
```

### 查看日志

```bash
# 实时查看所有日志
make logs

# 查看特定服务日志
docker compose logs -f api

# 查看最近 100 行
docker compose logs --tail=100 api

# 查看特定时间范围
docker compose logs --since 30m api
```

### 日志位置

容器日志存储在：

```
/var/lib/docker/containers/<container_id>/<container_id>-json.log
```

---

## 资源限制

### 开发环境

开发环境**不设置**资源限制，以获得最佳性能。

### 生产环境

| 服务 | CPU 限制 | 内存限制 | CPU 预留 | 内存预留 |
|------|---------|----------|---------|----------|
| API | 1.0 | 512M | 0.25 | 128M |
| PostgreSQL | 1.0 | 1G | 0.5 | 256M |
| Redis | 0.5 | 512M | 0.1 | 128M |

### 监控资源使用

```bash
# 查看资源使用情况
docker stats

# 查看特定容器
docker stats 2ch-core-api
```

---

## 网络配置

### 网络拓扑

所有服务运行在同一个 bridge 网络中：

```
2ch-network (bridge)
├── api (2ch-core-api)
├── postgres (2ch-core-postgres)
└── redis (2ch-core-redis)
```

### 服务发现

容器间通过服务名通信：

```typescript
// API 连接数据库
DATABASE_URL: postgres://postgres:postgres@postgres:5432/2ch
//                                          ^^^^^^^^
//                                          服务名（自动解析为容器 IP）

// API 连接 Redis
REDIS_URL: redis://redis:6379
//                 ^^^^^
//                 服务名
```

### 端口映射

```
宿主机:3000  → api:3000       # HTTP API
宿主机:5432  → postgres:5432  # PostgreSQL
宿主机:6379  → redis:6379     # Redis
```

---

## 故障排查

### 常见问题

#### 1. 容器无法启动

```bash
# 查看容器日志
docker compose logs api

# 检查容器状态
docker compose ps

# 检查健康状态
make health
```

#### 2. 数据库连接失败

```bash
# 检查 PostgreSQL 是否就绪
docker compose exec postgres pg_isready -U postgres

# 进入数据库检查
make shell-db
# 然后执行 SQL: SELECT 1;
```

#### 3. 端口被占用

```bash
# 查看端口占用
lsof -i :3000
lsof -i :5432

# 修改端口（在 .env 中）
APP_PORT=3001
POSTGRES_PORT=5433
```

#### 4. 权限问题

```bash
# 确保脚本可执行
chmod +x ./scripts/docker-manage.sh

# 检查 Docker 权限
docker ps
```

#### 5. Volume 数据丢失

```bash
# 检查 volume 是否存在
docker volume ls | grep 2ch-core

# 检查 volume 挂载
docker inspect 2ch-core-postgres | grep Mounts -A 10
```

### 清理与重置

```bash
# 清理未使用的资源
make clean

# 完全重置（⚠️ 会删除所有数据）
make reset
```

### 调试技巧

```bash
# 1. 查看容器详细信息
docker inspect 2ch-core-api

# 2. 查看网络配置
docker network inspect 2ch-core_2ch-network

# 3. 查看 volume 详情
docker volume inspect 2ch-core_postgres_data

# 4. 实时监控资源
docker stats --no-stream

# 5. 查看容器进程
docker compose top
```

---

## 最佳实践

### 1. 定期备份

```bash
# 设置 cron job (每天凌晨 2 点)
0 2 * * * cd /path/to/2ch-core && make backup
```

### 2. 监控健康状态

```bash
# 设置健康检查脚本
*/5 * * * * cd /path/to/2ch-core && make health
```

### 3. 日志审计

```bash
# 定期审查管理员操作日志
docker compose logs api | grep ADMIN
```

### 4. 安全更新

```bash
# 定期更新镜像
docker compose pull
docker compose up -d
```

### 5. 性能优化

- 监控资源使用，根据需要调整限制
- 定期清理旧日志和未使用的镜像
- 使用 Redis 缓存减少数据库压力

---

## 附录

### 完整命令参考

```bash
# Makefile 命令
make help         # 显示帮助
make start        # 启动开发环境
make stop         # 停止所有容器
make restart      # 重启所有容器
make status       # 查看状态
make logs         # 查看日志
make prod         # 启动生产环境
make build        # 构建生产镜像
make shell-api    # 进入 API 容器
make shell-db     # 进入数据库
make shell-redis  # 进入 Redis
make migrate      # 运行迁移
make backup       # 备份数据库
make restore      # 恢复数据库
make health       # 健康检查
make clean        # 清理资源
make reset        # 重置数据
```

### 环境变量完整列表

```bash
# 应用
NODE_ENV=development|production
APP_PORT=3000

# 数据库
POSTGRES_USER=postgres
POSTGRES_PASSWORD=secure_password
POSTGRES_DB=2ch
POSTGRES_PORT=5432

# Redis
REDIS_PORT=6379
REDIS_PASSWORD=redis_password

# 管理员
ADMIN_IP_HASHES=hash1,hash2,hash3

# 功能开关
ENABLE_WEBSOCKET=false
ENABLE_RATE_LIMIT=true
```

---

## 联系与支持

如有问题，请查看：
- [主 README](./README.md)
- [架构文档](./ARCHITECTURE.md)
- [变更日志](./CHANGELOG.md)

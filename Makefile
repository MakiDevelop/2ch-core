# 2ch-core Makefile
# 提供简洁的容器管理命令

.PHONY: help start stop restart status logs shell clean reset health migrate backup

# 默认目标
.DEFAULT_GOAL := help

# 帮助信息
help:
	@echo "2ch-core 容器管理命令"
	@echo ""
	@echo "开发环境:"
	@echo "  make start        - 启动开发环境"
	@echo "  make stop         - 停止所有容器"
	@echo "  make restart      - 重启所有容器"
	@echo "  make logs         - 查看所有日志"
	@echo "  make status       - 查看容器状态"
	@echo ""
	@echo "生产环境:"
	@echo "  make prod         - 启动生产环境"
	@echo "  make build        - 构建生产镜像"
	@echo ""
	@echo "容器操作:"
	@echo "  make shell-api    - 进入 API 容器"
	@echo "  make shell-db     - 进入数据库"
	@echo "  make shell-redis  - 进入 Redis"
	@echo ""
	@echo "数据库:"
	@echo "  make migrate      - 运行数据库迁移"
	@echo "  make backup       - 备份数据库"
	@echo "  make restore      - 恢复数据库"
	@echo ""
	@echo "维护:"
	@echo "  make health       - 检查服务健康状态"
	@echo "  make clean        - 清理未使用的资源"
	@echo "  make reset        - 重置所有数据 (危险)"
	@echo ""

# 开发环境
start:
	@./scripts/docker-manage.sh start

stop:
	@./scripts/docker-manage.sh stop

restart:
	@./scripts/docker-manage.sh restart

status:
	@./scripts/docker-manage.sh status

logs:
	@./scripts/docker-manage.sh logs

# 生产环境
prod:
	@./scripts/docker-manage.sh start prod

build:
	@docker compose -f docker-compose.prod.yml build

# Shell 访问
shell-api:
	@./scripts/docker-manage.sh shell api

shell-db:
	@./scripts/docker-manage.sh shell postgres

shell-redis:
	@./scripts/docker-manage.sh shell redis

# 数据库操作
migrate:
	@./scripts/docker-manage.sh db-migrate

backup:
	@./scripts/docker-manage.sh db-backup

restore:
	@if [ -z "$(FILE)" ]; then \
		echo "错误: 请指定备份文件 (例如: make restore FILE=backup.sql.gz)"; \
		exit 1; \
	fi
	@./scripts/docker-manage.sh db-restore "$(FILE)"

# 维护
health:
	@./scripts/docker-manage.sh health

clean:
	@./scripts/docker-manage.sh clean

reset:
	@./scripts/docker-manage.sh reset

# 快捷命令
up: start
down: stop
ps: status

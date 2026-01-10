#!/bin/bash
# 2ch-core Docker 管理脚本
# 提供常用的容器管理命令

set -e

COMPOSE_FILE="docker-compose.yml"
PROJECT_NAME="2ch-core"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# 显示帮助信息
show_help() {
    cat << EOF
2ch-core Docker 管理脚本

用法: $0 <command> [options]

命令:
  start [prod]       启动所有容器（dev 或 prod 环境）
  stop               停止所有容器
  restart            重启所有容器
  status             查看容器状态
  logs [service]     查看日志（可选指定服务名）
  shell <service>    进入容器 shell
  db-migrate         运行数据库迁移
  db-backup          备份数据库
  db-restore <file>  恢复数据库
  clean              清理未使用的容器和镜像
  reset              重置所有数据（危险操作）
  health             检查所有服务健康状态
  help               显示此帮助信息

示例:
  $0 start           # 启动开发环境
  $0 start prod      # 启动生产环境
  $0 logs api        # 查看 API 容器日志
  $0 shell postgres  # 进入 PostgreSQL 容器
  $0 db-backup       # 备份数据库

EOF
}

# 检查 Docker 是否运行
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        error "Docker 未运行，请先启动 Docker"
    fi
}

# 启动容器
start_containers() {
    local env=${1:-dev}

    if [ "$env" = "prod" ]; then
        COMPOSE_FILE="docker-compose.prod.yml"
        info "启动生产环境容器..."
    else
        info "启动开发环境容器..."
    fi

    docker compose -f "$COMPOSE_FILE" up -d
    success "容器启动成功"

    info "等待服务就绪..."
    sleep 5
    check_health
}

# 停止容器
stop_containers() {
    info "停止所有容器..."
    docker compose -f "$COMPOSE_FILE" down
    success "容器已停止"
}

# 重启容器
restart_containers() {
    info "重启所有容器..."
    docker compose -f "$COMPOSE_FILE" restart
    success "容器重启完成"
}

# 查看状态
show_status() {
    info "容器状态:"
    docker compose -f "$COMPOSE_FILE" ps
}

# 查看日志
show_logs() {
    local service=$1

    if [ -z "$service" ]; then
        info "显示所有服务日志 (Ctrl+C 退出):"
        docker compose -f "$COMPOSE_FILE" logs -f
    else
        info "显示 $service 服务日志 (Ctrl+C 退出):"
        docker compose -f "$COMPOSE_FILE" logs -f "$service"
    fi
}

# 进入容器 shell
enter_shell() {
    local service=$1

    if [ -z "$service" ]; then
        error "请指定服务名: api, postgres, redis"
    fi

    info "进入 $service 容器 shell..."

    case "$service" in
        api)
            docker compose -f "$COMPOSE_FILE" exec api sh
            ;;
        postgres)
            docker compose -f "$COMPOSE_FILE" exec postgres psql -U postgres -d 2ch
            ;;
        redis)
            docker compose -f "$COMPOSE_FILE" exec redis redis-cli
            ;;
        *)
            docker compose -f "$COMPOSE_FILE" exec "$service" sh
            ;;
    esac
}

# 运行数据库迁移
run_migration() {
    info "运行数据库迁移..."
    docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U postgres -d 2ch -f /docker-entrypoint-initdb.d/001_add_boards.sql
    success "迁移完成"
}

# 备份数据库
backup_database() {
    local backup_dir="./db/backup"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="${backup_dir}/2ch_backup_${timestamp}.sql"

    mkdir -p "$backup_dir"

    info "备份数据库到 $backup_file..."
    docker compose -f "$COMPOSE_FILE" exec -T postgres pg_dump -U postgres 2ch > "$backup_file"

    # 压缩备份
    gzip "$backup_file"

    success "备份完成: ${backup_file}.gz"
}

# 恢复数据库
restore_database() {
    local backup_file=$1

    if [ -z "$backup_file" ]; then
        error "请指定备份文件"
    fi

    if [ ! -f "$backup_file" ]; then
        error "备份文件不存在: $backup_file"
    fi

    warn "此操作将覆盖当前数据库，是否继续？(y/N)"
    read -r confirm

    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        info "取消恢复"
        exit 0
    fi

    info "恢复数据库..."

    # 如果是 .gz 文件，先解压
    if [[ "$backup_file" == *.gz ]]; then
        gunzip -c "$backup_file" | docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U postgres 2ch
    else
        docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U postgres 2ch < "$backup_file"
    fi

    success "数据库恢复完成"
}

# 清理未使用的资源
clean_docker() {
    info "清理未使用的 Docker 资源..."
    docker system prune -f
    success "清理完成"
}

# 重置所有数据
reset_all() {
    warn "⚠️  此操作将删除所有容器和数据卷，无法恢复！"
    warn "确定要继续吗？(输入 'RESET' 确认)"
    read -r confirm

    if [ "$confirm" != "RESET" ]; then
        info "取消重置"
        exit 0
    fi

    info "停止并删除所有容器..."
    docker compose -f "$COMPOSE_FILE" down -v

    success "重置完成"
}

# 检查服务健康状态
check_health() {
    info "检查服务健康状态..."

    # 检查 API
    if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
        success "✓ API 服务正常"
    else
        warn "✗ API 服务未响应"
    fi

    # 检查 PostgreSQL
    if docker compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
        success "✓ PostgreSQL 正常"
    else
        warn "✗ PostgreSQL 未就绪"
    fi

    # 检查 Redis
    if docker compose -f "$COMPOSE_FILE" exec -T redis redis-cli ping > /dev/null 2>&1; then
        success "✓ Redis 正常"
    else
        warn "✗ Redis 未就绪"
    fi
}

# 主逻辑
main() {
    check_docker

    local command=$1
    shift || true

    case "$command" in
        start)
            start_containers "$@"
            ;;
        stop)
            stop_containers
            ;;
        restart)
            restart_containers
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs "$@"
            ;;
        shell)
            enter_shell "$@"
            ;;
        db-migrate)
            run_migration
            ;;
        db-backup)
            backup_database
            ;;
        db-restore)
            restore_database "$@"
            ;;
        clean)
            clean_docker
            ;;
        reset)
            reset_all
            ;;
        health)
            check_health
            ;;
        help|--help|-h|"")
            show_help
            ;;
        *)
            error "未知命令: $command (使用 '$0 help' 查看帮助)"
            ;;
    esac
}

main "$@"

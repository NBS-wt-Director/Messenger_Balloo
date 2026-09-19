#!/bin/bash
# Balloo Messenger — systemd helper для автозапуска прод-стека.
#
# Назначение: systemd не может просто выполнить `docker compose up -d`, потому что
# на момент старта юнита docker-демон ещё может не быть готов. Скрипт ждёт демона,
# затем поднимает стек идемпотентно.
#
# Канон для сверки: живая копия лежит на сервере в /usr/local/bin/balloo-deploy.sh.
# Перед заменой ОБЯЗАТЕЛЬНО снять diff живой копии с этим файлом (см. deploy/README.md) —
# автоматической накладки из репозитория нет намеренно.

set -euo pipefail

COMPOSE_DIR="${BALLOO_COMPOSE_DIR:-/home/cfr_balloo/balloo/docker/prod}"
COMPOSE_FILE="${COMPOSE_DIR}/docker-compose.local.yml"
ENV_FILE="${COMPOSE_DIR}/.env.production"
DOCKER_WAIT_TRIES="${BALLOO_DOCKER_WAIT_TRIES:-60}"
DOCKER_WAIT_INTERVAL="${BALLOO_DOCKER_WAIT_INTERVAL:-2}"

log() { echo "[balloo-deploy] $*"; }

docker_ready() {
    docker info > /dev/null 2>&1
}

wait_for_docker() {
    local i
    for ((i = 1; i <= DOCKER_WAIT_TRIES; i++)); do
        if docker_ready; then
            log "docker daemon готов (попытка ${i})"
            return 0
        fi
        log "ожидаем docker daemon: ${i}/${DOCKER_WAIT_TRIES}"
        sleep "$DOCKER_WAIT_INTERVAL"
    done
    log "ОШИБКА: docker daemon не готов за $((DOCKER_WAIT_TRIES * DOCKER_WAIT_INTERVAL)) с"
    return 1
}

compose() {
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@"
}

start() {
    [ -f "$COMPOSE_FILE" ] || { log "ОШИБКА: нет $COMPOSE_FILE"; exit 1; }
    [ -f "$ENV_FILE" ] || { log "ОШИБКА: нет $ENV_FILE"; exit 1; }

    wait_for_docker
    cd "$COMPOSE_DIR"
    compose up -d --remove-orphans
    compose ps
    log "стек поднят"
}

stop() {
    cd "$COMPOSE_DIR"
    # Останавливаем, но тома и сеть не удаляем: сеть нужна postfix-релееву (SMTP_HOST=172.19.0.1)
    compose stop
    log "стек остановлен"
}

case "${1:-start}" in
    start) start ;;
    stop) stop ;;
    restart) stop; start ;;
    status) cd "$COMPOSE_DIR" && compose ps ;;
    *) log "Использование: $0 {start|stop|restart|status}"; exit 2 ;;
esac

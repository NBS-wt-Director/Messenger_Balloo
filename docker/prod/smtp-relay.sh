#!/usr/bin/env bash
# P11 (SMTP): разрешить контейнеру balloo-server слать почту через хостовый postfix.
#
# Запуск на сервере ОДНОЙ строкой из репозитория:
#     bash docker/prod/smtp-relay.sh
#
# Что делает (идемпотентно, каждый шаг проверяется):
#   1) бэкап /etc/postfix/main.cf в ~/postfix-main.cf.bak.<дата>;
#   2) mynetworks += 172.19.0.0/16 (docker-подсеть prod_balloo-net; шлюз 172.19.0.1);
#      postfix check при ошибке — откат main.cf и reload;
#   3) ufw allow from 172.19.0.0/16 to any port 25 proto tcp (только docker-подсеть,
#      наружу 25 НЕ открываем — это отдельное решение про входящую почту);
#   4) проверка из контейнера: подключение к 172.19.0.1:25, ждём баннер 220.
#
# Предпосылки (батчи G/H, журнал 23–24 тикета prod-deploy-handoff-20260912):
# postfix на хосте наш (myhostname=mail.balloo.su, mydestination=balloo.su),
# доставляет напрямую (relayhost пуст), исходящий :25 открыт, docker-сеть prod_balloo-net.
#
# Переменные для переопределения (selftest/нестандартная сеть): SMTP_NET, SMTP_GW.
set -euo pipefail

NET=${SMTP_NET:-172.19.0.0/16}
GW=${SMTP_GW:-172.19.0.1}
MAINCF=${POSTFIX_MAINCF:-/etc/postfix/main.cf}
DEF='127.0.0.0/8 [::ffff:127.0.0.0]/104 [::1]/128'

if [ -n "${SUDO+set}" ]; then SUDO=$SUDO; elif [ "$(id -u)" -eq 0 ]; then SUDO=""; else SUDO=sudo; fi
if [ -n "$SUDO" ]; then sudo -v; fi

echo "сеть        : docker-подсеть $NET (шлюз $GW) -> postfix :25"
CUR=$($SUDO postconf -h mynetworks 2>/dev/null || echo '')
echo "mynetworks  : сейчас = ${CUR:-НЕ ПРОЧИТАН}"

# ─── 1. mynetworks ────────────────────────────────────────────────────────────────
if printf '%s' "$CUR" | grep -qF "$NET"; then
  echo "mynetworks  : уже содержит $NET — правка не нужна"
else
  BAK="$HOME/postfix-main.cf.bak.$(date +%F-%H%M%S)"
  $SUDO cp -a "$MAINCF" "$BAK"
  echo "бэкап       : $BAK"
  # К текущему значению дописываем подсеть (не затираем: там могут быть чужие сети).
  NEWNET=$(printf '%s' "${CUR:-$DEF}" | sed "s|[[:space:]]*$| $NET|")
  $SUDO postconf -e "mynetworks = $NEWNET"
  if ! $SUDO postfix check; then
    $SUDO cp -a "$BAK" "$MAINCF"
    $SUDO systemctl reload postfix
    echo "FAIL: postfix check не прошёл — main.cf откачен из $BAK, postfix перезагружен прежним"
    exit 1
  fi
  $SUDO systemctl reload postfix
  echo "mynetworks  : стало = $($SUDO postconf -h mynetworks)"
fi

# ─── 2. ufw: правило только для docker-подсети ────────────────────────────────────
if $SUDO ufw status 2>/dev/null | grep -qF "$NET"; then
  echo "ufw         : правило для $NET уже есть"
else
  $SUDO ufw allow from "$NET" to any port 25 proto tcp
  echo "ufw         : добавлено «allow from $NET to any port 25 proto tcp» (наружу 25 НЕ открыт)"
fi

# ─── 3. проверка из контейнера: баннер 220 ────────────────────────────────────────
echo "проверка    : из контейнера balloo-server к $GW:25 (ждём 220…)"
set +e
docker exec -e SMTPGW="$GW" balloo-server node -e '
const n=require("net");
const s=n.connect(25,process.env.SMTPGW,()=>console.log("  connected"));
s.setTimeout(8000,()=>{console.log("  FAIL: timeout");s.destroy();process.exit(1)});
s.on("data",d=>{console.log("  banner:",d.toString().trim().slice(0,100));s.end()});
s.on("error",e=>{console.log("  FAIL:",e.message);process.exit(1)});
s.on("close",()=>process.exit(0));
'
RC=$?
set -e
if [ "$RC" -eq 0 ]; then
  echo "ИТОГ        : postfix доступен из контейнера — релей готов"
  echo "Следующий шаг: SMTP_HOST=$GW и SMTP_PORT=25 в env + пересоздание контейнера + тестовое письмо (батч J)"
else
  echo "FAIL: контейнер не достучался (rc=$RC). Смотреть: sudo tail -n 20 /var/log/mail.log; sudo ufw status numbered"
  echo "Откат mynetworks (если делалась): см. бэкап ~/postfix-main.cf.bak.*"
  exit 1
fi

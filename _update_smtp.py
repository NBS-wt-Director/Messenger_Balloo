import re

path = '/home/ivan/Рабочий стол/проекты/balloo/instruktion_get_keys.md'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Находим начало секции SMTP (4) и заменяем до секции 5
# Ищем "### 4" до "### 5"
start = content.find('### 4')
end = content.find('### 5')

if start == -1 or end == -1:
    print(f"Не найдено: start={start}, end={end}")
    exit(1)

new_smtp = '''### 4️⃣ SMTP (Email для регистрации и сброса пароля)

**Время:** ~20 минут  
**Решение:** Self-hosted Postfix + Dovecot на физическом сервере

Два почтовых ящика — оба на сервере:
- `noreply@balloo.su` — отправка (регистрация, сброс пароля, уведомления)
- `inbox@balloo.su` — входящие (реклама, сотрудничество, юр. вопросы, поддержка) — пересылка на личный Yandex

#### Шаг 1: Установка Postfix + Dovecot на сервере

```bash
# Установка
sudo apt update
sudo apt install -y postfix dovecot-core dovecot-imapd

# При установке postfix выбери: Internet Site
```

#### Шаг 2: Настройка Postfix (отправка)

```bash
# Настройка домена
sudo postconf -e myhostname = mail.balloo.su
sudo postconf -e mydomain = balloo.su
sudo postconf -e myorigin = balloo.su
sudo postconf -e mydestination = balloo.su localhost

# Настройка SMTP (SSL)
sudo postconf -e smtpd_tls_cert_file = /etc/ssl/certs/ssl-cert-snakeoil.pem
sudo postconf -e smtpd_tls_key_file = /etc/ssl/private/ssl-cert-snakeoil.pem
sudo postconf -e smtpd_tls_security_level = may
sudo postconf -e smtp_tls_security_level = may

# Перезапуск
sudo systemctl restart postfix
```

#### Шаг 3: Создание почтовых ящиков на сервере

```bash
# Создаём системных пользователей (без shell, только почта)
sudo useradd -m -s /usr/sbin/nologin noreply
sudo passwd noreply
# Введи пароль от noreply@balloo.su

sudo useradd -m -s /usr/sbin/nologin inbox
sudo passwd inbox
# Введи пароль от inbox@balloo.su

# Создаём директории Maildir
sudo mkdir -p /home/noreply/Maildir
sudo chown -R noreply:noreply /home/noreply/Maildir
sudo mkdir -p /home/inbox/Maildir
sudo chown -R inbox:inbox /home/inbox/Maildir
```

#### Шаг 4: Настройка Dovecot (IMAP для inbox)

```bash
# Включаем Maildir
sudo postconf -e home_mailbox = Maildir/
sudo systemctl restart dovecot

# Проверяем
sudo systemctl status dovecot
```

#### Шаг 5: Настройка пересылки inbox@ на личный Yandex

```bash
# Вписываешь свой личный Yandex email
echo 'ТВОЙ_YANDEX_EMAIL@yandex.ru' | sudo tee /home/inbox/.forward
sudo chown inbox:inbox /home/inbox/.forward
```

#### Шаг 6: Настройка DNS для приёма почты (Beget)

В DNS-зоне balloo.su добавь:

```
# MX-запись (почта для домена)
@        MX    10    mail.balloo.su.

# A-запись для почтового сервера
mail     A       188.73.176.34

# SPF-запись (защита от спама)
@        TXT     v=spf1 mx ip4:188.73.176.34 ~all
```

#### Шаг 7: SSL-сертификат (Let's Encrypt)

```bash
# Установи certbot
sudo apt install -y certbot python3-certbot-nginx

# Получи сертификат для mail.balloo.su
sudo certbot certonly --standalone -d mail.balloo.su

# Настрой Postfix на SSL
sudo postconf -e smtpd_tls_cert_file = /etc/letsencrypt/live/mail.balloo.su/fullchain.pem
sudo postconf -e smtpd_tls_key_file = /etc/letsencrypt/live/mail.balloo.su/privkey.pem

# Перезапуск
sudo systemctl restart postfix
sudo systemctl restart dovecot
```

#### Шаг 8: Проверка

```bash
# Проверка сервисов
sudo postfix status
sudo systemctl status dovecot

# Проверка портов
ss -tlnp | grep -E '25|587|993'

# Тест отправки
echo test | mail -s test noreply@balloo.su

# Проверка входящих
ls /home/noreply/Maildir/new/
```

#### Данные для .env

После настройки пришли мне:
- `SMTP_USER` = noreply@balloo.su
- `SMTP_PASSWORD` = пароль от noreply (который ты задал при useradd)
- `SMTP_HOST` = localhost
- `SMTP_PORT` = 587

> inbox@balloo.su не нужен в .env — он только для входящих и пересылки на Yandex.'''

content = content[:start] + new_smtp + content[end:]

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('SMTP секция обновлена')

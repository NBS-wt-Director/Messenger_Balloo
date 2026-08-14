# 1_01_29 -- Vosstanovlenie parolya

## Kapcha Balloo
- 6 kirillicheskikh simvolov, naklon +/-45, gradientnyj fon, gradient simvolov (1 ton sovpadaet s fonnom)
- Knopka Drugoj peregeneriruet
- Validaciya: texstovyj vvod

## 4 shaga
1. Vvod email
2. Kapcha
3. Proverka pochty
4. Novyj parol

## API
- POST /api/v1/auth/password-reset/request
- POST /api/v1/auth/password-reset/verify-captcha
- POST /api/v1/auth/password-reset/submit

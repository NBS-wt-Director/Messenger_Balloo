# 1_02_07 -- Feature Flags

## Gruppirovka
- Auth, Messaging, Groups, Polls, Stories, Donate, Blog, HR, Admin
- Klapushhajasya gruppa s chevron

## Vyklyuchenie flaga
- Modalka s obyazatelnym polem Prichina
- Pole Data povtornogo vklyucheniya
- Uvedomlenie: banner na vsekh ekrakh + push

## API
- GET /api/v1/admin/feature-flags
- PATCH /api/v1/admin/feature-flags/:key/toggle
- POST /api/v1/admin/feature-flags/notify

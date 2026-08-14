# Анкета заявки (command-balloo-su/application-form.html)

## Описание
Форма заявки «Стать членом нашей команды». ID вакансии подгружается из URL параметра (?vacancy_id=ID). Заявка отправляется в HR-модуль.

## Структура
- **Topbar**: логотип Command, заголовок «Стать членом команды»
- **Content** (page-container--narrow):
  - Ссылка «← К вакансиям»
  - Информационная карточка с названием вакансии (подгружается по ID)
  - Форма: имя, email, телефон, город, резюме, GitHub, опыт, о себе, зарплата, готовность начать, согласие на обработку ПД
  - Кнопка «Отправить заявку»

## Компоненты (React)
- `ApplicationForm` — основная форма
- `VacancyContext` — карточка с инфо о вакансии (подгружается по ID)

## API
- `GET /api/vacancies/:id` — получение информации о вакансии по ID из URL
- `POST /api/applications` — отправка заявки (vacancy_id, name, email, phone, city, resume_url, github, experience, about, salary, start_date)

## Технологии
- React 19 / Next.js 15
- Валидация на клиенте и сервере

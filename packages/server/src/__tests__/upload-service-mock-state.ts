// Общее состояние мока minio для upload-service-depth.test.ts.
// Файл нужен, потому что jest.mock поднимается выше объявлений в тесте —
// фабрика Client получает объект по ссылке в момент первого вызова.
module.exports = { client: {} as Record<string, unknown> };

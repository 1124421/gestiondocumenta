import * as Joi from 'joi';

/**
 * Schema de validación de variables de entorno con Joi.
 * NestJS valida todas las variables al arrancar la aplicación.
 * Si falta alguna variable requerida, la app no iniciará.
 */
export const validationSchema = Joi.object({
  // Aplicación
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  BACKEND_PORT: Joi.number().default(3001),
  FRONTEND_URL: Joi.string().default('http://localhost:3000'),

  // Base de datos
  DATABASE_URL: Joi.string().required().description('URL de conexión PostgreSQL'),

  // JWT
  JWT_SECRET: Joi.string().min(32).required().description('Clave secreta JWT'),
  JWT_ACCESS_EXPIRES: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRES: Joi.string().default('7d'),

  // Redis
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').default(''),

  // MinIO
  MINIO_ENDPOINT: Joi.string().default('localhost'),
  MINIO_PORT: Joi.number().default(9000),
  MINIO_USE_SSL: Joi.boolean().default(false),
  MINIO_ACCESS_KEY: Joi.string().required(),
  MINIO_SECRET_KEY: Joi.string().required(),

  // Elasticsearch
  ELASTICSEARCH_URL: Joi.string().default('http://localhost:9200'),

  // Email
  EMAIL_HOST: Joi.string().default('localhost'),
  EMAIL_PORT: Joi.number().default(1025),
  EMAIL_SECURE: Joi.boolean().default(false),
  EMAIL_USER: Joi.string().allow('').default(''),
  EMAIL_PASS: Joi.string().allow('').default(''),
  EMAIL_FROM: Joi.string().default('noreply@sigd.com'),

  // Rate limiting
  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(100),

  // OpenAI (opcional)
  OPENAI_API_KEY: Joi.string().allow('').default(''),
  OPENAI_MODEL: Joi.string().default('gpt-4o-mini'),

  // Upload
  MAX_FILE_SIZE: Joi.number().default(52428800),
});

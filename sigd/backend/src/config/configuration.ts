/**
 * Configuración tipada de la aplicación.
 * Lee las variables de entorno y las expone de forma estructurada
 * a través de ConfigService de NestJS.
 *
 * Uso:
 *   constructor(private config: ConfigService) {}
 *   const port = this.config.get<number>('app.port');
 */
export default () => ({
  app: {
    port: parseInt(process.env.BACKEND_PORT, 10) || 3001,
    env: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    apiPrefix: 'api/v1',
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'sigd-super-secret-key',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'sigd-refresh-secret-key',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
    resetPasswordExpiresIn: '1h',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || '',
  },
  minio: {
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT, 10) || 9000,
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'sigd_minio_admin',
    secretKey: process.env.MINIO_SECRET_KEY || 'sigd_minio_password_2024',
    bucketDocumentos: process.env.MINIO_BUCKET_DOCS || 'sigd-documentos',
    bucketThumbnails: process.env.MINIO_BUCKET_THUMBS || 'sigd-thumbnails',
    bucketTemp: process.env.MINIO_BUCKET_TEMP || 'sigd-temp',
  },
  elasticsearch: {
    node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
    indexClientes: 'sigd_clientes',
    indexExpedientes: 'sigd_expedientes',
    indexDocumentos: 'sigd_documentos',
  },
  email: {
    host: process.env.EMAIL_HOST || 'localhost',
    port: parseInt(process.env.EMAIL_PORT, 10) || 1025,
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || 'noreply@sigd.com',
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL, 10) || 60,
    limit: parseInt(process.env.THROTTLE_LIMIT, 10) || 100,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  },
  ocr: {
    // Carpeta con spa.traineddata.gz y eng.traineddata.gz (opcional; evita descargar de internet)
    langPath: process.env.OCR_LANG_PATH || '',
  },
  upload: {
    maxFileSizeBytes: parseInt(process.env.MAX_FILE_SIZE, 10) || 52428800, // 50MB
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/tiff',
      'video/mp4',
      'audio/mpeg',
      'audio/wav',
      'message/rfc822',
    ],
  },
});

# SIGD — Sistema Inteligente de Gestión Documental

## Descripción
Sistema empresarial para gestionar expedientes físicos y digitales de clientes.
Permite localizar cualquier expediente en menos de 2 segundos mediante búsqueda
avanzada, IA y digitalización con OCR.

## Estructura del Monorepo

```
sigd/
├── frontend/     → Interfaz de usuario (Next.js 14 + TypeScript)
├── backend/      → API REST y lógica de negocio (NestJS + PostgreSQL)
└── infra/        → Infraestructura (Docker, Kubernetes, CI/CD)
```

## Módulos del Sistema
1. Dashboard con KPIs en tiempo real
2. Gestión de clientes y expedientes
3. Archivo físico (cajas, carpetas, estantes, sedes)
4. Archivo digital (PDF, Word, imágenes, videos, audios)
5. Digitalización con OCR
6. Buscador inteligente (búsqueda semántica tipo Google)
7. Módulo de préstamos de expedientes
8. Trazabilidad y auditoría completa
9. Gestión documental (TRD, TVD, series, subseries)
10. Inteligencia Artificial (clasificación, duplicados, asistente)
11. Notificaciones y alertas
12. Gestión de usuarios y roles
13. Seguridad (JWT, MFA, encriptación)

## Stack Tecnológico
- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS, Shadcn UI, Framer Motion
- **Backend:** NestJS, Node.js, PostgreSQL, Redis, Prisma ORM
- **Storage:** MinIO (S3 compatible)
- **OCR:** Tesseract OCR / Azure Document Intelligence
- **Búsqueda:** Elasticsearch / OpenSearch
- **IA:** OpenAI API + Vector Database (embeddings)
- **Infra:** Docker, Kubernetes, CI/CD

## Cómo empezar
1. Instalar dependencias: `npm install` en cada carpeta
2. Configurar variables de entorno: copiar `.env.example` a `.env`
3. Levantar infraestructura: `docker-compose up -d` en `/infra/docker/`
4. Correr backend: `npm run dev` en `/backend/`
5. Correr frontend: `npm run dev` en `/frontend/`

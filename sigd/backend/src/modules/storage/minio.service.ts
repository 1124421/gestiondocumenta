import {
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';

/**
 * MinioService — Cliente real de almacenamiento S3 (MinIO).
 *
 * Las rutas se guardan en BD con el formato "bucket/key" (campo Documento.rutaMinio).
 */
@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private readonly client: Client;
  readonly bucketDocumentos: string;

  constructor(private readonly config: ConfigService) {
    this.client = new Client({
      endPoint: this.config.get<string>('minio.endPoint'),
      port: this.config.get<number>('minio.port'),
      useSSL: this.config.get<boolean>('minio.useSSL'),
      accessKey: this.config.get<string>('minio.accessKey'),
      secretKey: this.config.get<string>('minio.secretKey'),
    });
    this.bucketDocumentos = this.config.get<string>('minio.bucketDocumentos');
  }

  /** Garantiza que el bucket exista. No tumba el arranque si MinIO aún no está listo. */
  async onModuleInit(): Promise<void> {
    try {
      const existe = await this.client.bucketExists(this.bucketDocumentos);
      if (!existe) {
        await this.client.makeBucket(this.bucketDocumentos);
        this.logger.log(`Bucket creado: ${this.bucketDocumentos}`);
      }
    } catch (err: any) {
      this.logger.error(
        `No se pudo verificar el bucket "${this.bucketDocumentos}": ${err?.message}. ` +
          'Revisa que MinIO esté levantado (docker-compose up -d minio).',
      );
    }
  }

  /** Sube un buffer a MinIO y devuelve la ruta "bucket/key" que se guarda en BD. */
  async subir(key: string, buffer: Buffer, mimeType: string): Promise<string> {
    try {
      await this.client.putObject(this.bucketDocumentos, key, buffer, buffer.length, {
        'Content-Type': mimeType,
      });
    } catch (err: any) {
      this.logger.error(`Fallo al subir "${key}" a MinIO: ${err?.message}`);
      throw new ServiceUnavailableException(
        'No se pudo guardar el archivo en el almacenamiento (MinIO). Verifica que el servicio esté activo.',
      );
    }
    return `${this.bucketDocumentos}/${key}`;
  }

  /** Elimina un objeto (usado para compensar si falla el registro en BD). */
  async eliminar(rutaMinio: string): Promise<void> {
    const { bucket, key } = this.separarRuta(rutaMinio);
    try {
      await this.client.removeObject(bucket, key);
    } catch (err: any) {
      this.logger.warn(`No se pudo eliminar "${rutaMinio}" de MinIO: ${err?.message}`);
    }
  }

  /** URL pre-firmada de descarga (por defecto 15 min). */
  async urlDescarga(rutaMinio: string, nombreArchivo?: string, segundos = 900): Promise<string> {
    const { bucket, key } = this.separarRuta(rutaMinio);
    const params: Record<string, string> = {};
    if (nombreArchivo) {
      params['response-content-disposition'] =
        `attachment; filename*=UTF-8''${encodeURIComponent(nombreArchivo)}`;
    }
    try {
      return await this.client.presignedGetObject(bucket, key, segundos, params);
    } catch (err: any) {
      this.logger.error(`Fallo al firmar URL de "${rutaMinio}": ${err?.message}`);
      throw new ServiceUnavailableException('No se pudo generar la URL de descarga.');
    }
  }

  private separarRuta(rutaMinio: string): { bucket: string; key: string } {
    const i = rutaMinio.indexOf('/');
    return { bucket: rutaMinio.slice(0, i), key: rutaMinio.slice(i + 1) };
  }
}

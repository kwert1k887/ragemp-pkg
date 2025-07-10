import axios from 'axios';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import crypto from 'crypto';

import { config } from './config';
import { logger } from './logger';

export class Downloader {
    private readonly baseUrl = config.baseUrl;
    private readonly files = config.files;
    private readonly system = config.system;
    private readonly branch = config.branch;

    /**
     * Вычисляет SHA-256 хеш файла по пути
     */
    private async getFileHash(filePath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash('sha256');
            const stream = fs.createReadStream(filePath);

            stream.on('data', (chunk) => hash.update(chunk));
            stream.once('end', () => resolve(hash.digest('hex')));
            stream.once('error', reject);
        });
    }

    /**
     * Скачивает файл по URL в указанный путь с проверкой хеша для избежания перезаписи неизмененного файла
     */
    private async downloadFile(url: URL, outputPath: string): Promise<void> {
        await fsp.mkdir(path.dirname(outputPath), { recursive: true });

        const tempFile = path.join(
            os.tmpdir(),
            `ragemp-pkg-${path.basename(outputPath)}-${Date.now()}`
        );

        try {
            const response = await axios.get(url.toString(), {
                responseType: 'stream',
                proxy: false,
            });

            if (response.status !== 200) {
                throw new Error(`Failed to download ${url} (status: ${response.status})`);
            }

            const writeStream = fs.createWriteStream(tempFile);
            response.data.pipe(writeStream);

            await new Promise<void>((resolve, reject) => {
                writeStream.once('finish', resolve);
                writeStream.once('error', reject);
            });

            if (fs.existsSync(outputPath)) {
                const [oldHash, newHash] = await Promise.all([
                    this.getFileHash(outputPath),
                    this.getFileHash(tempFile),
                ]);

                if (oldHash === newHash) {
                    logger.debug(`Файл не изменился, пропускаем: ${path.basename(outputPath)}`);
                    await fsp.unlink(tempFile);
                    return;
                }
            }

            try {
                await fsp.rename(tempFile, outputPath);
            } catch (err) {
                if ((err as NodeJS.ErrnoException).code === 'EXDEV') {
                    await fsp.copyFile(tempFile, outputPath);
                    await fsp.unlink(tempFile);
                } else {
                    throw err;
                }
            }

            logger.downloaded(path.basename(outputPath));
        } catch (error) {
            await fsp.unlink(tempFile).catch(() => {});
            throw error;
        }
    }

    /**
     * Основной метод — скачивает все файлы из конфигурации
     */
    public async downloadAll(): Promise<void> {
        logger.header('||===== ragemp-pkg =====||');
        logger.system(this.system);
        logger.branch(this.branch);
        logger.section('||====== Загрузка ======||');

        for (const file of this.files) {
            const fileUrl = new URL(file, this.baseUrl);
            const outputPath = path.resolve(process.cwd(), file);

            try {
                await this.downloadFile(fileUrl, outputPath);
            } catch (err) {
                logger.error(`Ошибка при скачивании ${file}: ${err instanceof Error ? err.message : err}`);
            }
        }

        logger.section('||====== Завершено ======||');
    }
}
import axios from 'axios';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import inquirer from 'inquirer';

import { SystemConfig, windowsConfig, linuxConfig } from './config';
import { logger } from './logger';

export class Downloader {
    private readonly config: SystemConfig;

    constructor(systemType: string = 'windows') {
        this.config = systemType === 'linux' ? linuxConfig : windowsConfig;
    }

    private async getFileHash(filePath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash('sha256');
            const stream = fs.createReadStream(filePath);
            stream.on('data', (chunk) => hash.update(chunk));
            stream.once('end', () => resolve(hash.digest('hex')));
            stream.once('error', reject);
        });
    }

    private async downloadFile(url: URL, outputPath: string): Promise<void> {
        await fsp.mkdir(path.dirname(outputPath), { recursive: true });

        const tempFile = outputPath + '.tmp';

        try {
            const response = await axios.get(url.toString(), { responseType: 'stream', proxy: false });

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

            await fsp.rename(tempFile, outputPath);
            logger.downloaded(path.basename(outputPath));

        } catch (error) {
            await fsp.unlink(tempFile).catch(() => {});
            throw error;
        }
    }

    private async extractTarGz(archivePath: string): Promise<void> {
        logger.unzip(`Распаковка архива: ${path.basename(archivePath)}`);

        try {
            if (process.platform === 'win32') {
                execSync(`tar -xzf "${archivePath}"`, { stdio: 'inherit' });
            } else {
                execSync(`tar -xzf "${archivePath}"`, { stdio: 'inherit' });
            }

            logger.unzip('Архив успешно распакован');

            await this.promptArchiveAction(archivePath);

        } catch (error) {
            logger.error(`Ошибка при распаковке: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    }

    private async promptArchiveAction(archivePath: string): Promise<void> {
        logger.section('||====== Действие с архивом ======||');

        const { action } = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'Распаковка завершена. Выберите действие с архивом:',
                choices: [
                    {
                        name: '[У] Удалить архив',
                        value: 'delete',
                        short: 'Удалить'
                    },
                    {
                        name: '[О] Оставить архив',
                        value: 'keep',
                        short: 'Оставить'
                    }
                ],
                pageSize: 10
            }
        ]);

        await this.handleArchiveAction(archivePath, action);
    }

    private async handleArchiveAction(archivePath: string, action: string): Promise<void> {
        switch (action) {
            case 'delete':
                await fsp.unlink(archivePath);
                logger.debug(`Архив удален: ${path.basename(archivePath)}`);
                break;
            case 'keep':
                logger.debug(`Архив сохранен: ${path.basename(archivePath)}`);
                break;
            default:
                await fsp.unlink(archivePath);
                logger.debug(`Архив удален: ${path.basename(archivePath)}`);
        }
    }

    public async downloadAll(): Promise<void> {
        const { baseUrl, files, system, branch, archiveFile } = this.config;

        logger.header('||===== ragemp-pkg =====||');
        logger.system(system === 'x64_win' ? 'Windows x64' : 'Linux x64');
        logger.branch(branch);
        logger.section('||====== Загрузка ======||');

        for (const file of files) {
            const fileUrl = new URL(file, baseUrl);
            const outputPath = path.resolve(process.cwd(), file);

            try {
                await this.downloadFile(fileUrl, outputPath);
            } catch (err) {
                logger.error(`Ошибка при скачивании ${file}: ${err instanceof Error ? err.message : err}`);
            }
        }

        if (archiveFile) {
            const archivePath = path.resolve(process.cwd(), archiveFile);

            if (fs.existsSync(archivePath)) {
                logger.section('||====== Распаковка ======||');
                await this.extractTarGz(archivePath);
            }
        }

        logger.section('||====== Завершено ======||');
    }
}
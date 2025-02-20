import axios from 'axios';
import * as path from 'path';
import chalk from 'chalk';

import * as fs from 'fs';
import * as fsp from 'fs/promises';

import { config } from './config';

export default new class Downloader {
    private baseUrl: string = config.baseUrl;
    private files: string[] = config.files;
    private system: string = config.system;
    private branch: string = config.branch;

    private async downloadFile(url: string, outputPath: string): Promise<void> {
        const dir = path.dirname(outputPath);
        await fsp.mkdir(dir, { recursive: true });

        return new Promise(async (resolve, reject) => {
            try {
                const response = await axios.get(url, {
                    responseType: 'stream',
                });

                if (response.status !== 200) {
                    return reject(
                        new Error(`Не удалось скачать ${url}: ${response.status}`)
                    );
                }

                const fileStream = fs.createWriteStream(outputPath);
                response.data.pipe(fileStream);

                fileStream.on('finish', () => {
                    fileStream.close(() => resolve());
                });

                fileStream.on('error', (err) => {
                    reject(err);
                });
            } catch (err) {
                await fsp.unlink(outputPath).catch(() => {});
                reject(err);
            }
        });
    }

    public async downloadAll(): Promise<void> {
        console.log(chalk.greenBright('||===== ragemp-pkg =====||'));
        console.log(chalk.whiteBright(`Система: `), chalk.yellowBright(this.system));
        console.log(chalk.whiteBright(`Ветка: `), chalk.yellowBright(this.branch));
        console.log(chalk.greenBright('||===== Загрузка =====||'));

        for (const file of this.files) {
            const fileUrl = `${this.baseUrl}${file}`;
            const outputPath = path.join(process.cwd(), file);
            try {
                await this.downloadFile(fileUrl, outputPath);
                console.log(`Скачано: ${file}`);
            } catch (err) {
                console.error(`Ошибка при скачивании ${file}:`, err);
            }
        }
        console.log(chalk.greenBright('||===== Завершено =====||'));
    }
}
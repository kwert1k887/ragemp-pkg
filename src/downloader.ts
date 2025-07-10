import axios from 'axios';
import * as path from 'path';
import chalk from 'chalk';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as os from 'os';
import crypto from 'crypto';

import { config } from './config';

export default new class Downloader {
    private baseUrl: string = config.baseUrl;
    private files: string[] = config.files;
    private system: string = config.system;
    private branch: string = config.branch;

    private async getFileHash(filePath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash('sha256');
            const stream = fs.createReadStream(filePath);
            stream.on('data', chunk => hash.update(chunk));
            stream.on('end', () => resolve(hash.digest('hex')));
            stream.on('error', reject);
        });
    }

    private async downloadFile(url: URL, outputPath: string): Promise<void> {
        const dir = path.dirname(outputPath);
        await fsp.mkdir(dir, { recursive: true });

        const exists = fs.existsSync(outputPath);
        const tmpFile = path.join(os.tmpdir(), `ragemp-pkg-${path.basename(outputPath)}-${Date.now()}`);

        try {
            const response = await axios.get(url.toString(), { responseType: 'stream', proxy: false });

            if (response.status !== 200) {
                throw new Error(`Не удалось скачать ${url}: ${response.status}`);
            }

            const tmpStream = fs.createWriteStream(tmpFile);
            response.data.pipe(tmpStream);

            await new Promise<void>((resolve, reject) => {
                tmpStream.on('finish', () => resolve());
                tmpStream.on('error', reject);
            });

            if (exists) {
                const [oldHash, newHash] = await Promise.all([
                    this.getFileHash(outputPath),
                    this.getFileHash(tmpFile),
                ]);

                if (oldHash === newHash) {
                    console.log(chalk.gray(`Пропущено (без изменений): ${path.basename(outputPath)}`));
                    await fsp.unlink(tmpFile);
                    return;
                }
            }

            await fsp.copyFile(tmpFile, outputPath);
            await fsp.unlink(tmpFile);
            console.log(chalk.whiteBright(`Скачано:`), chalk.yellowBright(path.basename(outputPath)));
        } catch (err) {
            await fsp.unlink(tmpFile).catch(() => {});
            throw err;
        }
    }

    public async downloadAll(): Promise<void> {
        console.log(chalk.greenBright('||===== ragemp-pkg =====||'));
        console.log(chalk.whiteBright(`Система: `), chalk.yellowBright(this.system));
        console.log(chalk.whiteBright(`Ветка: `), chalk.yellowBright(this.branch));
        console.log(chalk.greenBright('||===== Загрузка =====||'));

        for (const file of this.files) {
            const fileUrl = new URL(file, this.baseUrl);
            const outputPath = path.join(process.cwd(), file);
            try {
                await this.downloadFile(fileUrl, outputPath);
            } catch (err) {
                console.error(chalk.red(`Ошибка при скачивании ${file}:`), err);
            }
        }

        console.log(chalk.greenBright('||===== Завершено =====||'));
    }
}
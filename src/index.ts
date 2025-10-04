import inquirer from 'inquirer';

import { logger } from './logger';
import { Downloader } from './downloader';
import { config } from './config';

async function main(): Promise<void> {
    const [arg] = process.argv.slice(2);

    if (arg === config.branch) {
        const downloader = new Downloader();
        await downloader.downloadAll();
    } else if (arg === 'linux') {
        const downloader = new Downloader('linux');
        await downloader.downloadAll();
    } else if (arg === 'windows') {
        const downloader = new Downloader('windows');
        await downloader.downloadAll();
    } else if (arg === 'select') {
        await selectAndDownload();
    } else {
        logger.error(`Использование:`);
        logger.error(`  npx ragemp-pkg ${config.branch}    - Скачать Windows файлы (по умолчанию)`);
        logger.error(`  npx ragemp-pkg windows           - Скачать Windows файлы`);
        logger.error(`  npx ragemp-pkg linux             - Скачать Linux файлы`);
        logger.error(`  npx ragemp-pkg select            - Выбрать ОС интерактивно`);
        process.exit(1);
    }
}

async function selectAndDownload(): Promise<void> {
    logger.header('||===== ragemp-pkg =====||');
    logger.system('Выбор операционной системы');

    const { osType } = await inquirer.prompt([
        {
            type: 'list',
            name: 'osType',
            message: 'Выберите операционную систему:',
            choices: [
                {
                    name: '[W] Windows (по умолчанию)',
                    value: 'windows',
                    short: 'Windows'
                },
                {
                    name: '[L] Linux',
                    value: 'linux',
                    short: 'Linux'
                }
            ],
            pageSize: 10
        }
    ]);

    const downloader = new Downloader(osType);
    await downloader.downloadAll();
}

main().catch((err) => {
    logger.error('Fatal error:');
    console.error(err instanceof Error ? err.stack || err.message : err);
    process.exit(1);
});
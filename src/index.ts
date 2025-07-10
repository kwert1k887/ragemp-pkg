import { logger } from './logger';
import { Downloader } from './downloader';
import { config } from './config';

async function main(): Promise<void> {
    const [arg] = process.argv.slice(2);

    if (arg === config.branch) {
        const downloader = new Downloader();
        await downloader.downloadAll();
    } else {
        logger.error(`Использование: npx ragemp-pkg ${config.branch}`);
        process.exit(1);
    }
}

main().catch((err) => {
    logger.error('Fatal error:');
    console.error(err instanceof Error ? err.stack || err.message : err);
    process.exit(1);
});
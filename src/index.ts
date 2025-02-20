import chalk from 'chalk';

import Downloader from './downloader';

import { config } from './config';

async function main() {
    if ( process.argv.slice(2)[0] === config.branch) {
        await Downloader.downloadAll();
    } else {
        console.log(chalk.redBright(`Использование: npx ragemp-pkg ${config.branch}`));
    }
}

main().catch((err) => console.error(err));
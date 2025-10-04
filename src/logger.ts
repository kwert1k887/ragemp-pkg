import chalk from 'chalk';

type LogFn = (msg: string) => void;

const formatWithBox = (label: string, msg: string): string => {
    const prefix = chalk.greenBright.bold('|| ');
    const content = chalk.white(label) + chalk.yellowBright.bold(` ${msg}`);
    const suffixLength = Math.max(0, 5 - label.length + 1 + msg.length);
    const suffix = chalk.greenBright.bold(' '.repeat(suffixLength) + '||');

    return prefix + content + suffix;
};

export const logger: Record<string, LogFn> = {
    header: (msg) => console.log(chalk.greenBright.bold(msg)),
    system: (msg) => console.log(formatWithBox('Система:', msg)),
    unzip: (msg) => console.log(chalk.yellowBright(msg)),
    branch: (msg) => console.log(formatWithBox('Ветка:', msg)),
    section: (msg) => console.log(chalk.greenBright.bold(msg)),
    downloaded: (msg) => console.log(chalk.white('Скачано:'), chalk.yellowBright(msg)),
    error: (msg) => console.error(chalk.redBright(msg)),
    debug: (msg) => console.log(chalk.gray(msg)),
};
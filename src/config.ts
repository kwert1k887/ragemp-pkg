export interface SystemConfig {
    baseUrl: string;
    files: string[];
    system: string;
    branch: string;
    archiveFile?: string;
}

export const windowsConfig: SystemConfig = {
    baseUrl: 'https://cdn.rage.mp/updater/prerelease_server/server-files/',
    files: [
        'ragemp-server.exe',
        'BugTrap-x64.dll',
        'bin/bt.dat',
        'bin/enc.dat',
        'bin/loader.mjs',
    ],
    system: 'x64_win',
    branch: 'release',
};

export const linuxConfig: SystemConfig = {
    baseUrl: 'https://cdn.rage.mp/updater/prerelease_server/server-files/',
    files: ['linux_x64.tar.gz'],
    system: 'x64_linux',
    branch: 'release',
    archiveFile: 'linux_x64.tar.gz'
};

export const config = windowsConfig;
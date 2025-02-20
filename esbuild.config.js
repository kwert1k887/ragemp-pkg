import esbuild from "esbuild";

esbuild.build({
    entryPoints: ['src/index.ts'],
    outfile: 'bin/ragemp-pkg.cjs',
    bundle: true,
    platform: 'node',
    format: 'cjs',
    minify: true,
    banner: { js: '#!/usr/bin/env node' },
}).catch(() => process.exit(1));
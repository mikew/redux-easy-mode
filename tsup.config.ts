import fs from 'fs'
import path from 'path'

import type { Plugin } from 'esbuild'
import type { Options, Format } from 'tsup'
import { defineConfig } from 'tsup'

const sharedOptions: Options = {
  entry: ['src'],

  splitting: false,
  bundle: true,
  cjsInterop: true,

  dts: true,
  sourcemap: false,
  // target: 'node12',
  platform: 'node',
  // shims: true,

  clean: false,
  esbuildPlugins: [
    // This plugin probably changes the meaning of some of the word vomit above,
    // I haven't tested every permutation yet.
    // This isn't needed if you're comfortable with the magical incantation
    // above, plus this plugin chokes when using tsconfig paths.
    rewriteImportsPlugin({
      esmExtension: '.mjs',
      cjsExtension: '',
    }),
  ],
}

export default defineConfig([
  {
    format: 'esm',
    outDir: 'lib/esm',
    target: 'node20',
    ...sharedOptions,
  },
  {
    format: 'cjs',
    outDir: 'lib/cjs',
    target: 'node12',
    ...sharedOptions,
  },
])

const VALID_IMPORT_EXTENSIONS = [
  '.js',
  '.jsx',
  '.cjs',
  '.cjsx',
  '.mjs',
  '.mjsx',

  '.ts',
  '.tsx',
  '.cts',
  '.ctsx',
  '.mts',
  '.mtsx',
]

function rewriteImportsPlugin(options: {
  esmExtension: string
  cjsExtension: string
}) {
  const plugin: Plugin = {
    name: 'add-mjs',
    setup(build) {
      const currentBuildFormat: Format | null =
        build.initialOptions.define?.TSUP_FORMAT === '"cjs"'
          ? 'cjs'
          : build.initialOptions.define?.TSUP_FORMAT === '"esm"'
            ? 'esm'
            : null

      if (currentBuildFormat == null) {
        return
      }

      build.onResolve({ filter: /.*/ }, (args) => {
        if (args.kind === 'import-statement') {
          if (!args.path.match(/(^#|\.\/)/)) {
            return
          }

          const desiredExtension =
            currentBuildFormat === 'cjs'
              ? options.cjsExtension
              : currentBuildFormat === 'esm'
                ? options.esmExtension
                : null

          if (desiredExtension == null) {
            return
          }

          let finalName = `${args.path}${desiredExtension}`
          let exactMatch: string | null = null

          for (const ext of VALID_IMPORT_EXTENSIONS) {
            if (
              fs.existsSync(path.join(args.resolveDir, `${args.path}${ext}`))
            ) {
              exactMatch = `${args.path}${ext}`
              break
            }
          }

          if (!exactMatch) {
            finalName = `${args.path}/index${desiredExtension}`
          }

          return { path: finalName, external: true }
        }
      })
    },
  }

  return plugin
}

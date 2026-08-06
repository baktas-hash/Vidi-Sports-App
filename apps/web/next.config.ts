import path from 'node:path';

import type { NextConfig } from 'next';

// Repo root, two levels up from apps/web.
const monorepoRoot = path.resolve(import.meta.dirname, '../..');

const nextConfig: NextConfig = {
  // @vidi/* are published as TypeScript source inside the monorepo — there is no
  // build step for them, so Next has to compile them like app code.
  transpilePackages: ['@vidi/shared', '@vidi/db'],

  // pg is a Node driver with dynamic requires; bundling it breaks it.
  serverExternalPackages: ['pg'],

  // Without these, Next treats apps/web as the project root, warns about the
  // lockfile one level up, and traces no files outside apps/web — which would
  // leave @vidi/* out of a standalone build.
  turbopack: { root: monorepoRoot },
  outputFileTracingRoot: monorepoRoot,
};

export default nextConfig;

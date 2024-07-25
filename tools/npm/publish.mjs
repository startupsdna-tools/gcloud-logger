/**
 * This is a minimal script to publish your package to "npm".
 * This is meant to be used as-is or customize as you see fit.
 *
 * This script is executed on "dist/path/to/library" as "cwd" by default.
 *
 * You might need to authenticate with NPM before running this script.
 */
import { execSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import { readFileSync, writeFileSync } from 'fs';
import devkit from '@nx/devkit';

const { readCachedProjectGraph } = devkit;

function invariant(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

// Executing publish script: node path/to/publish.mjs {name} --tag {tag}
// Default "tag" to "dev" so we won't publish the "latest" tag by accident.
// If "tag" !== "latest" resulting version will be "version-tag.buildNumber"
// If "tag" === "latest" the package version will be the same as the "version" in "package.json"
const args = parseArgs({
  args: process.argv.slice(2),
  options: {
    tag: { type: 'string', default: 'dev', short: 't' },
  },
  allowPositionals: true,
});

const {
  positionals: [name],
  values: { tag },
} = args;

const graph = readCachedProjectGraph();
const project = graph.nodes[name];

invariant(
  project,
  `Could not find project "${name}" in the workspace. Is the project.json configured correctly?`,
);

const outputPath = project.data?.targets?.build?.options?.outputPath;
invariant(
  outputPath,
  `Could not find "build.options.outputPath" of project "${name}". Is project.json configured correctly?`,
);

const packageJson = JSON.parse(
  readFileSync(`${project.data?.root}/package.json`).toString(),
);
const packageNamespace = packageJson.name.split('/')[0];

try {
  // setting registry for npm
  const npmRegistry = process.env.NPM_REGISTRY;
  execSync(
    `npm set --location project ${packageNamespace}:registry=${npmRegistry}`,
    { cwd: outputPath },
  );
  // Setting auth token for npm
  execSync(
    'npx google-artifactregistry-auth --repo-config=./.npmrc --credential-config=./.npmrc',
    { cwd: outputPath },
  );
} catch (e) {
  console.error(`Error configuring npm.`);
  console.error(e.stack);
  process.exit(1);
}

// Updating the version in "package.json" before publishing
const outputPackageJson = JSON.parse(
  readFileSync(`${outputPath}/package.json`).toString(),
);
outputPackageJson.version = packageJson.version;
if ('latest' !== tag) {
  const build = new Date()
    .toISOString()
    .substring(0, 19)
    .replace(/[\-:T]+/g, '');
  outputPackageJson.version = packageJson.version + `-${tag}.${build}`;
}
writeFileSync(
  `${outputPath}/package.json`,
  JSON.stringify(outputPackageJson, null, 2),
);

// Execute "npm publish" to publish
try {
  const access = process.env.NPM_PACKAGE_ACCESS || 'restricted';
  execSync(`npm publish --tag ${tag} --access ${access}`, { cwd: outputPath });
} catch (e) {
  console.error(`Error publishing package.`);
  console.error(e.stack);
  process.exit(1);
}

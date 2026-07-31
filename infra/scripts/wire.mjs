import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { run } from './stack-outputs.mjs';

// Re-points the CloudFront /api/* behaviour at the current load balancer.
//
// FrontendStack reads the ALB DNS name from the SSM parameter AppStack
// publishes, so a routine `cdk deploy BorrowitFrontend` already keeps the API
// routing intact. This script exists for the one case that needs more: the load
// balancer having been replaced, which gives it a new DNS name.
//
// CDK caches synth-time lookups in cdk.context.json, so without clearing the
// cached entry first the redeploy would faithfully rebuild the distribution
// around the OLD hostname. Dropping the key forces a fresh read.

const here = dirname(fileURLToPath(import.meta.url));
const contextFile = resolve(here, '../cdk.context.json');
const PARAMETER = '/borrowit/alb-dns';

if (existsSync(contextFile)) {
  const context = JSON.parse(readFileSync(contextFile, 'utf8'));
  const stale = Object.keys(context).filter(
    (k) => k.startsWith('ssm:') && k.includes(PARAMETER),
  );

  if (stale.length) {
    for (const key of stale) delete context[key];
    writeFileSync(contextFile, `${JSON.stringify(context, null, 2)}\n`);
    console.log(`Cleared ${stale.length} cached lookup(s) of ${PARAMETER}`);
  }
}

console.log(`Redeploying BorrowitFrontend against ${PARAMETER} ...`);
run('npx', ['cdk', 'deploy', 'BorrowitFrontend', '--require-approval', 'never']);

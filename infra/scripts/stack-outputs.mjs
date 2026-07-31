import { execFileSync } from 'node:child_process';

export const REGION = process.env.AWS_REGION || 'ap-southeast-1';

export function run(command, args, options = {}) {
  return execFileSync(command, args, {
    stdio: options.capture ? ['inherit', 'pipe', 'inherit'] : 'inherit',
    encoding: 'utf8',
    // npm and cdk are .cmd shims on Windows, which execFile cannot launch
    // without a shell.
    shell: process.platform === 'win32',
    ...options,
  });
}

/**
 * Reads the CloudFormation outputs of a stack as a plain object.
 *
 * Outputs rather than hardcoded names because CDK generates the bucket and
 * distribution identifiers, and they change if a stack is ever recreated.
 */
export function outputsOf(stackName) {
  let raw;
  try {
    raw = run(
      'aws',
      [
        'cloudformation', 'describe-stacks',
        '--stack-name', stackName,
        '--region', REGION,
        '--query', 'Stacks[0].Outputs',
        '--output', 'json',
      ],
      { capture: true },
    );
  } catch {
    throw new Error(
      `Could not read outputs of ${stackName}. Is it deployed, and are your ` +
      `credentials current? (aws login)`,
    );
  }

  return Object.fromEntries(
    JSON.parse(raw).map((o) => [o.OutputKey, o.OutputValue]),
  );
}

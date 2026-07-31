// Executes a .sql file against whichever database db/index.js resolves.
//
// The RDS instance sits in an isolated subnet with no public endpoint, so the
// schema cannot be loaded from a laptop. Run this from inside a task instead:
//
//   aws ecs execute-command --cluster <cluster> --task <task-id> \
//     --container api --interactive --command "/bin/sh"
//   node scripts/run-sql.js db/schema.sql
//
// Locally it works the same way against DATABASE_URL.

const fs = require('fs');
const path = require('path');
const sql = require('../db');

async function main() {
  const target = process.argv[2];

  if (!target) {
    throw new Error('Usage: node scripts/run-sql.js <file.sql>');
  }

  const file = path.resolve(process.cwd(), target);
  const contents = fs.readFileSync(file, 'utf8');

  console.log(`Applying ${file}`);
  // Unparameterised, so postgres.js sends it as a simple query and the file may
  // contain multiple statements.
  await sql.unsafe(contents);
  console.log('Done');
}

main()
  .then(() => sql.end())
  .catch(async (err) => {
    console.error('Failed:', err.message);
    await sql.end({ timeout: 5 }).catch(() => {});
    process.exit(1);
  });

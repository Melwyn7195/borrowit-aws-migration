# BorrowIt — AWS infrastructure

CDK v2 (TypeScript) for deploying BorrowIt to ECS Fargate.

## Stack layout

Four stacks, split by how much they cost rather than by what they do. Only
`BorrowitApp` bills meaningfully, and nothing depends on it, so it can be
destroyed and rebuilt on its own.

| Stack | Contents | Cost/month | Lifecycle |
|---|---|---|---|
| `BorrowitFoundation` | VPC, security groups, 5 interface VPC endpoints, ECR repo | **~$36** | Leave up |
| `BorrowitData` | RDS PostgreSQL + Secrets Manager secret | ~$16 | Leave up — holds your data |
| `BorrowitFrontend` | S3 (web + uploads), CloudFront | ~$0 | Leave up |
| `BorrowitApp` | ECS cluster, Fargate service, ALB | **~$31** | Destroy only for a long idle gap |

Costs are charged against AWS Free Plan credits, not a card — this account was
created after the July 2025 free-tier change, so there is no 12-month free tier.
Check the balance with `aws freetier get-account-plan-state`. At ~$88/mo for
everything the credits last under two months, which still covers the project, so
routine nightly teardown is not necessary — but note that `npm run down` only
removes ~$35 of that. The interface endpoints bill from `BorrowitFoundation`,
which is never destroyed.

Dependencies point one way — `BorrowitApp` imports from the other three — which
is what makes `npm run down` safe.

## Prerequisites

- AWS account with billing alerts on (see **Cost control** below — do this first)
- AWS CLI v2, authenticated: `aws configure`
- Docker Desktop **running**
- Node.js 22
- [Session Manager plugin](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html) for `aws ecs execute-command`

## First deploy

### 1. Bootstrap

Once per account+region.

```powershell
cd infra
npm install
$env:ACCOUNT = (aws sts get-caller-identity --query Account --output text)
npx cdk bootstrap "aws://$env:ACCOUNT/ap-southeast-1"
```

### 2. Deploy the persistent layers

RDS takes 5–10 minutes and CloudFront up to 20. This is the slow step; it only
happens once.

```powershell
npx cdk deploy BorrowitFoundation BorrowitData BorrowitFrontend
```

Note the outputs — `EcrRepositoryUri`, `DistributionUrl`, `WebBucketName`.

### 3. Build and push the image

`BorrowitApp` will not deploy until an image exists in ECR.

```powershell
$env:REGION = "ap-southeast-1"
$env:REGISTRY = "$env:ACCOUNT.dkr.ecr.$env:REGION.amazonaws.com"

aws ecr get-login-password --region $env:REGION | docker login --username AWS --password-stdin $env:REGISTRY

cd ..\Renting-Online-Backend-main
docker build --platform linux/amd64 -t borrowit-be:latest .
docker tag borrowit-be:latest "$env:REGISTRY/borrowit-be:latest"
docker push "$env:REGISTRY/borrowit-be:latest"
```

`--platform linux/amd64` matters — the task definition targets X86_64.

### 4. Deploy the app

```powershell
cd ..\infra
npm run up
```

Output `ApiUrl` is your load balancer. It will report unhealthy until step 5,
because `/health` runs `SELECT 1` against a database with no tables yet.

### 5. Load the schema

`db/schema.sql` is in the repo — seven tables, written with
`CREATE TABLE IF NOT EXISTS` throughout, so re-running it is harmless.

RDS has no public endpoint, so apply it from inside a running task:

```powershell
$env:CLUSTER = (aws cloudformation describe-stacks --stack-name BorrowitApp --query "Stacks[0].Outputs[?OutputKey=='ClusterName'].OutputValue" --output text)
$env:TASK = (aws ecs list-tasks --cluster $env:CLUSTER --query "taskArns[0]" --output text)

aws ecs execute-command --cluster $env:CLUSTER --task $env:TASK --container api --interactive --command "/bin/sh"
```

Then inside the shell:

```sh
node scripts/run-sql.js db/schema.sql
npm run seed
```

`npm run seed` loads demo users and products, all sharing one password from
`services/seeder.js` — it is for the demo dataset, not for anything real.

Note that `schema.sql` is read from **inside the image**, not from your working
tree. Editing it locally changes nothing until you rebuild and push (step 3) and
redeploy.

### 6. Point CloudFront at the API

`npm run up` already does this, but on a first deploy the frontend stack was
created before the load balancer existed, so run it once explicitly:

```powershell
npm run wire
```

`AppStack` publishes the load balancer's DNS name to the SSM parameter
`/borrowit/alb-dns`. `FrontendStack` reads it at synth time and adds three cache
behaviours to the distribution — `/api/*`, `/health` and `/api-docs*` — pointing
at the load balancer.

The parameter is read **out of band, never as a cross-stack import**.
`FrontendStack` importing from `AppStack` would reverse the one-way dependency
and make `npm run down` fail on an exported value that is still in use.

Because the value comes from Parameter Store rather than a command-line flag, a
routine `cdk deploy BorrowitFrontend` keeps the API routing. `npm run wire` is
only needed when the load balancer was **replaced** — a new ALB means a new DNS
name, and CDK caches synth-time lookups in `cdk.context.json`, so the script
clears the cached entry before redeploying. `npm run up` chains it.

Two escape hatches: `-c albDns=<host>` overrides the lookup, and
`-c albDns=none` skips the API behaviours entirely, which is what a
from-scratch bootstrap needs before `AppStack` exists.

### 7. Deploy the frontend

```powershell
npm run deploy:web
```

Builds the React app, syncs it to the web bucket and invalidates the cache. No
`VITE_API_URL` to set — the app calls the API on relative paths, which resolve
to the Vite proxy in dev and to the CloudFront `/api/*` behaviour in production.

Open the `DistributionUrl` from `BorrowitFrontend` and the demo is live.

### Why the API is behind CloudFront

Two independent things rule out calling the load balancer directly:

- The ALB is **HTTP only** — there is no domain to hang an ACM certificate on —
  and a page served over HTTPS cannot call an `http://` endpoint. The browser
  blocks it as mixed content.
- `userController.js` sets the session cookie with `sameSite: 'strict'`. On a
  cross-site API host the browser discards that cookie, so login looks like it
  worked and every request after it is anonymous.

Serving both through one distribution makes the whole app same-origin, which
solves both and means CORS never enters into it.

One consequence worth knowing: CloudFront's `CustomErrorResponses` apply to the
whole distribution, not per behaviour, so the old 403/404 → `index.html` rule
had to go. It would have rewritten every API 404 into the HTML app shell with
status 200. Deep-link routing is handled instead by a CloudFront Function
attached only to the SPA behaviour.

## Daily workflow

```powershell
npm run down    # destroy ALB + Fargate, ~2 min. Data and images survive.
npm run up      # bring it back and re-wire CloudFront, ~6 min.
```

After a frontend code change:

```powershell
npm run deploy:web
```

Deploying a new image version:

```powershell
docker build --platform linux/amd64 -t borrowit-be:v2 .
docker tag borrowit-be:v2 "$env:REGISTRY/borrowit-be:v2"
docker push "$env:REGISTRY/borrowit-be:v2"
npx cdk deploy BorrowitApp -c imageTag=v2
```

Use real tags, not `latest` — `latest` gives you no way to roll back.

## Context flags

| Flag | Default | Effect |
|---|---|---|
| `-c imageTag=v2` | `latest` | Which ECR tag to run |
| `-c desiredCount=0` | `1` | `0` stops all tasks but keeps the ALB billing |
| `-c multiAz=true` | `false` | RDS standby in a second AZ — **doubles DB cost** |
| `-c scaling=true` | `false` | CPU-target autoscaling, 1→3 tasks |
| `-c albDns=<dns>` | from SSM | Overrides `/borrowit/alb-dns`. `none` skips the API behaviours entirely |
| `-c vpcEndpoints=ha` | one AZ | Interface endpoints in both AZs — **~$73/mo instead of ~$36** |

For the high-availability demo:
`npx cdk deploy BorrowitData BorrowitApp -c multiAz=true -c scaling=true`, record
the video, then redeploy without the flags.

## Logging and monitoring

All of it is defined in `AppStack`, so `npm run down` takes it with it — the
alarms have nothing to watch once the service is gone.

**Logs.** The task's stdout goes to `/borrowit/api`, one week of retention.
`middleware/requestLogger.js` writes one JSON line per request (`method`, `path`,
`status`, `durationMs`, `traceId`), which is what lets Insights aggregate by
field instead of regexing text. Health checks are filtered out at the source —
they poll every 30s from two directions and would otherwise dominate the volume
you pay to ingest. Postgres logs export to `/aws/rds/instance/<id>/postgresql`.

```powershell
aws logs tail /borrowit/api --follow
```

**Saved queries.** Logs Insights → Saved queries → `BorrowIt/…` — errors with
stack traces, slowest requests, status breakdown, traffic by route.

**Dashboard.** `BorrowIt` in the CloudWatch console; the `DashboardUrl` stack
output links straight to it. Requests and errors, p50/p95 latency, task CPU and
memory, database CPU and connections, healthy targets, and two log panels.

**Alarms.** Seven, all publishing to one SNS topic. Nothing is delivered until
you subscribe an address:

```powershell
npx cdk deploy BorrowitApp -c alarmEmail=you@example.com
```

then confirm the link AWS emails you. The alarms are `unhealthy-targets` (no
healthy task — at `desiredCount` 1 that means the API is down), `api-5xx`,
`service-cpu`, `service-memory`, `db-cpu`, `db-storage`, and `error-logs`. The
last one is metric-filter driven and catches failures that never become a 5xx.
Its threshold (20 error lines in 5 minutes) is a guess — watch it for a few days
and move it rather than living with a noisy alarm.

Running cost is roughly **$4/month**: ~$3 for the dashboard, $0.10 per alarm,
$0.30 per custom metric, and cents of log ingestion at this traffic level.

## Cost control

Do this before anything else:

1. **Billing alarm at $10.** Billing → Budgets → create a zero-spend or $10 budget.
2. `npm run down` whenever you stop working. The ALB bills ~$0.0225/hour whether
   or not any task is attached to it, so scaling tasks to zero is not enough —
   the stack has to go.
3. Everything is tagged `Project=BorrowIt`, so Cost Explorer can break the bill
   down per resource.

There is deliberately **no NAT Gateway** (~$33/month). Tasks run in public
subnets with a public IP and a security group that only accepts traffic from the
ALB. Do not "fix" this by moving them to private subnets without also budgeting
for the NAT.

Their AWS API traffic does not use that public path, though: five interface VPC
endpoints (`ecr.api`, `ecr.dkr`, `logs`, `secretsmanager`, `ssmmessages`) keep
image pulls, secret reads, log delivery and `execute-command` inside the VPC.
That is the ~$36/month in `BorrowitFoundation`, and it is the largest saving
available if credits run short — at the cost of the control.

## Known gaps

Things that are intentionally not done yet:

- **No HTTPS on the ALB.** Needs a domain + ACM certificate. Not a blocker: the
  browser only ever talks to CloudFront over HTTPS, and the edge-to-ALB hop runs
  inside AWS. It does mean the ALB DNS name must not be handed out directly.
- **CORS is still wide open** — `origin: true` in `index.js`. Harmless now that
  the app is same-origin and nothing relies on CORS, but it should still be
  pinned to the CloudFront domain.
- **`npm run wire` is a manual step after the ALB is *replaced*.** A new load
  balancer means a new DNS name, and CDK caches the synth-time SSM lookup. It is
  chained into `npm run up`; a bare `cdk deploy BorrowitApp` will leave
  CloudFront pointing at the old hostname until you run it.
- **`JWT_REFRESH_SECRET` is unset**, so refresh tokens are signed with
  `JWT_SECRET` via the fallback in `userController`. Splitting them costs
  another $0.40/month in Secrets Manager and is hardening, not a fix.
- **Email is unconfigured.** `EmailService.isConfigured()` requires both
  `GMAIL_USER` and `GMAIL_APP_PASSWORD`; neither is set on the task, so every
  message is logged instead of sent. `SEND_EMAILS=false` forces that off state
  even when credentials exist. Because delivery is off, registration creates
  accounts as `active` rather than `pending` — a verification gate nobody can
  clear is a lockout, since login rejects `pending`. Setting the two credentials
  restores the real verification flow with no other change. The verification and
  reset links point at `/verify-email.html` and `/reset-password.html`, which
  FrontendStack routes to the ALB so the API can serve them same-origin.
- **No CI/CD.** GitHub Actions to build, push and `cdk deploy` is the next step.
- **No tracing.** X-Ray would show where a slow request spends its time; the
  request log only gives the total. Not worth the instrumentation before the
  deadline.
- **No tests**, so the circuit breaker is the only deployment safety net.
- **Existing image URLs in the database** point at the old S3 bucket. New uploads
  go to `uploads/products/…` and are served through CloudFront.

# WSL2 test API

The backend listens on **0.0.0.0:3101** in WSL2. Windows nginx and public HTTPS are managed separately by the project owner. Forward HTTPS requests to this backend and preserve the `Authorization` header. Keep port 3101 private to the local network; clients use `https://sporeward.redlan.co` rather than unencrypted public HTTP.

The container serves `GET /health`, `GET /world`, `PUT /activities/:id/chunks/:index`, `POST /activities/:id/complete`, and `GET /activities/:id/encounters`. Upload completion applies validated contacts to the fixed Tampere encounter world. See [First outbreak encounter](../../docs/first-outbreak-encounter.md) for the test rules and limits. All requests require Basic Auth. Missing or incorrect credentials return 401; unknown authenticated routes return 404. Registered routes have a 120-request/minute source-IP limit, and JSON bodies are limited to 64 KiB, with a 256 KiB limit on upload batches. Proxy headers are not trusted, so callers behind Windows nginx share its source-IP request budget. Revisit that policy before multiplayer polling.

## Credentials

Set `AUTH_USERNAME` and a long random `AUTH_PASSWORD` in a private `.env` beside `compose.yaml`, using `.env.example` as the format. The deployment's generated credentials are kept in the ignored local `ops/test-server/.env` and the remote equivalent, with mode 600. They are not committed, logged, or embedded in the mobile APK. The app’s Test server panel accepts manually provisioned tester credentials into Expo SecureStore and performs explicit HTTPS health checks. Finished recordings can be explicitly uploaded through the separate Upload recording action.

The backend refuses network-accessible or production startup without credentials. Local development can run unauthenticated on loopback. Basic Auth must travel over HTTPS publicly; the backend's HTTP hop is for the Windows proxy/local host only.

## Build and run

From the deployed project directory:

```sh
docker compose -p sporeward-test -f ops/test-server/compose.yaml up -d --build
docker compose -p sporeward-test -f ops/test-server/compose.yaml ps
docker compose -p sporeward-test -f ops/test-server/compose.yaml logs --tail=50 api
```

The deployed directory is `/home/red/sporeward-test`. The image runs Node.js 24 as a non-root user, with a read-only filesystem, temporary writable `/tmp`, dropped capabilities, a memory limit, and rotated logs. Docker checks the authenticated health endpoint without printing credentials. `unless-stopped` restarts the container when it exits and when Docker restarts; Windows/WSL/Docker startup and sleep settings still determine host availability.

To stop this API without affecting other containers:

```sh
docker compose -p sporeward-test -f ops/test-server/compose.yaml down
```

Deploy code by copying the server workspace, shared game and protocol workspaces, root manifests/lockfile, workspace package manifests, and these container files, then rebuilding. Do not copy `.git`, recordings, unrelated environment files, or SSH keys into the image.

Before claiming public access, verify both unauthorized rejection and an authenticated health response through the Windows nginx HTTPS endpoint from outside the home network. Deployment inside WSL alone does not verify the public proxy path.

## Public endpoint verification

On 12 October 2026, `http://sporeward.redlan.co/health` redirected to HTTPS (301), and `https://sporeward.redlan.co/health` passed TLS certificate verification. Missing/invalid credentials returned 401; authenticated health returned 200. nginx was configured by the project owner. Cellular access can be verified during the next outing.

## Activity persistence

Activity batches, manifests, and receipts live in the named `activity-data` Docker volume under `/data/activities`. Owner/activity paths are hashed, files are private, and atomic immutable writes prevent retries from overwriting different content. Plain GPS data is readable to administrators with access to the volume; HTTPS protects transfer, not disk storage. Back up this volume if retaining field-test diagnostics matters. `docker compose down` preserves the volume; do not use `down -v` unless deliberately deleting recordings.

Upload endpoints validate batches, then completion verifies all batches and produces a persistent receipt. Receipts record basic distance/time eligibility and a server-confirmed encounter recap. World snapshots under `/data/world` share the persistent volume. The limit is 100,000 fixes/256 recording sections per activity. Invalid or duplicate timestamps, out-of-section fixes, missing batches, and changed immutable payloads are rejected. Changing the Basic Auth username changes the test-data owner namespace; password rotation with the same username does not. This single-tester namespace is not the future account system.

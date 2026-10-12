# WSL2 test API

The backend listens on **0.0.0.0:3101** in WSL2. Windows nginx and public HTTPS are managed separately by the project owner. Forward HTTPS requests to this backend and preserve the `Authorization` header. Keep port 3101 private to the local network; clients use `https://sporeward.redlan.co` rather than unencrypted public HTTP.

The container currently serves only `GET /health`; activity uploads and outbreak-world endpoints are not implemented. All requests require Basic Auth. Missing or incorrect credentials return 401; unknown authenticated routes return 404. Registered routes have a 120-request/minute source-IP limit, and JSON bodies are limited to 64 KiB. Proxy headers are not trusted, so callers behind Windows nginx share its source-IP request budget. Revisit that policy before multiplayer polling.

## Credentials

Set `AUTH_USERNAME` and a long random `AUTH_PASSWORD` in a private `.env` beside `compose.yaml`, using `.env.example` as the format. The deployment's generated credentials are kept in the ignored local `ops/test-server/.env` and the remote equivalent, with mode 600. They are not committed, logged, or embedded in the mobile APK. Tester provisioning and secure mobile storage are still to be implemented; the current recorder makes no server requests.

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

Deploy code by copying the server workspace, protocol workspace, root manifests/lockfile, workspace package manifests, and these container files, then rebuilding. Do not copy `.git`, recordings, unrelated environment files, or SSH keys into the image.

Before claiming public access, verify both unauthorized rejection and an authenticated health response through the Windows nginx HTTPS endpoint from outside the home network. Deployment inside WSL alone does not verify the public proxy path.

## Public endpoint verification

On 12 October 2026, `http://sporeward.redlan.co/health` redirected to HTTPS (301), and `https://sporeward.redlan.co/health` passed TLS certificate verification. Missing/invalid credentials returned 401; authenticated health returned 200. nginx was configured by the project owner. Cellular access can be verified during the next outing.

# Project Instructions & Conventions

- **GitHub Actions Workflows**: Whenever generating, updating, or reconfiguring Firebase or GitHub Actions workflow files (such as `.github/workflows/firebase-hosting-merge.yml`), always ensure that the build step uses `npm install && npm run build` instead of `npm ci`.

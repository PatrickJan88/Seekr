# Project Instructions & Conventions

- **GitHub Actions Workflows**: Whenever generating, updating, or reconfiguring Firebase or GitHub Actions workflow files (such as `.github/workflows/firebase-hosting-merge.yml`), always ensure that the build step uses `npm install && npm run build` instead of `npm ci`.

- **Documentation (README.md)**: Do not use emojis before any title or subtitle in README.md or similar markdown documentation files. Keep the markdown headers clean and professional.

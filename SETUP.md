# Publishing Setup for express-simp

This package uses **npm Trusted Publishing** via GitHub Actions OIDC for secure, token-free publishing.

## First-Time Setup (Carl)

### 1. Initial Manual Publish

Since the package `express-simp` doesn't exist on npm yet, you must publish version 0.0.1 manually **once**:

```bash
npm login
npm publish --access public
```

This creates the package on npm under your account.

### 2. Configure npm Trusted Publisher

After the first manual publish, configure GitHub Actions as a trusted publisher:

1. Go to [npmjs.com](https://www.npmjs.com) and log in
2. Navigate to the `express-simp` package settings
3. Go to **Publishing access** → **Trusted Publishers**
4. Click **Add a new trusted publisher**
5. Select **GitHub Actions**
6. Fill in:
   - **Repository owner**: `carllippert`
   - **Repository name**: `express-simp`
   - **Workflow file**: `publish.yml`
   - **Environment** (optional): leave blank
7. Save

### 3. Publishing New Versions

After Trusted Publisher is configured, all future releases are automated:

1. Update version in `package.json` (e.g., `0.0.2`)
2. Commit and push to main
3. Create a git tag:
   ```bash
   git tag v0.0.2
   git push origin v0.0.2
   ```
4. GitHub Actions will automatically:
   - Run tests
   - Publish to npm with provenance
   - No secrets or tokens needed!

## How It Works

- The `publish.yml` workflow uses OIDC (`id-token: write` permission)
- npm verifies the GitHub Actions identity via OpenID Connect
- `npm publish --provenance` creates a cryptographically signed attestation linking the npm package to the GitHub source
- No long-lived tokens = better security

## Verification

After publishing, you can verify provenance on npm:

```bash
npm view express-simp
```

Look for the `publishConfig.provenance` field showing the GitHub Actions attestation.

## Troubleshooting

**Error: "Unable to authenticate"**
- Verify Trusted Publisher is configured on npm for exact repo/workflow names
- Check that workflow has `id-token: write` permission
- Ensure package was published manually at least once

**First publish fails in CI**
- Expected! First publish must be manual to create the package
- CI publishing only works for updates to existing packages

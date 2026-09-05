# Publishing Setup for express-simp

This package uses automated GitHub Actions publishing with a **granular npm access token**.

## Setup (Carl)

### 1. Create a Granular Access Token on npm

1. Go to [npmjs.com](https://www.npmjs.com) and log in
2. Navigate to **Access Tokens** (under your profile)
3. Click **Generate New Token** → **Granular Access Token**
4. Configure the token:
   - **Token name**: `express-simp-github-actions` (or similar)
   - **Expiration**: 1 year (or your preference)
   - **Packages and scopes**: Select `express-simp` package
   - **Permissions**: Read and write
5. Copy the token (starts with `npm_...`)

### 2. Add Token to GitHub Secrets

1. Go to the GitHub repo settings
2. Navigate to **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `NPM_TOKEN`
5. Value: paste the granular token from step 1
6. Save

### 3. Publishing New Versions

Once the token is configured, all future releases are automated:

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
   - Token expires after 1 year (renew as needed)

## Optional: npm Trusted Publisher (OIDC)

For token-free publishing, you can optionally configure npm Trusted Publishing:

1. After the first manual publish, go to [npmjs.com](https://www.npmjs.com)
2. Navigate to the `express-simp` package settings
3. Go to **Publishing access** → **Trusted Publishers**
4. Add GitHub Actions as a trusted publisher:
   - **Repository owner**: `carllippert`
   - **Repository name**: `express-simp`
   - **Workflow file**: `publish.yml`
5. Remove the `NPM_TOKEN` secret from GitHub
6. Update `.github/workflows/publish.yml` to use OIDC instead

**Benefits**: No token rotation needed, cryptographically signed attestations

## Troubleshooting

**Error: "Unable to authenticate"**
- Verify `NPM_TOKEN` secret exists in GitHub Actions secrets
- Check that the token has write permissions for `express-simp`
- Ensure token hasn't expired

**Error: "You must be logged in to publish"**
- The workflow needs `NPM_TOKEN` configured as a repository secret
- Make sure the publish step includes: `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}`

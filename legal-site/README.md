# StudyMap Legal Pages

This directory contains the static HTML pages required for App Store review: **Support**, **Terms
of Use**, and **Privacy Policy**. They are completely static and can be deployed on Vercel without
any build step.

## Deployment Steps (Vercel)

1. Install the Vercel CLI if it isn’t already available:
   ```bash
   npm install -g vercel
   ```
2. Log in to your Vercel account:
   ```bash
   vercel login
   ```
3. Deploy from the project directory:
   ```bash
   cd legal-site
   vercel
   ```
   - When prompted for project name, pick something like `studymap-site`.
   - Leave the build command and output directory blank (static hosting).
4. Promote the deployment to production (optional but recommended):
   ```bash
   vercel --prod
   ```

The deployment will expose the following routes automatically:

- `/support.html` → Support Center
- `/terms.html` → Terms of Use
- `/privacy.html` → Privacy Policy
- `/` → Landing page with quick links

After deployment, update the in-app constants (e.g. `TERMS_OF_USE_URL`,
`PRIVACY_POLICY_URL`) and the App Store Connect “Privacy Policy URL” field with the final domain the
Vercel dashboard provides.***

# QA Testing Sample Application

A web application used for QA agent testing of UI functions and UI inspection. Deployable on AWS Amplify.

## Features

- **File Upload** — drag-and-drop zone, browse button, multi-file support, file list with name/size, remove per file, upload status counter
- **Copy to Clipboard** — single-line text input, multi-line textarea, and code block each with copy buttons and visual feedback

## Run Locally

Use `npm ci` (not `npm install`) so the committed `package-lock.json`
integrity hashes are enforced exactly and the `serve` binary is resolved
from the local, lockfile-verified `node_modules/.bin/` rather than fetched
from the registry at invoke time:

```bash
npm ci --ignore-scripts
npm start
```

Opens at http://localhost:3000

## Deploy on AWS Amplify

Connect this repository in the AWS Amplify console. It will auto-detect `amplify.yml` and deploy the `public/` directory as a static site.

## Project Structure

```
├── amplify.yml          # Amplify build configuration
├── package.json         # Project metadata and scripts
└── public/
    ├── index.html       # Main page
    ├── styles.css       # Styling
    └── app.js           # Interactive logic
```

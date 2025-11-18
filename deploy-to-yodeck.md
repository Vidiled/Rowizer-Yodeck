# Deploying Rowizer-Yodeck as a Yodeck HTML App

This document describes the minimal steps for packaging and deploying this project as a Yodeck HTML App and how to configure the app in the Yodeck portal.

Prerequisites
- A Yodeck account with permission to add Custom Apps
- If you use API tokens, treat them as secrets (do not commit tokens to source control)

Files of interest
- `index.html` — the app entry point
- `js/` — application code (module-based)
- `styles.css` — styling (includes the on-screen error banner)
- `schema.json` — UI configuration schema to paste into Yodeck

Quick steps

1) Zip the app files

From the project root (the ZIP must contain the files at the root of the archive, not inside a single folder):

```bash
# Create a zip in the parent directory
zip -r ../rowizer-yodeck.zip . -x '*.git*'
```

2) Create the Custom App in Yodeck
- Go to Yodeck → Media & Apps → Custom Apps → Add New → HTML App
- Upload `rowizer-yodeck.zip`
- Give it a name and icon

3) Add UI Configuration
- In the Custom App form you will find a "UI Configuration" text area. Paste the contents of `schema.json` there. This makes the following fields available to administrators when they create an instance of the app:
  - `portal` (Text)
  - `token` (Password)
  - `branch` (Text)
  - `departmentsIgnore` (Text, comma separated)
  - `mergeAppointments` (Checkbox)
  - `external` (Text)
  - `date` (Date)


4) Save and assign
- Save the Custom App in Yodeck and add it to a Playlist or Schedule as you normally do. Push changes so Players receive the new app.



On-screen errors
- The app displays a small, dismissible error banner at the top of the screen when initialization fails or when `init_widget` throws an exception. This helps admins notice misconfiguration quickly.


Troubleshooting
- If the app shows the error banner after upload, check the browser console on the Player (or use the web preview in Yodeck) for details. Typical causes:
  - Missing `token` or `portal`
  - Invalid `branch` code
  - Network issues reaching Zermelo

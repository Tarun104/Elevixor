## File upload + mailer server

This workspace includes a small Node.js server that accepts file uploads from the `data-business-analyst-template.html` page and sends them as an email attachment to the target Gmail address.

Files added:
- `server.js` — Express + multer + nodemailer server listening on `/upload`
- `package.json` — dependencies and start script

Setup and run (Windows)
1. Install Node.js (if not already).
2. In a terminal, install dependencies:

```bash
npm install
```

3. Create a `.env` file in the workspace root with these variables:

```
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=your_app_password
PORT=3000
```

Note: For Gmail, you must use an App Password for SMTP access. A normal Gmail account password will often fail with `535 5.7.8 Username and Password not accepted` unless App Passwords are configured. See Google account security settings.

4. Start the server:

```bash
npm start
```

5. Open `data-business-analyst-template.html` in your browser (served from the same machine). The page posts to `http://localhost:3000/upload`.

Backend folder structure
- `package.json` — Node.js dependency manifest
- `server.js` — Express backend with upload, OTP, and email routes
- `.env` — local secret config (never commit this)
- `.env.example` — example environment variables file

Required npm packages
- `express`
- `multer`
- `nodemailer`
- `dotenv`

Frontend / backend run commands
1. Install dependencies:
```bash
npm install
```
2. Start the backend server:
```bash
npm start
```
3. Open the login page in your browser:
```bash
http://localhost:3000/login.html
```

Note: Users sign in with their own Gmail address and a password they create for this site; they do not need to enter their Gmail account password into the login form.

Note: the frontend should be opened from the backend server URL, not from `file://`.

Security
- Do NOT commit `.env` or your credentials to source control.
- This server is minimal and intended for local use or a small trusted environment. For production use, add authentication, sanitization, rate limits, and secure hosting.

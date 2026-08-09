Title: Fix: store auth token on login and fetch profile to render avatar

Summary:
- Store the backend JWT token on successful login and fetch `/api/dashboard/profile` from the homepage to render the avatar and account link.
- Add server-side avatar persistence: accept avatar uploads and save `avatarUrl` on the User model.
- Make auth middleware accept file-backed users (email-based tokens) as a fallback for legacy users.
- Add a static Sign In fallback in the navbar so deployed site always shows login option even if JS fails.

Files changed:
- `index.html` — fetch profile when token present, render avatar, static Sign In fallback
- `login.html` — store `authToken` and `userFirstName`/`userLastName` on successful login
- `server/middleware/auth.js` — accept tokens that reference DB ObjectId or file-backed email, fall back to `users.json`
- `server/models/User.js` — add `avatarUrl` field
- `server/controllers/dashboardController.js` — add `uploadAvatar` to accept avatar file and update user
- `server/routes/dashboard.js` — add `POST /api/dashboard/profile/avatar` route with multer upload

Testing & Deployment Steps (Render):
1. Merge this branch into `main`.
2. On Render, ensure your service is connected and set to deploy from `main`.
3. Trigger a manual deploy or wait for automatic deployment.
4. Restart backend if necessary.

Runtime verification:
- Sign in on deployed site. In DevTools Console verify:
  - `localStorage.getItem('loggedIn') === 'true'`
  - `localStorage.getItem('authToken')` contains a token
- In Network, confirm `/api/dashboard/profile` is requested and returns 200 with `{ user: {...} }`.
- To upload avatar, submit a multipart/form POST to `/api/dashboard/profile/avatar` with form field `avatar` set to a file. On success the response will include the updated `user.avatarUrl`.

Notes:
- For file-backed legacy users (stored in `users.json`), avatar upload is not supported; avatar persistence requires a DB-backed user.
- If `/api/dashboard/profile` returns 401 after deployment, ensure the deployed backend and frontend use the same `JWT_SECRET` and tokens are being stored and transmitted correctly.

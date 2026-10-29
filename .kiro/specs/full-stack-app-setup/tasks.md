# Implementation Plan: Full-Stack App Setup

## Overview

Scaffold a production-ready TypeScript monorepo with a React 19 + Vite frontend and a
Node.js + Express backend, PostgreSQL via Sequelize ORM, JWT authentication, environment-driven
configuration, ESLint/Prettier/Husky code-quality tooling, and comprehensive documentation.
Each task builds incrementally toward a fully wired, tested application.

---

## Tasks

- [x] 1. Initialize monorepo root scaffold
  - [x] 1.1 Create root `package.json` with `workspaces: ["frontend", "backend"]`, and scripts for `lint`, `format`, and `prepare`
    - Include `private: true` and set `engines.node` to the required Node version
    - _Requirements: 1.1_
  - [x] 1.2 Create root `.gitignore` covering `node_modules/`, `dist/`, `.env`, `.env.development`, `.env.stage`, `.env.production`, `*.tsbuildinfo`, and `coverage/`; explicitly NOT ignoring `.env.example`
    - _Requirements: 1.6, 6.7_
  - [x] 1.3 Create root `.prettierrc` with `{ "printWidth": 100, "singleQuote": true, "trailingComma": "all", "semi": true }`
    - _Requirements: 7.3_
  - [x] 1.4 Create root `eslint.config.js` referencing both `frontend/tsconfig.json` and `backend/tsconfig.json`, enabling `@typescript-eslint/recommended` and setting `@typescript-eslint/no-unused-vars` to `"error"`
    - _Requirements: 7.1, 7.2, 7.4_
  - [x] 1.5 Initialize Husky and create `.husky/pre-commit` hook that runs `lint-staged`; configure `lint-staged` in root `package.json` to run the linter on staged `*.ts`/`*.tsx` files and the formatter on staged `*.ts`, `*.tsx`, `*.json`, `*.md` files
    - _Requirements: 7.6, 7.7_

- [x] 2. Scaffold frontend package
  - [x] 2.1 Create `frontend/package.json` listing all required production dependencies (`react`, `react-dom`, `@mui/material`, `@emotion/react`, `@emotion/styled`, `@reduxjs/toolkit`, `react-redux`, `@tanstack/react-query`, `axios`, `react-router-dom`) and dev dependencies (`vite`, `@vitejs/plugin-react`, `typescript`)
    - _Requirements: 2.1, 2.3_
  - [x] 2.2 Create `frontend/tsconfig.json` with `strict: true`, `target: "ES2020"`, and `moduleResolution: "bundler"`
    - _Requirements: 2.1_
  - [x] 2.3 Create `frontend/vite.config.ts` setting `server.port = 3000` for development, with the React plugin configured
    - _Requirements: 2.2_
  - [x] 2.4 Create all required `frontend/src/` sub-directories (`assets/`, `components/`, `pages/`, `hooks/`, `store/`, `services/`, `routes/`, `types/`, `utils/`) each with a placeholder `.gitkeep` or `index.ts`
    - _Requirements: 1.4_

- [x] 3. Scaffold backend package
  - [x] 3.1 Create `backend/package.json` listing production dependencies (`express`, `sequelize`, `pg`, `pg-hstore`, `jsonwebtoken`, `bcrypt`, `dotenv`) and dev dependencies (`typescript`, `ts-node-dev`, `@types/express`, `@types/jsonwebtoken`, `@types/bcrypt`, `sequelize-cli`, `fast-check`, `jest`, `ts-jest`, `@types/jest`)
    - _Requirements: 3.1, 3.5_
  - [x] 3.2 Create `backend/tsconfig.json` with `strict: true`, `outDir: "dist"`, and `rootDir: "src"`
    - _Requirements: 3.1_
  - [x] 3.3 Create all required `backend/src/` sub-directories (`config/`, `controllers/`, `middlewares/`, `models/`, `routes/`, `services/`, `types/`, `utils/`) each with a placeholder `.gitkeep` or `index.ts`; also create `backend/database/migrations/` and `backend/database/seeders/`
    - _Requirements: 1.5_

- [~] 4. Checkpoint — verify project structure
  - Ensure root `package.json` workspaces resolve correctly (`npm install` succeeds), all placeholder directories exist, and `.husky/pre-commit` is executable. Ask the user if questions arise.

- [x] 5. Implement backend Config Loader
  - [x] 5.1 Write `backend/src/config/index.ts` that reads `.env.<NODE_ENV>` via `dotenv`, validates the presence of all seven required variables (`NODE_ENV`, `PORT`, `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ACCESS_TOKEN_EXPIRY`, `REFRESH_TOKEN_EXPIRY`), logs each missing variable name, and calls `process.exit(1)` if any are missing or if `NODE_ENV` is invalid; export a typed `AppConfig` object
    - _Requirements: 6.2, 6.3, 6.5, 6.6, 6.8_
  - [x] 5.2 Write property test for Config Loader — Property 10: Config Loader reports all missing required variables
    - **Property 10: Config Loader reports all missing required variables**
    - **Validates: Requirements 6.5, 6.6**
    - Use `fast-check` to generate non-empty subsets of the seven required variable names, verify that each missing variable is logged and `process.exit` is called
    - Tag: `Feature: full-stack-app-setup, Property 10: Config Loader reports all missing required variables`
  - [x] 5.3 Write unit tests for Config Loader
    - Test that valid config loads and exports correct typed values
    - Test that invalid `NODE_ENV` causes exit with error log
    - Test that correct `.env.<NODE_ENV>` file is selected
    - _Requirements: 6.2, 6.6_
  - [x] 5.4 Create `backend/.env.example` documenting all seven required variables with placeholder values; create root-level `.env.example` documenting `VITE_API_BASE_URL`
    - _Requirements: 6.1_

- [ ] 6. Implement Sequelize setup and data models
  - [x] 6.1 Create `backend/database/config/config.js` with `development`, `test`, and `production` sections each using `use_env_variable: 'DATABASE_URL'` and `dialect: 'postgres'`
    - _Requirements: 4.2_
  - [x] 6.2 Write timestamped migration `YYYYMMDDHHMMSS-create-users.js` under `backend/database/migrations/` creating the `users` table (`id`, `email`, `password`, `created_at`, `updated_at`) with correct constraints
    - _Requirements: 4.3_
  - [x] 6.3 Write timestamped migration `YYYYMMDDHHMMSS-create-revoked-tokens.js` creating the `revoked_tokens` table (`id`, `token_hash`, `revoked_at`, `expires_at`) with correct constraints
    - _Requirements: 4.3_
  - [x] 6.4 Write `backend/database/seeders/YYYYMMDDHHMMSS-demo-users.js` that inserts at least one demo user record
    - _Requirements: 4.5_
  - [x] 6.5 Add `db:migrate`, `db:seed`, and `db:migrate:undo` scripts to `backend/package.json` calling the respective `sequelize-cli` commands
    - _Requirements: 4.4, 4.5, 4.6_
  - [-] 6.6 Write `backend/src/models/index.ts` that initializes a Sequelize instance from `AppConfig.databaseUrl`, calls `sequelize.authenticate()` at startup, logs `"Database connection established"` on success, and calls `process.exit(1)` with the host:port on failure; define `User` and `RevokedToken` Sequelize models with `UserAttributes` and `RevokedTokenAttributes` interfaces
    - _Requirements: 4.1, 4.7, 4.8_
  - [-] 6.7 Write unit tests for Sequelize model initialization
    - Test that DB unreachable triggers `process.exit(1)` with error log containing host:port
    - Test that DB reachable logs confirmation before server starts
    - _Requirements: 4.7, 4.8_

- [ ] 7. Implement Auth Service
  - [-] 7.1 Write `backend/src/services/authService.ts` implementing the `AuthService` interface: `login`, `refresh`, `logout`, `verifyAccessToken`, `revokeRefreshToken`, `isRefreshTokenRevoked`; sign tokens with `JWT_SECRET` / `JWT_REFRESH_SECRET`; set `accessToken` expiry to `ACCESS_TOKEN_EXPIRY` seconds and `refreshToken` expiry to `REFRESH_TOKEN_EXPIRY` seconds; store revoked token hashes in the `revoked_tokens` table
    - _Requirements: 5.1, 5.2, 5.3, 5.6, 5.7, 5.8_
  - [~] 7.2 Write property test for Auth Service — Property 6: Token generation produces correctly timed expiry claims
    - **Property 6: Token generation produces correctly timed expiry claims**
    - **Validates: Requirements 5.1, 6.8**
    - Use `fast-check` to generate valid `email`/`password` combinations; assert `exp = iat + ACCESS_TOKEN_EXPIRY` for access tokens and `exp = iat + REFRESH_TOKEN_EXPIRY` for refresh tokens
    - Tag: `Feature: full-stack-app-setup, Property 6: Token generation produces correctly timed expiry claims`
  - [~] 7.3 Write property test for Auth Service — Property 7: Refresh token rotation — used token is always revoked
    - **Property 7: Refresh token rotation — used token is always revoked**
    - **Validates: Requirements 5.2**
    - Use `fast-check` to generate valid non-expired refresh tokens; call refresh endpoint; assert subsequent use of the same token returns HTTP 401
    - Tag: `Feature: full-stack-app-setup, Property 7: Refresh token rotation — used token is always revoked`
  - [~] 7.4 Write property test for Auth Service — Property 8: Logout revocation — any valid Refresh_Token becomes unusable after logout
    - **Property 8: Logout revocation — any valid Refresh_Token becomes unusable after logout**
    - **Validates: Requirements 5.6**
    - Use `fast-check` to generate valid non-expired refresh tokens; call logout; assert subsequent refresh call returns HTTP 401
    - Tag: `Feature: full-stack-app-setup, Property 8: Logout revocation — any valid Refresh_Token becomes unusable after logout`
  - [~] 7.5 Write unit tests for Auth Service
    - Test `POST /api/auth/login` returns 401 for invalid credentials
    - Test `POST /api/auth/logout` returns 200 for already-expired/invalid refresh token (no-op)
    - Test `POST /api/auth/refresh` returns 401 for expired/malformed token
    - _Requirements: 5.3, 5.7_

- [ ] 8. Implement Express middleware
  - [~] 8.1 Write `backend/src/middlewares/authMiddleware.ts` that reads the `Authorization` header, verifies the Access_Token via `authService.verifyAccessToken`, attaches the decoded payload to `req.user` on success, and returns HTTP `401 { "message": "Unauthorized" }` on missing, expired, or malformed tokens
    - _Requirements: 5.4, 5.5_
  - [~] 8.2 Write property test for auth middleware — Property 4: Auth middleware allows any valid, non-expired Access_Token
    - **Property 4: Auth middleware allows any valid, non-expired Access_Token**
    - **Validates: Requirements 5.4**
    - Use `fast-check` to generate payloads; sign each with `JWT_SECRET` using a future `exp`; assert middleware calls `next()` and sets `req.user`
    - Tag: `Feature: full-stack-app-setup, Property 4: Auth middleware allows any valid, non-expired Access_Token`
  - [~] 8.3 Write property test for auth middleware — Property 5: Auth middleware rejects any expired or malformed Access_Token
    - **Property 5: Auth middleware rejects any expired or malformed Access_Token**
    - **Validates: Requirements 5.5**
    - Use `fast-check` to generate arbitrary strings and expired tokens; assert middleware returns HTTP 401 without calling `next()`
    - Tag: `Feature: full-stack-app-setup, Property 5: Auth middleware rejects any expired or malformed Access_Token`
  - [~] 8.4 Write `backend/src/middlewares/errorMiddleware.ts` as a 4-argument Express error handler that returns HTTP `400` for JSON parse errors and HTTP `500` for all other errors, logging the full stack to `console.error`; the stack trace SHALL NOT appear in the response body
    - _Requirements: 3.6, 3.7_
  - [~] 8.5 Write property test for error middleware — Property 3: Error middleware never exposes stack traces in the response body
    - **Property 3: Error middleware never exposes stack traces in the response body**
    - **Validates: Requirements 3.6**
    - Use `fast-check` to generate arbitrary `Error` objects with random messages and stack depths; assert response body never contains the stack trace string
    - Tag: `Feature: full-stack-app-setup, Property 3: Error middleware never exposes stack traces in the response body`

- [ ] 9. Implement Express routes and application wiring (backend)
  - [~] 9.1 Write `backend/src/controllers/authController.ts` with JSDoc-annotated handlers for `POST /api/auth/login`, `POST /api/auth/refresh`, and `POST /api/auth/logout`, delegating to `AuthService`
    - _Requirements: 5.1, 5.2, 5.3, 5.6, 5.7, 8.6_
  - [~] 9.2 Write `backend/src/routes/authRoutes.ts` wiring the auth controller handlers to their respective paths; write `backend/src/routes/index.ts` mounting `authRoutes` under `/api/auth` and defining `GET /api/health` (with JSDoc) returning `{ "status": "ok" }`
    - _Requirements: 3.4, 5.1, 5.2, 5.6_
  - [~] 9.3 Write `backend/src/app.ts` registering `express.json()`, mounting `/api` routes, and registering `errorMiddleware` as the last middleware
    - _Requirements: 3.3, 3.6_
  - [~] 9.4 Write `backend/src/server.ts` (entry point) that imports `AppConfig`, initializes `sequelize.authenticate()`, then starts the Express HTTP server on `AppConfig.port`; add a `dev` script using `ts-node-dev` and a `build`/`start` script for production
    - _Requirements: 3.2, 3.5, 4.7, 4.8_
  - [~] 9.5 Write unit tests for routes
    - Test `GET /api/health` returns `{ "status": "ok" }` with HTTP 200
    - Test Express defaults to port 5000 when `PORT` is absent
    - Test `express.json()` correctly parses request bodies
    - _Requirements: 3.2, 3.3, 3.4_

- [~] 10. Checkpoint — verify backend functionality
  - Ensure `npm run dev` (backend) starts without errors, `GET /api/health` returns 200, and all backend unit/property tests pass. Ask the user if questions arise.

- [ ] 11. Implement frontend Redux store
  - [-] 11.1 Write `frontend/src/store/index.ts` creating a Redux store with `configureStore`, containing an `authSlice` with `AuthState` (`accessToken`, `isAuthenticated`), and exporting typed `RootState` and `AppDispatch`
    - _Requirements: 2.5_
  - [-] 11.2 Write unit tests for the Redux store and `authSlice`
    - Test initial state, token set/clear actions, and `isAuthenticated` transitions
    - _Requirements: 2.5_

- [ ] 12. Implement frontend Axios API Client
  - [x] 12.1 Write `frontend/src/utils/env.ts` exporting `API_BASE_URL` read from `import.meta.env.VITE_API_BASE_URL`
    - _Requirements: 6.4_
  - [ ] 12.2 Write `frontend/src/services/apiClient.ts` as a singleton Axios instance with a request interceptor that attaches `Authorization: Bearer <token>` when an Access_Token exists in storage, and a response interceptor that on HTTP 401 attempts exactly one `POST /api/auth/refresh`, retries the original request on success, and clears tokens + redirects to `/login` on failure
    - _Requirements: 2.6, 2.7, 5.9, 5.10_
  - [~] 12.3 Write property test for API Client — Property 1: API Client attaches Bearer token for any stored Access_Token
    - **Property 1: API Client attaches Bearer token for any stored Access_Token**
    - **Validates: Requirements 2.6**
    - Use `fast-check` to generate arbitrary non-empty token strings; mock localStorage; assert every outgoing request includes `Authorization: Bearer <token>`
    - Tag: `Feature: full-stack-app-setup, Property 1: API Client attaches Bearer token for any stored Access_Token`
  - [~] 12.4 Write property test for API Client — Property 9: API_Client performs exactly one refresh attempt on HTTP 401
    - **Property 9: API_Client performs exactly one refresh attempt on HTTP 401**
    - **Validates: Requirements 5.9**
    - Use `fast-check` to generate protected endpoint URLs; mock Axios adapter to return 401; assert refresh endpoint is called exactly once before retry or redirect
    - Tag: `Feature: full-stack-app-setup, Property 9: API_Client performs exactly one refresh attempt on HTTP 401`
  - [~] 12.5 Write unit tests for API Client
    - Test no Authorization header when no token in storage (Requirement 2.7)
    - Test tokens cleared and redirect to `/login` when refresh also returns 401 (Requirement 5.10)

- [ ] 13. Implement frontend routing with protected routes
  - [~] 13.1 Write `frontend/src/routes/index.tsx` defining all application routes (at minimum `/login`, `/register`, and a protected home route); wrap protected routes in a `ProtectedRoute` component that reads the Access_Token, decodes its `exp` claim against `Date.now()`, and redirects to `/login` if absent or expired
    - _Requirements: 2.8, 2.9, 2.10_
  - [~] 13.2 Write property test for protected routes — Property 2: Protected Route redirects to `/login` for any expired or absent token
    - **Property 2: Protected Route redirects to `/login` for any expired or absent token**
    - **Validates: Requirements 2.10**
    - Use `fast-check` to generate JWT payloads with `exp` values in the past (and the absent-token case); render `ProtectedRoute` with React Testing Library; assert redirect to `/login` without rendering child
    - Tag: `Feature: full-stack-app-setup, Property 2: Protected Route redirects to /login for any expired or absent token`
  - [~] 13.3 Write unit tests for routing
    - Test that a valid, non-expired token allows rendering the protected child component
    - Test public routes are accessible without any token
    - _Requirements: 2.9, 2.10_

- [ ] 14. Wire frontend application entry point
  - [~] 14.1 Write `frontend/src/main.tsx` creating a single `QueryClient` instance at module level, wrapping the component tree with `QueryClientProvider`, `Provider` (Redux), and `BrowserRouter` (or `RouterProvider`), and mounting to `#root`
    - _Requirements: 2.4_
  - [~] 14.2 Write a minimal `frontend/src/App.tsx` (or equivalent root component) that renders the route definitions from `src/routes/index.tsx`
    - _Requirements: 2.8_
  - [~] 14.3 Write unit tests for the application entry point
    - Test `QueryClientProvider` is present in the rendered tree
    - Test Redux `Provider` is present in the rendered tree
    - _Requirements: 2.4_

- [~] 15. Checkpoint — verify full-stack integration
  - Ensure frontend builds successfully (`vite build`), the dev server starts on port 3000, all frontend unit/property tests pass, and the frontend can reach the backend health endpoint. Ask the user if questions arise.

- [ ] 16. Create documentation files
  - [~] 16.1 Write `docs/ARCHITECTURE.md` describing the monorepo high-level architecture (include or reference the Mermaid diagrams from the design), the rationale for each top-level folder, and the justification for each major technology choice
    - _Requirements: 8.2_
  - [~] 16.2 Write `docs/SETUP.md` with numbered setup instructions for `development`, `stage`, and `production` environments covering: cloning, installing dependencies, creating the database, populating `.env.<environment>`, running migrations, seeding, and starting both packages
    - _Requirements: 8.3_
  - [~] 16.3 Write `docs/API.md` documenting all Backend endpoints (`GET /api/health`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`) with HTTP method, path, headers, request body schema, response schemas for all status codes, and at least one example request/response pair
    - _Requirements: 8.4_
  - [~] 16.4 Write `docs/AUTH.md` explaining the full JWT authentication flow (login → access token issuance → protected request → token refresh → logout), where tokens are stored on the frontend, and how the Axios API Client handles automatic token refresh
    - _Requirements: 8.5_
  - [~] 16.5 Update root `README.md` to include: project purpose, system prerequisites (Node.js version, PostgreSQL version, npm version), installation steps, a table of all available npm scripts, and links to the four `docs/` files
    - _Requirements: 8.1_

- [~] 17. Final checkpoint — full project verification
  - Ensure all tests pass (unit, property, integration), `npm run lint` exits with code 0, `npm run format` produces no diffs, and all documentation files exist. Ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for full traceability
- Property-based tests use **fast-check** with a minimum of 100 iterations per property (`numRuns: 100`)
- Checkpoints at tasks 4, 10, 15, and 17 ensure incremental validation at natural boundaries
- All JWT secrets must be read from environment variables — never hard-coded
- The startup validation order (NODE_ENV → load .env → validate vars → DB auth → HTTP server) must be preserved in `server.ts`

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "1.4", "1.5"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3", "2.4", "3.1", "3.2", "3.3"] },
    { "id": 2, "tasks": ["5.1", "5.4", "6.1"] },
    { "id": 3, "tasks": ["5.2", "5.3", "6.2", "6.3", "6.4", "6.5"] },
    { "id": 4, "tasks": ["6.6", "11.1", "12.1"] },
    { "id": 5, "tasks": ["6.7", "7.1", "11.2", "12.2"] },
    { "id": 6, "tasks": ["7.2", "7.3", "7.4", "7.5", "8.1", "8.4", "12.3", "12.4", "12.5"] },
    { "id": 7, "tasks": ["8.2", "8.3", "8.5", "9.1", "13.1"] },
    { "id": 8, "tasks": ["9.2", "9.5", "13.2", "13.3"] },
    { "id": 9, "tasks": ["9.3", "14.1"] },
    { "id": 10, "tasks": ["9.4", "14.2"] },
    { "id": 11, "tasks": ["14.3"] },
    { "id": 12, "tasks": ["16.1", "16.2", "16.3", "16.4", "16.5"] }
  ]
}
```

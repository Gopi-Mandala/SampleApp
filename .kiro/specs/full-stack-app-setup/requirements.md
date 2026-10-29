# Requirements Document

## Introduction

This document defines the requirements for scaffolding a production-ready full-stack web application. The project combines a React 19 + TypeScript frontend with a Node.js + Express + TypeScript backend, PostgreSQL as the relational database, Sequelize as the ORM, and JWT-based authentication. The setup covers three deployment environments (development, stage, production), enforces code quality through ESLint, Prettier, and Husky pre-commit hooks, and includes comprehensive documentation.

---

## Glossary

- **Frontend**: The React 19 + TypeScript + Vite client-side application.
- **Backend**: The Node.js + Express + TypeScript server-side application.
- **Database**: The PostgreSQL relational database instance.
- **ORM**: Sequelize — the object-relational mapper used to interact with the Database.
- **Auth_Service**: The module responsible for generating, validating, and refreshing JWT tokens.
- **API_Client**: The Axios-based HTTP client on the Frontend used to communicate with the Backend.
- **Store**: The Redux Toolkit global state container on the Frontend.
- **Router**: React Router v7 instance managing client-side navigation.
- **Query_Manager**: TanStack Query instance managing server-state caching and synchronization on the Frontend.
- **Config_Loader**: The module that reads and exposes environment-specific configuration values from `.env` files.
- **Linter**: ESLint configured for TypeScript across both Frontend and Backend.
- **Formatter**: Prettier configured for consistent code style across the monorepo.
- **Hook_Runner**: Husky managing Git pre-commit hooks.
- **Environment**: One of three deployment targets — `development`, `stage`, or `production`.
- **Migration**: A versioned Sequelize database schema change script.
- **Seed**: A Sequelize script that inserts baseline data into the Database.
- **Access_Token**: A short-lived JWT used to authenticate API requests.
- **Refresh_Token**: A long-lived JWT used to obtain a new Access_Token without re-authentication.
- **Monorepo**: The single repository containing both Frontend and Backend workspaces.
- **Protected Route**: Any Frontend route or Backend API endpoint that requires a valid Access_Token to access.
- **Public Route**: Any Frontend route or Backend API endpoint that is accessible without authentication (e.g., `/login`, `/api/health`).

---

## Requirements

### Requirement 1: Project Scaffolding and Folder Structure

**User Story:** As a developer, I want a well-defined monorepo folder structure, so that both Frontend and Backend code are organized consistently and are easy to navigate.

#### Acceptance Criteria

1. THE Monorepo SHALL contain a root-level `package.json` with a `workspaces` field that lists `["frontend", "backend"]`, enabling npm workspace commands across both packages.
2. THE Frontend SHALL be scaffolded under a `frontend/` directory using Vite with the React + TypeScript template, producing a valid `frontend/package.json` and `frontend/vite.config.ts`.
3. THE Backend SHALL be scaffolded under a `backend/` directory as a Node.js + Express + TypeScript project, producing a valid `backend/package.json` and `backend/tsconfig.json`.
4. THE Frontend SHALL contain all of the following directories under `frontend/src/`: `assets/`, `components/`, `pages/`, `hooks/`, `store/`, `services/`, `routes/`, `types/`, and `utils/`, each with at least a placeholder `index.ts` or `.gitkeep` file.
5. THE Backend SHALL contain all of the following directories under `backend/src/`: `config/`, `controllers/`, `middlewares/`, `models/`, `routes/`, `services/`, `types/`, and `utils/`, each with at least a placeholder `index.ts` or `.gitkeep` file.
6. THE Monorepo SHALL contain a root-level `.gitignore` that includes entries for `node_modules/`, `dist/`, `.env`, `.env.development`, `.env.stage`, `.env.production`, and common build artifacts (e.g., `*.tsbuildinfo`, `coverage/`), while explicitly NOT excluding `.env.example`.

---

### Requirement 2: Frontend Technology Setup

**User Story:** As a developer, I want the Frontend configured with React 19, TypeScript, Vite, Material UI, TanStack Query, Redux Toolkit, Axios, and React Router v7, so that the UI layer is ready for feature development.

#### Acceptance Criteria

1. THE Frontend SHALL compile TypeScript source files using `frontend/tsconfig.json` configured with `strict: true`, `target: "ES2020"`, and `moduleResolution: "bundler"`.
2. IF the active Environment is `development` (i.e., `NODE_ENV=development`), THEN THE Frontend Vite dev server SHALL listen on port `3000`.
3. THE Frontend `package.json` SHALL list `@mui/material`, `@emotion/react`, and `@emotion/styled` as production dependencies.
4. THE Frontend SHALL wrap the top-level React component tree with a single `QueryClientProvider` providing a shared `QueryClient` instance, ensuring all child components share the same server-state cache.
5. THE Frontend SHALL export a Redux store from `src/store/index.ts` created with `configureStore`, containing a `reducer` map with at least one slice, and exporting typed `RootState` and `AppDispatch` types.
6. WHEN an outgoing API request is made and an Access_Token is present in storage, THE `API_Client` SHALL attach the header `Authorization: Bearer <token>` to the request before it is sent.
7. IF an outgoing API request is made and no Access_Token is present in storage, THEN THE `API_Client` SHALL send the request without an `Authorization` header.
8. THE Frontend SHALL use React Router v7 (`react-router-dom`) with all application routes defined in `src/routes/index.tsx`.
9. THE `src/routes/index.tsx` SHALL distinguish Protected Routes from Public Routes; any component rendered under a Protected Route definition SHALL be accessible only when a valid Access_Token is present.
10. WHEN a user navigates to a Protected Route and the Access_Token's `exp` claim is earlier than the current UTC time (or the token is absent), THE Router SHALL redirect the user to the `/login` page before rendering the Protected Route component.

---

### Requirement 3: Backend Technology Setup

**User Story:** As a developer, I want the Backend configured with Node.js, Express, and TypeScript, so that the API layer is type-safe and ready for feature development.

#### Acceptance Criteria

1. THE Backend SHALL compile TypeScript source files using `backend/tsconfig.json` configured with `strict: true`, `outDir: "dist"`, and `rootDir: "src"`.
2. THE Backend SHALL start an Express HTTP server listening on the port specified by the `PORT` environment variable, defaulting to `5000` when `PORT` is absent.
3. THE Backend SHALL register `express.json()` as a global middleware before any route handlers, so that all incoming request bodies are parsed as JSON.
4. THE Backend SHALL expose a health-check endpoint at `GET /api/health` that returns HTTP `200` with a JSON body of exactly `{ "status": "ok" }`.
5. WHEN `NODE_ENV` is set to `development` and a source file under `backend/src/` is saved, THE Backend SHALL automatically restart within 10 seconds without requiring a manual process restart, using `ts-node-dev` or equivalent tooling.
6. IF an unhandled error propagates to the Express error-handling middleware, THEN THE Backend SHALL return HTTP `500` with a JSON body containing a `message` field (e.g., `{ "message": "Internal Server Error" }`), and log the full error stack trace to the console; the stack trace SHALL NOT appear in the response body.
7. IF the request body cannot be parsed as valid JSON (e.g., malformed syntax), THEN THE Backend SHALL return HTTP `400` with a JSON body containing a `message` field describing the parse error.

---

### Requirement 4: Database Setup and ORM Configuration

**User Story:** As a developer, I want PostgreSQL connected through Sequelize ORM with migration and seed support, so that database changes are versioned and reproducible across environments.

#### Acceptance Criteria

1. THE ORM SHALL connect to the Database using the `DATABASE_URL` connection string (or equivalent host/port/user/password/dbname variables) supplied by the Config_Loader for the active Environment, without hard-coding any credentials in source files.
2. THE Backend SHALL include a `sequelize-cli` configuration file at `backend/database/config/config.json` (or a `.js`/`.ts` equivalent) containing separate named sections for `development`, `test`, and `production` environments, each specifying `dialect: "postgres"`.
3. THE ORM SHALL store all Migration files under `backend/database/migrations/` and all Seed files under `backend/database/seeders/`, with file names prefixed by a timestamp (e.g., `YYYYMMDDHHMMSS-<description>.js`).
4. WHEN the `db:migrate` npm script is executed, THE ORM SHALL apply all pending Migrations to the target Database in ascending timestamp order, and exit with code `0` on success.
5. WHEN the `db:seed` npm script is executed, THE ORM SHALL insert all Seed records into the target Database using `sequelize-cli db:seed:all`, and exit with code `0` on success.
6. WHEN the `db:migrate:undo` npm script is executed, THE ORM SHALL roll back exactly the most recently applied Migration and exit with code `0` on success.
7. IF the Database is unreachable when the Backend attempts to authenticate the connection at startup, THEN THE Backend SHALL log an error message that includes the connection target (host and port) and exit with a non-zero status code, without starting the HTTP server.
8. WHEN the Backend starts and the Database connection is successfully authenticated, THE Backend SHALL log a confirmation message (e.g., `"Database connection established"`) to the console before the HTTP server begins accepting requests.

---

### Requirement 5: Authentication Flow Using JWT

**User Story:** As a developer, I want JWT-based authentication with access and refresh tokens, so that users can securely log in and maintain sessions without exposing credentials.

#### Acceptance Criteria

1. WHEN a user submits valid credentials (`email` and `password`) to `POST /api/auth/login`, THE Auth_Service SHALL return a JSON response containing an `accessToken` with a 15-minute expiry (`exp` = now + 900 seconds) and a `refreshToken` with a 7-day expiry (`exp` = now + 604800 seconds).
2. WHEN a user submits a valid, non-expired Refresh_Token to `POST /api/auth/refresh`, THE Auth_Service SHALL return a new Access_Token with a 15-minute expiry and invalidate the previously used Refresh_Token (token rotation).
3. IF a user submits an expired or malformed token to `POST /api/auth/refresh`, THEN THE Auth_Service SHALL return HTTP `401` with a JSON body `{ "message": "Invalid or expired refresh token" }`.
4. WHEN a request includes a valid, non-expired Access_Token in the `Authorization: Bearer <token>` header, THE Backend SHALL allow the request to proceed to the Protected Route handler.
5. IF a request to a Protected Route includes an expired or malformed Access_Token, THEN THE Backend SHALL return HTTP `401` with a JSON body `{ "message": "Unauthorized" }` without invoking the route handler.
6. WHEN a user calls `POST /api/auth/logout` with a valid Refresh_Token in the request body, THE Auth_Service SHALL mark that Refresh_Token as revoked so that any subsequent `POST /api/auth/refresh` using the same token returns HTTP `401`.
7. IF the Refresh_Token supplied to `POST /api/auth/logout` is already expired or invalid, THEN THE Auth_Service SHALL still return HTTP `200`, treating the logout as a no-op.
8. THE Auth_Service SHALL sign both Access_Tokens and Refresh_Tokens using secret keys read from the `JWT_SECRET` and `JWT_REFRESH_SECRET` environment variables respectively; these values SHALL NOT appear as literals in any source file.
9. THE Frontend API_Client SHALL automatically attempt exactly one token refresh using the stored Refresh_Token WHEN it receives an HTTP `401` response from a Protected Route, and retry the original failed request with the new Access_Token upon success.
10. IF the token refresh attempt in criterion 9 also fails with HTTP `401`, THEN THE API_Client SHALL remove the stored Access_Token and Refresh_Token from storage and redirect the user to `/login`.

---

### Requirement 6: Environment-Based Configuration

**User Story:** As a developer, I want environment-specific configuration files for development, stage, and production, so that secrets and settings never bleed across deployment targets.

#### Acceptance Criteria

1. THE Monorepo SHALL contain `.env.example` files at both root level and within `backend/`, each documenting all required environment variables with non-secret descriptive placeholder strings (e.g., `your_value_here`).
2. WHEN the Backend application starts, THE Config_Loader SHALL read environment variables from the file named `.env.<NODE_ENV>` (e.g., `.env.development`, `.env.stage`, `.env.production`) corresponding to the active `NODE_ENV` value.
3. THE Backend runtime SHALL have access to the following environment-specific variables: `NODE_ENV`, `PORT`, `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ACCESS_TOKEN_EXPIRY`, and `REFRESH_TOKEN_EXPIRY`.
4. THE Frontend build SHALL expose environment-specific variables prefixed with `VITE_` to the client bundle at compile time, including at minimum `VITE_API_BASE_URL`.
5. IF any variable listed in criterion 3 is absent from the resolved environment at Backend startup, THEN THE Backend SHALL log the name of each missing variable and exit with a non-zero status code without completing startup.
6. IF `NODE_ENV` is absent or holds a value other than `development`, `stage`, or `production` at startup, THEN THE Config_Loader SHALL log an error message identifying the invalid or missing `NODE_ENV` value and exit with a non-zero status code.
7. THE Monorepo root-level `.gitignore` SHALL include entries that match `.env`, `.env.development`, `.env.stage`, and `.env.production` to prevent files containing real secrets from being tracked by version control.
8. THE Backend SHALL interpret `ACCESS_TOKEN_EXPIRY` and `REFRESH_TOKEN_EXPIRY` as integers representing durations in seconds (e.g., `900` for 15 minutes, `604800` for 7 days).

---

### Requirement 7: Code Quality Tooling

**User Story:** As a developer, I want ESLint, Prettier, and Husky pre-commit hooks configured across the monorepo, so that code style and quality issues are caught before they reach the repository.

#### Acceptance Criteria

1. THE Linter SHALL be configured at the root level (e.g., `eslint.config.js` or `.eslintrc.js`) with `parserOptions` that reference both `frontend/tsconfig.json` and `backend/tsconfig.json` so that type-aware linting rules apply to TypeScript files in both packages.
2. THE Linter configuration SHALL include the `@typescript-eslint/recommended` ruleset and SHALL set the `@typescript-eslint/no-unused-vars` rule to `"error"`.
3. THE Formatter SHALL be configured at the root level via a `.prettierrc` file containing: `{ "printWidth": 100, "singleQuote": true, "trailingComma": "all", "semi": true }`.
4. WHEN the `lint` npm script is executed at the root level, THE Linter SHALL check all `*.ts` and `*.tsx` files under `frontend/src/` and `backend/src/` and exit with a non-zero code if any violations are found.
5. WHEN the `format` npm script is executed at the root level, THE Formatter SHALL rewrite all `*.ts`, `*.tsx`, `*.json`, and `*.md` files in the Monorepo to match the `.prettierrc` configuration.
6. WHEN a `git commit` is initiated, THE Hook_Runner SHALL execute `lint-staged`, which SHALL run the Linter on all staged `*.ts` and `*.tsx` files and the Formatter on all staged `*.ts`, `*.tsx`, `*.json`, and `*.md` files before the commit is recorded.
7. IF `lint-staged` detects any linting or formatting violations during a pre-commit hook, THEN THE Hook_Runner SHALL abort the commit and output each violation to the developer's terminal with its filename and line number.

---

### Requirement 8: Documentation

**User Story:** As a developer, I want comprehensive project documentation covering setup, architecture, and API usage, so that any team member can onboard and contribute without requiring verbal knowledge transfer.

#### Acceptance Criteria

1. THE Monorepo SHALL contain a root-level `README.md` that includes: project purpose, system prerequisites (Node.js version, PostgreSQL version, npm version), installation steps, a table of all available npm scripts, and links to `docs/ARCHITECTURE.md`, `docs/SETUP.md`, `docs/API.md`, and `docs/AUTH.md`.
2. THE Monorepo SHALL contain a `docs/ARCHITECTURE.md` file that describes the high-level system architecture (with a component diagram or textual equivalent), the rationale for each top-level folder in the monorepo, and the justification for each major technology choice.
3. THE Monorepo SHALL contain a `docs/SETUP.md` file with separate, numbered step-by-step instructions for setting up the `development`, `stage`, and `production` Environments, covering: cloning the repository, installing dependencies, creating the Database, populating `.env.<environment>` files, running Migrations, seeding the Database, and starting both Frontend and Backend.
4. THE Monorepo SHALL contain a `docs/API.md` file that documents every Backend API endpoint with: HTTP method, path, required request headers, request body schema (with field names, types, and required/optional status), response body schema for all possible status codes, and at least one example request and response payload; this file SHALL be updated whenever an endpoint is added, changed, or removed.
5. THE Monorepo SHALL contain a `docs/AUTH.md` file that explains: the full JWT authentication flow (login → access token issuance → protected request → token refresh → logout), where tokens are stored on the Frontend (e.g., memory, `localStorage`, `httpOnly` cookie), and the automatic token refresh mechanism in the API_Client.
6. THE Backend route handler for every API endpoint SHALL include a JSDoc comment that specifies at minimum: a one-sentence description of the endpoint's purpose, a `@param` annotation for each request parameter or body field, and a `@returns` annotation describing the response schema.

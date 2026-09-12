# Vue.js Learning

A small, Vue-focused learning project built with Vue 3, TypeScript, Vite, Pinia, Vuetify, and a deliberately simple Node + MongoDB CRUD API.

## Learning goal

The main feature is intentionally small: user management.

- Create a user with a validated Vuetify form.
- Search users from the backend using an Options API watcher, debounce, and request cancellation.
- Show users with a simple `v-for` card/list UI rather than a data-grid component.
- Demonstrate a normal named slot and a scoped slot in the list component.
- View full user details in a dialog.
- Reuse the same form to edit an existing user.
- Delete a user with confirmation.
- Use Pinia for shared server-backed user state and CRUD actions.
- Keep form fields, dialog visibility, and other temporary UI state local.
- Show backend field errors (for example duplicate email) next to the relevant form field.

The feature is implemented with the **Options API first**. A separate Composition API implementation will be added later without replacing the Options API version, so both approaches can be compared side-by-side.

## Project structure

```text
client/   Vue 3 + TypeScript + Vuetify + Pinia
server/   Small Express + MongoDB API used only to make the Vue examples dynamic
```

The code intentionally contains learning-oriented comments and JSDoc around Vue/TypeScript syntax that may be unfamiliar. Trivial statements are not commented just for the sake of adding comments.

## Run locally

1. Start MongoDB locally, or use any MongoDB connection URI.
2. Copy `server/.env.example` to `server/.env`.
3. Copy `client/.env.example` to `client/.env` if you want to override the default API URL.
4. Install dependencies:

```bash
npm install --prefix server
npm install --prefix client
```

5. In separate terminals run:

```bash
npm run dev:server
npm run dev:client
```

Open `http://localhost:5173/options/users`.

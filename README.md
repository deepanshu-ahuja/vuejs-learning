# Vue.js Learning

A small, Vue-focused learning project built with Vue 3, TypeScript, Vite, Pinia, Vuetify, and a deliberately simple Node + MongoDB CRUD API.

## Learning goal

The main feature is intentionally small: user management.

- Create a user with a validated Vuetify form.
- Search users from the backend with debounce and request cancellation.
- Show users with a simple `v-for` card/list UI rather than a data-grid component.
- Demonstrate a normal named slot and a scoped slot in the list component.
- View full user details in a dialog.
- Reuse the same form to edit an existing user.
- Delete a user with confirmation.
- Use Pinia for shared server-backed user state and CRUD actions.
- Keep form fields, dialog visibility, and other temporary UI state local.
- Show backend field errors (for example duplicate email) next to the relevant form field.

The same feature now exists in two independent Vue implementations:

- `/options/users` — Options API components + Option-style Pinia store.
- `/composition/users` — `<script setup>` Composition API components + setup-style Pinia store.

The Options API implementation remains intact so the two styles can be compared side-by-side. Pure TypeScript modules such as the API adapter, user types, and age utility are reused because they are not tied to either Vue API style.

## What to compare

```text
Options API                         Composition API
-----------                         ---------------
data()                              ref() / reactive()
computed: {}                        computed()
watch: {}                           watch()
methods: {}                         ordinary functions
mounted()                           onMounted()
beforeUnmount()                     onBeforeUnmount()
mapState() / mapActions()           storeToRefs() + direct store actions
modelValue + update:modelValue      defineModel()
component public instance methods   defineExpose()
```

The Composition version also uses a small `useSnackbar()` composable to demonstrate reusable local reactive logic without turning snackbar state into a global store.

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

Open either:

```text
http://localhost:5173/options/users
http://localhost:5173/composition/users
```

## Frontend build tooling

The frontend pins TypeScript 5.9.3 because the current `vue-tsc` integration uses
the JavaScript compiler API that TypeScript 7 no longer exports.

`skipLibCheck` skips incompatible third-party declaration internals while strict
type-checking remains enabled for application code. Node types support the Vite
configuration.

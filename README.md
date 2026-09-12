# Vue.js Learning

A small, Vue-focused learning project built with Vue 3, TypeScript, Vite, Pinia, Vuetify, and a deliberately simple Node + MongoDB CRUD API.

## Learning goal

The main feature is user management:

- Create a user with a validated Vuetify form.
- Search users from the backend.
- Show users in a simple card/list UI using `v-for` (no data table/grid abstraction).
- View full user details in a dialog.
- Edit an existing user.
- Delete a user with confirmation.
- Use Pinia for shared server-backed user state and CRUD actions.
- Keep temporary UI/form state local when it does not need to be shared.
- Demonstrate normal named slots and scoped slots naturally in the user-list UI.
- Demonstrate debounce and request cancellation in backend search when they solve a real problem.

The feature is implemented with the **Options API first**. A separate Composition API implementation will be added later without replacing the Options API version, so both approaches can be compared side-by-side.

## Project structure

```text
client/   Vue 3 + TypeScript + Vuetify + Pinia
server/   Small Express + MongoDB API used only to make the Vue examples dynamic
```

The code intentionally contains learning-oriented comments and JSDoc/TSDoc around Vue/TypeScript syntax that may be unfamiliar. Trivial statements are not commented just for the sake of adding comments.

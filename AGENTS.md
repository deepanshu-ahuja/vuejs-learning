# Vue Learning Project Instructions

## Goal
This repository exists to learn modern Vue through one small, realistic CRUD feature. Prefer clarity and teaching value over architecture for architecture's sake.

## Frontend stack
- Vue 3
- TypeScript
- Vite
- Vuetify
- Pinia
- Vue Router

## API style
1. Build the user feature with the Options API first.
2. Do not rewrite or delete the Options API implementation when the Composition API version is added later.
3. Composition API should live in a separate feature area/route so both styles remain comparable.
4. Use composables only when reusable Vue/reactive behavior genuinely benefits from them.

## Current learning UI scope
- Keep the user list intentionally simple and render it with `v-for` and ordinary Vuetify cards/layout.
- Do not introduce `VDataTable`, AG Grid, or another data-grid abstraction unless explicitly requested later.
- Prefer a small number of components that naturally demonstrate Vue concepts over a catalog of Vuetify components.

## State ownership
- Use Pinia for shared server-backed user state and CRUD actions in this learning project.
- Keep form fields, dialog open/closed state, and other local UI state inside the component that owns it unless multiple unrelated areas genuinely need it.
- Do not move state to Pinia merely because Pinia is available.

## API boundaries
- Components must not contain HTTP-client setup or Mongo/backend details.
- Components call Pinia actions for shared user CRUD flows.
- Pinia actions call a small API module.
- Keep the Node/Mongo backend deliberately simple; the learning focus is Vue.
- Do not add controller/service/repository layers merely to make the backend look larger. Add structure only when it solves a real problem.

## Vuetify conventions
Use this order when implementing UI:
1. documented Vuetify component props;
2. Vuetify utilities for standard spacing/layout;
3. theme/defaults for repeated design-system values;
4. slots for supported UI customization;
5. scoped custom CSS only when the requirement is not cleanly handled above.

Avoid depending on undocumented Vuetify internal DOM/classes unless unavoidable.

## Reuse
- Extract components/logic only when there is a meaningful repeated concept.
- Do not wrap every Vuetify component.
- Reusable UI and shared/global state are separate decisions.
- A snackbar UI may be reusable while its state remains local.

## Learning comments and JSDoc
This repository intentionally contains more explanation than a typical production repository.

Add comments for:
- unfamiliar Vue syntax;
- why state is local vs Pinia;
- v-model expansion/forwarding when non-obvious;
- normal vs scoped slot data flow;
- watchers used for side effects;
- debounce/cancellation and stale-request problems;
- TypeScript syntax/contracts a Vue learner may not immediately understand.

Comments should make strange or easy-to-misunderstand syntax understandable to someone still learning Vue. Do not comment ordinary assignments, obvious control flow, or every line just to increase comment count.

Use JSDoc/TSDoc for API functions, store actions, utilities, and component methods where the contract or rationale is useful.

## Better-practice rule
Inspect nearby repository code before implementing. Follow established project conventions when they are sound. If an existing pattern is clearly unsafe, outdated, unnecessarily complex, or inconsistent with modern Vue/Vuetify practice, do not silently copy it: explain the concern and prefer the safer/simpler approach when the change is appropriate.

## Scope control
Do not add authentication, Docker orchestration, Redis, microservices, queues, or other unrelated infrastructure unless explicitly requested. Keep backend code minimal and focused on supporting the Vue learning feature.

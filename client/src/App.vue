<template>
  <!-- Vuetify expects one VApp near the root so application layout components
       can coordinate their sizing and theme correctly. -->
  <VApp>
    <VMain>
      <!-- Vue Router replaces RouterView with the component for the active URL. -->
      <RouterView />
    </VMain>
  </VApp>
</template>

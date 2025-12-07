<script setup lang="ts">
import { NConfigProvider } from 'naive-ui';
import TitleBar from '@render/components/TitleBar.vue';
import DragRegion from '@render/components/DragRegion.vue';
import NavBar from '@render/components/NavBar.vue';


onMounted(() => {
  console.log('App mounted');
});
</script>
<template>
  <title-bar class="main-content">
    <drag-region class="w-full" />
  </title-bar>
  <n-config-provider class="h-full w-[100vw] flex text-tx-primary">
    <aside class="sidebar h-full flex flex-shrink-0 flex-col w-[320px]">
      <div class="flex-auto flex">
        <nav-bar />
        <div class="flex-auto">
          conversation-list
        </div>
      </div>
    </aside>
    <div class="flex-auto main-content">
      Main
    </div>
  </n-config-provider>
</template>

<style scoped>
.sidebar {
  background-color: var(--bg-color);
  /* box-shadow: -3px -2px 10px rgba(101, 101, 101, 0.2); */
}

.main-content {
  background-color: var(--bg-color);
}
</style>
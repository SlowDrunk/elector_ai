<script setup lang="ts">
import { NConfigProvider } from 'naive-ui';
import NavBar from '@render/components/NavBar.vue';
import ResizeDividerMutationObserver from './components/ResizeDividerMutationObserver.vue';
import ConversationList from './components/ConversationList/index.vue';
const sidebarWidth = ref(320);

onMounted(() => {
  console.log('App mounted');
});
</script>
<template>
  <title-bar class="flex-auto">
    <drag-region class="w-full" />
  </title-bar>
  <n-config-provider class="h-full w-[100vw] flex text-tx-primary">
    <aside class="sidebar h-full flex flex-shrink-0 flex-col" :style="{ width: `${sidebarWidth}px` }">
      <div class="flex-auto flex">
        <nav-bar />
        <conversation-list class="flex-auto" :width="sidebarWidth" />
      </div>
    </aside>
    <resize-divider-mutation-observer direction="vertical" v-model:size="sidebarWidth" :max-size="800"
      :min-size="320" />
    <div class="flex-auto main-content">
      <router-view />
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
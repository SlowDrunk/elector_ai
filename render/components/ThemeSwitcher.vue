<script setup lang="ts">
import { useThemeMode } from '@render/hooks/useThemeMode';
import { Icon as IconifyIcon } from '@iconify/vue';

import NativeTooltip from './NativeTooltip.vue';

defineOptions({ name: 'ThemeSwitcher' });

const {
  themeIcon,
  setThemeMode,
  themeTooltip,
  themeMode,
} = useThemeMode();

function toggleThemeMode() {
  // 根据当前主题模式切换：dark -> light -> system -> dark
  if (themeMode.value === 'dark') {
    setThemeMode('light');
  } else if (themeMode.value === 'light') {
    setThemeMode('system');
  } else {
    setThemeMode('dark');
  }
}
</script>

<template>
  <native-tooltip :content="themeTooltip">
    <iconify-icon :icon="themeIcon" width="24" height="24" @click="toggleThemeMode" />
  </native-tooltip>
</template>
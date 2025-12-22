<script setup lang="ts">
import { computed } from 'vue';
import { Icon as IconifyIcon } from '@iconify/vue';
import { useWinManager } from '@render/hooks/useWinManager';
// import i18n from '@render/i18n';

import NativeTooltip from './NativeTooltip.vue';

interface TitleBarProps {
  title?: string;
  isMaximizable?: boolean;
  isMinimizable?: boolean;
  isClosable?: boolean;
}
defineOptions({ name: 'TitleBar' })

// 检测是否为 macOS 系统
const platform = navigator.platform.toLowerCase();
const isMac = platform.includes('mac') || platform.includes('darwin');

// 定义 props，不设置默认值，以便区分用户是否明确传入
const props = defineProps<TitleBarProps>();

const emit = defineEmits(['close']);
const { t } = useI18n()
const btnSize = 15;

const {
  isMaximized,
  closeWindow,
  minimizeWindow,
  maximizeWindow
} = useWinManager();

function handleClose() {
  emit('close');
  closeWindow();
}
</script>
<template>
  <header class="title-bar flex items-start justify-between h-[30px]">
    <div class="title-bar-main flex-auto">
      <slot>{{ title ?? '' }}</slot>
    </div>
    <div class="title-bar-controls w-[80px] flex items-center justify-end text-tx-secondary">
      <native-tooltip :content="t('window.minimize')">
        <button v-show="!isMac" class="title-bar-button cursor-pointer hover:bg-input"
          @click="minimizeWindow">
          <iconify-icon icon="material-symbols:chrome-minimize-sharp" :width="btnSize" :height="btnSize" />
        </button>
      </native-tooltip>
      <native-tooltip  :content="t('window.maximize')">
        <button v-show="!isMac" class="title-bar-button cursor-pointer hover:bg-input"
          @click="maximizeWindow">
          <iconify-icon icon="material-symbols:chrome-maximize-outline-sharp" :width="btnSize" :height="btnSize"
            v-show="!isMaximized" />
          <iconify-icon icon="material-symbols:chrome-restore-outline-sharp" :width="btnSize" :height="btnSize"
            v-show="isMaximized" />
        </button>
      </native-tooltip>
      <native-tooltip :content="t('window.close')">
        <button v-show="!isMac" class="close-button title-bar-button cursor-pointer hover:bg-red-300 "
          @click="handleClose">
          <iconify-icon icon="material-symbols:close" :width="btnSize" :height="btnSize"></iconify-icon>
        </button>
      </native-tooltip>
    </div>
  </header>
</template>

<style scoped>
.title-bar-button {
  padding: 2px;
  border-radius: 50%;
  margin: .2rem;
}
</style>
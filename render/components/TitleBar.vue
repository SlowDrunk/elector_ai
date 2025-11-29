<script setup lang="ts">
import { computed } from 'vue';
import { Icon as IconifyIcon } from '@iconify/vue';
import { useWinManager } from '@render/hooks/useWinManager';

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
console.log(props)

// 如果是 macOS 系统，默认不展示窗口控制按钮
// 使用计算属性处理默认逻辑：如果用户未传入值，在 macOS 上默认不显示，在非 macOS 上默认显示
const shouldShowMaximizable = computed(() => {
    // 如果明确传入了 false，则不显示
    if (props.isMaximizable === false) return false;
    // 如果明确传入了 true，则显示
    if (props.isMaximizable === true) return true;
    // 如果未传入值（undefined），在 macOS 上默认不显示，非 macOS 上默认显示
    return !isMac;
});

const shouldShowMinimizable = computed(() => {
    if (props.isMinimizable === false) return false;
    if (props.isMinimizable === true) return true;
    return !isMac;
});

const shouldShowClosable = computed(() => {
    if (props.isClosable === false) return false;
    if (props.isClosable === true) return true;
    return !isMac;
});

const emit = defineEmits(['close']);
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
            <slot>{{title ?? '' }}</slot>
        </div>
        <div class="title-bar-controls w-[80px] flex items-center justify-end">
            <button v-show="shouldShowMinimizable" class="title-bar-button cursor-pointer hover:bg-input"
                @click="minimizeWindow">
                <iconify-icon icon="material-symbols:chrome-minimize-sharp" :width="btnSize" :height="btnSize" />
            </button>
            <button v-show="shouldShowMaximizable" class="title-bar-button cursor-pointer hover:bg-input"
                @click="maximizeWindow">
                <iconify-icon icon="material-symbols:chrome-maximize-outline-sharp" :width="btnSize" :height="btnSize"
                    v-show="!isMaximized" />
                <iconify-icon icon="material-symbols:chrome-restore-outline-sharp" :width="btnSize" :height="btnSize"
                    v-show="isMaximized" />
            </button>
            <button v-show="shouldShowClosable" class="close-button title-bar-button cursor-pointer hover:bg-red-300 "
                @click="handleClose">
                <iconify-icon icon="material-symbols:close" :width="btnSize" :height="btnSize"></iconify-icon>
            </button>
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
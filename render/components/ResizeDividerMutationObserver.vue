<script setup lang="ts">
import logger from '@render/utils/logger';

/**
 * 可调整大小的分割器组件（使用 MutationObserver 实现）
 * 
 * 功能：
 * - 支持水平和垂直方向的拖拽调整
 * - 可设置最小和最大尺寸限制
 * - 支持负值方向计算（通过 valIsNagetive 属性控制拖拽方向）
 * - 使用 v-model:size 进行双向绑定
 * - 使用 MutationObserver 监听 DOM 属性变化来实现响应式更新
 * 
 * 实现原理：
 * 1. 使用鼠标事件捕获拖拽操作
 * 2. 通过修改分割器元素的 data-* 属性来记录拖拽位置
 * 3. 使用 MutationObserver 监听这些属性的变化
 * 4. 当属性变化时，计算新尺寸并触发更新事件
 * 
 * 使用示例：
 * ResizeDividerMutationObserver 
 *   direction="horizontal" 
 *   v-model:size="panelHeight"
 *   :max-size="800" 
 *   :min-size="200"
 */

interface Props {
  /** 调整方向：'horizontal' 为水平方向（上下拖拽调整高度），'vertical' 为垂直方向（左右拖拽调整宽度） */
  direction: 'horizontal' | 'vertical';
  /** 
   * 是否为负值计算方向
   * - false（默认）：向右/向下拖拽时增加尺寸
   * - true：向右/向下拖拽时减小尺寸（反转拖拽逻辑）
   */
  valIsNagetive?: boolean;
  /** 当前尺寸值（通常通过 v-model:size 绑定） */
  size: number;
  /** 允许的最大尺寸限制 */
  maxSize: number;
  /** 允许的最小尺寸限制 */
  minSize: number;
}

interface Emits {
  /** 
   * 尺寸更新事件，用于 v-model 双向绑定
   * 当用户拖拽调整尺寸时触发，传递新的尺寸值
   */
  (e: 'update:size', size: number): void;
}

defineOptions({ name: 'ResizeDividerMutationObserver' });

// 定义 props，设置默认值
const props = withDefaults(defineProps<Props>(), {
  valIsNagetive: false, // 默认不反转拖拽方向
}) 
const emit = defineEmits<Emits>();

// 内部维护的尺寸值（响应式状态）
const size = ref(props.size);

// 分割器元素的引用，用于 MutationObserver 监听
const dividerRef = ref<HTMLElement | null>(null);

// 拖拽状态标记，用于判断当前是否正在拖拽
let isDragging = false;
// 开始拖拽时的初始尺寸，用于计算拖拽距离
let startSize = 0;
// 开始拖拽时的鼠标位置坐标，用于计算鼠标移动距离
let startPoint = { x: 0, y: 0 };

/**
 * 计算新的尺寸值
 * 根据拖拽距离和方向计算，并限制在最小/最大值范围内
 */
function calculateNewSize(diffX: number, diffY: number): number {
  let newSize: number;
  if (props.direction === 'horizontal') {
    // 水平方向调整（上下拖拽，调整高度）
    newSize = startSize + diffY;
  } else {
    // 垂直方向调整（左右拖拽，调整宽度）
    newSize = startSize + diffX;
  }
  // 限制在最小值和最大值之间
  return Math.max(props.minSize, Math.min(props.maxSize, newSize));
}

/**
 * MutationObserver 实例
 * 用于监听分割器元素的 data 属性变化
 */
let observer: MutationObserver | null = null;

/**
 * 初始化 MutationObserver
 * 监听分割器元素的 attributes 变化，特别是 data-drag-x 和 data-drag-y 属性
 */
function initMutationObserver() {
  if (!dividerRef.value) return;

  observer = new MutationObserver((mutations) => {
    // 如果正在拖拽中，不处理 MutationObserver 的回调（避免循环）
    if (!isDragging) return;

    mutations.forEach((mutation) => {
    
      // 只处理属性变化
      if (mutation.type === 'attributes') {
        const target = mutation.target as HTMLElement;
        const dragX = parseFloat(target.getAttribute('data-drag-x') || '0');
        const dragY = parseFloat(target.getAttribute('data-drag-y') || '0');

        // 根据负值标志计算拖拽距离
        const diffX = props.valIsNagetive ? startPoint.x - dragX : dragX - startPoint.x;
        const diffY = props.valIsNagetive ? startPoint.y - dragY : dragY - startPoint.y;

        // 计算新尺寸
        const newSize = calculateNewSize(diffX, diffY);
        
        // 更新内部状态并触发事件
        if (newSize !== size.value) {
          size.value = newSize;
          emit('update:size', newSize);
        }
      }
    });
  });

  // 开始观察，监听 attributes 变化，特别是 data-drag-x 和 data-drag-y
  observer.observe(dividerRef.value, {
    attributes: true,
    attributeFilter: ['data-drag-x', 'data-drag-y'], // 只监听这两个属性
    attributeOldValue: false, // 不需要旧值
  });
}

/**
 * 开始拖拽处理函数
 * 当用户在分割器上按下鼠标时触发
 * 
 * 功能：
 * 1. 设置拖拽状态为 true
 * 2. 记录当前鼠标位置作为起始点
 * 3. 记录当前尺寸作为起始尺寸
 * 4. 初始化 MutationObserver（如果尚未初始化）
 * 5. 绑定全局鼠标移动和释放事件监听器
 */
function startDrag(e: MouseEvent) {
  isDragging = true;

  // 记录拖拽起始点坐标（屏幕坐标）
  startPoint.x = e.clientX;
  startPoint.y = e.clientY;

  // 记录拖拽起始时的尺寸值，用于后续计算尺寸变化
  startSize = size.value;

  // 如果 MutationObserver 尚未初始化，则初始化它
  if (!observer && dividerRef.value) {
    initMutationObserver();
  }

  // 更新分割器元素的 data 属性，触发 MutationObserver
  if (dividerRef.value) {
    dividerRef.value.setAttribute('data-drag-x', e.clientX.toString());
    dividerRef.value.setAttribute('data-drag-y', e.clientY.toString());
  }

  // 绑定全局鼠标移动和释放事件
  // 使用 document 而不是元素本身，确保即使鼠标移出元素外也能继续拖拽
  document.addEventListener('mousemove', handleDrag);
  document.addEventListener('mouseup', stopDrag);
}

/**
 * 停止拖拽处理函数
 * 当用户释放鼠标时触发（mouseup 事件）
 * 
 * 功能：
 * 1. 清除拖拽状态标记
 * 2. 移除全局鼠标事件监听器，避免内存泄漏
 * 3. 清理 data 属性
 */
function stopDrag() {
  isDragging = false;
  
  // 移除事件监听器，清理资源
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('mouseup', stopDrag);
  
  // 清理 data 属性
  if (dividerRef.value) {
    dividerRef.value.removeAttribute('data-drag-x');
    dividerRef.value.removeAttribute('data-drag-y');
  }
}

/**
 * 处理拖拽过程中的鼠标移动
 * 在拖拽过程中持续调用，更新 DOM 元素的 data 属性
 * MutationObserver 会监听到这些变化并触发相应的处理逻辑
 * 
 * 实现方式：
 * 不直接在这里计算尺寸，而是更新 DOM 元素的 data-drag-x 和 data-drag-y 属性
 * MutationObserver 会监听到这些变化并计算新尺寸
 */
function handleDrag(e: MouseEvent) {
  // 安全检查：如果不是拖拽状态则直接返回
  if (!isDragging || !dividerRef.value) return;

  // 更新分割器元素的 data 属性
  // 这会触发 MutationObserver 的回调函数，由它来处理尺寸计算
  dividerRef.value.setAttribute('data-drag-x', e.clientX.toString());
  dividerRef.value.setAttribute('data-drag-y', e.clientY.toString());
}

/**
 * 组件挂载时初始化 MutationObserver
 */
onMounted(() => {
  // 使用 nextTick 确保 DOM 已经渲染完成
  nextTick(() => {
    initMutationObserver();
  });
});

/**
 * 组件卸载时清理 MutationObserver
 */
onUnmounted(() => {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  // 清理可能残留的事件监听器
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('mouseup', stopDrag);
});

/**
 * 监听外部传入的 size prop 变化
 * 当父组件通过 v-model 更新 size 时，同步更新内部状态
 * 使用 watchEffect 确保内部 size 始终与外部 props.size 保持同步
 */
watchEffect(() => size.value = props.size);
</script>

<template>
  <div 
    ref="dividerRef"
    class="z-[999] bg-input" 
    :class="direction" 
    @click.stop 
    @mousedown="startDrag"
  ></div>
</template>

<style scoped>
/**
 * 垂直分割器样式
 * 用于左右拖拽调整宽度的情况
 * - width: 5px - 分割器宽度（拖拽区域宽度）
 * - height: 100% - 分割器高度填满父容器
 * - cursor: ew-resize - 东西方向调整光标（左右箭头），提示用户可以水平拖拽
 */
.vertical {
  width: 2px;
  height: 100%;
  cursor: ew-resize;
}

/**
 * 水平分割器样式
 * 用于上下拖拽调整高度的情况
 * - width: 100% - 分割器宽度填满父容器
 * - height: 5px - 分割器高度（拖拽区域高度）
 * - cursor: ns-resize - 南北方向调整光标（上下箭头），提示用户可以垂直拖拽
 */
.horizontal {
  width: 100%;
  height: 2px;
  cursor: ns-resize;
}
</style>

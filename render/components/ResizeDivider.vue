<script setup lang="ts">
/**
 * 可调整大小的分割器组件
 * 
 * 功能：
 * - 支持水平和垂直方向的拖拽调整
 * - 可设置最小和最大尺寸限制
 * - 支持负值方向计算（通过 valIsNagetive 属性控制拖拽方向）
 * - 使用 v-model:size 进行双向绑定
 * 
 * 使用示例：
 * ResizeDivider 
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

defineOptions({ name: 'ResizeDivider' });

// 定义 props，设置默认值
const props = withDefaults(defineProps<Props>(), {
  valIsNagetive: false, // 默认不反转拖拽方向
}) 
const emit = defineEmits<Emits>();

// 内部维护的尺寸值（响应式状态）
const size = ref(props.size);

// 拖拽状态标记，用于判断当前是否正在拖拽
let isDragging = false;
// 开始拖拽时的初始尺寸，用于计算拖拽距离
let startSize = 0;
// 开始拖拽时的鼠标位置坐标，用于计算鼠标移动距离
let startPoint = { x: 0, y: 0 };

/**
 * 开始拖拽处理函数
 * 当用户在分割器上按下鼠标时触发
 * 
 * 功能：
 * 1. 设置拖拽状态为 true
 * 2. 记录当前鼠标位置作为起始点
 * 3. 记录当前尺寸作为起始尺寸
 * 4. 绑定全局鼠标移动和释放事件监听器
 */
function startDrag(e: MouseEvent) {
  isDragging = true;

  // 记录拖拽起始点坐标（屏幕坐标）
  startPoint.x = e.clientX;
  startPoint.y = e.clientY;

  // 记录拖拽起始时的尺寸值，用于后续计算尺寸变化
  startSize = size.value;

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
 */
function stopDrag() {
  isDragging = false;
  // 移除事件监听器，清理资源
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('mouseup', stopDrag);
}

/**
 * 处理拖拽过程中的鼠标移动
 * 在拖拽过程中持续调用，计算并更新尺寸
 * 
 * 计算逻辑：
 * 1. 根据 valIsNagetive 属性决定拖拽方向的正负值计算方式
 * 2. 根据 direction 属性判断是水平（Y轴）还是垂直（X轴）调整
 * 3. 将计算出的新尺寸限制在 minSize 和 maxSize 范围内
 * 4. 触发 update:size 事件通知父组件尺寸变化
 */
function handleDrag(e: MouseEvent) {
  // 安全检查：如果不是拖拽状态则直接返回
  if (!isDragging) return;

  // 根据负值标志计算拖拽距离
  // valIsNagetive 为 true 时：向右/向下拖拽减小尺寸（反转逻辑）
  // valIsNagetive 为 false 时：向右/向下拖拽增加尺寸（正常逻辑）
  const diffX = props.valIsNagetive ? startPoint.x - e.clientX : e.clientX - startPoint.x;
  const diffY = props.valIsNagetive ? startPoint.y - e.clientY : e.clientY - startPoint.y;

  // 水平方向调整（上下拖拽，调整高度）
  if (props.direction === 'horizontal') {
    // 计算新尺寸 = 起始尺寸 + Y轴移动距离
    // 使用 Math.max 和 Math.min 确保尺寸在 [minSize, maxSize] 范围内
    size.value = Math.max(props.minSize, Math.min(props.maxSize, startSize + diffY));
    // 触发事件，通知父组件更新尺寸
    emit('update:size', size.value);
    return
  }
  
  // 垂直方向调整（左右拖拽，调整宽度）
  // 计算新尺寸 = 起始尺寸 + X轴移动距离
  size.value = Math.max(props.minSize, Math.min(props.maxSize, startSize + diffX));
  emit('update:size', size.value);
}

/**
 * 监听外部传入的 size prop 变化
 * 当父组件通过 v-model 更新 size 时，同步更新内部状态
 * 使用 watchEffect 确保内部 size 始终与外部 props.size 保持同步
 */
watchEffect(() => size.value = props.size);
</script>

<template>
  <div class="bg-transparent z-[999]" :class="direction" @click.stop @mousedown="startDrag"></div>
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
  width: 5px;
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
  height: 5px;
  cursor: ns-resize;
}
</style>
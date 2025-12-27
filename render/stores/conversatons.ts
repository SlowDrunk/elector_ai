import type { Conversation } from '@common/types';
import { debounce } from '@common/utils';
import { dataBase } from '../dataBase';

/**
 * 排序字段类型
 * - 'updatedAt': 按更新时间排序
 * - 'createAt': 按创建时间排序
 * - 'name': 按名称排序
 * - 'model': 按模型排序
 */
type SortBy = 'updatedAt' | 'createAt' | 'name' | 'model';

/**
 * 排序顺序类型
 * - 'asc': 升序
 * - 'desc': 降序
 */
type SortOrder = 'asc' | 'desc';

/**
 * localStorage 中存储排序字段的键名
 */
const SORT_BY_KEY = 'conversation:sortBy';

/**
 * localStorage 中存储排序顺序的键名
 */
const SORT_ORDER_KEY = 'conversation:sortOrder';

/**
 * 保存排序模式到 localStorage
 * 使用防抖处理，避免频繁写入 localStorage
 * @param sortBy - 排序字段
 * @param sortOrder - 排序顺序
 */
const saveSortMode = debounce(({ sortBy, sortOrder }: { sortBy: SortBy, sortOrder: SortOrder }) => {
  localStorage.setItem(SORT_BY_KEY, sortBy);
  localStorage.setItem(SORT_ORDER_KEY, sortOrder);
}, 300);

/**
 * 对话列表 Store
 * 管理对话列表的状态、排序和 CRUD 操作
 * @returns Pinia store 实例，包含对话列表的状态和方法
 */
export const useConversationsStore = defineStore('conversations', () => {
  // State
  /** 对话列表 */
  const conversations = ref<Conversation[]>([]);
  /** 从 localStorage 读取的排序字段 */
  const saveSortBy = localStorage.getItem(SORT_BY_KEY) as SortBy;
  /** 从 localStorage 读取的排序顺序 */
  const saveSortOrder = localStorage.getItem(SORT_ORDER_KEY) as SortOrder;

  /** 当前排序字段，默认为 'createAt' */
  const sortBy = ref<SortBy>(saveSortBy ?? 'createAt');
  /** 当前排序顺序，默认为 'desc' */
  const sortOrder = ref<SortOrder>(saveSortOrder ?? 'desc');

  // Getters
  /**
   * 获取所有对话列表
   * @returns 所有对话的数组
   */
  const allConversations = computed(() => conversations.value);

  /**
   * 获取当前排序模式
   * @returns 包含排序字段和排序顺序的对象
   */
  const sortMode = computed(() => ({
    sortBy: sortBy.value,
    sortOrder: sortOrder.value,
  }))

  // Actions
  /**
   * 初始化对话列表
   * 从数据库加载所有对话，并清理无效的消息记录
   * @returns Promise<void>
   */
  async function initialize() {
    conversations.value = await dataBase.conversations.toArray();

    // 清除无用的 message
    const ids = conversations.value.map(item => item.id);
    const msgs = await dataBase.messages.toArray();
    const invalidId = msgs.filter(item => !ids.includes(item.conversationId)).map(item => item.id);
    invalidId.length && dataBase.messages.where('id').anyOf(invalidId).delete();
  }

  /**
   * 设置排序模式
   * @param _sortBy - 排序字段
   * @param _sortOrder - 排序顺序
   */
  function setSortMode(_sortBy: SortBy, _sortOrder: SortOrder) {
    if (sortBy.value !== _sortBy)
      sortBy.value = _sortBy;
    if (sortOrder.value !== _sortOrder)
      sortOrder.value = _sortOrder;
  }

  /**
   * 根据 ID 获取对话
   * @param id - 对话 ID
   * @returns 找到的对话对象，如果不存在则返回 undefined
   */
  function getConversationById(id: number) {
    return conversations.value.find(item => item.id === id) as Conversation | void;
  }

  /**
   * 添加新对话
   * @param conversation - 对话对象（不包含 id，id 由数据库自动生成）
   * @returns Promise<number> 新创建的对话 ID
   */
  async function addConversation(conversation: Omit<Conversation, 'id'>) {
    const conversationWithPin = {
      ...conversation,
      pinned: conversation.pinned ?? false,
    }

    const conversationId = await dataBase.conversations.add(conversationWithPin);

    conversations.value.push({
      id: conversationId,
      ...conversationWithPin,
    });

    return conversationId;
  }

  /**
   * 删除对话
   * 同时删除该对话关联的所有消息
   * @param id - 要删除的对话 ID
   * @returns Promise<void>
   */
  async function delConversation(id: number) {
    await dataBase.messages.where('conversationId').equals(id).delete();
    await dataBase.conversations.delete(id);
    conversations.value = conversations.value.filter(item => item.id !== id);
  }

  /**
   * 更新对话信息
   * @param conversation - 要更新的对话对象
   * @param updateTime - 是否更新 updatedAt 时间戳，默认为 true
   * @returns Promise<void>
   */
  async function updateConversation(conversation: Conversation, updateTime: boolean = true) {
    const _newConversation = {
      ...conversation,
      updatedAt: updateTime ? Date.now() : conversation.updatedAt,
    }

    await dataBase.conversations.update(conversation.id, _newConversation);
    conversations.value = conversations.value.map(item => item.id === conversation.id ? _newConversation : item);
  }

  /**
   * 置顶对话
   * @param id - 要置顶的对话 ID
   * @returns Promise<void>
   */
  async function pinConversation(id: number) {
    const conversation = conversations.value.find(item => item.id === id);

    if (!conversation) return;
    await updateConversation({
      ...conversation,
      pinned: true,
    }, false);
  }

  /**
   * 取消置顶对话
   * @param id - 要取消置顶的对话 ID
   * @returns Promise<void>
   */
  async function unpinConversation(id: number) {
    const conversation = conversations.value.find(item => item.id === id);

    if (!conversation) return;
    await updateConversation({
      ...conversation,
      pinned: false,
    }, false);
  }

  watch([() => sortBy.value, () => sortOrder.value], () => saveSortMode({ sortBy: sortBy.value, sortOrder: sortOrder.value }));

  return {
    // State
    /** 对话列表响应式数组 */
    conversations,
    /** 当前排序字段 */
    sortBy,
    /** 当前排序顺序 */
    sortOrder,

    // Getters
    /** 获取所有对话列表的计算属性 */
    allConversations,
    /** 获取当前排序模式的计算属性 */
    sortMode,

    // Actions
    /** 初始化对话列表 */
    initialize,
    /** 设置排序模式 */
    setSortMode,
    /** 根据 ID 获取对话 */
    getConversationById,
    /** 添加新对话 */
    addConversation,
    /** 删除对话 */
    delConversation,
    /** 更新对话信息 */
    updateConversation,
    /** 置顶对话 */
    pinConversation,
    /** 取消置顶对话 */
    unpinConversation,
  }
})
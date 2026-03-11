<script setup lang="ts">
import type { SelectValue } from '@render/types'
import MessageInput from '@render/components/MessageInput.vue';
import CreateConversation from '@render/components/CreateConversation.vue';

const message = ref('');
const provider = ref<SelectValue>();

const providerId = computed(() => ((provider.value as string)?.split(':')[0] ?? ''));
const selectedModel = computed(() => ((provider.value as string)?.split(':')[1] ?? ''));

const { t } = useI18n();

async function handleCreateConversation(create: (title: string) => Promise<number | void>, _message: string) {
  const id = await create(_message);
  if (!id) return;
  //  afterCreate
}
</script>
<template>
  <div class="main-view h-full w-full flex flex-col">
    <main class="flex-1 flex flex-col overflow-hidden">
      <!-- 上方内容区域（预留给对话列表等），可滚动 -->
      <section class="flex-1 overflow-y-auto">
        <!-- <router-view /> -->
        <!-- main -->
      </section>

      <!-- 底部输入区域，固定在视图内部 -->
      <section class="shrink-0 px-4 pb-4 pt-2">
        <create-conversation
          :providerId="providerId"
          :selectedModel="selectedModel"
          v-slot="{ create }"
        >
          <message-input
            v-model:message="message"
            v-model:provider="provider"
            :placeholder="t('main.conversation.placeholder')"
            @send="handleCreateConversation(create, message)"
          />
        </create-conversation>
      </section>
    </main>
  </div>
</template>
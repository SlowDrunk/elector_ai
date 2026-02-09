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
    <main class="flex-auto">
      <!-- <router-view /> -->
      <!-- main -->
      <create-conversation :providerId="providerId" :selectedModel="selectedModel" v-slot="{ create }">

        <message-input v-model:message="message" v-model:provider="provider"
          :placeholder="t('main.conversation.placeholder')" @send="handleCreateConversation(create, message)" />
      </create-conversation>
    </main>
  </div>
</template>
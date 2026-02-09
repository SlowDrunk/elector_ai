<script lang="ts" setup>
import type { SelectValue } from '@render/types'
import { NSelect, NButton } from 'naive-ui'
import { useProvidersStrore } from '@render/stores/providers'

defineOptions({
    name: 'ProviderSelect',
})

function openSettingWindow() {
    // TODO:" Open settings window logic"
    console.log('Open settings window')
}

const { t } = useI18n()
const provierStore = useProvidersStrore()
const selectedProvider = defineModel<SelectValue>('modelValue')

const providerOptions = computed(() => provierStore.allProviders.filter(item => (item.visible)).map(ele => ({
    label: ele.title || ele.name,
    type: 'group',
    key: ele.id,
    children: ele.models.map(model => ({
        label: model,
        value: `${ele.id}_${model}`
    }))
})))

</script>

<template>
    <n-select size='small' :placeholder="t('main.conversation.provider')" v-model:value="selectedProvider" :options="providerOptions">
        <template #empty>
            <span class="text-tx-primary text-[0.7rem]">{{ t('main.conversation.goSettings') }}</span>
            <n-button class="go-setting-btn" size="tiny" @click="openSettingWindow">{{ t('main.conversation.settings')
                }}</n-button>{{ t('main.conversation.addModel') }}
        </template>
    </n-select>
</template>

<style scoped>
.go-setting-btn {
    padding: 0 0.5rem;
    font-weight: bold;
}
</style>
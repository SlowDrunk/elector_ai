import type { Provider, Conversation, Message } from '@common/types';
import Dexie, { type EntityTable } from 'dexie';
import { stringifyOpenAISetting } from '@common/utils';
import { logger } from './utils/logger';

export const providers: Provider[] = [
  {
    id: 2,
    name: 'deepseek',
    title: '深度求索 (DeepSeek)',
    models: ['deepseek-chat'],
    openAISetting: stringifyOpenAISetting({
      baseURL: 'https://api.deepseek.com/v1',
      apiKey: 'sk-18068aba174744b39b6733066fda5828',
    }),
    createdAt: new Date().getTime(),
    updatedAt: new Date().getTime()
  }
];


export const dataBase = new Dexie('dionaDB') as Dexie & {
  providers: EntityTable<Provider, 'id'>;
  conversations: EntityTable<Conversation, 'id'>;
  messages: EntityTable<Message, 'id'>;
};

dataBase.version(1).stores({
  providers: '++id,name',
  conversations: '++id,providerId',
  messages: '++id,conversationId',
})

export async function initProviders() {
  const count = await dataBase.providers.count();
  if (count === 0) {
    await dataBase.providers.bulkAdd(providers);
    logger.info('Providers data initialized successfully.');
  }
}
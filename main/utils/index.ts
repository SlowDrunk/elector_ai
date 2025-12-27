import en from '@locals/en.json';
import zh from '@locals/zh.json';
import logManager from '@main/service/LogService';

type MessageSchema = typeof en | typeof zh;

const messages: Record<string, MessageSchema> = {
    en,
    zh,
}

export function createTranslator() {
    return (key?: string) => {
        if (!key) return void 0;
        try {
            const keys = key?.split('.');
            let ressult: any = messages['zh'];
            for (const _key of keys) {
                ressult = ressult[_key];
            }
            return ressult as string;
        } catch (e) {
            logManager.error('fail to translate key:', key, e);
            return key
        }
    }

}
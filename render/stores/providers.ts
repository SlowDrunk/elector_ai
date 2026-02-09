import type { Provider } from "@common/types";
import { dataBase } from "../dataBase";

export const useProvidersStrore = defineStore("providers", () => {
  const providers = ref<Provider[]>([]);

  const allProviders = computed(() => providers.value);

  async function initialize() {}

  return {
    providers,
    allProviders,
    initialize,
  };
});

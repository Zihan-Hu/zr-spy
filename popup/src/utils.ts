import type { UnwrapRef } from 'vue'
import { computed, onUnmounted, ref } from 'vue'

export { version } from '../../manifest.json'

/**
 * 获取 `chrome.storage.local` 中的值。
 * @param key 键
 * @returns 值
 */
function getStorageValue<T>(key: string) {
  return new Promise<T>((resolve, reject) => {
    chrome.storage.local.get(key, (result) => {
      if (chrome.runtime.lastError)
        reject(chrome.runtime.lastError)
      resolve(result[key])
    })
  })
}

/**
 * 响应式获取 `chrome.storage.local` 中的值。
 * @param key 键
 * @returns 响应式的值
 */
export async function useStorageValue<T>(key: string, defaultValue: UnwrapRef<Awaited<T>>) {
  const value = ref(await getStorageValue<T>(key))
  if (typeof value.value === 'undefined') {
    value.value = defaultValue
    await chrome.storage.local.set({ [key]: defaultValue })
  }

  const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
    if (key in changes)
      value.value = changes[key].newValue
  }
  chrome.storage.local.onChanged.addListener(listener)
  onUnmounted(() => {
    chrome.storage.local.onChanged.removeListener(listener)
  })

  return computed({
    get: () => value.value,
    set: v => chrome.storage.local.set({ [key]: v }),
  })
}

/**
 * 启用/禁用请求规则集。
 * @param id 规则集 ID
 * @param enabled 是否启用
 */
export function setRulesetStatus(id: string, enabled: boolean) {
  if (enabled) {
    return chrome.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds: [id],
    })
  }
  else {
    return chrome.declarativeNetRequest.updateEnabledRulesets({
      disableRulesetIds: [id],
    })
  }
}

/** 重置所有规则集状态为默认值。 */
export function resetRulesets() {
  return chrome.declarativeNetRequest.updateEnabledRulesets({
    enableRulesetIds: ['bypass-password'],
  })
}

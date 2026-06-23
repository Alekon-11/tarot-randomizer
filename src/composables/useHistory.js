import { ref } from 'vue'

const KEY = 'taro-history-v1'
const MAX = 50

function loadEntries() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

const entries = ref(loadEntries())

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries.value.slice(0, MAX)))
  } catch {
    /* localStorage может быть недоступен — тихо игнорируем */
  }
}

function add(entry) {
  entries.value = [{ ...entry, ts: Date.now() }, ...entries.value].slice(0, MAX)
  persist()
}

function clear() {
  entries.value = []
  persist()
}

export function useHistory() {
  return { entries, add, clear }
}

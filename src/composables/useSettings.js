import { ref, watch } from 'vue'

const KEY = 'taro-settings-v1'

const THEMES = ['mystic', 'emerald', 'crimson']
const BACKS = ['weave', 'dots', 'rays']

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}')
  } catch {
    return {}
  }
}
const saved = loadSettings()

const sound = ref(saved.sound ?? false)
const theme = ref(THEMES.includes(saved.theme) ? saved.theme : 'mystic')
const back = ref(BACKS.includes(saved.back) ? saved.back : 'weave')

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ sound: sound.value, theme: theme.value, back: back.value }))
  } catch {
    /* ignore */
  }
}

// Применяем тему/рубашку к корню документа.
function apply() {
  const root = document.documentElement
  root.setAttribute('data-theme', theme.value)
  root.setAttribute('data-back', back.value)
}

watch([sound, theme, back], () => {
  apply()
  persist()
})

export function useSettings() {
  return { sound, theme, back, THEMES, BACKS, apply }
}

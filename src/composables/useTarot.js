import { ref, computed } from 'vue'
import { RU } from '../data/interpretationsRu.js'
import { deckImages } from '../data/cardImages.js'

const API_URL = 'https://tarotapi.dev/api/v1/cards'

// Разбор name_short в тип/масть/номинал — для локального фолбэка без API.
const VALUE_CODE = { ac: 1, pa: 11, kn: 12, qu: 13, ki: 14 }
const SUIT_CODE = { wa: 'wands', cu: 'cups', sw: 'swords', pe: 'pentacles' }

function parseShort(short) {
  if (short.startsWith('ar')) {
    return { type: 'major', suit: null, value_int: parseInt(short.slice(2), 10) }
  }
  const suit = SUIT_CODE[short.slice(0, 2)]
  const vc = short.slice(2)
  const value_int = VALUE_CODE[vc] ?? parseInt(vc, 10)
  return { type: 'minor', suit, value_int }
}

function buildFallbackCards() {
  return Object.keys(RU).map((short) => {
    const meta = parseShort(short)
    return {
      name: RU[short].ru,
      name_short: short,
      type: meta.type,
      suit: meta.suit,
      value_int: meta.value_int
    }
  })
}

function enrich(card) {
  return {
    ...card,
    ru: RU[card.name_short] || null,
    images: deckImages(card, 600)
  }
}

// --- Singleton-состояние: одна загруженная колода на всё приложение ---
const cards = ref([])
const loading = ref(true)
const offline = ref(false)
const error = ref('')
let loadPromise = null

async function load() {
  if (loadPromise) return loadPromise
  loadPromise = (async () => {
    loading.value = true
    error.value = ''
    try {
      const res = await fetch(API_URL)
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const data = await res.json()
      const list = data.cards || []
      if (!list.length) throw new Error('empty')
      cards.value = list.map(enrich)
      offline.value = false
    } catch (e) {
      cards.value = buildFallbackCards().map(enrich)
      offline.value = true
      error.value = String(e.message || e)
    } finally {
      loading.value = false
    }
  })()
  return loadPromise
}

// Перетасовать колоду (Fisher–Yates).
function shuffle() {
  const arr = cards.value.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  cards.value = arr
}

// Случайная карта (по возможности не из списка исключений) + случайное положение.
function drawRandom(exclude = []) {
  const pool = cards.value
  if (!pool.length) return null
  const ex = Array.isArray(exclude) ? exclude : [exclude]
  let pick
  let guard = 0
  do {
    pick = pool[Math.floor(Math.random() * pool.length)]
  } while (ex.includes(pick.name_short) && pool.length > ex.length && guard++ < 50)
  return { card: pick, reversed: Math.random() < 0.5 }
}

// Вытянуть N различных карт со случайными положениями.
function drawSpread(n) {
  const used = []
  const result = []
  for (let i = 0; i < n; i++) {
    const r = drawRandom(used)
    if (!r) break
    used.push(r.card.name_short)
    result.push(r)
  }
  return result
}

const ready = computed(() => !loading.value && cards.value.length > 0)

export function useTarot() {
  return { cards, loading, offline, error, ready, load, drawRandom, drawSpread, shuffle }
}

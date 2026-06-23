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

export function useTarot() {
  const cards = ref([])
  const loading = ref(true)
  const offline = ref(false)
  const error = ref('')

  async function load() {
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
      // API недоступно — карты строим из локальных данных, картинки тянем с Wikimedia.
      cards.value = buildFallbackCards().map(enrich)
      offline.value = true
      error.value = String(e.message || e)
    } finally {
      loading.value = false
    }
  }

  // Перетасовать колоду (Fisher–Yates) — порядок меняется, ощущение ритуала.
  function shuffle() {
    const arr = cards.value.slice()
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    cards.value = arr
  }

  // Случайная карта (по возможности не повторяющая предыдущую) + случайное положение.
  function drawRandom(excludeShort = null) {
    const pool = cards.value
    if (!pool.length) return null
    let pick
    do {
      pick = pool[Math.floor(Math.random() * pool.length)]
    } while (pool.length > 1 && pick.name_short === excludeShort)
    return { card: pick, reversed: Math.random() < 0.5 }
  }

  const ready = computed(() => !loading.value && cards.value.length > 0)

  return { cards, loading, offline, error, ready, load, drawRandom, shuffle }
}

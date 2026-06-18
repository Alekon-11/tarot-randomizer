// «Колоды» — это традиции прочтения одних и тех же карт Райдера–Уэйта.
// Каждая колода по-своему интерпретирует выпавшую карту.
// build(card) получает карту с полями API (meaning_up, meaning_rev, desc, ...)
// и присоединённой русской трактовкой card.ru ({ ru, up, rev, kw }).

export const DECKS = [
  {
    id: 'modern',
    name: 'Современное Таро',
    subtitle: 'Ключи и смысл · на русском',
    icon: '🌙',
    accent: '#b388ff',
    reversed: false,
    build: (card) => ({
      title: card.ru?.up || card.meaning_up,
      keywords: card.ru?.kw || [],
      blocks: [
        { label: 'Что говорит карта', text: card.ru?.up || card.meaning_up }
      ]
    })
  },
  {
    id: 'waite',
    name: 'Уэйт · Классика',
    subtitle: 'Оригинальный текст А. Э. Уэйта (англ.)',
    icon: '📜',
    accent: '#d4af37',
    reversed: false,
    build: (card) => ({
      title: card.name,
      keywords: [],
      blocks: [
        { label: 'Upright meaning', text: card.meaning_up },
        { label: 'Reversed meaning', text: card.meaning_rev },
        { label: 'Symbolism', text: card.desc }
      ].filter((b) => b.text)
    })
  },
  {
    id: 'shadow',
    name: 'Теневое Таро',
    subtitle: 'Перевёрнутые значения · на русском',
    icon: '🜃',
    accent: '#ff6e9c',
    reversed: true,
    build: (card) => ({
      title: card.ru?.ru || card.name,
      keywords: card.ru?.kw || [],
      blocks: [
        { label: 'Теневой аспект (перевёрнутая)', text: card.ru?.rev || card.meaning_rev }
      ]
    })
  }
]

export const DEFAULT_DECK_ID = 'modern'

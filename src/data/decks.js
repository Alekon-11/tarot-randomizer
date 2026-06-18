// Две колоды. Карты в каждой могут выпадать прямыми и перевёрнутыми.
// Трактовки — на русском, по нескольким сферам.
import { CLASSIC } from './classicRu.js'
import { SHADOW } from './shadowRu.js'

export const DECKS = [
  {
    id: 'classic',
    name: 'Классическая колода',
    subtitle: 'Райдер–Уэйт · трактовки по сферам жизни',
    icon: '🌞',
    accent: '#d4af37',
    image: 'rws', // источник изображения
    data: CLASSIC,
    spheres: [
      { key: 'love', label: 'Любовь и отношения', icon: '💞' },
      { key: 'money', label: 'Финансы и работа', icon: '💰' },
      { key: 'events', label: 'События по карте', icon: '🗓️' },
      { key: 'advice', label: 'Совет карты', icon: '🧭' },
      { key: 'magic', label: 'Магическая диагностика', icon: '🔮' }
    ]
  },
  {
    id: 'shadow',
    name: 'Теневая колода',
    subtitle: 'Sola-Busca, 1491 · работа с тенью',
    icon: '🌑',
    accent: '#b56cff',
    image: 'sola',
    data: SHADOW,
    spheres: [
      { key: 'relations', label: 'Преграды в отношениях', icon: '⛓️' },
      { key: 'shadow', label: 'Моя тень', icon: '🌑' },
      { key: 'fears', label: 'Скрытые страхи', icon: '🕷️' },
      { key: 'lesson', label: 'Теневой урок', icon: '🗝️' },
      { key: 'advice', label: 'Как прожить тень', icon: '🕯️' }
    ]
  }
]

// Сборка трактовки для конкретной карты в конкретном положении.
export function readCard(deck, card, reversed) {
  const orient = reversed ? 'rev' : 'up'
  const set = deck.data?.[card.name_short]?.[orient] || {}
  return {
    title: card.ru?.ru || card.name,
    keywords: card.ru?.kw || [],
    spheres: deck.spheres.map((s) => ({
      label: s.label,
      icon: s.icon,
      text: set[s.key] || '—'
    }))
  }
}

export const DEFAULT_DECK_ID = 'classic'

// Сборка URL изображения карты Райдера–Уэйта из Wikimedia Commons (public domain).
// Используем Special:FilePath — он не требует хеш-путей и сам отдаёт нужный файл.

const MAJOR_FILE = {
  0: '00_Fool',
  1: '01_Magician',
  2: '02_High_Priestess',
  3: '03_Empress',
  4: '04_Emperor',
  5: '05_Hierophant',
  6: '06_Lovers',
  7: '07_Chariot',
  8: '08_Strength',
  9: '09_Hermit',
  10: '10_Wheel_of_Fortune',
  11: '11_Justice',
  12: '12_Hanged_Man',
  13: '13_Death',
  14: '14_Temperance',
  15: '15_Devil',
  16: '16_Tower',
  17: '17_Star',
  18: '18_Moon',
  19: '19_Sun',
  20: '20_Judgement',
  21: '21_World'
}

const SUIT_FILE = {
  wands: 'Wands',
  cups: 'Cups',
  swords: 'Swords',
  pentacles: 'Pents'
}

const pad2 = (n) => String(n).padStart(2, '0')

const fileBase = (card) => {
  if (card.type === 'major') {
    return `RWS_Tarot_${MAJOR_FILE[card.value_int]}`
  }
  return `${SUIT_FILE[card.suit]}${pad2(card.value_int)}`
}

// width — желаемая ширина превью (Wikimedia отдаёт уменьшенную копию).
export function cardImageUrl(card, width = 600) {
  const name = encodeURIComponent(`${fileBase(card)}.jpg`)
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${name}?width=${width}`
}

// Страница-источник на Wikimedia Commons (для атрибуции / ссылки).
export function cardSourceUrl(card) {
  const name = encodeURIComponent(`${fileBase(card)}.jpg`)
  return `https://commons.wikimedia.org/wiki/File:${name}`
}

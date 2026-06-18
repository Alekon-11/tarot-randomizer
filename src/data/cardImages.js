// Сборка URL изображений карт из Wikimedia Commons (public domain).
// Две колоды — два источника изображений:
//  • classic → Rider–Waite–Smith (RWS)
//  • shadow  → Sola-Busca (Италия, 1491) — мрачная гравюрная эстетика, не Уэйт.
// Special:FilePath не требует хеш-путей и сам отдаёт файл.

const FILEPATH = 'https://commons.wikimedia.org/wiki/Special:FilePath/'

// ---- Rider–Waite–Smith ----
const MAJOR_FILE = {
  0: '00_Fool', 1: '01_Magician', 2: '02_High_Priestess', 3: '03_Empress',
  4: '04_Emperor', 5: '05_Hierophant', 6: '06_Lovers', 7: '07_Chariot',
  8: '08_Strength', 9: '09_Hermit', 10: '10_Wheel_of_Fortune', 11: '11_Justice',
  12: '12_Hanged_Man', 13: '13_Death', 14: '14_Temperance', 15: '15_Devil',
  16: '16_Tower', 17: '17_Star', 18: '18_Moon', 19: '19_Sun',
  20: '20_Judgement', 21: '21_World'
}
const RWS_SUIT = { wands: 'Wands', cups: 'Cups', swords: 'Swords', pentacles: 'Pents' }
const pad2 = (n) => String(n).padStart(2, '0')

function rwsFile(card) {
  if (card.type === 'major') return `RWS_Tarot_${MAJOR_FILE[card.value_int]}.jpg`
  return `${RWS_SUIT[card.suit]}${pad2(card.value_int)}.jpg`
}

// ---- Sola-Busca ----
// Файлы: "Sola Busca tarot card 00.jpg" … "77.jpg".
// 00–21 — старшие арканы (по порядку), 22–77 — младшие (детерминированное соответствие).
const SOLA_SUIT_ORDER = { wands: 0, cups: 1, swords: 2, pentacles: 3 }

function solaIndex(card) {
  if (card.type === 'major') return card.value_int // 0..21
  const suitOffset = SOLA_SUIT_ORDER[card.suit] * 14
  const rankIndex = card.value_int - 1 // ace(1)->0 … king(14)->13
  return 22 + suitOffset + rankIndex // 22..77
}

function solaFile(card) {
  return `Sola Busca tarot card ${pad2(solaIndex(card))}.jpg`
}

// ---- Публичные хелперы ----
function url(file, width) {
  return `${FILEPATH}${encodeURIComponent(file)}?width=${width}`
}
function sourcePage(file) {
  return `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file)}`
}

export function deckImages(card, width = 600) {
  const rws = rwsFile(card)
  const sola = solaFile(card)
  return {
    rws: { url: url(rws, width), source: sourcePage(rws) },
    sola: { url: url(sola, width), source: sourcePage(sola) }
  }
}

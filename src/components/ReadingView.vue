<script setup>
import { computed, ref } from 'vue'
import { useTarot } from '../composables/useTarot.js'
import { useHistory } from '../composables/useHistory.js'
import { useAudio } from '../composables/useAudio.js'
import { useSettings } from '../composables/useSettings.js'
import { DECKS, DEFAULT_DECK_ID, readCard } from '../data/decks.js'
import { CLASSIC } from '../data/classicRu.js'
import { LOVE } from '../data/loveRu.js'
import CardDisplay from './CardDisplay.vue'
import CardModal from './CardModal.vue'

const { loading, offline, ready, drawRandom, drawSpread, shuffle } = useTarot()
const { entries, add, clear } = useHistory()
const { playShuffle } = useAudio()
const { sound } = useSettings()

const classicDeck = DECKS.find((d) => d.id === 'classic')

// карта, открытая в модальном окне (из расклада на 3 карты)
const modalItem = ref(null) // { card, reversed, label }

const SPREADS = {
  ppf: {
    name: 'Прошлое · Настоящее · Будущее',
    positions: [
      { label: 'Прошлое', sphere: 'events' },
      { label: 'Настоящее', sphere: 'events' },
      { label: 'Будущее', sphere: 'events' }
    ]
  },
  sao: {
    name: 'Ситуация · Совет · Итог',
    positions: [
      { label: 'Ситуация', sphere: 'events' },
      { label: 'Совет', sphere: 'advice' },
      { label: 'Итог', sphere: 'events' }
    ]
  }
}

// Любовный расклад: те же 3 карты, но два варианта позиций.
const LOVE_LAYOUTS = {
  ppf: { name: 'Прошлое · Настоящее · Будущее', labels: ['Прошлое', 'Настоящее', 'Будущее'] },
  fta: { name: 'Чувства · Мысли · Действия', labels: ['Чувства', 'Мысли', 'Действия'] }
}

const mode = ref('single') // 'single' | 'three' | 'love'
const spreadType = ref('ppf')
const loveLayout = ref('ppf')
const selectedDeckId = ref(DEFAULT_DECK_ID)
const question = ref('')

const current = ref(null) // { card, reversed }
const spread = ref([]) // [{ card, reversed }]
const drawing = ref(false)
const shuffling = ref(false)
const justShuffled = ref(false)
const flipKey = ref(0)
const showHistory = ref(false)

const selectedDeck = computed(
  () => DECKS.find((d) => d.id === selectedDeckId.value) || DECKS[0]
)
const positions = computed(() => SPREADS[spreadType.value].positions)
const layoutName = computed(() =>
  mode.value === 'love' ? LOVE_LAYOUTS[loveLayout.value].name : SPREADS[spreadType.value].name
)
const posLabels = computed(() =>
  mode.value === 'love'
    ? LOVE_LAYOUTS[loveLayout.value].labels
    : SPREADS[spreadType.value].positions.map((p) => p.label)
)

function isPersonCard(card) {
  return card.type === 'major' || [11, 12, 13, 14].includes(card.value_int)
}
// Комбинированный любовный текст: развёрнутая любовь + события + (личность — для старших и карт-людей).
function loveText(item) {
  const o = item.reversed ? 'rev' : 'up'
  const s = item.card.name_short
  const parts = []
  if (LOVE[s]?.[o]) parts.push(LOVE[s][o])
  if (CLASSIC[s]?.[o]?.events) parts.push(CLASSIC[s][o].events)
  if (isPersonCard(item.card) && CLASSIC[s]?.[o]?.person) parts.push(CLASSIC[s][o].person)
  return parts.join(' ')
}

function reset() {
  current.value = null
  spread.value = []
}

function cellSphereText(item, sphereKey) {
  const set = CLASSIC[item.card.name_short]?.[item.reversed ? 'rev' : 'up']
  return set?.[sphereKey] || '—'
}

function recordHistory() {
  const base = { question: question.value.trim(), at: new Date().toLocaleString('ru-RU') }
  if (mode.value === 'single' && current.value) {
    add({
      ...base,
      kind: 'Одна карта',
      deck: selectedDeck.value.name,
      cards: [{ name: current.value.card.ru?.ru || current.value.card.name, reversed: current.value.reversed }]
    })
  } else if (spread.value.length) {
    add({
      ...base,
      kind: (mode.value === 'love' ? 'Любовный · ' : '') + layoutName.value,
      deck: classicDeck.name,
      cards: spread.value.map((it, i) => ({
        pos: posLabels.value[i],
        name: it.card.ru?.ru || it.card.name,
        reversed: it.reversed
      }))
    })
  }
}

function draw() {
  if (!ready.value || drawing.value || shuffling.value) return
  drawing.value = true
  justShuffled.value = false
  setTimeout(() => {
    if (mode.value === 'single') {
      const prev = current.value?.card.name_short
      current.value = drawRandom(prev ? [prev] : [])
      spread.value = []
    } else {
      spread.value = drawSpread(3)
      current.value = null
    }
    flipKey.value++
    drawing.value = false
    recordHistory()
  }, 480)
}

function doShuffle() {
  if (!ready.value || drawing.value || shuffling.value) return
  shuffling.value = true
  if (sound.value) playShuffle()
  reset()
  setTimeout(() => {
    shuffle()
    shuffling.value = false
    justShuffled.value = true
  }, 900)
}

function setMode(m) {
  if (m === mode.value) return
  mode.value = m
  reset()
  justShuffled.value = false
}

const hasResult = computed(() => current.value || spread.value.length)

function openSpreadCard(item, label) {
  modalItem.value = { card: item.card, reversed: item.reversed, label }
}
</script>

<template>
  <div class="reading">
    <!-- Режим -->
    <div class="mode">
      <button class="mode__btn" :class="{ active: mode === 'single' }" type="button" @click="setMode('single')">
        Одна карта
      </button>
      <button class="mode__btn" :class="{ active: mode === 'three' }" type="button" @click="setMode('three')">
        Три карты
      </button>
      <button class="mode__btn" :class="{ active: mode === 'love' }" type="button" @click="setMode('love')">
        💞 Любовный
      </button>
    </div>

    <!-- Тип расклада из 3 карт -->
    <div v-if="mode === 'three'" class="spread-select">
      <label v-for="(s, key) in SPREADS" :key="key" class="spread-opt" :class="{ active: spreadType === key }">
        <input type="radio" :value="key" v-model="spreadType" />
        {{ s.name }}
      </label>
    </div>

    <!-- Раскладка любовного расклада -->
    <div v-else-if="mode === 'love'" class="spread-select">
      <label v-for="(s, key) in LOVE_LAYOUTS" :key="key" class="spread-opt" :class="{ active: loveLayout === key }">
        <input type="radio" :value="key" v-model="loveLayout" />
        {{ s.name }}
      </label>
    </div>

    <!-- Выбор колоды (только для одной карты) -->
    <section v-if="mode === 'single'" class="decks" aria-label="Выбор колоды">
      <button
        v-for="deck in DECKS"
        :key="deck.id"
        class="deck-chip"
        :class="{ active: deck.id === selectedDeckId }"
        :style="{ '--accent': deck.accent }"
        type="button"
        @click="selectedDeckId = deck.id"
      >
        <span class="deck-chip__icon">{{ deck.icon }}</span>
        <span class="deck-chip__text">
          <span class="deck-chip__name">{{ deck.name }}</span>
          <span class="deck-chip__sub">{{ deck.subtitle }}</span>
        </span>
      </button>
    </section>
    <p v-else class="deck-note">
      {{ mode === 'love'
        ? 'Любовный расклад: 3 карты классической колоды с развёрнутой трактовкой по любви.'
        : 'Расклады из трёх карт используют классическую колоду (Райдер–Уэйт).' }}
    </p>

    <!-- Вопрос -->
    <div class="question">
      <input
        v-model="question"
        type="text"
        class="question__input"
        maxlength="140"
        placeholder="Сформулируйте вопрос (необязательно)…"
        @keyup.enter="draw"
      />
    </div>

    <!-- Кнопки -->
    <div class="actions">
      <button class="draw-btn" type="button" :disabled="!ready || drawing || shuffling" @click="draw">
        <span v-if="loading">Тасуем колоду…</span>
        <span v-else-if="drawing">✨ Раскрываем…</span>
        <span v-else-if="!hasResult">{{ mode === 'single' ? 'Вытянуть карту' : 'Сделать расклад' }}</span>
        <span v-else>{{ mode === 'single' ? 'Вытянуть ещё одну' : 'Новый расклад' }}</span>
      </button>
      <button class="shuffle-btn" type="button" :disabled="!ready || drawing || shuffling" @click="doShuffle">
        🔀 Перетасовать
      </button>
      <p v-if="offline" class="offline-note">⚠️ Онлайн-API недоступно — показываем встроенные трактовки.</p>
    </div>

    <!-- Активный вопрос -->
    <p v-if="hasResult && question.trim()" class="active-q">«{{ question.trim() }}»</p>

    <!-- Сцена -->
    <section class="stage">
      <div v-if="shuffling" class="shuffle-anim" aria-label="Колода тасуется">
        <div class="shuffle-card" v-for="n in 6" :key="n"></div>
        <p class="shuffle-anim__text">Тасуем колоду…</p>
      </div>

      <template v-else>
        <!-- Одна карта -->
        <Transition name="flip" mode="out-in">
          <CardDisplay
            v-if="mode === 'single' && current"
            :key="flipKey"
            :card="current.card"
            :deck="selectedDeck"
            :reversed="current.reversed"
          />
          <!-- Три карты -->
          <div v-else-if="mode === 'three' && spread.length" class="spread" :key="'s' + flipKey">
            <button
              v-for="(item, i) in spread"
              :key="i"
              class="spread-cell"
              type="button"
              :title="'Подробнее: ' + (item.card.ru?.ru || item.card.name)"
              @click="openSpreadCard(item, positions[i].label)"
            >
              <span class="spread-cell__pos">{{ positions[i].label }}</span>
              <div class="spread-cell__frame" :class="{ reversed: item.reversed }">
                <img :src="item.card.images.rws.url" :alt="item.card.ru?.ru" class="spread-cell__img" />
              </div>
              <h3 class="spread-cell__name">
                {{ item.card.ru?.ru || item.card.name }}
                <span class="spread-cell__rev">{{ item.reversed ? '↧' : '↥' }}</span>
              </h3>
              <ul class="spread-cell__kw">
                <li v-for="kw in (item.card.ru?.kw || [])" :key="kw">{{ kw }}</li>
              </ul>
              <p class="spread-cell__text">{{ cellSphereText(item, positions[i].sphere) }}</p>
              <span class="spread-cell__more">Подробнее →</span>
            </button>
          </div>
          <!-- Любовный расклад -->
          <div v-else-if="mode === 'love' && spread.length" class="love-spread" :key="'l' + flipKey">
            <article v-for="(item, i) in spread" :key="i" class="love-row">
              <div class="love-row__visual">
                <span class="love-row__pos">{{ posLabels[i] }}</span>
                <div class="love-row__frame" :class="{ reversed: item.reversed }">
                  <img :src="item.card.images.rws.url" :alt="item.card.ru?.ru" class="love-row__img" />
                </div>
              </div>
              <div class="love-row__body">
                <h3 class="love-row__name">
                  {{ item.card.ru?.ru || item.card.name }}
                  <span class="love-row__rev">{{ item.reversed ? '↧ перевёрнутая' : '↥ прямая' }}</span>
                </h3>
                <ul class="love-row__kw">
                  <li v-for="kw in (item.card.ru?.kw || [])" :key="kw">{{ kw }}</li>
                </ul>
                <p class="love-row__text">{{ loveText(item) }}</p>
              </div>
            </article>
          </div>
          <!-- Пусто -->
          <div v-else class="placeholder" key="placeholder">
            <button
              class="placeholder__card"
              type="button"
              :disabled="!ready || drawing || shuffling"
              title="Нажмите, чтобы вытянуть карту"
              @click="draw"
            >
              <span class="placeholder__back">✦</span>
            </button>
            <p class="placeholder__text">
              {{ justShuffled
                ? 'Колода перетасована. Нажмите на карту или кнопку, чтобы вытянуть.'
                : 'Нажмите на карту или кнопку, чтобы открыть её.' }}
            </p>
          </div>
        </Transition>
      </template>
    </section>

    <!-- История -->
    <section class="history">
      <button class="history__toggle" type="button" @click="showHistory = !showHistory">
        {{ showHistory ? '▾' : '▸' }} История раскладов
        <span v-if="entries.length" class="history__count">{{ entries.length }}</span>
      </button>
      <div v-if="showHistory" class="history__body">
        <p v-if="!entries.length" class="history__empty">Пока пусто — сделайте первый расклад.</p>
        <template v-else>
          <button class="history__clear" type="button" @click="clear">Очистить историю</button>
          <ul class="history__list">
            <li v-for="(e, i) in entries" :key="i" class="history__item">
              <div class="history__meta">
                <span class="history__date">{{ e.at }}</span>
                <span class="history__deck">{{ e.kind }} · {{ e.deck }}</span>
              </div>
              <p v-if="e.question" class="history__q">«{{ e.question }}»</p>
              <p class="history__cards">
                <span v-for="(c, j) in e.cards" :key="j" class="history__card">
                  <template v-if="c.pos">{{ c.pos }}: </template>{{ c.name }} {{ c.reversed ? '↧' : '↥' }}
                </span>
              </p>
            </li>
          </ul>
        </template>
      </div>
    </section>

    <CardModal
      v-if="modalItem"
      :card="modalItem.card"
      deck-id="classic"
      :reversed="modalItem.reversed"
      :position-label="modalItem.label"
      @close="modalItem = null"
    />
  </div>
</template>

<style scoped>
.mode {
  display: flex;
  justify-content: center;
  gap: 0.4rem;
  margin-bottom: 1.2rem;
}
.mode__btn {
  padding: 0.5rem 1.3rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.03);
  color: #b6acd6;
  cursor: pointer;
  transition: all 0.2s ease;
}
.mode__btn.active {
  color: #fff;
  border-color: #b388ff;
  background: rgba(179, 136, 255, 0.18);
}

.spread-select {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-bottom: 1.4rem;
}
.spread-opt {
  font-size: 0.88rem;
  padding: 0.45rem 1rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #c4bbe0;
  cursor: pointer;
  transition: all 0.2s ease;
}
.spread-opt.active { border-color: #b388ff; background: rgba(179, 136, 255, 0.14); color: #fff; }
.spread-opt input { display: none; }

.decks {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 0.9rem;
  margin-bottom: 1.4rem;
}
.deck-chip {
  display: flex; align-items: center; gap: 0.8rem; text-align: left;
  padding: 1rem 1.1rem; border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #cfc7e8; cursor: pointer; transition: all 0.2s ease;
}
.deck-chip:hover { border-color: var(--accent); background: rgba(255, 255, 255, 0.06); }
.deck-chip.active {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 16%, transparent);
  box-shadow: 0 0 0 1px var(--accent), 0 8px 30px -12px var(--accent);
}
.deck-chip__icon { font-size: 1.8rem; line-height: 1; }
.deck-chip__name { display: block; font-weight: 600; color: #fff; }
.deck-chip__sub { display: block; font-size: 0.8rem; color: #9a90bd; margin-top: 0.15rem; }
.deck-note { text-align: center; color: #9a90bd; font-size: 0.88rem; margin: 0 0 1.2rem; }

.question { display: flex; justify-content: center; margin-bottom: 1.2rem; }
.question__input {
  width: 100%;
  max-width: 460px;
  padding: 0.75rem 1.1rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: #ece7f7;
  font-size: 0.98rem;
  outline: none;
  transition: border-color 0.2s ease;
}
.question__input::placeholder { color: #79719c; }
.question__input:focus { border-color: #b388ff; }

.actions {
  display: flex; flex-wrap: wrap; justify-content: center; align-items: center;
  gap: 0.8rem; margin-bottom: 1.4rem;
}
.actions > .offline-note { flex-basis: 100%; text-align: center; }
.draw-btn {
  font-size: 1.05rem; font-weight: 600; color: #1a1030;
  background: var(--grad);
  border: none; border-radius: 999px; padding: 0.95rem 2.6rem; cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.2s ease, opacity 0.2s;
  box-shadow: 0 10px 30px -10px rgba(179, 136, 255, 0.7);
}
.draw-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 16px 40px -12px rgba(179, 136, 255, 0.9); }
.draw-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.shuffle-btn {
  font-size: 0.95rem; color: #d8cff2;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(179, 136, 255, 0.35);
  border-radius: 999px; padding: 0.85rem 1.5rem; cursor: pointer; transition: all 0.2s ease;
}
.shuffle-btn:hover:not(:disabled) { background: rgba(179, 136, 255, 0.15); border-color: #b388ff; transform: translateY(-2px); }
.shuffle-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.offline-note { margin: 0; font-size: 0.85rem; color: #ffcf8b; }

.active-q { text-align: center; color: #c9b3ff; font-style: italic; margin: 0 0 1.4rem; }

.stage { min-height: 360px; position: relative; }

/* Расклад из 3 карт */
.spread {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.2rem;
}
.spread-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  color: inherit;
  cursor: pointer;
}
.spread-cell:hover .spread-cell__frame {
  transform: translateY(-5px);
  box-shadow: 0 0 0 1.5px var(--accent-2), 0 18px 40px -14px rgba(0, 0, 0, 0.85);
}
.spread-cell:hover .spread-cell__frame.reversed {
  transform: translateY(-5px) rotate(180deg);
}
.spread-cell__more {
  margin-top: 0.5rem;
  font-size: 0.78rem;
  color: var(--accent-1);
  opacity: 0;
  transition: opacity 0.2s ease;
}
.spread-cell:hover .spread-cell__more { opacity: 1; }
.spread-cell { animation: cellIn 0.5s ease both; }
.spread-cell:nth-child(2) { animation-delay: 0.12s; }
.spread-cell:nth-child(3) { animation-delay: 0.24s; }
@keyframes cellIn {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
.spread-cell__pos {
  font-size: 0.78rem; letter-spacing: 0.06em; text-transform: uppercase;
  color: #ffd479; margin-bottom: 0.6rem;
}
.spread-cell__frame {
  width: 100%;
  aspect-ratio: 600 / 1024;
  border-radius: 12px;
  overflow: hidden;
  background: #1a1430;
  box-shadow: 0 0 0 1.5px rgba(212, 175, 55, 0.6), 0 12px 30px -14px rgba(0, 0, 0, 0.8);
  transition: transform 0.5s ease;
}
.spread-cell__frame.reversed { transform: rotate(180deg); }
.spread-cell__img { width: 100%; height: 100%; object-fit: cover; display: block; }
.spread-cell__name {
  margin: 0.7rem 0 0.4rem; font-family: 'Georgia', serif; font-size: 1.1rem; color: #fff;
}
.spread-cell__rev { color: #9a90bd; }
.spread-cell__kw {
  list-style: none; display: flex; flex-wrap: wrap; justify-content: center;
  gap: 0.3rem; padding: 0; margin: 0 0 0.6rem;
}
.spread-cell__kw li {
  font-size: 0.72rem; padding: 0.2rem 0.5rem; border-radius: 6px;
  background: rgba(179, 136, 255, 0.13); color: #cbb6ff; border: 1px solid rgba(179, 136, 255, 0.3);
}
.spread-cell__text { margin: 0; font-size: 0.92rem; line-height: 1.5; color: #d7d0ea; }

/* Любовный расклад — строки с развёрнутым текстом */
.love-spread { display: flex; flex-direction: column; gap: 1.1rem; }
.love-row {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 1.4rem;
  align-items: start;
  background: rgba(255, 110, 156, 0.05);
  border: 1px solid rgba(255, 110, 156, 0.18);
  border-radius: 14px;
  padding: 1.1rem 1.2rem;
  animation: cellIn 0.5s ease both;
}
.love-row:nth-child(2) { animation-delay: 0.1s; }
.love-row:nth-child(3) { animation-delay: 0.2s; }
.love-row__visual { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
.love-row__pos {
  font-size: 0.72rem; letter-spacing: 0.06em; text-transform: uppercase;
  color: #ff9cbb; text-align: center;
}
.love-row__frame {
  width: 140px; aspect-ratio: 600 / 1024; border-radius: 10px; overflow: hidden;
  background: #1a1430; box-shadow: 0 0 0 1.5px rgba(212, 175, 55, 0.5), 0 10px 26px -14px rgba(0, 0, 0, 0.85);
  transition: transform 0.5s ease;
}
.love-row__frame.reversed { transform: rotate(180deg); }
.love-row__img { width: 100%; height: 100%; object-fit: cover; display: block; }
.love-row__name {
  margin: 0 0 0.4rem; font-family: 'Georgia', serif; font-size: 1.3rem; color: #fff;
}
.love-row__rev { font-size: 0.82rem; color: #9a90bd; font-family: 'Segoe UI', sans-serif; }
.love-row__kw {
  list-style: none; display: flex; flex-wrap: wrap; gap: 0.35rem; padding: 0; margin: 0 0 0.7rem;
}
.love-row__kw li {
  font-size: 0.74rem; padding: 0.2rem 0.55rem; border-radius: 6px;
  background: rgba(255, 110, 156, 0.13); color: #ff9cbb; border: 1px solid rgba(255, 110, 156, 0.3);
}
.love-row__text { margin: 0; line-height: 1.65; color: #e2dbf0; font-size: 1rem; }

@media (max-width: 560px) {
  .love-row { grid-template-columns: 1fr; }
  .love-row__visual { max-width: 160px; margin: 0 auto; }
}

.shuffle-anim {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 340px; position: relative;
}
.shuffle-card {
  position: absolute; top: 30px; left: 50%; width: 130px; height: 222px; margin-left: -65px;
  border-radius: 12px;
  background: var(--card-back);
  border: 1.5px solid rgba(179, 136, 255, 0.5);
  box-shadow: 0 12px 30px -12px rgba(0, 0, 0, 0.8);
  animation: shuffleMove 0.9s ease-in-out infinite;
}
.shuffle-card:nth-child(1) { animation-delay: 0s; }
.shuffle-card:nth-child(2) { animation-delay: 0.08s; }
.shuffle-card:nth-child(3) { animation-delay: 0.16s; }
.shuffle-card:nth-child(4) { animation-delay: 0.24s; }
.shuffle-card:nth-child(5) { animation-delay: 0.32s; }
.shuffle-card:nth-child(6) { animation-delay: 0.4s; }
@keyframes shuffleMove {
  0% { transform: translateX(0) rotate(0deg); }
  25% { transform: translateX(-90px) rotate(-12deg) translateY(-8px); }
  50% { transform: translateX(0) rotate(0deg); }
  75% { transform: translateX(90px) rotate(12deg) translateY(-8px); }
  100% { transform: translateX(0) rotate(0deg); }
}
.shuffle-anim__text { position: absolute; bottom: 10px; color: #b6acd6; letter-spacing: 0.05em; }

.placeholder { display: flex; flex-direction: column; align-items: center; gap: 1.2rem; padding-top: 1rem; }
.placeholder__card {
  width: 200px; aspect-ratio: 600 / 1024; border-radius: 16px;
  background: var(--card-back);
  border: 2px solid rgba(179, 136, 255, 0.4); display: grid; place-items: center;
  box-shadow: 0 18px 50px -16px rgba(0, 0, 0, 0.8); animation: float 4s ease-in-out infinite;
  cursor: pointer; padding: 0; transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}
.placeholder__card:hover:not(:disabled) {
  border-color: var(--accent-1);
  box-shadow: 0 22px 60px -16px rgba(0, 0, 0, 0.85), 0 0 40px -12px var(--accent-1);
}
.placeholder__card:disabled { cursor: not-allowed; opacity: 0.7; }
.placeholder__back { font-size: 3rem; color: rgba(201, 179, 255, 0.6); }
.placeholder__text { color: #9a90bd; text-align: center; max-width: 320px; }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }

/* Лёгкий fade на смене — сам 3D-переворот живёт внутри CardDisplay */
.flip-enter-active { transition: opacity 0.4s ease; }
.flip-leave-active { transition: opacity 0.2s ease; }
.flip-enter-from, .flip-leave-to { opacity: 0; }

/* История */
.history { margin-top: 2.5rem; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 1.2rem; }
.history__toggle {
  background: none; border: none; color: #c4bbe0; font-size: 0.95rem; cursor: pointer;
  display: flex; align-items: center; gap: 0.5rem;
}
.history__count {
  background: rgba(179, 136, 255, 0.2); color: #cbb6ff; border-radius: 999px;
  padding: 0.05rem 0.5rem; font-size: 0.78rem;
}
.history__body { margin-top: 1rem; }
.history__empty { color: #79719c; }
.history__clear {
  background: none; border: 1px solid rgba(255, 110, 156, 0.35); color: #ff9cbb;
  border-radius: 8px; padding: 0.3rem 0.8rem; font-size: 0.82rem; cursor: pointer; margin-bottom: 0.8rem;
}
.history__list { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.7rem; }
.history__item {
  background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 10px; padding: 0.7rem 0.9rem;
}
.history__meta { display: flex; justify-content: space-between; gap: 0.5rem; flex-wrap: wrap; }
.history__date { color: #9a90bd; font-size: 0.8rem; }
.history__deck { color: #ffd479; font-size: 0.8rem; }
.history__q { margin: 0.3rem 0; color: #c9b3ff; font-style: italic; font-size: 0.9rem; }
.history__cards { margin: 0.3rem 0 0; display: flex; flex-wrap: wrap; gap: 0.5rem; }
.history__card { font-size: 0.85rem; color: #ded7ef; }

@media (max-width: 600px) {
  .spread { grid-template-columns: 1fr; gap: 1.6rem; max-width: 260px; margin: 0 auto; }
}
</style>

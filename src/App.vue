<script setup>
import { computed, onMounted, ref } from 'vue'
import { useTarot } from './composables/useTarot.js'
import { DECKS, DEFAULT_DECK_ID } from './data/decks.js'
import CardDisplay from './components/CardDisplay.vue'
import DailyCard from './components/DailyCard.vue'

const { cards, loading, offline, ready, load, drawRandom, shuffle } = useTarot()

const activeView = ref('draw') // 'draw' | 'daily'
const selectedDeckId = ref(DEFAULT_DECK_ID)
const current = ref(null)
const reversed = ref(false)
const drawing = ref(false)
const shuffling = ref(false)
const justShuffled = ref(false)
const flipKey = ref(0)

const selectedDeck = computed(
  () => DECKS.find((d) => d.id === selectedDeckId.value) || DECKS[0]
)

onMounted(load)

function selectDeck(id) {
  selectedDeckId.value = id
}

function draw() {
  if (!ready.value || drawing.value || shuffling.value) return
  drawing.value = true
  justShuffled.value = false
  const prev = current.value?.name_short || null
  setTimeout(() => {
    const res = drawRandom(prev)
    current.value = res.card
    reversed.value = res.reversed
    flipKey.value++
    drawing.value = false
  }, 480)
}

function doShuffle() {
  if (!ready.value || drawing.value || shuffling.value) return
  shuffling.value = true
  current.value = null
  setTimeout(() => {
    shuffle()
    shuffling.value = false
    justShuffled.value = true
  }, 900)
}
</script>

<template>
  <div class="app">
    <div class="stars" aria-hidden="true"></div>

    <header class="hero">
      <div class="hero__badge">🔮 Таро</div>
      <h1 class="hero__title">Рандомайзер карт Таро</h1>
      <p class="hero__lead">
        Выберите колоду, задайте мысленно вопрос и вытяните случайную карту.
        Карта может выпасть прямой или перевёрнутой — трактовка дана по нескольким сферам.
      </p>
    </header>

    <nav class="nav">
      <button
        class="nav__tab"
        :class="{ active: activeView === 'draw' }"
        type="button"
        @click="activeView = 'draw'"
      >🃏 Расклад</button>
      <button
        class="nav__tab"
        :class="{ active: activeView === 'daily' }"
        type="button"
        @click="activeView = 'daily'"
      >☀️ Карта дня</button>
    </nav>

    <!-- ======= РАСКЛАД ======= -->
    <main v-if="activeView === 'draw'" class="panel">
      <section class="decks" aria-label="Выбор колоды">
        <button
          v-for="deck in DECKS"
          :key="deck.id"
          class="deck-chip"
          :class="{ active: deck.id === selectedDeckId }"
          :style="{ '--accent': deck.accent }"
          type="button"
          @click="selectDeck(deck.id)"
        >
          <span class="deck-chip__icon">{{ deck.icon }}</span>
          <span class="deck-chip__text">
            <span class="deck-chip__name">{{ deck.name }}</span>
            <span class="deck-chip__sub">{{ deck.subtitle }}</span>
          </span>
        </button>
      </section>

      <div class="actions">
        <button
          class="draw-btn"
          type="button"
          :disabled="!ready || drawing || shuffling"
          @click="draw"
        >
          <span v-if="loading">Тасуем колоду…</span>
          <span v-else-if="drawing">✨ Раскрываем…</span>
          <span v-else-if="!current">Вытянуть карту</span>
          <span v-else>Вытянуть ещё одну</span>
        </button>
        <button
          class="shuffle-btn"
          type="button"
          :disabled="!ready || drawing || shuffling"
          @click="doShuffle"
        >🔀 Перетасовать</button>

        <p v-if="offline" class="offline-note">
          ⚠️ Онлайн-API недоступно — показываем встроенные трактовки.
        </p>
        <p v-else-if="current" class="hint-note">
          Колоду можно переключить — трактовка той же карты изменится.
        </p>
      </div>

      <section class="stage">
        <!-- Анимация перетасовки -->
        <div v-if="shuffling" class="shuffle-anim" aria-label="Колода тасуется">
          <div class="shuffle-card" v-for="n in 6" :key="n"></div>
          <p class="shuffle-anim__text">Тасуем колоду…</p>
        </div>

        <Transition v-else name="flip" mode="out-in">
          <CardDisplay
            v-if="current"
            :key="flipKey"
            :card="current"
            :deck="selectedDeck"
            :reversed="reversed"
          />
          <div v-else class="placeholder" key="placeholder">
            <div class="placeholder__card">
              <div class="placeholder__back">✦</div>
            </div>
            <p class="placeholder__text">
              {{ justShuffled
                ? 'Колода перетасована. Нажмите кнопку, чтобы вытянуть карту.'
                : 'Карта ждёт. Нажмите кнопку, чтобы открыть её.' }}
            </p>
          </div>
        </Transition>
      </section>
    </main>

    <!-- ======= КАРТА ДНЯ ======= -->
    <main v-else class="panel">
      <div v-if="loading" class="loading-note">Загружаем карту дня…</div>
      <DailyCard v-else :cards="cards" />
    </main>

    <footer class="footer">
      <p>
        Данные карт — <a href="https://tarotapi.dev" target="_blank" rel="noopener">tarotapi.dev</a>.
        Изображения — <a href="https://commons.wikimedia.org" target="_blank" rel="noopener">Wikimedia Commons</a>,
        public domain: классическая колода — Райдер–Уэйт–Смит, теневая — Sola-Busca (1491).
      </p>
      <p class="footer__disclaimer">Приложение создано для развлечения.</p>
    </footer>
  </div>
</template>

<style scoped>
.app {
  position: relative;
  max-width: 1040px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 4rem;
}

.hero { text-align: center; margin-bottom: 1.8rem; }
.hero__badge {
  display: inline-block;
  font-size: 0.8rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #c9b3ff;
  border: 1px solid rgba(179, 136, 255, 0.35);
  border-radius: 999px;
  padding: 0.35rem 1rem;
  margin-bottom: 1rem;
}
.hero__title {
  font-family: 'Georgia', serif;
  font-size: clamp(2rem, 6vw, 3.4rem);
  margin: 0 0 0.8rem;
  background: linear-gradient(120deg, #fff 10%, #c9b3ff 55%, #ffd479 95%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.hero__lead {
  max-width: 600px;
  margin: 0 auto;
  color: #aaa0cc;
  line-height: 1.6;
}

/* Навигация */
.nav {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
  position: relative;
  z-index: 1;
}
.nav__tab {
  padding: 0.6rem 1.4rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  color: #b6acd6;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
}
.nav__tab:hover { color: #fff; border-color: rgba(179, 136, 255, 0.4); }
.nav__tab.active {
  color: #1a1030;
  background: linear-gradient(120deg, #ffd479, #b388ff);
  border-color: transparent;
  font-weight: 600;
}

.panel { position: relative; z-index: 1; }

.decks {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 0.9rem;
  margin-bottom: 1.8rem;
}
.deck-chip {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  text-align: left;
  padding: 1rem 1.1rem;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #cfc7e8;
  cursor: pointer;
  transition: all 0.2s ease;
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

.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 2.5rem;
}
.actions > .offline-note,
.actions > .hint-note { flex-basis: 100%; text-align: center; }
.draw-btn {
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #1a1030;
  background: linear-gradient(120deg, #ffd479, #b388ff);
  border: none;
  border-radius: 999px;
  padding: 0.95rem 2.6rem;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.2s ease, opacity 0.2s;
  box-shadow: 0 10px 30px -10px rgba(179, 136, 255, 0.7);
}
.draw-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 16px 40px -12px rgba(179, 136, 255, 0.9);
}
.draw-btn:active:not(:disabled) { transform: translateY(0); }
.draw-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.shuffle-btn {
  font-size: 0.95rem;
  color: #d8cff2;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(179, 136, 255, 0.35);
  border-radius: 999px;
  padding: 0.85rem 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}
.shuffle-btn:hover:not(:disabled) {
  background: rgba(179, 136, 255, 0.15);
  border-color: #b388ff;
  transform: translateY(-2px);
}
.shuffle-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.offline-note { margin: 0; font-size: 0.85rem; color: #ffcf8b; }
.hint-note { margin: 0; font-size: 0.85rem; color: #8c83b0; }

.stage { min-height: 360px; position: relative; }

/* Анимация перетасовки */
.shuffle-anim {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding-top: 1rem;
  min-height: 340px;
  position: relative;
}
.shuffle-card {
  position: absolute;
  top: 30px;
  left: 50%;
  width: 130px;
  height: 222px;
  margin-left: -65px;
  border-radius: 12px;
  background: repeating-linear-gradient(45deg, #2a1f50 0 9px, #34276a 9px 18px);
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
  0%   { transform: translateX(0) rotate(0deg) translateY(0); }
  25%  { transform: translateX(-90px) rotate(-12deg) translateY(-8px); }
  50%  { transform: translateX(0) rotate(0deg) translateY(0); }
  75%  { transform: translateX(90px) rotate(12deg) translateY(-8px); }
  100% { transform: translateX(0) rotate(0deg) translateY(0); }
}
.shuffle-anim__text {
  position: absolute;
  bottom: 10px;
  color: #b6acd6;
  letter-spacing: 0.05em;
}

.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.2rem;
  padding-top: 1rem;
}
.placeholder__card {
  width: 200px;
  aspect-ratio: 600 / 1024;
  border-radius: 16px;
  background: repeating-linear-gradient(45deg, #241b45 0 10px, #2c2152 10px 20px);
  border: 2px solid rgba(179, 136, 255, 0.4);
  display: grid;
  place-items: center;
  box-shadow: 0 18px 50px -16px rgba(0, 0, 0, 0.8);
  animation: float 4s ease-in-out infinite;
}
.placeholder__back { font-size: 3rem; color: rgba(201, 179, 255, 0.6); }
.placeholder__text { color: #9a90bd; text-align: center; max-width: 320px; }
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.loading-note { text-align: center; color: #9a90bd; padding: 3rem 0; }

.flip-enter-active { transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1); }
.flip-leave-active { transition: all 0.25s ease; }
.flip-enter-from { opacity: 0; transform: rotateY(90deg) scale(0.92); }
.flip-leave-to { opacity: 0; transform: scale(0.96); }

.footer {
  margin-top: 3.5rem;
  text-align: center;
  font-size: 0.82rem;
  color: #6f6790;
  line-height: 1.6;
}
.footer a { color: #a48fe0; }
.footer__disclaimer { margin-top: 0.3rem; opacity: 0.7; }

.stars {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-image:
    radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.8), transparent),
    radial-gradient(1px 1px at 70% 60%, rgba(255,255,255,0.6), transparent),
    radial-gradient(1.5px 1.5px at 40% 80%, rgba(201,179,255,0.7), transparent),
    radial-gradient(1px 1px at 85% 20%, rgba(255,255,255,0.5), transparent),
    radial-gradient(1.5px 1.5px at 55% 15%, rgba(255,212,121,0.6), transparent);
  background-repeat: no-repeat;
}
</style>

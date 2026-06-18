<script setup>
import { computed, onMounted, ref } from 'vue'
import { useTarot } from './composables/useTarot.js'
import { DECKS, DEFAULT_DECK_ID } from './data/decks.js'
import CardDisplay from './components/CardDisplay.vue'

const { loading, offline, ready, load, drawRandom } = useTarot()

const selectedDeckId = ref(DEFAULT_DECK_ID)
const current = ref(null) // карта
const reversed = ref(false) // положение
const drawing = ref(false)
const flipKey = ref(0)

const selectedDeck = computed(
  () => DECKS.find((d) => d.id === selectedDeckId.value) || DECKS[0]
)

onMounted(load)

function selectDeck(id) {
  selectedDeckId.value = id
}

function draw() {
  if (!ready.value || drawing.value) return
  drawing.value = true
  const prev = current.value?.name_short || null
  setTimeout(() => {
    const res = drawRandom(prev)
    current.value = res.card
    reversed.value = res.reversed
    flipKey.value++
    drawing.value = false
  }, 480)
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

    <main class="panel">
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
          :disabled="!ready || drawing"
          @click="draw"
        >
          <span v-if="loading">Тасуем колоду…</span>
          <span v-else-if="drawing">✨ Раскрываем…</span>
          <span v-else-if="!current">Вытянуть карту</span>
          <span v-else>Вытянуть ещё одну</span>
        </button>
        <p v-if="offline" class="offline-note">
          ⚠️ Онлайн-API недоступно — показываем встроенные трактовки.
        </p>
        <p v-else-if="current" class="hint-note">
          Колоду можно переключить — трактовка той же карты изменится.
        </p>
      </div>

      <section class="stage">
        <Transition name="flip" mode="out-in">
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
              Карта ждёт. Нажмите кнопку, чтобы открыть её.
            </p>
          </div>
        </Transition>
      </section>
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

.hero { text-align: center; margin-bottom: 2.5rem; }
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
.deck-chip:hover {
  border-color: var(--accent);
  background: rgba(255, 255, 255, 0.06);
}
.deck-chip.active {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 16%, transparent);
  box-shadow: 0 0 0 1px var(--accent), 0 8px 30px -12px var(--accent);
}
.deck-chip__icon { font-size: 1.8rem; line-height: 1; }
.deck-chip__name { display: block; font-weight: 600; color: #fff; }
.deck-chip__sub {
  display: block;
  font-size: 0.8rem;
  color: #9a90bd;
  margin-top: 0.15rem;
}

.actions { text-align: center; margin-bottom: 2.5rem; }
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
.offline-note { margin: 0.9rem 0 0; font-size: 0.85rem; color: #ffcf8b; }
.hint-note { margin: 0.9rem 0 0; font-size: 0.85rem; color: #8c83b0; }

.stage { min-height: 360px; }

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
.placeholder__text { color: #9a90bd; }
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

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

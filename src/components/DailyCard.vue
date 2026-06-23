<script setup>
import { computed, ref, watch } from 'vue'
import { DECKS, readCard } from '../data/decks.js'

const props = defineProps({
  cards: { type: Array, required: true }
})

const classicDeck = DECKS.find((d) => d.id === 'classic')
const imgError = ref(false)

// Детерминированная «карта дня»: одинаковая в течение суток.
const today = new Date()
const dateKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`

function hashStr(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

const card = computed(() => {
  if (!props.cards.length) return null
  const idx = hashStr(dateKey) % props.cards.length
  return props.cards[idx]
})

watch(card, () => { imgError.value = false })

// Карта дня всегда в прямом положении — как доброе послание на день.
const reading = computed(() => (card.value ? readCard(classicDeck, card.value, false) : null))

// Для «карты дня» показываем самые уместные сферы.
const FOCUS = ['advice', 'events', 'person', 'love']
const focusSpheres = computed(() => {
  if (!reading.value) return []
  const byKey = Object.fromEntries(
    classicDeck.spheres.map((s, i) => [s.key, reading.value.spheres[i]])
  )
  return FOCUS.map((k) => byKey[k]).filter(Boolean)
})

const prettyDate = computed(() =>
  today.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
)
const img = computed(() => (card.value ? card.value.images.rws : null))
</script>

<template>
  <div v-if="card" class="daily" :style="{ '--accent': classicDeck.accent }">
    <p class="daily__date">✦ {{ prettyDate }}</p>
    <h2 class="daily__heading">Ваша карта дня</h2>

    <div class="daily__body">
      <div class="daily__visual">
        <div class="daily__frame">
          <img
            v-if="!imgError"
            :src="img.url"
            :alt="reading.title"
            class="daily__img"
            @error="imgError = true"
          />
          <div v-else class="daily__fallback">🔮<span>{{ reading.title }}</span></div>
        </div>
      </div>

      <div class="daily__info">
        <h3 class="daily__name">{{ reading.title }}</h3>
        <p class="daily__sub">{{ card.name }}</p>

        <ul class="daily__keywords">
          <li v-for="kw in reading.keywords" :key="kw">{{ kw }}</li>
        </ul>

        <div class="daily__spheres">
          <div v-for="(s, i) in focusSpheres" :key="i" class="daily__sphere">
            <span class="daily__sphere-label">{{ s.icon }} {{ s.label }}</span>
            <p>{{ s.text }}</p>
          </div>
        </div>
      </div>
    </div>

    <p class="daily__note">
      Карта дня меняется раз в сутки и одинакова для всех — это общий настрой,
      а не персональное предсказание.
    </p>
  </div>
</template>

<style scoped>
.daily {
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  padding: 1.8rem;
}
.daily__date {
  margin: 0;
  text-align: center;
  color: var(--accent);
  letter-spacing: 0.1em;
  font-size: 0.85rem;
  text-transform: uppercase;
}
.daily__heading {
  margin: 0.3rem 0 1.6rem;
  text-align: center;
  font-family: 'Georgia', serif;
  font-size: clamp(1.5rem, 4vw, 2.1rem);
  color: #fff;
}
.daily__body {
  display: grid;
  grid-template-columns: minmax(180px, 240px) 1fr;
  gap: 2rem;
  align-items: start;
}
.daily__frame {
  width: 100%;
  aspect-ratio: 600 / 1024;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 0 0 2px var(--accent), 0 16px 44px -14px rgba(0, 0, 0, 0.8),
    0 0 50px -22px var(--accent);
}
.daily__img { width: 100%; height: 100%; object-fit: cover; display: block; }
.daily__fallback {
  width: 100%; height: 100%;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 0.5rem; font-size: 2.5rem; color: #cbb6ff;
  background: radial-gradient(circle at 50% 30%, #2a2150, #140f2a);
}
.daily__fallback span { font-size: 1.1rem; color: #fff; }

.daily__name {
  margin: 0;
  font-family: 'Georgia', serif;
  font-size: clamp(1.6rem, 3.5vw, 2.2rem);
  color: #fff;
}
.daily__sub { margin: 0.2rem 0 1rem; color: #9a90bd; font-style: italic; }
.daily__keywords {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  padding: 0;
  margin: 0 0 1.4rem;
}
.daily__keywords li {
  font-size: 0.82rem;
  padding: 0.3rem 0.7rem;
  border-radius: 8px;
  background: rgba(255, 212, 121, 0.12);
  border: 1px solid rgba(255, 212, 121, 0.3);
  color: #f4d58c;
}
.daily__spheres { display: grid; gap: 0.8rem; }
.daily__sphere {
  background: rgba(255, 255, 255, 0.035);
  border-left: 3px solid var(--accent);
  border-radius: 10px;
  padding: 0.75rem 0.95rem;
}
.daily__sphere-label {
  display: block;
  font-size: 0.78rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 0.3rem;
}
.daily__sphere p { margin: 0; line-height: 1.55; color: #ded7ef; }
.daily__note {
  margin: 1.6rem 0 0;
  text-align: center;
  font-size: 0.8rem;
  color: #6f6790;
  line-height: 1.5;
}

@media (max-width: 680px) {
  .daily__body { grid-template-columns: 1fr; gap: 1.4rem; }
  .daily__visual { max-width: 240px; margin: 0 auto; }
}
</style>

<script setup>
import { computed, ref, watch } from 'vue'
import { readCard } from '../data/decks.js'

const props = defineProps({
  card: { type: Object, required: true },
  deck: { type: Object, required: true },
  reversed: { type: Boolean, default: false }
})

const imgError = ref(false)
watch(
  () => [props.card?.name_short, props.deck?.id],
  () => {
    imgError.value = false
  }
)

const reading = computed(() => readCard(props.deck, props.card, props.reversed))
const img = computed(() => props.card.images[props.deck.image])

const arcana = computed(() =>
  props.card.type === 'major' ? 'Старший Аркан' : suitLabel(props.card.suit)
)
function suitLabel(suit) {
  return {
    wands: 'Жезлы · Огонь',
    cups: 'Кубки · Вода',
    swords: 'Мечи · Воздух',
    pentacles: 'Пентакли · Земля'
  }[suit] || 'Младший Аркан'
}
</script>

<template>
  <article class="card-display" :style="{ '--accent': deck.accent }">
    <div class="card-visual">
      <div class="card-frame" :class="{ reversed }">
        <img
          v-if="!imgError"
          :src="img.url"
          :alt="reading.title"
          class="card-img"
          loading="eager"
          @error="imgError = true"
        />
        <div v-else class="card-fallback">
          <span class="card-fallback__symbol">{{ deck.icon }}</span>
          <span class="card-fallback__name">{{ reading.title }}</span>
          <span class="card-fallback__hint">изображение недоступно</span>
        </div>
      </div>
      <a
        v-if="!imgError"
        class="card-source"
        :href="img.source"
        target="_blank"
        rel="noopener"
        title="Источник изображения на Wikimedia Commons"
      >Wikimedia · public domain</a>
    </div>

    <div class="card-info">
      <div class="card-tags">
        <span class="tag tag--arcana">{{ arcana }}</span>
        <span class="tag" :class="reversed ? 'tag--rev' : 'tag--up'">
          {{ reversed ? '↧ Перевёрнутая' : '↥ Прямая' }}
        </span>
      </div>

      <h2 class="card-title">{{ reading.title }}</h2>
      <p class="card-subtitle">{{ card.name }}</p>

      <ul v-if="reading.keywords.length" class="keywords">
        <li v-for="kw in reading.keywords" :key="kw" class="keyword">{{ kw }}</li>
      </ul>

      <div class="spheres">
        <div v-for="(s, i) in reading.spheres" :key="i" class="sphere">
          <h3 class="sphere__label">
            <span class="sphere__icon">{{ s.icon }}</span>{{ s.label }}
          </h3>
          <p class="sphere__text">{{ s.text }}</p>
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
.card-display {
  display: grid;
  grid-template-columns: minmax(220px, 320px) 1fr;
  gap: 2.5rem;
  align-items: start;
}

.card-visual {
  position: sticky;
  top: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
}
.card-frame {
  position: relative;
  width: 100%;
  aspect-ratio: 600 / 1024;
  border-radius: 16px;
  overflow: hidden;
  background: #1a1430;
  box-shadow:
    0 0 0 2px var(--accent),
    0 18px 50px -12px rgba(0, 0, 0, 0.8),
    0 0 60px -20px var(--accent);
  transition: transform 0.6s ease;
}
.card-frame.reversed { transform: rotate(180deg); }
.card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.card-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  text-align: center;
  background: radial-gradient(circle at 50% 30%, #2a2150, #140f2a);
}
.card-fallback__symbol { font-size: 3rem; }
.card-fallback__name { font-size: 1.2rem; font-weight: 600; color: #fff; }
.card-fallback__hint { font-size: 0.8rem; color: #8c83b0; }
.card-source {
  font-size: 0.72rem;
  color: #7a7298;
  text-decoration: none;
}
.card-source:hover { color: var(--accent); }

.card-info { min-width: 0; }
.card-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.8rem;
}
.tag {
  font-size: 0.74rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  border: 1px solid transparent;
}
.tag--arcana {
  background: rgba(255, 255, 255, 0.06);
  color: #cfc7e8;
  border-color: rgba(255, 255, 255, 0.14);
}
.tag--up {
  background: rgba(120, 220, 160, 0.12);
  color: #93e6b8;
  border-color: rgba(120, 220, 160, 0.3);
}
.tag--rev {
  background: rgba(255, 110, 156, 0.14);
  color: #ff9cbb;
  border-color: rgba(255, 110, 156, 0.35);
}

.card-title {
  font-size: clamp(1.8rem, 4vw, 2.6rem);
  line-height: 1.05;
  margin: 0;
  font-family: 'Georgia', 'Times New Roman', serif;
  color: #fff;
}
.card-subtitle {
  margin: 0.3rem 0 1.2rem;
  color: #9a90bd;
  font-style: italic;
}

.keywords {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0;
  margin: 0 0 1.6rem;
}
.keyword {
  font-size: 0.85rem;
  padding: 0.35rem 0.8rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #ddd4f5;
}

.spheres {
  display: grid;
  gap: 0.9rem;
}
.sphere {
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-left: 3px solid var(--accent);
  border-radius: 10px;
  padding: 0.85rem 1rem;
}
.sphere__label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.35rem;
  font-size: 0.82rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--accent);
}
.sphere__icon { font-size: 1rem; }
.sphere__text {
  margin: 0;
  line-height: 1.6;
  color: #ded7ef;
  font-size: 1rem;
}

@media (max-width: 720px) {
  .card-display { grid-template-columns: 1fr; gap: 1.6rem; }
  .card-visual { position: static; max-width: 280px; margin: 0 auto; }
}
</style>

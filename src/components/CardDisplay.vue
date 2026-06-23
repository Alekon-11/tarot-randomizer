<script setup>
import { computed, ref, watch } from 'vue'
import { readCard } from '../data/decks.js'
import { shareCard } from '../utils/shareCard.js'

const props = defineProps({
  card: { type: Object, required: true },
  deck: { type: Object, required: true },
  reversed: { type: Boolean, default: false }
})

const imgError = ref(false)
const shareState = ref('') // '', 'busy', 'ok'

watch(
  () => [props.card?.name_short, props.deck?.id],
  () => { imgError.value = false }
)

const reading = computed(() => readCard(props.deck, props.card, props.reversed))
const img = computed(() => props.card.images[props.deck.image])

const KW_PALETTE = [
  { bg: 'rgba(179, 136, 255, 0.14)', fg: '#cbb6ff', bd: 'rgba(179, 136, 255, 0.34)' },
  { bg: 'rgba(255, 212, 121, 0.13)', fg: '#f4d58c', bd: 'rgba(255, 212, 121, 0.32)' },
  { bg: 'rgba(255, 110, 156, 0.13)', fg: '#ff9cbb', bd: 'rgba(255, 110, 156, 0.32)' },
  { bg: 'rgba(120, 220, 180, 0.12)', fg: '#9fe6c4', bd: 'rgba(120, 220, 180, 0.32)' },
  { bg: 'rgba(125, 196, 255, 0.12)', fg: '#a8d4ff', bd: 'rgba(125, 196, 255, 0.32)' }
]
function kwStyle(i) {
  const c = KW_PALETTE[i % KW_PALETTE.length]
  return { background: c.bg, color: c.fg, borderColor: c.bd }
}

const arcana = computed(() =>
  props.card.type === 'major' ? 'Старший Аркан' : suitLabel(props.card.suit)
)
function suitLabel(suit) {
  return {
    wands: 'Жезлы · Огонь', cups: 'Кубки · Вода',
    swords: 'Мечи · Воздух', pentacles: 'Пентакли · Земля'
  }[suit] || 'Младший Аркан'
}

async function onShare() {
  if (shareState.value === 'busy') return
  shareState.value = 'busy'
  try {
    const first = reading.value.spheres[0] || {}
    await shareCard({
      imageUrl: img.value.url,
      title: reading.value.title,
      subtitle: props.card.name,
      keywords: reading.value.keywords,
      sphereLabel: first.label,
      sphereText: first.text,
      reversed: props.reversed,
      deckName: props.deck.name
    })
    shareState.value = 'ok'
    setTimeout(() => (shareState.value = ''), 2200)
  } catch {
    shareState.value = ''
  }
}
</script>

<template>
  <article class="card-display" :style="{ '--accent': deck.accent }">
    <div class="card-visual">
      <div class="card3d">
        <div class="card3d__inner">
          <div class="card3d__face card3d__back deck-back">
            <span class="card3d__symbol">✦</span>
          </div>
          <div class="card3d__face card3d__front">
            <img
              v-if="!imgError"
              :src="img.url"
              :alt="reading.title"
              class="card-img"
              :class="{ reversed }"
              loading="eager"
              @error="imgError = true"
            />
            <div v-else class="card-fallback" :class="{ reversed }">
              <span class="card-fallback__symbol">{{ deck.icon }}</span>
              <span class="card-fallback__name">{{ reading.title }}</span>
              <span class="card-fallback__hint">изображение недоступно</span>
            </div>
          </div>
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

      <button class="share-btn" type="button" :disabled="shareState === 'busy'" @click="onShare">
        <span v-if="shareState === 'ok'">✓ Готово</span>
        <span v-else-if="shareState === 'busy'">Готовим…</span>
        <span v-else>📤 Поделиться картой</span>
      </button>

      <ul v-if="reading.keywords.length" class="keywords">
        <li v-for="(kw, i) in reading.keywords" :key="kw" class="keyword" :style="kwStyle(i)">{{ kw }}</li>
      </ul>

      <div class="spheres">
        <div v-for="(s, i) in reading.spheres" :key="i" class="sphere">
          <h3 class="sphere__label"><span class="sphere__icon">{{ s.icon }}</span>{{ s.label }}</h3>
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

/* 3D-переворот */
.card3d {
  width: 100%;
  aspect-ratio: 600 / 1024;
  perspective: 1500px;
}
.card3d__inner {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  animation: cardReveal 0.78s cubic-bezier(0.2, 0.75, 0.2, 1) both;
}
@keyframes cardReveal {
  from { transform: rotateY(180deg); }
  to { transform: rotateY(0deg); }
}
.card3d__face {
  position: absolute;
  inset: 0;
  border-radius: 16px;
  overflow: hidden;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
.card3d__front {
  background: #1a1430;
  box-shadow: 0 0 0 2px var(--accent), 0 18px 50px -12px rgba(0, 0, 0, 0.8), 0 0 60px -20px var(--accent);
}
.card3d__back {
  transform: rotateY(180deg);
  border: 2px solid rgba(179, 136, 255, 0.5);
  display: grid;
  place-items: center;
}
.card3d__symbol { font-size: 3rem; color: rgba(201, 179, 255, 0.6); }

.card-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.card-img.reversed { transform: rotate(180deg); }
.card-fallback {
  width: 100%; height: 100%;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 0.5rem; padding: 1rem; text-align: center;
  background: radial-gradient(circle at 50% 30%, #2a2150, #140f2a);
}
.card-fallback.reversed { transform: rotate(180deg); }
.card-fallback__symbol { font-size: 3rem; }
.card-fallback__name { font-size: 1.2rem; font-weight: 600; color: #fff; }
.card-fallback__hint { font-size: 0.8rem; color: #8c83b0; }
.card-source { font-size: 0.72rem; color: #7a7298; text-decoration: none; }
.card-source:hover { color: var(--accent); }

.card-info { min-width: 0; }
.card-tags { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.8rem; }
.tag {
  font-size: 0.74rem; letter-spacing: 0.05em; text-transform: uppercase;
  padding: 0.3rem 0.7rem; border-radius: 999px; border: 1px solid transparent;
}
.tag--arcana { background: rgba(255, 255, 255, 0.06); color: #cfc7e8; border-color: rgba(255, 255, 255, 0.14); }
.tag--up { background: rgba(120, 220, 160, 0.12); color: #93e6b8; border-color: rgba(120, 220, 160, 0.3); }
.tag--rev { background: rgba(255, 110, 156, 0.14); color: #ff9cbb; border-color: rgba(255, 110, 156, 0.35); }

.card-title {
  font-size: clamp(1.8rem, 4vw, 2.6rem); line-height: 1.05; margin: 0;
  font-family: 'Georgia', 'Times New Roman', serif; color: #fff;
}
.card-subtitle { margin: 0.3rem 0 1rem; color: #9a90bd; font-style: italic; }

.share-btn {
  margin-bottom: 1.4rem;
  font-size: 0.9rem;
  color: #d8cff2;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(179, 136, 255, 0.35);
  border-radius: 999px;
  padding: 0.55rem 1.2rem;
  cursor: pointer;
  transition: all 0.2s ease;
}
.share-btn:hover:not(:disabled) { background: rgba(179, 136, 255, 0.15); border-color: var(--accent-1); }
.share-btn:disabled { opacity: 0.6; cursor: progress; }

.keywords { list-style: none; display: flex; flex-wrap: wrap; gap: 0.5rem; padding: 0; margin: 0 0 1.6rem; }
.keyword {
  font-size: 0.85rem; padding: 0.35rem 0.8rem; border-radius: 8px;
  background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.08); color: #ddd4f5;
}

.spheres { display: grid; gap: 0.9rem; }
.sphere {
  background: rgba(255, 255, 255, 0.035); border: 1px solid rgba(255, 255, 255, 0.07);
  border-left: 3px solid var(--accent); border-radius: 10px; padding: 0.85rem 1rem;
}
.sphere__label {
  display: flex; align-items: center; gap: 0.5rem; margin: 0 0 0.35rem;
  font-size: 0.82rem; letter-spacing: 0.04em; text-transform: uppercase; color: var(--accent);
}
.sphere__icon { font-size: 1rem; }
.sphere__text { margin: 0; line-height: 1.6; color: #ded7ef; font-size: 1rem; }

@media (max-width: 720px) {
  .card-display { grid-template-columns: 1fr; gap: 1.6rem; }
  .card-visual { position: static; max-width: 280px; margin: 0 auto; }
}
</style>

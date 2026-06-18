<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  card: { type: Object, required: true },
  deck: { type: Object, required: true }
})

const imgError = ref(false)

// Сброс ошибки картинки при смене карты.
watch(
  () => props.card?.name_short,
  () => {
    imgError.value = false
  }
)

const reading = computed(() => props.deck.build(props.card))

const arcana = computed(() =>
  props.card.type === 'major' ? 'Старший Аркан' : suitLabel(props.card.suit)
)

function suitLabel(suit) {
  return (
    {
      wands: 'Жезлы · Огонь',
      cups: 'Кубки · Вода',
      swords: 'Мечи · Воздух',
      pentacles: 'Пентакли · Земля'
    }[suit] || 'Младший Аркан'
  )
}
</script>

<template>
  <article class="card-display">
    <div class="card-visual" :style="{ '--accent': deck.accent }">
      <div class="card-frame" :class="{ reversed: deck.reversed }">
        <img
          v-if="!imgError"
          :src="card.image"
          :alt="card.name"
          class="card-img"
          loading="eager"
          @error="imgError = true"
        />
        <div v-else class="card-fallback">
          <span class="card-fallback__symbol">🔮</span>
          <span class="card-fallback__name">{{ reading.title }}</span>
          <span class="card-fallback__hint">изображение недоступно</span>
        </div>
      </div>
      <a
        v-if="!imgError"
        class="card-source"
        :href="card.source"
        target="_blank"
        rel="noopener"
        title="Источник изображения на Wikimedia Commons"
      >Wikimedia · public domain</a>
    </div>

    <div class="card-info">
      <div class="card-tags">
        <span class="tag tag--arcana">{{ arcana }}</span>
        <span v-if="deck.reversed" class="tag tag--rev">перевёрнутая</span>
      </div>

      <h2 class="card-title">{{ reading.title }}</h2>
      <p class="card-subtitle">{{ card.name }}</p>

      <ul v-if="reading.keywords.length" class="keywords">
        <li v-for="kw in reading.keywords" :key="kw" class="keyword">{{ kw }}</li>
      </ul>

      <div class="blocks">
        <div v-for="(b, i) in reading.blocks" :key="i" class="block">
          <h3 class="block__label">{{ b.label }}</h3>
          <p class="block__text">{{ b.text }}</p>
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
  transition: transform 0.5s ease;
}
.card-frame.reversed {
  transform: rotate(180deg);
}

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
.card-fallback__symbol {
  font-size: 3rem;
}
.card-fallback__name {
  font-size: 1.2rem;
  font-weight: 600;
  color: #fff;
}
.card-fallback__hint {
  font-size: 0.8rem;
  color: #8c83b0;
}

.card-source {
  font-size: 0.72rem;
  color: #7a7298;
  text-decoration: none;
  letter-spacing: 0.02em;
}
.card-source:hover {
  color: var(--accent);
}

.card-info {
  min-width: 0;
}

.card-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.8rem;
}
.tag {
  font-size: 0.74rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
}
.tag--arcana {
  background: rgba(179, 136, 255, 0.14);
  color: #c9b3ff;
  border: 1px solid rgba(179, 136, 255, 0.3);
}
.tag--rev {
  background: rgba(255, 110, 156, 0.14);
  color: #ff9cbb;
  border: 1px solid rgba(255, 110, 156, 0.35);
}

.card-title {
  font-size: clamp(1.8rem, 4vw, 2.6rem);
  line-height: 1.05;
  margin: 0;
  font-family: 'Georgia', 'Times New Roman', serif;
  color: #fff;
}
.card-subtitle {
  margin: 0.3rem 0 1.3rem;
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

.blocks {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}
.block__label {
  margin: 0 0 0.3rem;
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent, #b388ff);
}
.block__text {
  margin: 0;
  line-height: 1.65;
  color: #d7d0ea;
  font-size: 1.02rem;
}

@media (max-width: 720px) {
  .card-display {
    grid-template-columns: 1fr;
    gap: 1.6rem;
  }
  .card-visual {
    position: static;
    max-width: 280px;
    margin: 0 auto;
  }
}
</style>

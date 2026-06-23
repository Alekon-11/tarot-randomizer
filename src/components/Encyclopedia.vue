<script setup>
import { computed, ref } from 'vue'
import { useTarot } from '../composables/useTarot.js'
import { DECKS } from '../data/decks.js'
import CardDisplay from './CardDisplay.vue'

const { cards } = useTarot()

const FILTERS = [
  { key: 'all', label: 'Все' },
  { key: 'major', label: 'Старшие' },
  { key: 'wands', label: 'Жезлы' },
  { key: 'cups', label: 'Кубки' },
  { key: 'swords', label: 'Мечи' },
  { key: 'pentacles', label: 'Пентакли' }
]

const filter = ref('all')
const query = ref('')
const selected = ref(null)
const detailDeckId = ref('classic')
const detailReversed = ref(false)

const detailDeck = computed(() => DECKS.find((d) => d.id === detailDeckId.value))

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return cards.value.filter((c) => {
    const byType =
      filter.value === 'all' ||
      (filter.value === 'major' && c.type === 'major') ||
      c.suit === filter.value
    if (!byType) return false
    if (!q) return true
    const ru = (c.ru?.ru || '').toLowerCase()
    return ru.includes(q) || c.name.toLowerCase().includes(q)
  })
})

function open(card) {
  selected.value = card
  detailReversed.value = false
}
function close() {
  selected.value = null
}
</script>

<template>
  <div class="enc">
    <!-- Детальная карта -->
    <div v-if="selected" class="enc-detail">
      <div class="enc-detail__bar">
        <button class="enc-back" type="button" @click="close">← Ко всем картам</button>
        <div class="enc-detail__controls">
          <div class="seg">
            <button
              v-for="d in DECKS"
              :key="d.id"
              class="seg__btn"
              :class="{ active: detailDeckId === d.id }"
              type="button"
              @click="detailDeckId = d.id"
            >{{ d.icon }} {{ d.name }}</button>
          </div>
          <button class="flip-btn" type="button" @click="detailReversed = !detailReversed">
            {{ detailReversed ? '↧ Перевёрнутая' : '↥ Прямая' }}
          </button>
        </div>
      </div>
      <CardDisplay :card="selected" :deck="detailDeck" :reversed="detailReversed" />
    </div>

    <!-- Сетка -->
    <template v-else>
      <div class="enc-controls">
        <div class="enc-filters">
          <button
            v-for="f in FILTERS"
            :key="f.key"
            class="enc-filter"
            :class="{ active: filter === f.key }"
            type="button"
            @click="filter = f.key"
          >{{ f.label }}</button>
        </div>
        <input v-model="query" type="text" class="enc-search" placeholder="🔍 Поиск по названию…" />
      </div>

      <p class="enc-count">Найдено карт: {{ filtered.length }}</p>

      <div class="enc-grid">
        <button v-for="c in filtered" :key="c.name_short" class="enc-card" type="button" @click="open(c)">
          <div class="enc-card__frame">
            <img :src="c.images.rws.url" :alt="c.ru?.ru" class="enc-card__img" loading="lazy" />
          </div>
          <span class="enc-card__name">{{ c.ru?.ru || c.name }}</span>
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.enc-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.enc-filters { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.enc-filter {
  padding: 0.4rem 0.9rem; border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12); background: rgba(255, 255, 255, 0.03);
  color: #b6acd6; cursor: pointer; font-size: 0.88rem; transition: all 0.2s ease;
}
.enc-filter.active { color: #fff; border-color: #b388ff; background: rgba(179, 136, 255, 0.18); }
.enc-search {
  flex: 1; min-width: 200px; max-width: 280px;
  padding: 0.55rem 0.9rem; border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12); background: rgba(255, 255, 255, 0.04);
  color: #ece7f7; outline: none;
}
.enc-search:focus { border-color: #b388ff; }
.enc-count { color: #79719c; font-size: 0.85rem; margin: 0 0 1.2rem; }

.enc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 1rem;
}
.enc-card {
  background: none; border: none; padding: 0; cursor: pointer;
  display: flex; flex-direction: column; gap: 0.5rem; align-items: center;
}
.enc-card__frame {
  width: 100%; aspect-ratio: 600 / 1024; border-radius: 10px; overflow: hidden;
  background: #1a1430; border: 1px solid rgba(255, 255, 255, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.enc-card:hover .enc-card__frame {
  transform: translateY(-4px);
  box-shadow: 0 14px 30px -12px rgba(179, 136, 255, 0.7);
  border-color: rgba(179, 136, 255, 0.5);
}
.enc-card__img { width: 100%; height: 100%; object-fit: cover; display: block; }
.enc-card__name { font-size: 0.82rem; color: #c4bbe0; text-align: center; line-height: 1.2; }

.enc-detail__bar {
  display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; justify-content: space-between;
  margin-bottom: 1.5rem;
}
.enc-back {
  background: none; border: 1px solid rgba(255, 255, 255, 0.15); color: #c9b3ff;
  border-radius: 999px; padding: 0.5rem 1.1rem; cursor: pointer; transition: all 0.2s ease;
}
.enc-back:hover { border-color: #b388ff; background: rgba(179, 136, 255, 0.12); }
.enc-detail__controls { display: flex; flex-wrap: wrap; gap: 0.6rem; align-items: center; }
.seg { display: flex; gap: 0.3rem; }
.seg__btn {
  padding: 0.45rem 0.9rem; border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12); background: rgba(255, 255, 255, 0.03);
  color: #b6acd6; cursor: pointer; font-size: 0.85rem; transition: all 0.2s ease;
}
.seg__btn.active { color: #fff; border-color: #b388ff; background: rgba(179, 136, 255, 0.18); }
.flip-btn {
  padding: 0.45rem 0.9rem; border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12); background: rgba(255, 255, 255, 0.03);
  color: #d8cff2; cursor: pointer; font-size: 0.85rem; transition: all 0.2s ease;
}
.flip-btn:hover { border-color: #b388ff; }
</style>

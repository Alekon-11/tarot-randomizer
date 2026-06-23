<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { DECKS } from '../data/decks.js'
import CardDisplay from './CardDisplay.vue'

const props = defineProps({
  card: { type: Object, required: true },
  deckId: { type: String, default: 'classic' },
  reversed: { type: Boolean, default: false },
  positionLabel: { type: String, default: '' }
})
const emit = defineEmits(['close'])

const localDeckId = ref(props.deckId)
const localReversed = ref(props.reversed)
const deck = ref(DECKS.find((d) => d.id === localDeckId.value) || DECKS[0])

watch(localDeckId, (id) => {
  deck.value = DECKS.find((d) => d.id === id) || DECKS[0]
})

function onKey(e) {
  if (e.key === 'Escape') emit('close')
}
onMounted(() => {
  document.addEventListener('keydown', onKey)
  document.body.style.overflow = 'hidden'
})
onUnmounted(() => {
  document.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="modal" @click.self="emit('close')">
    <div class="modal__box">
      <div class="modal__bar">
        <span v-if="positionLabel" class="modal__pos">{{ positionLabel }}</span>
        <div class="modal__controls">
          <div class="seg">
            <button
              v-for="d in DECKS"
              :key="d.id"
              class="seg__btn"
              :class="{ active: localDeckId === d.id }"
              type="button"
              @click="localDeckId = d.id"
            >{{ d.icon }} {{ d.name }}</button>
          </div>
          <button class="flip-btn" type="button" @click="localReversed = !localReversed">
            {{ localReversed ? '↧ Перевёрнутая' : '↥ Прямая' }}
          </button>
        </div>
        <button class="modal__close" type="button" aria-label="Закрыть" @click="emit('close')">✕</button>
      </div>
      <CardDisplay :card="card" :deck="deck" :reversed="localReversed" />
    </div>
  </div>
</template>

<style scoped>
.modal {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(8, 5, 18, 0.78);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 2rem 1rem;
  overflow-y: auto;
}
.modal__box {
  width: 100%;
  max-width: 920px;
  background: rgba(20, 14, 38, 0.96);
  border: 1px solid rgba(179, 136, 255, 0.25);
  border-radius: 18px;
  padding: 1.4rem 1.6rem 2rem;
  box-shadow: 0 30px 80px -20px rgba(0, 0, 0, 0.9);
  animation: modalIn 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}
@keyframes modalIn {
  from { opacity: 0; transform: translateY(20px) scale(0.98); }
  to { opacity: 1; transform: none; }
}
.modal__bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 1.4rem;
}
.modal__pos {
  font-size: 0.78rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #ffd479;
}
.modal__controls { display: flex; flex-wrap: wrap; gap: 0.6rem; align-items: center; margin-left: auto; }
.seg { display: flex; gap: 0.3rem; }
.seg__btn {
  padding: 0.45rem 0.9rem; border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12); background: rgba(255, 255, 255, 0.03);
  color: #b6acd6; cursor: pointer; font-size: 0.85rem; transition: all 0.2s ease;
}
.seg__btn.active { color: #fff; border-color: var(--accent-1); background: rgba(179, 136, 255, 0.18); }
.flip-btn {
  padding: 0.45rem 0.9rem; border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12); background: rgba(255, 255, 255, 0.03);
  color: #d8cff2; cursor: pointer; font-size: 0.85rem; transition: all 0.2s ease;
}
.flip-btn:hover { border-color: var(--accent-1); }
.modal__close {
  width: 38px; height: 38px; border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.15); background: rgba(255, 255, 255, 0.04);
  color: #cfc7e8; cursor: pointer; font-size: 1rem; transition: all 0.2s ease;
}
.modal__close:hover { border-color: #ff6e9c; color: #ff9cbb; }
</style>

<script setup>
import { computed, ref } from 'vue'
import { RU } from '../data/interpretationsRu.js'
import { CLASSIC } from '../data/classicRu.js'
import { deckImages } from '../data/cardImages.js'

const birth = ref('')

// Свести число к диапазону 1..22 (метод Матрицы судьбы — вычитание 22).
function reduce(n) {
  while (n > 22) n -= 22
  return n
}
function sumDigits(n) {
  return String(n)
    .split('')
    .reduce((s, d) => s + Number(d), 0)
}
// Номер аркана (1..22) → ключ карты. 22 — это Шут (ar00).
function arcShort(n) {
  return n === 22 ? 'ar00' : 'ar' + String(n).padStart(2, '0')
}

const POINTS = [
  { id: 'E', title: 'Главное предназначение', sub: 'Ядро личности и миссия', sphere: 'person' },
  { id: 'A', title: 'Портрет личности', sub: 'Как вы проявляете себя', sphere: 'person' },
  { id: 'B', title: 'Таланты и дары рода', sub: 'Ваши сильные стороны', sphere: 'advice' },
  { id: 'C', title: 'Эмоции и чувства', sub: 'Внутренний мир', sphere: 'love' },
  { id: 'D', title: 'Кармический урок', sub: 'Зона роста и проработки', sphere: 'events' },
  { id: 'LOVE', title: 'Линия любви', sub: 'Отношения и партнёрство', sphere: 'love' },
  { id: 'MONEY', title: 'Линия денег', sub: 'Финансы и реализация', sphere: 'money' },
  { id: 'ROD', title: 'Зеркало рода', sub: 'Что вы транслируете миру', sphere: 'person' }
]

const matrix = computed(() => {
  if (!birth.value) return null
  const [y, m, d] = birth.value.split('-').map(Number)
  if (!y || !m || !d) return null

  const A = reduce(d)
  const B = reduce(m)
  const C = reduce(sumDigits(y))
  const D = reduce(A + B + C)
  const E = reduce(A + B + C + D)
  const LOVE = reduce(C + D)
  const MONEY = reduce(D + A)
  const ROD = reduce(A + B)

  const nums = { A, B, C, D, E, LOVE, MONEY, ROD }

  const points = POINTS.map((p) => {
    const n = nums[p.id]
    const short = arcShort(n)
    return {
      ...p,
      arcana: n,
      name: RU[short]?.ru || short,
      keywords: RU[short]?.kw || [],
      text: CLASSIC[short]?.up?.[p.sphere] || '—'
    }
  })

  // данные для октаграммы (главные 4 + центр)
  const diagram = {
    A: { n: A, short: arcShort(A) },
    B: { n: B, short: arcShort(B) },
    C: { n: C, short: arcShort(C) },
    D: { n: D, short: arcShort(D) },
    E: { n: E, short: arcShort(E) }
  }
  return { nums, points, diagram, center: points[0] }
})

const centerImg = computed(() =>
  matrix.value ? deckImages({ type: 'major', value_int: matrix.value.diagram.E.n === 22 ? 0 : matrix.value.diagram.E.n }, 400).rws.url : null
)
</script>

<template>
  <div class="matrix">
    <p class="matrix__intro">
      Введите дату рождения — рассчитаем энергии вашей матрицы и привяжем их к старшим арканам Таро.
    </p>

    <div class="matrix__form">
      <input v-model="birth" type="date" class="matrix__date" min="1920-01-01" max="2099-12-31" />
    </div>

    <div v-if="matrix" class="matrix__result">
      <!-- Октаграмма -->
      <div class="octagram">
        <svg viewBox="0 0 320 320" class="octagram__svg" aria-hidden="true">
          <polygon points="160,28 292,160 160,292 28,160" class="oct-shape" />
          <line x1="160" y1="28" x2="160" y2="292" class="oct-line" />
          <line x1="28" y1="160" x2="292" y2="160" class="oct-line" />
          <g class="oct-node">
            <circle cx="160" cy="28" r="24" />
            <text x="160" y="28">{{ matrix.diagram.B.n }}</text>
          </g>
          <g class="oct-node">
            <circle cx="292" cy="160" r="24" />
            <text x="292" y="160">{{ matrix.diagram.C.n }}</text>
          </g>
          <g class="oct-node">
            <circle cx="160" cy="292" r="24" />
            <text x="160" y="292">{{ matrix.diagram.D.n }}</text>
          </g>
          <g class="oct-node">
            <circle cx="28" cy="160" r="24" />
            <text x="28" y="160">{{ matrix.diagram.A.n }}</text>
          </g>
          <g class="oct-node oct-node--center">
            <circle cx="160" cy="160" r="32" />
            <text x="160" y="160">{{ matrix.diagram.E.n }}</text>
          </g>
        </svg>
        <div class="octagram__center-card">
          <img v-if="centerImg" :src="centerImg" :alt="matrix.center.name" />
          <div class="octagram__center-meta">
            <span class="octagram__center-label">Центральный аркан</span>
            <strong>{{ matrix.center.arcana }} · {{ matrix.center.name }}</strong>
          </div>
        </div>
      </div>

      <!-- Точки -->
      <div class="points">
        <div v-for="p in matrix.points" :key="p.id" class="point">
          <div class="point__num">{{ p.arcana }}</div>
          <div class="point__body">
            <span class="point__title">{{ p.title }}</span>
            <span class="point__sub">{{ p.sub }} · {{ p.name }}</span>
            <ul class="point__kw">
              <li v-for="kw in p.keywords" :key="kw">{{ kw }}</li>
            </ul>
            <p class="point__text">{{ p.text }}</p>
          </div>
        </div>
      </div>

      <p class="matrix__note">
        Расчёт основан на классической методике «Матрицы судьбы» (сведение чисел к арканам 1–22).
        Это эзотерическая модель для саморефлексии, а не научный факт.
      </p>
    </div>

    <p v-else class="matrix__empty">Дата ещё не выбрана.</p>
  </div>
</template>

<style scoped>
.matrix__intro { text-align: center; color: #aaa0cc; max-width: 560px; margin: 0 auto 1.4rem; line-height: 1.6; }
.matrix__form { display: flex; justify-content: center; margin-bottom: 2rem; }
.matrix__date {
  padding: 0.7rem 1.1rem; border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.14); background: rgba(255, 255, 255, 0.05);
  color: #ece7f7; font-size: 1rem; outline: none; color-scheme: dark;
}
.matrix__date:focus { border-color: #b388ff; }
.matrix__empty { text-align: center; color: #79719c; }

.octagram {
  display: flex; flex-wrap: wrap; gap: 2rem; align-items: center; justify-content: center;
  margin-bottom: 2.2rem;
}
.octagram__svg { width: 300px; max-width: 78vw; height: auto; }
.oct-shape { fill: rgba(179, 136, 255, 0.06); stroke: rgba(179, 136, 255, 0.5); stroke-width: 1.5; }
.oct-line { stroke: rgba(255, 212, 121, 0.3); stroke-width: 1; }
.oct-node circle { fill: #1c1538; stroke: #d4af37; stroke-width: 1.5; }
.oct-node text { fill: #ffd479; font-size: 18px; font-weight: 700; text-anchor: middle; dominant-baseline: central; }
.oct-node--center circle { fill: #2a1f50; stroke: #b388ff; stroke-width: 2.5; }
.oct-node--center text { fill: #fff; font-size: 24px; }

.octagram__center-card { display: flex; align-items: center; gap: 1rem; }
.octagram__center-card img {
  width: 92px; border-radius: 10px; box-shadow: 0 0 0 1.5px #b388ff, 0 12px 30px -14px rgba(0,0,0,0.8);
}
.octagram__center-label {
  display: block; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; color: #b388ff;
}
.octagram__center-meta strong { color: #fff; font-size: 1.1rem; font-family: 'Georgia', serif; }

.points { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 0.9rem; }
.point {
  display: flex; gap: 0.9rem;
  background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 12px; padding: 0.9rem 1rem;
}
.point__num {
  flex-shrink: 0; width: 42px; height: 42px; border-radius: 50%;
  display: grid; place-items: center; font-weight: 700; color: #ffd479;
  background: rgba(212, 175, 55, 0.12); border: 1px solid rgba(212, 175, 55, 0.4);
}
.point__title { display: block; color: #fff; font-weight: 600; }
.point__sub { display: block; font-size: 0.8rem; color: #9a90bd; margin-bottom: 0.4rem; }
.point__kw { list-style: none; display: flex; flex-wrap: wrap; gap: 0.3rem; padding: 0; margin: 0 0 0.5rem; }
.point__kw li {
  font-size: 0.72rem; padding: 0.18rem 0.5rem; border-radius: 6px;
  background: rgba(179, 136, 255, 0.13); color: #cbb6ff; border: 1px solid rgba(179, 136, 255, 0.28);
}
.point__text { margin: 0; font-size: 0.92rem; line-height: 1.5; color: #d7d0ea; }

.matrix__note {
  margin: 2rem auto 0; max-width: 560px; text-align: center;
  font-size: 0.8rem; color: #6f6790; line-height: 1.5;
}
</style>

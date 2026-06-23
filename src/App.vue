<script setup>
import { onMounted, ref } from 'vue'
import { useTarot } from './composables/useTarot.js'
import { useSettings } from './composables/useSettings.js'
import ReadingView from './components/ReadingView.vue'
import DailyCard from './components/DailyCard.vue'
import Encyclopedia from './components/Encyclopedia.vue'
import MatrixView from './components/MatrixView.vue'
import SettingsMenu from './components/SettingsBar.vue'

const { loading, load } = useTarot()
const { apply } = useSettings()

const TABS = [
  { id: 'draw', label: '🃏 Расклад' },
  { id: 'daily', label: '☀️ Карта дня' },
  { id: 'enc', label: '📖 Энциклопедия' },
  { id: 'matrix', label: '🔢 Матрица судьбы' }
]
const activeView = ref('draw')

onMounted(() => {
  load()
  apply() // применить сохранённую тему/рубашку
})
</script>

<template>
  <div class="app">
    <div class="stars" aria-hidden="true"></div>

    <header class="hero">
      <div class="hero__badge">🔮 Таро</div>
      <h1 class="hero__title">Рандомайзер карт Таро</h1>
      <p class="hero__lead">
        Вытяните случайную карту, изучите все 78 арканов или рассчитайте матрицу судьбы.
        Карты могут выпадать прямыми и перевёрнутыми — трактовки даны по нескольким сферам.
      </p>
    </header>

    <SettingsMenu />

    <nav class="nav">
      <button
        v-for="t in TABS"
        :key="t.id"
        class="nav__tab"
        :class="{ active: activeView === t.id }"
        type="button"
        @click="activeView = t.id"
      >{{ t.label }}</button>
    </nav>

    <main class="panel">
      <div v-if="loading" class="loading-note">Тасуем колоду…</div>
      <template v-else>
        <ReadingView v-if="activeView === 'draw'" />
        <DailyCard v-else-if="activeView === 'daily'" />
        <Encyclopedia v-else-if="activeView === 'enc'" />
        <MatrixView v-else-if="activeView === 'matrix'" />
      </template>
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
  background: var(--grad);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.hero__lead { max-width: 620px; margin: 0 auto; color: #aaa0cc; line-height: 1.6; }

.nav {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
  position: relative;
  z-index: 1;
}
.nav__tab {
  padding: 0.6rem 1.3rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  color: #b6acd6;
  font-size: 0.92rem;
  cursor: pointer;
  transition: all 0.2s ease;
}
.nav__tab:hover { color: #fff; border-color: rgba(179, 136, 255, 0.4); }
.nav__tab.active {
  color: #1a1030;
  background: var(--grad);
  border-color: transparent;
  font-weight: 600;
}

.panel { position: relative; z-index: 1; }
.loading-note { text-align: center; color: #9a90bd; padding: 3rem 0; }

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

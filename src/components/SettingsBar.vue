<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useSettings } from '../composables/useSettings.js'

const { sound, theme, back, THEMES, BACKS } = useSettings()

const THEME_DOT = { mystic: '#b388ff', emerald: '#54d6a6', crimson: '#ff6e8e' }
const THEME_NAME = { mystic: 'Мистик', emerald: 'Изумруд', crimson: 'Багрянец' }
const BACK_NAME = { weave: 'Плетёная', dots: 'Звёздная', rays: 'Лучи' }

const open = ref(false)
function onKey(e) {
  if (e.key === 'Escape') open.value = false
}
onMounted(() => document.addEventListener('keydown', onKey))
onUnmounted(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="fab">
    <button
      class="fab__btn"
      :class="{ open }"
      type="button"
      aria-label="Настройки оформления и звука"
      title="Настройки"
      @click="open = !open"
    >⚙️</button>

    <div v-if="open" class="fab__backdrop" @click="open = false"></div>

    <div v-if="open" class="menu" role="dialog" aria-label="Настройки">
      <div class="menu__row">
        <span class="menu__label">Звук</span>
        <button
          class="toggle"
          :class="{ on: sound }"
          type="button"
          @click="sound = !sound"
        >
          <span class="toggle__knob"></span>
          <span class="toggle__txt">{{ sound ? 'вкл' : 'выкл' }}</span>
        </button>
      </div>
      <p class="menu__hint">Фоновая музыка и звук тасовки</p>

      <div class="menu__sep"></div>

      <div class="menu__group">
        <span class="menu__label">Тема</span>
        <div class="swatches">
          <button
            v-for="t in THEMES"
            :key="t"
            class="swatch swatch--theme"
            :class="{ active: theme === t }"
            :style="{ background: THEME_DOT[t] }"
            type="button"
            :title="THEME_NAME[t]"
            @click="theme = t"
          ></button>
        </div>
      </div>

      <div class="menu__group">
        <span class="menu__label">Рубашка</span>
        <div class="swatches">
          <button
            v-for="b in BACKS"
            :key="b"
            class="swatch swatch--back"
            :class="['back-' + b, { active: back === b }]"
            type="button"
            :title="BACK_NAME[b]"
            @click="back = b"
          ></button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fab {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 40;
}
.fab__btn {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(20, 14, 38, 0.85);
  backdrop-filter: blur(6px);
  cursor: pointer;
  font-size: 1.2rem;
  transition: transform 0.25s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 8px 24px -10px rgba(0, 0, 0, 0.8);
}
.fab__btn:hover { border-color: var(--accent-1); box-shadow: 0 0 18px -4px var(--accent-1); }
.fab__btn.open { transform: rotate(90deg); border-color: var(--accent-1); }

.fab__backdrop {
  position: fixed;
  inset: 0;
  z-index: -1;
}

.menu {
  position: absolute;
  top: 56px;
  right: 0;
  width: 230px;
  background: rgba(20, 14, 38, 0.97);
  border: 1px solid rgba(179, 136, 255, 0.25);
  border-radius: 14px;
  padding: 1rem 1.1rem;
  box-shadow: 0 20px 50px -16px rgba(0, 0, 0, 0.9);
  animation: menuIn 0.2s ease;
}
@keyframes menuIn {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: none; }
}
.menu__row { display: flex; align-items: center; justify-content: space-between; }
.menu__group { margin-top: 0.9rem; }
.menu__label { font-size: 0.82rem; letter-spacing: 0.04em; text-transform: uppercase; color: #cbb6ff; }
.menu__hint { margin: 0.3rem 0 0; font-size: 0.74rem; color: #79719c; }
.menu__sep { height: 1px; background: rgba(255, 255, 255, 0.08); margin: 0.9rem 0 0.2rem; }

.toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.04);
  border-radius: 999px;
  padding: 0.2rem 0.6rem 0.2rem 0.2rem;
  cursor: pointer;
  color: #b6acd6;
  font-size: 0.78rem;
}
.toggle__knob {
  width: 16px; height: 16px; border-radius: 50%;
  background: #79719c; transition: transform 0.2s ease, background 0.2s ease;
}
.toggle.on { border-color: var(--accent-1); color: #fff; }
.toggle.on .toggle__knob { background: var(--accent-1); transform: translateX(2px); }

.swatches { display: flex; gap: 0.45rem; margin-top: 0.45rem; }
.swatch {
  width: 26px; height: 26px; border-radius: 50%;
  border: 2px solid transparent; cursor: pointer; padding: 0; transition: transform 0.15s ease;
}
.swatch:hover { transform: scale(1.12); }
.swatch.active { border-color: #fff; box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.4); }
.swatch--back { border-radius: 7px; }
.back-weave { background: repeating-linear-gradient(45deg, #241b45 0 5px, #2c2152 5px 10px); }
.back-dots { background: radial-gradient(circle at 30% 30%, #c9b3ff 2px, transparent 3px) 0 0 / 11px 11px, #241b45; }
.back-rays { background: repeating-conic-gradient(from 0deg at 50% 50%, #2a1f50 0deg 18deg, #34276a 18deg 36deg); }
</style>

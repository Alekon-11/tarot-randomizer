<script setup>
import { useSettings } from '../composables/useSettings.js'

const { sound, theme, back, THEMES, BACKS } = useSettings()

const THEME_DOT = { mystic: '#b388ff', emerald: '#54d6a6', crimson: '#ff6e8e' }
const THEME_NAME = { mystic: 'Мистик', emerald: 'Изумруд', crimson: 'Багрянец' }
const BACK_NAME = { weave: 'Плетёная', dots: 'Звёздная', rays: 'Лучи' }
</script>

<template>
  <div class="settings">
    <button
      class="settings__sound"
      :class="{ on: sound }"
      type="button"
      :title="sound ? 'Выключить звук' : 'Включить звук'"
      @click="sound = !sound"
    >{{ sound ? '🔊' : '🔇' }}</button>

    <div class="settings__group" title="Тема оформления">
      <button
        v-for="t in THEMES"
        :key="t"
        class="swatch swatch--theme"
        :class="{ active: theme === t }"
        :style="{ background: THEME_DOT[t] }"
        type="button"
        :aria-label="'Тема ' + THEME_NAME[t]"
        :title="THEME_NAME[t]"
        @click="theme = t"
      ></button>
    </div>

    <div class="settings__group" title="Рубашка карт">
      <button
        v-for="b in BACKS"
        :key="b"
        class="swatch swatch--back"
        :class="['back-' + b, { active: back === b }]"
        type="button"
        :aria-label="'Рубашка ' + BACK_NAME[b]"
        :title="BACK_NAME[b]"
        @click="back = b"
      ></button>
    </div>
  </div>
</template>

<style scoped>
.settings {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  flex-wrap: wrap;
  justify-content: center;
}
.settings__sound {
  width: 38px; height: 38px; border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.14); background: rgba(255, 255, 255, 0.04);
  cursor: pointer; font-size: 1rem; transition: all 0.2s ease;
}
.settings__sound.on { border-color: var(--accent-1); box-shadow: 0 0 14px -4px var(--accent-1); }
.settings__group { display: flex; gap: 0.35rem; padding: 0.3rem; border-radius: 999px; background: rgba(255, 255, 255, 0.04); }
.swatch {
  width: 22px; height: 22px; border-radius: 50%;
  border: 2px solid transparent; cursor: pointer; padding: 0; transition: transform 0.15s ease;
}
.swatch:hover { transform: scale(1.12); }
.swatch.active { border-color: #fff; box-shadow: 0 0 0 1px rgba(0,0,0,0.4); }
.swatch--back { border-radius: 6px; }
.back-weave { background: repeating-linear-gradient(45deg, #241b45 0 5px, #2c2152 5px 10px); }
.back-dots { background: radial-gradient(circle at 30% 30%, #c9b3ff 2px, transparent 3px) 0 0 / 11px 11px, #241b45; }
.back-rays { background: repeating-conic-gradient(from 0deg at 50% 50%, #2a1f50 0deg 18deg, #34276a 18deg 36deg); }
</style>

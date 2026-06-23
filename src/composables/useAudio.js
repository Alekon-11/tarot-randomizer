// Звук: фоновая мелодия (готовый трек) + звук перетасовки (синтез Web Audio).
import ambientUrl from '../assets/ambient.mp3'

// ---- Фоновая музыка ----
let music = null
let fadeTimer = null
const TARGET_VOLUME = 0.22 // приглушённо

function ensureMusic() {
  if (!music) {
    music = new Audio(ambientUrl)
    music.loop = true
    music.preload = 'none'
    music.volume = 0
  }
  return music
}

function fadeTo(target, ms = 1200) {
  const m = ensureMusic()
  if (fadeTimer) clearInterval(fadeTimer)
  const steps = 24
  const step = (target - m.volume) / steps
  let i = 0
  fadeTimer = setInterval(() => {
    i++
    m.volume = Math.min(1, Math.max(0, m.volume + step))
    if (i >= steps) {
      clearInterval(fadeTimer)
      fadeTimer = null
      m.volume = target
      if (target === 0) m.pause()
    }
  }, ms / steps)
}

function startMusic() {
  const m = ensureMusic()
  const p = m.play()
  if (p && p.catch) p.catch(() => {}) // autoplay может быть заблокирован до жеста
  fadeTo(TARGET_VOLUME)
}

function stopMusic() {
  if (!music) return
  fadeTo(0)
}

// ---- Звук перетасовки ----
let ctx = null
function ensureCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function playShuffle() {
  const c = ensureCtx()
  if (!c) return
  for (let b = 0; b < 3; b++) {
    const dur = 0.18
    const buffer = c.createBuffer(1, c.sampleRate * dur, c.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.6
    const src = c.createBufferSource()
    src.buffer = buffer
    const bp = c.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 1800
    bp.Q.value = 0.8
    const g = c.createGain()
    const t = c.currentTime + b * 0.16
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.18, t + 0.02)
    g.gain.exponentialRampToValueAtTime(0.001, t + dur)
    src.connect(bp)
    bp.connect(g)
    g.connect(c.destination)
    src.start(t)
    src.stop(t + dur)
  }
}

export function useAudio() {
  return { startMusic, stopMusic, playShuffle }
}

// Звук без внешних файлов — синтез через Web Audio API (дружелюбно к офлайну/PWA).
// Остался только звук перетасовки карт (фоновый дрон убран как неприятный).
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

// Звук перетасовки — короткие шумовые всплески, фильтрованные в «шшш».
function playShuffle() {
  const c = ensureCtx()
  if (!c) return
  const bursts = 3
  for (let b = 0; b < bursts; b++) {
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
  return { playShuffle }
}

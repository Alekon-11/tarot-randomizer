// Звук без внешних файлов — синтез через Web Audio API (дружелюбно к офлайну/PWA).
let ctx = null
let ambient = null // { master, nodes: [] }

function ensureCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

// Мягкий эмбиент-дрон: несколько расстроенных осцилляторов + медленное тремоло.
function startAmbient() {
  const c = ensureCtx()
  if (!c || ambient) return

  const master = c.createGain()
  master.gain.value = 0
  master.gain.linearRampToValueAtTime(0.05, c.currentTime + 2.5)

  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 700
  lp.connect(master)
  master.connect(c.destination)

  // аккорд (низкие частоты)
  const freqs = [110, 146.83, 220, 164.81]
  const nodes = []
  freqs.forEach((f, i) => {
    const osc = c.createOscillator()
    osc.type = i % 2 ? 'sine' : 'triangle'
    osc.frequency.value = f
    osc.detune.value = (i - 1.5) * 6
    const g = c.createGain()
    g.gain.value = 0.25
    osc.connect(g)
    g.connect(lp)
    osc.start()
    nodes.push(osc)
  })

  // медленное тремоло громкости
  const lfo = c.createOscillator()
  lfo.frequency.value = 0.07
  const lfoGain = c.createGain()
  lfoGain.gain.value = 0.02
  lfo.connect(lfoGain)
  lfoGain.connect(master.gain)
  lfo.start()
  nodes.push(lfo)

  ambient = { master, nodes }
}

function stopAmbient() {
  if (!ambient || !ctx) return
  const { master, nodes } = ambient
  ambient = null
  master.gain.cancelScheduledValues(ctx.currentTime)
  master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8)
  setTimeout(() => {
    nodes.forEach((n) => {
      try { n.stop() } catch { /* lfo/osc */ }
    })
  }, 900)
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
  return { startAmbient, stopAmbient, playShuffle }
}

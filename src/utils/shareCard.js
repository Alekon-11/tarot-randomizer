// Сборка изображения карты на canvas и копирование в буфер обмена.

function loadImage(url) {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })
}

// Special:FilePath отдаёт 301-редирект БЕЗ заголовка CORS, поэтому для canvas
// он не годится. Резолвим прямой URL на upload.wikimedia.org через API (origin=*),
// у которого CORS включён — такую картинку можно безопасно рисовать на canvas.
async function resolveCorsImage(filePathUrl) {
  try {
    const u = new URL(filePathUrl)
    const marker = 'Special:FilePath/'
    const idx = u.pathname.indexOf(marker)
    if (idx === -1) return null
    const file = decodeURIComponent(u.pathname.slice(idx + marker.length))
    const api =
      'https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*' +
      '&prop=imageinfo&iiprop=url&iiurlwidth=520&titles=' +
      encodeURIComponent('File:' + file)
    const res = await fetch(api)
    const json = await res.json()
    const pages = json?.query?.pages || {}
    const first = Object.values(pages)[0]
    const info = first?.imageinfo?.[0]
    return info?.thumburl || info?.url || null
  } catch {
    return null
  }
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const words = String(text).split(' ')
  let line = ''
  let lines = 0
  for (let n = 0; n < words.length; n++) {
    const test = line + words[n] + ' '
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line.trim(), x, y)
      line = words[n] + ' '
      y += lineHeight
      if (++lines >= maxLines - 1) {
        // последняя строка — обрезаем с многоточием
        let last = line
        while (ctx.measureText(last + '…').width > maxWidth && last.length) last = last.slice(0, -1)
        ctx.fillText((last.trim() || '') + '…', x, y)
        return y
      }
    } else {
      line = test
    }
  }
  ctx.fillText(line.trim(), x, y)
  return y
}

export async function copyCardImage({ imageUrl, title, subtitle, keywords = [], sphereLabel, sphereText, reversed, deckName }) {
  const W = 720
  const H = 1100
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // фон
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#140d2c')
  bg.addColorStop(1, '#0a0718')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // рамка
  ctx.strokeStyle = 'rgba(179,136,255,0.5)'
  ctx.lineWidth = 3
  ctx.strokeRect(18, 18, W - 36, H - 36)

  // изображение карты (через CORS-совместимый прямой URL)
  const directUrl = await resolveCorsImage(imageUrl)
  const img = directUrl ? await loadImage(directUrl) : null
  const frameW = 360
  const frameH = 614
  const fx = (W - frameW) / 2
  const fy = 70
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.6)'
  ctx.shadowBlur = 30
  if (img) {
    if (reversed) {
      ctx.translate(fx + frameW / 2, fy + frameH / 2)
      ctx.rotate(Math.PI)
      ctx.drawImage(img, -frameW / 2, -frameH / 2, frameW, frameH)
    } else {
      ctx.drawImage(img, fx, fy, frameW, frameH)
    }
  } else {
    ctx.fillStyle = '#221a40'
    ctx.fillRect(fx, fy, frameW, frameH)
    ctx.fillStyle = '#cbb6ff'
    ctx.font = '48px Georgia, serif'
    ctx.textAlign = 'center'
    ctx.fillText('🔮', W / 2, fy + frameH / 2)
  }
  ctx.restore()
  ctx.strokeStyle = '#d4af37'
  ctx.lineWidth = 2
  ctx.strokeRect(fx, fy, frameW, frameH)

  // заголовок
  ctx.textAlign = 'center'
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 44px Georgia, serif'
  ctx.fillText(title, W / 2, fy + frameH + 70)

  ctx.fillStyle = '#9a90bd'
  ctx.font = 'italic 22px Georgia, serif'
  const orient = reversed ? '↧ перевёрнутая' : '↥ прямая'
  ctx.fillText(`${subtitle} · ${orient}`, W / 2, fy + frameH + 104)

  // ключевые слова
  if (keywords.length) {
    ctx.fillStyle = '#cbb6ff'
    ctx.font = '22px Segoe UI, sans-serif'
    ctx.fillText(keywords.join('  •  '), W / 2, fy + frameH + 146)
  }

  // трактовка
  ctx.textAlign = 'left'
  let ty = fy + frameH + 196
  if (sphereLabel) {
    ctx.fillStyle = '#d4af37'
    ctx.font = 'bold 20px Segoe UI, sans-serif'
    ctx.fillText(sphereLabel.toUpperCase(), 70, ty)
    ty += 32
  }
  if (sphereText) {
    ctx.fillStyle = '#ded7ef'
    ctx.font = '24px Segoe UI, sans-serif'
    wrapText(ctx, sphereText, 70, ty, W - 140, 34, 4)
  }

  // подпись
  ctx.textAlign = 'center'
  ctx.fillStyle = '#6f6790'
  ctx.font = '18px Segoe UI, sans-serif'
  ctx.fillText('🔮 Таро · рандомайзер карт', W / 2, H - 40)

  const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'))
  if (!blob) throw new Error('toBlob failed')

  // основной путь — копирование изображения в буфер обмена
  if (navigator.clipboard && window.ClipboardItem) {
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      return 'copied'
    } catch {
      /* буфер недоступен (нет HTTPS/разрешения) — упадём в скачивание */
    }
  }
  // запасной вариант — скачивание файла
  const fileName = `taro-${(title || 'card').replace(/\s+/g, '-').toLowerCase()}.png`
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
  return 'downloaded'
}

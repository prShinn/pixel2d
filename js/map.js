const TILE = 16          // kích thước 1 ô (pixel)
const MCOLS = 360          // số cột bản đồ
const MROWS = 240          // số hàng bản đồ
const CW = 640         // chiều rộng canvas
const CH = 420         // chiều cao canvas

const canvas = document.getElementById('gameCanvas')
const ctx = canvas.getContext('2d')
// ============================================================
//  SINH BẢN ĐỒ THỦ TỤC (không cần file ngoài)
//  Loại tile: 0=cỏ  1=đất  2=tường  3=nước
// ============================================================
let _s = 11111111111            // seed cho RNG giả-ngẫu-nhiên (tái tạo được)
const rng = () => { _s = (_s * 1664525 + 1013904223) & 0x7fffffff; return _s / 0x7fffffff }

function generateMap() {
    // Khởi tạo toàn bộ là cỏ
    const m = Array.from({ length: MROWS }, (_, r) =>
        Array.from({ length: MCOLS }, (_, c) =>
            (r === 0 || r === MROWS - 1 || c === 0 || c === MCOLS - 1) ? 2 : 0  // viền = tường
        )
    )

    // Cụm tường ngẫu nhiên (kích thước 1-3 ô)
    for (let i = 0; i < 110; i++) {
        const cr = 2 + Math.floor(rng() * (MROWS - 4)), cc = 2 + Math.floor(rng() * (MCOLS - 4))
        const sz = 1 + Math.floor(rng() * 2)
        for (let dr = -sz; dr <= sz; dr++) for (let dc = -sz; dc <= sz; dc++) {
            const nr = cr + dr, nc = cc + dc
            if (nr > 0 && nr < MROWS - 1 && nc > 0 && nc < MCOLS - 1) m[nr][nc] = 2
        }
    }

    // Vũng nước hình chữ nhật
    for (let i = 0; i < 22; i++) {
        const cr = 3 + Math.floor(rng() * (MROWS - 6)), cc = 3 + Math.floor(rng() * (MCOLS - 6))
        const w = 2 + Math.floor(rng() * 5), h = 2 + Math.floor(rng() * 4)
        for (let dr = 0; dr < h; dr++) for (let dc = 0; dc < w; dc++) {
            const nr = cr + dr, nc = cc + dc
            if (nr > 0 && nr < MROWS - 1 && nc > 0 && nc < MCOLS - 1 && m[nr][nc] === 0) m[nr][nc] = 3
        }
    }

    // Đường đất ngang/dọc (làm đường đi trông tự nhiên hơn)
    for (let i = 0; i < 30; i++) {
        const cr = 2 + Math.floor(rng() * (MROWS - 4)), cc = 2 + Math.floor(rng() * (MCOLS - 4))
        const len = 4 + Math.floor(rng() * 12), horiz = rng() > .5
        for (let j = 0; j < len; j++) {
            const nr = horiz ? cr : cr + j, nc = horiz ? cc + j : cc
            if (nr > 0 && nr < MROWS - 1 && nc > 0 && nc < MCOLS - 1 && m[nr][nc] === 0) m[nr][nc] = 1
        }
    }

    // Đảm bảo vùng spawn người chơi (góc trên trái) sạch
    for (let r = 1; r < 10; r++) for (let c = 1; c < 10; c++) m[r][c] = 0

    return m
}
const MAP = generateMap()

// Pre-render minimap tĩnh vào offscreen canvas (hiệu quả hơn vẽ lại mỗi frame)
const mmCV = document.createElement('canvas')
mmCV.width = MCOLS; mmCV.height = MROWS
const mmCtx = mmCV.getContext('2d')
const mmColors = ['#385025', '#5a4020', '#44445a', '#2a4f80']
for (let r = 0; r < MROWS; r++) for (let c = 0; c < MCOLS; c++) {
    mmCtx.fillStyle = mmColors[MAP[r][c]] || '#385025'
    mmCtx.fillRect(c, r, 1, 1)
}
// ============================================================
//  VẼ TILEMAP (chỉ các tile trong viewport)
// ============================================================
const T_BASE = { 0: '#5a8a3c', 1: '#8b5e3c', 2: '#4d4d66', 3: '#3a7abf' }
const T_DET = { 0: '#6fa048', 1: '#a06e48', 2: '#6060a0', 3: '#5590cf' }

function drawMap() {
    const sc = Math.max(0, Math.floor(cam.x / TILE)), ec = Math.min(MCOLS - 1, Math.ceil((cam.x + CW) / TILE))
    const sr = Math.max(0, Math.floor(cam.y / TILE)), er = Math.min(MROWS - 1, Math.ceil((cam.y + CH) / TILE))

    for (let r = sr; r <= er; r++) for (let c = sc; c <= ec; c++) {
        const tile = MAP[r][c], x = c * TILE, y = r * TILE
        ctx.fillStyle = T_BASE[tile] || '#5a8a3c'
        ctx.fillRect(x, y, TILE, TILE)
        ctx.fillStyle = T_DET[tile] || '#6fa048'
        if (tile === 0) {   // cỏ: chấm nhỏ ngẫu nhiên cố định
            const s = r * 31 + c * 17
            if (s % 5 === 0) ctx.fillRect(x + 2, y + 2, 2, 2)
            if (s % 7 === 0) ctx.fillRect(x + 9, y + 7, 2, 2)
            if (s % 9 === 0) ctx.fillRect(x + 5, y + 12, 2, 2)
        } else if (tile === 2) {   // tường: gạch đá
            ctx.fillRect(x, y, TILE, 1); ctx.fillRect(x, y, 1, TILE)
            if ((r + c) % 2 === 0) ctx.fillRect(x + 2, y + 5, 6, 3)
            else ctx.fillRect(x + 8, y + 10, 5, 3)
        } else if (tile === 3) {   // nước: sóng nhấp nhô
            const wv = Math.sin(fc / 30 + c * .7) | 0
            ctx.fillStyle = 'rgba(85,150,210,.55)'
            ctx.fillRect(x, y + 4 + wv, TILE, 3); ctx.fillRect(x, y + 11 + wv, TILE, 3)
        } else if (tile === 1) {   // đất: kẻ ngang nhẹ
            ctx.fillRect(x, y + 4, TILE, 1); ctx.fillRect(x, y + 10, TILE, 1)
        }
    }
}
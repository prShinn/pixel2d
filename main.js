// ================================================================
// ⚙️  CẤU HÌNH GAME
// ================================================================

const canvas = document.getElementById('gameCanvas')
const ctx = canvas.getContext('2d')

const TILE = 16    // Kích thước 1 ô (pixel) - đơn vị cơ bản
const COLS = canvas.width / TILE   // Số cột: 30
const ROWS = canvas.height / TILE   // Số hàng: 20
const FPS = 60    // Tốc độ khung hình mục tiêu

// ================================================================
// 🗺️  BẢN ĐỒ (TILEMAP)
// Mỗi số = 1 loại ô:
//   0 = cỏ xanh (đi được)
//   1 = đất nâu (đi được)
//   2 = tường đá (CHẶN - không đi qua được)
//   3 = nước xanh dương (CHẶN)
// ================================================================

// prettier-ignore
const MAP = [
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    [2, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    [2, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 2, 0, 0, 3, 3, 3, 0, 0, 0, 0, 2],
    [2, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 2, 0, 2, 0, 0, 3, 3, 3, 0, 0, 0, 0, 2],
    [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 2],
    [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    [2, 0, 0, 0, 0, 0, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    [2, 0, 0, 0, 0, 0, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 2],
    [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 2],
    [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    [2, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 2],
    [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 2],
    [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
]

// Màu sắc cho từng loại tile
const TILE_COLORS = {
    0: '#5a8a3c',   // Cỏ xanh
    1: '#8b5e3c',   // Đất nâu
    2: '#555577',   // Tường đá xám xanh
    3: '#3a7abf',   // Nước xanh
}

// Màu chi tiết thêm (highlight/shadow) cho hiệu ứng pixel
const TILE_DETAIL = {
    0: '#6fa048',   // Cỏ sáng hơn
    1: '#a06e48',   // Đất sáng hơn
    2: '#6666aa',   // Tường sáng hơn
    3: '#5590cf',   // Nước sáng hơn (sóng)
}

// ================================================================
// 🧍 NHÂN VẬT (PLAYER)
// ================================================================

const player = {
    x: 64,          // Vị trí X (pixel) - bắt đầu ở giữa gần trái
    y: 64,          // Vị trí Y (pixel)
    w: 12,          // Chiều rộng hitbox (dùng cho va chạm)
    h: 14,          // Chiều cao hitbox
    speed: 0.75,       // Tốc độ di chuyển (pixel/frame)
    dir: 'down',    // Hướng đang nhìn: 'up' | 'down' | 'left' | 'right'
    step: 0,        // Bộ đếm animation bước chân (0-1-2-3...)
    stepTimer: 0,   // Đồng hồ đếm để chuyển frame animation
}

// ================================================================
// ⌨️  THEO DÕI PHÍM BẤM
// keys['w'] = true có nghĩa phím W đang được giữ xuống
// ================================================================

const keys = {}

// Khi người dùng nhấn phím xuống
document.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true
    e.preventDefault()   // Ngăn cuộn trang bằng phím mũi tên
})

// Khi người dùng nhả phím
document.addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = false
})

// ================================================================
// 📱 NÚT CẢM ỨNG (mobile)
// Nhấn giữ nút = giống giữ phím WASD
// ================================================================

function bindBtn(id, key) {
    const btn = document.getElementById(id)
    btn.addEventListener('pointerdown', () => { keys[key] = true })
    btn.addEventListener('pointerup', () => { keys[key] = false })
    btn.addEventListener('pointerout', () => { keys[key] = false }) // nhả khi trượt ra ngoài
}

bindBtn('btn-up', 'w')
bindBtn('btn-left', 'a')
bindBtn('btn-down', 's')
bindBtn('btn-right', 'd')

// ================================================================
// 🔢 HÀM TIỆN ÍCH
// ================================================================

/**
 * Kiểm tra xem ô tile tại vị trí (px, py) tính bằng pixel có BỊ CHẶN không
 * Dùng để kiểm tra va chạm trước khi cho nhân vật đi qua
 */
function isSolid(px, py) {
    const col = Math.floor(px / TILE)   // Chuyển pixel → chỉ số cột
    const row = Math.floor(py / TILE)   // Chuyển pixel → chỉ số hàng
    // Nếu ra ngoài bản đồ → coi như tường
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return true
    const tile = MAP[row][col]
    return tile === 2 || tile === 3     // 2=tường, 3=nước → chặn
}

/**
 * Kiểm tra va chạm cho hitbox hình chữ nhật của nhân vật
 * Thử di chuyển đến (nx, ny) - nếu bất kỳ góc nào đụng tường thì trả về false
 */
function canMove(nx, ny) {
    const hw = player.w / 2   // Nửa chiều rộng
    const hh = player.h / 2   // Nửa chiều cao
    // Kiểm tra 4 góc của hitbox
    return !isSolid(nx - hw, ny - hh) &&   // Góc trên-trái
        !isSolid(nx + hw, ny - hh) &&   // Góc trên-phải
        !isSolid(nx - hw, ny + hh) &&   // Góc dưới-trái
        !isSolid(nx + hw, ny + hh)      // Góc dưới-phải
}

// ================================================================
// 🔄 UPDATE: Logic game chạy mỗi frame
// ================================================================

function update() {
    let dx = 0, dy = 0   // Lượng di chuyển X và Y trong frame này

    // Đọc input từ WASD hoặc phím mũi tên
    if (keys['w'] || keys['arrowup']) { dy = -player.speed; player.dir = 'up' }
    if (keys['s'] || keys['arrowdown']) { dy = +player.speed; player.dir = 'down' }
    if (keys['a'] || keys['arrowleft']) { dx = -player.speed; player.dir = 'left' }
    if (keys['d'] || keys['arrowright']) { dx = +player.speed; player.dir = 'right' }

    // Di chuyển theo TỪNG TRỤC riêng biệt (slide along wall)
    // Nếu bị chặn theo X thì vẫn có thể trượt theo Y, và ngược lại
    if (dx !== 0 && canMove(player.x + dx, player.y)) player.x += dx
    if (dy !== 0 && canMove(player.x, player.y + dy)) player.y += dy

    // Animation bước chân: chỉ chạy khi đang di chuyển
    const moving = dx !== 0 || dy !== 0
    if (moving) {
        player.stepTimer++
        if (player.stepTimer >= 8) {      // Cứ 8 frame đổi 1 bước
            player.step = (player.step + 1) % 4   // Vòng lặp 0→1→2→3→0
            player.stepTimer = 0
        }
    } else {
        player.step = 0    // Đứng yên → về tư thế đứng thẳng
        player.stepTimer = 0
    }
}

// ================================================================
// 🎨 DRAW TILEMAP: Vẽ bản đồ ô vuông
// ================================================================

function drawMap() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const tile = MAP[r][c]
            const x = c * TILE
            const y = r * TILE

            // Vẽ màu nền của tile
            ctx.fillStyle = TILE_COLORS[tile]
            ctx.fillRect(x, y, TILE, TILE)

            // Thêm chi tiết pixel nhỏ để trông sinh động hơn
            ctx.fillStyle = TILE_DETAIL[tile]

            if (tile === 0) {
                // Cỏ: vẽ vài chấm sáng nhỏ ngẫu nhiên (dùng hạt giống cố định theo vị trí)
                const seed = r * 31 + c * 17
                if (seed % 5 === 0) ctx.fillRect(x + 2, y + 2, 2, 2)
                if (seed % 7 === 0) ctx.fillRect(x + 9, y + 7, 2, 2)
                if (seed % 9 === 0) ctx.fillRect(x + 5, y + 11, 2, 2)
            } else if (tile === 1) {
                // Đất: vẽ đường kẻ ngang nhẹ
                ctx.fillRect(x, y + 4, TILE, 1)
                ctx.fillRect(x, y + 10, TILE, 1)
            } else if (tile === 2) {
                // Tường đá: vẽ đường gạch
                ctx.fillStyle = '#44446688'
                ctx.fillRect(x, y, TILE, 1)         // Viền trên
                ctx.fillRect(x, y, 1, TILE)         // Viền trái
                ctx.fillStyle = TILE_DETAIL[tile]
                // Gạch nhỏ trang trí
                if ((r + c) % 2 === 0) ctx.fillRect(x + 2, y + 5, 6, 3)
                else ctx.fillRect(x + 8, y + 10, 5, 3)
            } else if (tile === 3) {
                // Nước: vẽ sóng nhấp nhô bằng sin
                const wave = Math.floor(Math.sin(Date.now() / 800 + c * 0.7) * 2)
                ctx.fillStyle = '#5590cf88'
                ctx.fillRect(x, y + 4 + wave, TILE, 3)
                ctx.fillRect(x, y + 10 + wave, TILE, 3)
            }
        }
    }
}

// ================================================================
// 🧍 DRAW PLAYER: Vẽ stickman (không cần ảnh bên ngoài!)
// ================================================================

function drawPlayer() {
    const { x, y, dir, step } = player

    // --- Tính toán animation bước chân ---
    // Chân trái và phải dao động ngược nhau
    const legSwing = [0, 4, 0, -4][step]      // Biên độ xoay chân (độ pixel)
    const armSwing = [0, -4, 0, 4][step]      // Tay đung đưa ngược chân

    ctx.save()
    ctx.translate(x, y)   // Di chuyển gốc tọa độ đến vị trí nhân vật

    // === BÓNG dưới chân ===
    ctx.fillStyle = 'rgba(0,0,0,0.3)'
    ctx.beginPath()
    ctx.ellipse(0, 9, 6, 3, 0, 0, Math.PI * 2)
    ctx.fill()

    // === THÂN NGƯỜI ===
    ctx.strokeStyle = '#222'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'

    // Đầu (hình tròn)
    ctx.fillStyle = '#f5c87a'       // Màu da
    ctx.beginPath()
    ctx.arc(0, -12, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // Mắt (thay đổi theo hướng nhìn)
    ctx.fillStyle = '#222'
    if (dir === 'right') {
        ctx.fillRect(2, -14, 2, 2)    // Mắt phải
    } else if (dir === 'left') {
        ctx.fillRect(-4, -14, 2, 2)   // Mắt trái
    } else if (dir === 'down') {
        ctx.fillRect(-2, -13, 2, 2)   // Mắt trái (nhìn xuống)
        ctx.fillRect(1, -13, 2, 2)    // Mắt phải (nhìn xuống)
    } else {                        // up: nhìn lên, thấy sau đầu
        ctx.fillStyle = '#dda85a'     // Chỉ thấy tóc
        ctx.fillRect(-4, -17, 8, 4)
    }

    // Thân (đường thẳng từ cổ xuống hông)
    ctx.strokeStyle = '#e06030'     // Màu áo cam
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(0, -7)               // Cổ
    ctx.lineTo(0, 2)               // Hông
    ctx.stroke()

    // Tay trái (đung đưa khi đi)
    ctx.strokeStyle = '#f5c87a'     // Màu da tay
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(-1, -5)              // Vai trái
    ctx.lineTo(-6, 1 + armSwing)    // Bàn tay trái
    ctx.stroke()

    // Tay phải
    ctx.beginPath()
    ctx.moveTo(1, -5)               // Vai phải
    ctx.lineTo(6, 1 - armSwing)     // Bàn tay phải (ngược chiều)
    ctx.stroke()

    // Chân trái
    ctx.strokeStyle = '#3060a0'     // Màu quần xanh
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.moveTo(-1, 2)               // Hông trái
    ctx.lineTo(-4 + legSwing, 9)    // Gối trái
    ctx.stroke()

    // Chân phải
    ctx.beginPath()
    ctx.moveTo(1, 2)                // Hông phải
    ctx.lineTo(4 - legSwing, 9)     // Gối phải (ngược chiều)
    ctx.stroke()

    ctx.restore()   // Phục hồi lại trạng thái canvas ban đầu
}

// ================================================================
// 📊 DRAW HUD: Hiển thị thông tin trên màn hình
// ================================================================

function drawHUD() {
    // Vẽ thanh trạng thái góc trên trái
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillRect(4, 4, 120, 22)

    ctx.fillStyle = '#f0c040'
    ctx.font = '10px Courier New'
    ctx.fillText(
        `X:${Math.floor(player.x)} Y:${Math.floor(player.y)} [${player.dir}]`,
        8, 18
    )

    // Vẽ hướng dẫn góc dưới phải
    ctx.fillStyle = 'rgba(0,0,0,0.4)'
    ctx.fillRect(canvas.width - 140, canvas.height - 22, 136, 18)
    ctx.fillStyle = '#aaa'
    ctx.fillText('WASD = di chuyển', canvas.width - 136, canvas.height - 9)
}

// ================================================================
// 🔁 VÒNG LẶP GAME CHÍNH (Game Loop)
// Được gọi ~60 lần/giây bởi requestAnimationFrame
// ================================================================

function gameLoop() {
    // 1. Cập nhật logic (input, vật lý, va chạm)
    update()

    // 2. Xóa màn hình trước khi vẽ lại
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 3. Vẽ bản đồ (lớp dưới cùng)
    drawMap()

    // 4. Vẽ nhân vật (lớp trên bản đồ)
    drawPlayer()

    // 5. Vẽ HUD (lớp trên cùng)
    drawHUD()

    // 6. Lên lịch frame tiếp theo
    requestAnimationFrame(gameLoop)
}

// ================================================================
// 🚀 KHỞI ĐỘNG GAME
// ================================================================
gameLoop()
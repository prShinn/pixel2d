'use strict'
// ============================================================
//  HẰNG SỐ & SETUP
// ============================================================


// Vẽ thanh HP nhỏ phía trên quái
function _drawHP(ctx, m, bw) {
    const def = M_TYPES[m.type], pct = m.hp / def.hp, by = -(def.h / 2 + 10)
    ctx.fillStyle = '#300'; ctx.fillRect(m.x - bw / 2, m.y + by, bw, 3)
    ctx.fillStyle = pct > .5 ? '#0c0' : pct > .25 ? '#cc0' : '#c00'
    ctx.fillRect(m.x - bw / 2, m.y + by, bw * pct, 3)
}

// ============================================================
//  TRẠNG THÁI GAME
// ============================================================
let monsters = []
let projectiles = []
let particles = []
let floatTexts = []   // số damage nổi
let mIdCnt = 0    // ID tự tăng cho quái

let kills = 0
let wave = 1
let waveTmr = 0              // frame đếm đến wave tiếp
const WAVE_INTERVAL = 60 * 22  // 22 giây/wave

// Quy tắc spawn: mỗi wave tạo một "hàng đợi" spawn
// Sau đó từng quái xuất hiện cách nhau 18 frame
let spawnQ = 0    // số quái còn cần spawn
let spawnTmr = 0    // delay giữa các lần spawn
let spawnBurst = 0  // số quái nhóm này

let score = 0
let gameOver = false
let fc = 0    // frame counter

const cam = { x: 0, y: 0 }

// ============================================================
//  INPUT
// ============================================================
const keys = {}
canvas.addEventListener('mousedown', e => {
    if (gameOver) return;

    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    attackToward(cx, cy);
});

document.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true
    const wMap = { '1': 'fist', '2': 'sword', '3': 'bow', '4': 'staff', '5': 'wand' }
    if (wMap[e.key]) setWeapon(wMap[e.key])
    if ((e.key === 'j' || e.key === 'J' || e.key === ' ' || e.key === 'z' || e.key === 'Z') && !gameOver) {
        // tryAttack()
        attackToward(player.x + (player.dir === 'right' ? 100 : player.dir === 'left' ? -100 : 0),
            player.y + (player.dir === 'down' ? 100 : player.dir === 'up' ? -100 : 0));
    }
    if ((e.key === 'r' || e.key === 'R') && gameOver) location.reload()
    e.preventDefault()
})
document.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false })

    // Mobile: nhấn giữ nút = như giữ phím
    ;[['btn-u', 'w'], ['btn-l', 'a'], ['btn-d', 's'], ['btn-r', 'd']].forEach(([id, k]) => {
        const b = document.getElementById(id)
        b.addEventListener('pointerdown', () => keys[k] = true)
        b.addEventListener('pointerup', () => keys[k] = false)
        b.addEventListener('pointerout', () => keys[k] = false)
    })
document.getElementById('atk-btn').addEventListener('pointerdown', () => tryAttack())
document.querySelectorAll('#wpn-btns button').forEach(b => {
    b.addEventListener('click', () => setWeapon(b.dataset.wpn))
})

function setWeapon(w) {
    player.weapon = w
    document.querySelectorAll('#wpn-btns button').forEach(b => b.classList.toggle('active', b.dataset.wpn === w))
    document.getElementById('ui-wpn').textContent = WEAPONS[w].icon + ' ' + WEAPONS[w].name
}

// ============================================================
//  TIỆN ÍCH
// ============================================================
const isSolid = (px, py) => {
    const c = Math.floor(px / TILE), r = Math.floor(py / TILE)
    if (r < 0 || r >= MROWS || c < 0 || c >= MCOLS) return true
    return MAP[r][c] === 2 || MAP[r][c] === 3
}
const canMove = (nx, ny, hw, hh) =>
    !isSolid(nx - hw, ny - hh) && !isSolid(nx + hw, ny - hh) && !isSolid(nx - hw, ny + hh) && !isSolid(nx + hw, ny + hh)

const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by)
const rectHit = (ax, ay, aw, ah, bx, by, bw, bh) => ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by


// Lấy hitbox cận chiến theo hướng nhìn
function getMeleeBox() {
    const w = WEAPONS[player.weapon]
    if (w.proj) return null
    const { x, y, dir } = player, r = w.range
    return ({
        right: { x: x + 4, y: y - 8, w: r, h: 16 },
        left: { x: x - 4 - r, y: y - 8, w: r, h: 16 },
        down: { x: x - 8, y: y + 4, w: 16, h: r },
        up: { x: x - 8, y: y - 4 - r, w: 16, h: r },
    })[dir]
}


// ============================================================
//  PARTICLES & FLOATING TEXT
// ============================================================
function mkParticles(x, y, color, n = 6) {
    for (let i = 0; i < n; i++) {
        const a = (Math.PI * 2 / n) * i + Math.random() * .5
        const s = 1 + Math.random() * 2.5
        particles.push({
            x, y, color, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
            life: 18 + Math.floor(Math.random() * 22), sz: 2 + Math.floor(Math.random() * 3)
        })
    }
}
function mkFloat(x, y, text, color, life = 55, sz = 11) {
    floatTexts.push({ x, y, text, color, life, vy: -0.9, sz })
}
function dmgText(x, y, val, color = '#ffff50') {
    mkFloat(x + (Math.random() - .5) * 10, y - 12, String(val), color, 50, 11)
}


function triggerDeath() {
    gameOver = true
}

// ============================================================
//  UPDATE — chạy mỗi frame
// ============================================================
function update() {
    if (gameOver) return
    fc++

    // ── Di chuyển người chơi ──────────────────────────────────
    let dx = 0, dy = 0
    if (keys['w'] || keys['arrowup']) { dy = -player.speed; player.dir = 'up' }
    if (keys['s'] || keys['arrowdown']) { dy = +player.speed; player.dir = 'down' }
    if (keys['a'] || keys['arrowleft']) { dx = -player.speed; player.dir = 'left' }
    if (keys['d'] || keys['arrowright']) { dx = +player.speed; player.dir = 'right' }

    const hw = player.w / 2, hh = player.h / 2
    if (dx && canMove(player.x + dx, player.y, hw, hh)) player.x += dx
    if (dy && canMove(player.x, player.y + dy, hw, hh)) player.y += dy

    const moving = dx !== 0 || dy !== 0
    if (moving) { if (++player.stepTimer >= 8) { player.step = (player.step + 1) % 4; player.stepTimer = 0 } }
    else { player.step = 0; player.stepTimer = 0 }

    if (player.atkCd > 0) player.atkCd--
    if (player.atkAnim > 0) player.atkAnim--
    if (player.hurtFlash > 0) player.hurtFlash--
    if (player.invincible > 0) player.invincible--

    // ── Kiểm tra melee hitbox với quái ───────────────────────
    const w = WEAPONS[player.weapon]
    if (player.atkAnim > w.anim * .4) {         // hitbox active ở 60% đầu animation
        const box = getMeleeBox()
        if (box) monsters.forEach(m => {
            if (player.atkHit.has(m.id)) return
            const def = M_TYPES[m.type]
            if (rectHit(box.x, box.y, box.w, box.h, m.x - def.w / 2, m.y - def.h / 2, def.w, def.h)) {
                hitMonster(m, w.dmg)
                player.atkHit.add(m.id)
                // knockback quái ra xa
                const kb = w.kb || 4
                const ddx = m.x - player.x, ddy = m.y - player.y, dl = Math.hypot(ddx, ddy) || 1
                m.vx += (ddx / dl) * kb; m.vy += (ddy / dl) * kb
            }
        })
    }

    // ── Cập nhật đạn ─────────────────────────────────────────
    projectiles = projectiles.filter(p => {
        p.x += p.vx; p.y += p.vy; p.distLeft -= Math.hypot(p.vx, p.vy)

        // Homing (wand): đạn phép lệch nhẹ về quái gần nhất
        if (p.homing && monsters.length > 0) {
            const near = monsters.reduce((a, b) => dist(p.x, p.y, a.x, a.y) < dist(p.x, p.y, b.x, b.y) ? a : b)
            const ang = Math.atan2(near.y - p.y, near.x - p.x)
            p.vx += Math.cos(ang) * .2; p.vy += Math.sin(ang) * .2
            const spd = Math.hypot(p.vx, p.vy)
            const ps = WEAPONS.wand.pspd
            p.vx = (p.vx / spd) * ps; p.vy = (p.vy / spd) * ps
        }

        if (isSolid(p.x, p.y)) { mkParticles(p.x, p.y, '#888', 4); return false }

        // Va chạm với quái
        if (p.owner === 'player') {
            for (const m of monsters) {
                const def = M_TYPES[m.type]
                if (dist(p.x, p.y, m.x, m.y) < (def.w / 2 + 5)) {
                    hitMonster(m, p.dmg)
                    mkParticles(p.x, p.y, p.color, 5)
                    return false
                }
            }
        }
        return p.distLeft > 0
    })

    // ── Cập nhật quái ────────────────────────────────────────
    monsters = monsters.filter(m => m.hp > 0)

    monsters.forEach(m => {
        const def = M_TYPES[m.type]
        if (m.hurtFlash > 0) m.hurtFlash--

        // Giảm dần vận tốc knockback
        m.vx *= 0.72; m.vy *= 0.72

        // ── AI State Machine ──
        const dp = dist(m.x, m.y, player.x, player.y)

        if (m.state === 'idle') {
            // Chờ một chút rồi bắt đầu đuổi
            if (--m.idleTmr <= 0 || dp < def.detectR) m.state = 'chase'
        }
        else if (m.state === 'chase') {
            if (dp <= 26) { m.state = 'attack'; m.atkTmr = def.atkCd * .5 | 0 }
            else {
                // Gia tốc về phía người chơi (steering)
                const ang = Math.atan2(player.y - m.y, player.x - m.x)
                m.vx += Math.cos(ang) * def.spd * .6; m.vy += Math.sin(ang) * def.spd * .6
                const s = Math.hypot(m.vx, m.vy)
                if (s > def.spd) { m.vx = (m.vx / s) * def.spd; m.vy = (m.vy / s) * def.spd }
            }
        }
        else if (m.state === 'attack') {
            if (dp > 36) { m.state = 'chase'; return }
            // Tấn công theo chu kỳ
            if (++m.atkTmr >= def.atkCd) {
                m.atkTmr = 0
                if (player.invincible <= 0) {
                    player.hp = Math.max(0, player.hp - def.dmg)
                    player.hurtFlash = 20; player.invincible = 45
                    dmgText(player.x, player.y, '-' + def.dmg, '#ff4040')
                    document.getElementById('ui-hp').textContent = '❤ ' + player.hp + '/' + player.maxHp
                    if (player.hp <= 0) triggerDeath()
                }
            }
        }

        // Áp dụng vận tốc (với collision)
        const mhw = def.w / 2, mhh = def.h / 2
        if (Math.abs(m.vx) > .05 && canMove(m.x + m.vx, m.y, mhw, mhh)) m.x += m.vx
        if (Math.abs(m.vy) > .05 && canMove(m.x, m.y + m.vy, mhw, mhh)) m.y += m.vy
    })

    // ── Wave / Spawn logic ────────────────────────────────────
    if (spawnQ > 0) trySpawn()
    else {
        if (++waveTmr >= WAVE_INTERVAL) {
            waveTmr = 0; wave++
            startWave()
        }
    }

    // ── Particles & float texts ───────────────────────────────
    particles = particles.filter(p => { p.x += p.vx; p.y += p.vy; p.vy += .06; return --p.life > 0 })
    floatTexts = floatTexts.filter(t => { t.y += t.vy; return --t.life > 0 })

    // ── Camera: theo người chơi, kẹp trong bản đồ ────────────
    cam.x = Math.max(0, Math.min(player.x - CW / 2, MCOLS * TILE - CW))
    cam.y = Math.max(0, Math.min(player.y - CH / 2, MROWS * TILE - CH))
}



// ============================================================
//  VẼ HITBOX TẤN CÔNG (feedback nhìn thấy được)
// ============================================================
function drawAtkEffect() {
    if (player.atkAnim <= 0) return
    const w = WEAPONS[player.weapon]
    if (w.proj) return
    const box = getMeleeBox()
    if (!box) return
    const p = player.atkAnim / w.anim
    ctx.save()
    ctx.strokeStyle = w.color; ctx.lineWidth = 1.5
    ctx.globalAlpha = p * .45
    ctx.strokeRect(box.x - cam.x, box.y - cam.y, box.w, box.h)
    ctx.fillStyle = w.color; ctx.globalAlpha = p * .12
    ctx.fillRect(box.x - cam.x, box.y - cam.y, box.w, box.h)
    ctx.restore()
}

// ============================================================
//  VẼ FLOATING TEXT (damage number, thông báo wave)
// ============================================================
function drawFloats() {
    floatTexts.forEach(t => {
        ctx.save()
        ctx.globalAlpha = Math.min(1, t.life / 25)
        ctx.fillStyle = t.color
        ctx.font = `bold ${t.sz}px "Courier New"`
        ctx.textAlign = 'center'
        // Chuyển tọa độ thế giới → màn hình
        ctx.fillText(t.text, t.x - cam.x, t.y - cam.y)
        ctx.restore()
    })
}

// ============================================================
//  VẼ HUD (thanh HP, minimap, cooldown, wave)
// ============================================================
function drawHUD() {
    // Thanh HP
    const bw = 160, bh = 12, bx = 8, by = 8
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(bx - 2, by - 2, bw + 4, bh + 4)
    ctx.fillStyle = '#600'; ctx.fillRect(bx, by, bw, bh)
    const hpPct = player.hp / player.maxHp
    ctx.fillStyle = hpPct > .5 ? '#0c0' : hpPct > .25 ? '#cc0' : '#c00'
    ctx.fillRect(bx, by, bw * hpPct, bh)
    ctx.fillStyle = '#eee'; ctx.font = '9px "Courier New"'
    ctx.fillText(`HP ${player.hp}/${player.maxHp}`, bx + 4, by + 9)

    // Thanh cooldown tấn công
    const w = WEAPONS[player.weapon]
    const cdPct = player.atkCd / w.cd
    ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(bx - 2, by + 14, bw + 4, 8)
    ctx.fillStyle = cdPct > 0 ? '#f0c040' : '#40f080'
    ctx.fillRect(bx, by + 16, bw * (1 - cdPct), 4)
    ctx.fillStyle = '#888'; ctx.font = '7px "Courier New"'
    ctx.fillText(cdPct > 0 ? `${w.name} ${(cdPct * 100 | 0)}%` : `${w.name} READY`, bx + 2, by + 24)

    // Minimap (góc trên phải)
    const mmW = 80, mmH = 50, mmX = CW - mmW - 6, mmY = 6
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(mmX - 2, mmY - 2, mmW + 4, mmH + 4)
    ctx.drawImage(mmCV, mmX, mmY, mmW, mmH)  // bản đồ tĩnh đã pre-render

    // Vị trí người chơi trên minimap
    const sx = player.x / TILE * (mmW / MCOLS), sy = player.y / TILE * (mmH / MROWS)
    ctx.fillStyle = '#ffff00'
    ctx.fillRect(mmX + sx - 2, mmY + sy - 2, 4, 4)

    // Quái trên minimap (chấm đỏ)
    ctx.fillStyle = '#ff4040'
    monsters.forEach(m => {
        ctx.fillRect(mmX + m.x / TILE * (mmW / MCOLS) - 1, mmY + m.y / TILE * (mmH / MROWS) - 1, 2, 2)
    })

    // Viewport box trên minimap
    ctx.strokeStyle = '#ffffff44'; ctx.lineWidth = 1
    ctx.strokeRect(mmX + cam.x / TILE * (mmW / MCOLS), mmY + cam.y / TILE * (mmH / MROWS),
        CW / TILE * (mmW / MCOLS), CH / TILE * (mmH / MROWS))

    // Wave / countdown
    const ctx2row = mmY + mmH + 4
    ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(mmX - 2, ctx2row, mmW + 4, 13)
    if (spawnQ > 0) {
        ctx.fillStyle = '#ff8040'
        ctx.font = '8px "Courier New"'
        ctx.fillText(`W${wave} SPAWN +${spawnQ} quái`, mmX + 2, ctx2row + 9)
    } else {
        const sec = Math.ceil((WAVE_INTERVAL - waveTmr) / 60)
        ctx.fillStyle = '#aad040'
        ctx.font = '8px "Courier New"'
        ctx.fillText(`W${wave} | Next: ${sec}s | ${monsters.length} quái`, mmX + 2, ctx2row + 9)
    }

    // Số kills và wave (dòng dưới HP)
    ctx.fillStyle = '#66aaff'; ctx.font = '9px "Courier New"'
    ctx.fillText(`SCORE ${score}`, bx, by + 36)
}

// ============================================================
//  GAME OVER OVERLAY
// ============================================================
function drawGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,.72)'; ctx.fillRect(0, 0, CW, CH)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#ff3030'; ctx.font = 'bold 30px "Courier New"'
    ctx.fillText('GAME OVER', CW / 2, CH / 2 - 22)
    ctx.fillStyle = '#f0c040'; ctx.font = '14px "Courier New"'
    ctx.fillText(`Wave ${wave}  •  Score: ${score}  •  Kills: ${kills}`, CW / 2, CH / 2 + 8)
    ctx.fillStyle = '#888'; ctx.font = '11px "Courier New"'
    ctx.fillText('Nhấn R để chơi lại', CW / 2, CH / 2 + 32)
    ctx.textAlign = 'left'
}

// ============================================================
//  VÒNG LẶP CHÍNH
// ============================================================
function draw() {
    ctx.clearRect(0, 0, CW, CH)

    // ── Vẽ thế giới (áp dụng camera offset) ─────────────────
    ctx.save()
    ctx.translate(-cam.x, -cam.y)   // dịch chuyển mọi thứ ngược với camera

    drawMap()
    drawParticles()
    drawMonsters()
    drawProjectiles()
    drawPlayer()

    ctx.restore()                  // về lại screen space

    // ── Vẽ HUD & overlay (screen space, không bị camera ảnh hưởng) ──
    drawAtkEffect()
    drawFloats()
    drawHUD()
    if (gameOver) drawGameOver()
}

function gameLoop() {
    update()
    draw()
    requestAnimationFrame(gameLoop)
}

// ============================================================
//  KHỞI ĐỘNG
// ============================================================
startWave()   // bắt đầu wave 1 ngay lập tức
gameLoop()
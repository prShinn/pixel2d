
// ============================================================
//  LOẠI QUÁI VẬT
//  draw: hàm vẽ riêng từng loại
// ============================================================
const M_TYPES = {
    // --- SLIME: di chuyển chậm, HP thấp, xuất hiện sớm ---
    slime: {
        name: 'Slime', hp: 25, spd: 0.75, dmg: 6, detectR: 90, atkCd: 45,
        w: 12, h: 10, score: 10,
        draw(ctx, m, t) {
            const bob = Math.sin(t * .06 + m.id) * 2.5     // nảy lên xuống theo thời gian
            const scX = 1 + Math.abs(Math.sin(t * .06 + m.id)) * .2  // squash & stretch
            ctx.save(); ctx.translate(m.x, m.y)
            ctx.scale(scX, 2 - scX)
            ctx.fillStyle = m.hurtFlash > 0 ? '#fff' : '#38c048'
            ctx.beginPath(); ctx.ellipse(0, bob, 9, 7, 0, 0, Math.PI * 2); ctx.fill()
            ctx.fillStyle = '#1a3010'
            ctx.fillRect(-4, bob - 3, 3, 3); ctx.fillRect(1, bob - 3, 3, 3)  // mắt
            ctx.restore()
            _drawHP(ctx, m, 20)
        }
    },
    // --- DƠI: nhanh, HP rất thấp, cánh vỗ, xuất hiện wave 2+ ---
    bat: {
        name: 'Dơi', hp: 15, spd: 1.6, dmg: 10, detectR: 150, atkCd: 30,
        w: 14, h: 8, score: 15,
        draw(ctx, m, t) {
            const flap = Math.sin(t * .22 + m.id) * 7    // biên độ vỗ cánh
            ctx.save(); ctx.translate(m.x, m.y)
            ctx.fillStyle = m.hurtFlash > 0 ? '#fff' : '#9060c0'
            // Cánh trái
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-14, flap); ctx.lineTo(-8, 3); ctx.closePath(); ctx.fill()
            // Cánh phải
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(14, flap); ctx.lineTo(8, 3); ctx.closePath(); ctx.fill()
            // Thân
            ctx.beginPath(); ctx.ellipse(0, 0, 5, 4, 0, 0, Math.PI * 2); ctx.fill()
            // Mắt đỏ
            ctx.fillStyle = '#ff3030'
            ctx.fillRect(-3, -2, 2, 2); ctx.fillRect(1, -2, 2, 2)
            ctx.restore()
            _drawHP(ctx, m, 18)
        }
    },
    // --- ORC: chậm, HP cao, sát thương lớn, xuất hiện wave 4+ ---
    orc: {
        name: 'Orc', hp: 80, spd: 0.95, dmg: 18, detectR: 110, atkCd: 60,
        w: 16, h: 18, score: 40,
        draw(ctx, m, t) {
            const stride = Math.sin(t * .08 + m.id) * 2    // lắc lư khi đi
            ctx.save(); ctx.translate(m.x, m.y + stride)
            ctx.fillStyle = m.hurtFlash > 0 ? '#fff' : '#c03020'
            ctx.fillRect(-7, -10, 14, 18)               // thân to
            ctx.beginPath(); ctx.arc(0, -14, 7, 0, Math.PI * 2); ctx.fill()   // đầu
            ctx.fillStyle = m.hurtFlash > 0 ? '#fff' : '#8a2010'
            // Sừng
            ctx.beginPath(); ctx.moveTo(-6, -20); ctx.lineTo(-10, -28); ctx.lineTo(-2, -20); ctx.fill()
            ctx.beginPath(); ctx.moveTo(6, -20); ctx.lineTo(10, -28); ctx.lineTo(2, -20); ctx.fill()
            ctx.fillStyle = '#ffff00'
            ctx.fillRect(-4, -16, 3, 3); ctx.fillRect(1, -16, 3, 3)    // mắt vàng
            ctx.restore()
            _drawHP(ctx, m, 24)
        }
    },
    // --- BOSS GOBLIN: lớn, xuất hiện wave 7+ ---
    goblin: {
        name: 'Goblin Boss', hp: 200, spd: 1.1, dmg: 25, detectR: 180, atkCd: 50,
        w: 20, h: 22, score: 100,
        draw(ctx, m, t) {
            const bob = Math.sin(t * .04 + m.id) * 1.5
            ctx.save(); ctx.translate(m.x, m.y + bob)
            ctx.fillStyle = m.hurtFlash > 0 ? '#fff' : '#285020'
            ctx.fillRect(-9, -12, 18, 22)
            ctx.beginPath(); ctx.arc(0, -16, 10, 0, Math.PI * 2); ctx.fill()
            // Mũ
            ctx.fillStyle = m.hurtFlash > 0 ? '#fff' : '#1a3010'
            ctx.fillRect(-8, -26, 16, 8)
            ctx.fillRect(-4, -30, 8, 6)
            // Mắt phát sáng
            ctx.fillStyle = m.hurtFlash > 0 ? '#f00' : '#ffaa00'
            ctx.beginPath(); ctx.arc(-4, -16, 3, 0, Math.PI * 2); ctx.fill()
            ctx.beginPath(); ctx.arc(4, -16, 3, 0, Math.PI * 2); ctx.fill()
            ctx.restore()
            _drawHP(ctx, m, 32)
        }
    },
}

// ============================================================
//  SPAWN QUÁI VẬT
//  Quy tắc:
//   • Wave N spawn = 3 + N*2 quái (tăng dần)
//   • Các loại mở khóa: Slime W1, Dơi W2, Orc W4, Goblin W7
//   • Mỗi lần spawn 1 con, cách nhau 18 frame (~0.3s)
//   • Vị trí spawn: ô trống, cách người chơi > 160px
//   • Số quái tối đa đồng thời = 6 + wave*2
// ============================================================
function getSpawnTypes() {
    const t = ['slime']
    if (wave >= 2) t.push('bat')
    if (wave >= 4) t.push('orc')
    if (wave >= 7) t.push('goblin')
    return t
}
const maxMobs = () => Math.min(6 + wave * 2, 30)

function trySpawn() {
    if (spawnQ <= 0 || --spawnTmr > 0) return
    if (monsters.length >= maxMobs()) { spawnTmr = 30; return }  // chờ nếu đầy

    const types = getSpawnTypes()
    const type = types[Math.floor(Math.random() * types.length)]

    // Tìm vị trí hợp lệ (tối đa 30 lần thử)
    for (let tries = 30; tries > 0; tries--) {
        const sc = 2 + Math.floor(Math.random() * (MCOLS - 4))
        const sr = 2 + Math.floor(Math.random() * (MROWS - 4))
        if (MAP[sr][sc] !== 0 && MAP[sr][sc] !== 1) continue  // phải là ô có thể đứng
        const sx = (sc + .5) * TILE, sy = (sr + .5) * TILE
        if (dist(sx, sy, player.x, player.y) < 160) continue  // quá gần người chơi

        const def = M_TYPES[type]
        monsters.push({
            id: mIdCnt++, type, x: sx, y: sy,
            hp: def.hp, maxHp: def.hp,
            state: 'idle',
            idleTmr: 20 + Math.floor(Math.random() * 40),  // delay ngẫu nhiên trước khi đuổi
            atkTmr: 0, hurtFlash: 0,
            vx: 0, vy: 0,
        })
        spawnQ--
        spawnTmr = 18  // delay 18 frame giữa các lần spawn

        // Hiệu ứng xuất hiện
        mkParticles(sx, sy, '#88ff88', 6)
        return
    }
    spawnTmr = 10  // không tìm được vị trí → thử lại sau 10 frame
}

function startWave() {
    spawnQ = 3 + wave * 2           // số quái wave này
    spawnBurst = spawnQ
    spawnTmr = 0
    mkFloat(player.x, player.y - 36, `⚡ WAVE ${wave}`, '#f0c040', 130, 14)
    document.getElementById('ui-wave').textContent = '🌊 Wave ' + wave
}

// ============================================================
//  DAMAGE KHI ĐẶC SÁT (quái bị đánh)
// ============================================================
function hitMonster(m, dmg) {
    const def = M_TYPES[m.type]
    m.hp -= dmg; m.hurtFlash = 12; m.state = 'chase'
    dmgText(m.x, m.y, dmg)
    mkParticles(m.x, m.y, def.color, 4)
    if (m.hp <= 0) {
        mkParticles(m.x, m.y, def.color, 12)
        kills++; score += def.score
        document.getElementById('ui-kill').textContent = '☠ Kills: ' + kills
    }

    // AoE staff: knockback quái xung quanh
    const w = WEAPONS[player.weapon]
    if (w.aoe) {
        monsters.forEach(nb => {
            if (nb.id === m.id) return
            const d = dist(m.x, m.y, nb.x, nb.y)
            if (d < w.aoe) {
                const fx = (nb.x - m.x) / (d || 1), fy = (nb.y - m.y) / (d || 1)
                nb.vx += fx * 8; nb.vy += fy * 8
            }
        })
        mkParticles(m.x, m.y, w.color, 8)
    }
}

// ============================================================
//  VẼ QUÁI, ĐẠN, PARTICLES
// ============================================================
function drawMonsters() {
    monsters.forEach(m => M_TYPES[m.type].draw(ctx, m, fc))
}

function drawProjectiles() {
    projectiles.forEach(p => {
        ctx.save()
        if (p.type === 'bow') {
            // Mũi tên: đường thẳng theo hướng bay
            const ang = Math.atan2(p.vy, p.vx)
            ctx.strokeStyle = '#c8a060'; ctx.lineWidth = 2; ctx.lineCap = 'round'
            ctx.beginPath()
            ctx.moveTo(p.x - Math.cos(ang) * 7, p.y - Math.sin(ang) * 7)
            ctx.lineTo(p.x + Math.cos(ang) * 7, p.y + Math.sin(ang) * 7)
            ctx.stroke()
            ctx.fillStyle = '#a08040'
            ctx.beginPath(); ctx.arc(p.x + Math.cos(ang) * 7, p.y + Math.sin(ang) * 7, 2.5, 0, Math.PI * 2); ctx.fill()
        } else {
            // Đạn phép: hình cầu phát sáng (vòng + lõi trắng)
            ctx.fillStyle = p.color
            ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill()
            ctx.fillStyle = '#fff'
            ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fill()
            // Trail mờ dần
            ctx.globalAlpha = .25; ctx.fillStyle = p.color
            ctx.beginPath(); ctx.arc(p.x - p.vx * 3, p.y - p.vy * 3, 4, 0, Math.PI * 2); ctx.fill()
            ctx.globalAlpha = 1
        }
        ctx.restore()
    })
}

function drawParticles() {
    particles.forEach(p => {
        ctx.globalAlpha = Math.min(1, p.life / 20)
        ctx.fillStyle = p.color
        ctx.fillRect(p.x - p.sz / 2, p.y - p.sz / 2, p.sz, p.sz)
    })
    ctx.globalAlpha = 1
}


// ============================================================
//  VŨ KHÍ
//  proj=true  → bắn đạn (ranged)
//  proj=false → cận chiến (melee), range = tầm hitbox (pixel)
// ============================================================
const WEAPONS = {
    fist: { name: 'Tay không', dmg: 8, range: 22, cd: 20, anim: 12, proj: false, color: '#f5c87a', icon: '✊' },
    sword: { name: 'Kiếm', dmg: 22, range: 34, cd: 30, anim: 14, proj: false, color: '#a8d8ff', icon: '⚔', kb: 5 },
    bow: { name: 'Cung', dmg: 18, range: 0, cd: 42, anim: 20, proj: true, color: '#c8a060', icon: '🏹', pspd: 6, prange: 220 },
    staff: { name: 'Gậy', dmg: 14, range: 38, cd: 36, anim: 18, proj: false, color: '#b080ff', icon: '🪄', kb: 10, aoe: 48 },
    wand: { name: 'Trượng', dmg: 30, range: 0, cd: 55, anim: 16, proj: true, color: '#ff80ff', icon: '⭐', pspd: 4, prange: 200, homing: true },
}

// ============================================================
//  NGƯỜI CHƠI
// ============================================================
const player = {
    x: 5 * TILE, y: 5 * TILE,   // vị trí thế giới (pixel)
    w: 12, h: 14,              // kích thước hitbox
    speed: 1.3,
    dir: 'down',             // hướng nhìn: 'up'|'down'|'left'|'right'
    hp: 100, maxHp: 100,
    weapon: 'fist',           // vũ khí hiện tại
    step: 0, stepTimer: 0,     // bước chân animation
    atkAnim: 0,               // frame animation tấn công còn lại (đếm xuống)
    atkCd: 0,                 // frame hồi chiêu còn lại
    atkHit: new Set(),        // ID quái đã bị damage trong swing này (tránh multi-hit)
    hurtFlash: 0,             // nhấp nháy khi bị đánh
    invincible: 0,            // khung bất tử ngắn sau khi bị đánh (iframe)
}


// ============================================================
//  TẤN CÔNG
// ============================================================
function tryAttack() {
    if (gameOver || player.atkCd > 0) return
    const w = WEAPONS[player.weapon]
    player.atkAnim = w.anim
    player.atkCd = w.cd
    player.atkHit.clear()

    if (w.proj) {
        // Ranged: tạo đạn bay về hướng nhìn
        const dvec = { right: [1, 0], left: [-1, 0], down: [0, 1], up: [0, -1] }[player.dir]
        projectiles.push({
            x: player.x + dvec[0] * 12, y: player.y + dvec[1] * 12,
            vx: dvec[0] * w.pspd, vy: dvec[1] * w.pspd,
            dmg: w.dmg, distLeft: w.prange,
            type: player.weapon, homing: !!w.homing,
            color: w.color, owner: 'player',
        })
    }
}

// ============================================================
//  VẼ STICKMAN (người chơi)
// ============================================================
function drawPlayer() {
    const { x, y, dir, step, atkAnim, hurtFlash, weapon } = player
    const w = WEAPONS[weapon]
    const ls = [0, 4, 0, -4][step]    // swing chân
    const as = [0, -4, 0, 4][step]    // swing tay
    const atkPct = atkAnim / w.anim  // tỉ lệ animation tấn công

    ctx.save()
    ctx.translate(x, y)

    // Nhấp nháy trắng khi bị đánh
    if (hurtFlash > 0 && Math.floor(hurtFlash / 4) % 2 === 0) {
        ctx.globalAlpha = .35; ctx.fillStyle = '#ff8888'
        ctx.fillRect(-10, -22, 20, 28); ctx.globalAlpha = 1
    }

    // Bóng đổ
    ctx.fillStyle = 'rgba(0,0,0,.22)'
    ctx.beginPath(); ctx.ellipse(0, 10, 6, 3, 0, 0, Math.PI * 2); ctx.fill()

    // Vũ khí (vẽ trước thân nếu hướng right/down)
    if (weapon !== 'fist') drawWeapon(ctx, dir, weapon, atkPct, w)

    ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.lineCap = 'round'

    // Đầu
    ctx.fillStyle = hurtFlash > 0 ? '#ffaaaa' : '#f5c87a'
    ctx.beginPath(); ctx.arc(0, -12, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
    // Mắt theo hướng
    ctx.fillStyle = '#222'
    if (dir === 'right') ctx.fillRect(2, -14, 2, 2)
    else if (dir === 'left') ctx.fillRect(-4, -14, 2, 2)
    else if (dir === 'down') { ctx.fillRect(-2, -13, 2, 2); ctx.fillRect(1, -13, 2, 2) }
    else { ctx.fillStyle = '#dda85a'; ctx.fillRect(-4, -17, 8, 4) }

    // Thân áo
    ctx.strokeStyle = '#e06030'; ctx.lineWidth = 3
    ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(0, 2); ctx.stroke()

    // Tay (với animation tấn công)
    let lax = -6, lay = 1 + as, rax = 6, ray = 1 - as
    if (atkAnim > 0 && !w.proj) {
        const reach = atkPct * 16
        if (dir === 'right') { rax = 6 + reach; ray = 0 }
        else if (dir === 'left') { lax = -6 - reach; lay = 0 }
        else if (dir === 'down') { lax = -5; lay = 5 + reach * .5; rax = 5; ray = 5 + reach * .5 }
        else { lax = -5; lay = -6 - reach * .5; rax = 5; ray = -6 - reach * .5 }
    }
    ctx.strokeStyle = '#f5c87a'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(-1, -5); ctx.lineTo(lax, lay); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(1, -5); ctx.lineTo(rax, ray); ctx.stroke()

    // Chân
    ctx.strokeStyle = '#3060a0'; ctx.lineWidth = 2.5
    ctx.beginPath(); ctx.moveTo(-1, 2); ctx.lineTo(-4 + ls, 9); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(1, 2); ctx.lineTo(4 - ls, 9); ctx.stroke()

    ctx.restore()
}

// Vẽ sprite vũ khí theo loại và hướng
function drawWeapon(ctx, dir, wpn, atkPct, wDef) {
    const angles = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 }
    ctx.save()
    ctx.rotate(angles[dir])
    const off = 4 + (wDef.proj ? 0 : atkPct * wDef.range * .65)   // vươn ra khi đang swing

    ctx.strokeStyle = wDef.color; ctx.fillStyle = wDef.color; ctx.lineCap = 'round'

    if (wpn === 'sword') {
        ctx.lineWidth = 2.5
        ctx.beginPath(); ctx.moveTo(off, 0); ctx.lineTo(off + 30, 0); ctx.stroke()  // lưỡi
        ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.moveTo(off + 22, -6); ctx.lineTo(off + 22, 6); ctx.stroke()  // guard
        ctx.fillRect(off + 28, -2, 5, 4)  // đầu nhọn
    } else if (wpn === 'staff') {
        ctx.lineWidth = 3.5; ctx.strokeStyle = '#c09060'
        ctx.beginPath(); ctx.moveTo(off, 0); ctx.lineTo(off + 36, 0); ctx.stroke()
        ctx.fillStyle = wDef.color
        ctx.beginPath(); ctx.arc(off + 39, 0, 5, 0, Math.PI * 2); ctx.fill()  // đầu phát sáng
        ctx.fillStyle = '#ffffff55'
        ctx.beginPath(); ctx.arc(off + 39, 0, 2, 0, Math.PI * 2); ctx.fill()
    } else if (wpn === 'bow') {
        ctx.lineWidth = 2; ctx.strokeStyle = wDef.color
        ctx.beginPath(); ctx.arc(off + 8, 0, 11, Math.PI * .5, Math.PI * 1.5); ctx.stroke()
        ctx.lineWidth = 1; ctx.strokeStyle = '#c8a060'
        ctx.beginPath(); ctx.moveTo(off + 8, -11); ctx.lineTo(off + 8, 11); ctx.stroke()
        // Mũi tên sẵn sàng
        ctx.strokeStyle = '#a08040'; ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.moveTo(off + 6, 0); ctx.lineTo(off + 20, 0); ctx.stroke()
    } else if (wpn === 'wand') {
        ctx.lineWidth = 2; ctx.strokeStyle = '#c060ff'
        ctx.beginPath(); ctx.moveTo(off, 0); ctx.lineTo(off + 20, 0); ctx.stroke()
        // Ngôi sao ở đầu (5 nhánh)
        for (let i = 0; i < 5; i++) {
            const a = i * Math.PI * 2 / 5 - Math.PI / 2
            ctx.beginPath(); ctx.strokeStyle = wDef.color; ctx.lineWidth = 1.5
            ctx.moveTo(off + 22 + Math.cos(a) * 6, Math.sin(a) * 6)
            ctx.lineTo(off + 22 + Math.cos(a + Math.PI / 5) * 2.5, Math.sin(a + Math.PI / 5) * 2.5)
            ctx.stroke()
        }
    }
    ctx.restore()
}

// Attach in mouse click
function attackToward(cx, cy) {
    if (player.atkCd > 0) return;

    const w = WEAPONS[player.weapon];

    // Tọa độ tấn công trong thế giới
    const wx = cam.x + cx;
    const wy = cam.y + cy;

    // vector hướng
    const dx = wx - player.x;
    const dy = wy - player.y;
    const distToClick = Math.hypot(dx, dy);

    // cập nhật hướng nhìn
    if (Math.abs(dx) > Math.abs(dy))
        player.dir = dx > 0 ? 'right' : 'left';
    else
        player.dir = dy > 0 ? 'down' : 'up';

    player.atkAnim = w.anim;
    player.atkCd = w.cd;
    player.atkHit.clear();

    // ---------------------------------------------------
    // 1) Vũ khí tầm xa → tạo đạn bay về vị trí click
    // ---------------------------------------------------
    if (w.proj) {
        const sp = Math.hypot(dx, dy);
        const vx = dx / sp * w.pspd;
        const vy = dy / sp * w.pspd;

        projectiles.push({
            x: player.x,
            y: player.y,
            vx, vy,
            dmg: w.dmg,
            distLeft: w.prange,
            type: player.weapon,
            homing: w.homing || false,
            color: w.color,
            owner: 'player',
            tx: wx,
            ty: wy
        });

        return;
    }

    // ---------------------------------------------------
    // 2) Vũ khí cận chiến → tạo hitbox tại vị trí click
    // ---------------------------------------------------
    let range = w.range;

    let tx = player.x + dx;
    let ty = player.y + dy;

    // nếu ngoài tầm → thu lại đúng tầm
    if (distToClick > range) {
        const ratio = range / distToClick;
        tx = player.x + dx * ratio;
        ty = player.y + dy * ratio;
    }

    // tạo hitbox melee theo hướng click
    const hb = {
        x: tx - 10,
        y: ty - 10,
        w: 20,
        h: 20
    };

    // Kiểm tra trúng quái
    monsters.forEach(m => {
        if (player.atkHit.has(m.id)) return;

        const def = M_TYPES[m.type];
        if (rectHit(hb.x, hb.y, hb.w, hb.h,
            m.x - def.w / 2, m.y - def.h / 2, def.w, def.h)) {
            hitMonster(m, w.dmg);
            player.atkHit.add(m.id);
        }
    });
}
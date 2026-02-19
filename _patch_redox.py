import sys, re

NEW_REDOX = r'''function initRedoxSim(engine, controlsContainer, overlayEl) {
    engine.setUpdate(() => {});
    const rxCanvas = make2DCanvas(engine, 'rxCanvas', '#0d1117');
    const ctx = rxCanvas.getContext('2d');

    // ─── Palette ─────────────────────────────────────────────────────────────
    const P = {
        mn:  { f:'#2d0045', b:'#e879f9', t:'#f0abfc' },
        fe:  { f:'#431407', b:'#f97316', t:'#fed7aa' },
        cr:  { f:'#1a2800', b:'#a3e635', t:'#d9f99d' },
        h2o: { f:'#082030', b:'#38bdf8', t:'#bae6fd' },
        Hp:  { f:'#052e16', b:'#34d399', t:'#a7f3d0' },
        elec:{ f:'#1e1b4b', b:'#818cf8', t:'#c7d2fe' },
        neu: { f:'#1e293b', b:'#475569', t:'#94a3b8' },
        zn:  { f:'#172554', b:'#60a5fa', t:'#bfdbfe' },
        i:   { f:'#2d1657', b:'#c084fc', t:'#e9d5ff' },
        co2: { f:'#1c1917', b:'#fb923c', t:'#fed7aa' },
        new_hi:{ f:'#1c1400', b:'#fbbf24', t:'#fde68a' }, // incoming species
    };

    // ─── Formula renderer ─────────────────────────────────────────────────────
    // spec = [ {txt, mode:'n'|'sub'|'sup'}, ... ]
    function formulaWidth(spec, baseSize) {
        let w = 0;
        spec.forEach(s => {
            ctx.font = (s.mode==='n' ? `bold ${baseSize}px` : `bold ${Math.round(baseSize*0.65)}px`) + ' monospace';
            w += ctx.measureText(s.txt).width + (s.mode==='n' ? 0.5 : 0);
        });
        return w;
    }
    function drawFormula(spec, cx, cy, baseSize, col, alpha) {
        const tw = formulaWidth(spec, baseSize);
        let xp = cx - tw / 2;
        ctx.globalAlpha = alpha;
        spec.forEach(s => {
            const sz   = s.mode==='n' ? baseSize : Math.round(baseSize * 0.65);
            const yOff = s.mode==='sub' ? baseSize*0.35 : s.mode==='sup' ? -baseSize*0.45 : 0;
            ctx.font   = `bold ${sz}px monospace`;
            ctx.fillStyle = col;
            ctx.textAlign = 'left';
            ctx.fillText(s.txt, xp, cy + yOff);
            xp += ctx.measureText(s.txt).width + (s.mode==='n' ? 0.5 : 0);
        });
        ctx.globalAlpha = 1;
    }
    function parseFormula(raw) {
        // raw like 'MnO4', 'Fe2+', '5Fe', 'H2O', 'e-'
        const tokens = [];
        let i = 0;
        while (i < raw.length) {
            const ch = raw[i];
            if (ch >= '1' && ch <= '9' && tokens.length === 0) {
                let num = '';
                while (i < raw.length && raw[i] >= '0' && raw[i] <= '9') num += raw[i++];
                tokens.push({txt: num, mode:'n'});
            } else if (ch >= 'A' && ch <= 'Z') {
                let sym = ch; i++;
                while (i < raw.length && raw[i] >= 'a' && raw[i] <= 'z') sym += raw[i++];
                tokens.push({txt: sym, mode:'n'});
            } else if (ch >= '0' && ch <= '9') {
                let num = '';
                while (i < raw.length && raw[i] >= '0' && raw[i] <= '9') num += raw[i++];
                tokens.push({txt: num, mode:'sub'});
            } else if (ch === '^') {
                i++;
                let sup = '';
                while (i < raw.length && raw[i] !== ' ') sup += raw[i++];
                tokens.push({txt: sup, mode:'sup'});
            } else if (ch === '+' || ch === '-') {
                tokens.push({txt: ch, mode:'sup'}); i++;
            } else { i++; }
        }
        return tokens;
    }

    // ─── Species chip ─────────────────────────────────────────────────────────
    // sp = { raw:'MnO4', sup:'-', ck:'mn', coeff:1, x,y, alpha, scale, glow }
    function chipW(sp, fs) {
        const spec = parseFormula((sp.coeff>1?sp.coeff.toString():'')+sp.raw+(sp.sup||''));
        return formulaWidth(spec, fs) + 28;
    }
    function drawChip(sp, fs, glow) {
        const spec = parseFormula((sp.coeff>1?sp.coeff.toString():'')+sp.raw+(sp.sup||''));
        const pal  = P[sp.ck] || P.neu;
        const w    = formulaWidth(spec, fs) + 28;
        const h    = fs * 2;
        ctx.save();
        ctx.translate(sp.x, sp.y);
        ctx.scale(sp.scale||1, sp.scale||1);
        if (glow || sp.glow) {
            ctx.shadowBlur  = 18;
            ctx.shadowColor = pal.b;
        }
        ctx.globalAlpha = sp.alpha || 1;
        ctx.fillStyle   = pal.f;
        ctx.strokeStyle = pal.b;
        ctx.lineWidth   = 2.2;
        ctx.beginPath(); ctx.roundRect(-w/2, -h/2, w, h, 9);
        ctx.fill(); ctx.stroke();
        ctx.shadowBlur = 0;
        drawFormula(spec, 0, fs*0.18, fs, pal.t, sp.alpha || 1);
        ctx.restore();
    }

    // ─── Particle system ─────────────────────────────────────────────────────
    let particles = [];
    function spawnElectrons(n, fromX, fromY, toX, toY) {
        for (let i=0; i<n; i++) {
            const delay = i * 8;
            particles.push({ type:'elec', delay, t:0, x:fromX, y:fromY, tx:toX, ty:toY,
                             alpha:0, trail:[] });
        }
    }
    function spawnAtomPop(x, y, text, color) {
        particles.push({ type:'pop', t:0, x, y, text, color, alpha:1, vy:-1.5 });
    }
    function updateParticles() {
        particles = particles.filter(p => p.alpha > 0);
        particles.forEach(p => {
            if (p.type === 'elec') {
                if (p.delay > 0) { p.delay--; return; }
                p.t++;
                const prog = Math.min(p.t / 55, 1);
                const ease = prog < 0.5 ? 2*prog*prog : -1+(4-2*prog)*prog;
                p.x = p.x + (p.tx - p.x) * 0.065;
                p.y = p.y + (p.ty - p.y) * 0.065 - Math.sin(prog*Math.PI)*35;
                p.alpha = prog < 0.85 ? 1 : 1 - (prog-0.85)/0.15;
                p.trail.push({x:p.x, y:p.y});
                if (p.trail.length > 8) p.trail.shift();
            } else if (p.type === 'pop') {
                p.t++; p.y += p.vy; p.vy *= 0.95;
                p.alpha = Math.max(0, 1 - p.t/55);
            }
        });
    }
    function drawParticles() {
        particles.forEach(p => {
            if (p.type === 'elec') {
                if (p.delay > 0) return;
                // trail
                p.trail.forEach((pt, i) => {
                    ctx.beginPath(); ctx.arc(pt.x, pt.y, 3, 0, Math.PI*2);
                    ctx.fillStyle = `rgba(129,140,248,${p.alpha*(i/p.trail.length)*0.4})`; ctx.fill();
                });
                ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI*2);
                ctx.shadowBlur=12; ctx.shadowColor='#818cf8';
                ctx.fillStyle=`rgba(129,140,248,${p.alpha})`; ctx.fill();
                ctx.shadowBlur=0;
                ctx.fillStyle=`rgba(199,210,254,${p.alpha})`; ctx.font='bold 8px monospace';
                ctx.textAlign='center'; ctx.fillText('e\u207b', p.x, p.y-8);
            } else if (p.type === 'pop') {
                ctx.fillStyle = p.color.replace(')', `,${p.alpha})`).replace('rgb(','rgba(');
                ctx.font = 'bold 13px sans-serif'; ctx.textAlign='center';
                ctx.globalAlpha = p.alpha;
                ctx.fillText(p.text, p.x, p.y);
                ctx.globalAlpha = 1;
            }
        });
    }

    // ─── Atom counter visual ──────────────────────────────────────────────────
    function drawAtomCount(cx, y, W, H, elem, lhsN, rhsN, t, pal) {
        const eq = lhsN === rhsN;
        const boxW = Math.min(W*0.38, 220);
        const lx = cx - boxW - 28, rx = cx + 28;

        // element badge
        ctx.fillStyle = (pal||P.neu).f; ctx.strokeStyle = (pal||P.neu).b; ctx.lineWidth=2;
        ctx.beginPath(); ctx.roundRect(cx-22, y, 44, 34, 8); ctx.fill(); ctx.stroke();
        ctx.fillStyle=(pal||P.neu).t; ctx.font='bold 14px monospace'; ctx.textAlign='center';
        ctx.fillText(elem, cx, y+23);

        // lhs count
        ctx.fillStyle='#1e293b'; ctx.strokeStyle='#334155'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.roundRect(lx, y, boxW, 34, 8); ctx.fill(); ctx.stroke();
        ctx.fillStyle='#94a3b8'; ctx.font='11px sans-serif'; ctx.textAlign='center';
        ctx.fillText('LHS', lx+boxW/2, y+12);
        ctx.fillStyle=eq?'#4ade80':'#f87171'; ctx.font='bold 18px monospace';
        ctx.fillText(lhsN, lx+boxW/2, y+30);

        // rhs count
        ctx.fillStyle='#1e293b'; ctx.strokeStyle='#334155'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.roundRect(rx, y, boxW, 34, 8); ctx.fill(); ctx.stroke();
        ctx.fillStyle='#94a3b8'; ctx.font='11px sans-serif'; ctx.textAlign='center';
        ctx.fillText('RHS', rx+boxW/2, y+12);
        ctx.fillStyle=eq?'#4ade80':'#f87171'; ctx.font='bold 18px monospace';
        ctx.fillText(rhsN, rx+boxW/2, y+30);

        // equality
        const sym = eq ? '\u2713 Balanced!' : '\u2717 Imbalanced!';
        ctx.fillStyle = eq ? '#4ade80' : '#f87171';
        ctx.font = 'bold 12px sans-serif'; ctx.textAlign='center';
        ctx.fillText(sym, cx, y+55);
        if (!eq) {
            const diff = Math.abs(rhsN - lhsN);
            ctx.fillStyle='#fbbf24'; ctx.font='11px sans-serif';
            ctx.fillText(`Need ${diff} more on ${ lhsN < rhsN ? 'LHS' : 'RHS' }`, cx, y+72);
        }
    }

    // ─── Charge bar ───────────────────────────────────────────────────────────
    function drawChargeBar(cx, y, lhsQ, rhsQ) {
        ctx.fillStyle='#0f172a'; ctx.strokeStyle='#1e3a5f'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.roundRect(cx-220, y, 440, 52, 8); ctx.fill(); ctx.stroke();
        ctx.fillStyle='#64748b'; ctx.font='10px monospace'; ctx.textAlign='center';
        ctx.fillText('CHARGE BALANCE', cx, y+13);

        const lStr = `LHS: ${lhsQ>=0?'+':''}${lhsQ}`;
        const rStr = `RHS: ${rhsQ>=0?'+':''}${rhsQ}`;
        const eq   = lhsQ === rhsQ;

        ctx.fillStyle = eq ? '#4ade80' : '#f87171';
        ctx.font='bold 15px monospace'; ctx.textAlign='center';
        ctx.fillText(lStr, cx-100, y+36);
        ctx.fillStyle='#475569'; ctx.font='18px monospace';
        ctx.fillText('vs', cx, y+36);
        ctx.fillStyle = eq ? '#4ade80' : '#f87171';
        ctx.font='bold 15px monospace';
        ctx.fillText(rStr, cx+100, y+36);

        if (!eq) {
            const diff = Math.abs(rhsQ - lhsQ);
            ctx.fillStyle='#fbbf24'; ctx.font='11px sans-serif'; ctx.textAlign='center';
            ctx.fillText(`\u2192 Add ${diff}e\u207b to ${ lhsQ > rhsQ ? 'LHS' : 'RHS' }`, cx, y+68);
        }
    }

    // ─── Narration typewriter ─────────────────────────────────────────────────
    let _lastNarr = '', _typeIdx = 0;
    function drawNarration(text, t, W) {
        if (text !== _lastNarr) { _lastNarr = text; _typeIdx = 0; }
        _typeIdx = Math.min(text.length, _typeIdx + Math.ceil(text.length / 42));
        const shown = text.substring(0, _typeIdx);
        ctx.fillStyle='#0d1f30'; ctx.strokeStyle='#1e3f5f'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.roundRect(12, 8, W-24, 58, 10); ctx.fill(); ctx.stroke();
        ctx.fillStyle='#60a5fa'; ctx.font='bold 9px monospace'; ctx.textAlign='left';
        ctx.fillText('\u25b6 NARRATOR', 24, 24);
        ctx.fillStyle='#e2e8f0'; ctx.font='12.5px sans-serif';
        // word wrap at 80 chars per line
        const words = shown.split(' ');
        let line='', lines=[], maxW = W-52;
        words.forEach(w => {
            const test = line ? line+' '+w : w;
            if (ctx.measureText(test).width > maxW && line) { lines.push(line); line=w; }
            else line = test;
        });
        if (line) lines.push(line);
        lines.slice(0,3).forEach((l,i) => ctx.fillText(l, 24, 38+i*16));
    }

    // ─── Equation row renderer ────────────────────────────────────────────────
    // items = [ {raw, sup, ck, coeff, x, y, alpha, scale, glow}, ... ]
    // returns list with computed x positions
    function layoutEqRow(items, cx, y, fs, W) {
        // compute total width
        let total = 0;
        items.forEach((sp,i) => { total += chipW(sp, fs) + (i>0?38:0); });
        let xp = cx - total/2;
        return items.map((sp,i) => {
            const w = chipW(sp, fs);
            if (i>0) xp += 38;
            const out = Object.assign({}, sp, { x: xp + w/2, y });
            xp += w;
            return out;
        });
    }

    // "+" operator
    function drawPlus(x, y, alpha) {
        ctx.globalAlpha = alpha||1;
        ctx.fillStyle='#475569'; ctx.font=`bold 22px sans-serif`; ctx.textAlign='center';
        ctx.fillText('+', x, y+7); ctx.globalAlpha=1;
    }
    // Arrow
    function drawArrow(x, y, W, alpha) {
        ctx.globalAlpha = alpha||1;
        ctx.strokeStyle='#22d3ee'; ctx.lineWidth=3;
        ctx.beginPath(); ctx.moveTo(x-32, y); ctx.lineTo(x+32, y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x+20, y-8); ctx.lineTo(x+32, y); ctx.lineTo(x+20, y+8); ctx.stroke();
        ctx.globalAlpha=1;
    }

    // Full equation draw helper
    // eq = { lhs:[sp,...], rhs:[sp,...] }
    function drawEquation(eq, cy, W, FS, tOff) {
        // compute lhs block & rhs block, center arrow at W/2
        const lhsLaid = layoutEqRow(eq.lhs, W*0.27, cy, FS, W);
        const rhsLaid = layoutEqRow(eq.rhs, W*0.73, cy, FS, W);
        drawArrow(W*0.5, cy, W, 1);

        // draw "+" between species
        let prevEnd = null;
        lhsLaid.forEach((sp, i) => {
            if (i>0) drawPlus(sp.x - chipW(sp,FS)/2 - 16, cy, sp.alpha||1);
            drawChip({...sp, x: sp.x + (sp._dx||0)}, FS, sp.glow);
        });
        rhsLaid.forEach((sp, i) => {
            if (i>0) drawPlus(sp.x - chipW(sp,FS)/2 - 16, cy, sp.alpha||1);
            drawChip({...sp, x: sp.x + (sp._dx||0)}, FS, sp.glow);
        });
    }

    // ─── Slides for MnO4 + Fe -> Mn + Fe (acidic) ────────────────────────────
    const MN = (c,ck,r,s) => ({coeff:c||1, raw:r, sup:s||'', ck:ck||'mn'});
    const FE = (c) => ({coeff:c||1, raw:'Fe', sup:'2+', ck:'fe'});
    const FE3= (c) => ({coeff:c||1, raw:'Fe', sup:'3+', ck:'fe'});
    const MNO4 = () => ({coeff:1, raw:'MnO4', sup:'\u2212', ck:'mn'});
    const MN2  = () => ({coeff:1, raw:'Mn',   sup:'2+',  ck:'mn'});
    const H2O  = (c) => ({coeff:c||1, raw:'H2O', sup:'', ck:'h2o'});
    const HP   = (c) => ({coeff:c||1, raw:'H',   sup:'+', ck:'Hp'});
    const ELEC = (c) => ({coeff:c||1, raw:'e',   sup:'\u2212', ck:'elec'});

    const REACTIONS = [
      {
        label: 'MnO\u2084\u207b + Fe\u00b2\u207a \u2192 Mn\u00b2\u207a + Fe\u00b3\u207a',
        shortLabel: 'Permanganate\u002BIron',
        slides: [
          { narr: 'Welcome! Today we are balancing a classic redox reaction in acidic medium. Here is the unbalanced equation. Our job is to make atoms AND charge equal on both sides.',
            eq: { lhs:[MNO4(), FE(1)], rhs:[MN2(), FE3(1)] },
            sub: null },

          { narr: 'Step 1 \u2014 Find what is being oxidised and reduced. Look at Manganese: Mn goes from +7 in MnO\u2084\u207b to +2. It GAINS 5 electrons \u2014 this is REDUCTION. Iron goes from +2 to +3 \u2014 it LOSES 1 electron. That is OXIDATION.',
            eq: { lhs:[{...MNO4(),glow:true}, FE(1)], rhs:[{...MN2(),glow:true}, FE3(1)] },
            oxStates: [ {sp:'Mn', from:'+7', to:'+2', type:'red'}, {sp:'Fe', from:'+2', to:'+3', type:'ox'} ],
            sub: null },

          { narr: 'Step 2 \u2014 Write the OXIDATION half-reaction first. Iron loses 1 electron. We split the overall reaction into two half-reactions so we can balance each separately.',
            halfTitle: 'Oxidation Half-Reaction',
            eq: { lhs:[FE(1)], rhs:[FE3(1), ELEC(1)] },
            sub: null },

          { narr: 'Step 3 \u2014 Now the REDUCTION half-reaction. Manganese starts as MnO\u2084\u207b and becomes Mn\u00b2\u207a. Count the oxygen atoms \u2014 there are 4 on the left and 0 on the right. IMBALANCED!',
            halfTitle: 'Reduction Half-Reaction \u2014 Balance atoms first',
            eq: { lhs:[MNO4()], rhs:[MN2()] },
            atomCount: { elem:'O', pal:'h2o', lhsN:4, rhsN:0 },
            sub: null },

          { narr: 'To balance 4 oxygen atoms, we add 4 H\u2082O molecules to the RIGHT side. Watch them fly in! Oxygen is now balanced: 4 on each side.',
            halfTitle: 'Add 4H\u2082O to balance oxygen \u2192',
            eq: { lhs:[MNO4()], rhs:[MN2(), {...H2O(4), glow:true, enterFrom:'right'}] },
            atomCount: { elem:'O', pal:'h2o', lhsN:4, rhsN:4 },
            sub: null },

          { narr: 'Now count Hydrogen. We added 4 H\u2082O, which gives us 8 H on the right. But the left has ZERO hydrogen. That is 8 hydrogen atoms out of nowhere \u2014 IMBALANCED!',
            halfTitle: 'Count hydrogen after adding H\u2082O',
            eq: { lhs:[MNO4()], rhs:[MN2(), H2O(4)] },
            atomCount: { elem:'H', pal:'Hp', lhsN:0, rhsN:8 },
            sub: null },

          { narr: 'Add 8 H\u207a ions to the LEFT to balance hydrogen. In acidic medium we use H\u207a. Watch them fly in from the left side! Hydrogen is now balanced.',
            halfTitle: '\u2190 Add 8H\u207a to balance hydrogen',
            eq: { lhs:[MNO4(), {...HP(8), glow:true, enterFrom:'left'}], rhs:[MN2(), H2O(4)] },
            atomCount: { elem:'H', pal:'Hp', lhsN:8, rhsN:8 },
            sub: null },

          { narr: 'All atoms are balanced! Now check the CHARGE. Left side: MnO\u2084\u207b is \u22121, and 8H\u207a is +8. Total LEFT charge = +7. Right side: Mn\u00b2\u207a is +2, water has 0 charge. Total RIGHT charge = +2.',
            halfTitle: 'Check charge balance',
            eq: { lhs:[MNO4(), HP(8)], rhs:[MN2(), H2O(4)] },
            chargeBar: { lhs:7, rhs:2 },
            sub: null },

          { narr: 'The left is +7 and right is +2. Difference = 5. We add 5 electrons to the LEFT to balance the charge. Watch the electrons fly across!',
            halfTitle: 'Add 5e\u207b to LEFT to balance charge',
            eq: { lhs:[MNO4(), HP(8), {...ELEC(5), glow:true, enterFrom:'left'}], rhs:[MN2(), H2O(4)] },
            chargeBar: { lhs:2, rhs:2 },
            spawnElec: true,
            sub: null },

          { narr: 'The Reduction half-reaction is now FULLY BALANCED. Both atoms AND charge are equal. MnO\u2084\u207b + 8H\u207a + 5e\u207b \u2192 Mn\u00b2\u207a + 4H\u2082O. Beautiful!',
            halfTitle: '\u2705 Reduction half-reaction BALANCED',
            eq: { lhs:[MNO4(), HP(8), ELEC(5)], rhs:[MN2(), H2O(4)] },
            celebrate: false,
            sub: null },

          { narr: 'Now combine both half-reactions. The oxidation had 1e\u207b, but reduction needs 5e\u207b. So we multiply the oxidation half-reaction by 5 to match electrons!',
            halfTitle: 'Scale oxidation \u00d75 to match electron count',
            eq: null,
            bothHalves: {
              ox: { lhs:[FE(5)],  rhs:[FE3(5), ELEC(5)], label:'Oxidation \u00d75:' },
              red:{ lhs:[MNO4(), HP(8), ELEC(5)], rhs:[MN2(), H2O(4)], label:'Reduction \u00d71:' }
            },
            sub: null },

          { narr: 'Add both half-reactions together and the 5 electrons cancel out from both sides. This gives us the final balanced equation!',
            halfTitle: 'Cancel electrons \u2014 Add half-reactions',
            eq: null,
            bothHalves: {
              ox: { lhs:[FE(5)],  rhs:[FE3(5)], label:'Oxidation:' },
              red:{ lhs:[MNO4(), HP(8)], rhs:[MN2(), H2O(4)], label:'Reduction:' },
              cancelNote: '5e\u207b cancel on both sides!'
            },
            sub: null },

          { narr: '\u2705 FINAL BALANCED EQUATION: MnO\u2084\u207b + 5Fe\u00b2\u207a + 8H\u207a \u2192 Mn\u00b2\u207a + 5Fe\u00b3\u207a + 4H\u2082O. Check: Mn\u2713 Fe\u2713 O\u2713 H\u2713 Charge\u2713. Perfectly balanced, as all things should be!',
            halfTitle: '\u2728 BALANCED EQUATION \u2728',
            eq: { lhs:[MNO4(), FE(5), HP(8)], rhs:[MN2(), FE3(5), H2O(4)] },
            celebrate: true,
            sub: null },
        ]
      },

      {
        label: 'Cr\u2082O\u2087\u00b2\u207b + I\u207b \u2192 Cr\u00b3\u207a + I\u2082',
        shortLabel: 'Dichromate+Iodide',
        slides: [
          { narr: 'Dichromate + Iodide redox in acidic medium. Cr\u2082O\u2087\u00b2\u207b is a powerful oxidising agent. Iodide I\u207b gets oxidised to I\u2082 gas.',
            eq: { lhs:[{coeff:1,raw:'Cr2O7',sup:'\u00b2\u207b',ck:'cr'}, {coeff:1,raw:'I',sup:'\u207b',ck:'i'}],
                  rhs:[{coeff:1,raw:'Cr',sup:'\u00b3\u207a',ck:'cr'}, {coeff:1,raw:'I2',sup:'',ck:'i'}] },
            sub: null },
          { narr: 'Oxidation states: Cr drops from +6 \u2192 +3 (REDUCTION, gains 3e\u207b per Cr, 6e\u207b total for Cr\u2082). Iodine goes from \u22121 \u2192 0 in I\u2082 (OXIDATION, loses 1e\u207b per I).',
            eq: { lhs:[{coeff:1,raw:'Cr2O7',sup:'\u00b2\u207b',ck:'cr',glow:true}, {coeff:1,raw:'I',sup:'\u207b',ck:'i'}],
                  rhs:[{coeff:1,raw:'Cr',sup:'\u00b3\u207a',ck:'cr'}, {coeff:1,raw:'I2',sup:'',ck:'i',glow:true}] },
            oxStates:[{sp:'Cr',from:'+6',to:'+3',type:'red'},{sp:'I',from:'\u22121',to:'0',type:'ox'}],
            sub: null },
          { narr: 'Oxidation: 2I\u207b \u2192 I\u2082 + 2e\u207b. The two iodide ions combine and release 2 electrons each time.',
            halfTitle: 'Oxidation: 2I\u207b \u2192 I\u2082 + 2e\u207b',
            eq: { lhs:[{coeff:2,raw:'I',sup:'\u207b',ck:'i'}], rhs:[{coeff:1,raw:'I2',sup:'',ck:'i'}, ELEC(2)] },
            sub: null },
          { narr: 'Reduction: Cr\u2082O\u2087\u00b2\u207b \u2192 2Cr\u00b3\u207a. Balance O with 7H\u2082O on right, then balance H with 14H\u207a on left, then add 6e\u207b. Full half-reaction: Cr\u2082O\u2087\u00b2\u207b + 14H\u207a + 6e\u207b \u2192 2Cr\u00b3\u207a + 7H\u2082O.',
            halfTitle: 'Reduction (fully balanced)',
            eq: { lhs:[{coeff:1,raw:'Cr2O7',sup:'\u00b2\u207b',ck:'cr'},{coeff:14,raw:'H',sup:'+',ck:'Hp'},ELEC(6)],
                  rhs:[{coeff:2,raw:'Cr',sup:'\u00b3\u207a',ck:'cr'},{coeff:7,raw:'H2O',sup:'',ck:'h2o'}] },
            sub: null },
          { narr: 'Scale oxidation \u00d73 so electrons match: 3\u00d7(2e\u207b)=6e\u207b = 6e\u207b from reduction. Then cancel electrons and add both half-reactions.',
            halfTitle: '\u2705 BALANCED: Cr\u2082O\u2087\u00b2\u207b + 6I\u207b + 14H\u207a \u2192 2Cr\u00b3\u207a + 3I\u2082 + 7H\u2082O',
            eq: { lhs:[{coeff:1,raw:'Cr2O7',sup:'\u00b2\u207b',ck:'cr'},{coeff:6,raw:'I',sup:'\u207b',ck:'i'},{coeff:14,raw:'H',sup:'+',ck:'Hp'}],
                  rhs:[{coeff:2,raw:'Cr',sup:'\u00b3\u207a',ck:'cr'},{coeff:3,raw:'I2',sup:'',ck:'i'},{coeff:7,raw:'H2O',sup:'',ck:'h2o'}] },
            celebrate: true,
            sub: null },
        ]
      },

      {
        label: 'Zn + H\u2082SO\u2084 \u2192 ZnSO\u2084 + H\u2082',
        shortLabel: 'Zinc+Dilute Acid',
        slides: [
          { narr: 'A simple displacement redox reaction. Zinc metal reacts with dilute sulphuric acid. Zinc is the reducing agent here \u2014 it loses electrons. Hydrogen ions gain electrons and form H\u2082 gas.',
            eq: { lhs:[{coeff:1,raw:'Zn',sup:'',ck:'zn'},{coeff:1,raw:'H2SO4',sup:'',ck:'Hp'}],
                  rhs:[{coeff:1,raw:'ZnSO4',sup:'',ck:'zn'},{coeff:1,raw:'H2',sup:'\u2191',ck:'Hp'}] },
            sub: null },
          { narr: 'Oxidation states: Zn goes 0 \u2192 +2 (loses 2e\u207b, OXIDATION). Hydrogen goes +1 \u2192 0 (gains 1e\u207b each, \u00d72 = REDUCTION). Sulphate spectator stays as SO\u2084\u00b2\u207b.',
            oxStates:[{sp:'Zn',from:'0',to:'+2',type:'ox'},{sp:'H',from:'+1',to:'0',type:'red'}],
            eq: { lhs:[{coeff:1,raw:'Zn',sup:'',ck:'zn',glow:true},{coeff:1,raw:'H2SO4',sup:'',ck:'Hp'}],
                  rhs:[{coeff:1,raw:'ZnSO4',sup:'',ck:'zn'},{coeff:1,raw:'H2',sup:'\u2191',ck:'Hp',glow:true}] },
            sub: null },
          { narr: 'Oxidation: Zn \u2192 Zn\u00b2\u207a + 2e\u207b. Reduction: 2H\u207a + 2e\u207b \u2192 H\u2082\u2191. Both half-reactions have exactly 2 electrons each \u2014 no scaling needed!',
            halfTitle: 'Half-reactions already balanced \u2014 add directly',
            bothHalves:{
              ox:{lhs:[{coeff:1,raw:'Zn',sup:'',ck:'zn'}],rhs:[{coeff:1,raw:'Zn',sup:'2+',ck:'zn'},ELEC(2)],label:'Oxidation:'},
              red:{lhs:[{coeff:2,raw:'H',sup:'+',ck:'Hp'},ELEC(2)],rhs:[{coeff:1,raw:'H2',sup:'\u2191',ck:'Hp'}],label:'Reduction:'},
            },
            sub: null },
          { narr: '\u2705 BALANCED! Zn + H\u2082SO\u2084 \u2192 ZnSO\u2084 + H\u2082\u2191. Atoms: Zn\u2713 H\u2713 S\u2713 O\u2713. Charge is balanced. The net ionic equation is Zn + 2H\u207a \u2192 Zn\u00b2\u207a + H\u2082\u2191.',
            halfTitle: '\u2728 BALANCED \u2728',
            eq: { lhs:[{coeff:1,raw:'Zn',sup:'',ck:'zn'},{coeff:1,raw:'H2SO4',sup:'',ck:'Hp'}],
                  rhs:[{coeff:1,raw:'ZnSO4',sup:'',ck:'zn'},{coeff:1,raw:'H2',sup:'\u2191',ck:'Hp'}] },
            celebrate: true,
            sub: null },
        ]
      },
    ];

    // ─── State ────────────────────────────────────────────────────────────────
    let rxIdx   = 0;
    let slideIdx= 0;
    let slideT  = 0;
    let transIn = 0;   // 0->60 on slide enter
    let confetti= [];
    let animId  = null;
    let prevSlideIdx = -1;

    // ─── Controls ─────────────────────────────────────────────────────────────
    controlsContainer.innerHTML = `
        <div class="game-panel sim-controls-panel">
            <div class="game-section-title">\u26a7\ufe0f Redox Balancing</div>
            <div class="sim-control-row">
                <label style="color:#a78bfa;font-weight:700;">Reaction</label>
                <select class="game-select" id="rxSel" style="margin-top:4px;">
                    ${REACTIONS.map((r,i)=>`<option value="${i}">${r.shortLabel}</option>`).join('')}
                </select>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px;">
                <button class="btn-primary" id="rxPrev" style="font-size:0.82rem;padding:7px;">\u25c0 Back</button>
                <button class="btn-primary" id="rxNext" style="font-size:0.82rem;padding:7px;background:#10b981;">Next \u25b6</button>
            </div>
            <button class="btn-primary sim-action-btn" id="rxReset" style="margin-top:6px;width:100%;"><i class="fas fa-redo"></i> Restart</button>
            <div class="sim-stat-card" style="margin-top:10px;border-left:3px solid #22d3ee;">
                <div class="sim-stat-label">Progress</div>
                <div class="sim-stat-value" id="rxProgress" style="font-size:0.78rem;">--</div>
            </div>
            <div class="sim-stat-card" style="margin-top:6px;border-left:3px solid #f59e0b;padding:8px;">
                <div class="sim-stat-label" style="margin-bottom:4px;">Step</div>
                <div style="font-size:0.72rem;color:#fbbf24;line-height:1.5;" id="rxStepHint"></div>
            </div>
        </div>`;

    function setRx(ri) {
        rxIdx=ri; slideIdx=0; slideT=0; transIn=0; particles=[]; confetti=[];
        _lastNarr=''; prevSlideIdx=-1;
        updateUI();
    }
    function updateUI() {
        const sl = REACTIONS[rxIdx].slides[slideIdx];
        const prog = document.getElementById('rxProgress');
        const hint = document.getElementById('rxStepHint');
        if (prog) prog.textContent = `Slide ${slideIdx+1} / ${REACTIONS[rxIdx].slides.length}`;
        if (hint) hint.textContent = sl.halfTitle || sl.narr.substring(0,80)+'...';
    }

    document.getElementById('rxSel').addEventListener('change', e => setRx(+e.target.value));
    document.getElementById('rxNext').addEventListener('click', () => {
        const mx = REACTIONS[rxIdx].slides.length-1;
        if (slideIdx<mx) { prevSlideIdx=slideIdx; slideIdx++; slideT=0; transIn=0; particles=[]; confetti=[]; _lastNarr=''; updateUI(); }
    });
    document.getElementById('rxPrev').addEventListener('click', () => {
        if (slideIdx>0) { prevSlideIdx=slideIdx; slideIdx--; slideT=0; transIn=0; particles=[]; confetti=[]; _lastNarr=''; updateUI(); }
    });
    document.getElementById('rxReset').addEventListener('click', () => setRx(rxIdx));

    // ─── Confetti ─────────────────────────────────────────────────────────────
    function spawnConfetti(W, H) {
        for (let i=0;i<60;i++) confetti.push({
            x: Math.random()*W, y: -10, vx:(Math.random()-0.5)*3,
            vy: 2+Math.random()*3, rot:Math.random()*Math.PI*2,
            vrot:(Math.random()-0.5)*0.15,
            col:['#a78bfa','#34d399','#fbbf24','#f87171','#38bdf8'][Math.floor(Math.random()*5)],
            w:6+Math.random()*6, h:3+Math.random()*4, alpha:1
        });
    }
    function updateDrawConfetti(H) {
        confetti.forEach(c => {
            c.x+=c.vx; c.y+=c.vy; c.rot+=c.vrot; c.alpha=Math.max(0,1-c.y/(H*1.1));
            ctx.save(); ctx.translate(c.x,c.y); ctx.rotate(c.rot); ctx.globalAlpha=c.alpha;
            ctx.fillStyle=c.col; ctx.fillRect(-c.w/2,-c.h/2,c.w,c.h); ctx.restore();
        });
        confetti=confetti.filter(c=>c.y<H+20);
    }

    // ─── Flying entity dx calculation ────────────────────────────────────────
    // Returns offset dx based on enterFrom and transIn (0->60 frames)
    function entryDx(enterFrom, transIn) {
        if (!enterFrom) return 0;
        const prog = Math.min(transIn/40, 1);
        const ease = 1 - Math.pow(1-prog, 3);
        if (enterFrom==='left')  return -(1-ease)*320;
        if (enterFrom==='right') return  (1-ease)*320;
        return 0;
    }
    function entryAlpha(enterFrom, transIn) {
        if (!enterFrom) return 1;
        return Math.min(1, transIn/25);
    }

    // ─── Oxidation state banner ───────────────────────────────────────────────
    function drawOxStateBanner(states, W, H, t) {
        const bW=120, bH=62, gap=20;
        const total = states.length*(bW+gap)-gap;
        let bx = W/2 - total/2;
        const by = H*0.55;
        states.forEach(s => {
            const isRed = s.type==='red';
            const bord = isRed ? '#22d3ee' : '#f97316';
            const fill = isRed ? '#082030' : '#450a00';
            ctx.fillStyle=fill; ctx.strokeStyle=bord; ctx.lineWidth=2;
            ctx.beginPath(); ctx.roundRect(bx,by,bW,bH,10); ctx.fill(); ctx.stroke();
            ctx.fillStyle=bord; ctx.font='bold 13px monospace'; ctx.textAlign='center';
            ctx.fillText(s.sp, bx+bW/2, by+20);
            ctx.fillStyle='#e2e8f0'; ctx.font='11px sans-serif';
            ctx.fillText(`${s.from} \u2192 ${s.to}`, bx+bW/2, by+37);
            ctx.fillStyle=bord; ctx.font='bold 10px sans-serif';
            ctx.fillText(isRed?'\u25bc REDUCTION':'\u25b2 OXIDATION', bx+bW/2, by+54);
            bx += bW + gap;
        });
    }

    // ─── Both halves display ──────────────────────────────────────────────────
    function drawBothHalves(bh, W, H, FS, transIn) {
        const y1 = H*0.42, y2 = H*0.62;
        // ox
        ctx.fillStyle='#1c120a'; ctx.strokeStyle='#f97316'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.roundRect(16, y1-38, W-32, 54, 8); ctx.fill(); ctx.stroke();
        ctx.fillStyle='#f97316'; ctx.font='bold 10px monospace'; ctx.textAlign='left';
        ctx.fillText(bh.ox.label, 28, y1-20);
        drawEquation(bh.ox, y1, W, FS*0.88, transIn);

        // red
        ctx.fillStyle='#081a2a'; ctx.strokeStyle='#22d3ee'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.roundRect(16, y2-38, W-32, 54, 8); ctx.fill(); ctx.stroke();
        ctx.fillStyle='#22d3ee'; ctx.font='bold 10px monospace'; ctx.textAlign='left';
        ctx.fillText(bh.red.label, 28, y2-20);
        drawEquation(bh.red, y2, W, FS*0.88, transIn);

        if (bh.cancelNote) {
            ctx.fillStyle='#fbbf24'; ctx.font='bold 12px sans-serif'; ctx.textAlign='center';
            ctx.fillText(bh.cancelNote, W/2, H*0.81);
        }
    }

    // ─── Main render ──────────────────────────────────────────────────────────
    function draw() {
        animId = requestAnimationFrame(draw);
        const W = rxCanvas.width  = rxCanvas.offsetWidth  || 720;
        const H = rxCanvas.height = rxCanvas.offsetHeight || 540;

        // Background with subtle radial glow
        ctx.fillStyle = '#0d1117'; ctx.fillRect(0,0,W,H);
        const bgGrad = ctx.createRadialGradient(W*0.5, H*0.4, 0, W*0.5, H*0.4, W*0.6);
        bgGrad.addColorStop(0, 'rgba(30,27,75,0.18)');
        bgGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle=bgGrad; ctx.fillRect(0,0,W,H);

        slideT++;
        if (transIn < 60) transIn++;

        const slide = REACTIONS[rxIdx].slides[slideIdx];
        const maxSlide = REACTIONS[rxIdx].slides.length - 1;
        const FS = Math.max(13, Math.min(17, W/44));

        // ── Narration (top) ──
        drawNarration(slide.narr, slideT, W);

        // ── Step title ──
        if (slide.halfTitle) {
            const tAlpha = Math.min(1, transIn/20);
            ctx.globalAlpha = tAlpha;
            const isGood = slide.halfTitle.includes('\u2705') || slide.halfTitle.includes('\u2728');
            ctx.fillStyle = isGood ? '#4ade80' : '#a78bfa';
            ctx.font = `bold ${FS*0.85}px sans-serif`; ctx.textAlign='center';
            ctx.fillText(slide.halfTitle, W/2, 82);
            ctx.globalAlpha=1;
        }

        const eqY = slide.halfTitle ? H*0.34 : H*0.32;

        // ── Equation or both halves ──
        if (slide.bothHalves) {
            drawBothHalves(slide.bothHalves, W, H, FS, transIn);
        } else if (slide.eq) {
            // Attach entry animation to new species
            const lhs = slide.eq.lhs.map(sp => ({
                ...sp,
                _dx: sp.enterFrom ? entryDx(sp.enterFrom, transIn) : 0,
                alpha: sp.enterFrom ? entryAlpha(sp.enterFrom, transIn) : (Math.min(1, transIn/15)),
            }));
            const rhs = slide.eq.rhs.map(sp => ({
                ...sp,
                _dx: sp.enterFrom ? entryDx(sp.enterFrom, transIn) : 0,
                alpha: sp.enterFrom ? entryAlpha(sp.enterFrom, transIn) : (Math.min(1, transIn/15)),
            }));
            drawEquation({lhs, rhs}, eqY, W, FS, transIn);
        }

        // ── Oxidation state banner ──
        if (slide.oxStates) {
            drawOxStateBanner(slide.oxStates, W, H, slideT);
        }

        // ── Atom count ──
        if (slide.atomCount) {
            const ac = slide.atomCount;
            const acAlpha = Math.min(1, (transIn-20)/30);
            ctx.globalAlpha = Math.max(0, acAlpha);
            drawAtomCount(W/2, H*0.56, W, H, ac.elem, ac.lhsN, ac.rhsN, slideT, P[ac.pal]);
            ctx.globalAlpha = 1;
            // Atom pop effects
            if (slideT === 28 && ac.lhsN !== ac.rhsN) {
                for (let i=0;i<3;i++) spawnAtomPop(
                    W/2 + (Math.random()-0.5)*40,
                    H*0.58 + Math.random()*20,
                    ac.lhsN < ac.rhsN ? `-${ac.rhsN-ac.lhsN} on LHS!` : `-${ac.lhsN-ac.rhsN} on RHS!`,
                    'rgb(248,113,113)'
                );
            }
        }

        // ── Charge bar ──
        if (slide.chargeBar) {
            const cbAlpha = Math.min(1, (transIn-15)/25);
            ctx.globalAlpha = Math.max(0, cbAlpha);
            drawChargeBar(W/2, H*0.57, slide.chargeBar.lhs, slide.chargeBar.rhs);
            ctx.globalAlpha = 1;
        }

        // ── Spawn electrons once ──
        if (slide.spawnElec && slideT === 35) {
            const arrX = W*0.5;
            spawnElectrons(5, W*0.68, H*0.34, W*0.27, H*0.34);
        }

        // ── Particles ──
        updateParticles();
        drawParticles();

        // ── Confetti ──
        if (slide.celebrate) {
            if (slideT === 5) spawnConfetti(W, H);
            updateDrawConfetti(H);
        }

        // ── Progress dots ──
        const dotsY = H - 16;
        const numSlides = REACTIONS[rxIdx].slides.length;
        for (let i=0;i<numSlides;i++) {
            const dx = W/2 - (numSlides-1)*12 + i*24;
            ctx.beginPath(); ctx.arc(dx, dotsY, i<=slideIdx?6:4, 0, Math.PI*2);
            ctx.fillStyle = i===slideIdx ? '#a78bfa' : (i<slideIdx?'#4ade80':'#1e293b');
            ctx.shadowBlur = i===slideIdx ? 10 : 0;
            ctx.shadowColor = '#a78bfa';
            ctx.fill(); ctx.shadowBlur=0;
        }

        // ── Reaction name ──
        ctx.fillStyle = '#334155'; ctx.font = '10px sans-serif'; ctx.textAlign = 'right';
        ctx.fillText(REACTIONS[rxIdx].label, W-10, H-6);
    }

    draw();
    updateUI();

    const rrObs = new ResizeObserver(()=>{});
    rrObs.observe(rxCanvas.parentElement||rxCanvas);

    overlayEl.innerHTML += `<span class="sim-badge">\u26a7\ufe0f Redox</span><span class="sim-badge">\ud83c\udfac Animated</span>`;
    return () => { cancelAnimationFrame(animId); rxCanvas.remove(); rrObs.disconnect(); };
}
'''

lines = open('games.js', 'r', encoding='utf-8').readlines()
start = next(i for i,l in enumerate(lines) if 'function initRedoxSim' in l)
stop  = next(i for i,l in enumerate(lines) if 'function initCollisionSim' in l)

# comment separator block between the two functions
# Find blank / comment lines just before initCollisionSim
sep = stop
while sep > start and lines[sep-1].strip() in ('', '//') or (sep > start and lines[sep-1].startswith('//')):
    sep -= 1

keep = lines[:start] + [NEW_REDOX + '\n\n'] + lines[stop:]
open('games.js', 'w', encoding='utf-8').writelines(keep)
print('done, lines:', len(keep))

import sys

NEW_MO = r'''function initMOSim(engine, controlsContainer, overlayEl) {
    engine.setUpdate(() => {});

    const MO_DATA = {
        N2: { name:'N\u2082', left:'N', right:'N', bondOrder:3, magnetic:'Diamagnetic',
              config:'\u03c31s\u00b2 \u03c3*1s\u00b2 \u03c32s\u00b2 \u03c3*2s\u00b2 \u03c02p\u2074 \u03c32p\u00b2',
              levels:[
                {label:'1s',       side:'left',  x:-1,    y:0,    e:2},
                {label:'1s',       side:'right', x: 1,    y:0,    e:2},
                {label:'\u03c3\u2081s',  side:'mo',   x:0,     y:-0.6, e:2},
                {label:'\u03c3*\u2081s', side:'mo',   x:0,     y: 0.9, e:2},
                {label:'2s',       side:'left',  x:-1,    y:2.8,  e:2},
                {label:'2s',       side:'right', x: 1,    y:2.8,  e:2},
                {label:'\u03c3\u2082s',  side:'mo',   x:0,     y:2.2,  e:2},
                {label:'\u03c3*\u2082s', side:'mo',   x:0,     y:3.6,  e:2},
                {label:'2p',       side:'left',  x:-1,    y:5.5,  e:1, triple:true},
                {label:'2p',       side:'right', x: 1,    y:5.5,  e:1, triple:true},
                {label:'\u03c0\u2082p',  side:'mo',   x: 0.38, y:5.1, e:2},
                {label:'\u03c0\u2082p',  side:'mo',   x:-0.38, y:5.1, e:2},
                {label:'\u03c3\u2082p',  side:'mo',   x:0,     y:5.7,  e:2},
                {label:'\u03c0*\u2082p', side:'mo',   x: 0.38, y:6.5, e:0},
                {label:'\u03c0*\u2082p', side:'mo',   x:-0.38, y:6.5, e:0},
                {label:'\u03c3*\u2082p', side:'mo',   x:0,     y:7.2,  e:0},
              ]},
        O2: { name:'O\u2082', left:'O', right:'O', bondOrder:2, magnetic:'Paramagnetic (2 unpaired e\u207b)',
              config:'\u03c31s\u00b2 \u03c3*1s\u00b2 \u03c32s\u00b2 \u03c3*2s\u00b2 \u03c32p\u00b2 \u03c02p\u2074 \u03c0*2p\u00b2',
              levels:[
                {label:'1s',       side:'left',  x:-1,    y:0,    e:2},
                {label:'1s',       side:'right', x: 1,    y:0,    e:2},
                {label:'\u03c3\u2081s',  side:'mo',   x:0,     y:-0.6, e:2},
                {label:'\u03c3*\u2081s', side:'mo',   x:0,     y: 0.9, e:2},
                {label:'2s',       side:'left',  x:-1,    y:2.8,  e:2},
                {label:'2s',       side:'right', x: 1,    y:2.8,  e:2},
                {label:'\u03c3\u2082s',  side:'mo',   x:0,     y:2.2,  e:2},
                {label:'\u03c3*\u2082s', side:'mo',   x:0,     y:3.6,  e:2},
                {label:'2p',       side:'left',  x:-1,    y:5.5,  e:1, triple:true},
                {label:'2p',       side:'right', x: 1,    y:5.5,  e:1, triple:true},
                {label:'\u03c3\u2082p',  side:'mo',   x:0,     y:5.0,  e:2},
                {label:'\u03c0\u2082p',  side:'mo',   x: 0.38, y:5.7, e:2},
                {label:'\u03c0\u2082p',  side:'mo',   x:-0.38, y:5.7, e:2},
                {label:'\u03c0*\u2082p', side:'mo',   x: 0.38, y:6.5, e:1},
                {label:'\u03c0*\u2082p', side:'mo',   x:-0.38, y:6.5, e:1},
                {label:'\u03c3*\u2082p', side:'mo',   x:0,     y:7.2,  e:0},
              ]},
        F2: { name:'F\u2082', left:'F', right:'F', bondOrder:1, magnetic:'Diamagnetic',
              config:'\u03c31s\u00b2 \u03c3*1s\u00b2 \u03c32s\u00b2 \u03c3*2s\u00b2 \u03c32p\u00b2 \u03c02p\u2074 \u03c0*2p\u2074',
              levels:[
                {label:'1s',       side:'left',  x:-1,    y:0,    e:2},
                {label:'1s',       side:'right', x: 1,    y:0,    e:2},
                {label:'\u03c3\u2081s',  side:'mo',   x:0,     y:-0.6, e:2},
                {label:'\u03c3*\u2081s', side:'mo',   x:0,     y: 0.9, e:2},
                {label:'2s',       side:'left',  x:-1,    y:2.8,  e:2},
                {label:'2s',       side:'right', x: 1,    y:2.8,  e:2},
                {label:'\u03c3\u2082s',  side:'mo',   x:0,     y:2.2,  e:2},
                {label:'\u03c3*\u2082s', side:'mo',   x:0,     y:3.6,  e:2},
                {label:'2p',       side:'left',  x:-1,    y:5.5,  e:1, triple:true},
                {label:'2p',       side:'right', x: 1,    y:5.5,  e:1, triple:true},
                {label:'\u03c3\u2082p',  side:'mo',   x:0,     y:5.0,  e:2},
                {label:'\u03c0\u2082p',  side:'mo',   x: 0.38, y:5.7, e:2},
                {label:'\u03c0\u2082p',  side:'mo',   x:-0.38, y:5.7, e:2},
                {label:'\u03c0*\u2082p', side:'mo',   x: 0.38, y:6.5, e:2},
                {label:'\u03c0*\u2082p', side:'mo',   x:-0.38, y:6.5, e:2},
                {label:'\u03c3*\u2082p', side:'mo',   x:0,     y:7.2,  e:0},
              ]},
        NO: { name:'NO', left:'N', right:'O', bondOrder:2.5, magnetic:'Paramagnetic (1 unpaired e\u207b)',
              config:'\u03c31s\u00b2 \u03c3*1s\u00b2 \u03c32s\u00b2 \u03c3*2s\u00b2 \u03c02p\u2074 \u03c32p\u00b2 \u03c0*2p\u00b9',
              levels:[
                {label:'1s',       side:'left',  x:-1,    y:0,    e:2},
                {label:'1s',       side:'right', x: 1,    y:0,    e:2},
                {label:'\u03c3\u2081s',  side:'mo',   x:0,     y:-0.6, e:2},
                {label:'\u03c3*\u2081s', side:'mo',   x:0,     y: 0.9, e:2},
                {label:'2s',       side:'left',  x:-1,    y:2.8,  e:2},
                {label:'2s',       side:'right', x: 1,    y:2.8,  e:2},
                {label:'\u03c3\u2082s',  side:'mo',   x:0,     y:2.2,  e:2},
                {label:'\u03c3*\u2082s', side:'mo',   x:0,     y:3.6,  e:2},
                {label:'2p',       side:'left',  x:-1,    y:5.5,  e:1, triple:true},
                {label:'2p',       side:'right', x: 1,    y:5.5,  e:1, triple:true},
                {label:'\u03c0\u2082p',  side:'mo',   x: 0.38, y:5.1, e:2},
                {label:'\u03c0\u2082p',  side:'mo',   x:-0.38, y:5.1, e:2},
                {label:'\u03c3\u2082p',  side:'mo',   x:0,     y:5.7,  e:2},
                {label:'\u03c0*\u2082p', side:'mo',   x: 0.38, y:6.5, e:1},
                {label:'\u03c0*\u2082p', side:'mo',   x:-0.38, y:6.5, e:0},
                {label:'\u03c3*\u2082p', side:'mo',   x:0,     y:7.2,  e:0},
              ]},
        CO: { name:'CO', left:'C', right:'O', bondOrder:3, magnetic:'Diamagnetic',
              config:'\u03c31s\u00b2 \u03c3*1s\u00b2 \u03c32s\u00b2 \u03c3*2s\u00b2 \u03c02p\u2074 \u03c32p\u00b2',
              levels:[
                {label:'1s',       side:'left',  x:-1,    y:0,    e:2},
                {label:'1s',       side:'right', x: 1,    y:0,    e:2},
                {label:'\u03c3\u2081s',  side:'mo',   x:0,     y:-0.6, e:2},
                {label:'\u03c3*\u2081s', side:'mo',   x:0,     y: 0.9, e:2},
                {label:'2s',       side:'left',  x:-1,    y:2.8,  e:2},
                {label:'2s',       side:'right', x: 1,    y:2.8,  e:2},
                {label:'\u03c3\u2082s',  side:'mo',   x:0,     y:2.2,  e:2},
                {label:'\u03c3*\u2082s', side:'mo',   x:0,     y:3.6,  e:2},
                {label:'2p',       side:'left',  x:-1,    y:5.5,  e:1, triple:true},
                {label:'2p',       side:'right', x: 1,    y:5.5,  e:1, triple:true},
                {label:'\u03c0\u2082p',  side:'mo',   x: 0.38, y:5.1, e:2},
                {label:'\u03c0\u2082p',  side:'mo',   x:-0.38, y:5.1, e:2},
                {label:'\u03c3\u2082p',  side:'mo',   x:0,     y:5.7,  e:2},
                {label:'\u03c0*\u2082p', side:'mo',   x: 0.38, y:6.5, e:0},
                {label:'\u03c0*\u2082p', side:'mo',   x:-0.38, y:6.5, e:0},
                {label:'\u03c3*\u2082p', side:'mo',   x:0,     y:7.2,  e:0},
              ]},
    };

    let currentMol = 'N2';

    controlsContainer.innerHTML = `
        <div class="game-panel sim-controls-panel">
            <div class="game-section-title">\u269b\ufe0f Molecular Orbital Diagram</div>
            <div class="sim-control-row">
                <label style="font-weight:700;color:#a78bfa;">Select Molecule</label>
                <select class="game-select" id="moMolSelect" style="margin-top:4px;">
                    ${Object.keys(MO_DATA).map(k=>`<option value="${k}">${MO_DATA[k].name}</option>`).join('')}
                </select>
            </div>
            <div class="sim-stats-grid" style="margin-top:10px;">
                <div class="sim-stat-card" style="border-left:3px solid #10b981">
                    <div class="sim-stat-label">\ud83d\udd17 Bond Order</div>
                    <div class="sim-stat-value" id="moBondOrder">--</div>
                </div>
                <div class="sim-stat-card" style="border-left:3px solid #f97316">
                    <div class="sim-stat-label">\ud83e\udde8 Magnetic</div>
                    <div class="sim-stat-value" id="moMagnetic" style="font-size:0.7rem;">--</div>
                </div>
            </div>
            <div class="sim-stat-card" style="border-left:3px solid #22d3ee;margin-top:6px;">
                <div class="sim-stat-label">\ud83d\udccb Configuration</div>
                <div style="font-size:0.72rem;color:#94a3b8;margin-top:4px;" id="moConfig">--</div>
            </div>
            <div style="margin-top:8px;font-size:0.74rem;color:#64748b;line-height:2;">
                <span style="display:inline-block;width:12px;height:12px;background:#d4a843;border-radius:2px;margin-right:4px;"></span>Bonding MO
                <span style="display:inline-block;width:12px;height:12px;background:#e05252;border-radius:2px;margin-left:8px;margin-right:4px;"></span>Antibonding MO*
                <br>
                <span style="display:inline-block;width:12px;height:12px;background:#4a7fb5;border-radius:2px;margin-right:4px;"></span>Atomic Orbital
            </div>
        </div>`;

    const moCanvas = make2DCanvas(engine, 'moCanvas', '#0d1117');
    const ctx2 = moCanvas.getContext('2d');

    const CLR = {
        bg:'#0d1117', bgGrid:'#111827', axisLine:'#334155', axisText:'#94a3b8',
        colLabel:'#cbd5e1', moBox:'#2a1f08', moBord:'#d4a843',
        moBoxAb:'#2a0808', moBordAb:'#e05252', aoBox:'#0f2038', aoBord:'#4a7fb5',
        dash:'#2d3f54', arrowCol:'#e2e8f0', labelBond:'#d4a843', labelAb:'#e05252', labelAO:'#7cb8e8',
    };

    function drawMO(molKey) {
        const mol = MO_DATA[molKey];
        const W = moCanvas.width  = moCanvas.offsetWidth  || 680;
        const H = moCanvas.height = moCanvas.offsetHeight || 620;

        ctx2.fillStyle = CLR.bg; ctx2.fillRect(0,0,W,H);
        ctx2.strokeStyle = CLR.bgGrid; ctx2.lineWidth = 0.5;
        for (let gy=28; gy<H; gy+=28) { ctx2.beginPath(); ctx2.moveTo(0,gy); ctx2.lineTo(W,gy); ctx2.stroke(); }

        const lx = W*0.20, rx = W*0.80, cx = W*0.50;
        const topPad = 36, botPad = 54;
        const availH = H - topPad - botPad;
        function toY(v) { return topPad + availH*(1 - v/8.4); }

        // ENERGY axis
        ctx2.save();
        ctx2.strokeStyle = CLR.axisLine; ctx2.lineWidth = 2;
        ctx2.beginPath(); ctx2.moveTo(18,H-botPad); ctx2.lineTo(18,topPad+4); ctx2.stroke();
        ctx2.beginPath(); ctx2.moveTo(13,topPad+10); ctx2.lineTo(18,topPad+2); ctx2.lineTo(23,topPad+10); ctx2.stroke();
        ctx2.fillStyle = CLR.axisText; ctx2.font = 'bold 11px sans-serif';
        ctx2.translate(11,H/2); ctx2.rotate(-Math.PI/2);
        ctx2.textAlign='center'; ctx2.fillText('ENERGY',0,0);
        ctx2.restore();

        // Column labels
        ctx2.fillStyle = CLR.colLabel; ctx2.font = 'bold 15px sans-serif'; ctx2.textAlign='center';
        ctx2.fillText(mol.left, lx, H-14);
        ctx2.fillStyle = '#a78bfa'; ctx2.fillText(mol.name, cx, H-14);
        ctx2.fillStyle = CLR.colLabel; ctx2.fillText(mol.right, rx, H-14);

        const boxW=40, boxH=22;

        // Dashed connectors (behind boxes)
        const groups=[
            {aoY:0,   moYs:[-0.6,0.9]},
            {aoY:2.8, moYs:[2.2,3.6]},
            {aoY:5.5, moYs:[5.0,5.1,5.7,6.5,7.2]},
        ];
        ctx2.setLineDash([5,5]); ctx2.strokeStyle=CLR.dash; ctx2.lineWidth=1;
        groups.forEach(g=>{
            const ay=toY(g.aoY+0.5);
            g.moYs.forEach(my=>{
                const moy=toY(my+0.5);
                ctx2.beginPath(); ctx2.moveTo(lx+boxW*0.7,ay);   ctx2.lineTo(cx-boxW,moy); ctx2.stroke();
                ctx2.beginPath(); ctx2.moveTo(rx-boxW*0.7,ay);   ctx2.lineTo(cx+boxW,moy); ctx2.stroke();
            });
        });
        ctx2.setLineDash([]);

        // Boxes
        const drawn={};
        mol.levels.forEach(lvl=>{
            const bCx = lvl.side==='mo' ? cx+lvl.x*W*0.13 : (lvl.side==='left'?lx:rx);
            const bCy = toY(lvl.y+0.5);
            const isAb = lvl.label.includes('*');
            const isMO = lvl.side==='mo';
            const fill  = isMO?(isAb?CLR.moBoxAb:CLR.moBox):CLR.aoBox;
            const bord  = isMO?(isAb?CLR.moBordAb:CLR.moBord):CLR.aoBord;
            const lc    = isMO?(isAb?CLR.labelAb:CLR.labelBond):CLR.labelAO;

            if (lvl.triple) {
                const key=`${lvl.side}-${lvl.y}`;
                if (drawn[key]) return; drawn[key]=true;
                for (let k=-1;k<=1;k++) {
                    const bx=bCx+k*(boxW+4)-boxW/2;
                    ctx2.shadowBlur=6; ctx2.shadowColor=bord;
                    ctx2.fillStyle=fill; ctx2.strokeStyle=bord; ctx2.lineWidth=1.5;
                    ctx2.fillRect(bx,bCy-boxH/2,boxW,boxH); ctx2.strokeRect(bx,bCy-boxH/2,boxW,boxH);
                    ctx2.shadowBlur=0;
                    if (k===0) drawArrow(bCx+k*(boxW+4),bCy,1,false);
                }
                ctx2.fillStyle=lc; ctx2.font='10px monospace'; ctx2.textAlign='left';
                ctx2.fillText('2p  2p  2p', bCx-boxW+2, bCy-boxH/2-5);
                return;
            }

            const bx=bCx-boxW/2;
            ctx2.shadowBlur=10; ctx2.shadowColor=bord;
            ctx2.fillStyle=fill; ctx2.strokeStyle=bord; ctx2.lineWidth=2;
            ctx2.fillRect(bx,bCy-boxH/2,boxW,boxH); ctx2.strokeRect(bx,bCy-boxH/2,boxW,boxH);
            ctx2.shadowBlur=0;

            if (lvl.e===2) drawArrow(bCx,bCy,2,true);
            else if (lvl.e===1) drawArrow(bCx,bCy,1,false);

            ctx2.fillStyle=lc; ctx2.font=`${isAb?'italic ':''}10px monospace`; ctx2.textAlign='left';
            if (lvl.side==='left')       ctx2.fillText(lvl.label, bx-28, bCy+4);
            else if (lvl.side==='right') ctx2.fillText(lvl.label, bx+boxW+4, bCy+4);
            else { ctx2.textAlign='right'; ctx2.fillText(lvl.label, bx-4, bCy+4); }
        });

        controlsContainer.querySelector('#moBondOrder').textContent = mol.bondOrder;
        controlsContainer.querySelector('#moMagnetic').textContent  = mol.magnetic;
        controlsContainer.querySelector('#moConfig').textContent    = mol.config;
    }

    function drawArrow(cx,cy,count,paired) {
        ctx2.strokeStyle=CLR.arrowCol; ctx2.lineWidth=1.8;
        if (count===2) {
            [-5,5].forEach((dx,i)=>{
                const up=i===0, y1=cy+(up?6:-6), y2=cy+(up?-6:6), dir=up?-1:1;
                ctx2.beginPath(); ctx2.moveTo(cx+dx,y1); ctx2.lineTo(cx+dx,y2); ctx2.stroke();
                ctx2.beginPath(); ctx2.moveTo(cx+dx-3,y2-dir*4); ctx2.lineTo(cx+dx,y2); ctx2.lineTo(cx+dx+3,y2-dir*4); ctx2.stroke();
            });
        } else {
            ctx2.beginPath(); ctx2.moveTo(cx,cy+6); ctx2.lineTo(cx,cy-6); ctx2.stroke();
            ctx2.beginPath(); ctx2.moveTo(cx-3,cy-2); ctx2.lineTo(cx,cy-6); ctx2.lineTo(cx+3,cy-2); ctx2.stroke();
        }
    }

    controlsContainer.querySelector('#moMolSelect').addEventListener('change', e=>{ currentMol=e.target.value; drawMO(currentMol); });
    drawMO(currentMol);

    const moResizeObs = new ResizeObserver(()=>drawMO(currentMol));
    moResizeObs.observe(moCanvas.parentElement);

    overlayEl.innerHTML += `<span class="sim-badge">\u269b\ufe0f MO Diagram</span><span class="sim-badge">\ud83d\udd17 Bond Order</span>`;
    return () => { moCanvas.remove(); moResizeObs.disconnect(); };
}
'''

lines = open('games.js','r',encoding='utf-8').readlines()
mo_start = next(i for i,l in enumerate(lines) if 'function initMOSim' in l)
make2d   = next(i for i,l in enumerate(lines) if 'HELPER: make a 2D canvas' in l)
sep = make2d - 1
while sep > mo_start and lines[sep].strip() == '': sep -= 1
while sep > mo_start and lines[sep].strip().startswith('//'): sep -= 1
sep += 1

keep = lines[:mo_start] + [NEW_MO + '\n'] + lines[sep:]
open('games.js','w',encoding='utf-8').writelines(keep)
print('done, total lines:', len(keep))

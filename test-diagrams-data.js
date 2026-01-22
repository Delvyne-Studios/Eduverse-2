// Test 1: LPP Minimize Problem with proper shading
const lpp = new GraphCanvas('lpp-svg', 320, 240);
lpp.create(document.getElementById('test1'));
lpp.renderSVG(`
<!-- title: LPP Minimize Problem -->

<g data-step="1" data-description="Constraint: x + y ≥ 4">
  <!-- Line x + y = 4 from (0,4) to (4,0) -->
  <line x1="50" y1="12.5" x2="90" y2="37.5" stroke="#ef4444" stroke-width="0.6"/>
  <text x="72" y="22" fill="#ef4444" font-size="2.5">x+y=4</text>
  <circle cx="50" cy="12.5" r="1" fill="#ef4444"/>
  <text x="47" y="10" fill="#ef4444" font-size="2">A(0,4)</text>
  <circle cx="90" cy="37.5" r="1" fill="#ef4444"/>
  <text x="92" y="37" fill="#ef4444" font-size="2">B(4,0)</text>
</g>

<g data-step="2" data-description="Constraint: 2x + y ≥ 6">
  <!-- Line 2x + y = 6 from (0,6) to (3,0) -->
  <line x1="50" y1="0" x2="80" y2="37.5" stroke="#22c55e" stroke-width="0.6"/>
  <text x="62" y="15" fill="#22c55e" font-size="2.5">2x+y=6</text>
  <circle cx="50" cy="0" r="1" fill="#22c55e"/>
  <text x="47" y="-2" fill="#22c55e" font-size="2">C(0,6)</text>
  <circle cx="80" cy="37.5" r="1" fill="#22c55e"/>
  <text x="82" y="37" fill="#22c55e" font-size="2">D(3,0)</text>
</g>

<g data-step="3" data-description="Non-negativity: x, y ≥ 0">
  <text x="30" y="50" fill="#06b6d4" font-size="2.5">x ≥ 0, y ≥ 0</text>
</g>

<g data-step="4" data-description="Feasible region shaded">
  <!-- Shading the unbounded feasible region -->
  <polygon points="50,12.5 60,12.5 70,12.5 80,12.5 90,12.5 90,7.5 90,2.5 80,2.5 70,2.5 60,2.5 50,0" 
           fill="rgba(139, 92, 246, 0.25)" stroke="none"/>
  <!-- Corner points -->
  <circle cx="50" cy="12.5" r="1.5" fill="#a855f7"/>
  <text x="52" y="14" fill="#a855f7" font-size="2.5" font-weight="bold">(0,4)</text>
  <circle cx="66" cy="4" r="1.5" fill="#a855f7"/>
  <text x="68" y="4" fill="#a855f7" font-size="2.5" font-weight="bold">(2,2)*</text>
  <text x="55" y="60" fill="#eab308" font-size="3" font-weight="bold">Min Z at (2,2) = 10</text>
</g>
`, 'LPP Minimize Problem');

// Test 2: Molecular Orbital Diagram (O₂)
const mo = new DiagramCanvas('mo-svg', 320, 220);
mo.create(document.getElementById('test2'));
mo.renderSVG(`
<!-- title: Molecular Orbital Diagram - O₂ -->

<g data-step="1" data-description="Atomic orbitals of two oxygen atoms">
  <!-- Left O atom -->
  <rect x="10" y="15" width="15" height="3" fill="none" stroke="#22c55e" stroke-width="0.5"/>
  <text x="12" y="17.5" fill="#22c55e" font-size="2">2p</text>
  <rect x="10" y="25" width="15" height="3" fill="none" stroke="#3b82f6" stroke-width="0.5"/>
  <text x="12" y="27.5" fill="#3b82f6" font-size="2">2s</text>
  <text x="15" y="12" fill="#ffffff" font-size="3" font-weight="bold">O</text>
  
  <!-- Right O atom -->
  <rect x="75" y="15" width="15" height="3" fill="none" stroke="#22c55e" stroke-width="0.5"/>
  <text x="77" y="17.5" fill="#22c55e" font-size="2">2p</text>
  <rect x="75" y="25" width="15" height="3" fill="none" stroke="#3b82f6" stroke-width="0.5"/>
  <text x="77" y="27.5" fill="#3b82f6" font-size="2">2s</text>
  <text x="80" y="12" fill="#ffffff" font-size="3" font-weight="bold">O</text>
</g>

<g data-step="2" data-description="Molecular orbitals in center">
  <!-- Antibonding orbitals (top) -->
  <rect x="42" y="8" width="16" height="2.5" fill="none" stroke="#ef4444" stroke-width="0.5"/>
  <text x="44" y="10" fill="#ef4444" font-size="2">σ*2p</text>
  
  <rect x="42" y="12" width="16" height="2.5" fill="none" stroke="#f59e0b" stroke-width="0.5"/>
  <text x="44" y="14" fill="#f59e0b" font-size="2">π*2p</text>
  
  <!-- Bonding orbitals (middle) -->
  <rect x="42" y="18" width="16" height="2.5" fill="none" stroke="#06b6d4" stroke-width="0.5"/>
  <text x="44" y="20" fill="#06b6d4" font-size="2">π2p</text>
  
  <rect x="42" y="23" width="16" height="2.5" fill="none" stroke="#10b981" stroke-width="0.5"/>
  <text x="44" y="25" fill="#10b981" font-size="2">σ2p</text>
  
  <!-- Lower bonding/antibonding -->
  <rect x="42" y="30" width="16" height="2.5" fill="none" stroke="#ef4444" stroke-width="0.5"/>
  <text x="44" y="32" fill="#ef4444" font-size="2">σ*2s</text>
  
  <rect x="42" y="35" width="16" height="2.5" fill="none" stroke="#10b981" stroke-width="0.5"/>
  <text x="44" y="37" fill="#10b981" font-size="2">σ2s</text>
</g>

<g data-step="3" data-description="Electron filling with arrows">
  <!-- Left O electrons -->
  <text x="11" y="17.2" font-size="2">↑↓</text>
  <text x="15" y="17.2" font-size="2">↑</text>
  <text x="19" y="17.2" font-size="2">↑</text>
  <text x="11" y="27.2" font-size="2">↑↓</text>
  
  <!-- Right O electrons -->
  <text x="76" y="17.2" font-size="2">↑↓</text>
  <text x="80" y="17.2" font-size="2">↑</text>
  <text x="84" y="17.2" font-size="2">↑</text>
  <text x="76" y="27.2" font-size="2">↑↓</text>
  
  <!-- Molecular orbital electrons -->
  <text x="43" y="9.7" font-size="2">↑</text>
  <text x="47" y="9.7" font-size="2">↓</text>
  <text x="43" y="13.7" font-size="2">↑↓</text>
  <text x="51" y="13.7" font-size="2">↑↓</text>
  <text x="43" y="19.7" font-size="2">↑↓</text>
  <text x="51" y="19.7" font-size="2">↑↓</text>
  <text x="43" y="24.7" font-size="2">↑↓</text>
  <text x="43" y="31.7" font-size="2">↑↓</text>
  <text x="43" y="36.7" font-size="2">↑↓</text>
  
  <!-- Bond order -->
  <text x="35" y="45" fill="#eab308" font-size="3" font-weight="bold">Bond Order = 2</text>
  <text x="32" y="50" fill="#a855f7" font-size="2.5">Paramagnetic (2 unpaired)</text>
</g>
`, 'Molecular Orbital Diagram - O₂');

// Test 3: Hund's Rule (Nitrogen 2p³)
const hund = new DiagramCanvas('hund-svg', 320, 220);
hund.create(document.getElementById('test3'));
hund.renderSVG(`
<!-- title: Hund's Rule - Nitrogen 2p³ -->

<g data-step="1" data-description="Empty 2p orbitals">
  <text x="50" y="15" fill="#ffffff" font-size="4" text-anchor="middle" font-weight="bold">Nitrogen (N): 1s² 2s² 2p³</text>
  
  <!-- Three 2p orbitals -->
  <rect x="25" y="30" width="12" height="8" fill="none" stroke="#06b6d4" stroke-width="0.6"/>
  <text x="31" y="42" fill="#06b6d4" font-size="2.5" text-anchor="middle">2pₓ</text>
  
  <rect x="44" y="30" width="12" height="8" fill="none" stroke="#06b6d4" stroke-width="0.6"/>
  <text x="50" y="42" fill="#06b6d4" font-size="2.5" text-anchor="middle">2p_y</text>
  
  <rect x="63" y="30" width="12" height="8" fill="none" stroke="#06b6d4" stroke-width="0.6"/>
  <text x="69" y="42" fill="#06b6d4" font-size="2.5" text-anchor="middle">2p_z</text>
</g>

<g data-step="2" data-description="First electron - spin up">
  <!-- Electron 1 -->
  <text x="29" y="34.5" font-size="4" fill="#22c55e">↑</text>
  <text x="20" y="50" fill="#22c55e" font-size="2.5">Electron 1</text>
  <line x1="27" y1="48" x2="29" y2="37" stroke="#22c55e" stroke-width="0.3" marker-end="url(#arrowhead)"/>
</g>

<g data-step="3" data-description="Second electron - spin up (different orbital)">
  <text x="48" y="34.5" font-size="4" fill="#f59e0b">↑</text>
  <text x="39" y="50" fill="#f59e0b" font-size="2.5">Electron 2</text>
  <line x1="46" y1="48" x2="48" y2="37" stroke="#f59e0b" stroke-width="0.3" marker-end="url(#arrowhead)"/>
</g>

<g data-step="4" data-description="Third electron - spin up (maximum multiplicity)">
  <text x="67" y="34.5" font-size="4" fill="#ef4444">↑</text>
  <text x="58" y="50" fill="#ef4444" font-size="2.5">Electron 3</text>
  <line x1="65" y1="48" x2="67" y2="37" stroke="#ef4444" stroke-width="0.3" marker-end="url(#arrowhead)"/>
  
  <text x="50" y="58" fill="#a855f7" font-size="3.5" text-anchor="middle" font-weight="bold">✓ Hund's Rule Satisfied</text>
  <text x="50" y="63" fill="#818cf8" font-size="2.5" text-anchor="middle">Maximum multiplicity: All spins parallel</text>
</g>
`, "Hund's Rule - Nitrogen");

// Test 4: Bohr's Atomic Model
const bohr = new DiagramCanvas('bohr-svg', 320, 220);
bohr.create(document.getElementById('test4'));
bohr.renderSVG(`
<!-- title: Bohr's Atomic Model - Hydrogen -->

<g data-step="1" data-description="Nucleus">
  <circle cx="50" cy="35" r="3" fill="#ef4444" stroke="#ff6b6b" stroke-width="0.5"/>
  <text x="50" y="36.5" fill="#ffffff" font-size="2" text-anchor="middle" font-weight="bold">p⁺</text>
  <text x="50" y="45" fill="#ef4444" font-size="2.5" text-anchor="middle">Nucleus</text>
</g>

<g data-step="2" data-description="First orbit (n=1, ground state)">
  <circle cx="50" cy="35" r="10" fill="none" stroke="#22c55e" stroke-width="0.5" stroke-dasharray="1,0.5"/>
  <circle cx="60" cy="35" r="1.2" fill="#22c55e"/>
  <text x="63" y="36" fill="#22c55e" font-size="2.5">e⁻</text>
  <text x="62" y="32" fill="#22c55e" font-size="2">n=1</text>
  <text x="62" y="40" fill="#22c55e" font-size="1.8">E₁=-13.6eV</text>
</g>

<g data-step="3" data-description="Second orbit (n=2)">
  <circle cx="50" cy="35" r="18" fill="none" stroke="#3b82f6" stroke-width="0.5" stroke-dasharray="1,0.5"/>
  <circle cx="68" cy="35" r="1" fill="#3b82f6" opacity="0.5"/>
  <text x="70" y="35" fill="#3b82f6" font-size="2">n=2</text>
  <text x="70" y="38" fill="#3b82f6" font-size="1.6">E₂=-3.4eV</text>
</g>

<g data-step="4" data-description="Third orbit (n=3) and transitions">
  <circle cx="50" cy="35" r="26" fill="none" stroke="#a855f7" stroke-width="0.5" stroke-dasharray="1,0.5"/>
  <circle cx="76" cy="35" r="1" fill="#a855f7" opacity="0.5"/>
  <text x="78" y="35" fill="#a855f7" font-size="2">n=3</text>
  <text x="78" y="38" fill="#a855f7" font-size="1.6">E₃=-1.5eV</text>
  
  <!-- Energy transitions -->
  <line x1="68" y1="30" x2="62" y2="33" stroke="#f59e0b" stroke-width="0.5" marker-end="url(#arrowhead)"/>
  <text x="62" y="28" fill="#f59e0b" font-size="2">Emission</text>
  <text x="60" y="24" fill="#f59e0b" font-size="1.8">hν = E₂ - E₁</text>
  
  <text x="50" y="63" fill="#eab308" font-size="3" text-anchor="middle" font-weight="bold">Quantized Energy Levels</text>
</g>
`, "Bohr's Atomic Model");

// Test 5: d Orbital (d_xy)
const dorbital = new DiagramCanvas('dorbital-svg', 320, 220);
dorbital.create(document.getElementById('test5'));
dorbital.renderSVG(`
<!-- title: d Orbital - d_xy -->

<g data-step="1" data-description="Coordinate axes">
  <line x1="20" y1="35" x2="80" y2="35" stroke="#ffffff" stroke-width="0.4" marker-end="url(#arrowhead)"/>
  <text x="82" y="36" fill="#ffffff" font-size="2.5">x</text>
  
  <line x1="50" y1="60" x2="50" y2="10" stroke="#ffffff" stroke-width="0.4" marker-end="url(#arrowhead)"/>
  <text x="52" y="12" fill="#ffffff" font-size="2.5">y</text>
  
  <circle cx="50" cy="35" r="1.5" fill="#eab308"/>
  <text x="52" y="38" fill="#eab308" font-size="2">nucleus</text>
</g>

<g data-step="2" data-description="Positive lobes (Quadrants I and III)">
  <!-- Quadrant I (top-right) - positive lobe -->
  <ellipse cx="62" cy="23" rx="10" ry="10" fill="rgba(34, 197, 94, 0.4)" stroke="#22c55e" stroke-width="0.6" 
           transform="rotate(45 62 23)"/>
  <text x="65" y="22" fill="#22c55e" font-size="3" font-weight="bold">+</text>
  
  <!-- Quadrant III (bottom-left) - positive lobe -->
  <ellipse cx="38" cy="47" rx="10" ry="10" fill="rgba(34, 197, 94, 0.4)" stroke="#22c55e" stroke-width="0.6" 
           transform="rotate(45 38 47)"/>
  <text x="35" y="48" fill="#22c55e" font-size="3" font-weight="bold">+</text>
</g>

<g data-step="3" data-description="Negative lobes (Quadrants II and IV)">
  <!-- Quadrant II (top-left) - negative lobe -->
  <ellipse cx="38" cy="23" rx="10" ry="10" fill="rgba(239, 68, 68, 0.4)" stroke="#ef4444" stroke-width="0.6" 
           transform="rotate(-45 38 23)"/>
  <text x="36" y="24" fill="#ef4444" font-size="3" font-weight="bold">−</text>
  
  <!-- Quadrant IV (bottom-right) - negative lobe -->
  <ellipse cx="62" cy="47" rx="10" ry="10" fill="rgba(239, 68, 68, 0.4)" stroke="#ef4444" stroke-width="0.6" 
           transform="rotate(-45 62 47)"/>
  <text x="60" y="48" fill="#ef4444" font-size="3" font-weight="bold">−</text>
  
  <text x="50" y="63" fill="#a855f7" font-size="3.5" text-anchor="middle" font-weight="bold">d_xy Orbital</text>
  <text x="50" y="67" fill="#818cf8" font-size="2" text-anchor="middle">Cloverleaf shape in xy-plane</text>
</g>
`, 'd_xy Orbital');

// Test 6: VSEPR Trigonal Bipyramidal (PCl₅)
const vsepr = new DiagramCanvas('vsepr-svg', 320, 220);
vsepr.create(document.getElementById('test6'));
vsepr.renderSVG(`
<!-- title: VSEPR - Trigonal Bipyramidal (PCl₅) -->

<g data-step="1" data-description="Central phosphorus atom">
  <circle cx="50" cy="35" r="3" fill="#f59e0b" stroke="#fb923c" stroke-width="0.6"/>
  <text x="50" y="36.5" fill="#ffffff" font-size="2.5" text-anchor="middle" font-weight="bold">P</text>
  <text x="50" y="45" fill="#f59e0b" font-size="2.5" text-anchor="middle">Phosphorus</text>
</g>

<g data-step="2" data-description="Axial chlorine atoms (180°)">
  <!-- Top axial Cl -->
  <line x1="50" y1="35" x2="50" y2="15" stroke="#06b6d4" stroke-width="0.6"/>
  <circle cx="50" cy="13" r="2.5" fill="#06b6d4" opacity="0.7"/>
  <text x="50" y="14.5" fill="#ffffff" font-size="2" text-anchor="middle" font-weight="bold">Cl</text>
  <text x="54" y="12" fill="#06b6d4" font-size="2">axial</text>
  
  <!-- Bottom axial Cl -->
  <line x1="50" y1="35" x2="50" y2="55" stroke="#06b6d4" stroke-width="0.6"/>
  <circle cx="50" cy="57" r="2.5" fill="#06b6d4" opacity="0.7"/>
  <text x="50" y="58.5" fill="#ffffff" font-size="2" text-anchor="middle" font-weight="bold">Cl</text>
  <text x="54" y="59" fill="#06b6d4" font-size="2">axial</text>
  
  <!-- 180° angle marker -->
  <text x="55" y="35" fill="#eab308" font-size="2">180°</text>
</g>

<g data-step="3" data-description="Equatorial chlorine atoms (120°)">
  <!-- Equatorial Cl 1 (left) -->
  <line x1="50" y1="35" x2="28" y2="35" stroke="#22c55e" stroke-width="0.6"/>
  <circle cx="25" cy="35" r="2.5" fill="#22c55e" opacity="0.7"/>
  <text x="25" y="36.5" fill="#ffffff" font-size="2" text-anchor="middle" font-weight="bold">Cl</text>
  <text x="18" y="38" fill="#22c55e" font-size="1.8">equatorial</text>
  
  <!-- Equatorial Cl 2 (right-top) -->
  <line x1="50" y1="35" x2="64" y2="26" stroke="#22c55e" stroke-width="0.6"/>
  <circle cx="66" cy="24" r="2.5" fill="#22c55e" opacity="0.7"/>
  <text x="66" y="25.5" fill="#ffffff" font-size="2" text-anchor="middle" font-weight="bold">Cl</text>
  
  <!-- Equatorial Cl 3 (right-bottom) -->
  <line x1="50" y1="35" x2="64" y2="44" stroke="#22c55e" stroke-width="0.6"/>
  <circle cx="66" cy="46" r="2.5" fill="#22c55e" opacity="0.7"/>
  <text x="66" y="47.5" fill="#ffffff" font-size="2" text-anchor="middle" font-weight="bold">Cl</text>
  
  <!-- 120° angle markers -->
  <path d="M 45 35 A 5 5 0 0 1 48 30" fill="none" stroke="#eab308" stroke-width="0.4"/>
  <text x="44" y="30" fill="#eab308" font-size="2">120°</text>
  
  <!-- 90° angle markers -->
  <path d="M 50 30 Q 52 33 50 35" fill="none" stroke="#a855f7" stroke-width="0.4"/>
  <text x="52" y="30" fill="#a855f7" font-size="2">90°</text>
</g>

<g data-step="4" data-description="Complete structure with bond angles">
  <text x="50" y="66" fill="#ffffff" font-size="3.5" text-anchor="middle" font-weight="bold">PCl₅</text>
  <text x="50" y="70" fill="#818cf8" font-size="2" text-anchor="middle">Trigonal Bipyramidal (sp³d)</text>
</g>
`, 'VSEPR Trigonal Bipyramidal');

// Test 7: Plant Cell
const plantcell = new DiagramCanvas('plantcell-svg', 320, 220);
plantcell.create(document.getElementById('test7'));
plantcell.renderSVG(`
<!-- title: Plant Cell Structure -->

<g data-step="1" data-description="Cell wall and membrane">
  <!-- Cell wall (outer) -->
  <rect x="10" y="10" width="80" height="50" rx="2" fill="none" stroke="#22c55e" stroke-width="1.2"/>
  <text x="15" y="8" fill="#22c55e" font-size="2">Cell Wall</text>
  
  <!-- Cell membrane (inner) -->
  <rect x="12" y="12" width="76" height="46" rx="1" fill="rgba(34, 197, 94, 0.05)" stroke="#10b981" stroke-width="0.5" stroke-dasharray="1,0.5"/>
</g>

<g data-step="2" data-description="Nucleus (control center)">
  <circle cx="35" cy="30" r="7" fill="rgba(99, 102, 241, 0.3)" stroke="#6366f1" stroke-width="0.8"/>
  <circle cx="35" cy="30" r="3" fill="rgba(139, 92, 246, 0.5)" stroke="#8b5cf6" stroke-width="0.5"/>
  <text x="35" y="31" fill="#ffffff" font-size="2" text-anchor="middle" font-weight="bold">DNA</text>
  <text x="35" y="40" fill="#818cf8" font-size="2" text-anchor="middle">Nucleus</text>
</g>

<g data-step="3" data-description="Large central vacuole">
  <ellipse cx="60" cy="35" rx="20" ry="18" fill="rgba(6, 182, 212, 0.15)" stroke="#06b6d4" stroke-width="0.8" stroke-dasharray="2,1"/>
  <text x="60" y="34" fill="#06b6d4" font-size="2.5" text-anchor="middle">Central</text>
  <text x="60" y="37" fill="#06b6d4" font-size="2.5" text-anchor="middle">Vacuole</text>
  <text x="60" y="40" fill="#22d3ee" font-size="1.8" text-anchor="middle">(Cell Sap)</text>
</g>

<g data-step="4" data-description="Chloroplasts (photosynthesis)">
  <!-- Chloroplast 1 -->
  <ellipse cx="25" cy="18" rx="5" ry="3" fill="rgba(34, 197, 94, 0.4)" stroke="#22c55e" stroke-width="0.5"/>
  <line x1="22" y1="18" x2="28" y2="18" stroke="#10b981" stroke-width="0.3"/>
  <text x="25" y="14" fill="#22c55e" font-size="1.8" text-anchor="middle">Chloroplast</text>
  
  <!-- Chloroplast 2 -->
  <ellipse cx="70" cy="52" rx="5" ry="3" fill="rgba(34, 197, 94, 0.4)" stroke="#22c55e" stroke-width="0.5"/>
  <line x1="67" y1="52" x2="73" y2="52" stroke="#10b981" stroke-width="0.3"/>
  
  <!-- Chloroplast 3 -->
  <ellipse cx="45" cy="50" rx="5" ry="3" fill="rgba(34, 197, 94, 0.4)" stroke="#22c55e" stroke-width="0.5"/>
  <line x1="42" y1="50" x2="48" y2="50" stroke="#10b981" stroke-width="0.3"/>
</g>

<g data-step="5" data-description="Mitochondria (energy production)">
  <!-- Mitochondrion 1 -->
  <ellipse cx="25" cy="45" rx="4" ry="2.5" fill="rgba(239, 68, 68, 0.3)" stroke="#ef4444" stroke-width="0.5"/>
  <path d="M 23 45 Q 25 43 27 45" fill="none" stroke="#ef4444" stroke-width="0.3"/>
  <text x="25" y="48" fill="#ef4444" font-size="1.8" text-anchor="middle">Mitochondria</text>
  
  <!-- Mitochondrion 2 -->
  <ellipse cx="50" cy="20" rx="4" ry="2.5" fill="rgba(239, 68, 68, 0.3)" stroke="#ef4444" stroke-width="0.5"/>
  <path d="M 48 20 Q 50 18 52 20" fill="none" stroke="#ef4444" stroke-width="0.3"/>
</g>

<g data-step="6" data-description="Other organelles">
  <!-- Golgi apparatus -->
  <g transform="translate(18, 32)">
    <rect x="0" y="0" width="6" height="1" fill="none" stroke="#f59e0b" stroke-width="0.4"/>
    <rect x="0" y="1.5" width="6" height="1" fill="none" stroke="#f59e0b" stroke-width="0.4"/>
    <rect x="0" y="3" width="6" height="1" fill="none" stroke="#f59e0b" stroke-width="0.4"/>
    <text x="3" y="6" fill="#f59e0b" font-size="1.6" text-anchor="middle">Golgi</text>
  </g>
  
  <!-- ER (rough) -->
  <path d="M 45 15 Q 48 13 51 15 Q 54 17 57 15" fill="none" stroke="#a855f7" stroke-width="0.5"/>
  <circle cx="46" cy="15" r="0.4" fill="#a855f7"/>
  <circle cx="50" cy="14" r="0.4" fill="#a855f7"/>
  <text x="51" y="12" fill="#a855f7" font-size="1.6">Rough ER</text>
  
  <text x="50" y="66" fill="#ffffff" font-size="3.5" text-anchor="middle" font-weight="bold">Plant Cell</text>
</g>
`, 'Plant Cell Structure');

// Test 8: Convex Lens (from original test)
const lens = new DiagramCanvas('lens-svg', 320, 220);
lens.create(document.getElementById('test8'));
lens.renderSVG(`
<!-- title: Convex Lens Ray Diagram -->

<g data-step="1" data-description="Principal axis and lens">
  <line x1="5" y1="35" x2="95" y2="35" stroke="#ffffff" stroke-width="0.5"/>
  <ellipse cx="50" cy="35" rx="2" ry="15" fill="none" stroke="#06b6d4" stroke-width="0.8"/>
  <circle cx="35" cy="35" r="1" fill="#eab308"/>
  <text x="35" y="40" fill="#eab308" font-size="3" text-anchor="middle">F</text>
  <circle cx="65" cy="35" r="1" fill="#eab308"/>
  <text x="65" y="40" fill="#eab308" font-size="3" text-anchor="middle">F'</text>
</g>

<g data-step="2" data-description="Object placed beyond 2F">
  <line x1="20" y1="35" x2="20" y2="20" stroke="#22c55e" stroke-width="0.8" marker-end="url(#arrowhead)"/>
  <text x="20" y="17" fill="#22c55e" font-size="3" text-anchor="middle">Object</text>
</g>

<g data-step="3" data-description="Ray tracing and image formation">
  <line x1="20" y1="20" x2="50" y2="20" stroke="#ef4444" stroke-width="0.5"/>
  <line x1="50" y1="20" x2="75" y2="45" stroke="#ef4444" stroke-width="0.5"/>
  <line x1="20" y1="20" x2="75" y2="45" stroke="#f59e0b" stroke-width="0.5" stroke-dasharray="1,1"/>
  <line x1="75" y1="35" x2="75" y2="45" stroke="#3b82f6" stroke-width="0.8"/>
  <text x="75" y="50" fill="#3b82f6" font-size="3" text-anchor="middle">Image</text>
  <text x="75" y="54" fill="#3b82f6" font-size="2" text-anchor="middle">(Real, Inverted)</text>
</g>
`, 'Convex Lens Ray Diagram');

console.log('✅ All 8 comprehensive tests initialized successfully!');
console.log('📊 Diagrams created:', {
    lpp: 'Linear Programming Problem',
    mo: 'Molecular Orbital Diagram',
    hund: "Hund's Rule",
    bohr: "Bohr's Model",
    dorbital: 'd Orbital',
    vsepr: 'Trigonal Bipyramidal',
    plantcell: 'Plant Cell',
    lens: 'Convex Lens'
});

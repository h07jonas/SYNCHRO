// Original locomotive silhouettes — side profile, monochrome,
// designed at 320×80 viewBox; will scale anywhere.
// Each export: {id, name, type, road, addr, maxKmh, scale, color, accent, render}

const Loco = {};

// -- Drive wheel helper (steam loco) ----------------------------------
function steamWheel(cx, cy, r) {
  return (
    <g key={cx}>
      <circle cx={cx} cy={cy} r={r} fill="#0d1116" stroke="currentColor" strokeWidth="2.5"/>
      <circle cx={cx} cy={cy} r={r * 0.45} fill="currentColor"/>
      <circle cx={cx} cy={cy} r={r * 0.15} fill="#0d1116"/>
      {/* spokes */}
      {[0,60,120].map(a => (
        <line key={a}
          x1={cx + Math.cos(a*Math.PI/180)*r*0.9}
          y1={cy + Math.sin(a*Math.PI/180)*r*0.9}
          x2={cx - Math.cos(a*Math.PI/180)*r*0.9}
          y2={cy - Math.sin(a*Math.PI/180)*r*0.9}
          stroke="currentColor" strokeWidth="1.2"/>
      ))}
    </g>
  );
}

// 01 — STEAM LOCO ("Schwarze Anna") ----------------------------------
Loco.steam = {
  id: 'steam-01',
  name: 'Schwarze Anna',
  type: 'Dampflok BR 50',
  road: 'DRG',
  addr: 3,
  maxKmh: 80,
  scale: 'H0',
  color: '#e8edf3',
  accent: '#c2410c',
  weight: '88t',
  era: 'III',
  Render: ({ running }) => (
    <svg viewBox="0 0 320 96" width="100%" style={{ color: 'currentColor' }}>
      <defs>
        <linearGradient id="smoke" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.5"/>
          <stop offset="100%" stopColor="currentColor" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {running && (
        <g style={{ animation: 'steamRise 2.4s linear infinite' }}>
          <ellipse cx="78" cy="14" rx="14" ry="6" fill="url(#smoke)"/>
          <ellipse cx="92" cy="6" rx="10" ry="4" fill="url(#smoke)"/>
        </g>
      )}
      {/* smokestack */}
      <rect x="70" y="26" width="16" height="14" fill="currentColor"/>
      <rect x="66" y="22" width="24" height="6" fill="currentColor"/>
      {/* dome */}
      <path d="M 110 32 Q 122 22 134 32 L 134 40 L 110 40 Z" fill="currentColor"/>
      {/* boiler */}
      <rect x="56" y="40" width="124" height="28" fill="currentColor"/>
      <circle cx="60" cy="54" r="5" fill="#0d1116"/>
      <circle cx="60" cy="54" r="2.5" fill="currentColor"/>
      {/* cab */}
      <path d="M 178 24 L 230 24 L 230 68 L 178 68 Z" fill="currentColor"/>
      <rect x="186" y="32" width="16" height="18" fill="#0d1116"/>
      <rect x="208" y="32" width="16" height="18" fill="#0d1116"/>
      {/* tender */}
      <rect x="234" y="36" width="68" height="32" fill="currentColor"/>
      <line x1="240" y1="46" x2="296" y2="46" stroke="#0d1116" strokeWidth="1.5"/>
      {/* running board */}
      <rect x="48" y="68" width="256" height="4" fill="currentColor"/>
      {/* driving wheels */}
      <g className="loco-wheels">
        {steamWheel(80, 80, 12)}
        {steamWheel(118, 80, 12)}
        {steamWheel(156, 80, 12)}
      </g>
      {/* tender wheels */}
      {steamWheel(252, 80, 8)}
      {steamWheel(284, 80, 8)}
      {/* coupling rod */}
      <line x1="80" y1="80" x2="156" y2="80" stroke="currentColor" strokeWidth="2.5"/>
    </svg>
  )
};

// 02 — DIESEL HOOD UNIT ("V200") -------------------------------------
Loco.diesel = {
  id: 'diesel-01',
  name: 'V200 Polaris',
  type: 'Diesellok V200',
  road: 'DB',
  addr: 7,
  maxKmh: 140,
  scale: 'H0',
  color: '#dc2626',
  accent: '#fef3c7',
  weight: '76t',
  era: 'IV',
  Render: ({ running }) => (
    <svg viewBox="0 0 320 96" width="100%">
      {/* main body */}
      <path d="M 16 70 L 16 50 Q 16 32 38 32 L 282 32 Q 304 32 304 50 L 304 70 Z"
            fill="currentColor"/>
      {/* roof line */}
      <rect x="20" y="30" width="280" height="4" fill="currentColor" opacity="0.6"/>
      {/* windows band */}
      <rect x="32" y="38" width="256" height="10" fill="#0d1116"/>
      {[40,72,104,136,168,200,232,264].map(x => (
        <rect key={x} x={x} y="40" width="20" height="6" fill="currentColor" opacity="0.25"/>
      ))}
      {/* livery stripe */}
      <rect x="16" y="56" width="288" height="4" fill="#0d1116"/>
      <rect x="16" y="60" width="288" height="3" fill="currentColor" opacity="0.4"/>
      {/* headlights */}
      <circle cx="22" cy="64" r="3" fill={running ? '#fde68a' : '#0d1116'}/>
      <circle cx="298" cy="64" r="3" fill="#0d1116"/>
      {/* skirt */}
      <rect x="14" y="70" width="292" height="4" fill="currentColor" opacity="0.7"/>
      {/* bogies */}
      <rect x="42" y="74" width="60" height="10" fill="#0d1116"/>
      <rect x="218" y="74" width="60" height="10" fill="#0d1116"/>
      {/* wheels */}
      {[52, 72, 92, 228, 248, 268].map(x => (
        <circle key={x} cx={x} cy="84" r="7" fill="currentColor" stroke="#0d1116" strokeWidth="2"/>
      ))}
    </svg>
  )
};

// 03 — ELECTRIC LOCO ("E103") ---------------------------------------
Loco.electric = {
  id: 'electric-01',
  name: 'Rheingold E103',
  type: 'Elektrolok BR 103',
  road: 'DB',
  addr: 11,
  maxKmh: 200,
  scale: 'H0',
  color: '#1d4ed8',
  accent: '#fbbf24',
  weight: '114t',
  era: 'IV',
  Render: ({ running }) => (
    <svg viewBox="0 0 320 96" width="100%">
      {/* pantograph */}
      <g stroke="currentColor" strokeWidth="2" fill="none">
        <line x1="140" y1="34" x2="180" y2="34"/>
        <line x1="140" y1="34" x2="120" y2="22"/>
        <line x1="180" y1="34" x2="200" y2="22"/>
        <line x1="120" y1="22" x2="200" y2="22"/>
        <line x1="120" y1="22" x2="150" y2="34"/>
        <line x1="200" y1="22" x2="170" y2="34"/>
      </g>
      <line x1="116" y1="20" x2="204" y2="20" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
      {/* roof equipment */}
      <rect x="60" y="32" width="20" height="6" fill="currentColor"/>
      <rect x="240" y="32" width="20" height="6" fill="currentColor"/>
      {/* body - tapered nose */}
      <path d="M 10 72 L 22 38 L 298 38 L 310 72 Z" fill="currentColor"/>
      {/* roof */}
      <rect x="22" y="34" width="276" height="6" fill="currentColor"/>
      {/* windscreen + side windows */}
      <path d="M 26 44 L 36 44 L 36 56 L 26 56 Z" fill="#0d1116"/>
      {[44,72,100,128,156,184,212,240,268].map(x => (
        <rect key={x} x={x} y="44" width="20" height="10" fill="#0d1116"/>
      ))}
      <path d="M 294 44 L 284 44 L 284 56 L 294 56 Z" fill="#0d1116"/>
      {/* stripe */}
      <rect x="14" y="60" width="292" height="3" fill="#0d1116"/>
      {/* headlights */}
      <circle cx="18" cy="66" r="2.5" fill={running ? '#fde68a' : '#0d1116'}/>
      <circle cx="302" cy="66" r="2.5" fill="#0d1116"/>
      {/* bogies */}
      <rect x="50" y="72" width="64" height="10" fill="#0d1116"/>
      <rect x="206" y="72" width="64" height="10" fill="#0d1116"/>
      {[62, 82, 102, 218, 238, 258].map(x => (
        <circle key={x} cx={x} cy="82" r="6.5" fill="currentColor" stroke="#0d1116" strokeWidth="2"/>
      ))}
    </svg>
  )
};

// 04 — HIGH-SPEED ("ICE Velaro") -------------------------------------
Loco.hsr = {
  id: 'hsr-01',
  name: 'Velaro Komet',
  type: 'ICE 3 Triebkopf',
  road: 'DB',
  addr: 28,
  maxKmh: 320,
  scale: 'H0',
  color: '#f4f6f9',
  accent: '#dc2626',
  weight: '54t',
  era: 'VI',
  Render: ({ running }) => (
    <svg viewBox="0 0 320 96" width="100%">
      {/* aerodynamic nose */}
      <path d="M 8 70 Q 8 56 22 50 Q 60 36 120 32 L 304 32 Q 308 32 308 36 L 308 70 Z"
            fill="currentColor"/>
      {/* roof crease */}
      <path d="M 22 50 Q 60 36 120 32 L 304 32" fill="none" stroke="#0d1116" strokeWidth="0.8" opacity="0.4"/>
      {/* cockpit window */}
      <path d="M 22 52 Q 50 42 92 40 L 92 50 Q 56 52 26 58 Z" fill="#0d1116"/>
      {/* passenger windows */}
      {[104,132,160,188,216,244,272].map(x => (
        <rect key={x} x={x} y="42" width="20" height="8" fill="#0d1116"/>
      ))}
      {/* doors */}
      <rect x="100" y="40" width="2" height="28" fill="#0d1116"/>
      <rect x="240" y="40" width="2" height="28" fill="#0d1116"/>
      {/* red stripe */}
      <rect x="14" y="56" width="294" height="3" fill={Loco.hsr.accent}/>
      <rect x="14" y="59" width="294" height="1.5" fill="#0d1116" opacity="0.3"/>
      {/* nose light */}
      <ellipse cx="14" cy="62" rx="3" ry="2" fill={running ? '#fde68a' : '#0d1116'}/>
      {/* skirt */}
      <rect x="14" y="70" width="294" height="4" fill="#0d1116"/>
      {/* bogies (low profile) */}
      <rect x="46" y="74" width="50" height="8" fill="#0d1116"/>
      <rect x="232" y="74" width="50" height="8" fill="#0d1116"/>
      {[56, 86, 242, 272].map(x => (
        <circle key={x} cx={x} cy="82" r="6" fill="currentColor" stroke="#0d1116" strokeWidth="2"/>
      ))}
    </svg>
  )
};

// 05 — SHUNTER ("Köf III") -------------------------------------------
Loco.shunter = {
  id: 'shunter-01',
  name: 'Käfer Köf',
  type: 'Kleindiesel Köf III',
  road: 'DB',
  addr: 4,
  maxKmh: 45,
  scale: 'H0',
  color: '#fbbf24',
  accent: '#0f172a',
  weight: '22t',
  era: 'IV',
  Render: ({ running }) => (
    <svg viewBox="0 0 320 96" width="100%">
      <g transform="translate(80, 0)">
        {/* hood */}
        <path d="M 0 70 L 0 48 L 60 48 L 60 28 L 110 28 L 110 70 Z" fill="currentColor"/>
        {/* cab windows */}
        <rect x="66" y="32" width="18" height="14" fill="#0d1116"/>
        <rect x="88" y="32" width="18" height="14" fill="#0d1116"/>
        <rect x="66" y="48" width="40" height="2" fill="#0d1116"/>
        {/* hood louvers */}
        {[6,14,22,30,38,46].map(x => (
          <line key={x} x1={x} y1="52" x2={x} y2="64" stroke="#0d1116" strokeWidth="1.2"/>
        ))}
        {/* warning chevrons */}
        <path d="M 0 64 L 8 64 L 4 70 Z" fill="#0d1116"/>
        <path d="M 110 64 L 102 64 L 106 70 Z" fill="#0d1116"/>
        {/* headlight */}
        <circle cx="6" cy="54" r="3" fill={running ? '#fde68a' : '#0d1116'}/>
        {/* skirt */}
        <rect x="0" y="70" width="110" height="4" fill="#0d1116"/>
        {/* wheels */}
        <circle cx="22" cy="80" r="8" fill="currentColor" stroke="#0d1116" strokeWidth="2"/>
        <circle cx="86" cy="80" r="8" fill="currentColor" stroke="#0d1116" strokeWidth="2"/>
        <line x1="22" y1="80" x2="86" y2="80" stroke="#0d1116" strokeWidth="2.5"/>
      </g>
    </svg>
  )
};

// 06 — GENERIC CUSTOM LOCO ---------------------------------------------
Loco.custom = {
  id: 'custom-01',
  name: 'Eigene Lok',
  type: 'DCC Decoder',
  road: 'Custom',
  addr: 3,
  maxKmh: 120,
  scale: 'H0',
  color: '#8a8a85',
  accent: '#1b1c1f',
  weight: '?',
  era: '?',
  Render: ({ running }) => (
    <svg viewBox="0 0 320 96" width="100%">
      <rect x="20" y="30" width="280" height="40" fill="currentColor" rx="4"/>
      <circle cx="60" cy="80" r="10" fill="currentColor" stroke="#0d1116" strokeWidth="2"/>
      <circle cx="260" cy="80" r="10" fill="currentColor" stroke="#0d1116" strokeWidth="2"/>
      <line x1="60" y1="80" x2="260" y2="80" stroke="#0d1116" strokeWidth="2.5"/>
      <circle cx="304" cy="50" r="3" fill={running ? '#fde68a' : '#0d1116'}/>
      <text x="160" y="55" fill="#fff" fontSize="16" fontFamily="JetBrains Mono" fontWeight="600" textAnchor="middle" opacity="0.8">CUSTOM DCC</text>
    </svg>
  )
};

const LOCO_ROSTER = [Loco.steam, Loco.diesel, Loco.electric, Loco.hsr, Loco.shunter, Loco.custom];

window.LOCO_ROSTER = LOCO_ROSTER;
window.Loco = Loco;

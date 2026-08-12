/* global React */
// Track Map Editor — RAILMASTER V2
// Grid: 18 cols × 9 rows of 56 px cells.
// Cell geometry : { type, rot: 0|1|2|3, state? }
// Cell metadata : cellProps["c,r"] = { label, dccAddr }

const { useState, useCallback, useMemo, useEffect, useRef } = React;

const COLS = 18;
const ROWS = 9;
const CELL = 56;

const railColor = 'var(--ink-2)';
const tieColor  = 'var(--hair-2)';

// ────────────────────────────────────────────────────────
//  SVG ICON COMPONENT
// ────────────────────────────────────────────────────────
function Icon({ name, size = 14, strokeWidth = 1.6 }) {
  const s = strokeWidth;
  const icons = {
    cursor: (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 2 L3 13 L6.5 9.5 L9.5 14 L11 13 L8 8.5 L12.5 8.5 Z" fill="currentColor" stroke="none"/>
      </svg>
    ),
    eraser: (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 13 L5.5 4 L13.5 7.5 L10 16Z" />
        <line x1="5" y1="11" x2="13" y2="11"/>
        <line x1="2" y1="14" x2="16" y2="14"/>
      </svg>
    ),
    warning: (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 2 L15 14 L1 14 Z"/>
        <line x1="8" y1="7" x2="8" y2="10"/>
        <circle cx="8" cy="12.5" r="0.6" fill="currentColor" stroke="none"/>
      </svg>
    ),
    undo: (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 8 A6 6 0 1 1 6 13.2"/>
        <path d="M3 4 L3 8 L7 8"/>
      </svg>
    ),
    refresh: (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 8 A5 5 0 1 1 10.5 3.5"/>
        <path d="M10 1 L10.5 3.5 L13 3"/>
      </svg>
    ),
    trash: (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="2,4 14,4"/>
        <path d="M5 4 V2.5 A0.5 0.5 0 0 1 5.5 2 H10.5 A0.5 0.5 0 0 1 11 2.5 V4"/>
        <path d="M4 4 L4.5 14 H11.5 L12 4"/>
        <line x1="6.5" y1="7" x2="6.5" y2="11.5"/>
        <line x1="9.5" y1="7" x2="9.5" y2="11.5"/>
      </svg>
    ),
    download: (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 2 L8 11"/>
        <path d="M4.5 8 L8 11.5 L11.5 8"/>
        <path d="M2 13 L2 14.5 A0.5 0.5 0 0 0 2.5 15 H13.5 A0.5 0.5 0 0 0 14 14.5 V13"/>
      </svg>
    ),
    upload: (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 11 L8 2"/>
        <path d="M4.5 5 L8 1.5 L11.5 5"/>
        <path d="M2 13 L2 14.5 A0.5 0.5 0 0 0 2.5 15 H13.5 A0.5 0.5 0 0 0 14 14.5 V13"/>
      </svg>
    ),
    rotate: (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 8 A5 5 0 0 1 3 8"/>
        <path d="M13 4.5 L13 8 L9.5 8"/>
      </svg>
    ),
    close: (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={s} strokeLinecap="round">
        <line x1="3" y1="3" x2="13" y2="13"/>
        <line x1="13" y1="3" x2="3" y2="13"/>
      </svg>
    ),
    'arrow-left-right': (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 8 L5 5 M1 8 L5 11 M1 8 L15 8 M15 8 L11 5 M15 8 L11 11"/>
      </svg>
    ),
    'arrow-branch': (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 8 L14 8"/>
        <path d="M8 8 L14 3"/>
        <path d="M12 7.5 L14 8 L12 8.5"/>
        <path d="M12 3.5 L14 3 L12 2.5"/>
      </svg>
    ),
    'plus-circle': (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={s} strokeLinecap="round">
        <circle cx="8" cy="8" r="6"/>
        <line x1="8" y1="5" x2="8" y2="11"/>
        <line x1="5" y1="8" x2="11" y2="8"/>
      </svg>
    ),
    play: (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" stroke="none">
        <path d="M4 2.5 L13.5 8 L4 13.5 Z"/>
      </svg>
    ),
    pencil: (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 2 L14 5 L5 14 L2 14 L2 11 Z"/>
        <line x1="9" y1="4" x2="12" y2="7"/>
      </svg>
    ),
    layers: (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 6 L8 2 L15 6 L8 10 Z"/>
        <path d="M1 10 L8 14 L15 10"/>
        <path d="M1 8 L8 12 L15 8"/>
      </svg>
    ),
    route: (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="3" cy="8" r="2"/>
        <circle cx="13" cy="8" r="2"/>
        <path d="M5 8 Q8 3 11 8"/>
        <path d="M5 8 Q8 13 11 8"/>
      </svg>
    ),
    signal: (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="1" width="6" height="10" rx="1"/>
        <circle cx="8" cy="3.5" r="1.5" fill="currentColor" stroke="none"/>
        <circle cx="8" cy="8.5" r="1.5" fill="currentColor" stroke="none"/>
        <line x1="8" y1="11" x2="8" y2="15"/>
      </svg>
    ),
  };
  return icons[name] || <span style={{fontSize: size * 0.9}}>{name}</span>;
}

function Ties({ x1=0, x2=56, y1=22, y2=34 } = {}) {
  const span = x2 - x1;
  const count = Math.round(span / 11);
  const step = span / count;
  return (
    <g stroke={tieColor} strokeWidth="1.3">
      {Array.from({length: count + 1}).map((_, i) => {
        const x = Math.round(x1 + i * step);
        return <line key={i} x1={x} y1={y1} x2={x} y2={y2}/>;
      })}
    </g>
  );
}

// Gray ballast fill between rails (straight segments)
function Ballast({ x=0, y=22.5, w=56, h=11 } = {}) {
  return <rect x={x} y={y} width={w} height={h} fill="#b8a898" opacity="0.18"/>;
}

// Piece description hints
const PIECE_HINTS = {
  straight:  'Gerader Abschnitt. Verbindet Ost und West.',
  curve:     'Bogenstück. Verbindet West mit Süd (90°).',
  slope:     'Steigung / Gefälle. Zeigt Höhenunterschied an.',
  buffer:    'Prellbock. Endpunkt einer Strecke.',
  siding:    'Rangiergleis mit Halteschild.',
  turnoutL:  'Linksweiche. Gerade oder Abzweig nach Norden.',
  turnoutR:  'Rechtsweiche. Gerade oder Abzweig nach Süden.',
  turnoutY:  'Y-Weiche. Symmetrisch – links oder rechts.',
  dkw:       'Doppelkreuzungsweiche. Alle vier Richtungen.',
  cross:     'Kreuzung. Zwei Gleise kreuzen sich stumpf.',
  turntable: 'Drehscheibe. Dreht Loks in jede Himmelsrichtung.',
  signal:    'Hauptsignal (Hp0/Hp1/Hp2). Klicken zum Schalten.',
  station:   'Bahnsteig. Haltebereich für Fahrgäste.',
  bridge:    'Brücke. Überquert ein Hindernis.',
  tunnel:    'Tunnel. Führt durch einen Berg.',
  crossing:  'Beschrankter Bahnübergang (Bü).',
  depot:     'Lokschuppen. Abstellort für Triebfahrzeuge.',
  tree:      'Baum. Dekoration.',
  house:     'Wohnhaus. Dekoration.',
  factory:   'Fabrik mit Schornstein. Dekoration.',
  water:     'Gewässer / Fluss. Dekoration.',
};

// ────────────────────────────────────────────────────────
//  TRACK PIECES
// ────────────────────────────────────────────────────────
const PIECES = {

  // ── GLEISE ──────────────────────────────────────────
  straight: {
    label: 'Gerade', cat: 'gleis',
    edges: () => ['W', 'E'],
    render: () => (
      <g>
        <Ballast/>
        <Ties/>
        <line x1="0" y1="24" x2="56" y2="24" stroke={railColor} strokeWidth="1.8"/>
        <line x1="0" y1="32" x2="56" y2="32" stroke={railColor} strokeWidth="1.8"/>
      </g>
    ),
  },

  curve: {
    label: 'Bogen', cat: 'gleis',
    edges: () => ['W', 'S'],
    render: () => (
      <g fill="none">
        {/* Curved ballast area */}
        <path d="M 0 22.5 A 33.5 33.5 0 0 1 33.5 56 L 24 56 A 24 24 0 0 0 0 32 Z"
              fill="#b8a898" opacity="0.18"/>
        {[0.12, 0.28, 0.44, 0.6, 0.76, 0.9].map(t => {
          const a = (Math.PI / 2) * t, rm = 28;
          const x = rm * Math.sin(a), y = 56 - rm * Math.cos(a);
          const nx = Math.sin(a), ny = -Math.cos(a);
          return <line key={t} x1={x - nx*6} y1={y - ny*6} x2={x + nx*6} y2={y + ny*6}
                       stroke={tieColor} strokeWidth="1.3"/>;
        })}
        <path d="M 0 24 A 32 32 0 0 1 32 56" stroke={railColor} strokeWidth="1.8"/>
        <path d="M 0 32 A 24 24 0 0 1 24 56" stroke={railColor} strokeWidth="1.8"/>
      </g>
    ),
  },

  slope: {
    label: 'Steigung', cat: 'gleis',
    edges: () => ['W', 'E'],
    render: () => (
      <g>
        <Ballast/>
        <Ties/>
        <line x1="0" y1="24" x2="56" y2="24" stroke={railColor} strokeWidth="1.8"/>
        <line x1="0" y1="32" x2="56" y2="32" stroke={railColor} strokeWidth="1.8"/>
        <path d="M 10 34 L 20 22" stroke="var(--accent)" strokeWidth="1.4" strokeLinecap="round" opacity="0.75"/>
        <path d="M 17 23 L 20 22 L 19 25" stroke="var(--accent)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.75"/>
        <path d="M 30 34 L 40 22" stroke="var(--accent)" strokeWidth="1.4" strokeLinecap="round" opacity="0.45"/>
        <path d="M 37 23 L 40 22 L 39 25" stroke="var(--accent)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.45"/>
      </g>
    ),
  },

  buffer: {
    label: 'Prellbock', cat: 'gleis',
    edges: () => ['W'],
    render: () => (
      <g>
        <Ballast x={0} w={44}/>
        <Ties x1={0} x2={44}/>
        <line x1="0" y1="24" x2="44" y2="24" stroke={railColor} strokeWidth="1.8"/>
        <line x1="0" y1="32" x2="44" y2="32" stroke={railColor} strokeWidth="1.8"/>
        {/* Buffer beam */}
        <rect x="41" y="19" width="6" height="18" rx="1.5" fill="var(--dim)" opacity="0.85"/>
        {/* Spring coils */}
        <line x1="41" y1="22" x2="44" y2="22" stroke={railColor} strokeWidth="1.5"/>
        <line x1="41" y1="25" x2="44" y2="25" stroke={railColor} strokeWidth="1.5"/>
        <line x1="41" y1="28" x2="44" y2="28" stroke={railColor} strokeWidth="1.5"/>
        <line x1="41" y1="31" x2="44" y2="31" stroke={railColor} strokeWidth="1.5"/>
        <line x1="41" y1="34" x2="44" y2="34" stroke={railColor} strokeWidth="1.5"/>
        {/* Stop post */}
        <rect x="46" y="15" width="5" height="26" rx="2" fill="var(--mute)" opacity="0.9"/>
        <rect x="47" y="20" width="3" height="16" rx="1" fill="var(--hair-2)" opacity="0.5"/>
      </g>
    ),
  },

  siding: {
    label: 'Rangiergleis', cat: 'gleis',
    edges: () => ['W', 'E'],
    render: () => (
      <g>
        <Ballast/>
        <Ties/>
        <line x1="0" y1="24" x2="56" y2="24" stroke={railColor} strokeWidth="1.8"/>
        <line x1="0" y1="32" x2="56" y2="32" stroke={railColor} strokeWidth="1.8"/>
        {/* Halt sign post */}
        <line x1="28" y1="22" x2="28" y2="9" stroke="var(--mute)" strokeWidth="1.2"/>
        {/* Sign board */}
        <rect x="22" y="4" width="12" height="9" rx="1.5" fill="var(--surface)" stroke="var(--dim)" strokeWidth="0.8"/>
        {/* HALT stripes */}
        <rect x="23" y="5" width="10" height="2" rx="0.5" fill="var(--accent)" opacity="0.7"/>
        <rect x="23" y="8" width="10" height="2" rx="0.5" fill="var(--dim)" opacity="0.6"/>
        <rect x="23" y="11" width="10" height="1.5" rx="0.5" fill="var(--mute)" opacity="0.4"/>
        {/* Speed limit disc */}
        <circle cx="44" cy="14" r="5" fill="var(--surface)" stroke="var(--red)" strokeWidth="1.2"/>
        <text x="44" y="17" textAnchor="middle" fontSize="5" fill="var(--red)" fontFamily="monospace" fontWeight="700">20</text>
      </g>
    ),
  },

  // ── WEICHEN ──────────────────────────────────────────
  turnoutR: {
    label: 'Weiche R', cat: 'weiche',
    edges: (s) => s === 'abzweig' ? ['W', 'S'] : ['W', 'E'],
    allEdges: ['W', 'E', 'S'],
    render: ({ state = 'gerade', accent } = {}) => {
      const ac    = accent || 'var(--accent)';
      const mainC = state === 'gerade'  ? ac : railColor;
      const brC   = state === 'abzweig' ? ac : railColor;
      const dotC  = state === 'abzweig' ? ac : 'var(--mute)';
      return (
        <g fill="none">
          <Ballast/>
          <Ties/>
          <line x1="0" y1="24" x2="56" y2="24" stroke={mainC} strokeWidth="1.8"/>
          <line x1="0" y1="32" x2="56" y2="32" stroke={mainC} strokeWidth="1.8"/>
          <path d="M 0 24 A 32 32 0 0 1 32 56" stroke={brC} strokeWidth="1.8"/>
          <path d="M 0 32 A 24 24 0 0 1 24 56" stroke={brC} strokeWidth="1.8"/>
          {/* Point indicator */}
          <circle cx="7" cy="28" r="3" fill="var(--surface)" stroke={dotC} strokeWidth="1.2"/>
          <circle cx="7" cy="28" r="1.5" fill={dotC}/>
        </g>
      );
    },
    interactive: true,
  },

  turnoutL: {
    label: 'Weiche L', cat: 'weiche',
    edges: (s) => s === 'abzweig' ? ['W', 'N'] : ['W', 'E'],
    allEdges: ['W', 'E', 'N'],
    render: ({ state = 'gerade', accent } = {}) => {
      const ac    = accent || 'var(--accent)';
      const mainC = state === 'gerade'  ? ac : railColor;
      const brC   = state === 'abzweig' ? ac : railColor;
      const dotC  = state === 'abzweig' ? ac : 'var(--mute)';
      return (
        <g fill="none">
          <Ballast/>
          <Ties/>
          <line x1="0" y1="24" x2="56" y2="24" stroke={mainC} strokeWidth="1.8"/>
          <line x1="0" y1="32" x2="56" y2="32" stroke={mainC} strokeWidth="1.8"/>
          <path d="M 0 32 A 32 32 0 0 0 32 0" stroke={brC} strokeWidth="1.8"/>
          <path d="M 0 24 A 24 24 0 0 0 24 0" stroke={brC} strokeWidth="1.8"/>
          <circle cx="7" cy="28" r="3" fill="var(--surface)" stroke={dotC} strokeWidth="1.2"/>
          <circle cx="7" cy="28" r="1.5" fill={dotC}/>
        </g>
      );
    },
    interactive: true,
  },

  turnoutY: {
    label: 'Y-Weiche', cat: 'weiche',
    edges: (s) => s === 'links' ? ['W', 'N'] : ['W', 'S'],
    allEdges: ['W', 'N', 'S'],
    render: ({ state = 'rechts', accent } = {}) => {
      const ac  = accent || 'var(--accent)';
      const upC = state === 'links'  ? ac : railColor;
      const dnC = state === 'rechts' ? ac : railColor;
      return (
        <g fill="none">
          <Ballast/>
          <Ties/>
          <path d="M 0 32 A 32 32 0 0 0 32 0"  stroke={upC} strokeWidth="1.8"/>
          <path d="M 0 24 A 24 24 0 0 0 24 0"  stroke={upC} strokeWidth="1.8"/>
          <path d="M 0 24 A 32 32 0 0 1 32 56" stroke={dnC} strokeWidth="1.8"/>
          <path d="M 0 32 A 24 24 0 0 1 24 56" stroke={dnC} strokeWidth="1.8"/>
          <circle cx="7" cy="28" r="3" fill="var(--surface)" stroke={ac} strokeWidth="1.2"/>
          <circle cx="7" cy="28" r="1.5" fill={ac}/>
        </g>
      );
    },
    interactive: true,
  },

  dkw: {
    label: 'DKW', cat: 'weiche',
    edges: () => ['W', 'E', 'N', 'S'],
    render: ({ state = 'gerade', accent } = {}) => {
      const ac    = accent || 'var(--accent)';
      const mainC = state === 'gerade' ? ac : railColor;
      const xC    = state === 'kreuz'  ? ac : railColor;
      return (
        <g fill="none">
          {/* Double ballast strips */}
          <rect x="0" y="16" width="56" height="12" fill="#b8a898" opacity="0.18"/>
          <rect x="0" y="28" width="56" height="12" fill="#b8a898" opacity="0.18"/>
          {/* Upper ties */}
          <Ties x1={0} x2={56} y1={16} y2={28}/>
          {/* Lower ties */}
          <Ties x1={0} x2={56} y1={28} y2={40}/>
          <line x1="0" y1="18" x2="56" y2="18" stroke={mainC} strokeWidth="1.8"/>
          <line x1="0" y1="26" x2="56" y2="26" stroke={mainC} strokeWidth="1.8"/>
          <line x1="0" y1="30" x2="56" y2="30" stroke={mainC} strokeWidth="1.8"/>
          <line x1="0" y1="38" x2="56" y2="38" stroke={mainC} strokeWidth="1.8"/>
          <line x1="14" y1="22" x2="42" y2="34" stroke={xC} strokeWidth="1.8"/>
          <line x1="18" y1="22" x2="46" y2="34" stroke={xC} strokeWidth="1.8"/>
          <line x1="14" y1="34" x2="42" y2="22" stroke={xC} strokeWidth="1.8"/>
          <line x1="18" y1="34" x2="46" y2="22" stroke={xC} strokeWidth="1.8"/>
          {/* Center indicator */}
          <circle cx="30" cy="28" r="3.5" fill="var(--surface)" stroke={ac} strokeWidth="1.2"/>
          <circle cx="30" cy="28" r="1.8" fill={ac}/>
        </g>
      );
    },
    interactive: true,
  },

  cross: {
    label: 'Kreuzung', cat: 'weiche',
    edges: () => ['W', 'E', 'N', 'S'],
    render: () => (
      <g>
        {/* Horizontal ballast */}
        <Ballast/>
        {/* Vertical ballast */}
        <rect x="23" y="0" width="10" height="56" fill="#b8a898" opacity="0.18"/>
        <Ties/>
        {/* Vertical ties */}
        <g stroke={tieColor} strokeWidth="1.3">
          {[8, 19, 29, 40, 50].map(y => (
            <line key={y} x1="21" y1={y} x2="35" y2={y}/>
          ))}
        </g>
        <line x1="0"  y1="24" x2="56" y2="24" stroke={railColor} strokeWidth="1.8"/>
        <line x1="0"  y1="32" x2="56" y2="32" stroke={railColor} strokeWidth="1.8"/>
        <line x1="24" y1="0"  x2="24" y2="56" stroke={railColor} strokeWidth="1.8"/>
        <line x1="32" y1="0"  x2="32" y2="56" stroke={railColor} strokeWidth="1.8"/>
        {/* Crossing frogs (where rails cross) */}
        <circle cx="24" cy="24" r="2" fill="var(--surface)" stroke={railColor} strokeWidth="0.8"/>
        <circle cx="32" cy="24" r="2" fill="var(--surface)" stroke={railColor} strokeWidth="0.8"/>
        <circle cx="24" cy="32" r="2" fill="var(--surface)" stroke={railColor} strokeWidth="0.8"/>
        <circle cx="32" cy="32" r="2" fill="var(--surface)" stroke={railColor} strokeWidth="0.8"/>
      </g>
    ),
  },

  turntable: {
    label: 'Drehscheibe', cat: 'weiche',
    edges: (s) => {
      const dir = s || 'E';
      return ['W', dir === 'E' ? 'E' : dir === 'N' ? 'N' : dir === 'S' ? 'S' : 'W'];
    },
    render: ({ state = 'E', accent } = {}) => {
      const ac = accent || 'var(--accent)';
      const angle = state === 'N' ? -90 : state === 'S' ? 90 : state === 'W' ? 180 : 0;
      return (
        <g>
          {/* Platform circle */}
          <circle cx="28" cy="28" r="24" fill="var(--surface-2)" stroke="var(--hair-2)" strokeWidth="1.2"/>
          {/* Rotating bridge */}
          <g transform={`rotate(${angle}, 28, 28)`}>
            <line x1="4" y1="25" x2="52" y2="25" stroke={railColor} strokeWidth="1.6"/>
            <line x1="4" y1="31" x2="52" y2="31" stroke={railColor} strokeWidth="1.6"/>
            {[12, 22, 34, 44].map(x => (
              <line key={x} x1={x} y1="23" x2={x} y2="33" stroke={tieColor} strokeWidth="1.2"/>
            ))}
          </g>
          {/* Center axle */}
          <circle cx="28" cy="28" r="4" fill="var(--surface)" stroke={ac} strokeWidth="1.5"/>
          <circle cx="28" cy="28" r="1.5" fill={ac}/>
          {/* Outer ring */}
          <circle cx="28" cy="28" r="24" fill="none" stroke="var(--mute)" strokeWidth="0.8" strokeDasharray="4,4"/>
        </g>
      );
    },
    interactive: true,
  },

  // ── AUSSTATTUNG ──────────────────────────────────────
  signal: {
    label: 'Signal', cat: 'ausstattung',
    edges: () => ['W', 'E'],
    blocks: (s) => s === 'rot',
    render: ({ state = 'gruen' } = {}) => {
      const isRot   = state === 'rot';
      const isGelb  = state === 'gelb';
      const isGruen = state === 'gruen';
      const glowRot   = isRot   ? 'rgba(201,56,56,0.35)'    : 'none';
      const glowGelb  = isGelb  ? 'rgba(230,165,42,0.35)'   : 'none';
      const glowGruen = isGruen ? 'rgba(47,138,77,0.35)'    : 'none';
      return (
        <g>
          <Ballast/>
          <Ties/>
          <line x1="0"  y1="24" x2="56" y2="24" stroke={railColor} strokeWidth="1.8"/>
          <line x1="0"  y1="32" x2="56" y2="32" stroke={railColor} strokeWidth="1.8"/>
          {/* Signal mast */}
          <rect x="27" y="22" width="2" height="16" rx="0.5" fill="var(--dim)"/>
          {/* Signal housing */}
          <rect x="21" y="1" width="14" height="20" rx="2.5"
                fill="#1a1e24" stroke="var(--dim)" strokeWidth="1"/>
          {/* Visor visors */}
          <rect x="21.5" y="4.5" width="13" height="1.5" rx="0.5" fill="var(--dim)" opacity="0.6"/>
          <rect x="21.5" y="11" width="13" height="1.5" rx="0.5" fill="var(--dim)" opacity="0.6"/>
          {/* Glow halos */}
          {isRot   && <circle cx="28" cy="6.5"  r="4.5" fill={glowRot}   filter="url(#blur)"/>}
          {isGelb  && <circle cx="28" cy="13.5" r="4.5" fill={glowGelb}  filter="url(#blur)"/>}
          {isGruen && <circle cx="28" cy="13.5" r="4.5" fill={glowGruen} filter="url(#blur)"/>}
          {/* Signal lights */}
          <circle cx="28" cy="6.5"  r="3" fill={isRot   ? 'var(--red)'   : '#2a2e34'}
                  stroke={isRot   ? 'var(--red)' : 'var(--dim)'} strokeWidth="0.5"/>
          <circle cx="28" cy="13.5" r="3" fill={
            isGelb  ? '#e6a52a' :
            isGruen ? 'var(--green)' : '#2a2e34'}
            stroke={isGelb ? '#e6a52a' : isGruen ? 'var(--green)' : 'var(--dim)'} strokeWidth="0.5"/>
          {/* Light reflections */}
          {isRot   && <circle cx="26.5" cy="5.5"  r="1" fill="rgba(255,255,255,0.4)"/>}
          {isGelb  && <circle cx="26.5" cy="12.5" r="1" fill="rgba(255,255,255,0.4)"/>}
          {isGruen && <circle cx="26.5" cy="12.5" r="1" fill="rgba(255,255,255,0.4)"/>}
          {/* Signal arm position indicator */}
          <text x="28" y="24.5" textAnchor="middle" fontSize="5" fill="var(--mute)"
                fontFamily="JetBrains Mono, monospace" fontWeight="600">
            {isRot ? 'Hp0' : isGelb ? 'Hp2' : 'Hp1'}
          </text>
        </g>
      );
    },
    interactive: true,
  },

  station: {
    label: 'Bahnsteig', cat: 'ausstattung',
    edges: () => ['W', 'E'],
    render: () => (
      <g>
        <Ballast/>
        <Ties/>
        <line x1="0"  y1="24" x2="56" y2="24" stroke={railColor} strokeWidth="1.8"/>
        <line x1="0"  y1="32" x2="56" y2="32" stroke={railColor} strokeWidth="1.8"/>
        {/* Platform surface */}
        <rect x="0"  y="36" width="56" height="12" fill="var(--hair)" stroke="var(--hair-2)" strokeWidth="0.5"/>
        {/* Platform edge strip */}
        <rect x="0"  y="36" width="56" height="2.5" fill="var(--dim)" opacity="0.7"/>
        {/* Yellow safety line */}
        <rect x="2"  y="38.5" width="52" height="1.5" fill="#e6a52a" opacity="0.5"/>
        {/* Platform markings */}
        {[8, 20, 36, 48].map(x => (
          <circle key={x} cx={x} cy="43" r="0.8" fill="var(--mute)" opacity="0.35"/>
        ))}
        {/* Lamp posts */}
        <line x1="14" y1="22" x2="14" y2="36" stroke="var(--dim)" strokeWidth="0.8"/>
        <line x1="42" y1="22" x2="42" y2="36" stroke="var(--dim)" strokeWidth="0.8"/>
        <ellipse cx="14" cy="21" rx="3" ry="1.2" fill="#e6d68a" opacity="0.65"/>
        <ellipse cx="42" cy="21" rx="3" ry="1.2" fill="#e6d68a" opacity="0.65"/>
      </g>
    ),
  },

  bridge: {
    label: 'Brücke', cat: 'ausstattung',
    edges: () => ['W', 'E'],
    render: () => (
      <g fill="none">
        <Ballast/>
        <Ties/>
        <line x1="0"  y1="24" x2="56" y2="24" stroke={railColor} strokeWidth="1.8"/>
        <line x1="0"  y1="32" x2="56" y2="32" stroke={railColor} strokeWidth="1.8"/>
        {/* Bridge arch */}
        <path d="M 4 40 L 4 18 Q 28 2 52 18 L 52 40" fill="rgba(150,140,130,0.12)" stroke="var(--dim)" strokeWidth="1.4"/>
        {/* Arch ribs */}
        <path d="M 4 18 Q 28 2 52 18" stroke="var(--mute)" strokeWidth="1"/>
        {/* Vertical supports */}
        <line x1="4"  y1="18" x2="4"  y2="40" stroke="var(--dim)" strokeWidth="1.4"/>
        <line x1="52" y1="18" x2="52" y2="40" stroke="var(--dim)" strokeWidth="1.4"/>
        {/* Suspension hangers */}
        {[14, 21, 28, 35, 42].map(x => {
          const yTop = Math.round(40 - 38 * Math.sin(Math.acos((x - 28) / 28)));
          return <line key={x} x1={x} y1={yTop} x2={x} y2="24" stroke="var(--mute)" strokeWidth="0.7" opacity="0.7"/>;
        })}
      </g>
    ),
  },

  tunnel: {
    label: 'Tunnel', cat: 'ausstattung',
    edges: () => ['W', 'E'],
    render: () => (
      <g>
        {/* Mountain body */}
        <path d="M 0 56 L 0 32 Q 4 8 28 4 Q 52 8 56 32 L 56 56 Z"
              fill="var(--hair)" stroke="var(--hair-2)" strokeWidth="0.8"/>
        {/* Stone texture lines on mountain */}
        <path d="M 10 40 Q 20 32 28 30 Q 36 32 46 40" stroke="var(--hair-2)" strokeWidth="0.5" fill="none" opacity="0.6"/>
        <path d="M 6 50 Q 18 44 28 42 Q 38 44 50 50" stroke="var(--hair-2)" strokeWidth="0.5" fill="none" opacity="0.4"/>
        {/* Tunnel opening (dark interior) */}
        <path d="M 12 56 L 12 28 Q 12 14 22 14 L 34 14 Q 44 14 44 28 L 44 56"
              fill="rgba(0,0,0,0.35)" stroke="none"/>
        {/* Tunnel portal arch */}
        <path d="M 12 56 L 12 28 Q 12 14 22 14 L 34 14 Q 44 14 44 28 L 44 56"
              fill="none" stroke="var(--dim)" strokeWidth="1.8"/>
        {/* Portal keystone */}
        <rect x="25" y="12" width="6" height="4" rx="0.5" fill="var(--mute)" opacity="0.7"/>
        <Ballast/>
        <Ties/>
        <line x1="0" y1="24" x2="56" y2="24" stroke={railColor} strokeWidth="1.8"/>
        <line x1="0" y1="32" x2="56" y2="32" stroke={railColor} strokeWidth="1.8"/>
      </g>
    ),
  },

  crossing: {
    label: 'Bü-Übergang', cat: 'ausstattung',
    edges: () => ['W', 'E'],
    render: () => (
      <g>
        <rect x="18" y="0" width="20" height="56" fill="var(--dim)" opacity="0.2"/>
        <line x1="28" y1="0"  x2="28" y2="16" stroke="var(--surface)" strokeWidth="1.6" strokeDasharray="5,4"/>
        <line x1="28" y1="38" x2="28" y2="56" stroke="var(--surface)" strokeWidth="1.6" strokeDasharray="5,4"/>
        <Ties/>
        <line x1="0" y1="24" x2="56" y2="24" stroke={railColor} strokeWidth="1.6"/>
        <line x1="0" y1="32" x2="56" y2="32" stroke={railColor} strokeWidth="1.6"/>
        <rect x="2"  y="19" width="16" height="4" rx="1.5" fill="var(--red)" opacity="0.85"/>
        <rect x="38" y="33" width="16" height="4" rx="1.5" fill="var(--red)" opacity="0.85"/>
        <rect x="2"  y="14" width="3" height="9" rx="1" fill="var(--mute)"/>
        <rect x="51" y="33" width="3" height="9" rx="1" fill="var(--mute)"/>
      </g>
    ),
  },

  depot: {
    label: 'Lok-Depot', cat: 'ausstattung',
    edges: () => ['W'],
    render: () => (
      <g>
        {/* Main building */}
        <rect x="14" y="16" width="40" height="32" fill="var(--hair)" stroke="var(--hair-2)" strokeWidth="0.8"/>
        {/* Roof trapezoid */}
        <path d="M 12 16 L 20 6 L 52 6 L 56 16 Z" fill="var(--dim)" stroke="var(--hair-2)" strokeWidth="0.8"/>
        {/* Arch entrance */}
        <path d="M 14 48 L 14 28 Q 14 20 21 20 L 28 20 Q 35 20 35 28 L 35 48" fill="var(--bg)" stroke="var(--hair-2)" strokeWidth="0.8"/>
        {/* Side windows */}
        <rect x="38" y="22" width="10" height="8" rx="1" fill="rgba(150,200,255,0.35)" stroke="var(--hair-2)" strokeWidth="0.5"/>
        <rect x="38" y="34" width="10" height="8" rx="1" fill="rgba(150,200,255,0.35)" stroke="var(--hair-2)" strokeWidth="0.5"/>
        {/* Rail into depot */}
        <line x1="0"  y1="37" x2="14" y2="37" stroke={railColor} strokeWidth="1.6"/>
        <line x1="0"  y1="43" x2="14" y2="43" stroke={railColor} strokeWidth="1.6"/>
        {[2, 8].map(x => <line key={x} x1={x} y1="35" x2={x} y2="45" stroke={tieColor} strokeWidth="1.2"/>)}
      </g>
    ),
  },

  // ── DEKO ─────────────────────────────────────────────
  tree: {
    label: 'Baum', cat: 'deko', edges: () => [],
    render: () => (
      <g>
        <ellipse cx="28" cy="22" rx="14" ry="16" fill="#7fa978"/>
        <ellipse cx="20" cy="18" rx="8"  ry="10" fill="#92bd87"/>
        <rect x="25" y="34" width="6" height="14" fill="#8b6f4e"/>
      </g>
    ),
  },

  house: {
    label: 'Haus', cat: 'deko', edges: () => [],
    render: () => (
      <g>
        <rect x="6"  y="22" width="44" height="26" fill="#d9c6a8" stroke="var(--hair-2)"/>
        <path d="M 4 24 L 28 6 L 52 24 Z" fill="#a85e3c"/>
        <rect x="24" y="34" width="8"  height="14" fill="var(--mute)"/>
        <rect x="12" y="28" width="6"  height="6"  fill="var(--surface)"/>
        <rect x="38" y="28" width="6"  height="6"  fill="var(--surface)"/>
      </g>
    ),
  },

  factory: {
    label: 'Fabrik', cat: 'deko', edges: () => [],
    render: () => (
      <g>
        <rect x="4"  y="28" width="48" height="24" fill="#a09080"/>
        <rect x="8"  y="20" width="14" height="12" fill="#8c7d6e"/>
        <rect x="28" y="16" width="22" height="16" fill="#8c7d6e"/>
        <rect x="40" y="2" width="7" height="18" fill="var(--dim)"/>
        <ellipse cx="43.5" cy="2.5" rx="3.5" ry="1.5" fill="var(--mute)"/>
        <circle cx="43" cy="0" r="2.5" fill="var(--mute)" opacity="0.25"/>
        <rect x="8"  y="30" width="8"  height="7" rx="1" fill="rgba(150,200,255,0.4)" stroke="var(--hair-2)" strokeWidth="0.5"/>
        <rect x="20" y="30" width="8"  height="7" rx="1" fill="rgba(150,200,255,0.4)" stroke="var(--hair-2)" strokeWidth="0.5"/>
        <rect x="32" y="30" width="8"  height="7" rx="1" fill="rgba(150,200,255,0.4)" stroke="var(--hair-2)" strokeWidth="0.5"/>
        <rect x="44" y="30" width="6"  height="7" rx="1" fill="rgba(150,200,255,0.4)" stroke="var(--hair-2)" strokeWidth="0.5"/>
        <rect x="22" y="40" width="12" height="12" rx="1" fill="var(--mute)"/>
      </g>
    ),
  },

  water: {
    label: 'Gewässer', cat: 'deko', edges: () => [],
    render: () => (
      <g>
        <rect x="0" y="0" width="56" height="56" fill="rgba(74,170,210,0.22)"/>
        <path d="M 0 14 Q 14 10 28 14 Q 42 18 56 14" stroke="rgba(74,170,210,0.65)" strokeWidth="1.4" fill="none"/>
        <path d="M 0 24 Q 14 20 28 24 Q 42 28 56 24" stroke="rgba(74,170,210,0.55)" strokeWidth="1.4" fill="none"/>
        <path d="M 0 34 Q 14 30 28 34 Q 42 38 56 34" stroke="rgba(74,170,210,0.45)" strokeWidth="1.2" fill="none"/>
        <path d="M 0 44 Q 14 40 28 44 Q 42 48 56 44" stroke="rgba(74,170,210,0.35)" strokeWidth="1.0" fill="none"/>
      </g>
    ),
  },
};

const CATEGORIES = [
  { id: 'gleis',       label: 'Gleise',      items: ['straight', 'curve', 'slope', 'buffer', 'siding'] },
  { id: 'weiche',      label: 'Weichen',     items: ['turnoutL', 'turnoutR', 'turnoutY', 'dkw', 'cross', 'turntable'] },
  { id: 'ausstattung', label: 'Ausstattung', items: ['signal', 'station', 'bridge', 'tunnel', 'crossing', 'depot'] },
  { id: 'deko',        label: 'Deko',        items: ['tree', 'house', 'factory', 'water'] },
];

// ────────────────────────────────────────────────────────
//  CONNECTIVITY
// ────────────────────────────────────────────────────────
const EDGES    = ['N', 'E', 'S', 'W'];
const NEIGHBOR = { N: [0,-1], E: [1,0], S: [0,1], W: [-1,0] };
const OPPOSITE = { N: 'S', E: 'W', S: 'N', W: 'E' };
const rotateEdge = (e, rot) => EDGES[(EDGES.indexOf(e) + rot) % 4];

function activeEdges(cell) {
  if (!cell) return [];
  const piece = PIECES[cell.type];
  if (!piece?.edges) return [];
  return (piece.edges(cell.state) || []).map(e => rotateEdge(e, cell.rot || 0));
}

function allPieceEdges(cell) {
  if (!cell) return [];
  const p = PIECES[cell.type];
  if (!p?.edges) return [];
  return (p.allEdges || p.edges(cell.state) || []).map(e => rotateEdge(e, cell.rot || 0));
}

function followPath(cells, startC, startR) {
  const start = `${startC},${startR}`;
  if (!cells[start]) return new Set();
  const visited = new Set([start]);
  const queue = [[startC, startR]];
  while (queue.length) {
    const [c, r] = queue.shift();
    const cell = cells[`${c},${r}`];
    if (!cell) continue;
    const p = PIECES[cell.type];
    if (p?.blocks?.(cell.state)) continue;
    const edges = activeEdges(cell);
    for (const edge of edges) {
      const [dc, dr] = NEIGHBOR[edge];
      const nc = c + dc, nr = r + dr;
      const nk = `${nc},${nr}`;
      if (visited.has(nk)) continue;
      const ncell = cells[nk];
      if (!ncell) continue;
      if (!activeEdges(ncell).includes(OPPOSITE[edge])) continue;
      visited.add(nk);
      queue.push([nc, nr]);
    }
  }
  return visited;
}

function danglingEnds(cells) {
  const out = [];
  for (const k of Object.keys(cells)) {
    const [c, r] = k.split(',').map(Number);
    const cell = cells[k];
    if (!PIECES[cell.type] || PIECES[cell.type].cat === 'deko') continue;
    const edges = allPieceEdges(cell);
    for (const e of edges) {
      const [dc, dr] = NEIGHBOR[e];
      const nc = c + dc, nr = r + dr;
      if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) { out.push({ c, r, edge: e }); continue; }
      const neighbor = cells[`${nc},${nr}`];
      if (!neighbor) { out.push({ c, r, edge: e }); continue; }
      if (!allPieceEdges(neighbor).includes(OPPOSITE[e])) out.push({ c, r, edge: e });
    }
  }
  return out;
}

// ── Connection hint for hover preview ──
function getConnectionHint(tool, rotation, cells, c, r) {
  const piece = PIECES[tool];
  if (!piece?.edges || piece.cat === 'deko') return 'none';
  const rawEdges = piece.edges() || [];
  if (rawEdges.length === 0) return 'none';
  const edges = rawEdges.map(e => rotateEdge(e, rotation));
  let connected = 0;
  const total = edges.length;
  for (const edge of edges) {
    const [dc, dr] = NEIGHBOR[edge];
    const neighbor = cells[`${c+dc},${r+dr}`];
    if (neighbor && activeEdges(neighbor).includes(OPPOSITE[edge])) connected++;
  }
  if (connected === 0) return 'none';
  if (connected === total) return 'full';
  return 'partial';
}

// ────────────────────────────────────────────────────────
//  EXAMPLE LAYOUT
// ────────────────────────────────────────────────────────
function makeExample() {
  const cells = {};
  const put = (c, r, type, rot = 0, state) => { cells[`${c},${r}`] = { type, rot, state }; };

  // ── Main line (row 4) ──
  put(0,  4, 'buffer',   2);
  put(1,  4, 'straight');
  put(2,  4, 'siding');          // NEW: Rangiergleis
  put(3,  4, 'signal',   0, 'gruen');
  put(4,  4, 'straight');
  put(5,  4, 'turnoutR', 0, 'gerade');
  put(6,  4, 'straight');
  put(7,  4, 'straight');
  put(8,  4, 'turnoutL', 0, 'gerade');
  put(9,  4, 'station');
  put(10, 4, 'station');
  put(11, 4, 'crossing');        // NEW: Bü-Übergang
  put(12, 4, 'turnoutL', 2, 'gerade');
  put(13, 4, 'straight');
  put(14, 4, 'signal',   0, 'rot');
  put(15, 4, 'bridge');          // Bridge
  put(16, 4, 'straight');
  put(17, 4, 'buffer');

  // ── Bypass loop (row 5) ──
  put(5,  5, 'curve',    2);
  put(6,  5, 'straight');
  put(7,  5, 'straight');
  put(8,  5, 'straight');
  put(9,  5, 'straight');
  put(10, 5, 'straight');
  put(11, 5, 'straight');
  put(12, 5, 'curve',    1);

  // ── Upper branch (row 3) ──
  put(8,  3, 'curve',    3);
  put(9,  3, 'tunnel');          // Tunnel
  put(10, 3, 'station');
  put(11, 3, 'straight');
  put(12, 3, 'buffer');

  // ── Depot branch (off bypass, row 6) ──
  // turnoutR at bypass col 9 branches south
  put(9,  5, 'turnoutR', 0, 'gerade');   // replace straight with turnout
  put(9,  6, 'curve',    0);             // curve rot=0: W→S
  put(10, 6, 'turntable',0, 'E');        // NEW: Drehscheibe
  put(11, 6, 'depot');                   // NEW: Lok-Depot

  // ── Deko ──
  put(1,  2, 'tree');
  put(3,  2, 'house');
  put(7,  2, 'tree');
  put(11, 1, 'house');
  put(13, 1, 'factory');         // NEW: Fabrik
  put(15, 1, 'tree');
  put(16, 2, 'tree');
  put(0,  6, 'tree');
  put(4,  7, 'house');
  put(10, 7, 'water');           // NEW: Gewässer
  put(11, 7, 'water');
  put(14, 6, 'house');
  put(17, 6, 'tree');
  put(1,  7, 'tree');
  put(7,  7, 'tree');
  put(13, 7, 'tree');

  return cells;
}

// ────────────────────────────────────────────────────────
//  CELL INSPECTOR (Bauen mode – select tool)
// ────────────────────────────────────────────────────────
function CellInspector({ cellKey, cell, props, onPropsChange, onRotate, onDelete, onClose, accent }) {
  const piece = PIECES[cell.type];
  const [c, r] = cellKey.split(',').map(Number);
  const showDcc = piece.interactive || cell.type === 'crossing';
  const hint = PIECE_HINTS[cell.type] || '';

  return (
    <div className="map-inspector">
      <div className="map-inspector-head">
        <div className="map-inspector-title">
          <span className="map-inspector-type">{piece.label}</span>
          <span className="map-inspector-pos">({c}, {r})</span>
        </div>
        <button className="map-inspector-close" onClick={onClose} title="Schließen">
          <Icon name="close" size={12}/>
        </button>
      </div>

      {/* Live piece preview */}
      <div className="map-inspector-preview">
        <svg viewBox="0 0 56 56" width="56" height="56">
          <g transform={`rotate(${(cell.rot||0)*90}, 28, 28)`}>
            {piece.render({ state: cell.state, accent: accent || 'var(--accent)' })}
          </g>
        </svg>
        {hint && <p className="map-inspector-hint">{hint}</p>}
      </div>

      <div className="map-inspector-body">
        <div className="map-inspector-field">
          <label className="map-inspector-label">Bezeichnung</label>
          <input
            className="map-inspector-input"
            value={props.label || ''}
            onChange={e => onPropsChange({ ...props, label: e.target.value })}
            placeholder="z.B. W1, Gleis 2 …"
          />
        </div>
        {showDcc && (
          <div className="map-inspector-field">
            <label className="map-inspector-label">DCC-Adresse</label>
            <input
              className="map-inspector-input map-inspector-mono"
              type="number" min="1" max="9999"
              value={props.dccAddr || ''}
              onChange={e => onPropsChange({ ...props, dccAddr: e.target.value })}
              placeholder="1–9999"
            />
          </div>
        )}
        {/* Rotation info */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:2 }}>
          <span className="map-inspector-label">Rotation</span>
          <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:'11px', color:'var(--ink-2)', fontWeight:600 }}>
            {(cell.rot||0)*90}°
          </span>
        </div>
      </div>
      <div className="map-inspector-actions">
        <button className="map-inspector-btn" onClick={onRotate} title="Drehen (R)">
          <Icon name="rotate" size={12}/> Drehen
        </button>
        <button className="map-inspector-btn danger" onClick={onDelete}>
          <Icon name="trash" size={12}/> Löschen
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────
//  MAIN MAP VIEW
// ────────────────────────────────────────────────────────
function MapView({ accent, mode = 'fahren',
                   roster = [], statuses = {}, activeId = null,
                   onSetActiveId = () => {}, onSetStatus = () => {},
                   onEStop = () => {}, emergency = false, power = true }) {
  // ── Layouts ──
  const [layouts, setLayouts] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('rm-layouts') || 'null');
      if (saved && Array.isArray(saved) && saved.length > 0) return saved;
      const oldMap = JSON.parse(localStorage.getItem('rm-map') || 'null');
      return [{ id: 'layer-1', name: 'Hauptebene',
                cells: (oldMap && Object.keys(oldMap).length > 0) ? oldMap : makeExample() }];
    } catch { return [{ id: 'layer-1', name: 'Hauptebene', cells: makeExample() }]; }
  });
  const [activeLayerId, setActiveLayerId] = useState(() => {
    try { return localStorage.getItem('rm-active-layer') || 'layer-1'; } catch { return 'layer-1'; }
  });

  const activeLayerIndex = Math.max(0, layouts.findIndex(l => l.id === activeLayerId));
  const activeLayer      = layouts[activeLayerIndex] || layouts[0];
  const cells            = activeLayer.cells;

  const setCells = useCallback((updater) => {
    setLayouts(prev => {
      const idx = prev.findIndex(l => l.id === activeLayerId);
      if (idx < 0) return prev;
      const newCells = typeof updater === 'function' ? updater(prev[idx].cells) : updater;
      const copy = [...prev];
      copy[idx] = { ...copy[idx], cells: newCells };
      return copy;
    });
  }, [activeLayerId]);

  // ── Cell props (labels / DCC addresses) ──
  const [cellProps, setCellProps] = useState(() => {
    try { return JSON.parse(localStorage.getItem('rm-cell-props') || '{}'); } catch { return {}; }
  });

  // ── Routes ──
  const [routes, setRoutes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('rm-routes') || '[]'); } catch { return []; }
  });

  // ── Tool state ──
  const [tool,         setTool]         = useState('straight');
  const [activeCat,    setActiveCat]    = useState('gleis');
  const [rotation,     setRotation]     = useState(0);
  const [hover,        setHover]        = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [showWarnings, setShowWarnings] = useState(true);
  const [history,      setHistory]      = useState([]);
  const [pendingKeys,  setPendingKeys]  = useState(new Set());
  const [zoom,         setZoom]         = useState(1);

  const isPainting = useRef(false);
  const lastKey    = useRef(null);

  // ── Persist ──
  useEffect(() => {
    try {
      localStorage.setItem('rm-layouts', JSON.stringify(layouts));
      localStorage.setItem('rm-active-layer', activeLayerId);
      localStorage.setItem('rm-map', JSON.stringify(cells));
    } catch {}
  }, [layouts, activeLayerId, cells]);

  useEffect(() => {
    try { localStorage.setItem('rm-cell-props', JSON.stringify(cellProps)); } catch {}
  }, [cellProps]);

  useEffect(() => {
    try { localStorage.setItem('rm-routes', JSON.stringify(routes)); } catch {}
  }, [routes]);

  // Clean up orphaned cellProps when cells change
  useEffect(() => {
    const cellKeys = new Set(Object.keys(cells));
    const orphans  = Object.keys(cellProps).filter(k => !cellKeys.has(k));
    if (orphans.length > 0) {
      setCellProps(p => {
        const n = { ...p };
        orphans.forEach(k => delete n[k]);
        return n;
      });
    }
  }, [cells]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear selection when mode changes
  useEffect(() => { setSelectedCell(null); }, [mode]);

  // ── Keyboard shortcuts (bauen) ──
  useEffect(() => {
    if (mode !== 'bauen') return;
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.key.toLowerCase() === 'r') {
        if (selectedCell && cells[`${selectedCell.c},${selectedCell.r}`]) {
          const k = `${selectedCell.c},${selectedCell.r}`;
          setCells(p => p[k] ? { ...p, [k]: { ...p[k], rot: ((p[k].rot || 0) + 1) % 4 } } : p);
        } else {
          setRotation(r => (r + 1) % 4);
        }
      } else if (e.key === 'Escape') {
        setTool('select');
        setSelectedCell(null);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedCell) {
          const k = `${selectedCell.c},${selectedCell.r}`;
          if (cells[k]) {
            setHistory(h => [...h.slice(-29), cells]);
            setCells(p => { const n = { ...p }; delete n[k]; return n; });
            setSelectedCell(null);
          }
        } else {
          setTool('erase');
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        setHistory(h => {
          if (!h.length) return h;
          setCells(h[h.length - 1]);
          return h.slice(0, -1);
        });
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        // Ctrl+D: duplicate selected cell
        if (selectedCell) {
          e.preventDefault();
          const k = `${selectedCell.c},${selectedCell.r}`;
          if (cells[k]) {
            setTool(cells[k].type);
            setRotation(cells[k].rot || 0);
          }
        }
      } else if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        // Number keys 1–9: select piece by index in current category
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= 9) {
          const cat = CATEGORIES.find(c => c.id === activeCat) || CATEGORIES[0];
          const idx = n - 1;
          if (idx < cat.items.length) {
            setTool(cat.items[idx]);
            setSelectedCell(null);
          }
        }
        // Tab: cycle through categories
        if (e.key === 'Tab') {
          e.preventDefault();
          const catIdx = CATEGORIES.findIndex(c => c.id === activeCat);
          const nextCat = CATEGORIES[(catIdx + 1) % CATEGORIES.length];
          setActiveCat(nextCat.id);
          setTool(nextCat.items[0]);
          setSelectedCell(null);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, selectedCell, cells]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Zoom keyboard shortcuts (both modes, MapView-scoped) ──
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === '+') {
        e.preventDefault();
        setZoom(z => Math.min(3, parseFloat((z + 0.25).toFixed(2))));
      } else if (e.key === '-' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setZoom(z => Math.max(0.25, parseFloat((z - 0.25).toFixed(2))));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Stop drag-painting on global pointerup
  useEffect(() => {
    const stop = () => { isPainting.current = false; lastKey.current = null; };
    window.addEventListener('pointerup', stop);
    return () => window.removeEventListener('pointerup', stop);
  }, []);

  // ── Apply one bauen action ──
  const applyBauen = useCallback((c, r, prev) => {
    const key = `${c},${r}`;
    if (tool !== 'erase' && tool !== 'select' && lastKey.current === key) return prev;
    lastKey.current = key;

    const existing = prev[key];
    const next = { ...prev };

    if (tool === 'select') {
      return prev;
    } else if (tool === 'erase') {
      if (!existing) return prev;
      delete next[key];
    } else if (existing && existing.type === tool) {
      next[key] = { ...existing, rot: (existing.rot + 1) % 4 };
    } else {
      const defaultState =
        tool === 'signal'          ? 'gruen'  :
        tool === 'turnoutY'        ? 'rechts' :
        tool === 'dkw'             ? 'gerade' :
        tool === 'turntable'       ? 'E'      :
        tool.startsWith('turnout') ? 'gerade' : undefined;
      next[key] = { type: tool, rot: rotation, state: defaultState };
    }
    return next;
  }, [tool, rotation]);

  // ── Pointer down on grid cell ──
  const handlePointerDown = useCallback((c, r) => {
    if (mode === 'bauen') {
      if (tool === 'select') {
        const key = `${c},${r}`;
        setSelectedCell(cells[key] ? { c, r } : null);
        return;
      }
      if (tool === 'erase') {
        const key = `${c},${r}`;
        if (cells[key]) {
          setCellProps(p => { const n = { ...p }; delete n[key]; return n; });
        }
      }
      isPainting.current = true;
      lastKey.current = null;
      setHistory(h => [...h.slice(-29), cells]);
      setCells(prev => applyBauen(c, r, prev));
    }
  }, [mode, tool, cells, applyBauen]);

  // ── Right-click to rotate in bauen mode ──
  const handleContextMenu = useCallback((c, r, e) => {
    e.preventDefault();
    if (mode !== 'bauen') return;
    const key = `${c},${r}`;
    if (cells[key]) {
      setCells(p => p[key] ? { ...p, [key]: { ...p[key], rot: ((p[key].rot||0)+1)%4 } } : p);
    }
  }, [mode, cells]);

  // ── Pointer enter (drag-paint) ──
  const handlePointerEnter = useCallback((c, r) => {
    if (mode === 'bauen' && isPainting.current) {
      if (tool === 'erase') {
        const key = `${c},${r}`;
        if (cells[key]) setCellProps(p => { const n = { ...p }; delete n[key]; return n; });
      }
      setCells(prev => applyBauen(c, r, prev));
    }
  }, [mode, tool, cells, applyBauen]);

  // ── Click in fahren mode (toggle switch/signal, route highlight) ──
  const handleClick = useCallback((c, r) => {
    const key = `${c},${r}`;
    const existing = cells[key];

    if (mode === 'fahren') {
      if (existing) {
        const piece = PIECES[existing.type];
        if (piece?.interactive) {
          let newState;
          if (existing.type === 'signal') {
            newState = existing.state === 'gruen' ? 'rot' : existing.state === 'rot' ? 'gelb' : 'gruen';
          } else if (existing.type === 'turnoutY') {
            newState = existing.state === 'links' ? 'rechts' : 'links';
          } else if (existing.type === 'dkw') {
            newState = existing.state === 'gerade' ? 'kreuz' : 'gerade';
          } else if (existing.type === 'turntable') {
            const dirs = ['N', 'E', 'S', 'W'];
            const idx = dirs.indexOf(existing.state || 'E');
            newState = dirs[(idx + 1) % 4];
          } else {
            newState = existing.state === 'gerade' ? 'abzweig' : 'gerade';
          }
          setPendingKeys(prev => new Set([...prev, key]));
          setTimeout(() => {
            setCells(prev => ({ ...prev, [key]: { ...(prev[key] || existing), state: newState } }));
            setPendingKeys(prev => { const s = new Set(prev); s.delete(key); return s; });
          }, 350);
        }
        setSelectedCell(s => (s?.c === c && s?.r === r) ? null : { c, r });
      } else {
        setSelectedCell(null);
      }
    }
  }, [mode, cells]);

  // ── Utility functions ──
  const clearAll = () => {
    if (confirm('Wirklich alles löschen?')) {
      setHistory(h => [...h.slice(-29), cells]);
      setCells({});
      setCellProps({});
    }
  };
  const loadExample = () => {
    setHistory(h => [...h.slice(-29), cells]);
    setCells(makeExample());
    setCellProps({});
  };
  const exportLayout = () => {
    const json = JSON.stringify({ cells, cellProps }, null, 2);
    const a = document.createElement('a');
    a.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(json);
    a.download = 'gleisplan.json';
    a.click();
  };
  const importLayout = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (typeof parsed === 'object') {
          setHistory(h => [...h.slice(-29), cells]);
          if (parsed.cells) {
            setCells(parsed.cells);
            setCellProps(parsed.cellProps || {});
          } else {
            setCells(parsed);
            setCellProps({});
          }
        }
      } catch { alert('Ungültige JSON-Datei.'); }
    };
    reader.readAsText(file);
  };

  // ── Route functions ──
  const applyRoute = useCallback((route) => {
    Object.entries(route.states).forEach(([key, state]) => {
      if (!cells[key]) return;
      setPendingKeys(prev => new Set([...prev, key]));
      setTimeout(() => {
        setCells(prev => prev[key] ? { ...prev, [key]: { ...prev[key], state } } : prev);
        setPendingKeys(prev => { const s = new Set(prev); s.delete(key); return s; });
      }, 350);
    });
  }, [cells]);

  // ── Derived data ──
  const counts = useMemo(() => {
    const out = {};
    Object.values(cells).forEach(c => { out[c.type] = (out[c.type] || 0) + 1; });
    return out;
  }, [cells]);

  const totalLength = (counts.straight || 0) + (counts.curve || 0) +
    (counts.slope || 0) + (counts.tunnel || 0) + (counts.bridge || 0) +
    (counts.turnoutL || 0) + (counts.turnoutR || 0) + (counts.turnoutY || 0) +
    (counts.dkw || 0) + (counts.cross || 0) + (counts.crossing || 0) +
    (counts.station || 0) + (counts.siding || 0) + (counts.buffer || 0);

  const highlightedPath = useMemo(() => {
    if (mode !== 'fahren' || !selectedCell) return new Set();
    return followPath(cells, selectedCell.c, selectedCell.r);
  }, [mode, selectedCell, cells]);

  const dangling = useMemo(() => {
    if (mode !== 'bauen' || !showWarnings) return [];
    return danglingEnds(cells);
  }, [mode, showWarnings, cells]);

  // Collect interactive switches for fahren panel
  const turnouts = useMemo(() => {
    const out = [];
    Object.entries(cells).forEach(([key, cell]) => {
      if (!['turnoutL','turnoutR','turnoutY','dkw'].includes(cell.type)) return;
      const [c, r] = key.split(',').map(Number);
      out.push({ c, r, type: cell.type, state: cell.state, rot: cell.rot || 0, key });
    });
    out.sort((a, b) => a.c - b.c || a.r - b.r);
    return out;
  }, [cells]);

  // Collect signals for fahren panel
  const signals = useMemo(() => {
    return Object.entries(cells)
      .filter(([, c]) => c.type === 'signal')
      .map(([key, cell]) => {
        const [c, r] = key.split(',').map(Number);
        return { key, c, r, ...cell };
      })
      .sort((a, b) => a.c - b.c || a.r - b.r);
  }, [cells]);

  const setAllSwitches = useCallback((target) => {
    turnouts.forEach(sw => {
      const mainState   = sw.type === 'turnoutY' ? 'rechts' : 'gerade';
      const branchState = sw.type === 'turnoutY' ? 'links'  : 'abzweig';
      const newState    = target === 'main' ? mainState : branchState;
      if (sw.state === newState) return;
      const key = sw.key;
      setPendingKeys(prev => new Set([...prev, key]));
      setTimeout(() => {
        setCells(prev => prev[key] ? { ...prev, [key]: { ...prev[key], state: newState } } : prev);
        setPendingKeys(prev => { const s = new Set(prev); s.delete(key); return s; });
      }, 350);
    });
  }, [turnouts]);

  const setAllSignals = useCallback((target) => {
    signals.forEach(sig => {
      if (sig.state === target) return;
      const key = sig.key;
      setPendingKeys(prev => new Set([...prev, key]));
      setTimeout(() => {
        setCells(prev => prev[key] ? { ...prev, [key]: { ...prev[key], state: target } } : prev);
        setPendingKeys(prev => { const s = new Set(prev); s.delete(key); return s; });
      }, 350);
    });
  }, [signals]);

  const saveRoute = useCallback(() => {
    const name = prompt('Name der Route (z.B. „Bahnhof Einfahrt"):', 'Route ' + (routes.length + 1));
    if (!name) return;
    const states = {};
    turnouts.forEach(sw => { states[sw.key] = sw.state; });
    setRoutes(r => [...r, { id: Date.now().toString(), name: name.trim(), states }]);
  }, [routes, turnouts]);

  const currentCat = CATEGORIES.find(c => c.id === activeCat) || CATEGORIES[0];

  // ── Cell inspector props helper ──
  const inspectorKey  = selectedCell ? `${selectedCell.c},${selectedCell.r}` : null;
  const inspectorCell = inspectorKey ? cells[inspectorKey] : null;

  // ── Connection hint for hover ──
  const connectionHint = useMemo(() => {
    if (!hover || mode !== 'bauen' || ['select','erase'].includes(tool)) return 'none';
    if (!PIECES[tool]) return 'none';
    return getConnectionHint(tool, rotation, cells, hover.c, hover.r);
  }, [hover, mode, tool, rotation, cells]);

  // ────────────────────────────────────────────────────
  //  LOCO STRIP HELPERS
  // ────────────────────────────────────────────────────
  const mapActiveInst = roster.find(i => i.id === activeId) || roster[0] || null;
  const mapActiveLoco = useMemo(() => {
    if (!mapActiveInst) return null;
    const model = (window.LOCO_ROSTER || []).find(l => l.id === mapActiveInst.modelId);
    if (!model) return null;
    return { ...model, addr: mapActiveInst.addr, name: mapActiveInst.name };
  }, [mapActiveInst]);
  const mapStatus = (activeId && statuses[activeId]) || { speed: 0, direction: 1, functions: [] };
  const mapSetSpeed = useCallback((v) => {
    if (emergency || !power || !activeId) return;
    onSetStatus(activeId, { speed: Math.max(0, Math.min(100, Math.round(v))) });
  }, [emergency, power, activeId, onSetStatus]);
  const mapToggleFn = useCallback((fnId) => {
    if (!activeId) return;
    const fs = new Set(mapStatus.functions || []);
    fs.has(fnId) ? fs.delete(fnId) : fs.add(fnId);
    onSetStatus(activeId, { functions: [...fs] });
  }, [activeId, mapStatus.functions, onSetStatus]);

  // ────────────────────────────────────────────────────
  //  RENDER
  // ────────────────────────────────────────────────────
  return (
    <div className="map-view">

      {/* ── Toolbar ── */}
      <div className="map-toolbar">

        {/* Layer Selector */}
        <div style={{ display:'flex', gap:'8px', alignItems:'center', padding:'6px 14px',
                      borderBottom:'1px solid var(--hair-2)', background:'var(--surface)' }}>
          <span style={{ fontSize:'11px', fontWeight:600, color:'var(--mute)', display:'flex', alignItems:'center', gap:'4px' }}>
            <Icon name="layers" size={12}/> EBENEN:
          </span>
          <select className="map-tool" value={activeLayer.id}
                  onChange={e => { setActiveLayerId(e.target.value); setHistory([]); setSelectedCell(null); }}
                  style={{ padding:'0 4px', fontWeight:600, height:'24px', cursor:'pointer', background:'transparent' }}>
            {layouts.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          {mode === 'bauen' && (
            <>
              <button className="map-tool" title="Neue Ebene" onClick={() => {
                const name = prompt('Name der neuen Ebene?');
                if (name) {
                  const id = 'layer-' + Date.now();
                  setLayouts(prev => [...prev, { id, name, cells: {} }]);
                  setActiveLayerId(id);
                  setHistory([]);
                }
              }}>+</button>
              {layouts.length > 1 && (
                <button className="map-tool danger" title="Ebene löschen" onClick={() => {
                  if (confirm(`Ebene "${activeLayer.name}" wirklich löschen?`)) {
                    setLayouts(prev => {
                      const next = prev.filter(l => l.id !== activeLayerId);
                      setActiveLayerId(next[0].id);
                      return next;
                    });
                    setHistory([]);
                  }
                }}><Icon name="trash" size={11}/></button>
              )}
            </>
          )}
        </div>

        {mode === 'bauen' ? (
          <>
            {/* Row 1: categories + tools */}
            <div className="map-bauen-row1">
              <div className="map-cats">
                {CATEGORIES.map(cat => (
                  <button key={cat.id}
                          className={'map-cat ' + (activeCat === cat.id ? 'is-active' : '')}
                          onClick={() => {
                            setActiveCat(cat.id);
                            setTool(cat.items[0]);
                            setSelectedCell(null);
                          }}>
                    {cat.label}
                    <span className="map-cat-n">{cat.items.length}</span>
                  </button>
                ))}
              </div>

              <div className="map-tools">
                <button className={'map-tool ' + (tool === 'select' ? 'is-active' : '')}
                        onClick={() => setTool('select')} title="Auswählen & Eigenschaften (Esc)">
                  <Icon name="cursor" size={13}/> Auswählen
                </button>
                <button className={'map-tool ' + (tool === 'erase' ? 'is-active' : '')}
                        onClick={() => setTool('erase')} title="Löschen (Entf)">
                  <Icon name="eraser" size={13}/> Löschen
                </button>
                <button className={'map-tool ' + (showWarnings ? 'is-active' : '')}
                        onClick={() => setShowWarnings(w => !w)} title="Lose Enden anzeigen">
                  <Icon name="warning" size={13}/> Enden
                </button>
                <button className="map-tool" onClick={() => {
                  setHistory(h => {
                    if (!h.length) return h;
                    setCells(h[h.length - 1]);
                    return h.slice(0, -1);
                  });
                }} title="Rückgängig (Ctrl+Z)" disabled={history.length === 0}
                style={{ opacity: history.length === 0 ? 0.35 : 1 }}>
                  <Icon name="undo" size={13}/>
                </button>
                <button className="map-tool" onClick={loadExample} title="Beispiel laden">
                  <Icon name="refresh" size={13}/>
                </button>
                <button className="map-tool danger" onClick={clearAll} title="Alles leeren">
                  <Icon name="trash" size={13}/> Leeren
                </button>
                <span style={{ width:'1px', background:'var(--hair)', alignSelf:'stretch', margin:'0 2px' }}/>
                <button className="map-tool" onClick={() => setZoom(z => Math.max(0.25, z - 0.25))} title="Herauszoomen">−</button>
                <button className="map-tool" onClick={() => setZoom(1)} title="Zoom zurücksetzen"
                        style={{ fontFamily:'JetBrains Mono', fontSize:'10px', color:'var(--mute)', padding:'7px 6px', minWidth:'36px' }}>
                  {Math.round(zoom * 100)}%
                </button>
                <button className="map-tool" onClick={() => setZoom(z => Math.min(3, z + 0.25))} title="Hineinzoomen">+</button>
                <span style={{ width:'1px', background:'var(--hair)', alignSelf:'stretch', margin:'0 2px' }}/>
                <button className="map-export-btn" onClick={exportLayout} title="Gleisplan exportieren">
                  <Icon name="download" size={13}/> Export
                </button>
                <label className="map-export-btn" style={{ cursor:'pointer' }} title="Gleisplan importieren">
                  <Icon name="upload" size={13}/> Import
                  <input type="file" accept=".json" style={{ display:'none' }}
                         onChange={e => { if (e.target.files[0]) importLayout(e.target.files[0]); e.target.value=''; }}/>
                </label>
              </div>
            </div>

            {/* Row 2: palette + rotation */}
            <div className="map-bauen-row2">
              <div className="map-palette">
                {currentCat.items.map(p => (
                  <button key={p}
                          className={'map-piece ' + (tool === p ? 'is-active' : '')}
                          title={PIECE_HINTS[p] || PIECES[p].label}
                          onClick={() => { setTool(p); setSelectedCell(null); }}>
                    <svg viewBox="0 0 56 56" width="44" height="44">
                      <g transform={`rotate(${rotation * 90}, 28, 28)`}>
                        {PIECES[p].render({ accent })}
                      </g>
                    </svg>
                    <span>{PIECES[p].label}</span>
                  </button>
                ))}
              </div>

              <div className="map-rot-compact">
                <button className="map-rot-btn" onClick={() => setRotation(r => (r+1) % 4)}
                        title="Drehen (R)">
                  <svg viewBox="0 0 20 20" width="16" height="16">
                    <g transform={`rotate(${rotation * 90}, 10, 10)`}>
                      <path d="M 3 10 L 14 10 M 11 7 L 14 10 L 11 13"
                            stroke="currentColor" fill="none" strokeWidth="1.6"
                            strokeLinecap="round" strokeLinejoin="round"/>
                    </g>
                  </svg>
                  <span>{rotation * 90}°</span>
                </button>
              </div>
            </div>

            {/* Cell Inspector (appears when select tool + cell clicked) — floating */}
            {tool === 'select' && inspectorCell && (
              <CellInspector
                cellKey={inspectorKey}
                cell={inspectorCell}
                props={cellProps[inspectorKey] || {}}
                accent={accent}
                onPropsChange={props => setCellProps(p => ({ ...p, [inspectorKey]: props }))}
                onRotate={() => setCells(p => p[inspectorKey]
                  ? { ...p, [inspectorKey]: { ...p[inspectorKey], rot: ((p[inspectorKey].rot||0)+1)%4 } }
                  : p)}
                onDelete={() => {
                  setHistory(h => [...h.slice(-29), cells]);
                  setCells(p => { const n={...p}; delete n[inspectorKey]; return n; });
                  setCellProps(p => { const n={...p}; delete n[inspectorKey]; return n; });
                  setSelectedCell(null);
                }}
                onClose={() => setSelectedCell(null)}
              />
            )}

            {/* Shortcut bar */}
            <div className="map-shortcut-bar">
              <kbd>1</kbd>–<kbd>9</kbd> Stück &nbsp;·&nbsp;
              <kbd>Tab</kbd> Kategorie &nbsp;·&nbsp;
              <kbd>R</kbd> Drehen &nbsp;·&nbsp;
              <kbd>Esc</kbd> Auswählen &nbsp;·&nbsp;
              <kbd>Entf</kbd> Löschen &nbsp;·&nbsp;
              <kbd>Ctrl+Z</kbd> Undo &nbsp;·&nbsp;
              <kbd>Ctrl+D</kbd> Kopieren &nbsp;·&nbsp;
              <kbd>+</kbd><kbd>−</kbd> Zoom &nbsp;·&nbsp;
              <span style={{ color:'var(--mute)', opacity:0.7 }}>Rechtsklick = Drehen</span>
              <span style={{ marginLeft:'auto' }} className="map-hint-tip">Ziehen zum Malen</span>
            </div>
          </>
        ) : (
          /* ── Fahren toolbar ── */
          <div className="map-fahren-bar">

            {/* ── Loco control strip ── */}
            {roster.length > 0 && (
              <div className={'map-loco-strip' + (emergency ? ' is-estop' : '') + (!power ? ' is-off' : '')}>

                {/* Lok selector */}
                <div className="map-loco-select-wrap">
                  <span className="map-loco-label">LOK</span>
                  <select className="map-loco-select"
                          value={activeId || ''}
                          onChange={e => onSetActiveId(e.target.value)}>
                    {roster.map(inst => (
                      <option key={inst.id} value={inst.id}>
                        #{String(inst.addr).padStart(3,'0')} {inst.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Direction buttons */}
                <div className="map-loco-dir-wrap">
                  <button
                    className={'map-loco-dir-btn rev' + (mapStatus.direction === -1 ? ' is-active' : '')}
                    disabled={emergency || !power}
                    onClick={() => onSetStatus(activeId, { direction: -1 })}
                    title="Rückwärts">
                    <svg viewBox="0 0 16 10" width="14" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 5 L2 5 M6 1 L2 5 L6 9"/>
                    </svg>
                  </button>
                  <button
                    className={'map-loco-dir-btn fwd' + (mapStatus.direction === 1 ? ' is-active' : '')}
                    disabled={emergency || !power}
                    onClick={() => onSetStatus(activeId, { direction: 1 })}
                    title="Vorwärts">
                    <svg viewBox="0 0 16 10" width="14" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 5 L14 5 M10 1 L14 5 L10 9"/>
                    </svg>
                  </button>
                </div>

                {/* Speed range + readout */}
                <div className="map-loco-speed-wrap">
                  <input
                    type="range" className="map-loco-speed-bar"
                    min="0" max="100" step="1"
                    value={mapStatus.speed}
                    disabled={emergency || !power}
                    onChange={e => mapSetSpeed(Number(e.target.value))}/>
                  <div className="map-loco-speed-digits">
                    <span className="map-loco-speed-val">
                      {mapActiveLoco ? Math.round((mapStatus.speed / 100) * mapActiveLoco.maxKmh) : 0}
                    </span>
                    <em>km/h</em>
                  </div>
                </div>

                {/* Step + halt buttons */}
                <div className="map-loco-steps">
                  <button className="map-loco-step-btn"
                          disabled={emergency || !power}
                          onClick={() => mapSetSpeed(mapStatus.speed - 10)}>−10</button>
                  <button className="map-loco-halt-btn"
                          disabled={emergency || !power}
                          onClick={() => mapSetSpeed(0)}>HALT</button>
                  <button className="map-loco-step-btn"
                          disabled={emergency || !power}
                          onClick={() => mapSetSpeed(mapStatus.speed + 10)}>+10</button>
                </div>

                {/* Licht toggle */}
                <button
                  className={'map-loco-fn-btn' + ((mapStatus.functions || []).includes(0) ? ' is-on' : '')}
                  disabled={emergency || !power}
                  onClick={() => mapToggleFn(0)}
                  title="Licht (F0)">
                  <svg viewBox="0 0 20 20" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                    <circle cx="10" cy="10" r="2.5" fill="currentColor" stroke="none"/>
                    <line x1="10" y1="3" x2="10" y2="5"/><line x1="10" y1="15" x2="10" y2="17"/>
                    <line x1="3" y1="10" x2="5" y2="10"/><line x1="15" y1="10" x2="17" y2="10"/>
                    <line x1="5.5" y1="5.5" x2="7" y2="7"/><line x1="13" y1="13" x2="14.5" y2="14.5"/>
                    <line x1="14.5" y1="5.5" x2="13" y2="7"/><line x1="7" y1="13" x2="5.5" y2="14.5"/>
                  </svg>
                  Licht
                </button>

                {/* Status badges */}
                {emergency && <span className="map-loco-badge estop">NOT-AUS</span>}
                {!power && !emergency && <span className="map-loco-badge off">GLEIS AUS</span>}
              </div>
            )}

            <span className="map-mode-pill">FAHRMODUS</span>

            {/* Switch panel */}
            {turnouts.length > 0 ? (
              <div className="map-switch-panel">
                <div className="map-switch-panel-top">
                  <span className="map-switch-panel-label">WEICHEN</span>
                  <div className="map-switch-quick">
                    <button className="map-quick-btn green"
                            onClick={() => setAllSwitches('main')}
                            title="Alle Weichen auf Hauptlage">
                      <Icon name="arrow-left-right" size={12}/> Alle gerade
                    </button>
                    <button className="map-quick-btn red"
                            onClick={() => setAllSwitches('branch')}
                            title="Alle Weichen auf Abzweig">
                      <Icon name="arrow-branch" size={12}/> Alle Abzweig
                    </button>
                  </div>
                </div>
                <div className="map-switch-list">
                  {turnouts.map(sw => {
                    const isGerade = sw.state === 'gerade' || sw.state === 'rechts';
                    const piece    = PIECES[sw.type];
                    const label    = cellProps[sw.key]?.label || piece?.label;
                    const dccAddr  = cellProps[sw.key]?.dccAddr;
                    return (
                      <button key={sw.key}
                              className={'map-switch-btn ' + (isGerade ? 'gerade' : 'abzweig')
                                         + (pendingKeys.has(sw.key) ? ' pending' : '')}
                              onClick={() => handleClick(sw.c, sw.r)}
                              title={`${label} — klicken zum Schalten`}>
                        <div className="sw-diagram-wrap">
                          <svg viewBox="0 0 56 56" width="52" height="52">
                            <g transform={`rotate(${sw.rot * 90}, 28, 28)`}>
                              {piece?.render({
                                state: sw.state,
                                accent: isGerade ? 'var(--green)' : 'var(--accent)',
                              })}
                            </g>
                          </svg>
                        </div>
                        <div className="sw-info">
                          <span className="sw-id">{label}</span>
                          <span className="sw-pos">
                            {dccAddr ? `DCC ${dccAddr}` : `(${sw.c},${sw.r})`}
                          </span>
                          <span className={'sw-state-badge ' + (isGerade ? 'gerade' : 'abzweig')}>
                            {sw.state}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <span className="map-hint">Keine Weichen auf der Strecke</span>
            )}

            {/* Signals section */}
            {signals.length > 0 && (
              <div className="map-signals-section">
                <div className="map-switch-panel-top">
                  <span className="map-switch-panel-label">SIGNALE</span>
                  <div className="map-switch-quick">
                    <button className="map-quick-btn green"
                            onClick={() => setAllSignals('gruen')}
                            title="Alle Signale auf Grün">
                      Alle Grün
                    </button>
                    <button className="map-quick-btn red"
                            onClick={() => setAllSignals('rot')}
                            title="Alle Signale auf Rot">
                      Alle Rot
                    </button>
                  </div>
                </div>
                <div className="map-switch-list">
                  {signals.map(sig => {
                    const label   = cellProps[sig.key]?.label || `Signal`;
                    const dccAddr = cellProps[sig.key]?.dccAddr;
                    const stateClass = sig.state === 'gruen' ? 'signal-gruen' : sig.state === 'rot' ? 'signal-rot' : 'signal-gelb';
                    const hpAspect = sig.state === 'rot' ? 'Hp0 · Halt' : sig.state === 'gelb' ? 'Hp2 · Langsam' : 'Hp1 · Fahrt';
                    return (
                      <button key={sig.key}
                              className={'map-signal-btn ' + stateClass + (pendingKeys.has(sig.key) ? ' pending' : '')}
                              onClick={() => handleClick(sig.c, sig.r)}
                              title={`${label} — ${hpAspect} — klicken zum Schalten`}>
                        <svg viewBox="0 0 56 56" width="36" height="36">
                          <g transform={`rotate(${(sig.rot||0) * 90}, 28, 28)`}>
                            {PIECES.signal.render({ state: sig.state })}
                          </g>
                        </svg>
                        <div className="sw-info">
                          <span className="sw-id">{label}</span>
                          <span className="sw-pos">{dccAddr ? `DCC ${dccAddr}` : `(${sig.c},${sig.r})`}</span>
                          <span className={'sw-state-badge ' + stateClass}>
                            {sig.state === 'rot' ? 'Hp0' : sig.state === 'gelb' ? 'Hp2' : 'Hp1'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Routes section */}
            <div className="map-routes-section">
              <span className="map-routes-label">ROUTEN</span>
              <div className="map-routes-list">
                {routes.map(route => (
                  <div key={route.id} className="map-route-wrap">
                    <button className="map-route-btn" onClick={() => applyRoute(route)}
                            title="Route aktivieren">
                      {route.name}
                    </button>
                    <button className="map-route-del"
                            onClick={() => setRoutes(r => r.filter(x => x.id !== route.id))}
                            title="Route löschen">
                      <Icon name="close" size={11}/>
                    </button>
                  </div>
                ))}
                {turnouts.length > 0 && (
                  <button className="map-route-save" onClick={saveRoute}
                          title="Aktuelle Weichenstellung als Route speichern">
                    <Icon name="plus-circle" size={12}/> Speichern
                  </button>
                )}
              </div>
            </div>

            {/* Hint + deselect */}
            <span className="map-fahren-hint">
              Gleis anklicken → Route hervorheben
            </span>
            {selectedCell && (
              <button className="map-tool" onClick={() => setSelectedCell(null)}
                      style={{ marginLeft: 'auto' }}>
                <Icon name="close" size={12}/> Auswahl
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Grid ── */}
      <div className="map-grid-wrap">
        <svg viewBox={`0 0 ${COLS * CELL} ${ROWS * CELL}`}
             className="map-grid"
             width={COLS * CELL * zoom} height={ROWS * CELL * zoom}
             style={{ touchAction: 'none' }}>
          <defs>
            <pattern id="mapdots" x="0" y="0" width={CELL} height={CELL} patternUnits="userSpaceOnUse">
              <circle cx={CELL/2} cy={CELL/2} r="0.8" fill="var(--hair-2)"/>
              <line x1="0" y1="0" x2={CELL} y2="0" stroke="var(--hair)" strokeWidth="0.3"/>
              <line x1="0" y1="0" x2="0"    y2={CELL} stroke="var(--hair)" strokeWidth="0.3"/>
            </pattern>
            <filter id="blur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5"/>
            </filter>
          </defs>
          <rect width="100%" height="100%" fill="url(#mapdots)"/>

          {/* Hover preview (bauen) */}
          {hover && mode === 'bauen' && !['select','erase'].includes(tool) && (
            <g transform={`translate(${hover.c * CELL}, ${hover.r * CELL})`} opacity="0.5" pointerEvents="none">
              {/* Connection hint overlay */}
              {connectionHint === 'full'    && <rect width={CELL} height={CELL} fill="rgba(47,138,77,0.18)" rx="3"/>}
              {connectionHint === 'partial' && <rect width={CELL} height={CELL} fill="rgba(230,165,42,0.18)" rx="3"/>}
              {connectionHint === 'none'    && <rect width={CELL} height={CELL} fill={accent} opacity="0.08"/>}
              <g transform={`rotate(${rotation * 90}, ${CELL/2}, ${CELL/2})`}>
                {PIECES[tool]?.render({ accent })}
              </g>
            </g>
          )}

          {/* Route highlight (fahren) */}
          {mode === 'fahren' && [...highlightedPath].map(k => {
            const [c, r] = k.split(',').map(Number);
            return (
              <g key={k} pointerEvents="none">
                <rect x={c*CELL+1} y={r*CELL+1} width={CELL-2} height={CELL-2}
                      fill={accent} opacity="0.13" rx="3"/>
                <rect x={c*CELL+1} y={r*CELL+1} width={CELL-2} height={CELL-2}
                      fill="none" stroke={accent} strokeWidth="1.4" opacity="0.4" rx="3"/>
              </g>
            );
          })}

          {/* Cells */}
          {Array.from({ length: COLS * ROWS }).map((_, i) => {
            const c = i % COLS, r = Math.floor(i / COLS);
            const cell = cells[`${c},${r}`];
            const isSelected = mode === 'bauen' && selectedCell?.c === c && selectedCell?.r === r;
            const isHovered  = hover?.c === c && hover?.r === r;
            return (
              <g key={i}
                 transform={`translate(${c * CELL}, ${r * CELL})`}
                 onPointerDown={() => handlePointerDown(c, r)}
                 onPointerEnter={() => { setHover({ c, r }); handlePointerEnter(c, r); }}
                 onPointerLeave={() => setHover(h => h && h.c === c && h.r === r ? null : h)}
                 onClick={() => handleClick(c, r)}
                 onContextMenu={(e) => handleContextMenu(c, r, e)}
                 style={{ cursor:
                   mode === 'bauen'
                     ? (tool === 'erase' ? 'crosshair' : tool === 'select' ? 'pointer' : 'cell')
                     : (cell ? 'pointer' : 'default') }}>
                <rect width={CELL} height={CELL} fill="transparent"/>
                {/* Hover tint (select/erase) */}
                {isHovered && mode === 'bauen' && ['select','erase'].includes(tool) && (
                  <rect width={CELL} height={CELL} fill={accent} opacity="0.06"/>
                )}
                {cell && PIECES[cell.type] && (
                  <g className={pendingKeys.has(`${c},${r}`) ? 'map-cell-pending' : ''}
                     transform={`rotate(${(cell.rot || 0) * 90}, ${CELL/2}, ${CELL/2})`}>
                    {PIECES[cell.type].render({ state: cell.state, accent })}
                  </g>
                )}
                {/* Selected cell in bauen (dashed outline) */}
                {isSelected && (
                  <rect width={CELL-2} height={CELL-2} x="1" y="1"
                        fill="none" stroke="var(--accent)" strokeWidth="2"
                        strokeDasharray="5,3" rx="3" pointerEvents="none"/>
                )}
                {/* Fahren selected */}
                {mode === 'fahren' && selectedCell?.c === c && selectedCell?.r === r && (
                  <rect width={CELL-2} height={CELL-2} x="1" y="1"
                        fill="none" stroke={accent} strokeWidth="1.6" rx="3" pointerEvents="none"/>
                )}
                {/* Grid coord tooltip on hover (bauen mode) */}
                {isHovered && mode === 'bauen' && (
                  <g pointerEvents="none">
                    <rect x="2" y="2" width="22" height="11" rx="2" fill="rgba(0,0,0,0.55)"/>
                    <text x="13" y="10.5" textAnchor="middle" fontSize="7"
                          fill="rgba(255,255,255,0.9)" fontFamily="JetBrains Mono, monospace">
                      {c},{r}
                    </text>
                  </g>
                )}
                {/* Fahren hover tooltip: show piece label + DCC addr */}
                {isHovered && mode === 'fahren' && cell && (() => {
                  const p = PIECES[cell.type];
                  const lbl = cellProps[`${c},${r}`]?.label || p?.label || '';
                  const dcc = cellProps[`${c},${r}`]?.dccAddr;
                  const txt = dcc ? `${lbl} · DCC ${dcc}` : lbl;
                  const w = Math.min(txt.length * 5.2 + 8, 120);
                  const xOff = c > COLS - 4 ? -(w + 4) : 4;
                  const yOff = r > ROWS - 2 ? -18 : CELL + 2;
                  return (
                    <g pointerEvents="none">
                      <rect x={xOff} y={yOff} width={w} height="14" rx="3"
                            fill="rgba(0,0,0,0.7)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5"/>
                      <text x={xOff + w/2} y={yOff + 9.5} textAnchor="middle" fontSize="8"
                            fill="rgba(255,255,255,0.92)" fontFamily="inherit" fontWeight="500">
                        {txt}
                      </text>
                    </g>
                  );
                })()}
              </g>
            );
          })}

          {/* Cell labels (Bezeichnung) */}
          {Object.entries(cellProps).map(([key, props]) => {
            if (!props.label || !cells[key]) return null;
            const [c, r] = key.split(',').map(Number);
            return (
              <text key={'lbl-' + key}
                    x={c * CELL + CELL/2} y={r * CELL + CELL - 5}
                    textAnchor="middle" fontSize="7.5"
                    fill="var(--accent)"
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight="600" pointerEvents="none"
                    style={{ userSelect: 'none' }}>
                {props.label}
              </text>
            );
          })}

          {/* Dangling-end warning dots */}
          {dangling.map((d, i) => {
            const pos = {
              N: [CELL/2, 4], E: [CELL-4, CELL/2],
              S: [CELL/2, CELL-4], W: [4, CELL/2]
            }[d.edge];
            return <circle key={i}
                           cx={d.c * CELL + pos[0]} cy={d.r * CELL + pos[1]}
                           r="2.4" fill="#e6a52a" stroke="var(--surface)" strokeWidth="0.8"/>;
          })}
        </svg>

        {/* ── Minimap (when zoomed > 1.25) ── */}
        {zoom > 1.25 && (
          <div className="map-minimap" title="Übersichtskarte">
            <svg viewBox={`0 0 ${COLS * CELL} ${ROWS * CELL}`}
                 width={COLS * 8} height={ROWS * 8}>
              {/* Background */}
              <rect width="100%" height="100%" fill="var(--bg)" rx="2"/>
              {/* Placed pieces (simplified dots) */}
              {Object.entries(cells).map(([key, cell]) => {
                const [cc, rr] = key.split(',').map(Number);
                const p = PIECES[cell.type];
                const color = p?.cat === 'deko'       ? '#7fa978' :
                              p?.cat === 'weiche'      ? 'var(--accent)' :
                              p?.cat === 'ausstattung' ? '#e6a52a' : 'var(--ink-2)';
                return (
                  <rect key={key}
                        x={cc * CELL + 2} y={rr * CELL + 2}
                        width={CELL - 4} height={CELL - 4}
                        fill={color} opacity="0.7" rx="2"/>
                );
              })}
              {/* Border */}
              <rect width="100%" height="100%" fill="none"
                    stroke="var(--hair-2)" strokeWidth="4" rx="2"/>
            </svg>
          </div>
        )}
      </div>

      {/* ── Status bar ── */}
      <div className="map-status">
        {/* Always-visible stats */}
        <div className="map-status-group" title="Gesamtzahl platzierter Elemente">
          <span className="map-status-num">{Object.keys(cells).length}</span>
          <span className="map-status-lbl">Elemente</span>
        </div>
        <div className="map-status-group" title="Geschätzte Gleislänge (N=9cm/Gleis, H0=18cm/Gleis)">
          <span className="map-status-num">{totalLength * 18}</span>
          <span className="map-status-lbl">cm Gleis</span>
        </div>
        {(counts.turnoutL||0)+(counts.turnoutR||0)+(counts.turnoutY||0)+(counts.dkw||0)+(counts.cross||0) > 0 && (
          <div className="map-status-group" title="Weichen: L/R/Y/DKW + Kreuzungen">
            <span className="map-status-num">
              {(counts.turnoutL||0)+(counts.turnoutR||0)+(counts.turnoutY||0)+(counts.dkw||0)+(counts.cross||0)}
            </span>
            <span className="map-status-lbl">Weichen</span>
          </div>
        )}
        {(counts.signal || 0) > 0 && (
          <div className="map-status-group" title="Anzahl Hauptsignale">
            <span className="map-status-num">{counts.signal}</span>
            <span className="map-status-lbl">Signale</span>
          </div>
        )}
        {(counts.station || 0) > 0 && (
          <div className="map-status-group" title="Anzahl Bahnsteig-Elemente">
            <span className="map-status-num">{counts.station}</span>
            <span className="map-status-lbl">Bahnsteige</span>
          </div>
        )}
        {(counts.tunnel || 0) > 0 && (
          <div className="map-status-group">
            <span className="map-status-num">{counts.tunnel}</span>
            <span className="map-status-lbl">Tunnel</span>
          </div>
        )}
        {(counts.bridge || 0) > 0 && (
          <div className="map-status-group">
            <span className="map-status-num">{counts.bridge}</span>
            <span className="map-status-lbl">Brücken</span>
          </div>
        )}
        {(counts.turntable || 0) > 0 && (
          <div className="map-status-group">
            <span className="map-status-num">{counts.turntable}</span>
            <span className="map-status-lbl">Drehscheiben</span>
          </div>
        )}
        {Object.keys(cellProps).filter(k => cellProps[k]?.label && cells[k]).length > 0 && (
          <div className="map-status-group" title="Beschriftete Elemente mit Bezeichnung">
            <span className="map-status-num">
              {Object.keys(cellProps).filter(k => cellProps[k]?.label && cells[k]).length}
            </span>
            <span className="map-status-lbl">Beschriftet</span>
          </div>
        )}
        {Object.keys(cellProps).filter(k => cellProps[k]?.dccAddr && cells[k]).length > 0 && (
          <div className="map-status-group" title="Elemente mit DCC-Adresse">
            <span className="map-status-num">
              {Object.keys(cellProps).filter(k => cellProps[k]?.dccAddr && cells[k]).length}
            </span>
            <span className="map-status-lbl">DCC-Adressen</span>
          </div>
        )}
        {/* Bauen-mode warnings */}
        {mode === 'bauen' && dangling.length > 0 && (
          <div className="map-status-group warn" title="Gleisenden ohne Verbindung">
            <span className="map-status-num">{dangling.length}</span>
            <span className="map-status-lbl">lose Enden</span>
          </div>
        )}
        {mode === 'bauen' && dangling.length === 0 && Object.keys(cells).length > 2 && (
          <div className="map-status-group" style={{ color:'var(--green)' }} title="Alle Gleisenden verbunden">
            <span className="map-status-num" style={{ color:'var(--green)' }}>✓</span>
            <span className="map-status-lbl" style={{ color:'var(--green)' }}>Vollständig</span>
          </div>
        )}
        {/* Fahren-mode path info */}
        {mode === 'fahren' && highlightedPath.size > 0 && (
          <div className="map-status-group accent" title="Verbundene Zellen im markierten Abschnitt">
            <span className="map-status-num">{highlightedPath.size}</span>
            <span className="map-status-lbl">Zellen markiert</span>
          </div>
        )}
        {/* Zoom info pushed to right */}
        <div className="map-status-group" style={{ marginLeft:'auto', color:'var(--mute)' }}>
          <span className="map-status-num" style={{ fontSize:'11px', color:'var(--mute)' }}>
            {Math.round(zoom * 100)}%
          </span>
          <span className="map-status-lbl">{COLS}×{ROWS} Raster</span>
        </div>
      </div>
    </div>
  );
}

window.MapView = MapView;

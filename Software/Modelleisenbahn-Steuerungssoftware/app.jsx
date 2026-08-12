/* global React, ReactDOM, LOCO_ROSTER */
const { useState, useEffect, useRef, useCallback, useMemo } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "accent": "#c93838",
  "density": "regular",
  "showTelemetry": false,
  "showTrack": true,
  "showStats": true
}/*EDITMODE-END*/;

const ACCENTS = ['#c93838', '#2d5fa8', '#1f7a4d', '#c97d1f', '#5a3aa8'];

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pad = (n, w = 2) => String(n).padStart(w, '0');

// ── LOCO LIBRARY HELPERS ─────────────────────────────────────────────
// LOCO_ROSTER = catalog of model templates (from locos.jsx)
// roster      = active instances on the layout: [{id, modelId, addr, name}]

const makeDefaultRoster = () => LOCO_ROSTER.map(l => ({
  id: 'inst-' + l.id,
  modelId: l.id,
  addr: l.addr,
  name: l.name,
}));

function getLocoData(inst) {
  const model = LOCO_ROSTER.find(l => l.id === inst.modelId) || LOCO_ROSTER[0];
  return { ...model, addr: inst.addr, name: inst.name, color: inst.color || model.color };
}

function cvDefaults(loco) {
  return {
    'CV1': String(loco.addr).padStart(3, '0'),
    'CV2': '008',
    'CV5': String(loco.maxKmh).padStart(3, '0'),
    'CV3': '012',
    'CV4': '015',
  };
}

// ── THROTTLE ─────────────────────────────────────────────────────────
function Throttle({ value, onChange, disabled }) {
  const trackRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const setFromY = useCallback((clientY) => {
    const r = trackRef.current.getBoundingClientRect();
    const t = clamp((r.bottom - clientY) / r.height, 0, 1);
    onChange(Math.round(t * 100));
  }, [onChange]);

  useEffect(() => {
    if (!dragging) return;
    // PointerEvent always has clientY — no need for touches fallback
    const move = (e) => setFromY(e.clientY);
    const up   = () => setDragging(false);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup',   up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  }, [dragging, setFromY]);

  const notches = Array.from({ length: 11 }, (_, i) => i);

  return (
    <div className={'throttle ' + (disabled ? 'is-disabled ' : '') + (dragging ? 'is-dragging' : '')}>
      {/* Rail: visual only — no pointerDown here to prevent click-to-jump */}
      <div className="throttle-rail" ref={trackRef}>
        <div className="throttle-rail-inner"/>
        <div className="throttle-fill"
             style={{ height: `${value}%`, background: 'linear-gradient(180deg, transparent, var(--accent-soft))' }}/>
        <div className="throttle-notches">
          {notches.map(i => {
            const pct = (i / 10) * 100;
            return <div key={i} className={'notch ' + (i % 5 === 0 ? 'major' : '')}
                        style={{ bottom: `${pct}%` }}>
                     {i % 5 === 0 && <span>{i === 0 ? '0' : i === 5 ? '50' : '100'}</span>}
                   </div>;
          })}
        </div>
        {/* Knob is the only drag target — prevents dangerous speed jumps on click */}
        <div className="throttle-knob" style={{ bottom: `calc(${value}% - 24px)` }}
             onPointerDown={(e) => {
               if (disabled) return;
               e.currentTarget.setPointerCapture(e.pointerId);
               setDragging(true);
               setFromY(e.clientY);
             }}>
          <div className="throttle-knob-grip"/>
          <div className="throttle-knob-grip"/>
          <div className="throttle-knob-grip"/>
          <div className="throttle-knob-line"/>
        </div>
      </div>
      <div className="throttle-label">THROTTLE</div>
    </div>
  );
}

// ── DIRECTION TOGGLE ─────────────────────────────────────────────────
function DirectionToggle({ value, onChange, disabled }) {
  return (
    <div className="dir-toggle">
      <button
        className={'dir-btn ' + (value === 1 ? 'is-active fwd' : '')}
        disabled={disabled}
        aria-label="Vorwärts"
        onClick={() => onChange(1)}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12 L19 12 M13 6 L19 12 L13 18"/>
        </svg>
        VORWÄRTS
      </button>
      <button
        className={'dir-btn ' + (value === -1 ? 'is-active rev' : '')}
        disabled={disabled}
        aria-label="Rückwärts"
        onClick={() => onChange(-1)}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12 L5 12 M11 6 L5 12 L11 18"/>
        </svg>
        RÜCKWÄRTS
      </button>
    </div>
  );
}

// ── GAUGE ────────────────────────────────────────────────────────────
function Gauge({ value, max, label, unit, danger, size = 108 }) {
  const a0 = -220, a1 = 40;
  const t = clamp(value / max, 0, 1);
  const ang = a0 + (a1 - a0) * t;
  const cx = size / 2, cy = size / 2;
  const rNeedle = size / 2 - 14;
  const rad = ang * Math.PI / 180;
  const nx = cx + Math.cos(rad) * rNeedle;
  const ny = cy + Math.sin(rad) * rNeedle;
  const ticks = Array.from({ length: 11 }, (_, i) => i / 10);
  const arcR = size / 2 - 8;
  const arcStart = `${cx + Math.cos(a0 * Math.PI/180) * arcR} ${cy + Math.sin(a0 * Math.PI/180) * arcR}`;
  const arcEnd   = `${cx + Math.cos(a1 * Math.PI/180) * arcR} ${cy + Math.sin(a1 * Math.PI/180) * arcR}`;
  return (
    <div className="gauge">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <path d={`M ${arcStart} A ${arcR} ${arcR} 0 1 1 ${arcEnd}`} stroke="var(--hair)" strokeWidth="1.5" fill="none"/>
        {ticks.map(tt => {
          const a = (a0 + (a1-a0) * tt) * Math.PI / 180;
          const r1 = size/2 - 10, r2 = size/2 - (tt % 0.5 === 0 ? 16 : 13);
          return <line key={tt} x1={cx + Math.cos(a)*r1} y1={cy + Math.sin(a)*r1}
                       x2={cx + Math.cos(a)*r2} y2={cy + Math.sin(a)*r2}
                       stroke="var(--dim)" strokeWidth={tt % 0.5 === 0 ? 1 : 0.6}/>;
        })}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={danger ? 'var(--red)' : 'var(--accent)'} strokeWidth="2" strokeLinecap="round"/>
        <circle cx={cx} cy={cy} r="3" fill="var(--ink)"/>
      </svg>
      <div className="gauge-readout">
        <span className="gauge-value">{value.toFixed(unit === 'A' ? 2 : 0)}</span>
        <span className="gauge-unit">{unit}</span>
      </div>
      <div className="gauge-label">{label}</div>
    </div>
  );
}

// ── FUNCTION BUTTONS ─────────────────────────────────────────────────
const FUNCTIONS = Array.from({ length: 29 }, (_, i) => {
  if (i === 0) return { id: 0, label: 'Licht',    short: 'F0', icon: 'light'  };
  if (i === 1) return { id: 1, label: 'Sound',    short: 'F1', icon: 'sound'  };
  if (i === 2) return { id: 2, label: 'Horn',     short: 'F2', icon: 'horn'   };
  if (i === 3) return { id: 3, label: 'Pfiff',    short: 'F3', icon: 'whistle'};
  if (i === 4) return { id: 4, label: 'Glocke',   short: 'F4', icon: 'bell'   };
  if (i === 5) return { id: 5, label: 'Rauch',    short: 'F5', icon: 'smoke'  };
  if (i === 6) return { id: 6, label: 'Kupplung', short: 'F6', icon: 'couple' };
  if (i === 7) return { id: 7, label: 'Bremse',   short: 'F7', icon: 'brake'  };
  return { id: i, label: `Funktion ${i}`, short: `F${i}`, icon: 'generic' };
});

function FIcon({ name }) {
  const s = { stroke: 'currentColor', strokeWidth: 1.4, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'light':   return <svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="2.5" fill="currentColor"/><g {...s}><line x1="10" y1="3" x2="10" y2="5"/><line x1="10" y1="15" x2="10" y2="17"/><line x1="3" y1="10" x2="5" y2="10"/><line x1="15" y1="10" x2="17" y2="10"/></g></svg>;
    case 'sound':   return <svg viewBox="0 0 20 20" {...s}><path d="M4 8 L4 12 L8 12 L12 16 L12 4 L8 8 Z" fill="currentColor"/><path d="M14 7 Q16 10 14 13"/></svg>;
    case 'horn':    return <svg viewBox="0 0 20 20" {...s}><path d="M3 8 L8 8 L14 4 L14 16 L8 12 L3 12 Z" fill="currentColor"/></svg>;
    case 'whistle': return <svg viewBox="0 0 20 20" {...s}><path d="M2 8 L8 8 L8 6 L14 6 L14 14 L8 14 L8 12 L2 12 Z" fill="currentColor"/></svg>;
    case 'bell':    return <svg viewBox="0 0 20 20" {...s}><path d="M6 4 L14 4 L15 13 L5 13 Z" fill="currentColor"/><circle cx="10" cy="16" r="1.2" fill="currentColor"/></svg>;
    case 'smoke':   return <svg viewBox="0 0 20 20" {...s}><circle cx="6" cy="14" r="2" fill="currentColor"/><circle cx="11" cy="10" r="2" fill="currentColor"/><circle cx="14" cy="6" r="1.6" fill="currentColor"/></svg>;
    case 'couple':  return <svg viewBox="0 0 20 20" {...s}><circle cx="7" cy="10" r="3"/><circle cx="13" cy="10" r="3"/></svg>;
    case 'brake':   return <svg viewBox="0 0 20 20" {...s}><circle cx="10" cy="10" r="5"/><circle cx="10" cy="10" r="1.6" fill="currentColor"/></svg>;
    case 'generic': return <svg viewBox="0 0 20 20" {...s}><circle cx="10" cy="10" r="3" fill="currentColor"/></svg>;
    default: return null;
  }
}

function FunctionButton({ fn, active, onToggle }) {
  return (
    <button className={'fbtn ' + (active ? 'is-on' : '')} onClick={onToggle}>
      <div className="fbtn-icon"><FIcon name={fn.icon}/></div>
      <div className="fbtn-meta">
        <span className="fbtn-short">{fn.short}</span>
        <span className="fbtn-label">{fn.label}</span>
      </div>
      <span className={'fbtn-led ' + (active ? 'on' : '')}/>
    </button>
  );
}

// ── DIR ARROW ────────────────────────────────────────────────────────
function DirArrow({ direction }) {
  const cls   = direction === 1 ? 'fwd' : direction === -1 ? 'rev' : 'neutral';
  const label = direction === 1 ? 'VORWÄRTS' : direction === -1 ? 'RÜCKWÄRTS' : 'HALT';
  return (
    <div className={'speedo-dir ' + cls}>
      <div className="speedo-dir-icon">
        {direction === 1  && <svg viewBox="0 0 20 20" width="14" height="14"><path d="M3 10 L15 10 M10 5 L15 10 L10 15" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        {direction === -1 && <svg viewBox="0 0 20 20" width="14" height="14"><path d="M17 10 L5 10 M10 5 L5 10 L10 15" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        {direction === 0  && <svg viewBox="0 0 20 20" width="14" height="14"><line x1="4" y1="10" x2="16" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>}
      </div>
      <span className="speedo-dir-label">{label}</span>
    </div>
  );
}

// ── LOCO CARD ────────────────────────────────────────────────────────
function LocoCard({ inst, active, status, onPick, onRemove, canRemove }) {
  const loco = getLocoData(inst);
  return (
    <button className={'loco-card ' + (active ? 'is-active' : '')} onClick={onPick}>
      <div className="loco-card-head">
        <div className="loco-card-meta">
          <span className="loco-card-addr">#{String(inst.addr).padStart(3,'0')}</span>
          <span className="loco-card-name">{loco.name}</span>
        </div>
        <div className="loco-card-actions">
          <span className={'loco-card-status ' + (status.speed > 0 ? 'live' : 'idle')}>
            {status.speed > 0 ? '● LIVE' : '○ IDLE'}
          </span>
          {canRemove && (
            <span className="loco-card-remove"
                  onClick={e => { e.stopPropagation(); onRemove(); }}
                  title="Aus Bestand entfernen">×</span>
          )}
        </div>
      </div>
      <div className="loco-card-silhouette" style={{ color: loco.color || 'var(--ink-2)' }}>
        <loco.Render running={status.speed > 0}/>
      </div>
      <div className="loco-card-foot">
        <span>{loco.type}</span>
        <span className="loco-card-speed">{Math.round((status.speed/100) * loco.maxKmh)} <em>km/h</em></span>
      </div>
    </button>
  );
}

// ── LIBRARY MODAL ────────────────────────────────────────────────────
function LibraryModal({ onAdd, onClose }) {
  const [mode, setMode] = useState('catalog');
  const [addrs, setAddrs] = useState({});
  const [names, setNames] = useState({});

  const [cName, setCName] = useState('Meine Lok');
  const [cAddr, setCAddr] = useState('3');
  const [cModel, setCModel] = useState(LOCO_ROSTER[5]?.id || LOCO_ROSTER[0].id);
  const [cColor, setCColor] = useState('#8a8a85');

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="library-overlay" onClick={onClose}>
      <div className="library-panel" onClick={e => e.stopPropagation()}>
        <div className="library-head">
          <div>
            <h3>Lok hinzufügen</h3>
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button className={`tab-btn ${mode === 'catalog' ? 'is-active' : ''}`} style={{padding: '0 0 4px 0'}} onClick={() => setMode('catalog')}>Katalog</button>
              <button className={`tab-btn ${mode === 'custom' ? 'is-active' : ''}`} style={{padding: '0 0 4px 0'}} onClick={() => setMode('custom')}>Eigene Lok</button>
            </div>
          </div>
          <button className="library-close" onClick={onClose}>×</button>
        </div>
        
        {mode === 'catalog' && (
          <div className="library-list">
            {LOCO_ROSTER.map(model => {
              const addr = addrs[model.id] ?? model.addr;
              const name = names[model.id] ?? model.name;
              return (
                <div key={model.id} className="library-item">
                  <div className="library-item-render" style={{ color: model.color }}>
                    <model.Render running={false}/>
                  </div>
                  <div className="library-item-info">
                    <input className="library-name-input" value={name}
                           onChange={e => setNames(n => ({...n, [model.id]: e.target.value}))}
                           onClick={e => e.stopPropagation()}/>
                    <span className="library-item-sub">{model.type} · {model.road} · H0</span>
                  </div>
                  <div className="library-item-addr">
                    <label>DCC#</label>
                    <input className="library-addr-input" type="number" min="1" max="9999"
                           value={addr}
                           onChange={e => setAddrs(a => ({...a, [model.id]: e.target.value}))}
                           onClick={e => e.stopPropagation()}/>
                  </div>
                  <button className="library-add-btn"
                          onClick={() => onAdd(model.id, Number(addr) || model.addr, name, model.color)}>
                    + Hinzufügen
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {mode === 'custom' && (() => {
          const ModelComponent = LOCO_ROSTER.find(l => l.id === cModel) || LOCO_ROSTER[0];
          return (
            <div className="library-list" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label className="addr-edit-label">Name</label>
                    <input className="addr-edit-input" value={cName} onChange={e => setCName(e.target.value)} />
                  </div>
                  <div>
                    <label className="addr-edit-label">DCC-Adresse (1–9999)</label>
                    <input className="addr-edit-input addr-edit-mono" type="number" min="1" max="9999" value={cAddr} onChange={e => setCAddr(e.target.value)} />
                  </div>
                  <div>
                    <label className="addr-edit-label">Typ / Symbol</label>
                    <select className="addr-edit-input" value={cModel} onChange={e => setCModel(e.target.value)} style={{ padding: '4px' }}>
                      {LOCO_ROSTER.map(l => <option key={l.id} value={l.id}>{l.type}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="addr-edit-label">Hauptfarbe</label>
                    <input type="color" value={cColor} onChange={e => setCColor(e.target.value)} style={{ width: '100%', height: '32px', border: 'none', padding: '0', background: 'transparent', cursor: 'pointer' }} />
                  </div>
                  <button className="library-add-btn" style={{ marginTop: '10px' }} onClick={() => {
                    onAdd(cModel, Number(cAddr) || 3, cName, cColor);
                  }}>+ Zur Anlage hinzufügen</button>
                </div>
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', background: 'var(--surface-2)', padding: '20px', borderRadius: '8px' }}>
                  <span className="library-item-sub">Vorschau</span>
                  <div style={{ width: '100%', color: cColor }}>
                    <ModelComponent.Render running={true} />
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// ── ADDR EDIT MODAL (inline address change for active loco) ──────────
function AddrEditModal({ inst, isMoving, onSave, onClose }) {
  const [val, setVal] = useState(String(inst.addr));
  const [nameVal, setNameVal] = useState(inst.name);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="library-overlay" onClick={onClose}>
      <div className="addr-edit-panel" onClick={e => e.stopPropagation()}>
        <div className="library-head">
          <div>
            <h3>Lok bearbeiten</h3>
            <p className="library-sub">{getLocoData(inst).type}</p>
          </div>
          <button className="library-close" onClick={onClose}>×</button>
        </div>
        <div className="addr-edit-body">
          {isMoving && (
            <div className="addr-edit-warn">
              ⚠ Lok fährt — Adresse erst ändern wenn gestoppt
            </div>
          )}
          <label className="addr-edit-label">Name</label>
          <input className="addr-edit-input" value={nameVal}
                 onChange={e => setNameVal(e.target.value)}
                 onKeyDown={e => e.key === 'Enter' && !isMoving && onSave(inst.id, Number(val), nameVal)}/>
          <label className="addr-edit-label">DCC-Adresse (1–9999)</label>
          <input className="addr-edit-input addr-edit-mono" type="number" min="1" max="9999"
                 value={val} disabled={isMoving}
                 onChange={e => setVal(e.target.value)}
                 onKeyDown={e => e.key === 'Enter' && !isMoving && onSave(inst.id, Number(val) || inst.addr, nameVal)}/>
          <div className="addr-edit-actions">
            <button className="addr-edit-cancel" onClick={onClose}>Abbrechen</button>
            <button className="library-add-btn" disabled={isMoving}
                    onClick={() => !isMoving && onSave(inst.id, Number(val) || inst.addr, nameVal)}>
              Speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── STAT CHIP ────────────────────────────────────────────────────────
function Stat({ label, value, unit, state, mono }) {
  return (
    <div className={'stat ' + (state || '')}>
      <span className="stat-label">{label}</span>
      <span className={'stat-value ' + (mono ? 'mono' : '')}>
        {value}{unit && <em>{unit}</em>}
      </span>
    </div>
  );
}


// ── MAIN APP ─────────────────────────────────────────────────────────
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [tab,         setTab]         = useState('control');
  const [mapMode,     setMapMode]     = useState('fahren');
  const [fnOpen,      setFnOpen]      = useState(false);
  const [rosterSearch,setRosterSearch]= useState('');
  const [showLibrary, setShowLibrary] = useState(false);
  const [editingInst, setEditingInst] = useState(null); // instance being edited

  // ── Roster: active loco instances ──
  const [roster, setRoster] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('rm-roster') || '');
      return Array.isArray(saved) && saved.length > 0 ? saved : makeDefaultRoster();
    } catch { return makeDefaultRoster(); }
  });

  // ── Active loco selection ──
  const [activeId, setActiveId] = useState(() => {
    try {
      const savedId = JSON.parse(localStorage.getItem('rm-app-state') || '{}').activeId || '';
      // Migrate old format: 'electric-01' → 'inst-electric-01'
      if (savedId && !savedId.startsWith('inst-')) return 'inst-' + savedId;
      return savedId || ('inst-' + LOCO_ROSTER[2].id);
    } catch { return 'inst-' + LOCO_ROSTER[2].id; }
  });

  // ── Statuses: speed/direction/functions per instance ──
  const [statuses, setStatuses] = useState(() => {
    const defaults = Object.fromEntries(
      makeDefaultRoster().map(inst => [inst.id, { speed: 0, direction: 1, functions: [] }])
    );
    try {
      const saved = JSON.parse(localStorage.getItem('rm-app-state') || '{}').statuses || {};
      // Support migration from old model-id keys (steam-01) to instance keys (inst-steam-01)
      const migrated = {};
      for (const [k, v] of Object.entries(saved)) {
        const key = k.startsWith('inst-') ? k : 'inst-' + k;
        migrated[key] = { speed: 0, direction: 1, functions: [], ...v };
      }
      return { ...defaults, ...migrated };
    } catch { return defaults; }
  });

  const [emergency,    setEmergency]   = useState(false);
  const [savedSpeeds,  setSavedSpeeds] = useState({});
  const [power,        setPower]       = useState(() => {
    try { return JSON.parse(localStorage.getItem('rm-app-state') || '{}').power ?? true; } catch { return true; }
  });
  const [now,          setNow]         = useState(new Date());
  const [voltage]                      = useState(16.2);
  const [tempInternal, setTempInternal]= useState(34.5);
  const [customCv,     setCustomCv]    = useState({ cv: '', val: '' });
  const [cvEdits,      setCvEdits]     = useState(() => {
    try { return JSON.parse(localStorage.getItem('rm-cv-edits') || '{}'); } catch { return {}; }
  });

  // ── Derived active loco ──
  const activeInst = useMemo(() => roster.find(i => i.id === activeId) || roster[0], [roster, activeId]);
  const activeLoco = useMemo(() => activeInst ? getLocoData(activeInst) : getLocoData(makeDefaultRoster()[0]), [activeInst]);
  const status = statuses[activeId] || { speed: 0, direction: 1, functions: [] };

  // ── Ensure statuses entry exists for all roster members ──
  useEffect(() => {
    setStatuses(s => {
      const updated = { ...s };
      let changed = false;
      for (const inst of roster) {
        if (!updated[inst.id]) {
          updated[inst.id] = { speed: 0, direction: 1, functions: [] };
          changed = true;
        }
      }
      return changed ? updated : s;
    });
  }, [roster]);

  // ── Persist ──
  useEffect(() => {
    try { localStorage.setItem('rm-app-state', JSON.stringify({ activeId, power, statuses })); } catch {}
  }, [activeId, power, statuses]);

  useEffect(() => {
    try { localStorage.setItem('rm-roster', JSON.stringify(roster)); } catch {}
  }, [roster]);

  // ── Accent ──
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', t.accent);
    const hex = t.accent.replace('#', '');
    const r = parseInt(hex.slice(0,2),16), g = parseInt(hex.slice(2,4),16), b = parseInt(hex.slice(4,6),16);
    document.documentElement.style.setProperty('--accent-soft', `rgba(${r},${g},${b},0.08)`);
    document.documentElement.style.setProperty('--accent-glow', `rgba(${r},${g},${b},0.22)`);
  }, [t.accent]);

  useEffect(() => {
    const tk = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tk);
  }, []);

  useEffect(() => {
    const tk = setInterval(() => {
      setTempInternal(tt => clamp(tt + (Math.random()-0.45)*0.3 + ((statuses[activeId]?.speed||0)/100)*0.05, 28, 64));
    }, 120);
    return () => clearInterval(tk);
  }, [activeId, statuses]);

  // ── Global keyboard shortcuts ──
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      // Space = emergency stop (global, works on all tabs)
      if (e.code === 'Space') {
        e.preventDefault();
        if (emergency) { setEmergency(false); } else { eStop(); }
        return;
      }
      // All other shortcuts only apply on the control tab
      if (tab !== 'control') return;
      if (e.code === 'ArrowUp') {
        e.preventDefault();
        if (!emergency && power) setStatus(activeId, { speed: clamp((statuses[activeId]?.speed || 0) + 10, 0, 100) });
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        if (!emergency && power) setStatus(activeId, { speed: clamp((statuses[activeId]?.speed || 0) - 10, 0, 100) });
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        if (!emergency && power) setStatus(activeId, { direction: -1 });
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (!emergency && power) setStatus(activeId, { direction: 1 });
      }
      if (!emergency && power) {
        const toggleFn = (fnId) => {
          const fs = new Set(statuses[activeId]?.functions || []);
          if (fs.has(fnId)) fs.delete(fnId); else fs.add(fnId);
          setStatus(activeId, { functions: [...fs] });
        };
        if (e.key.toLowerCase() === 'l') toggleFn(0);
        if (e.key >= '1' && e.key <= '9') toggleFn(parseInt(e.key));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [emergency, power, activeId, statuses, tab]);

  // ── Roster management ──
  const addToRoster = useCallback((modelId, addr, name, color) => {
    const model = LOCO_ROSTER.find(l => l.id === modelId) || LOCO_ROSTER[0];
    const inst = { id: 'inst-' + Date.now(), modelId, addr: Number(addr) || model.addr, name: name || model.name, color };
    setRoster(r => [...r, inst]);
    setStatuses(s => ({ ...s, [inst.id]: { speed: 0, direction: 1, functions: [] } }));
    setShowLibrary(false);
  }, []);

  const removeFromRoster = useCallback((instId) => {
    setRoster(r => {
      const updated = r.filter(i => i.id !== instId);
      if (activeId === instId && updated.length > 0) setActiveId(updated[0].id);
      return updated;
    });
    // Clear search if it would leave zero results after deletion
    setRosterSearch(q => {
      if (!q) return q;
      const remaining = roster.filter(i => i.id !== instId);
      const ql = q.trim().toLowerCase();
      const anyMatch = remaining.some(inst => {
        const loco = getLocoData(inst);
        return loco.name.toLowerCase().includes(ql) || loco.type.toLowerCase().includes(ql) ||
          loco.road.toLowerCase().includes(ql) || String(inst.addr).includes(ql);
      });
      return anyMatch ? q : '';
    });
  }, [activeId, roster]);

  const saveInstEdit = useCallback((instId, newAddr, newName) => {
    setRoster(r => r.map(i => i.id === instId ? { ...i, addr: newAddr, name: newName } : i));
    setEditingInst(null);
  }, []);

  const setStatus = useCallback((id, patch) => {
    setStatuses(s => ({ ...s, [id]: { ...s[id], ...patch } }));
  }, []);

  const setSpeed = (v) => {
    if (emergency || !power) return;
    setStatus(activeId, { speed: v });
  };

  const totalCurrent = useMemo(() => {
    let c = 0.18;
    roster.forEach(inst => { c += ((statuses[inst.id]?.speed || 0) / 100) * 0.6; });
    return power ? c : 0;
  }, [roster, statuses, power]);

  const toggleFunction = (fid) => {
    const fs = new Set(status.functions);
    fs.has(fid) ? fs.delete(fid) : fs.add(fid);
    setStatus(activeId, { functions: [...fs] });
  };


  const eStop = () => {
    // Save non-zero speeds so user can restore after reset
    const snap = Object.fromEntries(
      Object.entries(statuses).filter(([,v]) => v.speed > 0).map(([k,v]) => [k, v.speed])
    );
    if (Object.keys(snap).length > 0) setSavedSpeeds(snap);
    setEmergency(true);
    setStatuses(s => Object.fromEntries(Object.entries(s).map(([k,v]) => [k, { ...v, speed: 0 }])));
  };

  const restoreSpeeds = () => {
    setStatuses(s => Object.fromEntries(
      Object.entries(s).map(([k,v]) => [k, { ...v, speed: savedSpeeds[k] ?? v.speed }])
    ));
    setSavedSpeeds({});
  };
  const canRestore = !emergency && Object.keys(savedSpeeds).length > 0;

  const setCvValue = (locoId, cv, val) => {
    const next = { ...cvEdits, [locoId]: { ...(cvEdits[locoId] || {}), [cv]: val } };
    setCvEdits(next);
    try { localStorage.setItem('rm-cv-edits', JSON.stringify(next)); } catch {}
  };

  const filteredRoster = useMemo(() => {
    const q = rosterSearch.trim().toLowerCase();
    if (!q) return roster;
    return roster.filter(inst => {
      const loco = getLocoData(inst);
      return loco.name.toLowerCase().includes(q) ||
        loco.type.toLowerCase().includes(q) ||
        loco.road.toLowerCase().includes(q) ||
        String(inst.addr).includes(q);
    });
  }, [rosterSearch, roster]);

  return (
    <div className={`app density-${t.density} ${emergency ? 'is-emergency' : ''} ${power ? '' : 'is-off'} ${t.theme === 'dark' ? 'dark' : ''}`}>

      {/* ── HEADER ── */}
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <svg viewBox="0 0 32 32" width="26" height="26">
              <rect x="3" y="14" width="26" height="9" rx="1.5" fill="currentColor"/>
              <rect x="3" y="11" width="26" height="3" fill="currentColor"/>
              <circle cx="9" cy="25" r="2.5" fill="var(--surface)" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="23" cy="25" r="2.5" fill="var(--surface)" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="8" y="7" width="3" height="4" fill="currentColor"/>
            </svg>
          </div>
          <div className="brand-text">
            <span className="brand-title">RAILMASTER <em>kontroll</em></span>
            <span className="brand-sub">DCC · H0 · v3.42</span>
          </div>
        </div>
        <div className="topbar-stats">
          {t.showStats && (
            <>
              <Stat label="GLEIS" value={power ? voltage.toFixed(1) : '0.0'} unit="V"/>
              <Stat label="STROM" value={totalCurrent.toFixed(2)} unit="A" state={totalCurrent > 2.5 ? 'warn' : ''}/>
              <Stat label="AKTIVE LOKS" value={Object.values(statuses).filter(s => s.speed > 0).length} unit={`/${roster.length}`}/>
            </>
          )}
          <Stat label="UHR" value={`${pad(now.getHours())}:${pad(now.getMinutes())}`} mono/>
        </div>
        <div className="topbar-actions" style={{ display: 'flex', gap: '8px' }}>
          <button className={'power-btn ' + (emergency ? 'on' : '')} 
                  style={emergency ? {color:'var(--red)', borderColor:'var(--red)'} : {}} 
                  onClick={() => emergency ? setEmergency(false) : eStop()}>
            <span className="power-dot" style={emergency ? {background:'var(--red)'} : {}}/>
            {emergency ? 'Not-Aus aktiv' : 'Not-Aus'}
          </button>
          <button className={'power-btn ' + (power ? 'on' : '')} onClick={() => setPower(p => !p)}>
            <span className="power-dot"/>
            {power ? 'Gleis ein' : 'Gleis aus'}
          </button>
        </div>
      </header>

      {/* ── TABS ── */}
      <div className="tabs">
        <button className={'tab-btn ' + (tab === 'control' ? 'is-active' : '')} onClick={() => setTab('control')}>
          Steuerung <span className="tab-count">{Object.values(statuses).filter(s => s.speed > 0).length}/{roster.length}</span>
        </button>
        <button className={'tab-btn ' + (tab === 'map' ? 'is-active' : '')} onClick={() => setTab('map')}>
          Strecke
        </button>
        {tab === 'map' && (
          <div className="map-build-toggle">
            <button className={mapMode === 'fahren' ? 'is-active fahren' : ''} onClick={() => setMapMode('fahren')}>▶ Fahren</button>
            <button className={mapMode === 'bauen'  ? 'is-active bauen'  : ''} onClick={() => setMapMode('bauen') }>✦ Bauen</button>
          </div>
        )}
      </div>

      {/* ── MAP TAB ── */}
      {tab === 'map' ? (
        <MapView
          accent={t.accent}
          mode={mapMode}
          roster={roster}
          statuses={statuses}
          activeId={activeId}
          onSetActiveId={setActiveId}
          onSetStatus={setStatus}
          onEStop={eStop}
          emergency={emergency}
          power={power}
        />
      ) : (

      /* ── CONTROL TAB ── */
      <main className={'layout ' + (t.showTelemetry ? '' : 'no-right')}>

        {/* LEFT: roster */}
        <aside className="panel roster">
          <div className="panel-head">
            <h2>Lokbestand</h2>
            <span className="panel-head-meta">{filteredRoster.length}/{roster.length}</span>
          </div>
          <div className="roster-search-wrap">
            <input className="roster-search" type="text"
                   placeholder="Suche Name, Typ, Adresse…"
                   value={rosterSearch} onChange={e => setRosterSearch(e.target.value)}/>
            {rosterSearch && (
              <button className="roster-search-clear" onClick={() => setRosterSearch('')} title="Suche leeren">×</button>
            )}
          </div>
          <div className="roster-list">
            {filteredRoster.length === 0 ? (
              <div className="roster-empty">Keine Loks gefunden</div>
            ) : filteredRoster.map(inst => (
              <div key={inst.id} className="loco-card-wrap">
                <LocoCard inst={inst} active={inst.id === activeId}
                          status={statuses[inst.id] || { speed:0, direction:1, functions:[] }}
                          onPick={() => setActiveId(inst.id)}
                          onRemove={() => removeFromRoster(inst.id)}
                          canRemove={roster.length > 1}/>
                <button className="loco-card-edit" onClick={() => setEditingInst(inst)}
                        title="Adresse / Name bearbeiten">✎</button>
              </div>
            ))}
          </div>
          <button className="roster-add" onClick={() => setShowLibrary(true)}>+ Neue Lok hinzufügen</button>
        </aside>

        {/* CENTER: control deck */}
        <section className="panel control-deck">
          {!power && !emergency && (
            <div className="power-off-notice">
              <div className="power-off-dot"/>
              GLEIS AUS — Oben «Gleis ein» drücken
            </div>
          )}

          <div className="deck-head">
            <div className="deck-active">
              <span className="deck-addr">DCC #{String(activeLoco.addr).padStart(3,'0')}</span>
              <h1>{activeLoco.name}</h1>
              <p>{activeLoco.type} · {activeLoco.road} · Epoche {activeLoco.era} · {activeLoco.weight}</p>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'6px', alignItems:'flex-end' }}>
              <button className={'estop ' + (emergency ? 'is-on' : '')}
                      onClick={() => emergency ? setEmergency(false) : eStop()}>
                <span className="estop-inner">
                  <strong>{emergency ? 'RESET' : 'NOT-AUS'}</strong>
                  <small>{emergency ? 'freigeben' : 'alle loks'}</small>
                </span>
              </button>
              {canRestore && (
                <button className="speed-restore-btn" onClick={restoreSpeeds}
                        title="Geschwindigkeiten von vor dem Not-Aus wiederherstellen">
                  ▶ Wiederherstellen
                </button>
              )}
            </div>
          </div>

          <div className="deck-stage">
            <div className="loco-display" style={{ color: 'var(--ink)' }}>
              <activeLoco.Render running={status.speed > 0 && power && !emergency}/>
              <div className="loco-rail">
                <span className="loco-rail-line"/>
                <span className="loco-rail-ties"/>
              </div>
            </div>
            <div className="speedo">
              <div className="speedo-digits">
                <span className="speedo-value">
                  {Math.round((status.speed/100) * activeLoco.maxKmh).toString().padStart(3,'0')}
                </span>
                <span className="speedo-unit">km/h</span>
              </div>
              <div className="speedo-bar">
                <div className="speedo-bar-fill"
                     style={{ width: `${status.speed}%`, background: status.direction === -1 ? 'var(--red)' : 'var(--accent)' }}/>
                <div className="speedo-bar-max">max {activeLoco.maxKmh}</div>
              </div>
              <div className="speedo-meta">
                <span>Stufe<strong>{Math.round(status.speed/100*28)}/28</strong></span>
                <span>Soll<strong>{status.speed}%</strong></span>
              </div>
              <DirArrow direction={status.direction}/>
            </div>
          </div>

          <div className="deck-controls">
            <Throttle value={status.speed} onChange={setSpeed} disabled={emergency || !power}/>
            <div className="deck-buttons">
              <DirectionToggle value={status.direction}
                               onChange={d => setStatus(activeId, { direction: d })}
                               disabled={emergency || !power}/>
              <div className="quick-btns" style={{ marginBottom: '8px' }}>
                <button className={`qbtn ${status.functions.includes(0) ? 'primary' : ''}`}
                        onClick={() => toggleFunction(0)} style={{ display:'inline-flex', alignItems:'center', gap:'4px' }}>
                  <FIcon name="light"/> Licht
                </button>
                <button className={`qbtn ${status.functions.includes(1) ? 'primary' : ''}`}
                        onClick={() => toggleFunction(1)} style={{ display:'inline-flex', alignItems:'center', gap:'4px' }}>
                  <FIcon name="sound"/> Sound
                </button>
                <button className={`qbtn ${status.functions.includes(2) ? 'primary' : ''}`}
                        onClick={() => toggleFunction(2)} style={{ display:'inline-flex', alignItems:'center', gap:'4px' }}>
                  <FIcon name="horn"/> Horn
                </button>
                <button className="qbtn" onClick={() => setSpeed(0)} disabled={emergency || !power}
                        style={{ color:'var(--red)', display:'inline-flex', alignItems:'center', gap:'4px' }}>
                  <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <circle cx="10" cy="10" r="7"/>
                    <line x1="7.5" y1="7.5" x2="12.5" y2="12.5"/>
                    <line x1="12.5" y1="7.5" x2="7.5" y2="12.5"/>
                  </svg>
                  Halt
                </button>
              </div>
              <div className="quick-btns">
                <button className="qbtn" onClick={() => setSpeed(clamp(status.speed-1,0,100))} disabled={emergency || !power}>− 1</button>
                <button className="qbtn" onClick={() => setSpeed(clamp(status.speed-10,0,100))} disabled={emergency || !power}>− 10</button>
                <button className="qbtn" onClick={() => setSpeed(clamp(status.speed+10,0,100))} disabled={emergency || !power}>+ 10</button>
                <button className="qbtn" onClick={() => setSpeed(clamp(status.speed+1,0,100))} disabled={emergency || !power}>+ 1</button>
              </div>
              <div className={'fn-collapse ' + (fnOpen ? 'open' : '')}>
                <button className="fn-collapse-head" onClick={() => setFnOpen(o => !o)}>
                  <span className="lbl">Funktionen</span>
                  <span className="meta">
                    {status.functions.length > 0 && <span style={{ color: 'var(--accent)' }}>{status.functions.length} aktiv</span>}
                    <span className="chev">›</span>
                  </span>
                </button>
                <div className="fn-collapse-body">
                  <div className="fgrid">
                    {FUNCTIONS.map(f => (
                      <FunctionButton key={f.id} fn={f} active={status.functions.includes(f.id)}
                                      onToggle={() => toggleFunction(f.id)}/>
                    ))}
                  </div>
                </div>
              </div>
              {!t.showTelemetry && (
                <button className="expand-trigger" onClick={() => setTweak('showTelemetry', true)}>
                  + Telemetrie & CV-Werte einblenden
                </button>
              )}
              <div className="kbd-hint">
                <span><kbd>Leertaste</kbd>Not-Aus</span>
                <span><kbd>↑</kbd><kbd>↓</kbd>Tempo ±10</span>
                <span><kbd>←</kbd><kbd>→</kbd>Richtung</span>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT: telemetry & CV */}
        {t.showTelemetry && (
          <aside className="panel sidebar-right">
            <div className="panel-head">
              <h2>Telemetrie</h2>
              <span className="panel-head-meta">
                <button onClick={() => setTweak('showTelemetry', false)}>schließen ×</button>
              </span>
            </div>
            <div className="gauges">
              <Gauge value={status.speed/100 * activeLoco.maxKmh} max={activeLoco.maxKmh} label="km/h" unit=""/>
              <Gauge value={totalCurrent} max={3.5} label="Strom" unit="A" danger={totalCurrent > 2.5}/>
            </div>
            <div className="panel-head">
              <h2>CV-Werte</h2>
              <span className="panel-head-meta mono">#{activeLoco.addr}</span>
            </div>
            <div className="cv-table">
              {[['CV1 Adresse','CV1'],['CV2 V-min','CV2'],['CV5 V-max','CV5'],['CV3 Beschl.','CV3'],['CV4 Brems.','CV4']].map(([label, key]) => {
                const defs = cvDefaults(activeLoco);
                const val = ((cvEdits[activeId] || {})[key]) ?? defs[key];
                return (
                  <div key={key} className="cv-row">
                    <span>{label}</span>
                    <input className="cv-val-input" value={val}
                           onClick={e => e.target.select()}
                           onChange={e => setCvValue(activeId, key, e.target.value)}
                           onKeyDown={e => {
                             if (e.key === 'Enter') {
                               e.target.blur();
                               e.target.style.background = 'var(--green)';
                               e.target.style.color = '#fff';
                               setTimeout(() => { e.target.style.background = ''; e.target.style.color = ''; }, 300);
                             }
                           }}/>
                  </div>
                );
              })}
              <div className="cv-row" style={{ marginTop: '12px', borderTop: '1px solid var(--hair-2)', paddingTop: '12px' }}>
                <span>CV: <input className="cv-val-input" style={{width:'36px', marginRight:'6px'}} value={customCv.cv} onClick={e => e.target.select()} onChange={e => setCustomCv(c => ({...c, cv: e.target.value}))} placeholder="#" /></span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <input className="cv-val-input" value={customCv.val} onClick={e => e.target.select()} onChange={e => setCustomCv(c => ({...c, val: e.target.value}))} placeholder="Wert" />
                  <button className="library-add-btn" style={{ padding: '2px 8px', height: 'auto', fontSize: '10px' }} onClick={() => {
                    if (customCv.cv && customCv.val) {
                      setCvValue(activeId, `CV${customCv.cv}`, customCv.val);
                      setCustomCv({ cv: '', val: '' });
                    }
                  }}>Schreiben</button>
                </div>
              </div>
              <div className="cv-row">
                <span>Temp Zentr.</span>
                <span className="mono">{tempInternal.toFixed(1)}°C</span>
              </div>
            </div>
          </aside>
        )}
      </main>
      )}

      {/* ── EMERGENCY OVERLAY ── */}
      {emergency && (
        <div className="emergency-overlay">
          <div className="emergency-stripes"/>
          <div className="emergency-msg">
            <span className="emergency-icon">!</span>
            Notabschaltung aktiv — alle Loks gestoppt
          </div>
        </div>
      )}

      {/* ── LIBRARY MODAL ── */}
      {showLibrary && <LibraryModal onAdd={addToRoster} onClose={() => setShowLibrary(false)}/>}

      {/* ── ADDR EDIT MODAL ── */}
      {editingInst && <AddrEditModal inst={editingInst}
                                    isMoving={(statuses[editingInst.id]?.speed || 0) > 0}
                                    onSave={saveInstEdit} onClose={() => setEditingInst(null)}/>}

      {/* ── TWEAKS ── */}
      <TweaksPanel>
        <TweakSection label="Erscheinungsbild"/>
        <TweakRadio label="Theme" value={t.theme} options={['light','dark']} onChange={v => setTweak('theme', v)}/>
        <TweakColor label="Akzentfarbe" value={t.accent} options={ACCENTS} onChange={v => setTweak('accent', v)}/>
        <TweakRadio label="Dichte" value={t.density} options={['compact','regular','comfy']} onChange={v => setTweak('density', v)}/>
        <TweakSection label="Sichtbarkeit"/>
        <TweakToggle label="Telemetrie & CV-Werte" value={t.showTelemetry} onChange={v => setTweak('showTelemetry', v)}/>
        <TweakToggle label="System-Statistiken" value={t.showStats} onChange={v => setTweak('showStats', v)}/>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);

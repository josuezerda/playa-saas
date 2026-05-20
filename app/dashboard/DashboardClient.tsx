'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Fuel, LogOut, WifiOff, RefreshCw, PlayCircle, StopCircle, DollarSign, X, TrendingUp, Activity, Droplets } from 'lucide-react';
import styles from './dashboard.module.css';

/* ─── Types ─────────────────────────────────────── */
interface Nozzle {
  id: number;
  nozzle_number: number;
  face: 'A' | 'B';
  fuel_type: string;
  price: number;
  state: string;
  blocked: boolean;
}

interface Pump {
  id: number;
  position: number;
  label: string;
  model: string;
  model_type: string;
  blocked: boolean;
  nozzles: Nozzle[];
}

interface StockItem {
  fuel_type: string;
  tank_name: string;
  capacity_liters: number;
  current_volume: number;
}

interface Shift {
  id: string;
  operator_name: string;
  opened_at: string;
  total_liters: number;
  total_amount: number;
  sales_count: number;
}

interface TodayStats { totalLiters: number; totalAmount: number; txCount: number; }

interface Props {
  pumpsRaw: Pump[];
  stockRaw: StockItem[];
  shiftRaw: Shift | null;
  userEmail: string;
  tenantName: string;
  stationIds?: number[];
  activeTenantId?: number | null;
  todayStats?: TodayStats;
}

/* ─── Fuel helpers ───────────────────────────────── */
const FUEL_LABELS: Record<string, string> = {
  NAFTA_SUPER:    'NS',
  NAFTA_PREMIUM:  'NP',
  DIESEL:         'DS',
  DIESEL_PREMIUM: 'DP',
  GNC:            'GNC',
};

const FUEL_COLORS: Record<string, string> = {
  NAFTA_SUPER:    '#10B981',
  NAFTA_PREMIUM:  '#3B82F6',
  DIESEL:         '#F59E0B',
  DIESEL_PREMIUM: '#A855F7',
  GNC:            '#0EA5E9',
};

const STATE_COLORS: Record<string, string> = {
  IDLE:        '#4B5C73',
  LIBRE:       '#4B5C73',
  LLAMANDO:    '#EAB308',
  AUTORIZANDO: '#EAB308',
  AUTORIZADO:  '#3B82F6',
  DESPACHANDO: '#3B82F6',
  COMPLETADO:  '#10B981',
  BLOQUEADO:   '#EF4444',
};

function stateLabel(s: string) {
  const MAP: Record<string, string> = {
    IDLE: 'LIBRE', LIBRE: 'LIBRE', LLAMANDO: 'LLAMANDO',
    AUTORIZANDO: 'AUTORIZANDO', AUTORIZADO: 'AUTORIZADO',
    DESPACHANDO: 'DESPACHANDO', COMPLETADO: 'COMPLETADO', BLOQUEADO: 'BLOQUEADO',
  };
  return MAP[s] ?? s;
}

function elapsedTime(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}

/* ─── Nozzle Row ─────────────────────────────────── */
function NozzleRow({ nozzle }: { nozzle: Nozzle }) {
  const label = FUEL_LABELS[nozzle.fuel_type] ?? nozzle.fuel_type;
  const color = FUEL_COLORS[nozzle.fuel_type] ?? '#94A3B8';
  const state = nozzle.blocked ? 'BLOQUEADO' : (nozzle.state || 'LIBRE');
  const sc = STATE_COLORS[state] ?? '#4B5C73';
  const isActive = ['AUTORIZANDO', 'AUTORIZADO', 'DESPACHANDO'].includes(state);

  return (
    <div className={`${styles.nozzleRow} ${isActive ? styles.nozzleActive : ''}`}>
      <div className={styles.nozzleLeft}>
        <span className={styles.nozzleNum}>{nozzle.nozzle_number}</span>
        <span className={styles.fuelBadge} style={{ background: color }}>{label}</span>
      </div>
      <span className={styles.nozzleState} style={{ color: sc }}>
        {isActive && <span className={styles.pulse} style={{ background: sc }} />}
        {stateLabel(state)}
      </span>
    </div>
  );
}

/* ─── Pump Card ──────────────────────────────────── */
function PumpCard({ pump }: { pump: Pump }) {
  const faceA = pump.nozzles.filter(n => n.face === 'A').sort((a, b) => a.nozzle_number - b.nozzle_number);
  const faceB = pump.nozzles.filter(n => n.face === 'B').sort((a, b) => a.nozzle_number - b.nozzle_number);
  const isOctuple = pump.model_type === 'OCTUPLA';
  const typeLabel = isOctuple ? 'Óctupla' : 'Cuádrupla';

  return (
    <div className={`${styles.pumpCard} ${pump.blocked ? styles.pumpBlocked : ''}`}>
      <div className={styles.pumpHeader}>
        <div className={styles.pumpBadge} style={{ background: pump.blocked ? '#EF4444' : '#3B82F6' }}>
          {pump.position}
        </div>
        <div>
          <div className={styles.pumpTitle}>{pump.label}</div>
          <div className={styles.pumpModel}>{pump.model} · {typeLabel}</div>
        </div>
      </div>

      <div className={styles.pumpFaces}>
        <div className={styles.face}>
          <div className={styles.faceLabel}>▶ CARA A</div>
          <div className={styles.nozzles}>
            {faceA.map(n => <NozzleRow key={n.id} nozzle={n} />)}
          </div>
        </div>
        <div className={styles.face}>
          <div className={`${styles.faceLabel} ${styles.faceLabelRight}`}>◀ CARA B</div>
          <div className={styles.nozzles}>
            {faceB.map(n => <NozzleRow key={n.id} nozzle={n} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Sidebar ────────────────────────────────────── */
function Sidebar({ stock, shift }: { stock: StockItem[]; shift: Shift | null }) {
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    if (!shift) return;
    const tick = () => setElapsed(elapsedTime(shift.opened_at));
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [shift]);

  return (
    <aside className={styles.sidebar}>
      {/* Simulación */}
      <div className={`${styles.glass} ${styles.sidePanel}`}>
        <div className={styles.panelTitle}>SIMULACIÓN</div>
        <button className={styles.btnSim}>▶ Iniciar Simulación</button>
        <div className={styles.legend}>
          {[
            ['#4B5C73', 'Libre'],
            ['#EAB308', 'Llamando / Autorizando'],
            ['#3B82F6', 'Autorizado / Despachando'],
            ['#10B981', 'Completado'],
            ['#EF4444', 'Bloqueado'],
          ].map(([c, l]) => (
            <div key={l} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: c }} />
              {l}
            </div>
          ))}
        </div>
        <div className={styles.simNotes}>
          <p>💡 Clic en un pico LIBRE para simular despacho.</p>
          <p>💡 Clic en BLOQUEADO para desbloquear.</p>
          <p>⚠ Errores bloquean el pico automáticamente.</p>
        </div>
      </div>

      {/* Turno activo */}
      <div className={`${styles.glass} ${styles.sidePanel}`}>
        <div className={styles.panelTitle}>TURNO ACTIVO</div>
        <div className={styles.statList}>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Operador</span>
            <span className={`${styles.statVal} ${styles.accent}`}>{shift?.operator_name ?? '—'}</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Duración</span>
            <span className={styles.statVal}>{elapsed || '—'}</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Despachos</span>
            <span className={styles.statVal}>{shift?.sales_count ?? 0}</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Litros total</span>
            <span className={styles.statVal}>{(shift?.total_liters ?? 0).toFixed(1)} L</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Monto total</span>
            <span className={`${styles.statVal} ${styles.accent}`}>
              ${(shift?.total_amount ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Stock */}
      <div className={`${styles.glass} ${styles.sidePanel} ${styles.sidePanelFlex}`}>
        <div className={styles.panelTitle}>STOCK DE TANQUES</div>
        <div className={styles.stockList}>
          {stock.map(item => {
            const pct = Math.round((item.current_volume / item.capacity_liters) * 100);
            const color = FUEL_COLORS[item.fuel_type] ?? '#94A3B8';
            const label = FUEL_LABELS[item.fuel_type] ?? item.fuel_type;
            return (
              <div key={item.fuel_type} className={styles.stockItem}>
                <div className={styles.stockInfo}>
                  <span className={styles.stockLabel} style={{ color }}>{label}</span>
                  <span className={styles.stockVol}>
                    {item.current_volume.toLocaleString('es-AR')}/{item.capacity_liters.toLocaleString('es-AR')} L
                  </span>
                </div>
                <div className={styles.progressBg}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${pct}%`, background: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

/* ─── Shift Modal ────────────────────────────────── */
function ShiftModal({ open, onClose, currentShift, stationIds, onDone }: {
  open: boolean; onClose: () => void; currentShift: Shift | null;
  stationIds: number[]; onDone: () => void;
}) {
  const [operador, setOperador] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  if (!open) return null;

  const handleOpen = async () => {
    if (!operador.trim()) return;
    setLoading(true);
    const id = `SHIFT-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Date.now()}`;
    await supabase.from('shifts').insert({ id, station_id: stationIds[0], operator_name: operador, status: 'OPEN' });
    setLoading(false); onDone(); onClose();
  };

  const handleClose = async () => {
    if (!currentShift) return;
    setLoading(true);
    await supabase.from('shifts').update({ status: 'CLOSED', closed_at: new Date().toISOString() }).eq('id', currentShift.id);
    setLoading(false); onDone(); onClose();
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#1e2a3a', borderRadius:16, padding:32, width:400, position:'relative' }}>
        <button onClick={onClose} style={{ position:'absolute', top:16, right:16, background:'none', color:'#94a3b8' }}><X size={20}/></button>
        <h2 style={{ fontSize:18, fontWeight:700, marginBottom:20, color:'#f1f5f9' }}>
          {currentShift ? '🛑 Cerrar Turno Activo' : '▶ Abrir Nuevo Turno'}
        </h2>
        {!currentShift ? (
          <>
            <label style={{ fontSize:12, color:'#94a3b8', fontWeight:600 }}>NOMBRE DEL OPERADOR</label>
            <input value={operador} onChange={e => setOperador(e.target.value)}
              placeholder="Ej: Juan Pérez" style={{ width:'100%', marginTop:8, padding:'10px 14px', background:'#0f172a', border:'1px solid #334155', borderRadius:8, color:'#f1f5f9', fontSize:14, boxSizing:'border-box' }}/>
            <button onClick={handleOpen} disabled={loading || !operador.trim()}
              style={{ width:'100%', marginTop:16, padding:'12px', background:'#10b981', color:'white', border:'none', borderRadius:8, fontWeight:700, fontSize:14, cursor:'pointer' }}>
              {loading ? 'Abriendo...' : '▶ Confirmar Apertura'}
            </button>
          </>
        ) : (
          <>
            <div style={{ background:'#0f172a', borderRadius:10, padding:16, marginBottom:16, fontSize:13, color:'#94a3b8' }}>
              <div>Operador: <strong style={{color:'#f1f5f9'}}>{currentShift.operator_name}</strong></div>
              <div style={{marginTop:8}}>Litros: <strong style={{color:'#f1f5f9'}}>{Number(currentShift.total_liters).toFixed(1)} L</strong></div>
              <div style={{marginTop:4}}>Monto: <strong style={{color:'#10b981'}}>${Number(currentShift.total_amount).toLocaleString('es-AR')}</strong></div>
            </div>
            <button onClick={handleClose} disabled={loading}
              style={{ width:'100%', padding:'12px', background:'#ef4444', color:'white', border:'none', borderRadius:8, fontWeight:700, fontSize:14, cursor:'pointer' }}>
              {loading ? 'Cerrando...' : '🛑 Confirmar Cierre de Turno'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Price Modal ────────────────────────────────── */
function PriceModal({ open, onClose, stationId, onDone }: {
  open: boolean; onClose: () => void; stationId: number; onDone: () => void;
}) {
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [nozzles, setNozzles] = useState<{id:number; fuel_type:string; price:number}[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!open) return;
    supabase.from('nozzles').select('id, fuel_type, price').eq('station_id', stationId)
      .then(({ data }) => {
        if (!data) return;
        // deduplicate by fuel_type
        const seen = new Set<string>();
        const unique = data.filter(n => { if (seen.has(n.fuel_type)) return false; seen.add(n.fuel_type); return true; });
        setNozzles(unique);
        const init: Record<string,string> = {};
        unique.forEach(n => { init[n.fuel_type] = String(n.price); });
        setPrices(init);
      });
  }, [open, stationId]);

  const LABELS: Record<string,string> = { NAFTA_SUPER:'Nafta Súper', NAFTA_PREMIUM:'Nafta Premium', DIESEL:'Diésel', DIESEL_PREMIUM:'Diésel Premium', GNC:'GNC' };

  const handleSave = async () => {
    setLoading(true);
    for (const n of nozzles) {
      const newPrice = parseFloat(prices[n.fuel_type] || '0');
      if (newPrice !== n.price) {
        await supabase.from('nozzles').update({ price: newPrice }).eq('station_id', stationId).eq('fuel_type', n.fuel_type);
        await supabase.from('price_changes').insert({ station_id: stationId, nozzle_id: n.id, fuel_type: n.fuel_type, old_price: n.price, new_price: newPrice, changed_by: 'admin' });
      }
    }
    setLoading(false); onDone(); onClose();
  };

  if (!open) return null;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#1e2a3a', borderRadius:16, padding:32, width:440, position:'relative' }}>
        <button onClick={onClose} style={{ position:'absolute', top:16, right:16, background:'none', color:'#94a3b8' }}><X size={20}/></button>
        <h2 style={{ fontSize:18, fontWeight:700, marginBottom:6, color:'#f1f5f9' }}>💲 Actualizar Precios</h2>
        <p style={{ fontSize:12, color:'#64748b', marginBottom:20 }}>Los nuevos precios aplican a todos los picos del tipo de combustible.</p>
        {nozzles.map(n => (
          <div key={n.fuel_type} style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, color:'#94a3b8', fontWeight:600 }}>{LABELS[n.fuel_type] ?? n.fuel_type} — Precio actual: ${n.price}</label>
            <input type="number" value={prices[n.fuel_type] ?? ''} onChange={e => setPrices(p => ({...p, [n.fuel_type]: e.target.value}))}
              style={{ width:'100%', marginTop:6, padding:'10px 14px', background:'#0f172a', border:'1px solid #334155', borderRadius:8, color:'#f1f5f9', fontSize:14, boxSizing:'border-box' }}/>
          </div>
        ))}
        <button onClick={handleSave} disabled={loading}
          style={{ width:'100%', marginTop:8, padding:'12px', background:'#3b82f6', color:'white', border:'none', borderRadius:8, fontWeight:700, fontSize:14, cursor:'pointer' }}>
          {loading ? 'Guardando...' : '💾 Guardar Precios'}
        </button>
      </div>
    </div>
  );
}

/* ─── Main Dashboard ─────────────────────────────── */
export function DashboardClient({ pumpsRaw, stockRaw, shiftRaw, userEmail, tenantName, stationIds = [], activeTenantId, todayStats }: Props) {
  const [pumps, setPumps] = useState<Pump[]>(pumpsRaw);
  const [shift, setShift] = useState<Shift | null>(shiftRaw);
  const [connected, setConnected] = useState(true);
  const [time, setTime] = useState('');
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const refresh = useCallback(() => router.refresh(), [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const octuplas = pumps.filter(p => p.model_type === 'OCTUPLA');
  const cuadruplas = pumps.filter(p => p.model_type === 'CUADRUPLA');

  return (
    <div className={styles.app}>
      <ShiftModal open={showShiftModal} onClose={() => setShowShiftModal(false)} currentShift={shift} stationIds={stationIds} onDone={refresh} />
      <PriceModal open={showPriceModal} onClose={() => setShowPriceModal(false)} stationId={stationIds[0] ?? 1} onDone={refresh} />

      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logoIcon}><Fuel size={22} color="white" /></div>
          <div>
            <h1 className={styles.logoTitle}>
              Módulo Playa <span>Estación de Servicio —</span>{' '}
              <span className={styles.logoGreen}>{tenantName || 'Global'}</span>
            </h1>
            <div className={styles.logoSub}>
              VOX Forecourt Controller · Protocolo PAM 1000 · TCP/IP · {pumps.length} Surtidores
            </div>
          </div>
        </div>

        <div className={styles.headerRight}>
          {/* Stats del día */}
          {todayStats && (
            <>
              <div className={styles.badge} style={{gap:6}}><Droplets size={12}/>{todayStats.totalLiters.toFixed(0)} L hoy</div>
              <div className={styles.badge} style={{gap:6, color:'#10b981'}}><TrendingUp size={12}/>$ {todayStats.totalAmount.toLocaleString('es-AR',{maximumFractionDigits:0})} hoy</div>
            </>
          )}
          {/* Turno */}
          <button onClick={() => setShowShiftModal(true)}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:8, border:'none', cursor:'pointer', fontWeight:600, fontSize:12,
              background: shift ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
              color: shift ? '#ef4444' : '#10b981' }}>
            {shift ? <StopCircle size={14}/> : <PlayCircle size={14}/>}
            {shift ? 'Cerrar Turno' : 'Abrir Turno'}
          </button>
          {/* Precios */}
          <button onClick={() => setShowPriceModal(true)}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:8, border:'none', cursor:'pointer', fontWeight:600, fontSize:12, background:'rgba(59,130,246,0.15)', color:'#3b82f6' }}>
            <DollarSign size={14}/> Precios
          </button>
          {connected
            ? <div className={styles.badge}><span className={styles.dot} />VOX Conectada</div>
            : <div className={`${styles.badge} ${styles.badgeRed}`}><WifiOff size={12} />Desconectada</div>
          }
          <span className={styles.clock}>{time}</span>
          <button className={styles.iconBtn} onClick={refresh} title="Refrescar">
            <RefreshCw size={16} />
          </button>
          <button className={styles.iconBtn} onClick={handleLogout} title="Cerrar sesión">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className={styles.body}>
        {/* Main pumps area */}
        <main className={styles.pumpsSection}>
          {/* Octuplas */}
          {octuplas.length > 0 && (
            <section>
              <div className={styles.groupTitle}>
                SURTIDORES PMD-4821 — ÓCTUPLA (8 PICOS · 4 POR CARA)
              </div>
              <div className={styles.pumpGrid}>
                {octuplas.map(p => <PumpCard key={p.id} pump={p} />)}
              </div>
            </section>
          )}

          {/* Cuadruplas */}
          {cuadruplas.length > 0 && (
            <section>
              <div className={styles.groupTitle}>
                SURTIDORES PMD-2421 — CUÁDRUPLA (4 PICOS · 2 POR CARA)
              </div>
              <div className={styles.pumpGrid}>
                {cuadruplas.map(p => <PumpCard key={p.id} pump={p} />)}
              </div>
            </section>
          )}

          {/* Empty state */}
          {pumps.length === 0 && (
            <div className={styles.emptyState}>
              <Fuel size={40} opacity={0.3} />
              <p>No hay surtidores configurados para esta estación.</p>
              <p style={{ fontSize: 12, marginTop: 4, opacity: 0.6 }}>
                Ejecutá el seed en Supabase para comenzar.
              </p>
            </div>
          )}
        </main>

        {/* Sidebar */}
        <Sidebar stock={stockRaw} shift={shiftRaw} />
      </div>
    </div>
  );
}

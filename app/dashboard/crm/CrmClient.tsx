'use client';

import { useState } from 'react';
import { Users, MessageSquare, Megaphone, Search, Plus, Send, ChevronRight, X } from 'lucide-react';
import styles from '../dashboard.module.css';

interface Contact {
  id: number; name: string; phone: string; email?: string;
  tags: string[]; total_spent: number; visits_count: number; last_visit?: string;
}
interface Campaign {
  id: number; name: string; message: string; status: string;
  sent_count: number; failed_count: number; created_at: string;
}
interface Message {
  id: number; direction: 'inbound' | 'outbound'; content: string; created_at: string;
}

export default function CrmClient({ contactsInitial, campaignsInitial, tenantId, tenantParam }:
  { contactsInitial: Contact[]; campaignsInitial: Campaign[]; tenantId: number; tenantParam?: string }) {
  const [tab, setTab] = useState<'contacts' | 'chat' | 'campaigns'>('contacts');
  const [contacts, setContacts] = useState<Contact[]>(contactsInitial);
  const [campaigns] = useState<Campaign[]>(campaignsInitial);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);

  // New contact modal
  const [showNewContact, setShowNewContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '', email: '' });

  // Broadcast modal
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcast, setBroadcast] = useState({ name: '', message: '' });
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<{ sent: number; failed: number } | null>(null);

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const openChat = async (contact: Contact) => {
    setSelectedContact(contact);
    setTab('chat');
    const res = await fetch(`/api/crm/contacts/${contact.id}/messages`);
    const data = await res.json();
    setMessages(data || []);
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || !selectedContact) return;
    setSending(true);
    try {
      await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: selectedContact.phone, message: chatInput, contact_id: selectedContact.id, tenant_id: tenantId }),
      });
      setMessages(prev => [...prev, { id: Date.now(), direction: 'outbound', content: chatInput, created_at: new Date().toISOString() }]);
      setChatInput('');
    } finally {
      setSending(false);
    }
  };

  const createContact = async () => {
    const res = await fetch('/api/crm/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newContact, tenant_id: tenantId }),
    });
    const data = await res.json();
    if (res.ok) {
      setContacts(prev => [data, ...prev]);
      setShowNewContact(false);
      setNewContact({ name: '', phone: '', email: '' });
    }
  };

  const launchBroadcast = async () => {
    setBroadcastLoading(true);
    const res = await fetch('/api/crm/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...broadcast, tenant_id: tenantId }),
    });
    const data = await res.json();
    if (res.ok) setBroadcastResult({ sent: data.sent, failed: data.failed });
    setBroadcastLoading(false);
  };

  const TABS = [
    { key: 'contacts', label: 'Contactos', icon: Users },
    { key: 'chat', label: 'Chat', icon: MessageSquare },
    { key: 'campaigns', label: 'Campañas', icon: Megaphone },
  ] as const;

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    border: '1px solid var(--border)', background: 'var(--bg-panel)',
    color: 'var(--text-primary)', fontSize: 13,
  };

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div>
            <h1 className={styles.logoTitle}>CRM — Clientes</h1>
            <div className={styles.logoSub}>Gestión de contactos, chat WhatsApp y campañas de difusión</div>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div style={{ display: 'flex', gap: 2, background: 'var(--bg-panel)', borderRadius: 10, padding: 4 }}>
            {TABS.map(t => {
              const Icon = t.icon;
              return (
                <button key={t.key} onClick={() => setTab(t.key)}
                  style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7,
                    background: tab === t.key ? 'var(--bg-card)' : 'transparent',
                    color: tab === t.key ? 'var(--accent)' : 'var(--text-secondary)',
                    boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>
                  <Icon size={15} /> {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className={styles.body} style={{ padding: 24, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 0 }}>

        {/* ── Contacts Tab ── */}
        {tab === 'contacts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar contacto..." style={{ ...inputStyle, paddingLeft: 38 }} />
              </div>
              <button onClick={() => setShowNewContact(true)}
                style={{ background: 'var(--accent)', color: 'white', padding: '10px 18px', borderRadius: 8, fontWeight: 600, fontSize: 13, display: 'flex', gap: 8, alignItems: 'center', whiteSpace: 'nowrap' }}>
                <Plus size={15} /> Nuevo Contacto
              </button>
            </div>

            <div className={styles.glass} style={{ flex: 1, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.02)' }}>
                    {['NOMBRE', 'TELÉFONO', 'EMAIL', 'GASTADO', 'VISITAS', ''].map(h => (
                      <th key={h} style={{ padding: '14px 18px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textAlign: 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>{c.name}</div>
                        {c.tags?.length > 0 && (
                          <div style={{ marginTop: 4, display: 'flex', gap: 4 }}>
                            {c.tags.map(t => <span key={t} style={{ fontSize: 10, background: 'rgba(59,130,246,0.1)', color: '#3B82F6', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>{t}</span>)}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: 13, color: 'var(--text-secondary)' }}>{c.phone}</td>
                      <td style={{ padding: '14px 18px', fontSize: 13, color: 'var(--text-secondary)' }}>{c.email || '—'}</td>
                      <td style={{ padding: '14px 18px', fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>${(c.total_spent || 0).toLocaleString('es-AR')}</td>
                      <td style={{ padding: '14px 18px', fontSize: 13, color: 'var(--text-secondary)' }}>{c.visits_count}</td>
                      <td style={{ padding: '14px 18px' }}>
                        <button onClick={() => openChat(c)}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(59,130,246,0.08)', color: '#3B82F6', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                          <MessageSquare size={13} /> Chat
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredContacts.length === 0 && (
                <div className={styles.emptyState} style={{ padding: '40px' }}>
                  <Users size={32} opacity={0.3} />
                  <p style={{ fontSize: 13, marginTop: 8 }}>No hay contactos aún.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Chat Tab ── */}
        {tab === 'chat' && (
          <div style={{ display: 'flex', gap: 0, height: '100%', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
            {/* Contact list */}
            <div style={{ width: 280, background: 'var(--bg-card)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: 16, borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 13, color: 'var(--text-secondary)' }}>CONTACTOS</div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {contacts.map(c => (
                  <div key={c.id} onClick={() => openChat(c)}
                    style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)',
                      background: selectedContact?.id === c.id ? 'rgba(59,130,246,0.08)' : 'transparent' }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{c.phone}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Chat area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-panel)' }}>
              {selectedContact ? (
                <>
                  <div style={{ padding: '16px 20px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {selectedContact.name} <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>{selectedContact.phone}</span>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {messages.map(m => (
                      <div key={m.id} style={{ display: 'flex', justifyContent: m.direction === 'outbound' ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          maxWidth: '70%', padding: '10px 14px', borderRadius: m.direction === 'outbound' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                          background: m.direction === 'outbound' ? 'var(--accent)' : 'var(--bg-card)',
                          color: m.direction === 'outbound' ? 'white' : 'var(--text-primary)',
                          fontSize: 13, boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
                        }}>
                          {m.content}
                          <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: 'right' }}>
                            {new Date(m.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))}
                    {messages.length === 0 && (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginTop: 40 }}>No hay mensajes aún. Iniciá la conversación.</div>
                    )}
                  </div>
                  <div style={{ padding: 16, background: 'var(--bg-card)', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
                    <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      placeholder="Escribí un mensaje..." style={{ ...inputStyle, flex: 1 }} />
                    <button onClick={sendMessage} disabled={sending || !chatInput.trim()}
                      style={{ background: 'var(--accent)', color: 'white', padding: '10px 18px', borderRadius: 8, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, opacity: sending ? 0.7 : 1 }}>
                      <Send size={15} /> Enviar
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, color: 'var(--text-muted)' }}>
                  <MessageSquare size={32} opacity={0.3} />
                  <p style={{ fontSize: 13 }}>Seleccioná un contacto para ver el chat.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Campaigns Tab ── */}
        {tab === 'campaigns' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowBroadcast(true)}
                style={{ background: 'var(--accent)', color: 'white', padding: '10px 18px', borderRadius: 8, fontWeight: 600, fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>
                <Megaphone size={15} /> Nueva Campaña
              </button>
            </div>

            <div className={styles.glass} style={{ overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.02)' }}>
                    {['NOMBRE', 'MENSAJE', 'ENVIADOS', 'FALLIDOS', 'ESTADO', 'FECHA'].map(h => (
                      <th key={h} style={{ padding: '14px 18px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textAlign: 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>{c.name}</td>
                      <td style={{ padding: '14px 18px', fontSize: 12, color: 'var(--text-secondary)', maxWidth: 200 }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{c.message}</span>
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 600, color: '#10B981', fontSize: 14 }}>{c.sent_count}</td>
                      <td style={{ padding: '14px 18px', fontWeight: 600, color: c.failed_count > 0 ? '#EF4444' : 'var(--text-muted)', fontSize: 14 }}>{c.failed_count}</td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                          background: c.status === 'DONE' ? 'rgba(16,185,129,0.1)' : c.status === 'RUNNING' ? 'rgba(59,130,246,0.1)' : 'rgba(148,163,184,0.1)',
                          color: c.status === 'DONE' ? '#10B981' : c.status === 'RUNNING' ? '#3B82F6' : '#94A3B8',
                        }}>{c.status}</span>
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: 12, color: 'var(--text-muted)' }}>
                        {new Date(c.created_at).toLocaleDateString('es-AR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {campaigns.length === 0 && (
                <div className={styles.emptyState} style={{ padding: '40px' }}>
                  <Megaphone size={32} opacity={0.3} />
                  <p style={{ fontSize: 13, marginTop: 8 }}>No hay campañas creadas. Lanzá tu primera difusión.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* New Contact Modal */}
      {showNewContact && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 28, width: 420, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontWeight: 700, fontSize: 16 }}>Nuevo Contacto</h2>
              <button onClick={() => setShowNewContact(false)} style={{ background: 'transparent', color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[['Nombre completo *', 'name', 'text'], ['Teléfono (con código de país) *', 'phone', 'tel'], ['Email', 'email', 'email']].map(([label, key, type]) => (
                <div key={key}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>{label}</label>
                  <input type={type} value={(newContact as any)[key]} onChange={e => setNewContact(p => ({ ...p, [key]: e.target.value }))}
                    style={inputStyle} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowNewContact(false)} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600 }}>Cancelar</button>
              <button onClick={createContact} style={{ flex: 1, padding: 10, borderRadius: 8, background: 'var(--accent)', color: 'white', fontWeight: 600 }}>Crear</button>
            </div>
          </div>
        </div>
      )}

      {/* Broadcast Modal */}
      {showBroadcast && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 28, width: 500, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontWeight: 700, fontSize: 16 }}>Nueva Campaña de Difusión</h2>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Se enviará a todos tus contactos. Usá {'{{nombre}}'} para personalizar.</p>
              </div>
              <button onClick={() => setShowBroadcast(false)} style={{ background: 'transparent', color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>
            {broadcastResult ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#10B981' }}>{broadcastResult.sent}</div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>mensajes enviados · {broadcastResult.failed} fallidos</div>
                <button onClick={() => { setShowBroadcast(false); setBroadcastResult(null); setBroadcast({ name: '', message: '' }); }}
                  style={{ marginTop: 20, padding: '10px 24px', borderRadius: 8, background: 'var(--accent)', color: 'white', fontWeight: 600 }}>Cerrar</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Nombre de la campaña</label>
                  <input value={broadcast.name} onChange={e => setBroadcast(p => ({ ...p, name: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Mensaje</label>
                  <textarea value={broadcast.message} onChange={e => setBroadcast(p => ({ ...p, message: e.target.value }))} rows={5}
                    placeholder={`Hola {{nombre}}! Te avisamos que...`} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }} />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowBroadcast(false)} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600 }}>Cancelar</button>
                  <button onClick={launchBroadcast} disabled={broadcastLoading}
                    style={{ flex: 1, padding: 10, borderRadius: 8, background: 'var(--accent)', color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: broadcastLoading ? 0.7 : 1 }}>
                    <Send size={14} /> {broadcastLoading ? 'Enviando...' : 'Enviar a todos'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

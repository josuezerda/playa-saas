'use client';

import { useState } from 'react';
import { MessageSquare, Bot, Save, CheckCircle2, Eye, EyeOff, Link2, Info, Copy } from 'lucide-react';
import styles from '../dashboard.module.css';

interface TenantIntegrations {
  id: number;
  name: string;
  whatsapp_phone_id: string;
  whatsapp_api_token: string;
  gemini_api_key: string;
  ai_system_prompt: string;
}

export default function IntegracionesClient({ tenant, tenantParam }: { tenant: TenantIntegrations; tenantParam?: string }) {
  const [waToken, setWaToken] = useState(tenant.whatsapp_api_token || '');
  const [waPhoneId, setWaPhoneId] = useState(tenant.whatsapp_phone_id || '');
  const [geminiKey, setGeminiKey] = useState(tenant.gemini_api_key || '');
  const [aiPrompt, setAiPrompt] = useState(tenant.ai_system_prompt || '');
  const [showWaToken, setShowWaToken] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/webhooks/whatsapp`
    : '/api/webhooks/whatsapp';

  const save = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/tenants/integrations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenant.id,
          whatsapp_api_token: waToken,
          whatsapp_phone_id: waPhoneId,
          gemini_api_key: geminiKey,
          ai_system_prompt: aiPrompt,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 8,
    border: '1px solid var(--border)', background: 'var(--bg-panel)',
    color: 'var(--text-primary)', fontSize: 13, fontFamily: 'monospace',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6,
  };

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div>
            <h1 className={styles.logoTitle}>Integraciones</h1>
            <div className={styles.logoSub}>Conexión con WhatsApp Business API e Inteligencia Artificial</div>
          </div>
        </div>
        <div className={styles.headerRight}>
          {saved && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10B981', fontSize: 13, fontWeight: 600 }}>
              <CheckCircle2 size={16} /> Guardado correctamente
            </div>
          )}
          {error && <div style={{ color: '#EF4444', fontSize: 13 }}>{error}</div>}
          <button onClick={save} disabled={loading}
            style={{ background: 'var(--accent)', color: 'white', padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Save size={15} />
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </header>

      <div className={styles.body} style={{ padding: 30, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* WhatsApp Section */}
        <div className={styles.glass} style={{ padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(37,211,102,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={20} color="#25D366" />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>WhatsApp Business API</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Conectá tu número de Meta para enviar y recibir mensajes.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Phone Number ID</label>
              <input value={waPhoneId} onChange={e => setWaPhoneId(e.target.value)} placeholder="Ej: 123456789012345" style={inputStyle} />
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Encontralo en el Panel de Meta for Developers.</p>
            </div>
            <div>
              <label style={labelStyle}>Permanent Access Token</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showWaToken ? 'text' : 'password'}
                  value={waToken} onChange={e => setWaToken(e.target.value)}
                  placeholder="EAA..."
                  style={{ ...inputStyle, paddingRight: 40 }}
                />
                <button type="button" onClick={() => setShowWaToken(p => !p)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'transparent', color: 'var(--text-muted)' }}>
                  {showWaToken ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {/* Webhook URL */}
          <div style={{ marginTop: 20, padding: 16, background: 'rgba(59,130,246,0.06)', borderRadius: 10, border: '1px solid rgba(59,130,246,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Link2 size={14} color="#3B82F6" />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#3B82F6' }}>URL DEL WEBHOOK</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <code style={{ flex: 1, fontSize: 12, color: 'var(--text-secondary)', wordBreak: 'break-all' }}>{webhookUrl}</code>
              <button type="button" onClick={() => navigator.clipboard.writeText(webhookUrl)}
                style={{ background: 'transparent', color: 'var(--text-muted)', flexShrink: 0 }}>
                <Copy size={15} />
              </button>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
              Pegá esta URL en tu App de Meta → WhatsApp → Configuración → Webhook. Token de verificación: <code style={{ color: 'var(--accent)' }}>surtos_webhook_secret</code>
            </p>
          </div>
        </div>

        {/* Gemini IA Section */}
        <div className={styles.glass} style={{ padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={20} color="#3B82F6" />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Inteligencia Artificial (Gemini)</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Configurá el asistente IA para responder mensajes de clientes automáticamente.</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Google Gemini API Key</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showGeminiKey ? 'text' : 'password'}
                  value={geminiKey} onChange={e => setGeminiKey(e.target.value)}
                  placeholder="AIza..."
                  style={{ ...inputStyle, paddingRight: 40 }}
                />
                <button type="button" onClick={() => setShowGeminiKey(p => !p)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'transparent', color: 'var(--text-muted)' }}>
                  {showGeminiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Obtené tu clave en <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>aistudio.google.com/apikey</a></p>
            </div>
            <div>
              <label style={labelStyle}>System Prompt del Asistente</label>
              <textarea
                value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                rows={5}
                placeholder={`Ej: Sos el asistente virtual de la Estación HT Refinor. Respondés consultas sobre precios de combustibles, horarios y servicios disponibles. Siempre respondé en español, de forma amigable y concisa.`}
                style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.6 }}
              />
              <div style={{ display: 'flex', alignItems: 'start', gap: 6, marginTop: 8, padding: '10px 12px', background: 'rgba(234,179,8,0.08)', borderRadius: 8, border: '1px solid rgba(234,179,8,0.2)' }}>
                <Info size={13} color="#EAB308" style={{ marginTop: 1, flexShrink: 0 }} />
                <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Este prompt define cómo responde el asistente. Podés incluir precios, servicios especiales, horarios y el tono de comunicación de tu estación.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

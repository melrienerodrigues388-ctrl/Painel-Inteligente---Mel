import { useState, useRef, useCallback } from "react";

// ─── VERSES ────────────────────────────────────────────────────────────────────
const VERSES = [
  { text: "Porque sou eu que conheço os planos que tenho para vocês, diz o Senhor, planos de fazê-los prosperar.", ref: "Jeremias 29:11" },
  { text: "Tudo posso naquele que me fortalece.", ref: "Filipenses 4:13" },
  { text: "O Senhor é o meu pastor e nada me faltará.", ref: "Salmos 23:1" },
  { text: "Entrega o teu caminho ao Senhor; confia nele, e ele tudo fará.", ref: "Salmos 37:5" },
  { text: "Seja forte e corajoso. Não se apavore, pois o Senhor seu Deus estará com você.", ref: "Josué 1:9" },
  { text: "Deleita-te no Senhor, e ele satisfará os desejos do teu coração.", ref: "Salmos 37:4" },
  { text: "O amor é paciente, o amor é bondoso.", ref: "1 Coríntios 13:4" },
  { text: "Porque Deus não nos deu espírito de covardia, mas de poder, de amor e de equilíbrio.", ref: "2 Timóteo 1:7" },
  { text: "Busca primeiro o Reino de Deus e a sua justiça, e todas estas coisas serão acrescentadas a você.", ref: "Mateus 6:33" },
  { text: "Com Deus tudo é possível.", ref: "Mateus 19:26" },
  { text: "O Senhor te abençoe e te guarde.", ref: "Números 6:24" },
  { text: "Alegrai-vos sempre no Senhor; outra vez digo, alegrai-vos.", ref: "Filipenses 4:4" },
  { text: "A fé é a certeza daquilo que esperamos e a prova das coisas que não vemos.", ref: "Hebreus 11:1" },
  { text: "Não te deixes vencer pelo mal, mas vence o mal com o bem.", ref: "Romanos 12:21" },
  { text: "O Senhor está perto de todos que o invocam.", ref: "Salmos 145:18" },
  { text: "Confia no Senhor de todo o teu coração e não te apoies no teu próprio entendimento.", ref: "Provérbios 3:5" },
  { text: "Ele cura os de coração partido e cuida das suas feridas.", ref: "Salmos 147:3" },
  { text: "Aquele que começou boa obra em você a completará.", ref: "Filipenses 1:6" },
  { text: "Sou o caminho, a verdade e a vida.", ref: "João 14:6" },
  { text: "Amarás o Senhor teu Deus de todo o teu coração.", ref: "Mateus 22:37" },
  { text: "Grandes coisas fez o Senhor por nós, e por isso estamos alegres.", ref: "Salmos 126:3" },
  { text: "Vinde a mim todos os que estão cansados e eu vos aliviarei.", ref: "Mateus 11:28" },
  { text: "O Senhor é a minha luz e a minha salvação; a quem temerei?", ref: "Salmos 27:1" },
  { text: "Deus é refúgio e fortaleza, auxílio sempre presente nas tribulações.", ref: "Salmos 46:1" },
  { text: "Não andem ansiosos por coisa alguma, mas em tudo, pela oração, apresentem seus pedidos a Deus.", ref: "Filipenses 4:6" },
  { text: "A graça do Senhor Jesus Cristo seja com o vosso espírito.", ref: "Filipenses 4:23" },
  { text: "Eu sou a videira, vós sois os ramos.", ref: "João 15:5" },
  { text: "Deus é amor, e quem permanece no amor permanece em Deus.", ref: "1 João 4:16" },
  { text: "Não temas, porque eu sou contigo.", ref: "Isaías 41:10" },
  { text: "Ele dá força ao cansado e vigor ao que não tem forças.", ref: "Isaías 40:29" },
  { text: "O Senhor te guardará de todo o mal; ele guardará a tua alma.", ref: "Salmos 121:7" },
];

const todayVerse = () => {
  const day = new Date().getDate();
  return VERSES[day % VERSES.length];
};

// ─── HELPERS ───────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();
const fmt = (iso) => iso ? new Date(iso).toLocaleDateString("pt-BR") : "—";
const diffDays = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

function priorityColor(p) {
  return { Baixa: "#22c55e", Média: "#eab308", Alta: "#f97316", Urgente: "#ef4444" }[p] || "#94a3b8";
}

// ─── AI ────────────────────────────────────────────────────────────────────────
async function callAI(prompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  return data.content?.map(b => b.text || "").join("") || "Sem análise disponível.";
}

// ─── INITIAL DATA ──────────────────────────────────────────────────────────────
const initialColumns = [
  { id: "urgente",   title: "🔥 Urgente",              color: "#ef4444" },
  { id: "hoje",      title: "📅 Fazer Hoje",            color: "#f97316" },
  { id: "andamento", title: "⚙️ Em Andamento",          color: "#3b82f6" },
  { id: "ideias_col",title: "💡 Ideias",                color: "#eab308" },
  { id: "criar",     title: "🎨 Convites para Criar",   color: "#ec4899" },
  { id: "melhorias", title: "📈 Melhorias do Negócio",  color: "#14b8a6" },
  { id: "concluido", title: "✅ Concluído",             color: "#22c55e" },
];

const defaultState = {
  columns: initialColumns,
  cards: [],
  quickNotes: [],
  ideas: [],
  // convitesDodia: [{ id, theme, qty, date }]
  convitesDodia: [],
  // orcamentos: [{ id, theme, count, createdAt }]
  orcamentos: [],
  // themes library: [{ id, name, models, clientRequests, observations, createdAt }]
  themes: [],
  darkMode: false,
  activeTab: "dashboard",
};

// ─── APP ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [state, setState] = useState(defaultState);
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [colDrag, setColDrag] = useState(null);
  const [colDragOver, setColDragOver] = useState(null);
  const [modal, setModal] = useState(null);
  const [aiResult, setAiResult] = useState({});
  const [loadingAI, setLoadingAI] = useState({});

  const update = useCallback((patch) => setState(s =>
    typeof patch === "function" ? patch(s) : { ...s, ...patch }
  ), []);

  const dark = state.darkMode;
  const tab = state.activeTab;

  const T = dark ? {
    bg: "#0f0f13", card: "#1a1a24", border: "#2a2a3a", text: "#f0f0ff",
    muted: "#888aaa", accent: "#c084fc", accent2: "#f472b6", surface: "#22222f",
  } : {
    bg: "#faf5ff", card: "#ffffff", border: "#e9d5ff", text: "#1e1b4b",
    muted: "#6b7280", accent: "#9333ea", accent2: "#db2777", surface: "#f3e8ff",
  };

  // ─── KANBAN ────────────────────────────────────────────────────────────────
  function saveCard(cardData) {
    update(s => ({
      ...s,
      cards: cardData.id
        ? s.cards.map(c => c.id === cardData.id ? { ...c, ...cardData } : c)
        : [...s.cards, { ...cardData, id: uid(), createdAt: now(), completedAt: null }]
    }));
    setModal(null);
  }
  function completeCard(id) {
    update(s => ({ ...s, cards: s.cards.map(c => c.id === id ? { ...c, columnId: "concluido", completedAt: now() } : c) }));
  }
  function deleteCard(id) { update(s => ({ ...s, cards: s.cards.filter(c => c.id !== id) })); }

  function onCardDragStart(e, cardId) { setDragging({ type: "card", id: cardId }); e.dataTransfer.effectAllowed = "move"; }
  function onColDrop(e, colId) {
    e.preventDefault();
    if (dragging?.type === "card") update(s => ({ ...s, cards: s.cards.map(c => c.id === dragging.id ? { ...c, columnId: colId } : c) }));
    setDragging(null); setDragOver(null);
  }
  function onColDragStart(e, colId) { setColDrag(colId); e.dataTransfer.effectAllowed = "move"; }
  function onColDrop2(e, colId) {
    e.preventDefault();
    if (!colDrag || colDrag === colId) { setColDrag(null); setColDragOver(null); return; }
    update(s => {
      const cols = [...s.columns];
      const from = cols.findIndex(c => c.id === colDrag);
      const to = cols.findIndex(c => c.id === colId);
      const [moved] = cols.splice(from, 1);
      cols.splice(to, 0, moved);
      return { ...s, columns: cols };
    });
    setColDrag(null); setColDragOver(null);
  }

  // ─── QUICK NOTES ──────────────────────────────────────────────────────────
  function addQuickNote(text) {
    if (!text.trim()) return;
    update(s => ({ ...s, quickNotes: [{ id: uid(), text, createdAt: now() }, ...s.quickNotes] }));
  }
  function noteToCard(note) {
    setModal({ type: "card", data: { columnId: "hoje", title: note.text, description: "", priority: "Média", tags: "", id: null } });
    update(s => ({ ...s, quickNotes: s.quickNotes.filter(n => n.id !== note.id) }));
  }

  // ─── IDEAS ────────────────────────────────────────────────────────────────
  function saveIdea(idea) {
    update(s => ({
      ...s,
      ideas: idea.id
        ? s.ideas.map(i => i.id === idea.id ? { ...i, ...idea } : i)
        : [...(s.ideas || []), { ...idea, id: uid(), createdAt: now() }]
    }));
    setModal(null);
  }
  async function analyzeIdea(idea) {
    setLoadingAI(l => ({ ...l, [idea.id]: true }));
    const prompt = `Você é uma consultora especialista em negócios de convites digitais. Analise esta ideia:
Título: ${idea.title}
Descrição: ${idea.description}
Categoria: ${idea.category}
Retorne APENAS JSON válido sem markdown:
{"potencial_venda":0,"facilidade":0,"risco":"Baixo","tempo_estimado":"1-2 dias","retorno":"Médio","nota":0,"analise":"texto"}`;
    try {
      const raw = await callAI(prompt);
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      setAiResult(r => ({ ...r, [idea.id]: parsed }));
    } catch {
      setAiResult(r => ({ ...r, [idea.id]: { analise: "Não foi possível analisar." } }));
    }
    setLoadingAI(l => ({ ...l, [idea.id]: false }));
  }

  // ─── CONVITES DO DIA ──────────────────────────────────────────────────────
  function addConviteDia(theme, qty) {
    if (!theme.trim() || !qty) return;
    update(s => {
      // se já tem registro do mesmo tema hoje, soma
      const today = new Date().toDateString();
      const existing = s.convitesDodia.find(p => p.theme.toLowerCase() === theme.toLowerCase() && new Date(p.date).toDateString() === today);
      if (existing) return { ...s, convitesDodia: s.convitesDodia.map(p => p.id === existing.id ? { ...p, qty: Number(p.qty) + Number(qty) } : p) };
      return { ...s, convitesDodia: [...s.convitesDodia, { id: uid(), theme, qty: Number(qty), date: now() }] };
    });
  }

  // ─── ORÇAMENTOS ──────────────────────────────────────────────────────────
  function addOrcamento(theme) {
    if (!theme.trim()) return;
    update(s => {
      const existing = s.orcamentos.find(o => o.theme.toLowerCase() === theme.toLowerCase());
      if (existing) return { ...s, orcamentos: s.orcamentos.map(o => o.id === existing.id ? { ...o, count: o.count + 1 } : o) };
      return { ...s, orcamentos: [...s.orcamentos, { id: uid(), theme, count: 1, createdAt: now() }] };
    });
  }

  // ─── THEMES ──────────────────────────────────────────────────────────────
  function saveTheme(theme) {
    update(s => ({
      ...s,
      themes: theme.id
        ? s.themes.map(t => t.id === theme.id ? { ...t, ...theme } : t)
        : [...s.themes, { ...theme, id: uid(), createdAt: now() }]
    }));
    setModal(null);
  }

  // ─── STATS ────────────────────────────────────────────────────────────────
  const openCards = state.cards.filter(c => c.columnId !== "concluido");
  const doneCards = state.cards.filter(c => c.columnId === "concluido");
  const weekProd = state.convitesDodia.filter(p => diffDays(p.date, now()) <= 7).reduce((a, p) => a + Number(p.qty), 0);
  const monthProd = state.convitesDodia.filter(p => diffDays(p.date, now()) <= 30).reduce((a, p) => a + Number(p.qty), 0);
  const prodByTheme = {};
  state.convitesDodia.forEach(p => { prodByTheme[p.theme] = (prodByTheme[p.theme] || 0) + Number(p.qty); });
  const topProduced = Object.entries(prodByTheme).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topOrcamentos = [...state.orcamentos].sort((a, b) => b.count - a.count).slice(0, 5);

  async function runDashboardAI() {
    setLoadingAI(l => ({ ...l, dashboard: true }));
    const prompt = `Você é consultora de negócios de convites digitais. Dados:
- Tarefas abertas: ${openCards.length}, concluídas: ${doneCards.length}
- Produção semana: ${weekProd}, mês: ${monthProd}
- Temas mais produzidos: ${topProduced.map(([t,n]) => `${t}(${n})`).join(", ")}
- Orçamentos por tema: ${state.orcamentos.map(o => `${o.theme}(${o.count}x)`).join(", ")}
- Biblioteca: ${state.themes.map(t => `${t.name}(${t.models} modelos, ${t.clientRequests||0} pedidos)`).join(", ")}
Gere 3 recomendações práticas numeradas de 1 a 3, curtas e diretas em português.`;
    try {
      setAiResult(r => ({ ...r, dashboard: await callAI(prompt) }));
    } catch {
      setAiResult(r => ({ ...r, dashboard: "Não foi possível gerar análise." }));
    }
    setLoadingAI(l => ({ ...l, dashboard: false }));
  }

  const verse = todayVerse();
  const tabs = [
    { id: "dashboard", label: "🏠 Início" },
    { id: "kanban",    label: "📋 Tarefas" },
    { id: "capture",   label: "⚡ Captura" },
    { id: "ideas",     label: "💡 Ideias" },
    { id: "convites",  label: "🎨 Convites do Dia" },
    { id: "orcamentos",label: "💬 Orçamentos" },
    { id: "library",   label: "📚 Biblioteca" },
    { id: "ai",        label: "🤖 Consultora" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "'Nunito','Segoe UI',sans-serif", transition: "all 0.3s" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Playfair+Display:wght@700;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-thumb{background:${T.accent}44;border-radius:3px;}
        .btn{cursor:pointer;border:none;border-radius:10px;padding:8px 16px;font-family:inherit;font-weight:700;font-size:13px;transition:all 0.2s;}
        .btn-primary{background:linear-gradient(135deg,${T.accent},${T.accent2});color:#fff;}
        .btn-primary:hover{transform:translateY(-1px);box-shadow:0 4px 15px ${T.accent}55;}
        .btn-primary:disabled{opacity:0.5;transform:none;}
        .btn-sm{padding:5px 11px;font-size:12px;border-radius:8px;}
        .btn-ghost{background:transparent;color:${T.muted};border:1px solid ${T.border};}
        .btn-ghost:hover{background:${T.surface};color:${T.text};}
        .ch:hover{transform:translateY(-2px);box-shadow:0 8px 25px ${T.accent}22;transition:all 0.2s;}
        input,textarea,select{background:${T.surface};border:1.5px solid ${T.border};border-radius:10px;color:${T.text};padding:10px 14px;font-family:inherit;font-size:14px;width:100%;outline:none;transition:border-color 0.2s;}
        input:focus,textarea:focus,select:focus{border-color:${T.accent};}
        textarea{resize:vertical;min-height:70px;}
        label{font-size:12px;font-weight:700;color:${T.muted};display:block;margin-bottom:5px;text-transform:uppercase;letter-spacing:0.5px;}
        .col-drop{border:2px dashed ${T.accent}!important;background:${T.accent}11;}
        .fade{animation:fi 0.3s ease;}
        @keyframes fi{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        @media(max-width:768px){.tabs-row{overflow-x:auto;white-space:nowrap;}.kanban-row{overflow-x:auto;}}
      `}</style>

      {/* HEADER */}
      <div style={{ background: dark?"#13131d":"#fff", borderBottom:`1px solid ${T.border}`, padding:"10px 18px", display:"flex", alignItems:"center", gap:10, position:"sticky", top:0, zIndex:100, boxShadow:`0 2px 20px ${T.accent}12` }}>
        <span style={{ fontSize:26 }}>🎀</span>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:17, background:`linear-gradient(135deg,${T.accent},${T.accent2})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Convites Studio</div>
          <div style={{ fontSize:10, color:T.muted }}>Gestão Inteligente</div>
        </div>
        <div style={{ flex:1 }} />
        {/* VERSÍCULO DO DIA */}
        <div style={{ display:"flex", alignItems:"center", gap:8, background:T.surface, borderRadius:12, padding:"6px 14px", maxWidth:380, border:`1px solid ${T.border}` }}>
          <span style={{ fontSize:16 }}>✝️</span>
          <div style={{ fontSize:11, lineHeight:1.4 }}>
            <span style={{ color:T.text, fontStyle:"italic" }}>"{verse.text}"</span>
            <span style={{ color:T.accent, fontWeight:700, marginLeft:4 }}>{verse.ref}</span>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => update(s => ({ ...s, darkMode: !s.darkMode }))}>{dark?"☀️":"🌙"}</button>
      </div>

      {/* TABS */}
      <div className="tabs-row" style={{ background:dark?"#13131d":"#fff", borderBottom:`1px solid ${T.border}`, padding:"0 14px", display:"flex", gap:2 }}>
        {tabs.map(t => (
          <button key={t.id} className="btn btn-sm" onClick={() => update(s => ({ ...s, activeTab: t.id }))}
            style={{ borderRadius:0, borderBottom: tab===t.id?`3px solid ${T.accent2}`:"3px solid transparent", margin:"5px 0", background: tab===t.id?`linear-gradient(135deg,${T.accent},${T.accent2})`:"transparent", color: tab===t.id?"#fff":T.muted }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{ padding:"18px", maxWidth: tab==="kanban"?"100%":1200, margin:"0 auto" }} className="fade">

        {/* ── DASHBOARD ──────────────────────────────────────────────────────── */}
        {tab==="dashboard" && (
          <div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, marginBottom:18 }}>Painel Principal ✨</h2>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:12, marginBottom:20 }}>
              {[
                { label:"Tarefas Abertas",   value:openCards.length,       emoji:"📋", color:"#3b82f6" },
                { label:"Concluídas",         value:doneCards.length,       emoji:"✅", color:"#22c55e" },
                { label:"Ideias",             value:(state.ideas||[]).length,emoji:"💡", color:"#eab308" },
                { label:"Orçamentos",         value:state.orcamentos.length, emoji:"💬", color:"#ec4899" },
                { label:"Produção Semana",    value:weekProd,               emoji:"⚡", color:"#f97316" },
                { label:"Produção Mês",       value:monthProd,              emoji:"📈", color:"#a855f7" },
                { label:"Temas Biblioteca",   value:state.themes.length,    emoji:"🎨", color:"#14b8a6" },
              ].map(s => (
                <div key={s.label} className="ch" style={{ background:T.card, borderRadius:14, padding:14, border:`1px solid ${T.border}`, borderLeft:`4px solid ${s.color}` }}>
                  <div style={{ fontSize:24, marginBottom:4 }}>{s.emoji}</div>
                  <div style={{ fontSize:26, fontWeight:900, color:s.color }}>{s.value}</div>
                  <div style={{ fontSize:11, color:T.muted, fontWeight:600 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:18 }}>
              <div style={{ background:T.card, borderRadius:14, padding:18, border:`1px solid ${T.border}` }}>
                <h3 style={{ fontWeight:800, marginBottom:12, color:T.accent }}>🏆 Mais Produzidos</h3>
                {topProduced.length===0 ? <p style={{ color:T.muted, fontSize:13 }}>Sem dados ainda</p> : topProduced.map(([theme,qty],i) => (
                  <div key={theme} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                    <span style={{ fontWeight:900, color:T.accent, width:22 }}>{i+1}º</span>
                    <span style={{ flex:1, fontWeight:600 }}>{theme}</span>
                    <span style={{ background:T.surface, padding:"2px 10px", borderRadius:20, fontSize:12, fontWeight:700 }}>{qty}</span>
                  </div>
                ))}
              </div>
              <div style={{ background:T.card, borderRadius:14, padding:18, border:`1px solid ${T.border}` }}>
                <h3 style={{ fontWeight:800, marginBottom:12, color:T.accent2 }}>💬 Mais Orçamentos</h3>
                {topOrcamentos.length===0 ? <p style={{ color:T.muted, fontSize:13 }}>Sem dados ainda</p> : topOrcamentos.map((o,i) => (
                  <div key={o.id} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                    <span style={{ fontWeight:900, color:T.accent2, width:22 }}>{i+1}º</span>
                    <span style={{ flex:1, fontWeight:600 }}>{o.theme}</span>
                    <span style={{ background:"#ec489922", color:"#ec4899", padding:"2px 10px", borderRadius:20, fontSize:12, fontWeight:700 }}>{o.count}x</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background:T.card, borderRadius:14, padding:18, border:`1px solid ${T.border}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                <h3 style={{ fontWeight:800, flex:1 }}>🤖 Recomendações da IA</h3>
                <button className="btn btn-primary btn-sm" onClick={runDashboardAI} disabled={loadingAI.dashboard}>{loadingAI.dashboard?"Analisando...":"Analisar Agora"}</button>
              </div>
              {aiResult.dashboard
                ? <div style={{ whiteSpace:"pre-wrap", fontSize:14, lineHeight:1.8 }}>{aiResult.dashboard}</div>
                : <p style={{ color:T.muted, fontSize:13 }}>Clique em "Analisar Agora" para receber recomendações personalizadas.</p>}
            </div>
          </div>
        )}

        {/* ── KANBAN ─────────────────────────────────────────────────────────── */}
        {tab==="kanban" && (
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:26 }}>Quadro de Tarefas 📋</h2>
              <button className="btn btn-primary btn-sm" onClick={() => {
                const title = prompt("Nome da nova coluna:");
                if (title) update(s => ({ ...s, columns: [...s.columns, { id: uid(), title, color: "#6366f1" }] }));
              }}>+ Coluna</button>
            </div>
            <div className="kanban-row" style={{ display:"flex", gap:12, overflowX:"auto", alignItems:"flex-start", paddingBottom:12 }}>
              {state.columns.map(col => {
                const colCards = state.cards.filter(c => c.columnId === col.id);
                const isOver = dragOver===col.id || colDragOver===col.id;
                return (
                  <div key={col.id} draggable
                    onDragStart={e => onColDragStart(e, col.id)}
                    onDragOver={e => { e.preventDefault(); setColDragOver(col.id); setDragOver(col.id); }}
                    onDrop={e => { onColDrop(e, col.id); onColDrop2(e, col.id); }}
                    onDragLeave={() => { setColDragOver(null); setDragOver(null); }}
                    className={isOver?"col-drop":""}
                    style={{ minWidth:265, maxWidth:265, background:T.card, borderRadius:14, border:`1px solid ${T.border}`, overflow:"hidden", flexShrink:0 }}>
                    <div style={{ padding:"11px 13px", borderBottom:`3px solid ${col.color}`, display:"flex", alignItems:"center", gap:7 }}>
                      <div style={{ flex:1, fontWeight:800, fontSize:13 }}>{col.title}</div>
                      <span style={{ background:col.color+"33", color:col.color, borderRadius:20, padding:"1px 8px", fontSize:12, fontWeight:700 }}>{colCards.length}</span>
                      <button className="btn btn-ghost btn-sm" style={{ padding:"2px 6px" }} onClick={() => { const t=prompt("Novo nome:",col.title); if(t) update(s=>({...s,columns:s.columns.map(c=>c.id===col.id?{...c,title:t}:c)})); }}>✏️</button>
                      <button className="btn btn-ghost btn-sm" style={{ padding:"2px 6px", color:"#ef4444" }} onClick={() => { if(window.confirm("Excluir coluna?")) update(s=>({...s,columns:s.columns.filter(c=>c.id!==col.id)})); }}>🗑️</button>
                    </div>
                    <div style={{ padding:9, display:"flex", flexDirection:"column", gap:7, minHeight:80 }}>
                      {colCards.map(card => (
                        <div key={card.id} draggable onDragStart={e => onCardDragStart(e, card.id)}
                          style={{ background:T.surface, borderRadius:10, padding:11, border:`1px solid ${T.border}`, borderLeft:`4px solid ${priorityColor(card.priority)}`, cursor:"grab", transition:"all 0.15s" }}>
                          <div style={{ fontWeight:700, fontSize:13, marginBottom:3 }}>{card.title}</div>
                          {card.description && <div style={{ fontSize:12, color:T.muted, marginBottom:6 }}>{card.description}</div>}
                          <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:6 }}>
                            {card.priority && <span style={{ background:priorityColor(card.priority)+"22", color:priorityColor(card.priority), borderRadius:7, padding:"1px 7px", fontSize:11, fontWeight:700 }}>{card.priority}</span>}
                            {card.tags && card.tags.split(",").map(t=>t.trim()).filter(Boolean).map(t => <span key={t} style={{ background:T.border, borderRadius:7, padding:"1px 7px", fontSize:11 }}>{t}</span>)}
                          </div>
                          <div style={{ fontSize:11, color:T.muted, marginBottom:7 }}>📅 {fmt(card.createdAt)}</div>
                          <div style={{ display:"flex", gap:5 }}>
                            {col.id!=="concluido" && <button className="btn btn-primary btn-sm" style={{ flex:1 }} onClick={() => completeCard(card.id)}>✅ Concluir</button>}
                            <button className="btn btn-ghost btn-sm" onClick={() => setModal({ type:"card", data:card })}>✏️</button>
                            <button className="btn btn-ghost btn-sm" style={{ color:"#ef4444" }} onClick={() => deleteCard(card.id)}>🗑️</button>
                          </div>
                          {col.id==="concluido" && card.completedAt && (
                            <div style={{ fontSize:11, color:"#22c55e", marginTop:5 }}>✅ {fmt(card.completedAt)} · {diffDays(card.createdAt,card.completedAt)} dias</div>
                          )}
                        </div>
                      ))}
                      <button className="btn btn-ghost btn-sm" style={{ width:"100%", borderStyle:"dashed" }} onClick={() => setModal({ type:"card", data:{ columnId:col.id, id:null } })}>+ Cartão</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── CAPTURA RÁPIDA ─────────────────────────────────────────────────── */}
        {tab==="capture" && (
          <div style={{ maxWidth:680 }}>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, marginBottom:18 }}>⚡ Captura Rápida</h2>
            <QuickInput placeholder="💭 Digite qualquer ideia ou tarefa e pressione Enter..." btnLabel="Capturar ⚡" onAdd={addQuickNote} T={T} />
            <div style={{ display:"flex", flexDirection:"column", gap:9, marginTop:14 }}>
              {state.quickNotes.length===0 && <p style={{ color:T.muted }}>Nenhuma anotação ainda.</p>}
              {state.quickNotes.map(n => (
                <div key={n.id} style={{ background:T.card, borderRadius:11, padding:"12px 15px", border:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10, borderLeft:`4px solid ${T.accent}` }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600 }}>{n.text}</div>
                    <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>📅 {fmt(n.createdAt)}</div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => noteToCard(n)}>→ Tarefa</button>
                  <button className="btn btn-ghost btn-sm" style={{ color:"#ef4444" }} onClick={() => update(s => ({ ...s, quickNotes:s.quickNotes.filter(x=>x.id!==n.id) }))}>🗑️</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── IDEIAS ─────────────────────────────────────────────────────────── */}
        {tab==="ideas" && (
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:26 }}>💡 Banco de Ideias</h2>
              <button className="btn btn-primary" onClick={() => setModal({ type:"idea", data:{} })}>+ Nova Ideia</button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:14 }}>
              {(state.ideas||[]).length===0 && <p style={{ color:T.muted }}>Nenhuma ideia ainda.</p>}
              {(state.ideas||[]).map(idea => {
                const ai = aiResult[idea.id];
                return (
                  <div key={idea.id} className="ch" style={{ background:T.card, borderRadius:14, padding:16, border:`1px solid ${T.border}` }}>
                    <div style={{ display:"flex", gap:7, marginBottom:5 }}>
                      <div style={{ flex:1, fontWeight:800, fontSize:14 }}>{idea.title}</div>
                      <button className="btn btn-ghost btn-sm" onClick={() => setModal({ type:"idea", data:idea })}>✏️</button>
                      <button className="btn btn-ghost btn-sm" style={{ color:"#ef4444" }} onClick={() => update(s=>({...s,ideas:s.ideas.filter(i=>i.id!==idea.id)}))}>🗑️</button>
                    </div>
                    <div style={{ fontSize:12, color:T.muted, marginBottom:5 }}>🏷️ {idea.category} · 📅 {fmt(idea.createdAt)}</div>
                    <div style={{ fontSize:13, marginBottom:10 }}>{idea.description}</div>
                    {ai ? (
                      <div style={{ background:T.surface, borderRadius:9, padding:11, fontSize:12 }}>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:7, marginBottom:7 }}>
                          <MiniStat label="Venda" value={`${ai.potencial_venda}/10`} />
                          <MiniStat label="Facilidade" value={`${ai.facilidade}/10`} />
                          <MiniStat label="Nota" value={`${ai.nota}/10`} />
                        </div>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:7, marginBottom:9 }}>
                          <MiniStat label="Risco" value={ai.risco} />
                          <MiniStat label="Retorno" value={ai.retorno} />
                          <MiniStat label="Tempo" value={ai.tempo_estimado} />
                        </div>
                        <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:7, color:T.muted, lineHeight:1.5 }}>🤖 {ai.analise}</div>
                      </div>
                    ) : (
                      <button className="btn btn-primary btn-sm" style={{ width:"100%" }} onClick={() => analyzeIdea(idea)} disabled={loadingAI[idea.id]}>
                        {loadingAI[idea.id]?"Analisando...":"🤖 Analisar com IA"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── CONVITES DO DIA ────────────────────────────────────────────────── */}
        {tab==="convites" && (
          <div style={{ maxWidth:800 }}>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, marginBottom:6 }}>🎨 Convites do Dia</h2>
            <p style={{ color:T.muted, fontSize:13, marginBottom:18 }}>Registre os convites que você produziu hoje. Se fizer o mesmo tema duas vezes, registre novamente — o sistema soma automaticamente.</p>

            <ConvitesDiaInput themes={state.themes} onAdd={addConviteDia} T={T} />

            {/* Hoje */}
            <div style={{ background:T.card, borderRadius:14, padding:16, border:`1px solid ${T.border}`, marginTop:20, marginBottom:16 }}>
              <h3 style={{ fontWeight:800, marginBottom:12 }}>📅 Produzidos Hoje</h3>
              {(() => {
                const today = new Date().toDateString();
                const todayItems = state.convitesDodia.filter(p => new Date(p.date).toDateString()===today);
                if (todayItems.length===0) return <p style={{ color:T.muted, fontSize:13 }}>Nenhum registro hoje ainda.</p>;
                return todayItems.map(p => (
                  <div key={p.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 0", borderBottom:`1px solid ${T.border}` }}>
                    <span style={{ flex:1, fontWeight:600 }}>🎨 {p.theme}</span>
                    <span style={{ fontWeight:900, fontSize:18, color:T.accent }}>{p.qty}</span>
                    <span style={{ fontSize:12, color:T.muted }}>convites</span>
                    <button className="btn btn-ghost btn-sm" style={{ color:"#ef4444" }} onClick={() => update(s=>({...s,convitesDodia:s.convitesDodia.filter(x=>x.id!==p.id)}))}>🗑️</button>
                  </div>
                ));
              })()}
            </div>

            {/* Resumo semana/mês */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
              <div style={{ background:T.card, borderRadius:14, padding:16, border:`1px solid ${T.border}`, textAlign:"center" }}>
                <div style={{ fontSize:36, fontWeight:900, color:T.accent }}>{weekProd}</div>
                <div style={{ color:T.muted, fontSize:13 }}>⚡ Esta semana</div>
              </div>
              <div style={{ background:T.card, borderRadius:14, padding:16, border:`1px solid ${T.border}`, textAlign:"center" }}>
                <div style={{ fontSize:36, fontWeight:900, color:T.accent2 }}>{monthProd}</div>
                <div style={{ color:T.muted, fontSize:13 }}>📈 Este mês</div>
              </div>
            </div>

            {/* Histórico */}
            <div style={{ background:T.card, borderRadius:14, padding:16, border:`1px solid ${T.border}` }}>
              <h3 style={{ fontWeight:800, marginBottom:12 }}>📋 Histórico Completo</h3>
              {[...state.convitesDodia].reverse().map(p => (
                <div key={p.id} style={{ display:"flex", gap:10, padding:"8px 0", borderBottom:`1px solid ${T.border}`, fontSize:13 }}>
                  <span style={{ fontWeight:700, flex:1 }}>🎨 {p.theme}</span>
                  <span style={{ fontWeight:800, color:T.accent }}>{p.qty} convites</span>
                  <span style={{ color:T.muted }}>📅 {fmt(p.date)}</span>
                </div>
              ))}
              {state.convitesDodia.length===0 && <p style={{ color:T.muted, fontSize:13 }}>Nenhum registro ainda.</p>}
            </div>
          </div>
        )}

        {/* ── ORÇAMENTOS ─────────────────────────────────────────────────────── */}
        {tab==="orcamentos" && (
          <div style={{ maxWidth:800 }}>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, marginBottom:6 }}>💬 Orçamentos</h2>
            <p style={{ color:T.muted, fontSize:13, marginBottom:18 }}>Registre os temas que os clientes vieram pedir orçamento. Sem valores — só o tema. Cada registro soma a contagem daquele tema.</p>

            <QuickInput placeholder="💬 Tema do orçamento... (ex: Safari, Tiana, Roblox)" btnLabel="+ Registrar" onAdd={addOrcamento} T={T} />

            <div style={{ display:"flex", flexDirection:"column", gap:9, marginTop:18 }}>
              {[...state.orcamentos].sort((a,b)=>b.count-a.count).map(o => {
                const inLibrary = state.themes.find(t => t.name.toLowerCase()===o.theme.toLowerCase());
                const models = inLibrary ? Number(inLibrary.models) : 0;
                let insight = null, insightColor = "#22c55e";
                if (!inLibrary) { insight = "Você ainda não tem este tema na biblioteca!"; insightColor = "#ef4444"; }
                else if (o.count >= 5 && models < 10) { insight = `Muita procura! Apenas ${models} modelos. Crie mais para atender bem.`; insightColor = "#ef4444"; }
                else if (o.count >= 3 && models < 15) { insight = `Boa procura. Considere ampliar sua biblioteca deste tema.`; insightColor = "#f97316"; }
                else if (models >= 15) { insight = `Ótimo! Você está bem abastecida para atender esta demanda.`; insightColor = "#22c55e"; }

                return (
                  <div key={o.id} style={{ background:T.card, borderRadius:12, padding:"13px 16px", border:`1px solid ${T.border}`, borderLeft:`4px solid ${o.count>=5?"#ef4444":o.count>=3?"#f97316":"#22c55e"}` }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom: insight?8:0 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:800, fontSize:15 }}>{o.theme}</div>
                        {inLibrary && <div style={{ fontSize:12, color:T.muted, marginTop:2 }}>📚 {models} modelos na biblioteca</div>}
                      </div>
                      <button className="btn btn-ghost btn-sm" onClick={() => addOrcamento(o.theme)}>+1</button>
                      <span style={{ background:o.count>=5?"#ef444422":T.surface, color:o.count>=5?"#ef4444":T.text, padding:"3px 13px", borderRadius:20, fontWeight:900, fontSize:17 }}>{o.count}x</span>
                      <button className="btn btn-ghost btn-sm" style={{ color:"#ef4444" }} onClick={() => update(s=>({...s,orcamentos:s.orcamentos.filter(x=>x.id!==o.id)}))}>🗑️</button>
                    </div>
                    {insight && <div style={{ fontSize:12, color:insightColor, background:insightColor+"15", padding:"7px 10px", borderRadius:8, borderLeft:`3px solid ${insightColor}` }}>🤖 {insight}</div>}
                  </div>
                );
              })}
              {state.orcamentos.length===0 && <p style={{ color:T.muted }}>Nenhum orçamento registrado ainda.</p>}
            </div>
          </div>
        )}

        {/* ── BIBLIOTECA ─────────────────────────────────────────────────────── */}
        {tab==="library" && (
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:26 }}>📚 Biblioteca de Temas</h2>
              <button className="btn btn-primary" onClick={() => setModal({ type:"theme", data:{} })}>+ Novo Tema</button>
            </div>
            <p style={{ color:T.muted, fontSize:13, marginBottom:16 }}>Cadastre todos os temas que você tem. Informe quantos modelos possui. A IA cruza com os orçamentos e avisa quando você precisa criar mais.</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))", gap:14 }}>
              {state.themes.map(t => {
                const models = Number(t.models||0);
                const orcTema = state.orcamentos.find(o => o.theme.toLowerCase()===t.name.toLowerCase());
                const orcCount = orcTema ? orcTema.count : 0;
                const prodTotal = state.convitesDodia.filter(p => p.theme.toLowerCase()===t.name.toLowerCase()).reduce((a,p)=>a+Number(p.qty),0);

                let insight = null, insightColor = "#22c55e";
                if (models===0 && orcCount>0) {
                  insight = `Você tem ${orcCount} orçamento(s) mas nenhum modelo ainda. Crie agora!`;
                  insightColor = "#ef4444";
                } else if (orcCount>0 && models>0) {
                  const ratio = orcCount/models;
                  if (ratio>=1) {
                    insight = `🔥 Alta procura! ${orcCount} orçamentos e só ${models} modelos. Crie mais ${Math.ceil(orcCount*2)-models} modelos — o cliente não deve precisar ir buscar fora!`;
                    insightColor = "#ef4444";
                  } else if (ratio>=0.4) {
                    insight = `📈 Demanda crescente. ${orcCount} orçamentos para ${models} modelos. Criar mais garante que o cliente fique com você.`;
                    insightColor = "#f97316";
                  } else {
                    insight = `✅ Bem abastecida. ${models} modelos para ${orcCount} orçamentos. Continue assim!`;
                    insightColor = "#22c55e";
                  }
                } else if (models>=30) {
                  insight = `📦 Estoque grande (${models} modelos). Não é prioridade criar mais agora.`;
                  insightColor = "#3b82f6";
                }

                return (
                  <div key={t.id} className="ch" style={{ background:T.card, borderRadius:14, padding:16, border:`1px solid ${T.border}` }}>
                    <div style={{ display:"flex", gap:7, marginBottom:10 }}>
                      <div style={{ flex:1, fontWeight:800, fontSize:15 }}>🎨 {t.name}</div>
                      <button className="btn btn-ghost btn-sm" onClick={() => setModal({ type:"theme", data:t })}>✏️</button>
                      <button className="btn btn-ghost btn-sm" style={{ color:"#ef4444" }} onClick={() => update(s=>({...s,themes:s.themes.filter(x=>x.id!==t.id)}))}>🗑️</button>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:7, marginBottom:10 }}>
                      <div style={{ background:T.surface, borderRadius:9, padding:"9px 5px", textAlign:"center" }}>
                        <div style={{ fontSize:22, fontWeight:900, color:T.accent }}>{models}</div>
                        <div style={{ fontSize:10, color:T.muted, fontWeight:700 }}>MODELOS</div>
                      </div>
                      <div style={{ background:T.surface, borderRadius:9, padding:"9px 5px", textAlign:"center" }}>
                        <div style={{ fontSize:22, fontWeight:900, color:"#ec4899" }}>{orcCount}</div>
                        <div style={{ fontSize:10, color:T.muted, fontWeight:700 }}>ORÇAMENTOS</div>
                      </div>
                      <div style={{ background:T.surface, borderRadius:9, padding:"9px 5px", textAlign:"center" }}>
                        <div style={{ fontSize:22, fontWeight:900, color:"#f97316" }}>{prodTotal}</div>
                        <div style={{ fontSize:10, color:T.muted, fontWeight:700 }}>PRODUZIDOS</div>
                      </div>
                    </div>
                    {insight && (
                      <div style={{ fontSize:12, color:insightColor, background:insightColor+"18", padding:"9px 11px", borderRadius:9, borderLeft:`3px solid ${insightColor}`, lineHeight:1.6, marginBottom:8 }}>
                        🤖 {insight}
                      </div>
                    )}
                    {t.observations && <div style={{ fontSize:12, color:T.muted }}>{t.observations}</div>}
                  </div>
                );
              })}
              {state.themes.length===0 && <p style={{ color:T.muted }}>Nenhum tema cadastrado ainda.</p>}
            </div>
          </div>
        )}

        {/* ── CONSULTORA IA ──────────────────────────────────────────────────── */}
        {tab==="ai" && <AIConsultant state={state} T={T} loadingAI={loadingAI} setLoadingAI={setLoadingAI} />}

      </div>

      {/* MODAIS */}
      {modal && (
        <div style={{ position:"fixed", inset:0, background:"#0008", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
          onClick={e => e.target===e.currentTarget && setModal(null)}>
          <div style={{ background:T.card, borderRadius:18, padding:26, width:"100%", maxWidth:480, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 20px 60px #0007", border:`1px solid ${T.border}` }} className="fade">
            {modal.type==="card"  && <CardForm  initial={modal.data} columns={state.columns} onSave={saveCard}  onClose={() => setModal(null)} T={T} />}
            {modal.type==="idea"  && <IdeaForm  initial={modal.data}                        onSave={saveIdea}  onClose={() => setModal(null)} T={T} />}
            {modal.type==="theme" && <ThemeForm initial={modal.data}                        onSave={saveTheme} onClose={() => setModal(null)} T={T} />}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SUB COMPONENTS ───────────────────────────────────────────────────────────

function MiniStat({ label, value }) {
  return (
    <div style={{ textAlign:"center" }}>
      <div style={{ fontSize:14, fontWeight:800 }}>{value}</div>
      <div style={{ fontSize:10, opacity:0.55 }}>{label}</div>
    </div>
  );
}

function QuickInput({ placeholder, btnLabel, onAdd, T }) {
  const [text, setText] = useState("");
  const submit = () => { if(text.trim()) { onAdd(text.trim()); setText(""); } };
  return (
    <div style={{ display:"flex", gap:9 }}>
      <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} placeholder={placeholder} style={{ flex:1 }} />
      <button className="btn btn-primary" onClick={submit}>{btnLabel}</button>
    </div>
  );
}

function ConvitesDiaInput({ themes, onAdd, T }) {
  const [theme, setTheme] = useState("");
  const [qty, setQty] = useState(1);
  return (
    <div style={{ display:"flex", gap:9, flexWrap:"wrap" }}>
      <input list="tlist" value={theme} onChange={e=>setTheme(e.target.value)} placeholder="🎨 Tema do convite..." style={{ flex:2, minWidth:160 }} />
      <datalist id="tlist">{themes.map(t=><option key={t.id} value={t.name}/>)}</datalist>
      <input type="number" min={1} value={qty} onChange={e=>setQty(e.target.value)} placeholder="Qtd" style={{ flex:1, minWidth:70 }} />
      <button className="btn btn-primary" onClick={() => { onAdd(theme, qty); setTheme(""); setQty(1); }}>+ Registrar</button>
    </div>
  );
}

function CardForm({ initial, columns, onSave, onClose, T }) {
  const [form, setForm] = useState({ title:"", description:"", priority:"Média", tags:"", columnId:"hoje", observations:"", ...initial });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  return (
    <div>
      <h3 style={{ fontWeight:800, marginBottom:16, fontSize:17 }}>{form.id?"Editar Cartão":"Novo Cartão"}</h3>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <div><label>Título *</label><input value={form.title} onChange={e=>set("title",e.target.value)} placeholder="Título" /></div>
        <div><label>Descrição</label><textarea value={form.description} onChange={e=>set("description",e.target.value)} placeholder="Descrição..." /></div>
        <div><label>Coluna</label><select value={form.columnId} onChange={e=>set("columnId",e.target.value)}>{columns.filter(c=>c.id!=="concluido").map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select></div>
        <div><label>Prioridade</label><select value={form.priority} onChange={e=>set("priority",e.target.value)}>{["Baixa","Média","Alta","Urgente"].map(p=><option key={p}>{p}</option>)}</select></div>
        <div><label>Tags (separadas por vírgula)</label><input value={form.tags} onChange={e=>set("tags",e.target.value)} placeholder="ex: safari, urgente" /></div>
        <div><label>Observações</label><textarea value={form.observations} onChange={e=>set("observations",e.target.value)} placeholder="Observações..." /></div>
        <div style={{ display:"flex", gap:9, marginTop:4 }}>
          <button className="btn btn-primary" style={{ flex:1 }} onClick={() => { if(form.title.trim()) onSave(form); }}>💾 Salvar</button>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

function IdeaForm({ initial, onSave, onClose, T }) {
  const [form, setForm] = useState({ title:"", description:"", category:"Convite Digital", ...initial });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  return (
    <div>
      <h3 style={{ fontWeight:800, marginBottom:16, fontSize:17 }}>{form.id?"Editar Ideia":"Nova Ideia"}</h3>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <div><label>Título *</label><input value={form.title} onChange={e=>set("title",e.target.value)} placeholder="Nome da ideia" /></div>
        <div><label>Descrição</label><textarea value={form.description} onChange={e=>set("description",e.target.value)} placeholder="Descreva..." /></div>
        <div><label>Categoria</label><select value={form.category} onChange={e=>set("category",e.target.value)}>{["Convite Digital","Tema Novo","Divulgação","Produto","Melhoria","Parceria","Outro"].map(c=><option key={c}>{c}</option>)}</select></div>
        <div style={{ display:"flex", gap:9, marginTop:4 }}>
          <button className="btn btn-primary" style={{ flex:1 }} onClick={() => { if(form.title.trim()) onSave(form); }}>💾 Salvar</button>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

function ThemeForm({ initial, onSave, onClose, T }) {
  const [form, setForm] = useState({ name:"", models:0, observations:"", ...initial });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  return (
    <div>
      <h3 style={{ fontWeight:800, marginBottom:16, fontSize:17 }}>{form.id?"Editar Tema":"Novo Tema"}</h3>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <div><label>Nome do Tema *</label><input value={form.name} onChange={e=>set("name",e.target.value)} placeholder="ex: Safari, Tiana, Roblox" /></div>
        <div><label>Quantidade de Modelos que você tem</label><input type="number" value={form.models} onChange={e=>set("models",e.target.value)} min={0} /></div>
        <div><label>Observações</label><textarea value={form.observations} onChange={e=>set("observations",e.target.value)} placeholder="Observações..." /></div>
        <div style={{ display:"flex", gap:9, marginTop:4 }}>
          <button className="btn btn-primary" style={{ flex:1 }} onClick={() => { if(form.name.trim()) onSave(form); }}>💾 Salvar</button>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

function AIConsultant({ state, T, loadingAI, setLoadingAI }) {
  const [chat, setChat] = useState([]);
  const [input, setInput] = useState("");
  const chatRef = useRef(null);

  const prodByTheme = {};
  state.convitesDodia.forEach(p => { prodByTheme[p.theme] = (prodByTheme[p.theme]||0)+Number(p.qty); });
  const ctx = `Você é consultora especialista em negócios de convites digitais. Responda sempre em português brasileiro, de forma direta e prática.
DADOS DO NEGÓCIO:
- Tarefas abertas: ${state.cards.filter(c=>c.columnId!=="concluido").length}
- Ideias: ${(state.ideas||[]).map(i=>i.title).join(", ")||"nenhuma"}
- Orçamentos por tema: ${state.orcamentos.map(o=>`${o.theme}(${o.count}x)`).join(", ")||"nenhum"}
- Biblioteca: ${state.themes.map(t=>`${t.name}(${t.models} modelos)`).join(", ")||"vazia"}
- Convites produzidos por tema: ${Object.entries(prodByTheme).map(([t,n])=>`${t}:${n}`).join(", ")||"nenhum"}`;

  async function send() {
    if (!input.trim()) return;
    const userMsg = { role:"user", content:input };
    const newChat = [...chat, userMsg];
    setChat(newChat);
    setInput("");
    setLoadingAI(l=>({...l,chat:true}));
    try {
      const msgs = newChat.map((m,i) => i===0 ? { role:"user", content: ctx+"\n\nPergunta: "+m.content } : m);
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, messages:msgs }),
      });
      const data = await res.json();
      setChat(c=>[...c,{ role:"assistant", content:data.content?.map(b=>b.text||"").join("")||"Sem resposta." }]);
    } catch { setChat(c=>[...c,{ role:"assistant", content:"Erro ao conectar." }]); }
    setLoadingAI(l=>({...l,chat:false}));
    setTimeout(()=>chatRef.current?.scrollTo(0,99999),100);
  }

  const suggestions = ["Quais temas devo criar primeiro?","Como está minha produtividade?","Quais temas têm mais procura?","O que focar essa semana?","Quais temas estão saturados?"];

  return (
    <div style={{ maxWidth:760 }}>
      <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, marginBottom:6 }}>🤖 Consultora IA</h2>
      <p style={{ color:T.muted, fontSize:13, marginBottom:16 }}>Pergunte qualquer coisa sobre seu negócio. A IA já conhece todos os seus dados.</p>
      <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginBottom:16 }}>
        {suggestions.map(s=><button key={s} className="btn btn-ghost btn-sm" style={{ fontSize:12 }} onClick={()=>setInput(s)}>{s}</button>)}
      </div>
      <div ref={chatRef} style={{ background:T.card, borderRadius:14, border:`1px solid ${T.border}`, height:380, overflowY:"auto", padding:14, display:"flex", flexDirection:"column", gap:10, marginBottom:12 }}>
        {chat.length===0 && (
          <div style={{ textAlign:"center", color:T.muted, marginTop:70 }}>
            <div style={{ fontSize:38, marginBottom:8 }}>🤖</div>
            <div>Olá! Sou sua consultora de convites digitais.</div>
            <div style={{ fontSize:13, marginTop:3 }}>Escolha uma sugestão ou faça sua pergunta.</div>
          </div>
        )}
        {chat.map((m,i)=>(
          <div key={i} style={{ alignSelf:m.role==="user"?"flex-end":"flex-start", maxWidth:"80%", background:m.role==="user"?`linear-gradient(135deg,${T.accent},${T.accent2})`:T.surface, color:m.role==="user"?"#fff":T.text, padding:"9px 13px", borderRadius:13, fontSize:14, lineHeight:1.7, whiteSpace:"pre-wrap" }}>
            {m.content}
          </div>
        ))}
        {loadingAI.chat && <div style={{ alignSelf:"flex-start", background:T.surface, padding:"9px 13px", borderRadius:13, color:T.muted, fontSize:13 }}>🤖 Pensando...</div>}
      </div>
      <div style={{ display:"flex", gap:9 }}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();} }} placeholder="Pergunte à sua consultora..." style={{ flex:1 }} />
        <button className="btn btn-primary" onClick={send} disabled={loadingAI.chat||!input.trim()}>Enviar</button>
      </div>
    </div>
  );
}

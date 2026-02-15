import { useState, useRef, useEffect } from "react";

const AGENTS = [
  { id: "research", name: "Research Agent", icon: "🔍", color: "#6366f1", status: "active", model: "Claude Sonnet 4.5", group: "Analysis" },
  { id: "writer", name: "Writer Agent", icon: "✍️", color: "#8b5cf6", status: "active", model: "Claude Opus 4", group: "Analysis" },
  { id: "code", name: "Code Agent", icon: "⚡", color: "#06b6d4", status: "computing", model: "Claude Sonnet 4.5", group: "Engineering" },
  { id: "security", name: "Security Agent", icon: "🛡️", color: "#f59e0b", status: "idle", model: "GPT-4o", group: "Engineering" },
  { id: "data", name: "Data Agent", icon: "📊", color: "#10b981", status: "active", model: "Claude Haiku 4.5", group: "Analysis" },
  { id: "deploy", name: "Deploy Agent", icon: "🚀", color: "#ef4444", status: "blocked", model: "Local Fine-tune", group: "Engineering" },
  { id: "design", name: "Design Agent", icon: "🎨", color: "#ec4899", status: "idle", model: "Claude Sonnet 4.5", group: "Creative" },
  { id: "qa", name: "QA Agent", icon: "✅", color: "#14b8a6", status: "waiting", model: "Claude Haiku 4.5", group: "Engineering" },
];

const SAMPLE_MESSAGES = {
  research: [
    { role: "user", text: "Find recent papers on multi-agent coordination in distributed systems." },
    { role: "agent", text: "I found 12 relevant papers from the last 6 months. The most cited is Chen et al. (2025) on consensus protocols for LLM agent swarms. Key findings: hierarchical orchestration outperforms flat topologies by 34% on complex tasks. Shall I synthesize the top 5?" },
    { role: "user", text: "Yes, focus on practical architectures — skip the pure theory." },
    { role: "agent", text: "Synthesizing 5 papers with practical architectures. Three use DAG-based execution graphs, two use blackboard architectures. Common pattern: all separate the orchestration layer from the execution layer. Drafting summary now..." },
  ],
  writer: [
    { role: "agent", text: "I've received the research synthesis from Research Agent. Starting the executive summary draft for the Q3 report." },
    { role: "agent", text: "Draft complete — 1,200 words. Confidence: 0.82. Two sections flagged for human review: the market sizing estimates rely on a single source, and the competitive analysis may be outdated. Sending to Verifier." },
    { role: "user", text: "Use a more assertive tone in the recommendations section." },
    { role: "agent", text: "Revised. Recommendations now lead with action verbs and quantified impact. \"We recommend\" → \"Deploy immediately to capture...\" Confidence improved to 0.87." },
  ],
  code: [
    { role: "agent", text: "Parsing the API specification from the shared context. I see 14 endpoints, 6 with authentication requirements." },
    { role: "agent", text: "Generated scaffolding for all 14 endpoints. Running type-check... 2 issues found in the payment module — the webhook signature type doesn't match the provider's docs." },
    { role: "user", text: "Fix the webhook types and add retry logic for the payment endpoints." },
    { role: "agent", text: "```typescript\n// Fixing webhook signature...\ntype WebhookPayload = {\n  event: PaymentEvent;\n  signature: string; // was: number\n  timestamp: ISO8601;\n}\n```\nRetry logic added: 3x exponential backoff, 1s → 4s → 16s. Running tests..." },
    { role: "agent", text: "All 47 tests passing. Coverage: 91%. Payment retry logic verified with mock failure injection. Ready for Security Agent review." },
  ],
  security: [
    { role: "agent", text: "Received code from Code Agent for security review. Scanning for vulnerabilities..." },
    { role: "agent", text: "⚠️ Found 2 issues:\n1. SQL injection risk in search endpoint (CRITICAL)\n2. Missing rate limiting on auth endpoints (HIGH)\n\nBlocking deployment until resolved. Notifying Code Agent." },
    { role: "user", text: "Is the SQL injection in the ORM layer or raw queries?" },
    { role: "agent", text: "Raw query in /api/search — string concatenation instead of parameterized query. The ORM usage elsewhere is clean. Sending specific fix recommendation to Code Agent now." },
  ],
  data: [
    { role: "user", text: "Pull the conversion funnel data for the last 30 days." },
    { role: "agent", text: "Query complete. 142K sessions analyzed.\n\nVisit → Signup: 12.3% (↑1.2% vs prior)\nSignup → Activate: 48.7% (↓3.1%)\nActivate → Purchase: 22.1% (stable)\n\nThe activation drop correlates with the new onboarding flow deployed on Feb 3rd. Want me to segment by acquisition channel?" },
    { role: "user", text: "Yes, break it down by organic vs paid vs referral." },
    { role: "agent", text: "Segmented. The activation drop is concentrated in paid channels (↓8.2%). Organic and referral are stable. Hypothesis: the new onboarding is too long for users with lower intent. Generating visualization..." },
  ],
  deploy: [
    { role: "agent", text: "🔴 BLOCKED — Security Agent has flagged 2 vulnerabilities in the latest build. Cannot proceed with deployment until issues are resolved." },
    { role: "agent", text: "Waiting on Code Agent to push fixes. Current queue: 1 hotfix (payment webhook types), 1 security patch (SQL injection). Estimated unblock: ~15 minutes after Code Agent completes." },
    { role: "user", text: "Can we deploy everything except the search endpoint?" },
    { role: "agent", text: "Partial deployment is possible. I can exclude /api/search and deploy the remaining 13 endpoints. This would unblock the payment team. Shall I proceed? (Requires your approval for partial deploy)" },
  ],
  design: [
    { role: "user", text: "Create a component library for the new dashboard." },
    { role: "agent", text: "Analyzing existing design tokens and component patterns. I see 3 button variants, 2 card styles, and inconsistent spacing values. Shall I normalize to an 8px grid and propose a unified token set?" },
    { role: "user", text: "Yes, 8px grid. Use the blue from our brand guide as the primary." },
    { role: "agent", text: "Token set drafted: 5 blues (50-900), neutral grays, semantic colors for success/warning/error. 12 components specced: Button, Card, Input, Select, Modal, Toast, Badge, Avatar, Table, Tabs, Sidebar, Header. Generating Figma-ready specs..." },
  ],
  qa: [
    { role: "agent", text: "Monitoring Code Agent's test suite. Current status: 47/47 passing. Initiating integration test suite..." },
    { role: "agent", text: "Integration tests: 31/34 passing. 3 failures in payment flow — all related to the webhook type mismatch that Code Agent is fixing. Will re-run automatically when the fix lands." },
    { role: "user", text: "Add a load test for the search endpoint before we deploy." },
    { role: "agent", text: "Load test configured: 1000 concurrent users, 60-second ramp, targeting /api/search. However, Security Agent has flagged this endpoint — recommend running load test AFTER the SQL injection fix to avoid testing vulnerable code under load. Queued for post-fix execution." },
  ],
};

const STATUS_CONFIG = {
  active: { label: "Active", color: "#10b981", pulse: true },
  computing: { label: "Computing", color: "#6366f1", pulse: true },
  idle: { label: "Idle", color: "#94a3b8", pulse: false },
  blocked: { label: "Blocked", color: "#ef4444", pulse: true },
  waiting: { label: "Waiting", color: "#f59e0b", pulse: false },
};

const StatusDot = ({ status }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, color: cfg.color, fontWeight: 600 }}>
      <span style={{
        width: 7, height: 7, borderRadius: "50%", backgroundColor: cfg.color,
        animation: cfg.pulse ? "pulse 2s ease-in-out infinite" : "none",
        boxShadow: cfg.pulse ? `0 0 6px ${cfg.color}40` : "none",
      }} />
      {cfg.label}
    </span>
  );
};

const ChatPane = ({ agent, messages, isMaximized, onToggleMaximize, onClose, onSend }) => {
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(agent.id, input.trim());
    setInput("");
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", backgroundColor: "#0f1117",
      borderRadius: 10, border: "1px solid #1e2130", overflow: "hidden",
      height: "100%", minHeight: 0,
      boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 14px", borderBottom: "1px solid #1e2130",
        background: `linear-gradient(135deg, ${agent.color}15, transparent)`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>{agent.icon}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{agent.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
              <StatusDot status={agent.status} />
              <span style={{ fontSize: 10, color: "#64748b" }}>{agent.model}</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={() => onToggleMaximize(agent.id)} style={{
            background: "none", border: "none", color: "#64748b", cursor: "pointer",
            padding: "4px 6px", borderRadius: 4, fontSize: 14,
          }} title={isMaximized ? "Restore" : "Maximize"}>
            {isMaximized ? "⊟" : "⊞"}
          </button>
          <button onClick={() => onClose(agent.id)} style={{
            background: "none", border: "none", color: "#64748b", cursor: "pointer",
            padding: "4px 6px", borderRadius: 4, fontSize: 14,
          }} title="Close pane">✕</button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{
        flex: 1, overflowY: "auto", padding: 12, display: "flex",
        flexDirection: "column", gap: 10, minHeight: 0,
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: "flex", flexDirection: "column",
            alignItems: msg.role === "user" ? "flex-end" : "flex-start",
          }}>
            <div style={{
              maxWidth: "88%", padding: "8px 12px", borderRadius: 10,
              fontSize: 12, lineHeight: 1.5, whiteSpace: "pre-wrap",
              backgroundColor: msg.role === "user" ? "#1e3a5f" : "#1a1d2e",
              color: msg.role === "user" ? "#93c5fd" : "#cbd5e1",
              borderBottomRightRadius: msg.role === "user" ? 2 : 10,
              borderBottomLeftRadius: msg.role === "user" ? 10 : 2,
            }}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
        borderTop: "1px solid #1e2130", backgroundColor: "#0a0c14",
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
          placeholder={`Message ${agent.name}...`}
          style={{
            flex: 1, backgroundColor: "#141722", border: "1px solid #2a2d3e",
            borderRadius: 6, padding: "8px 10px", color: "#e2e8f0", fontSize: 12,
            outline: "none",
          }}
        />
        <button onClick={handleSend} style={{
          backgroundColor: agent.color, color: "white", border: "none",
          borderRadius: 6, padding: "8px 12px", fontSize: 12, fontWeight: 600,
          cursor: "pointer", whiteSpace: "nowrap",
        }}>Send</button>
      </div>
    </div>
  );
};

export default function AgentWorkspace() {
  const [openPanes, setOpenPanes] = useState(["research", "code", "security", "data"]);
  const [maximized, setMaximized] = useState(null);
  const [messages, setMessages] = useState(SAMPLE_MESSAGES);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [layout, setLayout] = useState("grid");
  const [dragOver, setDragOver] = useState(null);
  const [filterGroup, setFilterGroup] = useState("All");

  const groups = ["All", ...new Set(AGENTS.map(a => a.group))];

  const filteredAgents = filterGroup === "All"
    ? AGENTS
    : AGENTS.filter(a => a.group === filterGroup);

  const togglePane = (id) => {
    if (openPanes.includes(id)) {
      setOpenPanes(openPanes.filter(p => p !== id));
      if (maximized === id) setMaximized(null);
    } else {
      setOpenPanes([...openPanes, id]);
    }
  };

  const closePane = (id) => {
    setOpenPanes(openPanes.filter(p => p !== id));
    if (maximized === id) setMaximized(null);
  };

  const toggleMaximize = (id) => {
    setMaximized(maximized === id ? null : id);
  };

  const sendMessage = (agentId, text) => {
    setMessages(prev => ({
      ...prev,
      [agentId]: [...(prev[agentId] || []), { role: "user", text }],
    }));
    setTimeout(() => {
      setMessages(prev => ({
        ...prev,
        [agentId]: [...(prev[agentId] || []),
          { role: "agent", text: `Processing: "${text.substring(0, 40)}${text.length > 40 ? "..." : ""}" — Working on it...` }
        ],
      }));
    }, 800);
  };

  const visiblePanes = maximized ? [maximized] : openPanes;

  const getGridStyle = () => {
    const count = visiblePanes.length;
    if (maximized || count === 1) return { gridTemplateColumns: "1fr", gridTemplateRows: "1fr" };
    if (layout === "columns") return { gridTemplateColumns: `repeat(${Math.min(count, 4)}, 1fr)`, gridTemplateRows: "1fr" };
    if (layout === "rows") return { gridTemplateColumns: "1fr", gridTemplateRows: `repeat(${count}, 1fr)` };
    if (count === 2) return { gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr" };
    if (count <= 4) return { gridTemplateColumns: "1fr 1fr", gridTemplateRows: count <= 2 ? "1fr" : "1fr 1fr" };
    if (count <= 6) return { gridTemplateColumns: "1fr 1fr 1fr", gridTemplateRows: count <= 3 ? "1fr" : "1fr 1fr" };
    return { gridTemplateColumns: "1fr 1fr 1fr 1fr", gridTemplateRows: `repeat(${Math.ceil(count / 4)}, 1fr)` };
  };

  return (
    <div style={{
      display: "flex", height: "100vh", width: "100vw", backgroundColor: "#080a10",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: "#e2e8f0",
      overflow: "hidden",
    }}>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        *::-webkit-scrollbar { width: 5px; }
        *::-webkit-scrollbar-track { background: transparent; }
        *::-webkit-scrollbar-thumb { background: #2a2d3e; border-radius: 3px; }
        button:hover { opacity: 0.85; }
        input::placeholder { color: #475569; }
      `}</style>

      {/* Sidebar */}
      <div style={{
        width: sidebarCollapsed ? 52 : 240, minWidth: sidebarCollapsed ? 52 : 240,
        backgroundColor: "#0a0c14", borderRight: "1px solid #1e2130",
        display: "flex", flexDirection: "column", transition: "width 0.2s, min-width 0.2s",
        overflow: "hidden",
      }}>
        {/* Sidebar header */}
        <div style={{
          padding: sidebarCollapsed ? "14px 8px" : "14px 16px",
          borderBottom: "1px solid #1e2130",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          {!sidebarCollapsed && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.3px" }}>Agent Hub</div>
              <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{AGENTS.filter(a => a.status === "active" || a.status === "computing").length} active / {AGENTS.length} total</div>
            </div>
          )}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{
            background: "none", border: "none", color: "#64748b", cursor: "pointer",
            fontSize: 16, padding: "2px 4px", borderRadius: 4,
          }}>
            {sidebarCollapsed ? "▸" : "◂"}
          </button>
        </div>

        {!sidebarCollapsed && (
          <>
            {/* Group filter tabs */}
            <div style={{
              display: "flex", gap: 4, padding: "10px 12px", flexWrap: "wrap",
              borderBottom: "1px solid #1e2130",
            }}>
              {groups.map(g => (
                <button key={g} onClick={() => setFilterGroup(g)} style={{
                  padding: "3px 10px", borderRadius: 12, border: "none", fontSize: 10,
                  fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                  backgroundColor: filterGroup === g ? "#6366f120" : "#141722",
                  color: filterGroup === g ? "#818cf8" : "#64748b",
                  border: filterGroup === g ? "1px solid #6366f140" : "1px solid transparent",
                }}>{g}</button>
              ))}
            </div>

            {/* Agent list */}
            <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
              {filteredAgents.map(agent => {
                const isOpen = openPanes.includes(agent.id);
                return (
                  <button key={agent.id} onClick={() => togglePane(agent.id)} style={{
                    display: "flex", alignItems: "center", gap: 10, width: "100%",
                    padding: "10px 10px", borderRadius: 8, border: "none",
                    backgroundColor: isOpen ? `${agent.color}15` : "transparent",
                    cursor: "pointer", marginBottom: 2, textAlign: "left",
                    borderLeft: isOpen ? `2px solid ${agent.color}` : "2px solid transparent",
                    transition: "all 0.15s",
                  }}>
                    <span style={{ fontSize: 18, width: 28, textAlign: "center" }}>{agent.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: isOpen ? "#f1f5f9" : "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{agent.name}</div>
                      <StatusDot status={agent.status} />
                    </div>
                    {isOpen && <span style={{ fontSize: 8, color: agent.color }}>●</span>}
                  </button>
                );
              })}
            </div>

            {/* Layout controls */}
            <div style={{ padding: "12px", borderTop: "1px solid #1e2130" }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>Layout</div>
              <div style={{ display: "flex", gap: 4 }}>
                {[
                  { id: "grid", label: "⊞", title: "Grid" },
                  { id: "columns", label: "❘❘❘", title: "Columns" },
                  { id: "rows", label: "☰", title: "Rows" },
                ].map(l => (
                  <button key={l.id} onClick={() => setLayout(l.id)} title={l.title} style={{
                    flex: 1, padding: "6px", borderRadius: 6, border: "none", fontSize: 14,
                    cursor: "pointer", transition: "all 0.15s",
                    backgroundColor: layout === l.id ? "#6366f120" : "#141722",
                    color: layout === l.id ? "#818cf8" : "#64748b",
                  }}>{l.label}</button>
                ))}
              </div>
              <div style={{ marginTop: 10, display: "flex", gap: 4 }}>
                <button onClick={() => setOpenPanes(AGENTS.map(a => a.id))} style={{
                  flex: 1, padding: "6px 8px", borderRadius: 6, border: "1px solid #2a2d3e",
                  backgroundColor: "#141722", color: "#94a3b8", fontSize: 10, fontWeight: 600,
                  cursor: "pointer",
                }}>Show All</button>
                <button onClick={() => { setOpenPanes([]); setMaximized(null); }} style={{
                  flex: 1, padding: "6px 8px", borderRadius: 6, border: "1px solid #2a2d3e",
                  backgroundColor: "#141722", color: "#94a3b8", fontSize: 10, fontWeight: 600,
                  cursor: "pointer",
                }}>Close All</button>
              </div>
            </div>
          </>
        )}

        {/* Collapsed sidebar — just icons */}
        {sidebarCollapsed && (
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 4px", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            {AGENTS.map(agent => {
              const isOpen = openPanes.includes(agent.id);
              return (
                <button key={agent.id} onClick={() => togglePane(agent.id)} title={agent.name} style={{
                  width: 38, height: 38, borderRadius: 8, border: "none",
                  backgroundColor: isOpen ? `${agent.color}20` : "transparent",
                  cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center",
                  justifyContent: "center", position: "relative",
                }}>
                  {agent.icon}
                  <span style={{
                    position: "absolute", top: 4, right: 4, width: 6, height: 6,
                    borderRadius: "50%", backgroundColor: STATUS_CONFIG[agent.status].color,
                  }} />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main content area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top bar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "8px 16px", borderBottom: "1px solid #1e2130", backgroundColor: "#0a0c14",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8" }}>
              {openPanes.length} pane{openPanes.length !== 1 ? "s" : ""} open
            </span>
            <span style={{ fontSize: 11, color: "#475569" }}>
              {maximized ? "🔍 Focused view" : `📐 ${layout.charAt(0).toUpperCase() + layout.slice(1)} layout`}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                const count = AGENTS.filter(a => a.status === key).length;
                if (!count) return null;
                return (
                  <span key={key} style={{ fontSize: 10, color: cfg.color, display: "flex", alignItems: "center", gap: 3 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: cfg.color }} />
                    {count} {cfg.label.toLowerCase()}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chat grid */}
        <div style={{
          flex: 1, display: openPanes.length ? "grid" : "flex",
          ...getGridStyle(),
          gap: 8, padding: 8, overflow: "hidden",
          alignItems: openPanes.length ? undefined : "center",
          justifyContent: openPanes.length ? undefined : "center",
        }}>
          {openPanes.length === 0 ? (
            <div style={{ textAlign: "center", color: "#475569" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#64748b" }}>No agents selected</div>
              <div style={{ fontSize: 12, marginTop: 6 }}>Click an agent in the sidebar to open a chat pane</div>
            </div>
          ) : (
            visiblePanes.map(id => {
              const agent = AGENTS.find(a => a.id === id);
              if (!agent) return null;
              return (
                <ChatPane
                  key={id}
                  agent={agent}
                  messages={messages[id] || []}
                  isMaximized={maximized === id}
                  onToggleMaximize={toggleMaximize}
                  onClose={closePane}
                  onSend={sendMessage}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

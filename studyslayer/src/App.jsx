import { useState, useEffect, useCallback, useRef } from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const WINNING_SCORE = 5;

// ─── Supabase client ──────────────────────────────────────────────────────────
const sb = {
  headers: () => ({
    "Content-Type": "application/json",
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${sb._token || SUPABASE_ANON_KEY}`,
  }),
  _token: null,
  _userId: null,

  async signUp(email, password, username) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
      body: JSON.stringify({ email, password, data: { username } }),
    });
    const d = await r.json();
    if (d.access_token) { sb._token = d.access_token; sb._userId = d.user?.id; }
    return d;
  },

  async signIn(email, password) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
      body: JSON.stringify({ email, password }),
    });
    const d = await r.json();
    if (d.access_token) { sb._token = d.access_token; sb._userId = d.user?.id; }
    return d;
  },

  async signOut() {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, { method: "POST", headers: sb.headers() });
    sb._token = null; sb._userId = null;
  },

  async query(table, params = "") {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}${params}`, {
      headers: { ...sb.headers(), Prefer: "return=representation" },
    });
    return r.json();
  },

  async insert(table, body) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { ...sb.headers(), Prefer: "return=representation" },
      body: JSON.stringify(body),
    });
    return r.json();
  },

  async update(table, params, body) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}${params}`, {
      method: "PATCH",
      headers: { ...sb.headers(), Prefer: "return=representation" },
      body: JSON.stringify(body),
    });
    return r.json();
  },

  async rpc(fn, body) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: sb.headers(),
      body: JSON.stringify(body),
    });
    return r.json();
  },
};

// ─── Polymarket API ───────────────────────────────────────────────────────────
const POLY_CATEGORIES = [
  { tag: "sports", name: "Sports", emoji: "\u26bd" },
  { tag: "politics", name: "Politics", emoji: "\ud83c\udfdb\ufe0f" },
  { tag: "crypto", name: "Crypto", emoji: "\u20bf" },
  { tag: "pop-culture", name: "Pop Culture", emoji: "\ud83c\udfac" },
  { tag: "business", name: "Business", emoji: "\ud83d\udcbc" },
  { tag: "science", name: "Science & Tech", emoji: "\ud83d\udd2c" },
];

async function polyFetch(url) {
  // Try direct fetch first, then CORS proxy fallback
  try {
    const res = await fetch(url);
    if (res.ok) return res.json();
  } catch {
    // CORS blocked — try proxy
  }
  const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
  const res = await fetch(proxyUrl);
  if (!res.ok) throw new Error("Failed to fetch from Polymarket");
  return res.json();
}

function parseOutcomePrices(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(Number);
  try { return JSON.parse(raw).map(Number); } catch { return []; }
}

async function fetchPolymarketQuestions(tags, questionsPerTag = 5) {
  const allQuestions = [];

  for (const tag of tags) {
    try {
      const events = await polyFetch(
        `https://gamma-api.polymarket.com/events?tag=${tag}&closed=false&active=true&limit=20&order=volume24hr&ascending=false`
      );

      if (!Array.isArray(events)) continue;

      // Prefer multi-outcome events (3+ markets)
      const multiOutcome = events.filter(e => e.markets && e.markets.length >= 3);
      const binary = events.filter(e => e.markets && e.markets.length === 1);

      // Process multi-outcome events
      for (const event of multiOutcome.slice(0, questionsPerTag)) {
        const markets = event.markets.slice(0, 4); // max 4 options
        const options = markets.map(m => m.groupItemTitle || m.question?.replace(/^Will\s+/i, "").replace(/\?$/, "") || "Unknown");
        const probabilities = markets.map(m => {
          const prices = parseOutcomePrices(m.outcomePrices);
          return prices[0] || 0; // Yes price = probability
        });

        if (options.length < 2) continue;
        const topIdx = probabilities.indexOf(Math.max(...probabilities));

        allQuestions.push({
          question: event.title,
          options,
          probabilities,
          correct: topIdx,
          category: tag,
          source: event.slug ? `https://polymarket.com/event/${event.slug}` : null,
        });
      }

      // Fill remaining with binary events if needed
      const remaining = questionsPerTag - multiOutcome.slice(0, questionsPerTag).length;
      if (remaining > 0) {
        for (const event of binary.slice(0, remaining)) {
          const market = event.markets[0];
          const prices = parseOutcomePrices(market.outcomePrices);
          const yesProb = prices[0] || 0.5;
          const noProb = prices[1] || (1 - yesProb);

          allQuestions.push({
            question: event.title || market.question,
            options: ["Yes", "No"],
            probabilities: [yesProb, noProb],
            correct: yesProb >= noProb ? 0 : 1,
            category: tag,
            source: event.slug ? `https://polymarket.com/event/${event.slug}` : null,
          });
        }
      }
    } catch (err) {
      console.warn(`Failed to fetch ${tag} from Polymarket:`, err);
    }
  }

  // Shuffle questions
  for (let i = allQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
  }

  return allQuestions;
}

// ─── Avatar colors ────────────────────────────────────────────────────────────
const AVATAR_COLORS = ["#e74c3c","#e67e22","#f1c40f","#2ecc71","#1abc9c","#3498db","#9b59b6","#e91e63","#00bcd4","#ff5722"];
const getInitials = (name) => name ? name.slice(0, 2).toUpperCase() : "??";

// ─── Styles ───────────────────────────────────────────────────────────────────
const G = {
  bg: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
  card: { background: "rgba(255,255,255,0.07)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: "1.5rem" },
  input: { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "10px 14px", color: "#fff", width: "100%", fontSize: 14, outline: "none", boxSizing: "border-box" },
  btn: { borderRadius: 8, padding: "10px 20px", fontWeight: 600, fontSize: 14, cursor: "pointer", border: "none", transition: "all 0.2s" },
  btnPrimary: { background: "linear-gradient(135deg, #667eea, #764ba2)", color: "#fff" },
  btnDanger: { background: "linear-gradient(135deg, #e74c3c, #c0392b)", color: "#fff" },
  btnGhost: { background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" },
  text: { color: "#fff" },
  muted: { color: "rgba(255,255,255,0.55)", fontSize: 13 },
  label: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, display: "block" },
};

// ─── Components ───────────────────────────────────────────────────────────────
function Avatar({ name, color, size = 36 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: color || "#667eea", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.35, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
      {getInitials(name)}
    </div>
  );
}

function Spinner() {
  return <div style={{ width: 24, height: 24, border: "3px solid rgba(255,255,255,0.2)", borderTopColor: "#667eea", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />;
}

function Toast({ msg, type }) {
  if (!msg) return null;
  const colors = { error: "#e74c3c", success: "#2ecc71", info: "#3498db" };
  return (
    <div style={{ position: "fixed", top: 20, right: 20, background: colors[type] || "#333", color: "#fff", padding: "12px 20px", borderRadius: 10, fontWeight: 600, fontSize: 14, zIndex: 9999, maxWidth: 320, boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
      {msg}
    </div>
  );
}

// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────
function AuthScreen({ onAuth, toast }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password || (mode === "signup" && !username)) return toast("Fill in all fields", "error");
    setLoading(true);
    try {
      let res;
      if (mode === "signup") {
        res = await sb.signUp(email, password, username);
        if (res.error) return toast(res.error.message || "Sign up failed", "error");
        if (res.access_token) onAuth({ id: sb._userId, email, username });
        else toast("Check your email to confirm your account", "info");
      } else {
        res = await sb.signIn(email, password);
        if (res.error) return toast(res.error.message || "Sign in failed", "error");
        const profile = await sb.query("profiles", `?id=eq.${sb._userId}`);
        onAuth({ id: sb._userId, email, username: profile[0]?.username || email, avatar_color: profile[0]?.avatar_color });
      }
    } catch { toast("Network error", "error"); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: G.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.6}}`}</style>
      <div style={{ width: 400, maxWidth: "90vw" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: 56, animation: "float 3s ease-in-out infinite" }}>{"\ud83c\udfb0"}</div>
          <h1 style={{ ...G.text, fontSize: 32, fontWeight: 800, margin: "0.5rem 0 0.25rem", letterSpacing: "-0.02em" }}>StudySlayer</h1>
          <p style={G.muted}>Predict the market. Beat your friends.</p>
        </div>
        <div style={G.card}>
          <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem" }}>
            {["signin","signup"].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{ ...G.btn, flex: 1, ...(mode === m ? G.btnPrimary : G.btnGhost) }}>
                {m === "signin" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>
          {mode === "signup" && (
            <div style={{ marginBottom: 12 }}>
              <label style={G.label}>Username</label>
              <input style={G.input} placeholder="predictor42" value={username} onChange={e => setUsername(e.target.value)} />
            </div>
          )}
          <div style={{ marginBottom: 12 }}>
            <label style={G.label}>Email</label>
            <input style={G.input} type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={G.label}>Password</label>
            <input style={G.input} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
          </div>
          <button onClick={handleSubmit} disabled={loading} style={{ ...G.btn, ...G.btnPrimary, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {loading ? <Spinner /> : (mode === "signin" ? "Enter the Arena" : "Join the Game")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── LOBBY SCREEN ─────────────────────────────────────────────────────────────
function LobbyScreen({ user, onCreateRoom, onJoinRoom, onSignOut, toast }) {
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      let code, attempts = 0;
      while (attempts < 10) {
        const candidate = Math.random().toString(36).slice(2, 8).toUpperCase();
        const existing = await sb.query("rooms", `?code=eq.${candidate}`);
        if (!existing.length) { code = candidate; break; }
        attempts++;
      }
      const room = await sb.insert("rooms", { code, host_id: user.id, status: "lobby" });
      if (room.error || !room[0]) return toast(room[0]?.message || "Failed to create room", "error");
      await sb.insert("room_players", { room_id: room[0].id, player_id: user.id });
      onCreateRoom(room[0]);
    } catch { toast("Error creating room", "error"); }
    finally { setLoading(false); }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return toast("Enter a room code", "error");
    setLoading(true);
    try {
      const rooms = await sb.query("rooms", `?code=eq.${joinCode.toUpperCase()}&status=eq.lobby`);
      if (!rooms[0]) return toast("Room not found or game already started", "error");
      const existing = await sb.query("room_players", `?room_id=eq.${rooms[0].id}&player_id=eq.${user.id}`);
      if (!existing[0]) await sb.insert("room_players", { room_id: rooms[0].id, player_id: user.id });
      onJoinRoom(rooms[0]);
    } catch { toast("Error joining room", "error"); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: G.bg, fontFamily: "'Segoe UI', sans-serif", padding: "2rem 1rem" }}>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>{"\ud83c\udfb0"}</span>
            <div>
              <div style={{ ...G.text, fontWeight: 800, fontSize: 18 }}>StudySlayer</div>
              <div style={G.muted}>Main Lobby</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar name={user.username} color={user.avatar_color} />
            <div>
              <div style={{ ...G.text, fontWeight: 600, fontSize: 14 }}>{user.username}</div>
              <button onClick={onSignOut} style={{ ...G.muted, background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 12 }}>Sign out</button>
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <h2 style={{ ...G.text, fontSize: 28, fontWeight: 800, margin: "0 0 0.5rem", letterSpacing: "-0.02em" }}>Think you can predict the future?</h2>
          <p style={G.muted}>Pick categories, guess what the market thinks, and compete with friends</p>
        </div>

        <div style={{ display: "grid", gap: "1rem" }}>
          <div style={G.card}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{"\ud83d\ude80"}</div>
            <h3 style={{ ...G.text, margin: "0 0 0.5rem", fontWeight: 700 }}>Create a Room</h3>
            <p style={{ ...G.muted, marginBottom: "1.25rem" }}>Host a game and pick your prediction categories</p>
            <button onClick={handleCreate} disabled={loading} style={{ ...G.btn, ...G.btnPrimary, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {loading ? <Spinner /> : "Create Room"}
            </button>
          </div>

          <div style={G.card}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{"\ud83d\udd17"}</div>
            <h3 style={{ ...G.text, margin: "0 0 0.5rem", fontWeight: 700 }}>Join a Room</h3>
            <p style={{ ...G.muted, marginBottom: "1.25rem" }}>Enter a 6-character room code from your friend</p>
            <div style={{ display: "flex", gap: 8 }}>
              <input style={{ ...G.input, letterSpacing: "0.15em", fontWeight: 700, textTransform: "uppercase" }} placeholder="ENTER CODE" maxLength={6} value={joinCode} onChange={e => setJoinCode(e.target.value)} onKeyDown={e => e.key === "Enter" && handleJoin()} />
              <button onClick={handleJoin} disabled={loading} style={{ ...G.btn, ...G.btnPrimary, whiteSpace: "nowrap" }}>Join</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ROOM SCREEN (Category Selection) ─────────────────────────────────────────
function RoomScreen({ user, room, onGameStart, onLeave, toast }) {
  const [players, setPlayers] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [generating, setGenerating] = useState(false);
  const isHost = room.host_id === user.id;
  const pollRef = useRef();

  const refresh = useCallback(async () => {
    const p = await sb.query("room_players", `?room_id=eq.${room.id}&select=*,profiles(*)`);
    if (Array.isArray(p)) setPlayers(p);
    const roomData = await sb.query("rooms", `?id=eq.${room.id}`);
    if (roomData[0]?.status === "playing") onGameStart(roomData[0]);
  }, [room.id]);

  useEffect(() => {
    refresh();
    pollRef.current = setInterval(refresh, 3000);
    return () => clearInterval(pollRef.current);
  }, [refresh]);

  const toggleCategory = (tag) => {
    setSelectedCategories(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const startGame = async () => {
    if (!selectedCategories.length) return toast("Select at least one category", "error");
    setGenerating(true);
    try {
      await sb.update("rooms", `?id=eq.${room.id}`, { status: "generating" });

      const questionsPerTag = Math.ceil(15 / selectedCategories.length);
      const questions = await fetchPolymarketQuestions(selectedCategories, questionsPerTag);

      if (!questions.length) throw new Error("No questions found. Try different categories.");

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        await sb.insert("questions", {
          room_id: room.id,
          question_text: q.question,
          options: q.options,
          correct_answer: q.correct,
          explanation: JSON.stringify({ probabilities: q.probabilities, source: q.source, category: q.category }),
          question_order: i,
        });
      }

      // Reset all player scores to 0
      for (const p of players) {
        await sb.update("room_players", `?room_id=eq.${room.id}&player_id=eq.${p.player_id}`, { score: 0 });
      }

      await sb.update("rooms", `?id=eq.${room.id}`, { status: "playing", current_question: 0 });
      toast("Game starting!", "success");
    } catch (e) {
      toast("Failed to start: " + e.message, "error");
      await sb.update("rooms", `?id=eq.${room.id}`, { status: "lobby" });
    }
    finally { setGenerating(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: G.bg, fontFamily: "'Segoe UI', sans-serif", padding: "1.5rem 1rem" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <div>
            <div style={{ ...G.text, fontWeight: 800, fontSize: 22 }}>Room Lobby</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <span style={{ ...G.text, fontSize: 24, fontWeight: 800, letterSpacing: "0.1em", background: "linear-gradient(135deg,#667eea,#764ba2)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{room.code}</span>
              <span style={G.muted}>Share this code with friends</span>
            </div>
          </div>
          <button onClick={onLeave} style={{ ...G.btn, ...G.btnGhost, fontSize: 13 }}>{"\u2190"} Leave</button>
        </div>

        {/* Players */}
        <div style={{ ...G.card, marginBottom: "1rem" }}>
          <div style={{ ...G.muted, fontWeight: 700, marginBottom: 12, textTransform: "uppercase", fontSize: 11, letterSpacing: "0.1em" }}>Players ({players.length})</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {players.map(p => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", background: "rgba(255,255,255,0.06)", borderRadius: 8 }}>
                <Avatar name={p.profiles?.username} color={p.profiles?.avatar_color} size={28} />
                <span style={{ ...G.text, fontWeight: 600, fontSize: 13 }}>{p.profiles?.username}</span>
                {p.player_id === room.host_id && <span style={{ fontSize: 11 }}>{"\ud83d\udc51"}</span>}
              </div>
            ))}
            {players.length === 0 && <div style={G.muted}>Waiting for players...</div>}
          </div>
        </div>

        {/* Category Selection */}
        {isHost && (
          <>
            <div style={{ ...G.card, marginBottom: "1rem" }}>
              <div style={{ ...G.muted, fontWeight: 700, marginBottom: 12, textTransform: "uppercase", fontSize: 11, letterSpacing: "0.1em" }}>Choose Categories</div>
              <p style={{ ...G.muted, marginBottom: 16 }}>Pick the prediction market topics for your game. Questions come live from Polymarket!</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {POLY_CATEGORIES.map(cat => {
                  const isSelected = selectedCategories.includes(cat.tag);
                  return (
                    <button
                      key={cat.tag}
                      onClick={() => toggleCategory(cat.tag)}
                      style={{
                        background: isSelected ? "rgba(102,126,234,0.3)" : "rgba(255,255,255,0.06)",
                        border: isSelected ? "2px solid #667eea" : "2px solid rgba(255,255,255,0.1)",
                        borderRadius: 12,
                        padding: "16px 12px",
                        cursor: "pointer",
                        textAlign: "center",
                        transition: "all 0.2s",
                      }}
                    >
                      <div style={{ fontSize: 28, marginBottom: 6 }}>{cat.emoji}</div>
                      <div style={{ ...G.text, fontWeight: 600, fontSize: 13 }}>{cat.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={G.card}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <div style={{ ...G.text, fontWeight: 700, fontSize: 15 }}>First to {WINNING_SCORE} points wins!</div>
                  <div style={G.muted}>Match the market's top pick to score</div>
                </div>
                <div style={{ ...G.text, fontSize: 28 }}>{"\ud83c\udfc6"}</div>
              </div>
              <button onClick={startGame} disabled={generating || !selectedCategories.length}
                style={{ ...G.btn, background: "linear-gradient(135deg,#11998e,#38ef7d)", color: "#fff", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: !selectedCategories.length ? 0.5 : 1 }}>
                {generating ? <><Spinner /> Fetching predictions...</> : `\ud83c\udfb2 Start Game (${selectedCategories.length} ${selectedCategories.length === 1 ? "category" : "categories"})`}
              </button>
            </div>
          </>
        )}
        {!isHost && (
          <div style={{ ...G.card, textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{"\u23f3"}</div>
            <p style={G.muted}>Waiting for the host to pick categories and start the game...</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── GAME SCREEN ──────────────────────────────────────────────────────────────
function GameScreen({ user, room, onGameEnd, toast }) {
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [allAnswers, setAllAnswers] = useState({});
  const [players, setPlayers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(20);
  const [phase, setPhase] = useState("question"); // question | reveal
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState({});
  const [winner, setWinner] = useState(null);
  const timerRef = useRef();
  const pollRef = useRef();
  const isHost = room.host_id === user.id;

  useEffect(() => {
    (async () => {
      const [qs, ps] = await Promise.all([
        sb.query("questions", `?room_id=eq.${room.id}&order=question_order.asc`),
        sb.query("room_players", `?room_id=eq.${room.id}&select=*,profiles(*)`),
      ]);
      if (Array.isArray(qs)) setQuestions(qs);
      if (Array.isArray(ps)) {
        setPlayers(ps);
        const sc = {};
        ps.forEach(p => { sc[p.player_id] = p.score || 0; });
        setScores(sc);
      }
      setLoading(false);
    })();
  }, [room.id]);

  const curQ = questions[currentIdx];

  // Parse probabilities from explanation field
  const getQuestionMeta = (q) => {
    if (!q) return { probabilities: [], source: null, category: null };
    try {
      return JSON.parse(q.explanation);
    } catch {
      return { probabilities: [], source: null, category: null };
    }
  };

  const refreshAnswers = useCallback(async () => {
    if (!curQ) return;
    const ans = await sb.query("answers", `?question_id=eq.${curQ.id}`);
    if (Array.isArray(ans)) {
      const map = {};
      ans.forEach(a => { map[a.player_id] = a; });
      setAllAnswers(map);
    }
  }, [curQ?.id]);

  // Refresh scores
  const refreshScores = useCallback(async () => {
    const ps = await sb.query("room_players", `?room_id=eq.${room.id}&select=*,profiles(*)`);
    if (Array.isArray(ps)) {
      setPlayers(ps);
      const sc = {};
      ps.forEach(p => { sc[p.player_id] = p.score || 0; });
      setScores(sc);
      // Check for winner
      const w = ps.find(p => (p.score || 0) >= WINNING_SCORE);
      if (w) setWinner(w);
    }
  }, [room.id]);

  // Timer
  useEffect(() => {
    if (loading || !curQ || phase !== "question") return;
    setTimeLeft(20);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); setPhase("reveal"); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [currentIdx, loading, phase]);

  // Poll answers during question phase
  useEffect(() => {
    if (phase !== "question") return;
    pollRef.current = setInterval(refreshAnswers, 2000);
    return () => clearInterval(pollRef.current);
  }, [phase, refreshAnswers]);

  // Refresh scores on reveal
  useEffect(() => {
    if (phase === "reveal") refreshScores();
  }, [phase, refreshScores]);

  const submitAnswer = async (optIdx) => {
    if (answered || phase === "reveal") return;
    setSelected(optIdx);
    setAnswered(true);
    const isCorrect = optIdx === curQ.correct_answer;
    await sb.insert("answers", {
      question_id: curQ.id, player_id: user.id,
      selected_option: optIdx, is_correct: isCorrect,
    });
    // Update score for ALL players (not just host)
    if (isCorrect) {
      const currentScore = scores[user.id] || 0;
      await sb.update("room_players", `?room_id=eq.${room.id}&player_id=eq.${user.id}`, { score: currentScore + 1 });
      setScores(prev => ({ ...prev, [user.id]: currentScore + 1 }));
    }
    refreshAnswers();
  };

  const nextQuestion = async () => {
    // Check if someone won
    if (winner) {
      await sb.update("rooms", `?id=eq.${room.id}`, { status: "finished" });
      onGameEnd();
      return;
    }
    if (currentIdx >= questions.length - 1) {
      await sb.update("rooms", `?id=eq.${room.id}`, { status: "finished" });
      onGameEnd();
      return;
    }
    await sb.update("rooms", `?id=eq.${room.id}`, { current_question: currentIdx + 1 });
    setCurrentIdx(i => i + 1);
    setSelected(null);
    setAnswered(false);
    setAllAnswers({});
    setPhase("question");
  };

  // Non-host polls for question advancement
  useEffect(() => {
    if (isHost) return;
    const check = setInterval(async () => {
      const r = await sb.query("rooms", `?id=eq.${room.id}`);
      if (r[0]?.status === "finished") { onGameEnd(); return; }
      if (r[0]?.current_question > currentIdx) {
        setCurrentIdx(r[0].current_question);
        setSelected(null); setAnswered(false); setAllAnswers({}); setPhase("question");
      }
    }, 2000);
    return () => clearInterval(check);
  }, [isHost, currentIdx]);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: G.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Spinner />
    </div>
  );

  if (!curQ) return null;

  const meta = getQuestionMeta(curQ);
  const options = Array.isArray(curQ.options) ? curQ.options : JSON.parse(curQ.options);
  const optionColors = ["#3498db","#e74c3c","#2ecc71","#f39c12"];
  const totalAnswered = Object.keys(allAnswers).length;
  const categoryInfo = POLY_CATEGORIES.find(c => c.tag === meta.category);

  return (
    <div style={{ minHeight: "100vh", background: G.bg, fontFamily: "'Segoe UI', sans-serif", padding: "1.5rem 1rem" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {categoryInfo && <span style={{ fontSize: 18 }}>{categoryInfo.emoji}</span>}
            <span style={G.muted}>Question {currentIdx + 1} of {questions.length}</span>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ ...G.text, fontWeight: 800, fontSize: 22, color: timeLeft <= 5 ? "#e74c3c" : "#2ecc71" }}>{timeLeft}s</div>
            <div style={{ ...G.muted, fontSize: 12 }}>{totalAnswered}/{players.length} answered</div>
          </div>
        </div>

        {/* Score bar */}
        <div style={{ display: "flex", gap: 8, marginBottom: "1rem", flexWrap: "wrap" }}>
          {[...players].sort((a, b) => (scores[b.player_id] || 0) - (scores[a.player_id] || 0)).map(p => (
            <div key={p.player_id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", background: "rgba(255,255,255,0.06)", borderRadius: 20, border: p.player_id === user.id ? "1px solid rgba(102,126,234,0.5)" : "1px solid transparent" }}>
              <Avatar name={p.profiles?.username} color={p.profiles?.avatar_color} size={20} />
              <span style={{ ...G.text, fontSize: 12, fontWeight: 600 }}>{scores[p.player_id] || 0}</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>/{WINNING_SCORE}</span>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 4, marginBottom: "1.5rem" }}>
          <div style={{ height: "100%", background: "linear-gradient(90deg,#667eea,#764ba2)", borderRadius: 4, width: `${((currentIdx) / questions.length) * 100}%`, transition: "width 0.5s" }} />
        </div>

        {/* Question */}
        <div style={{ ...G.card, textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ ...G.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>What does the market predict?</div>
          <div style={{ ...G.text, fontSize: 20, fontWeight: 700, lineHeight: 1.4 }}>{curQ.question_text}</div>
        </div>

        {/* Options */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.5rem" }}>
          {options.map((opt, i) => {
            let border = "2px solid transparent";
            let bg = `${optionColors[i % optionColors.length]}22`;
            const prob = meta.probabilities?.[i];
            const isCorrectAnswer = i === curQ.correct_answer;

            if (phase === "reveal") {
              if (isCorrectAnswer) {
                bg = `${optionColors[i % optionColors.length]}44`;
                border = `2px solid ${optionColors[i % optionColors.length]}`;
              } else if (i === selected) {
                bg = "rgba(231,76,60,0.2)";
                border = "2px solid #e74c3c";
              }
            } else if (selected === i) {
              bg = `${optionColors[i % optionColors.length]}55`;
              border = `2px solid ${optionColors[i % optionColors.length]}`;
            }

            return (
              <button key={i} onClick={() => submitAnswer(i)} disabled={answered || phase === "reveal"}
                style={{ background: bg, border, borderRadius: 12, padding: "1rem", color: "#fff", fontWeight: 600, fontSize: 15, cursor: answered ? "default" : "pointer", textAlign: "left", transition: "all 0.2s", position: "relative" }}>
                <span style={{ opacity: 0.6, fontSize: 12, display: "block", marginBottom: 4 }}>{["A","B","C","D"][i]}</span>
                {opt}
                {phase === "reveal" && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", background: isCorrectAnswer ? "#2ecc71" : optionColors[i % optionColors.length], borderRadius: 3, width: `${(prob || 0) * 100}%`, transition: "width 0.8s ease-out" }} />
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 4, fontWeight: 700 }}>
                      {((prob || 0) * 100).toFixed(1)}%
                    </div>
                  </div>
                )}
                {phase === "reveal" && isCorrectAnswer && <span style={{ position: "absolute", top: 8, right: 10, fontSize: 18 }}>{"\u2713"}</span>}
              </button>
            );
          })}
        </div>

        {/* Reveal panel */}
        {phase === "reveal" && (
          <div style={{ ...G.card, marginBottom: "1rem" }}>
            <div style={{ ...G.text, fontWeight: 700, marginBottom: 6 }}>
              {selected === curQ.correct_answer
                ? "\u2705 You matched the market's top pick! +1 point"
                : "\u274c The market disagrees with you"}
            </div>
            <div style={G.muted}>
              Polymarket data as of right now{meta.source && (
                <span> &mdash; <a href={meta.source} target="_blank" rel="noopener noreferrer" style={{ color: "#667eea" }}>View on Polymarket</a></span>
              )}
            </div>

            {winner && (
              <div style={{ marginTop: 12, padding: "12px 16px", background: "rgba(241,196,15,0.15)", borderRadius: 10, border: "1px solid rgba(241,196,15,0.3)" }}>
                <div style={{ ...G.text, fontWeight: 800, fontSize: 18 }}>
                  {"\ud83c\udfc6"} {winner.profiles?.username} wins with {WINNING_SCORE} points!
                </div>
              </div>
            )}

            {isHost && (
              <button onClick={nextQuestion} style={{ ...G.btn, background: "linear-gradient(135deg,#11998e,#38ef7d)", color: "#fff", marginTop: 12 }}>
                {winner ? "See Final Results \u2192" : currentIdx >= questions.length - 1 ? "See Final Results \u2192" : "Next Question \u2192"}
              </button>
            )}
            {!isHost && <div style={{ ...G.muted, marginTop: 8, fontSize: 12 }}>Waiting for host to continue...</div>}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── RESULTS SCREEN ───────────────────────────────────────────────────────────
function ResultsScreen({ user, room, onLeave }) {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    (async () => {
      const p = await sb.query("room_players", `?room_id=eq.${room.id}&select=*,profiles(*)&order=score.desc`);
      if (Array.isArray(p)) setPlayers(p);
    })();
  }, [room.id]);

  const podiumColors = ["#f1c40f","#bdc3c7","#cd7f32"];
  const medals = ["\ud83e\udd47","\ud83e\udd48","\ud83e\udd49"];

  return (
    <div style={{ minHeight: "100vh", background: G.bg, fontFamily: "'Segoe UI', sans-serif", padding: "2rem 1rem" }}>
      <div style={{ maxWidth: 520, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: "0.5rem" }}>{"\ud83c\udfc6"}</div>
        <h2 style={{ ...G.text, fontSize: 32, fontWeight: 800, margin: "0 0 0.5rem" }}>Game Over!</h2>
        <p style={{ ...G.muted, marginBottom: "0.5rem" }}>Final Standings</p>
        {players[0] && (
          <p style={{ ...G.text, fontSize: 18, fontWeight: 600, marginBottom: "2rem" }}>
            {players[0].profiles?.username} wins with {players[0].score} {players[0].score === 1 ? "point" : "points"}!
          </p>
        )}

        <div style={G.card}>
          {players.map((p, i) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < players.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
              <div style={{ fontSize: 24, width: 32 }}>{medals[i] || `#${i + 1}`}</div>
              <Avatar name={p.profiles?.username} color={p.profiles?.avatar_color} size={40} />
              <div style={{ flex: 1, textAlign: "left" }}>
                <div style={{ ...G.text, fontWeight: 700 }}>{p.profiles?.username}</div>
                {p.player_id === user.id && <div style={{ fontSize: 11, color: "#667eea" }}>You</div>}
              </div>
              <div style={{ ...G.text, fontSize: 22, fontWeight: 800, color: podiumColors[i] || "#fff" }}>
                {p.score || 0}
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginLeft: 4 }}>pts</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: "1.5rem" }}>
          <button onClick={onLeave} style={{ ...G.btn, ...G.btnGhost }}>Main Menu</button>
        </div>
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("auth");
  const [user, setUser] = useState(null);
  const [room, setRoom] = useState(null);
  const [toast, setToast] = useState({ msg: "", type: "info" });

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "info" }), 3500);
  };

  const handleAuth = (u) => { setUser(u); setScreen("lobby"); };
  const handleSignOut = async () => { await sb.signOut(); setUser(null); setScreen("auth"); };
  const handleCreateRoom = (r) => { setRoom(r); setScreen("room"); };
  const handleJoinRoom = (r) => { setRoom(r); setScreen("room"); };
  const handleGameStart = (r) => { setRoom(r); setScreen("game"); };
  const handleGameEnd = () => setScreen("results");
  const handleLeave = () => { setRoom(null); setScreen("lobby"); };

  return (
    <>
      <Toast msg={toast.msg} type={toast.type} />
      {screen === "auth" && <AuthScreen onAuth={handleAuth} toast={showToast} />}
      {screen === "lobby" && <LobbyScreen user={user} onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} onSignOut={handleSignOut} toast={showToast} />}
      {screen === "room" && <RoomScreen user={user} room={room} onGameStart={handleGameStart} onLeave={handleLeave} toast={showToast} />}
      {screen === "game" && <GameScreen user={user} room={room} onGameEnd={handleGameEnd} toast={showToast} />}
      {screen === "results" && <ResultsScreen user={user} room={room} onLeave={handleLeave} />}
      <style>{`* { box-sizing: border-box; } body { margin: 0; } input::placeholder { color: rgba(255,255,255,0.3); } textarea::placeholder { color: rgba(255,255,255,0.3); } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

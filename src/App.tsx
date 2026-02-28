import { useState, useEffect, useRef } from 'react';

interface ChatMessage {
  type: string;
  message_id: number;
  user_id: string;
  username: string;
  url?: string;
  content?: string;
}

export default function App() {
  // Auth States
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [currentUser, setCurrentUser] = useState<string | null>(localStorage.getItem("user_id"));
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Chat States
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [textInput, setTextInput] = useState("");
  const ws = useRef<WebSocket | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Connect to the Citadel ONLY if we have a valid token
  useEffect(() => {
    if (!token) return;

    // 1. Fetch Chat History securely!
    fetch("/api/messages", {
      headers: { "Authorization": `Bearer ${token}` } // 🚨 The Bouncer needs this!
    })
      .then(res => res.json())
      .then(data => {
        if (data) setMessages(data);
      })
      .catch(err => console.error("❌ Failed to load history", err));

    // 2. Connect WebSockets securely (Passing token in the URL!)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws.current = new WebSocket(`${protocol}//${window.location.host}/ws?token=${token}`);

    ws.current.onopen = () => console.log("🟢 Connected to Nexus Chat Hub!");

    ws.current.onmessage = (event) => {
      const data: ChatMessage = JSON.parse(event.data);
      setMessages((prev) => [...prev, data]);
    };

    return () => ws.current?.close();
  }, [token]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';
    
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      
      // We throw a standard JavaScript Error object here
      if (!res.ok) throw new Error(data.message || "Auth failed");

      if (authMode === 'login') {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user_id", data.user_id);
        setToken(data.token);
        setCurrentUser(data.user_id);
      } else {
        alert("Registration successful! Please log in.");
        setAuthMode('login');
      }
      
    // 🚨 1. Catch as 'unknown' (Strict Mode standard)
    } catch (error: unknown) { 
      // 🚨 2. Safely verify it is an actual Error object before accessing .message
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("An unexpected network error occurred.");
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_id");
    setToken(null);
    setCurrentUser(null);
    setMessages([]);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !token) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      await fetch("/api/upload", { 
        method: "POST", 
        body: formData,
        headers: { "Authorization": `Bearer ${token}` } // 🚨 Secure the S3 upload!
      });
    } catch (error) {
      console.error("❌ Upload Failed:", error);
    }
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || !ws.current) return;

    ws.current.send(JSON.stringify({ type: "NEW_TEXT", content: textInput }));
    setTextInput("");
  };

  // ------------------------------------------------------------------
  // UI RENDER: If no token, show the Login Gate
  // ------------------------------------------------------------------
  if (!token) {
    return (
      <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', textAlign: 'center' }}>
        <h2>{authMode === 'login' ? 'Login to Nexus' : 'Register'}</h2>
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} style={{ padding: '10px' }} required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{ padding: '10px' }} required />
          <button type="submit" style={{ padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            {authMode === 'login' ? 'Enter Citadel' : 'Create Account'}
          </button>
        </form>
        <p style={{ marginTop: '15px', fontSize: '0.9em', cursor: 'pointer', color: '#007bff' }} onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
          {authMode === 'login' ? "Need an account? Register" : "Already have an account? Login"}
        </p>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // UI RENDER: The Secure Chat Room
  // ------------------------------------------------------------------
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Nexus Chat 🚀</h2>
        <button onClick={handleLogout} style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Logout</button>
      </div>
      
      <div style={{ border: '1px solid #ccc', height: '400px', overflowY: 'scroll', padding: '15px', marginBottom: '20px', borderRadius: '8px', backgroundColor: '#f9f9f9', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {messages.map((msg, idx) => (
          // 🚨 THE FIX: Here is the dynamic alignment logic!
          <div key={idx} style={{ padding: '10px 15px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', alignSelf: msg.user_id === currentUser ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
            <div style={{ fontWeight: 'bold', fontSize: '0.75em', color: '#888', marginBottom: '5px' }}>
              {msg.user_id === currentUser ? 'You' : msg.username}
            </div>
            {msg.type === "NEW_TEXT" && <div style={{ fontSize: '1rem', color: '#333' }}>{msg.content}</div>}
            {msg.type === "NEW_IMAGE" && msg.url && (
              <img src={msg.url} alt="Uploaded content" style={{ maxWidth: '100%', borderRadius: '4px', border: '1px solid #eee' }} />
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <form onSubmit={handleSendText} style={{ display: 'flex', flex: 1, gap: '10px' }}>
          <input type="text" value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Type a message..." style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} />
          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Send</button>
        </form>
        <label style={{ cursor: 'pointer', padding: '10px 15px', backgroundColor: '#007bff', color: 'white', borderRadius: '5px', fontWeight: 'bold' }}>
          📸 <input type="file" onChange={handleFileUpload} accept="image/*" style={{ display: 'none' }} />
        </label>
      </div>
    </div>
  );
}
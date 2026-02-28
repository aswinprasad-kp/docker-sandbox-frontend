import { useState, useEffect, useRef } from 'react';

// The TypeScript interface
interface ChatMessage {
  type: string;
  message_id: number;
  user_id: string;
  url: string;
}

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    // 🚨 dynamically use wss:// if on https, and use the Nginx host!
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log("🟢 Connected to Nexus Chat Hub!");
    };

    ws.current.onmessage = (event) => {
      const data: ChatMessage = JSON.parse(event.data);
      console.log("🔥 INCOMING MESSAGE:", data);
      setMessages((prev) => [...prev, data]);
    };

    return () => {
      ws.current?.close();
    };
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      console.log("📤 Uploading file...");
      // 🚨 Use a relative path so it routes through your Nginx proxy!
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      const result = await response.json();
      console.log("✅ Upload Complete!", result);
    } catch (error) {
      console.error("❌ Upload Failed:", error);
    }
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2>Nexus Chat 🚀</h2>
      
      <div style={{ border: '1px solid #ccc', height: '400px', overflowY: 'scroll', padding: '10px', marginBottom: '20px', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
        {messages.length === 0 ? (
          <p style={{ color: '#888', textAlign: 'center', marginTop: '150px' }}>No messages yet. Be the first to upload an image!</p>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} style={{ marginBottom: '15px', padding: '10px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ fontWeight: 'bold', fontSize: '0.8em', color: '#555', marginBottom: '5px' }}>
                👤 {msg.user_id}
              </div>
              {msg.type === "NEW_IMAGE" && (
                <img 
                  src={msg.url} 
                  alt="Uploaded content" 
                  style={{ maxWidth: '100%', borderRadius: '4px', border: '1px solid #eee' }} 
                />
              )}
            </div>
          ))
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <label style={{ cursor: 'pointer', padding: '10px 15px', backgroundColor: '#007bff', color: 'white', borderRadius: '5px', fontWeight: 'bold' }}>
          📸 Upload Image
          <input 
            type="file" 
            onChange={handleFileUpload} 
            accept="image/*" 
            style={{ display: 'none' }} 
          />
        </label>
        <span style={{ fontSize: '0.9em', color: '#666' }}>Upload an image to test the WebSockets!</span>
      </div>
    </div>
  );
}
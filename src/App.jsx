import { useState, useEffect } from "react"

function App() {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState("");

  const fetchUsers = async () => {
    const res = await fetch("/api/users");
    return await res.json();
  }

  const addUser = async () => {
    if (!name) return;
    await fetch("/api/users", {
      method: "POST",
      body: JSON.stringify({ name })
    });
    fetchUsers().then(data => setUsers(data || []));
  }

  useEffect(() => {
    fetchUsers().then(data => setUsers(data || []));
  }, []);

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial', maxWidth: '400px', margin: 'auto' }}>
      <h2>XpenseOps React Sandbox</h2>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input 
          value={name} 
          onChange={e => setName(e.target.value)} 
          placeholder="Enter a name" 
          style={{ flex: 1, padding: '8px' }}
        />
        <button onClick={addUser} style={{ padding: '8px 16px', cursor: 'pointer' }}>Add</button>
      </div>
      <ul style={{ background: '#474747', padding: '20px', borderRadius: '8px' }}>
        {users.map((u, i) => <li key={i} style={{ marginBottom: '10px' }}>{u}</li>)}
      </ul>
    </div>
  )
}

export default App

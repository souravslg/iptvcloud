"use client";
// Version: 1.0.1 - Final Build Trigger

import { useState, useEffect } from "react";
import { Users, Settings, PlayCircle } from "lucide-react";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("users");

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", gap: "20px", marginBottom: "30px" }}>
        <button 
          className={`btn ${activeTab === "users" ? "" : "danger"}`} 
          style={{ background: activeTab === "users" ? "var(--accent)" : "rgba(255,255,255,0.1)" }}
          onClick={() => setActiveTab("users")}
        >
          <Users size={20} /> Manage Users
        </button>
        <button 
          className={`btn ${activeTab === "settings" ? "" : "danger"}`}
          style={{ background: activeTab === "settings" ? "var(--accent)" : "rgba(255,255,255,0.1)" }}
          onClick={() => setActiveTab("settings")}
        >
          <Settings size={20} /> Settings
        </button>
      </div>

      <div className="glass-panel">
        {activeTab === "users" ? <UserManagement /> : <SettingsPanel />}
      </div>
    </div>
  );
}

function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setUsers(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (user: any) => {
    try {
      await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, isActive: !user.isActive })
      });
      fetchUsers();
    } catch (e) {
      alert("Error updating status");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    try {
      await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      fetchUsers();
    } catch (e) {
      alert("Error deleting user");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h3>User Subscriptions</h3>
        <button className="btn" onClick={() => { setEditingUser(null); setShowModal(true); }}>
          <Users size={16} /> Add User
        </button>
      </div>
      
      {loading ? (
        <p>Loading users...</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>User Details & M3U</th>
                <th>Status</th>
                <th>Valid Until</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => {
                const isExpired = new Date(user.validUntil) < new Date();
                const m3uUrl = typeof window !== 'undefined' 
                  ? `${window.location.origin}/api/playlist?username=${user.username}&password=${user.password}`
                  : '';
                
                return (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>
                      <div style={{ fontWeight: "bold" }}>{user.username}</div>
                      <div style={{ fontSize: "0.7rem", opacity: 0.6, marginTop: "4px" }}>
                        Source: {user.sourceM3u || 'Global Default'}
                      </div>
                      <div style={{ fontSize: "0.6rem", opacity: 0.4, marginTop: "2px", maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {m3uUrl}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${!isExpired && user.isActive ? 'active' : 'expired'}`}>
                        {!isExpired && user.isActive ? 'Active' : (isExpired ? 'Expired' : 'Inactive')}
                      </span>
                      {!user.isActive && <span className="badge expired" style={{ marginLeft: "5px" }}>Suspended</span>}
                    </td>
                    <td>{new Date(user.validUntil).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                        <button className="btn" style={{ padding: "4px 8px", fontSize: "0.7rem" }} onClick={() => { navigator.clipboard.writeText(m3uUrl); alert("Copied!"); }}>
                          Copy URL
                        </button>
                        <a href={m3uUrl} target="_blank" className="btn" style={{ padding: "4px 8px", fontSize: "0.7rem", textDecoration: "none" }}>
                          View
                        </a>
                        <button 
                          className={`btn ${user.isActive ? 'danger' : ''}`}
                          style={{ padding: "4px 8px", fontSize: "0.7rem" }}
                          onClick={() => handleToggleStatus(user)}
                        >
                          {user.isActive ? 'Suspend' : 'Activate'}
                        </button>
                        <button className="btn" style={{ padding: "4px 8px", fontSize: "0.7rem" }} onClick={() => { setEditingUser(user); setShowModal(true); }}>
                          Edit
                        </button>
                        <button className="btn danger" style={{ padding: "4px 8px", fontSize: "0.7rem" }} onClick={() => handleDelete(user.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <UserModal 
          user={editingUser} 
          onClose={() => setShowModal(false)} 
          onSave={() => { setShowModal(false); fetchUsers(); }} 
        />
      )}
    </div>
  );
}

function UserModal({ user, onClose, onSave }: any) {
  const [formData, setFormData] = useState(user || {
    username: "",
    password: "",
    validUntil: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
    sourceM3u: "",
    isActive: true
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const method = user ? "PATCH" : "POST";
    const payload = user ? { ...formData, id: user.id } : formData;
    
    await fetch("/api/admin/users", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    onSave();
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
      <div className="glass-panel" style={{ width: "400px", maxWidth: "90%" }}>
        <h3>{user ? "Edit User" : "Add New User"}</h3>
        <form onSubmit={handleSubmit} style={{ marginTop: "20px" }}>
          <div className="input-group">
            <label>Username</label>
            <input type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
          </div>
          <div className="input-group">
            <label>Valid Until</label>
            <input type="date" value={formData.validUntil.split('T')[0]} onChange={e => setFormData({...formData, validUntil: e.target.value})} required />
          </div>
          <div className="input-group">
            <label>Custom M3U Source (Optional)</label>
            <input type="text" placeholder="Leave blank for default" value={formData.sourceM3u || ""} onChange={e => setFormData({...formData, sourceM3u: e.target.value})} />
          </div>
          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <button type="submit" className="btn" style={{ flex: 1 }}>Save</button>
            <button type="button" className="btn danger" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SettingsPanel() {
  const [settingsData, setSettingsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [masterUrl, setMasterUrl] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      setSettingsData(data);
      const master = data.find((s: any) => s.key === "master_playlist");
      if (master) setMasterUrl(master.value);
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "master_playlist", value: masterUrl })
    });
    alert("Settings saved!");
  };

  return (
    <div>
      <h3 style={{ marginBottom: "20px" }}>Server Settings</h3>
      {loading ? <p>Loading...</p> : (
        <>
          <div className="input-group">
            <label>Master Playlist URL (Global Default)</label>
            <input 
              type="text" 
              placeholder="http://example.com/master.m3u" 
              value={masterUrl} 
              onChange={e => setMasterUrl(e.target.value)} 
            />
          </div>
          <button className="btn" style={{ marginTop: "10px" }} onClick={handleSave}>Save Settings</button>
        </>
      )}
    </div>
  );
}

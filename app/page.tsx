"use client";
// Version: 1.0.1 - Final Build Trigger

import React, { useState, useEffect } from "react";
import { Users, Settings, PlayCircle } from "lucide-react";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("users");
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [editingChannel, setEditingChannel] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

  return (
    <>
      {showUserModal && (
        <UserModal 
          user={editingUser} 
          onClose={() => setShowUserModal(false)} 
          onSave={() => { setShowUserModal(false); triggerRefresh(); }} 
        />
      )}

      {showChannelModal && (
        <ChannelModal 
          channel={editingChannel} 
          onClose={() => setShowChannelModal(false)} 
          onSave={() => { setShowChannelModal(false); triggerRefresh(); }} 
        />
      )}

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
            className={`btn ${activeTab === "playlists" ? "" : "danger"}`}
            style={{ background: activeTab === "playlists" ? "var(--accent)" : "rgba(255,255,255,0.1)" }}
            onClick={() => setActiveTab("playlists")}
          >
            <PlayCircle size={20} /> Playlist Manager
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
          {activeTab === "users" ? (
            <UserManagement 
              onEdit={(user: any) => { setEditingUser(user); setShowUserModal(true); }}
              refreshTrigger={refreshTrigger}
            />
          ) : (activeTab === "playlists" ? (
            <PlaylistManager 
              onEdit={(channel: any) => { setEditingChannel(channel); setShowChannelModal(true); }}
              refreshTrigger={refreshTrigger}
            />
          ) : <SettingsPanel />)}
        </div>
      </div>
    </>
  );
}

function UserManagement({ onEdit, refreshTrigger }: any) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to load users");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [refreshTrigger]);

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
        <button className="btn" onClick={() => onEdit(null)}>
          <Users size={16} /> Add User
        </button>
      </div>
      
      {loading ? (
        <p>Loading users...</p>
      ) : error ? (
        <div style={{ color: "#ff4444", padding: "10px", background: "rgba(255,0,0,0.1)", borderRadius: "5px" }}>
          {error}
        </div>
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
                        <button className="btn" style={{ padding: "4px 8px", fontSize: "0.7rem" }} onClick={() => onEdit(user)}>
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
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [masterUrl, setMasterUrl] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/settings");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const settingsArray = Array.isArray(data) ? data : [];
        setSettingsData(settingsArray);
        const master = settingsArray.find((s: any) => s.key === "master_playlist");
        if (master) setMasterUrl(master.value);
      } catch (e: any) {
        console.error("Failed to fetch settings:", e);
        setError(e.message || "Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "master_playlist", value: masterUrl })
      });
      if (response.ok) {
        alert("Settings saved! Now importing channels from the master playlist...");
        // Automatically trigger sync
        const importRes = await fetch("/api/admin/channels/import", { method: "POST" });
        const importData = await importRes.json();
        alert(`Successfully imported ${importData.count || 0} channels!`);
        
        // Refresh to ensure UI is in sync
        const res = await fetch("/api/admin/settings");
        const data = await res.json();
        const master = data.find((s: any) => s.key === "master_playlist");
        if (master) setMasterUrl(master.value);
      } else {
        alert("Failed to save settings. Please try again.");
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("Network error: Could not connect to the server.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h3 style={{ marginBottom: "20px" }}>Server Settings</h3>
      {loading ? <p>Loading...</p> : (
        error ? (
          <div style={{ color: "#ff4444", padding: "10px", background: "rgba(255,0,0,0.1)", borderRadius: "5px" }}>
            {error}. Make sure the D1 database is correctly bound and migrations have been run.
          </div>
        ) : (
        <>
          <div className="input-group">
            <label>Master Playlist URL (Global Default)</label>
            <input 
              type="text" 
              placeholder="http://example.com/master.m3u" 
              value={masterUrl} 
              onChange={e => setMasterUrl(e.target.value)} 
              disabled={saving}
            />
          </div>
          <button 
            className={`btn ${saving ? 'danger' : ''}`} 
            style={{ marginTop: "10px" }} 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </>
      )}
    </div>
  );
}

function PlaylistManager({ onEdit, refreshTrigger }: any) {
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState("");

  const fetchChannels = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/channels");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setChannels(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to load channels");
    }
    setLoading(false);
  };

  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString());
    fetchChannels();
  }, [refreshTrigger]);

  const handleToggleStatus = async (channel: any) => {
    await fetch("/api/admin/channels", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: channel.id, isActive: !channel.isActive })
    });
    fetchChannels();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this channel?")) return;
    await fetch("/api/admin/channels", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    fetchChannels();
  };

  const categories = Array.from(new Set(channels.map(c => c.group || "General")));

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "30px" }}>
        <div className="glass-panel" style={{ padding: "20px", textAlign: "center", background: "rgba(255,255,255,0.05)" }}>
          <div style={{ opacity: 0.6, fontSize: "0.8rem", textTransform: "uppercase", marginBottom: "10px" }}>Total Channels</div>
          <div style={{ fontSize: "2rem", fontWeight: "bold" }}>{channels.length}</div>
        </div>
        <div className="glass-panel" style={{ padding: "20px", textAlign: "center", background: "rgba(255,255,255,0.05)" }}>
          <div style={{ opacity: 0.6, fontSize: "0.8rem", textTransform: "uppercase", marginBottom: "10px" }}>Categories</div>
          <div style={{ fontSize: "2rem", fontWeight: "bold" }}>{categories.length}</div>
        </div>
        <div className="glass-panel" style={{ padding: "20px", textAlign: "center", background: "rgba(255,255,255,0.05)" }}>
          <div style={{ opacity: 0.6, fontSize: "0.8rem", textTransform: "uppercase", marginBottom: "10px" }}>Last Updated</div>
          <div style={{ fontSize: "1.2rem", fontWeight: "bold", marginTop: "10px" }}>{currentDate}</div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h3>Custom Channels</h3>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn" style={{ background: "var(--accent)" }} onClick={async () => {
            setLoading(true);
            try {
              const res = await fetch("/api/admin/channels/import", { method: "POST" });
              if (res.ok) {
                const data = await res.json();
                alert(`Successfully imported ${data.count || 0} new channels!`);
              } else {
                const err = await res.json();
                alert(`Import failed: ${err.error || 'Unknown error'}`);
              }
            } catch (e) {
              alert("Network error during import");
            }
            fetchChannels();
          }}>
            <PlayCircle size={16} /> Sync Master
          </button>
          <button className="btn" onClick={() => onEdit(null)}>
            <PlayCircle size={16} /> Add Channel
          </button>
          <button className="btn danger" onClick={async () => {
            if (!confirm("Delete ALL channels? This cannot be undone.")) return;
            setLoading(true);
            await fetch("/api/admin/channels", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ all: true })
            });
            fetchChannels();
          }}>
            Clear All
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading channels...</p>
      ) : error ? (
        <div style={{ color: "#ff4444", padding: "10px", background: "rgba(255,0,0,0.1)", borderRadius: "5px" }}>
          {error}
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Group</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {channels.map(channel => (
                <tr key={channel.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {channel.logo && <img src={channel.logo} alt="" style={{ width: "30px", height: "30px", objectFit: "contain" }} />}
                      <div style={{ fontWeight: "bold" }}>{channel.name}</div>
                    </div>
                  </td>
                  <td><span className="badge">{channel.group || "General"}</span></td>
                  <td>
                    <span className={`badge ${channel.isMpd ? 'active' : ''}`} style={{ background: channel.isMpd ? '#9c27b0' : 'rgba(255,255,255,0.1)' }}>
                      {channel.isMpd ? 'MPD / DASH' : 'HLS / M3U8'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${channel.isActive ? 'active' : 'expired'}`}>
                      {channel.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "5px" }}>
                      <button className="btn" style={{ padding: "4px 8px", fontSize: "0.7rem" }} onClick={() => onEdit(channel)}>
                        Edit
                      </button>
                      <button 
                        className={`btn ${channel.isActive ? 'danger' : ''}`}
                        style={{ padding: "4px 8px", fontSize: "0.7rem" }}
                        onClick={() => handleToggleStatus(channel)}
                      >
                        {channel.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button className="btn danger" style={{ padding: "4px 8px", fontSize: "0.7rem" }} onClick={() => handleDelete(channel.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ChannelModal({ channel, onClose, onSave }: any) {
  console.log("Rendering ChannelModal for:", channel?.name);
  const [formData, setFormData] = useState({
    name: channel?.name || "",
    logo: channel?.logo || "",
    group: channel?.group || "",
    url: channel?.url || "",
    isMpd: !!channel?.isMpd,
    clearkey: channel?.clearkey || ""
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const method = channel ? "PATCH" : "POST";
    const payload = channel ? { ...formData, id: channel.id } : formData;
    
    try {
      const res = await fetch("/api/admin/channels", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        onSave();
      } else {
        alert("Failed to save channel");
      }
    } catch (err) {
      alert("Network error saving channel");
    }
  };

  return (
    <div style={{ 
      position: "fixed", 
      top: 0, 
      left: 0, 
      width: "100%", 
      height: "100%", 
      background: "rgba(0,0,0,0.85)", 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      zIndex: 99999 
    }}>
      <div className="glass-panel" style={{ 
        width: "500px", 
        maxWidth: "95%", 
        position: "relative",
        background: "#1e293b", // Solid background for debugging
        border: "2px solid var(--accent)",
        boxShadow: "0 20px 50px rgba(0,0,0,0.5)"
      }}>
        <h3>{channel ? "Edit Channel" : "Add New Channel"}</h3>
        <form onSubmit={handleSubmit} style={{ marginTop: "20px" }}>
          <div className="input-group">
            <label>Channel Name</label>
            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div className="input-group">
              <label>Logo URL</label>
              <input type="text" value={formData.logo} onChange={e => setFormData({...formData, logo: e.target.value})} />
            </div>
            <div className="input-group">
              <label>Group / Category</label>
              <input type="text" placeholder="e.g. Entertainment" value={formData.group} onChange={e => setFormData({...formData, group: e.target.value})} />
            </div>
          </div>
          <div className="input-group">
            <label>Stream URL</label>
            <input type="text" placeholder="http://.../index.m3u8 or .mpd" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} required />
          </div>
          <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            <input 
              type="checkbox" 
              id="isMpd" 
              checked={formData.isMpd} 
              onChange={e => setFormData({...formData, isMpd: e.target.checked})} 
              style={{ width: "20px", height: "20px" }}
            />
            <label htmlFor="isMpd" style={{ margin: 0 }}>This is an MPD (DASH) stream</label>
          </div>
          
          {formData.isMpd && (
            <div className="input-group animate-fade-in" style={{ padding: "15px", background: "rgba(255,255,255,0.05)", borderRadius: "10px" }}>
              <label>ClearKey DRM (KID:KEY)</label>
              <input type="text" placeholder="e.g. 1a2b3c...:4d5e6f..." value={formData.clearkey} onChange={e => setFormData({...formData, clearkey: e.target.value})} />
              <small style={{ opacity: 0.5, marginTop: "5px", display: "block" }}>Format: KID:KEY (hex pairs)</small>
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <button type="submit" className="btn" style={{ flex: 1 }}>{channel ? "Update Channel" : "Save Channel"}</button>
            <button type="button" className="btn danger" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

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

  useEffect(() => {
    // In a real implementation we would fetch from /api/admin/users
    // Since we don't have node running, we'll mock the data for visual demonstration
    setTimeout(() => {
      setUsers([
        { id: 1, username: "john_doe", validUntil: new Date(Date.now() + 86400000 * 30), isActive: true },
        { id: 2, username: "jane_smith", validUntil: new Date(Date.now() - 86400000 * 5), isActive: false }
      ]);
      setLoading(false);
    }, 500);
  }, []);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h3>User Subscriptions</h3>
        <button className="btn"><Users size={16} /> Add User</button>
      </div>
      
      {loading ? (
        <p>Loading users...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Status</th>
              <th>Valid Until</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => {
              const isExpired = new Date(user.validUntil) < new Date();
              return (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.username}</td>
                  <td>
                    <span className={`badge ${!isExpired && user.isActive ? 'active' : 'expired'}`}>
                      {!isExpired && user.isActive ? 'Active' : 'Expired'}
                    </span>
                  </td>
                  <td>{new Date(user.validUntil).toLocaleDateString()}</td>
                  <td>
                    <button className="btn" style={{ padding: "6px 12px", fontSize: "0.8rem", marginRight: "8px" }}>Edit</button>
                    <button className="btn danger" style={{ padding: "6px 12px", fontSize: "0.8rem" }}>Delete</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

function SettingsPanel() {
  return (
    <div>
      <h3 style={{ marginBottom: "20px" }}>Server Settings</h3>
      <div className="input-group">
        <label>Master Playlist URL (M3U Source)</label>
        <input type="text" placeholder="http://example.com/master.m3u" defaultValue="http://iptv-source.local/get.php?username=admin" />
      </div>
      <div className="input-group">
        <label>Admin Password</label>
        <input type="password" placeholder="Leave blank to keep current" />
      </div>
      <button className="btn" style={{ marginTop: "10px" }}>Save Settings</button>
    </div>
  );
}

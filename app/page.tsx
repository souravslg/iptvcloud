"use client";

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Tv, 
  Settings, 
  Plus, 
  RefreshCw, 
  Trash2, 
  Edit3, 
  LayoutDashboard,
  LogOut,
  PlayCircle
} from 'lucide-react';
import './globals.css';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'users') {
        const res = await fetch('/api/admin/users');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } else if (activeTab === 'providers') {
        const res = await fetch('/api/admin/providers');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setProviders(Array.isArray(data) ? data : []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (providerId: number) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/providers/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(`Successfully synced ${data.count} channels!`);
      fetchData();
    } catch (err: any) {
      alert(`Sync failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProvider = async () => {
    const name = prompt("Provider Name:");
    const url = prompt("M3U URL:");
    if (!name || !url) return;

    try {
      const res = await fetch('/api/admin/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, url })
      });
      if (!res.ok) throw new Error("Failed to add provider");
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div className="glass-card" style={{ width: '280px', borderRadius: '0', borderLeft: 'none', borderTop: 'none', borderBottom: 'none' }}>
        <div style={{ padding: '20px 0', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
          <div style={{ background: 'var(--accent-color)', padding: '8px', borderRadius: '12px' }}>
            <Tv size={24} color="white" />
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>IPTV Edge</h2>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <NavItem 
            icon={<LayoutDashboard size={18} />} 
            label="Overview" 
            active={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')} 
          />
          <NavItem 
            icon={<Users size={18} />} 
            label="Subscriptions" 
            active={activeTab === 'users'} 
            onClick={() => setActiveTab('users')} 
          />
          <NavItem 
            icon={<PlayCircle size={18} />} 
            label="Playlist Manager" 
            active={activeTab === 'providers'} 
            onClick={() => setActiveTab('providers')} 
          />
          <NavItem 
            icon={<Settings size={18} />} 
            label="Server Settings" 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
          />
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <NavItem icon={<LogOut size={18} />} label="Logout" danger />
        </div>
      </div>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>
              {activeTab === 'users' ? 'User Subscriptions' : 
               activeTab === 'providers' ? 'Playlist Manager' : 
               activeTab === 'settings' ? 'Server Settings' : 'Dashboard Overview'}
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>Manage your IPTV edge infrastructure</p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
             <button className="btn btn-primary" onClick={fetchData}>
               <RefreshCw size={18} className={loading ? 'spin' : ''} />
             </button>
             {activeTab === 'users' && (
               <button className="btn btn-primary">
                 <Plus size={18} /> New Subscriber
               </button>
             )}
          </div>
        </header>

        {error && (
          <div className="glass-card" style={{ borderColor: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)', marginBottom: '20px' }}>
            <p style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <strong>Error:</strong> {error}
            </p>
            <p style={{ fontSize: '0.8rem', marginTop: '10px', color: 'var(--text-secondary)' }}>
              Tip: Make sure you have created your D1 database and run the migrations.
            </p>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="glass-card">
            {loading && users.length === 0 ? <p>Loading subscribers...</p> : (
              <table>
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Status</th>
                    <th>Connections</th>
                    <th>Expiry Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No subscribers found</td></tr>
                  ) : users.map(user => (
                    <tr key={user.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{user.username}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ID: #{user.id}</div>
                      </td>
                      <td>
                        <span className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {user.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td>{user.maxConnections || '∞'}</td>
                      <td>{user.expiryDate || 'Never'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn" style={{ padding: '6px' }}><Edit3 size={16} /></button>
                          <button className="btn danger" style={{ padding: '6px' }}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'providers' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            <div 
              className="glass-card" 
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', borderStyle: 'dashed', cursor: 'pointer' }}
              onClick={handleAddProvider}
            >
              <Plus size={48} color="var(--text-secondary)" style={{ marginBottom: '20px' }} />
              <h3 style={{ color: 'var(--text-secondary)' }}>Add New Provider</h3>
              <p style={{ textAlign: 'center', fontSize: '0.9rem', marginTop: '10px', color: 'var(--text-secondary)' }}>Import M3U or Xtream Codes playlists</p>
            </div>
            {providers.map(p => (
              <div key={p.id} className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <Tv size={24} color="var(--accent-color)" />
                  <span className={`badge ${p.last_sync ? 'badge-success' : 'badge-danger'}`}>
                    {p.last_sync ? 'Synced' : 'New'}
                  </span>
                </div>
                <h3>{p.name}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.url}</p>
                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
                  <button className="btn btn-primary" style={{ flex: 1, marginRight: '10px' }} onClick={() => handleSync(p.id)}>
                    <RefreshCw size={14} className={loading ? 'spin' : ''} /> Sync
                  </button>
                  <button className="btn danger" style={{ padding: '10px' }}><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <style jsx>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function NavItem({ icon, label, active, onClick, danger }: any) {
  return (
    <div 
      onClick={onClick}
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px', 
        padding: '12px 16px', 
        borderRadius: '12px', 
        cursor: 'pointer',
        transition: 'all 0.2s',
        background: active ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
        color: danger ? 'var(--danger)' : active ? 'var(--accent-color)' : 'var(--text-primary)',
        fontWeight: active ? 600 : 400
      }}
      className="nav-item"
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}

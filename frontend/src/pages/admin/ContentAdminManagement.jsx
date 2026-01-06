import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import AppModal from '../../components/AppModal';
import AdminStatCard from '../../components/AdminStatCard';
import { UserPlus, X } from 'lucide-react';

const ContentAdminManagement = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [admins, setAdmins] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actioningId, setActioningId] = useState(null);
  const [toast, setToast] = useState('');

  // Form state for creating new admin
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
  });
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);

  // Load all admin users
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:5001';
        const token = localStorage.getItem('authToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${backendUrl}/admin/admin-users`, { headers });
        
        if (res.status === 401 || res.status === 403) {
          setError('Unauthorized. Please sign in as a super admin.');
          return;
        }
        if (!res.ok) throw new Error('Failed to load admin users');
        
        const data = await res.json();
        const arr = Array.isArray(data) ? data : data.admins || [];
        if (mounted) setAdmins(arr);
      } catch (err) {
        console.error(err);
        if (mounted) setError(err.message || 'Error loading admin users');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setFormError('');
    
    // Validation
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.password.trim()) {
      setFormError('All fields are required');
      return;
    }

    if (formData.password.length < 5) {
      setFormError('Password must be at least 5 characters');
      return;
    }

    setCreating(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:5001';
      const token = localStorage.getItem('authToken');
      
      const res = await fetch(`${backendUrl}/admin/admin-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.status === 401 || res.status === 403) {
        setFormError('Unauthorized. Please sign in as super admin.');
        return;
      }

      if (!res.ok) {
        throw new Error(data.message || 'Failed to create admin user');
      }

      // Add new admin to list
      setAdmins((prev) => [data.admin, ...prev]);
      setToast('Admin user created successfully');
      setShowCreateModal(false);
      
      // Reset form
      setFormData({ fullName: '', email: '', password: '' });
    } catch (err) {
      console.error(err);
      setFormError(err.message || 'Error creating admin user');
    } finally {
      setCreating(false);
    }
  };

  const confirmDelete = (admin) => {
    setDeleteTarget(admin);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget._id || deleteTarget.id;
    setActioningId(id);
    
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:5001';
      const token = localStorage.getItem('authToken');
      
      const res = await fetch(`${backendUrl}/admin/admin-user/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        }
      });

      if (res.status === 401 || res.status === 403) {
        setToast('Unauthorized. Please sign in as super admin.');
        setShowDeleteModal(false);
        return;
      }

      if (res.status === 404) {
        setToast('Admin user not found');
        setAdmins((prev) => prev.filter((x) => String(x._id || x.id) !== String(id)));
        setShowDeleteModal(false);
        setDeleteTarget(null);
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to delete admin user');
      }

      // Remove admin from list
      setAdmins((prev) => prev.filter((x) => String(x._id || x.id) !== String(id)));
      setToast('Admin user deleted successfully');
      setShowDeleteModal(false);
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
      setToast(err.message || 'Error deleting admin user');
    } finally {
      setActioningId(null);
    }
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <Layout>
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 mb-1">Content & Admin Management</h1>
              <p className="text-gray-500 text-sm">Manage admin users and system content</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
            >
              <UserPlus size={18} />
              Create Admin
            </button>
          </div>

          {/* Stats */}
          {!loading && !error && admins.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <AdminStatCard title="Total Admins" value={admins.length} tone="indigo" />
              <AdminStatCard title="Verified Admins" value={admins.filter(a => a.isVerified).length} tone="green" />
              <AdminStatCard title="Active" value={admins.length} tone="blue" />
            </div>
          )}
          
          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="text-gray-400">Loading admin users…</div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700 text-sm mb-6">
              {error}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && admins.length === 0 && (
            <div className="border border-dashed border-gray-300 rounded-lg p-12 text-center">
              <UserPlus size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-sm mb-4">No admin users found</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
              >
                Create First Admin
              </button>
            </div>
          )}

          {/* Table */}
          {!loading && admins.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {admins.map((admin) => {
                    const id = admin._id || admin.id;
                    return (
                      <tr key={id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{admin.fullName || 'Unknown'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{admin.email || ''}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Admin</span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {admin.isVerified ? (
                            <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Verified</span>
                          ) : (
                            <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Unverified</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => confirmDelete(admin)}
                            disabled={actioningId === id}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white text-xs rounded transition-colors"
                          >
                            {actioningId === id ? 'Deleting...' : 'Delete'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Toast */}
        {toast && (
          <div className={`fixed bottom-6 right-6 px-4 py-3 rounded text-sm text-white shadow-lg ${
            toast.includes('Error') || toast.includes('failed') || toast.toLowerCase().includes('unauthorized') 
              ? 'bg-red-600' 
              : 'bg-green-600'
          }`}>
            {toast}
          </div>
        )}
      </div>

      {/* Create Admin Modal */}
      <AppModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setFormData({ fullName: '', email: '', password: '' });
          setFormError('');
        }}
        title="Create New Admin User"
        widthClass="max-w-md"
      >
        <form onSubmit={handleCreateAdmin}>
          {formError && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm mb-4">
              {formError}
            </div>
          )}

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter full name"
                disabled={creating}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="admin@example.com"
                disabled={creating}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Minimum 5 characters"
                disabled={creating}
              />
              <p className="text-xs text-gray-500 mt-1">Password must be at least 5 characters</p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
              onClick={() => {
                setShowCreateModal(false);
                setFormData({ fullName: '', email: '', password: '' });
                setFormError('');
              }}
              disabled={creating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-400"
              disabled={creating}
            >
              {creating ? 'Creating...' : 'Create Admin'}
            </button>
          </div>
        </form>
      </AppModal>

      {/* Delete Confirmation Modal */}
      <AppModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Admin User"
        widthClass="max-w-md"
      >
        <p className="text-gray-600 text-sm mb-6">
          Are you sure you want to delete <strong>{deleteTarget?.fullName}</strong>? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
            onClick={() => setShowDeleteModal(false)}
            disabled={!!actioningId}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:bg-gray-400"
            onClick={handleDelete}
            disabled={!!actioningId}
          >
            {actioningId ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </AppModal>
    </Layout>
  );
};

export default ContentAdminManagement;
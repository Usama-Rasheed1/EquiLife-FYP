import React, { useEffect, useState, useMemo } from 'react';
import Layout from '../../components/Layout';
import AppModal from '../../components/AppModal';
import AdminStatCard from '../../components/AdminStatCard';

const Users = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [actionTarget, setActionTarget] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actioningId, setActioningId] = useState(null);
  const [toast, setToast] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Load all users
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:5001';
        const token = localStorage.getItem('authToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${backendUrl}/admin/users`, { headers });
        if (res.status === 401 || res.status === 403) {
          setError('Unauthorized. Please sign in as an admin.');
          return;
        }
        if (!res.ok) throw new Error('Failed to load users');
        const data = await res.json();
        const arr = Array.isArray(data) ? data : data.users || [];
        if (mounted) setUsers(arr);
      } catch (err) {
        console.error(err);
        if (mounted) setError(err.message || 'Error loading users');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const confirmAction = (user, type) => {
    setActionTarget(user);
    setActionType(type);
    setShowActionModal(true);
  };

  const handleAction = async () => {
    if (!actionTarget || !actionType) return;
    const id = actionTarget._id || actionTarget.id;
    setActioningId(id);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:5001';
      const token = localStorage.getItem('authToken');
      const endpoint = actionType === 'verify' ? 'verify-user' : 'user';
      const method = actionType === 'verify' ? 'PATCH' : 'DELETE';
      
      const res = await fetch(`${backendUrl}/admin/${endpoint}/${id}`, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
      });

      if (res.status === 401 || res.status === 403) {
        setToast('Unauthorized. Please sign in as admin.');
        setShowActionModal(false);
        return;
      }
      if (res.status === 404) {
        setToast('User not found');
        setUsers((prev) => prev.filter((x) => String(x._id || x.id) !== String(id)));
        setShowActionModal(false);
        setActionTarget(null);
        return;
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || `Failed to ${actionType} user`);
      }

      if (actionType === 'verify') {
        // Update user in list to mark as verified
        setUsers((prev) => prev.map((u) => String(u._id || u.id) === String(id) ? { ...u, isVerified: true } : u));
        setToast('User verified successfully');
      } else {
        // Delete: remove from list
        setUsers((prev) => prev.filter((x) => String(x._id || x.id) !== String(id)));
        setToast('User deleted successfully');
      }
      setShowActionModal(false);
      setActionTarget(null);
    } catch (err) {
      console.error(err);
      setToast(err.message || `Error ${actionType}ing user`);
    } finally {
      setActioningId(null);
    }
  };

  // Derived rows (filtered to exclude admins and superadmins)
  const allRows = useMemo(() => users
    .filter((u) => u.role !== 'admin' && u.role !== 'superadmin')
    .map((u) => ({
      id: u._id || u.id,
      fullName: u.fullName || 'Unknown',
      email: u.email || '',
      isVerified: u.isVerified || false,
      role: u.role || 'user',
      createdAt: u.createdAt || new Date().toISOString(),
      raw: u,
    })), [users]);

  const totalPages = Math.ceil(allRows.length / itemsPerPage);
  const rows = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return allRows.slice(startIdx, startIdx + itemsPerPage);
  }, [allRows, currentPage]);

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
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
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-gray-900 mb-1">Users</h1>
            <p className="text-gray-500 text-sm">Manage and verify user accounts</p>
          </div>

          {/* Stats */}
          {!loading && !error && allRows.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <AdminStatCard title="Total Users" value={allRows.length} subtitle={null} tone="indigo" />
              <AdminStatCard title="Verified" value={allRows.filter(r => r.isVerified).length}  tone="green" />
              <AdminStatCard title="Unverified" value={allRows.filter(r => !r.isVerified).length} tone="yellow" />
            </div>
          )}
          
          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="text-gray-400">Loading users…</div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700 text-sm mb-6">
              {error}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && allRows.length === 0 && (
            <div className="border border-dashed border-gray-300 rounded-lg p-12 text-center">
              <p className="text-gray-500 text-sm">No users found</p>
            </div>
          )}

          {/* Table */}
          {!loading && allRows.length > 0 && (
            <div>
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
                  {rows.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{r.fullName}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{r.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{r.role}</td>
                      <td className="px-6 py-4 text-sm">
                        {r.isVerified ? (
                          <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Verified</span>
                        ) : (
                          <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Unverified</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm flex gap-2">
                        {!r.isVerified && (
                          <button
                            onClick={() => confirmAction(r.raw, 'verify')}
                            disabled={actioningId === r.id}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-xs rounded transition-colors"
                          >
                            {actioningId === r.id ? 'Verifying...' : 'Verify'}
                          </button>
                        )}
                        <button
                          onClick={() => confirmAction(r.raw, 'delete')}
                          disabled={actioningId === r.id}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white text-xs rounded transition-colors"
                        >
                          {actioningId === r.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 px-4 py-3 border border-gray-200 border-t-0 rounded-b-lg bg-gray-50">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages} (Total: {allRows.length})
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400"
                >
                  Previous
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400"
                >
                  Next
                </button>
              </div>
            </div>
            </div>
          )}
        </div>

        {/* Toast */}
        {toast && (
          <div className={`fixed bottom-6 right-6 px-4 py-3 rounded text-sm text-white ${
            toast.includes('Error') || toast.includes('failed') ? 'bg-red-600' : 'bg-green-600'
          }`}>
            {toast}
          </div>
        )}
      </div>

      <AppModal
        isOpen={showActionModal}
        onClose={() => setShowActionModal(false)}
        title={actionType === 'verify' ? 'Verify User' : 'Delete User'}
        widthClass="max-w-md"
      >
        <p className="text-gray-600 text-sm mb-6">
          {actionType === 'verify'
            ? `Verify ${actionTarget?.fullName}?`
            : `Delete ${actionTarget?.fullName}? This action cannot be undone.`}
        </p>
        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
            onClick={() => setShowActionModal(false)}
            disabled={!!actioningId}
          >
            Cancel
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium text-white rounded ${
              actionType === 'verify' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'
            } disabled:bg-gray-400`}
            onClick={handleAction}
            disabled={!!actioningId}
          >
            {actioningId ? (actionType === 'verify' ? 'Verifying...' : 'Deleting...') : (actionType === 'verify' ? 'Verify' : 'Delete')}
          </button>
        </div>
      </AppModal>
    </Layout>
  );
};

export default Users;
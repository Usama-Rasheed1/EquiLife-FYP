import React, { useEffect, useState, useMemo } from "react";
import AppModal from "../../components/AppModal";
import AdminStatCard from "../../components/AdminStatCard";

const CommunityAbuse = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Load reported messages
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const backendUrl =
          import.meta.env.VITE_BACKEND_BASE_URL || "http://localhost:5001";
        const token = localStorage.getItem("authToken");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(
          `${backendUrl}/admin/community/reported-messages`,
          { headers }
        );
        if (res.status === 401 || res.status === 403) {
          setError("Unauthorized. Please sign in as an admin.");
          return;
        }
        if (!res.ok) throw new Error("Failed to load reported messages");
        const data = await res.json();
        const arr = Array.isArray(data) ? data : data.messages || [];
        // sort by abuseCount desc
        arr.sort((a, b) => (b.abuseCount || 0) - (a.abuseCount || 0));
        if (mounted) {setMessages(arr) ;console.log("Loaded messages:", arr);};
      } catch (err) {
        console.error(err);
        if (mounted) setError(err.message || "Error loading messages");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);



  const confirmDelete = (m) => {
    setDeleteTarget(m);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget._id || deleteTarget.id;
    setDeletingId(id);
    try {
      const backendUrl =
        import.meta.env.VITE_BACKEND_BASE_URL || "http://localhost:5001";
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${backendUrl}/admin/community/message/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      if (res.status === 401 || res.status === 403) {
        setToast("Unauthorized. Please sign in as admin.");
        setShowDeleteModal(false);
        return;
      }
      if (res.status === 404) {
        setToast("Message already deleted");
        setMessages((prev) =>
          prev.filter((x) => String(x._id || x.id) !== String(id))
        );
        setShowDeleteModal(false);
        setDeleteTarget(null);
        return;
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || "Failed to delete message");
      }
      setMessages((prev) =>
        prev.filter((x) => String(x._id || x.id) !== String(id))
      );
      setToast("Message deleted");
      setShowDeleteModal(false);
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
      setToast(err.message || "Error deleting message");
    } finally {
      setDeletingId(null);
    }
  };

  // Derived rows with severity from abuseCount
  const allRows = useMemo(
    () =>
      messages.map((m) => {
        const abuseCount = m.abuseCount || 0;
        const severity = abuseCount >= 6 ? 'high' : abuseCount >= 3 ? 'medium' : 'low';
        return {
          id: m._id || m.id,
          content: m.content || m.message || '',
          abuseCount,
          severity,
          senderName: m.sender?.fullName || m.sender?.name || 'Unknown',
          senderEmail: m.sender?.email || '',
          groupName: m.groupName || m.group || 'Community',
          createdAt: m.createdAt || m.timestamp || new Date().toISOString(),
          raw: m,
        };
      }),
    [messages]
  );

  // Pagination logic
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
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // compute max abuse to mark top message
  const maxAbuse = useMemo(() => {
    if (!rows || rows.length === 0) return 0;
    return rows.reduce((m, r) => Math.max(m, r.abuseCount || 0), 0);
  }, [rows]);

  return (
    <>
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">
              Community Abuse
            </h1>
            <p className="text-gray-600 text-sm">
              Reported messages that need review
            </p>
          </div>

          {/* Stats */}
          {!loading && !error && allRows.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <AdminStatCard title="Reported Messages" value={allRows.length} tone="indigo" />
              <AdminStatCard title="High Severity" value={allRows.filter((r) => r.severity === 'high').length} tone="red" />
              <AdminStatCard title="Medium Severity" value={allRows.filter((r) => r.severity === 'medium').length} tone="yellow" />
            </div>
          )}

          {loading && (
            <div className="py-8 text-center text-gray-500">
              Loading reported messages…
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm mb-4">
              {error}
            </div>
          )}

          {!loading && !error && rows.length === 0 && (
            <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-600">
              No reported messages
            </div>
          )}

          {!loading && allRows.length > 0 && (
            <div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-700">
                      Message
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-700">
                      From
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-700">
                      Group
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-700">
                      Reports
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((r) => (
                    <tr
                      key={r.id}
                      className={`transition-colors hover:bg-gray-50 ${
                          r.severity === 'high'
                            ? 'bg-red-50'
                            : r.severity === 'medium'
                            ? 'bg-yellow-50'
                            : ''
                        }`}
                    >
                      <td className="px-5 py-4 text-sm text-gray-900 max-w-xl truncate">
                        {r.content}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700">
                        <div className="font-medium">{r.senderName}</div>
                        <div className="text-xs text-gray-500">
                          {r.senderEmail}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700">
                        {r.groupName}
                      </td>
                      <td className="px-5 py-4 text-sm">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            r.severity === 'high'
                              ? 'bg-red-100 text-red-800'
                              : r.severity === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {r.abuseCount}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => confirmDelete(r.raw)}
                            disabled={deletingId === r.id}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white text-xs rounded"
                          >
                            {deletingId === r.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
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

          {toast && (
            <div
              className={`fixed bottom-6 right-6 px-4 py-2 rounded text-sm text-white ${
                toast.toLowerCase().includes("error")
                  ? "bg-red-600"
                  : "bg-green-600"
              }`}
            >
              {toast}
            </div>
          )}
        </div>
      </div>
      <AppModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete message"
        widthClass="max-w-md"
      >
        <p className="text-gray-700 text-sm mb-4">
          Delete this message? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded"
            onClick={() => setShowDeleteModal(false)}
            disabled={!!deletingId}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 text-sm text-white bg-red-600 rounded"
            onClick={handleDelete}
            disabled={!!deletingId}
          >
            {deletingId ? "Deleting..." : "Delete"}
          </button>
        </div>
      </AppModal>
    </>
  );
};

export default CommunityAbuse;

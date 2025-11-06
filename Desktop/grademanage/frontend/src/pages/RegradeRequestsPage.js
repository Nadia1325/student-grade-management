import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const RegradeRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      const res = await axios.get(`/api/regrades?${params}`);
      setRequests(res.data.requests || []);
    } catch (e) {
      toast.error('Failed to load regrade requests');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const act = async (id, action) => {
    try {
      await axios.put(`/api/regrades/${id}`, { status: action });
      toast.success(`Request ${action}`);
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Action failed');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Regrade Requests</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="denied">Denied</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Requests</h2>
        </div>
        {loading ? (
          <div className="p-6">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="p-6 text-center text-gray-600">No requests</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((r) => (
                  <tr key={r._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.student?.firstName} {r.student?.lastName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.course?.courseCode} • {r.course?.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.grade?.assignmentName} ({r.grade?.letterGrade})</td>
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-md truncate" title={r.reason}>{r.reason}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${r.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : r.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{r.status}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {r.status === 'pending' && (
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => act(r._id, 'approved')} className="px-3 py-1 rounded-md bg-green-600 text-white hover:bg-green-700">Approve</button>
                          <button onClick={() => act(r._id, 'denied')} className="px-3 py-1 rounded-md bg-red-600 text-white hover:bg-red-700">Deny</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegradeRequestsPage;


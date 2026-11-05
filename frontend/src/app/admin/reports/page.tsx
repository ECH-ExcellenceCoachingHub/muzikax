'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import ReportDetailsModal from '../../../components/ReportDetailsModal';

interface Report {
  _id: string;
  reporterId: {
    name: string;
    email: string;
  };
  trackId: {
    title: string;
    creatorId: string;
  };
  reason: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  adminNotes: string;
  adminId?: {
    name: string;
  };
  resolvedAt?: string;
  createdAt: string;
}

export default function AdminReportsPage() {
  const { isAuthenticated, userRole, isLoading } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReports, setTotalReports] = useState(0);
  const [filters, setFilters] = useState({
    status: '',
    reason: '',
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  useEffect(() => {
    if (isAuthenticated && userRole === 'admin') {
      fetchReports();
    }
  }, [isAuthenticated, userRole, filters]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      const queryParams = new URLSearchParams({
        page: filters.page.toString(),
        limit: filters.limit.toString(),
        ...(filters.status && { status: filters.status }),
        ...(filters.reason && { reason: filters.reason }),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      }).toString();

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reports?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }

      const data = await response.json();
      setReports(data.reports);
      setTotalPages(data.pages);
      setTotalReports(data.total);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching reports');
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handleStatusUpdate = async (reportId: string, newStatus: string, adminNotes: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reports/${reportId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            status: newStatus,
            adminNotes
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update report status');
      }

      // Refresh the reports list
      fetchReports();
      alert('Report status updated successfully');
    } catch (err: any) {
      console.error('Error updating report status:', err);
      alert(err.message || 'An error occurred while updating the report status');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-400">
            Error: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="w-full">
        <div className="max-w-7xl mx-auto w-full">
        <div className="flex justify-end mb-6">
          <div className="text-white">
            Total Reports: <span className="text-primary">{totalReports}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="card-bg rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Reason</label>
              <select
                value={filters.reason}
                onChange={(e) => handleFilterChange('reason', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Reasons</option>
                <option value="copyright">Copyright</option>
                <option value="inappropriate">Inappropriate</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="createdAt">Created Date</option>
                <option value="status">Status</option>
                <option value="reason">Reason</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Order</label>
              <select
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reports Table */}
        <div className="card-bg rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading reports...</div>
          ) : reports.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No reports found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-gray-800/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">Reporter</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">Track</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">Reason</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {reports.map((report) => (
                      <tr key={report._id} className="hover:bg-gray-800/30">
                        <td className="px-6 py-4 whitespace-nowrap pr-4">
                          <div className="text-sm text-white max-w-xs truncate">{report.reporterId.name}</div>
                          <div className="text-sm text-gray-400 max-w-xs truncate">{report.reporterId.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-white max-w-xs truncate">{report.trackId.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white capitalize">{report.reason}</div>
                          {report.description && (
                            <div className="text-sm text-gray-400 mt-1">{report.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            report.status === 'pending' ? 'bg-yellow-600/20 text-yellow-400' :
                            report.status === 'reviewed' ? 'bg-blue-600/20 text-blue-400' :
                            report.status === 'resolved' ? 'bg-green-600/20 text-green-400' :
                            'bg-gray-600/20 text-gray-400'
                          }`}>
                            {report.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <DetailsModal report={report} onUpdateStatus={handleStatusUpdate} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 bg-gray-800/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-400">
                  Showing {(currentPage - 1) * filters.limit + 1} to {Math.min(currentPage * filters.limit, totalReports)} of {totalReports} reports
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleFilterChange('page', Math.max(1, currentPage - 1).toString())}
                    disabled={currentPage === 1}
                    className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 bg-gray-700 text-white rounded">
                    {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => handleFilterChange('page', Math.min(totalPages, currentPage + 1).toString())}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  </div>
  );
}

function DetailsModal({ report, onUpdateStatus }: { report: Report; onUpdateStatus: (id: string, status: string, notes: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-primary hover:text-primary/80 font-medium"
      >
        View Details
      </button>
      
      <ReportDetailsModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        report={report} 
        onUpdateStatus={onUpdateStatus} 
      />
    </>
  );
}

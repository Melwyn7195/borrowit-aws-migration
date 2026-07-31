import { useState, useEffect, useCallback } from 'react';
import Sidebar_Admin from '../../components/sidebar/Sidebar_Admin';
import { Download, Trash2 } from 'lucide-react';
import AdminActionForm from './AdminActionForm';
import ReportDetailModal from './ReportDetailModal';
import ActionViewModal from './ActionViewModal';
import { API_BASE } from '../../api/config';

const AdminReportedUsers = () => {
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showActionForm, setShowActionForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showActionView, setShowActionView] = useState(false);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReportIds, setSelectedReportIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Fetch reports from API
  const fetchReports = useCallback(async (page = 1, status = '') => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      queryParams.append('page', page);
      queryParams.append('limit', pagination.limit);

      let url = `${API_BASE}/api/reports`;
      if (status && status !== 'All') {
        url = `${API_BASE}/api/reports/status/${status.toLowerCase()}`;
      }
      url += `?${queryParams.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setReports(data.data.reports);
        setPagination(data.data.pagination);
      } else {
        throw new Error(data.message || 'Failed to fetch reports');
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [pagination.limit]);

  useEffect(() => {
    setSelectedReportIds([]);
    setSelectAll(false);
    fetchReports(1, statusFilter);
  }, [statusFilter, fetchReports]);

  const handleResolveClick = (report) => {
    setSelectedReport(report);
    setShowActionForm(true);
  };

  const handleViewActionClick = (report) => {
    setSelectedReport(report);
    setShowActionView(true);
  };

  const handleViewDetailClick = (report) => {
    setSelectedReport(report);
    setShowDetailModal(true);
  };

  const handleCloseForm = () => {
    setShowActionForm(false);
    setSelectedReport(null);
    fetchReports(pagination.page, statusFilter);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedReport(null);
  };

  const handleCloseActionView = () => {
    setShowActionView(false);
    setSelectedReport(null);
  };

  const handleActionCancelled = (reportId) => {
    setReports(prevReports => 
      prevReports.map(report => 
        report.report_id === reportId 
          ? {
              ...report,
              status: 'pending',
              action: null,
              restriction_duration: 0,
              action_reason: null,
              mod_note: null,
              resolve_date: null
            }
          : report
      )
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedReportIds([]);
    } else {
      setSelectedReportIds(reports.map(report => report.report_id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectReport = (reportId) => {
    setSelectedReportIds(prev => {
      if (prev.includes(reportId)) {
        const newSelected = prev.filter(id => id !== reportId);
        setSelectAll(false);
        return newSelected;
      } else {
        const newSelected = [...prev, reportId];
        if (newSelected.length === reports.length) {
          setSelectAll(true);
        }
        return newSelected;
      }
    });
  };

  const handleDeleteReports = async () => {
    if (selectedReportIds.length === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedReportIds.length} report(s)?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const deletePromises = selectedReportIds.map(id => 
        fetch(`${API_BASE}/api/reports/${id}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          }
        })
      );

      const results = await Promise.all(deletePromises);
      const allSuccessful = results.every(res => res.ok);

      if (allSuccessful) {
        setSelectedReportIds([]);
        setSelectAll(false);
        fetchReports(pagination.page, statusFilter);
      } else {
        throw new Error('Some reports failed to delete');
      }
    } catch (err) {
      console.error('Error deleting reports:', err);
      alert('Failed to delete some reports. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePageChange = (newPage) => {
    setSelectedReportIds([]);
    setSelectAll(false);
    fetchReports(newPage, statusFilter);
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/reports?format=csv`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'reports.csv';
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const getStatusStyles = (status) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'resolved':
        return 'bg-green-100 text-green-700';
      case 'dismissed':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatStatus = (status) => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

const formatDateTime = (dateString) => {
    if (!dateString) return { short: 'N/A', full: 'N/A' };
    const dt = new Date(dateString);

    // Short: dd/mm/yyyy (UTC+7)
    const short = new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(dt);

    // Full: dd/mm/yyyy, HH:MM:SS (UTC+7)
    const full = new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(dt);

    return { short, full };
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar_Admin active="Resolve Violations" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading reports...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar_Admin active="Resolve Violations" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">Error loading reports</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => fetchReports(1, statusFilter)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar_Admin active="Resolve Violations" />
      
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Resolve Violations</h1>
              <p className="text-gray-600">Manage user reports and violations</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Admin User</span>
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Filters and Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">Filter by:</span>
                <div className="flex items-center gap-2">
                  {['All', 'Pending', 'Resolved', 'Dismissed'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setStatusFilter(filter)}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        statusFilter === filter
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedReportIds.length > 0 && (
                  <button 
                    onClick={handleDeleteReports}
                    disabled={isDeleting}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                    {isDeleting ? 'Deleting...' : `Delete Report(s) (${selectedReportIds.length})`}
                  </button>
                )}
                <button 
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300"
                      checked={selectAll}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Report ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reported User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reporting User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Filed
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                      No reports found
                    </td>
                  </tr>
                ) : (
                  reports.map((report) => {
                    const dateTime = formatDateTime(report.report_date);
                    const isSelected = selectedReportIds.includes(report.report_id);
                    return (
                      <tr key={report.report_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <input 
                            type="checkbox" 
                            className="rounded border-gray-300"
                            checked={isSelected}
                            onChange={() => handleSelectReport(report.report_id)}
                          />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{report.report_id}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {report.reported_user_username}
                          <span className="ml-2 text-xs text-gray-500">(ID:{report.reported_user_id})</span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {report.reporting_user_username}
                          <span className="ml-2 text-xs text-gray-500">(ID:{report.reporting_user_id})</span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <button 
                            onClick={() => handleViewDetailClick(report)}
                            className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors"
                          >
                            View details
                          </button>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600" title={dateTime.full}>
                          {dateTime.short}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusStyles(report.status)}`}>
                            {formatStatus(report.status)}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                          {report.status?.toLowerCase() === 'pending' ? (
                            <button 
                              onClick={() => handleResolveClick(report)}
                              className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                            >
                              Resolve
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleViewActionClick(report)}
                              className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                            >
                              View
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-white px-4 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {reports.length > 0 ? ((pagination.page - 1) * pagination.limit) + 1 : 0} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
              </div>
              <nav className="flex items-center gap-1">
                <button 
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, pagination.page - 2) + i;
                  if (pageNum > pagination.totalPages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        pageNum === pagination.page
                          ? 'text-white bg-red-500'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button 
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {showActionForm && (
        <AdminActionForm 
          report={selectedReport}
          onClose={handleCloseForm}
        />
      )}

      {showDetailModal && (
        <ReportDetailModal
          report={selectedReport}
          onClose={handleCloseDetailModal}
        />
      )}

      {showActionView && (
        <ActionViewModal
          report={selectedReport}
          onClose={handleCloseActionView}
          onActionCancelled={handleActionCancelled}
        />
      )}
    </div>
  );
};

export default AdminReportedUsers;
import { useState } from 'react';
import { X, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const ActionViewModal = ({ report, onClose, onActionCancelled }) => {
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState(null);

  if (!report) return null;

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const dt = new Date(dateString);

    const date = new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(dt);

    return date;
  };

  const formatStatus = (status) => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const getActionIcon = () => {
    const status = report.status?.toLowerCase();
    switch (status) {
      case 'resolved':
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case 'dismissed':
        return <XCircle className="h-12 w-12 text-gray-500" />;
      default:
        return <AlertCircle className="h-12 w-12 text-yellow-500" />;
    }
  };

  const getStatusColor = () => {
    const status = report.status?.toLowerCase();
    switch (status) {
      case 'resolved':
        return 'text-green-600';
      case 'dismissed':
        return 'text-gray-600';
      default:
        return 'text-yellow-600';
    }
  };

  const handleCancelAction = async () => {
    setIsCancelling(true);
    setError(null);

    try {
      const payload = {
        report_id: report.report_id,
        status: 'pending',
        action: null,
        unsuspend_date: null,
        action_reason: null,
        mod_note: null
      };

      const response = await fetch(`/api/reports/${report.report_id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        try {
          await fetch(`/api/users/${report.reported_user_id}`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'active' })
          });
        } catch (userErr) {
          console.error('Failed reverting user status:', userErr);
          // continue even if user update fails
        }
        // Call the callback to update parent component
        if (onActionCancelled) {
          onActionCancelled(report.report_id);
        }
        // Close the modal
        onClose();
      } else {
        throw new Error(data.message || 'Failed to cancel action');
      }
    } catch (err) {
      console.error('Error cancelling action:', err);
      setError(err.message);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Action Details</h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            disabled={isCancelling}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Status Header */}
          <div className="flex flex-col items-center mb-8 pb-6 border-b border-gray-200">
            {getActionIcon()}
            <h3 className={`text-2xl font-bold mt-4 ${getStatusColor()}`}>
              {formatStatus(report.status)}
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              Resolved on {formatDateTime(report.resolve_date)}
            </p>
          </div>

          {/* Report Information */}
                <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Report Information</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Report ID</p>
                    <p className="text-sm text-gray-900 font-semibold">#{report.report_id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Reason</p>
                    <p className="text-sm text-gray-900 font-semibold">{report.reason}</p>
                  </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Reported User</p>
                    <p className="text-sm text-gray-900 font-semibold">
                    {report.reported_user_username}
                    <span className="ml-2 text-xs text-gray-500"> (ID:{report.reported_user_id})</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Reporting User</p>
                    <p className="text-sm text-gray-900 font-semibold">
                    {report.reporting_user_username}
                    <span className="ml-2 text-xs text-gray-500"> (ID:{report.reporting_user_id})</span>
                    </p>
                  </div>
                  </div>
                  <div>
                  <p className="text-sm font-medium text-gray-500">Date Filed</p>
                  <p className="text-sm text-gray-900">{formatDateTime(report.report_date)}</p>
                  </div>
                </div>
                </div>

                {/* Action Taken */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Action Taken</h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Action Type</p>
                <p className="text-sm font-semibold text-gray-900">{report.action || 'No action specified'}</p>
              </div>

              {report.unsuspend_date && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Unsuspend Date</p>
                  <p className="text-lg font-bold text-orange-600">{formatDateTime(report.unsuspend_date)}</p>
                </div>
              )}

              {report.action_reason && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Reason for Action (User-facing)</p>
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <p className="text-sm text-gray-900">{report.action_reason}</p>
                  </div>
                </div>
              )}

              {report.mod_note && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Internal Moderator Notes</p>
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <p className="text-sm text-gray-600 italic">{report.mod_note}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleCancelAction}
              disabled={isCancelling}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Action'}
            </button>
            <button
              onClick={onClose}
              disabled={isCancelling}
              className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionViewModal;
import { useState } from 'react';
import { X } from 'lucide-react';

const AdminActionForm = ({ report, onClose }) => {
  const [selectedAction, setSelectedAction] = useState('');
  const [unsuspendDate, setUnsuspendDate] = useState('');
  const [reasonForAction, setReasonForAction] = useState('');
  const [moderatorNotes, setModeratorNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Map action types to API values
      const actionMap = {
        'warning': 'Official Warning',
        'suspension': 'Account Suspension',
        'nothing': 'Dismiss Report'
      };

      // Map action types to status
      const statusMap = {
        'warning': 'resolved',
        'suspension': 'resolved',
        'nothing': 'dismissed'
      };

      const payload = {
        status: statusMap[selectedAction],
        action: actionMap[selectedAction],
        unsuspend_date: selectedAction === 'suspension' ? (unsuspendDate || null) : null,
        action_reason: reasonForAction,
        mod_note: moderatorNotes
      };

      const response = await fetch(`/api/reports/${report.report_id}/`, {
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
        // update reported user's status when needed
        try {
          // suspend when applying account suspension
          if (selectedAction === 'suspension') {
            await fetch(`/api/users/${report.reported_user_id}`, {
              method: 'PUT',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'suspended' })
            });
          } else {
            // reactivate user if action is not suspension
              await fetch(`/api/users/${report.reported_user_id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'active' })
              });
          }
        } catch (userErr) {
          console.error('Failed updating user status:', userErr);
          // don't block closing the modal on user update failure
        }

        // Close modal and refresh parent
        onClose();
      } else {
        throw new Error(data.message || 'Failed to resolve report');
      }
    } catch (err) {
      console.error('Error resolving report:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Reported User Action</h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Report Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Report ID:</span> #{report.report_id}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Reported User:</span> {report.reported_user_username}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Reason:</span> {report.reason}
            </p>
          </div>

          {/* Select Action */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Select Action
            </label>
            <div className="space-y-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="action"
                  value="warning"
                  checked={selectedAction === 'warning'}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
                <span className="text-sm text-gray-900">Official Warning</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="action"
                  value="suspension"
                  checked={selectedAction === 'suspension'}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
                <span className="text-sm text-gray-900">Account Suspension</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="action"
                  value="nothing"
                  checked={selectedAction === 'nothing'}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
                <span className="text-sm text-gray-900">Dismiss Report</span>
              </label>
            </div>
          </div>

          {/* Action Details - Only show if action is selected */}
          {selectedAction && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-4">
                Action Details
              </label>
              <div className="space-y-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                {/* Unsuspend Date - Only show if "suspension" is selected */}
                {selectedAction === 'suspension' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Unsuspend Date:
                    </label>
                    <input
                      type="date"
                      value={unsuspendDate}
                      onChange={(e) => setUnsuspendDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Reason for Action (User-facing):
                  </label>
                  <textarea
                    value={reasonForAction}
                    onChange={(e) => setReasonForAction(e.target.value)}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                    placeholder="Enter reason that will be shown to the user"
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Internal Moderator Notes:
                  </label>
                  <textarea
                    value={moderatorNotes}
                    onChange={(e) => setModeratorNotes(e.target.value)}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                    placeholder="Enter internal notes for moderation team"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!selectedAction || isSubmitting}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Resolving...' : 'Mark as resolved'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminActionForm;
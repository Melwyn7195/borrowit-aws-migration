import { X } from 'lucide-react';
import { useState } from 'react';

const ReportDetailModal = ({ report, onClose }) => {
  const [expandedImage, setExpandedImage] = useState(null);
  if (!report) return null;

  const reportDetails = {
    'Harassment or Hate Speech': 'This report involves content or behavior that contains harassment, hate speech, threats, or discriminatory language targeting individuals or groups.',
    'Spam or Misleading Content': 'This report concerns unsolicited or repetitive content, fake information, scams, or misleading product descriptions designed to deceive users.',
    'Impersonation or Fake Account': 'This report involves an account pretending to be someone else, using stolen identity, or creating fake profiles to mislead other users.',
    'Intellectual Property Infringement': 'This report concerns unauthorized use of copyrighted content, trademarks, or other intellectual property without proper permission or licensing.',
    'Self-harm or Graphic Content': 'This report involves content that promotes self-harm, contains graphic violence, or displays disturbing imagery that violates community standards.',
    'Other': 'This report involves a violation that doesn\'t fit into the standard categories but still breaches community guidelines or terms of service.'
  };

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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Report Details</h2>
            <p className="text-sm text-gray-600 mt-1">
              Report ID: #{report.report_id}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Report Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Reported User
              </label>
              <p className="text-gray-900 font-medium">
                {report.reported_user_username}
                <span className="ml-2 text-xs text-gray-500">(ID:{report.reported_user_id})</span>
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Reporting User
              </label>
              <p className="text-gray-900 font-medium">
                {report.reporting_user_username}
                <span className="ml-2 text-xs text-gray-500">(ID:{report.reporting_user_id})</span>
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Date Filed
              </label>
              <p className="text-gray-900 font-medium">{formatDateTime(report.report_date)}</p>
            </div>
          </div>

          {/* Violation Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Violation Type
            </label>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-900 font-medium mb-2">{report.reason}</p>
              <p className="text-sm text-red-700">
                {reportDetails[report.reason] || 'No additional details available.'}
              </p>
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Report Description
            </label>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                {report.reason_extended || 'The reporting user has flagged this account for violating community guidelines. Please review the violation type above and take appropriate action based on the severity and context of the reported behavior.'}
              </p>
            </div>
          </div>

          {/* Evidence Images */}
          {report.image && report.image.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Evidence Images
              </label>
              <div className="grid grid-cols-2 gap-4">
                {report.image.map((img, index) => (
                  <div 
                    key={index} 
                    className="border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setExpandedImage(img)}
                  >
                    <img 
                      src={img} 
                      alt={`Evidence ${index + 1}`}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Available';
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
      {/* Expanded Image Modal */}
      {expandedImage && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4"
          onClick={() => setExpandedImage(null)}
        >
          <button 
            onClick={() => setExpandedImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="h-6 w-6 text-white" />
          </button>
          <img 
            src={expandedImage}
            alt="Expanded evidence"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default ReportDetailModal;
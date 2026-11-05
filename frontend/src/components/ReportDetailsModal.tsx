'use client';

import { useEffect } from 'react';
import Portal from './Portal';

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

interface ReportDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: Report;
  onUpdateStatus: (id: string, status: string, notes: string) => void;
}

export default function ReportDetailsModal({ 
  isOpen, 
  onClose, 
  report, 
  onUpdateStatus 
}: ReportDetailsModalProps) {
  if (!isOpen) return null;

  // Manage body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup function
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const status = formData.get('status') as Report['status'];
    const notes = formData.get('adminNotes') as string;
    
    onUpdateStatus(report._id, status, notes);
    onClose();
  };

  return (
    <Portal>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100000] flex items-center justify-center p-4 pointer-events-auto">
        <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-text-primary">Report Details</h3>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <h4 className="text-sm font-medium text-gray-400">Reporter</h4>
                <p className="text-white">{report.reporterId.name} ({report.reporterId.email})</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-400">Track</h4>
                <p className="text-white">{report.trackId.title}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-400">Reason</h4>
                <p className="text-white capitalize">{report.reason}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-400">Description</h4>
                <p className="text-white">{report.description || 'No additional details provided'}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-400">Reported On</h4>
                <p className="text-white">{new Date(report.createdAt).toLocaleString()}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-400">Status</h4>
                <p className="text-white capitalize">{report.status}</p>
              </div>

              {report.adminNotes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-400">Admin Notes</h4>
                  <p className="text-white">{report.adminNotes}</p>
                </div>
              )}

              {report.resolvedAt && (
                <div>
                  <h4 className="text-sm font-medium text-gray-400">Resolved On</h4>
                  <p className="text-white">{new Date(report.resolvedAt).toLocaleString()}</p>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="border-t border-gray-700 pt-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Update Status</label>
                <select
                  name="status"
                  defaultValue={report.status}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Admin Notes</label>
                <textarea
                  name="adminNotes"
                  defaultValue={report.adminNotes || ''}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Add notes about this report..."
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-700 rounded-lg text-white hover:bg-gray-800/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary/90 rounded-lg text-white transition-colors"
                >
                  Update Status
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Portal>
  );
}
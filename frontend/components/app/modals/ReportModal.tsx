'use client';

import { useState } from 'react';

import Modal from '@/components/app/common/Modal';
import { reportContent, getReportReasons, ReportReason } from '@/utils/content/reportUtils';
import { PrimaryButton, SecondaryButton } from '@/components/app/common/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useOnlineStatus } from '@/hooks/common/useOnlineStatus';
import { getErrorMessage } from '@/utils/error/getErrorMessage';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentType: 'post' | 'comment';
  contentId: string;
  postId?: string; // For comments, the ID of the post the comment belongs to
  reportedUserHandle: string;
  reportedUserDisplayName: string;
  reportedUserId?: string | null;
  currentUserHandle: string;
  onReport: () => void; // Callback after successful report
}

export default function ReportModal({
  isOpen,
  onClose,
  contentType,
  contentId,
  postId,
  reportedUserHandle,
  reportedUserDisplayName,
  reportedUserId,
  currentUserHandle,
  onReport,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason | ''>('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const isOnline = useOnlineStatus();
  const { session } = useAuth();
  const accessToken = session?.access_token ?? null;
  const reportReasons = getReportReasons();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedReason || !accessToken) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await reportContent(
        {
          contentType,
          contentId,
          postId: contentType === 'comment' ? postId : undefined,
          reportedUserHandle,
          reporterHandle: currentUserHandle,
          reason: selectedReason as ReportReason,
          description: selectedReason === 'other' ? description : undefined,
          reportedUserId: reportedUserId ?? null,
        },
        accessToken
      );

      setShowConfirmation(true);
      // Close modal after 2 seconds
      setTimeout(() => {
        onReport();
        handleClose();
      }, 2000);
    } catch (error) {
      setSubmitError(getErrorMessage(error, 'Failed to submit report. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedReason('');
      setDescription('');
      setSubmitError(null);
      setShowConfirmation(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="md"
      className="p-6"
      closeOnOverlayClick={!isSubmitting}
    >
          {showConfirmation ? (
            <div className="text-center py-4">
              <div className="mb-4">
                <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Report submitted</h2>
              <p className="text-gray-400">
                Thank you for reporting. We'll review this {contentType}.
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-white mb-2">
                Report {contentType === 'post' ? 'post' : 'comment'}
              </h2>
              <p className="text-gray-400 mb-6 text-sm">
                Help us understand the problem. Why are you reporting this {contentType} from{' '}
                <span className="font-semibold text-white">@{reportedUserHandle}</span>?
              </p>

              <form onSubmit={handleSubmit}>
                {/* Report Reasons */}
                <div className="space-y-2 mb-6">
                  {reportReasons.map((reason) => (
                    <label
                      key={reason.value}
                      className="flex items-start space-x-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={reason.value}
                        checked={selectedReason === reason.value}
                        onChange={(e) => setSelectedReason(e.target.value as ReportReason)}
                        className="mt-1 w-4 h-4 text-cyan-500 bg-black border-white/20 focus:ring-cyan-500 focus:ring-2"
                      />
                      <span className="text-white text-sm">{reason.label}</span>
                    </label>
                  ))}
                </div>

                {/* Description for "Other" reason */}
                {selectedReason === 'other' && (
                  <div className="mb-6">
                    <label className="block text-white text-sm font-medium mb-2">
                      Please describe the issue
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Provide more details about why you're reporting this content..."
                      rows={4}
                      className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                    />
                  </div>
                )}

                {submitError && (
                  <p className="mb-4 text-sm text-red-400" role="alert">
                    {submitError}
                  </p>
                )}

                {/* Actions */}
                <div className="flex space-x-3">
                  <SecondaryButton
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="flex-1 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </SecondaryButton>
                  <button
                    type="submit"
                    disabled={!selectedReason || isSubmitting || !isOnline}
                    className="flex-1 rounded-xl !bg-red-500 hover:!bg-red-600 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2"
                    title={!isOnline ? 'You are offline' : undefined}
                  >
                    {isSubmitting ? 'Submitting...' : !isOnline ? 'Offline' : 'Report'}
                  </button>
                </div>
              </form>
            </>
          )}
    </Modal>
  );
}


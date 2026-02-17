'use client';

import { useState } from 'react';
import Modal from '@/components/app/common/Modal';
import { PrimaryButton, SecondaryButton } from '@/components/app/common/Button';
import FormInput from '@/components/app/common/FormInput';
import FormErrorMessage from '@/components/app/common/FormErrorMessage';
import LoadingState from '@/components/app/common/LoadingState';
import { getErrorMessage } from '@/utils/error/getErrorMessage';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  onConfirm: () => Promise<void>;
}

export default function DeleteAccountModal({
  isOpen,
  onClose,
  username,
  onConfirm,
}: DeleteAccountModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfirmed = confirmText.toLowerCase() === username.toLowerCase();
  const showMismatchError = confirmText.length > 0 && !isConfirmed;

  const handleClose = () => {
    if (!isSubmitting) {
      setConfirmText('');
      setError(null);
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirmed || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onConfirm();
      handleClose();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete account'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Delete account"
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-gray-300 text-sm">
          This action is permanent. All your data that includes posts, comments, followers, and profile will be
          permanently deleted and cannot be recovered.
        </p>
        <p className="text-gray-300 text-sm">
          Type <span className="font-mono font-semibold text-white">{username}</span> to confirm:
        </p>
        <FormInput
          label=""
          id="confirmUsername"
          placeholder={username}
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          disabled={isSubmitting}
          className="font-mono"
          autoComplete="off"
          error={showMismatchError ? 'Username does not match' : undefined}
        />
        <FormErrorMessage message={error ?? undefined} className="mt-1" />
        <div className="flex gap-3 pt-2">
          <SecondaryButton
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </SecondaryButton>
          <PrimaryButton
            type="submit"
            disabled={!isConfirmed || isSubmitting}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white border-red-600"
          >
            {isSubmitting ? (
              <LoadingState text="Deleting..." size="sm" inline className="text-white" />
            ) : (
              'Delete my account'
            )}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}

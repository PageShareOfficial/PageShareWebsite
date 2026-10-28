'use client';

import DeleteAccountModal from '@/components/app/modals/DeleteAccountModal';

interface DeleteAccountSectionProps {
  username: string;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

/** Danger-zone delete account card and confirmation modal. */
export default function DeleteAccountSection({
  username,
  isOpen,
  onOpen,
  onClose,
  onConfirm,
}: DeleteAccountSectionProps) {
  return (
    <>
      <div className="border-t border-white/10 px-2 py-8 lg:px-4">
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <h2 className="mb-1 text-lg font-bold text-red-400">Delete account</h2>
          <p className="mb-4 text-sm text-gray-400">
            Permanently delete your account and all associated data. This action cannot be
            undone.
          </p>
          <button
            type="button"
            onClick={onOpen}
            className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700"
          >
            Delete my account
          </button>
        </div>
      </div>
      <DeleteAccountModal
        isOpen={isOpen}
        onClose={onClose}
        username={username}
        onConfirm={onConfirm}
      />
    </>
  );
}

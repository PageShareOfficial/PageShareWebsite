'use client';

import { BarChart3, Bookmark, Users } from 'lucide-react';
import Modal from '@/components/app/common/Modal';
import { PrimaryButton, SecondaryButton } from '@/components/app/common/Button';
import VerifiedTickIcon from '@/components/app/common/VerifiedTickIcon';
import { usePremiumOverlay } from '@/contexts/PremiumOverlayContext';

interface SaveAnalystUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const INVESTOR_PERKS = [
  {
    icon: Bookmark,
    title: 'Save analysts from the leaderboard',
    description: 'Bookmark top performers and build a personal list you can revisit anytime.',
  },
  {
    icon: BarChart3,
    title: 'Track verified performance',
    description: 'Follow prediction history, outcomes, and scorecards in one place.',
  },
  {
    icon: Users,
    title: 'Invest with real signal',
    description: 'Discover credible analysts and focus on traders with a proven track record.',
  },
] as const;

export default function SaveAnalystUpgradeModal({
  isOpen,
  onClose,
}: SaveAnalystUpgradeModalProps) {
  const { openPremium } = usePremiumOverlay();

  const handleUpgrade = () => {
    onClose();
    openPremium();
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Save analysts"
      maxWidth="md"
      contentClassName="p-4 sm:p-6"
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <VerifiedTickIcon variant="investor" size={18} title="Investor subscriber" />
            <span className="text-sm font-semibold text-emerald-300">Investor plan</span>
          </div>
          <p className="text-sm text-gray-300">
            Discover real signal. Track performance. Invest smarter.
          </p>
        </div>

        <ul className="space-y-3">
          {INVESTOR_PERKS.map((perk) => {
            const Icon = perk.icon;
            return (
              <li
                key={perk.title}
                className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/40">
                  <Icon className="h-4 w-4 text-emerald-400" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">{perk.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-gray-400">{perk.description}</p>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="flex gap-3 pt-1">
          <SecondaryButton
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl py-2.5"
          >
            Cancel
          </SecondaryButton>
          <PrimaryButton
            type="button"
            onClick={handleUpgrade}
            className="flex-1 rounded-xl py-2.5 font-semibold"
          >
            View Investor plan
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}

'use client';

import { BadgeCheck, LineChart, Users } from 'lucide-react';
import Modal from '@/components/app/common/Modal';
import { PrimaryButton, SecondaryButton } from '@/components/app/common/Button';
import VerifiedTickIcon from '@/components/app/common/VerifiedTickIcon';
import { usePremiumOverlay } from '@/contexts/PremiumOverlayContext';

interface PredictionSubmitUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ANALYST_PERKS = [
  {
    icon: LineChart,
    title: 'Publish Your Predictions',
    description: 'Lock in your market calls with a permanent, trackable record.',
  },
  {
    icon: BadgeCheck,
    title: 'Build Credibility',
    description: 'Show a public performance scorecard investors can trust.',
  },
  {
    icon: Users,
    title: 'Get discovered by Investors',
    description: 'Climb the leaderboard and grow your influence on PageShare.',
  },
] as const;

export default function PredictionSubmitUpgradeModal({
  isOpen,
  onClose,
}: PredictionSubmitUpgradeModalProps) {
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
      title="Submit predictions"
      maxWidth="md"
      contentClassName="p-4 sm:p-6"
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-blue-500/25 bg-blue-500/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <VerifiedTickIcon variant="analyst" size={18} title="Analyst subscriber" />
            <span className="text-sm font-semibold text-blue-300">Analyst plan</span>
          </div>
          <p className="text-sm text-gray-300">
            Build credibility. Publish predictions. Grow your influence.
          </p>
        </div>

        <ul className="space-y-3">
          {ANALYST_PERKS.map((perk) => {
            const Icon = perk.icon;
            return (
              <li
                key={perk.title}
                className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/40">
                  <Icon className="h-4 w-4 text-blue-400" aria-hidden />
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
            View Analyst plan
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}

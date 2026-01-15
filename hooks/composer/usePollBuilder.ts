import { useState } from 'react';

interface UsePollBuilderResult {
  showPoll: boolean;
  pollOptions: string[];
  pollDuration: number;
  setShowPoll: (show: boolean) => void;
  addPollOption: () => void;
  removePollOption: (index: number) => void;
  updatePollOption: (index: number, value: string) => void;
  setPollDuration: (duration: number) => void;
  getPollData: () => { options: string[]; duration: number } | null;
  resetPoll: () => void;
}

/**
 * Hook to manage poll creation
 * Handles poll options, duration, and validation
 */
export function usePollBuilder(
  initialShowPoll: boolean = false,
  initialOptions: string[] = ['', ''],
  initialDuration: number = 1
): UsePollBuilderResult {
  const [showPoll, setShowPoll] = useState(initialShowPoll);
  const [pollOptions, setPollOptions] = useState<string[]>(initialOptions);
  const [pollDuration, setPollDuration] = useState(initialDuration);

  const addPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const getPollData = (): { options: string[]; duration: number } | null => {
    if (!showPoll) return null;
    
    // Filter out empty options
    const validOptions = pollOptions.filter(opt => opt.trim().length > 0);
    
    // Need at least 2 options
    if (validOptions.length < 2) return null;
    
    return {
      options: validOptions,
      duration: pollDuration,
    };
  };

  const resetPoll = () => {
    setShowPoll(false);
    setPollOptions(['', '']);
    setPollDuration(1);
  };

  return {
    showPoll,
    pollOptions,
    pollDuration,
    setShowPoll,
    addPollOption,
    removePollOption,
    updatePollOption,
    setPollDuration,
    getPollData,
    resetPoll,
  };
}


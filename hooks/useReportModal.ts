import { useState } from 'react';

export function useReportModal() {
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportContentType, setReportContentType] = useState<'post' | 'comment'>('post');
  const [reportContentId, setReportContentId] = useState<string>('');
  const [reportPostId, setReportPostId] = useState<string | undefined>(undefined);
  const [reportUserHandle, setReportUserHandle] = useState<string>('');
  const [reportUserDisplayName, setReportUserDisplayName] = useState<string>('');

  const handleReportClick = (
    contentType: 'post' | 'comment',
    contentId: string,
    userHandle: string,
    userDisplayName: string,
    postId?: string
  ) => {
    setReportContentType(contentType);
    setReportContentId(contentId);
    setReportPostId(postId);
    setReportUserHandle(userHandle);
    setReportUserDisplayName(userDisplayName);
    setReportModalOpen(true);
  };

  const handleReportSubmitted = () => {
    setReportModalOpen(false);
  };

  return {
    reportModalOpen,
    reportContentType,
    reportContentId,
    reportPostId,
    reportUserHandle,
    reportUserDisplayName,
    handleReportClick,
    handleReportSubmitted,
  };
}


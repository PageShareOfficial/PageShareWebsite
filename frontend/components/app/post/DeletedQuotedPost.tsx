interface DeletedQuotedPostProps {
  className?: string;
}

/** Shown inside a quote post when the post it quoted no longer exists. */
export default function DeletedQuotedPost({ className = 'mb-3' }: DeletedQuotedPostProps) {
  return (
    <div
      className={`p-3 rounded-xl border border-white/10 bg-white/5 text-sm text-gray-400 ${className}`}
    >
      This post has been deleted.
    </div>
  );
}

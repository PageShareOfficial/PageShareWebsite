"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import Image from "next/image";
import { FiSend } from "react-icons/fi";

interface Comment {
  id: string;
  body: string;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  replies: Comment[];
}

interface CommentsSectionProps {
  postId: string;
}

export function CommentsSection({ postId }: CommentsSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      // Get slug from URL
      const slug = window.location.pathname.split("/").pop();
      const res = await fetch(`/api/posts/${slug}/comments`);
      const data = await res.json();
      setComments(data);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !session) return;

    try {
      const slug = window.location.pathname.split("/").pop();
      const res = await fetch(`/api/posts/${slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: newComment }),
      });

      if (res.ok) {
        setNewComment("");
        fetchComments();
      }
    } catch (error) {
      console.error("Failed to post comment:", error);
    }
  };

  const handleReply = async (parentId: string) => {
    if (!replyText.trim() || !session) return;

    try {
      const slug = window.location.pathname.split("/").pop();
      const res = await fetch(`/api/posts/${slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: replyText, parentId }),
      });

      if (res.ok) {
        setReplyText("");
        setReplyingTo(null);
        fetchComments();
      }
    } catch (error) {
      console.error("Failed to post reply:", error);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-serif font-bold mb-8">Comments</h2>

      {/* New Comment Form */}
      {session ? (
        <form onSubmit={handleSubmit} className="mb-12">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            rows={4}
            className="w-full bg-white/5 border border-white/20 px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-white/40 mb-3"
          />
          <button
            type="submit"
            className="px-6 py-2 border border-white/20 hover:border-white/40 transition-colors flex items-center gap-2"
          >
            <FiSend size={16} />
            Post Comment
          </button>
        </form>
      ) : (
        <div className="mb-12 p-6 border border-white/10 text-center">
          <p className="text-white/70 mb-4">Sign in to join the conversation</p>
          <a
            href="/auth/signin"
            className="inline-block px-6 py-2 border border-white/20 hover:border-white/40 transition-colors"
          >
            Sign In
          </a>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-8">
        {comments.map((comment) => (
          <div key={comment.id} className="border-l-4 border-white/10 pl-6">
            <div className="flex items-start gap-4 mb-2">
              {comment.user.image ? (
                <Image
                  src={comment.user.image}
                  alt={comment.user.name || ""}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  {comment.user.name?.[0] || comment.user.email[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">
                    {comment.user.name || comment.user.email}
                  </span>
                  <span className="text-sm text-white/60">
                    {format(new Date(comment.createdAt), "MMM d, yyyy 'at' h:mm a")}
                  </span>
                </div>
                <p className="text-white/90 mb-3">{comment.body}</p>
                {session && (
                  <button
                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    Reply
                  </button>
                )}
              </div>
            </div>

            {/* Reply Form */}
            {replyingTo === comment.id && (
              <div className="ml-14 mt-4">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/20 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-white/40 mb-2"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReply(comment.id)}
                    className="px-4 py-1 text-sm border border-white/20 hover:border-white/40 transition-colors"
                  >
                    Post Reply
                  </button>
                  <button
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyText("");
                    }}
                    className="px-4 py-1 text-sm border border-white/20 hover:border-white/40 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Replies */}
            {comment.replies.length > 0 && (
              <div className="ml-14 mt-4 space-y-4">
                {comment.replies.map((reply) => (
                  <div key={reply.id} className="flex items-start gap-3">
                    {reply.user.image ? (
                      <Image
                        src={reply.user.image}
                        alt={reply.user.name || ""}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs">
                        {reply.user.name?.[0] || reply.user.email[0].toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">
                          {reply.user.name || reply.user.email}
                        </span>
                        <span className="text-xs text-white/60">
                          {format(new Date(reply.createdAt), "MMM d, yyyy")}
                        </span>
                      </div>
                      <p className="text-sm text-white/90">{reply.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {comments.length === 0 && (
        <p className="text-white/60 text-center py-12">No comments yet. Be the first to comment!</p>
      )}
    </div>
  );
}


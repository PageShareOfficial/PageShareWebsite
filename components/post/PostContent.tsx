"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { FiHeart, FiBookmark, FiShare2 } from "react-icons/fi";
import { useSession } from "next-auth/react";
import { ReadingProgress } from "./ReadingProgress";
import { CommentsSection } from "./CommentsSection";
import { MDXRemote } from "@/components/mdx/MDXRemote";

interface Post {
  id: string;
  title: string;
  excerpt: string | null;
  contentMdx: string;
  coverImage: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  author: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    bio: string | null;
  };
  category: {
    name: string;
    slug: string;
  } | null;
  tags: Array<{
    tag: {
      name: string;
      slug: string;
    };
  }>;
  _count: {
    likes: number;
    bookmarks: number;
    comments: number;
  };
}

interface PostContentProps {
  post: Post;
}

export function PostContent({ post }: PostContentProps) {
  const { data: session } = useSession();
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likesCount, setLikesCount] = useState(post._count.likes);
  const [bookmarksCount, setBookmarksCount] = useState(post._count.bookmarks);

  useEffect(() => {
    if (session) {
      // Check initial state - get slug from post
      const slug = window.location.pathname.split("/").pop();
      fetch(`/api/posts/${slug}/check-interactions`)
        .then((res) => res.json())
        .then((data) => {
          setIsLiked(data.isLiked);
          setIsBookmarked(data.isBookmarked);
        })
        .catch(console.error);
    }
  }, [session]);

  const handleLike = async () => {
    if (!session) {
      window.location.href = "/auth/signin";
      return;
    }

    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikesCount((prev) => (newLiked ? prev + 1 : prev - 1));

    try {
      const res = await fetch(`/api/posts/${post.slug}/like`, {
        method: "POST",
      });
      if (!res.ok) {
        setIsLiked(!newLiked);
        setLikesCount((prev) => (newLiked ? prev - 1 : prev + 1));
      }
    } catch (error) {
      setIsLiked(!newLiked);
      setLikesCount((prev) => (newLiked ? prev - 1 : prev + 1));
    }
  };

  const handleBookmark = async () => {
    if (!session) {
      window.location.href = "/auth/signin";
      return;
    }

    const newBookmarked = !isBookmarked;
    setIsBookmarked(newBookmarked);
    setBookmarksCount((prev) => (newBookmarked ? prev + 1 : prev - 1));

    try {
      const res = await fetch(`/api/posts/${post.slug}/bookmark`, {
        method: "POST",
      });
      if (!res.ok) {
        setIsBookmarked(!newBookmarked);
        setBookmarksCount((prev) => (newBookmarked ? prev - 1 : prev + 1));
      }
    } catch (error) {
      setIsBookmarked(!newBookmarked);
      setBookmarksCount((prev) => (newBookmarked ? prev - 1 : prev + 1));
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.excerpt || "",
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <ReadingProgress />
      
      {/* Header */}
      <header className="mb-12">
        <div className="mb-6">
          {post.category && (
            <a
              href={`/category/${post.category.slug}`}
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              {post.category.name}
            </a>
          )}
        </div>
        <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6 leading-tight">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="text-xl text-white/70 mb-8">{post.excerpt}</p>
        )}

        {/* Author & Meta */}
        <div className="flex items-center gap-4 mb-8 pb-8 border-b border-white/10">
          {post.author.image ? (
            <Image
              src={post.author.image}
              alt={post.author.name || ""}
              width={48}
              height={48}
              className="rounded-full"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
              {post.author.name?.[0] || post.author.email[0].toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <div className="font-medium">
              {post.author.name || post.author.email}
            </div>
            <div className="text-sm text-white/60">
              {format(new Date(post.publishedAt || post.createdAt), "MMMM d, yyyy")} • {" "}
              {Math.ceil(post.contentMdx.split(" ").length / 200)} min read
            </div>
          </div>
        </div>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {post.tags.map(({ tag }) => (
              <a
                key={tag.slug}
                href={`/tag/${tag.slug}`}
                className="px-3 py-1 border border-white/20 hover:border-white/40 transition-colors text-sm"
              >
                {tag.name}
              </a>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 px-4 py-2 border transition-colors ${
              isLiked
                ? "border-white bg-white/10"
                : "border-white/20 hover:border-white/40"
            }`}
          >
            <FiHeart size={18} fill={isLiked ? "white" : "none"} />
            <span>{likesCount}</span>
          </button>
          <button
            onClick={handleBookmark}
            className={`flex items-center gap-2 px-4 py-2 border transition-colors ${
              isBookmarked
                ? "border-white bg-white/10"
                : "border-white/20 hover:border-white/40"
            }`}
          >
            <FiBookmark size={18} fill={isBookmarked ? "white" : "none"} />
            <span>{bookmarksCount}</span>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 border border-white/20 hover:border-white/40 transition-colors"
          >
            <FiShare2 size={18} />
            Share
          </button>
        </div>
      </header>

      {/* Cover Image */}
      {post.coverImage && (
        <div className="relative aspect-video mb-12 overflow-hidden border border-white/10">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="prose prose-invert prose-lg max-w-none">
        <MDXRemote source={post.contentMdx} />
      </div>

      {/* Comments */}
      <div className="mt-16 pt-16 border-t border-white/10">
        <CommentsSection postId={post.id} />
      </div>
    </article>
  );
}


import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";

interface RelatedPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  author: {
    name: string | null;
    email: string;
  };
}

interface PostSidebarProps {
  post: {
    id: string;
    author: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
  };
  related: RelatedPost[];
}

export function PostSidebar({ post, related }: PostSidebarProps) {
  return (
    <aside className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-white/10">
      {/* Author Follow */}
      <div className="mb-12 p-6 border border-white/10">
        <h3 className="text-lg font-serif font-bold mb-4">About the Author</h3>
        <div className="flex items-center gap-4 mb-4">
          {post.author.image ? (
            <Image
              src={post.author.image}
              alt={post.author.name || ""}
              width={64}
              height={64}
              className="rounded-full"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
              {post.author.name?.[0] || post.author.email[0].toUpperCase()}
            </div>
          )}
          <div>
            <div className="font-medium">{post.author.name || post.author.email}</div>
          </div>
        </div>
        <Link
          href={`/author/${post.author.id}`}
          className="block text-center px-4 py-2 border border-white/20 hover:border-white/40 transition-colors"
        >
          View Profile
        </Link>
      </div>

      {/* Related Posts */}
      {related.length > 0 && (
        <div>
          <h3 className="text-lg font-serif font-bold mb-6">Related Stories</h3>
          <div className="space-y-6">
            {related.map((relatedPost) => (
              <Link
                key={relatedPost.id}
                href={`/post/${relatedPost.slug}`}
                className="block group"
              >
                {relatedPost.coverImage && (
                  <div className="relative aspect-video mb-3 overflow-hidden border border-white/10">
                    <Image
                      src={relatedPost.coverImage}
                      alt={relatedPost.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}
                <h4 className="text-lg font-serif font-bold mb-2 group-hover:underline">
                  {relatedPost.title}
                </h4>
                {relatedPost.excerpt && (
                  <p className="text-sm text-white/70 line-clamp-2 mb-2">
                    {relatedPost.excerpt}
                  </p>
                )}
                <div className="text-xs text-white/60">
                  {relatedPost.author.name || relatedPost.author.email} • {" "}
                  {format(
                    new Date(relatedPost.publishedAt || relatedPost.createdAt),
                    "MMM d, yyyy"
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}


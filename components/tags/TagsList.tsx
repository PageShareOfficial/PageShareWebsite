import Link from "next/link";

interface Tag {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

interface TagsListProps {
  tags: Tag[];
}

export function TagsList({ tags }: TagsListProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-serif font-bold mb-12">All Tags</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tags.map((tag) => (
          <Link
            key={tag.id}
            href={`/tag/${tag.slug}`}
            className="block border border-white/10 hover:border-white/30 p-6 transition-all duration-300"
          >
            <h2 className="text-2xl font-serif font-bold mb-2">{tag.name}</h2>
            {tag.description && (
              <p className="text-white/70">{tag.description}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}


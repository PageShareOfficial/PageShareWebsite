"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MDXRemote } from "@/components/mdx/MDXRemote";

interface MDXEditorProps {
  postId?: string;
}

export function MDXEditor({ postId }: MDXEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED" | "SCHEDULED">("DRAFT");
  const [scheduledFor, setScheduledFor] = useState("");
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [allTags, setAllTags] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(!!postId);
  const [saving, setSaving] = useState(false);
  const [splitView, setSplitView] = useState(true);
  const [versions, setVersions] = useState<Array<{ id: string; content: string; createdAt: Date }>>([]);

  useEffect(() => {
    if (postId) {
      fetchPost();
    }
    fetchCategories();
    fetchTags();
  }, [postId]);

  useEffect(() => {
    // Auto-save draft every 30 seconds
    if (!postId && content) {
      const timer = setTimeout(() => {
        handleSave(true);
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [content, title, excerpt]);

  const fetchPost = async () => {
    try {
      const res = await fetch(`/api/posts/edit/${postId}`);
      const data = await res.json();
      setTitle(data.title);
      setSlug(data.slug);
      setExcerpt(data.excerpt || "");
      setContent(data.contentMdx);
      setCategoryId(data.categoryId || "");
      setStatus(data.status);
      setScheduledFor(data.scheduledFor ? new Date(data.scheduledFor).toISOString().slice(0, 16) : "");
      setTags(data.tags.map((t: any) => t.tag.name));
      fetchVersions();
    } catch (error) {
      console.error("Failed to fetch post:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const fetchTags = async () => {
    try {
      const res = await fetch("/api/tags");
      const data = await res.json();
      setAllTags(data);
    } catch (error) {
      console.error("Failed to fetch tags:", error);
    }
  };

  const fetchVersions = async () => {
    if (!postId) return;
    try {
      const res = await fetch(`/api/posts/edit/${postId}/versions`);
      const data = await res.json();
      setVersions(data);
    } catch (error) {
      console.error("Failed to fetch versions:", error);
    }
  };

  const handleSave = async (isAutosave = false) => {
    if (!title.trim() || !content.trim()) return;

    setSaving(true);
    try {
      const url = postId ? `/api/posts/${postId}` : "/api/posts";
      const method = postId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug: slug || title.toLowerCase().replace(/\s+/g, "-"),
          excerpt,
          contentMdx: content,
          categoryId: categoryId || null,
          tags,
          status: isAutosave ? "DRAFT" : status,
          scheduledFor: status === "SCHEDULED" && scheduledFor ? scheduledFor : null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (!postId) {
          router.push(`/writer/edit/${data.id}`);
        }
        if (!isAutosave) {
          alert("Saved successfully!");
        }
      }
    } catch (error) {
      console.error("Failed to save:", error);
      alert("Failed to save post");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = () => {
    setStatus("PUBLISHED");
    setTimeout(() => handleSave(false), 100);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSplitView(!splitView)}
            className="px-4 py-2 border border-white/20 hover:border-white/40 transition-colors"
          >
            {splitView ? "Single View" : "Split View"}
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-4 py-2 border border-white/20 hover:border-white/40 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Draft"}
          </button>
          <button
            onClick={handlePublish}
            className="px-4 py-2 border-2 border-white hover:bg-white hover:text-black transition-all duration-300"
          >
            Publish
          </button>
        </div>
        <div className="text-sm text-white/60">
          {saving && "Auto-saving..."}
        </div>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-white/5 border border-white/20 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-white/40"
            placeholder="Post title"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Slug</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full bg-white/5 border border-white/20 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-white/40"
            placeholder="post-slug"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full bg-white/5 border border-white/20 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-white/40"
          >
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="w-full bg-white/5 border border-white/20 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-white/40"
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="SCHEDULED">Scheduled</option>
          </select>
        </div>
        {status === "SCHEDULED" && (
          <div>
            <label className="block text-sm font-medium mb-2">Schedule For</label>
            <input
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              className="w-full bg-white/5 border border-white/20 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-white/40"
            />
          </div>
        )}
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Excerpt</label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={3}
          className="w-full bg-white/5 border border-white/20 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-white/40"
          placeholder="Brief description of the post"
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Tags</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 border border-white/20 flex items-center gap-2"
            >
              {tag}
              <button
                onClick={() => setTags(tags.filter((t) => t !== tag))}
                className="text-white/60 hover:text-white"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <select
          onChange={(e) => {
            if (e.target.value && !tags.includes(e.target.value)) {
              setTags([...tags, e.target.value]);
            }
            e.target.value = "";
          }}
          className="w-full bg-white/5 border border-white/20 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-white/40"
        >
          <option value="">Add tag</option>
          {allTags
            .filter((tag) => !tags.includes(tag.name))
            .map((tag) => (
              <option key={tag.id} value={tag.name}>
                {tag.name}
              </option>
            ))}
        </select>
      </div>

      {/* Editor */}
      <div className={splitView ? "grid grid-cols-2 gap-6" : ""}>
        <div>
          <label className="block text-sm font-medium mb-2">Content (MDX)</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={30}
            className="w-full bg-white/5 border border-white/20 px-4 py-2 rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
            placeholder="Write your post in MDX format..."
          />
        </div>
        {splitView && (
          <div>
            <label className="block text-sm font-medium mb-2">Preview</label>
            <div className="border border-white/20 rounded p-6 overflow-auto max-h-[800px]">
              <div className="prose prose-invert prose-lg max-w-none">
                <MDXRemote source={content} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Version History */}
      {postId && versions.length > 0 && (
        <div className="mt-12 pt-12 border-t border-white/10">
          <h3 className="text-lg font-serif font-bold mb-4">Version History</h3>
          <div className="space-y-2">
            {versions.slice(0, 5).map((version) => (
              <div
                key={version.id}
                className="flex items-center justify-between p-4 border border-white/10"
              >
                <div>
                  <div className="font-medium">
                    {new Date(version.createdAt).toLocaleString()}
                  </div>
                  <div className="text-sm text-white/60">
                    {version.content.substring(0, 100)}...
                  </div>
                </div>
                <button
                  onClick={() => {
                    setContent(version.content);
                    alert("Version restored. Click Save to apply.");
                  }}
                  className="px-4 py-2 border border-white/20 hover:border-white/40 transition-colors"
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


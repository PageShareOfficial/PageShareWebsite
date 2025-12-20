"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface SubscriptionPreferences {
  digestFrequency: "DAILY" | "WEEKLY" | "OFF";
  contentTypes: string[];
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  deliveryChannel: "EMAIL";
}

export function SubscriptionCenter() {
  const { data: session } = useSession();
  const [prefs, setPrefs] = useState<SubscriptionPreferences>({
    digestFrequency: "WEEKLY",
    contentTypes: [],
    quietHoursStart: null,
    quietHoursEnd: null,
    deliveryChannel: "EMAIL",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const res = await fetch("/api/subscriptions/preferences");
      if (res.ok) {
        const data = await res.json();
        setPrefs({
          digestFrequency: data.digestFrequency || "WEEKLY",
          contentTypes: data.contentTypes ? JSON.parse(data.contentTypes) : [],
          quietHoursStart: data.quietHoursStart,
          quietHoursEnd: data.quietHoursEnd,
          deliveryChannel: data.deliveryChannel || "EMAIL",
        });
      }
    } catch (error) {
      console.error("Failed to fetch preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/subscriptions/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...prefs,
          contentTypes: JSON.stringify(prefs.contentTypes),
        }),
      });

      if (res.ok) {
        alert("Preferences saved!");
      }
    } catch (error) {
      console.error("Failed to save preferences:", error);
      alert("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const toggleContentType = (type: string) => {
    setPrefs((prev) => ({
      ...prev,
      contentTypes: prev.contentTypes.includes(type)
        ? prev.contentTypes.filter((t) => t !== type)
        : [...prev.contentTypes, type],
    }));
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-serif font-bold mb-8">Subscription Center</h1>

      <div className="space-y-12">
        {/* Digest Frequency */}
        <section className="border border-white/10 p-8">
          <h2 className="text-2xl font-serif font-bold mb-4">Digest Frequency</h2>
          <p className="text-white/70 mb-6">
            Choose how often you want to receive email digests with new content.
          </p>
          <div className="space-y-3">
            {(["DAILY", "WEEKLY", "OFF"] as const).map((freq) => (
              <label
                key={freq}
                className="flex items-center gap-3 cursor-pointer p-4 border border-white/10 hover:border-white/20 transition-colors"
              >
                <input
                  type="radio"
                  name="frequency"
                  value={freq}
                  checked={prefs.digestFrequency === freq}
                  onChange={() => setPrefs({ ...prefs, digestFrequency: freq })}
                  className="w-5 h-5"
                />
                <div>
                  <div className="font-medium">
                    {freq === "DAILY" && "Daily"}
                    {freq === "WEEKLY" && "Weekly"}
                    {freq === "OFF" && "Off"}
                  </div>
                  <div className="text-sm text-white/60">
                    {freq === "DAILY" && "Receive a digest every day"}
                    {freq === "WEEKLY" && "Receive a digest once per week"}
                    {freq === "OFF" && "Don't send email digests"}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </section>

        {/* Content Types */}
        <section className="border border-white/10 p-8">
          <h2 className="text-2xl font-serif font-bold mb-4">Content Types</h2>
          <p className="text-white/70 mb-6">
            Select what types of content you want to receive in your digests.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { value: "NEW_FROM_FOLLOWED_AUTHORS", label: "New from Followed Authors" },
              { value: "NEW_FROM_FOLLOWED_TAGS", label: "New from Followed Tags" },
              { value: "TRENDING_DIGEST", label: "Trending Digest" },
              { value: "EDITORS_PICKS", label: "Editor's Picks" },
            ].map((type) => (
              <label
                key={type.value}
                className="flex items-center gap-3 cursor-pointer p-4 border border-white/10 hover:border-white/20 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={prefs.contentTypes.includes(type.value)}
                  onChange={() => toggleContentType(type.value)}
                  className="w-5 h-5"
                />
                <span>{type.label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Quiet Hours */}
        <section className="border border-white/10 p-8">
          <h2 className="text-2xl font-serif font-bold mb-4">Quiet Hours</h2>
          <p className="text-white/70 mb-6">
            Set times when you don't want to receive email notifications.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Start Time</label>
              <input
                type="time"
                value={prefs.quietHoursStart || ""}
                onChange={(e) =>
                  setPrefs({ ...prefs, quietHoursStart: e.target.value || null })
                }
                className="w-full bg-white/5 border border-white/20 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-white/40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Time</label>
              <input
                type="time"
                value={prefs.quietHoursEnd || ""}
                onChange={(e) =>
                  setPrefs({ ...prefs, quietHoursEnd: e.target.value || null })
                }
                className="w-full bg-white/5 border border-white/20 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-white/40"
              />
            </div>
          </div>
        </section>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 border-2 border-white hover:bg-white hover:text-black transition-all duration-300 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </div>
    </div>
  );
}


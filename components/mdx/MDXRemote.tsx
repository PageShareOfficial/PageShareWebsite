"use client";

import { MDXComponents } from "mdx/types";
import { Callout } from "./Callout";
import { PullQuote } from "./PullQuote";
import { Divider } from "./Divider";
import { Figure } from "./Figure";
import { CodeTitle } from "./CodeTitle";

const components: MDXComponents = {
  Callout,
  PullQuote,
  Divider,
  Figure,
  CodeTitle,
  h2: (props) => (
    <h2
      {...props}
      className="text-3xl font-serif font-bold mt-12 mb-6"
      id={props.children?.toString().toLowerCase().replace(/\s+/g, "-")}
    />
  ),
  h3: (props) => (
    <h3
      {...props}
      className="text-2xl font-serif font-bold mt-8 mb-4"
      id={props.children?.toString().toLowerCase().replace(/\s+/g, "-")}
    />
  ),
  p: (props) => <p {...props} className="mb-6 leading-relaxed" />,
  a: (props) => (
    <a
      {...props}
      className="text-white underline hover:text-white/80 transition-colors"
    />
  ),
  ul: (props) => <ul {...props} className="list-disc list-inside mb-6 space-y-2" />,
  ol: (props) => <ol {...props} className="list-decimal list-inside mb-6 space-y-2" />,
  li: (props) => <li {...props} className="ml-4" />,
  blockquote: (props) => (
    <blockquote
      {...props}
      className="border-l-4 border-white/30 pl-6 italic my-6 text-white/80"
    />
  ),
  code: (props) => (
    <code
      {...props}
      className="bg-white/10 px-2 py-1 rounded text-sm font-mono"
    />
  ),
  pre: (props) => (
    <pre
      {...props}
      className="bg-white/5 border border-white/10 p-4 rounded overflow-x-auto mb-6"
    />
  ),
};

interface MDXRemoteProps {
  source: string;
}

export function MDXRemote({ source }: MDXRemoteProps) {
  // In a real implementation, you'd use @mdx-js/react to compile the MDX
  // For now, we'll render it as HTML with dangerouslySetInnerHTML
  // In production, you should use a proper MDX compiler
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: source
          .replace(/<Callout/g, '<div class="callout"')
          .replace(/<\/Callout>/g, "</div>")
          .replace(/<PullQuote/g, '<div class="pullquote"')
          .replace(/<\/PullQuote>/g, "</div>"),
      }}
    />
  );
}


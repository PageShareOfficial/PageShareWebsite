import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "technology" },
      update: {},
      create: {
        name: "Technology",
        slug: "technology",
        description: "Latest in tech, software, and innovation",
      },
    }),
    prisma.category.upsert({
      where: { slug: "culture" },
      update: {},
      create: {
        name: "Culture",
        slug: "culture",
        description: "Arts, society, and cultural commentary",
      },
    }),
    prisma.category.upsert({
      where: { slug: "business" },
      update: {},
      create: {
        name: "Business",
        slug: "business",
        description: "Entrepreneurship, strategy, and industry insights",
      },
    }),
    prisma.category.upsert({
      where: { slug: "design" },
      update: {},
      create: {
        name: "Design",
        slug: "design",
        description: "Visual design, UX, and creative work",
      },
    }),
    prisma.category.upsert({
      where: { slug: "science" },
      update: {},
      create: {
        name: "Science",
        slug: "science",
        description: "Scientific discoveries and research",
      },
    }),
  ]);

  // Create tags
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { slug: "javascript" },
      update: {},
      create: { name: "JavaScript", slug: "javascript" },
    }),
    prisma.tag.upsert({
      where: { slug: "react" },
      update: {},
      create: { name: "React", slug: "react" },
    }),
    prisma.tag.upsert({
      where: { slug: "startups" },
      update: {},
      create: { name: "Startups", slug: "startups" },
    }),
    prisma.tag.upsert({
      where: { slug: "productivity" },
      update: {},
      create: { name: "Productivity", slug: "productivity" },
    }),
    prisma.tag.upsert({
      where: { slug: "writing" },
      update: {},
      create: { name: "Writing", slug: "writing" },
    }),
  ]);

  // Hash password
  const hashedPassword = await bcrypt.hash("password123", 10);

  // Create users
  const admin = await prisma.user.upsert({
    where: { email: "admin@pageshare.com" },
    update: {},
    create: {
      email: "admin@pageshare.com",
      name: "Admin User",
      password: hashedPassword,
      role: "ADMIN",
      bio: "Site administrator",
    },
  });

  const author1 = await prisma.user.upsert({
    where: { email: "author1@pageshare.com" },
    update: {},
    create: {
      email: "author1@pageshare.com",
      name: "Sarah Chen",
      password: hashedPassword,
      role: "AUTHOR",
      bio: "Tech writer and software engineer",
    },
  });

  const author2 = await prisma.user.upsert({
    where: { email: "author2@pageshare.com" },
    update: {},
    create: {
      email: "author2@pageshare.com",
      name: "Marcus Johnson",
      password: hashedPassword,
      role: "AUTHOR",
      bio: "Designer and creative director",
    },
  });

  const user1 = await prisma.user.upsert({
    where: { email: "user1@pageshare.com" },
    update: {},
    create: {
      email: "user1@pageshare.com",
      name: "Alex Taylor",
      password: hashedPassword,
      role: "USER",
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "user2@pageshare.com" },
    update: {},
    create: {
      email: "user2@pageshare.com",
      name: "Jordan Lee",
      password: hashedPassword,
      role: "USER",
    },
  });

  // Create posts
  const postContents = [
    {
      title: "The Future of Web Development: What's Next?",
      slug: "future-of-web-development",
      excerpt: "Exploring the latest trends and technologies shaping the future of web development.",
      contentMdx: `# The Future of Web Development

Web development is evolving at an unprecedented pace. From serverless architectures to AI-powered tools, the landscape is constantly changing.

## Key Trends

### Serverless Computing
Serverless computing is revolutionizing how we build applications. By abstracting away infrastructure concerns, developers can focus on what matters most: building great products.

### AI Integration
Artificial intelligence is becoming a core part of the development workflow. From code generation to automated testing, AI tools are enhancing productivity.

## Conclusion

The future of web development is bright, with new tools and technologies emerging regularly. Staying current with these trends is essential for any developer.`,
      category: categories[0],
      author: author1,
      tags: [tags[0], tags[1]],
    },
    {
      title: "Building a Design System from Scratch",
      slug: "building-design-system",
      excerpt: "A comprehensive guide to creating and maintaining a design system for your organization.",
      contentMdx: `# Building a Design System

Design systems are essential for creating consistent, scalable user experiences. Here's how to build one from scratch.

## Getting Started

The first step is understanding your brand and user needs. This foundation will guide all design decisions.

## Components

Start with the most commonly used components: buttons, inputs, and typography. These form the foundation of your system.

## Documentation

Comprehensive documentation is crucial. Every component needs clear usage guidelines and examples.`,
      category: categories[3],
      author: author2,
      tags: [tags[4]],
    },
    {
      title: "Startup Lessons: What I Learned in Year One",
      slug: "startup-lessons-year-one",
      excerpt: "Reflections on the first year of building a startup, including challenges and victories.",
      contentMdx: `# Startup Lessons: Year One

Building a startup is a journey filled with challenges and learning opportunities. Here are the key lessons from my first year.

## Product-Market Fit

Finding product-market fit is harder than it sounds. It requires constant iteration and listening to your users.

## Team Building

Hiring the right people is crucial. Skills matter, but culture fit is equally important.

## Persistence

Startups require immense persistence. There will be setbacks, but resilience is what separates successful founders.`,
      category: categories[2],
      author: author1,
      tags: [tags[2], tags[3]],
    },
    {
      title: "The Art of Scientific Writing",
      slug: "art-of-scientific-writing",
      excerpt: "How to communicate complex scientific concepts clearly and effectively.",
      contentMdx: `# The Art of Scientific Writing

Scientific writing requires precision, clarity, and accessibility. Here's how to master it.

## Clarity First

Complex ideas don't require complex language. The best scientific writing is clear and accessible.

## Structure Matters

A well-structured paper guides readers through your research logically and effectively.

## Visual Aids

Charts, graphs, and diagrams can communicate complex data more effectively than words alone.`,
      category: categories[4],
      author: author2,
      tags: [tags[4]],
    },
    {
      title: "React Hooks: A Deep Dive",
      slug: "react-hooks-deep-dive",
      excerpt: "Understanding React Hooks and how to use them effectively in your applications.",
      contentMdx: `# React Hooks: A Deep Dive

React Hooks revolutionized how we write React components. Let's explore them in depth.

## useState

The useState hook is the foundation of state management in functional components.

## useEffect

useEffect handles side effects, from API calls to subscriptions.

## Custom Hooks

Custom hooks let you extract and reuse stateful logic across components.`,
      category: categories[0],
      author: author1,
      tags: [tags[0], tags[1]],
    },
    {
      title: "Cultural Shifts in Remote Work",
      slug: "cultural-shifts-remote-work",
      excerpt: "How remote work is changing workplace culture and what it means for the future.",
      contentMdx: `# Cultural Shifts in Remote Work

Remote work isn't just a trend—it's a fundamental shift in how we work and collaborate.

## Communication

Remote work requires new communication strategies. Async communication becomes the norm.

## Work-Life Balance

The line between work and life blurs in remote settings. Setting boundaries is essential.

## Company Culture

Building culture remotely requires intentional effort and new approaches.`,
      category: categories[1],
      author: author2,
      tags: [tags[3]],
    },
    {
      title: "JavaScript Performance Optimization",
      slug: "javascript-performance-optimization",
      excerpt: "Techniques for optimizing JavaScript applications for better performance.",
      contentMdx: `# JavaScript Performance Optimization

Performance matters. Here are proven techniques for optimizing JavaScript applications.

## Code Splitting

Code splitting reduces initial bundle size and improves load times.

## Lazy Loading

Lazy loading components and images can significantly improve perceived performance.

## Memoization

Memoization prevents unnecessary recalculations and renders.`,
      category: categories[0],
      author: author1,
      tags: [tags[0]],
    },
    {
      title: "The Philosophy of Good Design",
      slug: "philosophy-of-good-design",
      excerpt: "What makes design good? Exploring the principles that guide great design.",
      contentMdx: `# The Philosophy of Good Design

Good design is more than aesthetics. It's about solving problems and creating value.

## Form Follows Function

The best designs prioritize function while maintaining aesthetic appeal.

## User-Centered Design

Understanding users is the foundation of good design decisions.

## Simplicity

Simplicity is the ultimate sophistication. The best designs are often the simplest.`,
      category: categories[3],
      author: author2,
      tags: [tags[4]],
    },
    {
      title: "Productivity Systems That Actually Work",
      slug: "productivity-systems-that-work",
      excerpt: "Evidence-based productivity systems that help you get more done.",
      contentMdx: `# Productivity Systems That Work

Productivity isn't about working harder—it's about working smarter.

## Time Blocking

Time blocking helps you focus on one task at a time, reducing context switching.

## The Two-Minute Rule

If a task takes less than two minutes, do it immediately. This prevents small tasks from piling up.

## Regular Reviews

Weekly and monthly reviews help you stay aligned with your goals.`,
      category: categories[2],
      author: author1,
      tags: [tags[3]],
    },
    {
      title: "Writing for the Web: Best Practices",
      slug: "writing-for-web-best-practices",
      excerpt: "How to write content that engages readers and performs well online.",
      contentMdx: `# Writing for the Web

Web writing is different from other forms of writing. Here's how to do it well.

## Scannable Content

Web readers scan. Use headings, lists, and short paragraphs to make content scannable.

## Clear Headlines

Headlines determine whether readers click. Make them clear and compelling.

## Value First

Always lead with value. What will readers learn or gain from your content?`,
      category: categories[1],
      author: author2,
      tags: [tags[4]],
    },
    {
      title: "Building Scalable React Applications",
      slug: "scalable-react-applications",
      excerpt: "Architecture patterns and practices for building React apps that scale.",
      contentMdx: `# Building Scalable React Applications

Scalability is about more than just performance. It's about maintainability and growth.

## Component Architecture

Well-structured components are easier to maintain and extend.

## State Management

Choose state management solutions that fit your application's needs.

## Testing Strategy

A solid testing strategy prevents regressions and enables confident refactoring.`,
      category: categories[0],
      author: author1,
      tags: [tags[0], tags[1]],
    },
    {
      title: "The Business of Creativity",
      slug: "business-of-creativity",
      excerpt: "How to turn creative work into a sustainable business.",
      contentMdx: `# The Business of Creativity

Creativity and business don't have to be at odds. Here's how to balance both.

## Value Creation

Creative work creates value when it solves problems for your audience.

## Pricing Strategy

Pricing creative work is challenging. Value-based pricing often works best.

## Building an Audience

An audience is your most valuable asset. Focus on serving them well.`,
      category: categories[2],
      author: author2,
      tags: [tags[2]],
    },
  ];

  const posts = [];
  for (const postData of postContents) {
    const post = await prisma.post.upsert({
      where: { slug: postData.slug },
      update: {
        title: postData.title,
        excerpt: postData.excerpt,
        contentMdx: postData.contentMdx,
        categoryId: postData.category.id,
        authorId: postData.author.id,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
      create: {
        title: postData.title,
        slug: postData.slug,
        excerpt: postData.excerpt,
        contentMdx: postData.contentMdx,
        categoryId: postData.category.id,
        authorId: postData.author.id,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });

    // Clear existing tags and add new ones
    await prisma.postTag.deleteMany({
      where: { postId: post.id },
    });

    // Add tags
    for (const tag of postData.tags) {
      await prisma.postTag.upsert({
        where: {
          postId_tagId: {
            postId: post.id,
            tagId: tag.id,
          },
        },
        update: {},
        create: {
          postId: post.id,
          tagId: tag.id,
        },
      });
    }

    posts.push(post);
  }

  // Create likes, bookmarks, follows
  const likeData = [
    { userId: user1.id, postId: posts[0].id },
    { userId: user1.id, postId: posts[1].id },
    { userId: user2.id, postId: posts[0].id },
    { userId: user2.id, postId: posts[2].id },
  ];
  for (const like of likeData) {
    await prisma.like.upsert({
      where: {
        userId_postId: {
          userId: like.userId,
          postId: like.postId,
        },
      },
      update: {},
      create: like,
    });
  }

  const bookmarkData = [
    { userId: user1.id, postId: posts[0].id },
    { userId: user1.id, postId: posts[3].id },
    { userId: user2.id, postId: posts[1].id },
  ];
  for (const bookmark of bookmarkData) {
    await prisma.bookmark.upsert({
      where: {
        userId_postId: {
          userId: bookmark.userId,
          postId: bookmark.postId,
        },
      },
      update: {},
      create: bookmark,
    });
  }

  const followAuthorData = [
    { followerId: user1.id, authorId: author1.id },
    { followerId: user2.id, authorId: author2.id },
  ];
  for (const follow of followAuthorData) {
    await prisma.followAuthor.upsert({
      where: {
        followerId_authorId: {
          followerId: follow.followerId,
          authorId: follow.authorId,
        },
      },
      update: {},
      create: follow,
    });
  }

  const followTagData = [
    { followerId: user1.id, tagId: tags[0].id },
    { followerId: user1.id, tagId: tags[1].id },
    { followerId: user2.id, tagId: tags[3].id },
  ];
  for (const follow of followTagData) {
    await prisma.followTag.upsert({
      where: {
        followerId_tagId: {
          followerId: follow.followerId,
          tagId: follow.tagId,
        },
      },
      update: {},
      create: follow,
    });
  }

  // Create pins
  await prisma.postPin.create({
    data: {
      postId: posts[0].id,
      position: "HERO",
    },
  });

  await prisma.postPin.upsert({
    where: { postId: posts[1].id },
    update: { position: "EDITORS_PICK" },
    create: { postId: posts[1].id, position: "EDITORS_PICK" },
  });
  await prisma.postPin.upsert({
    where: { postId: posts[2].id },
    update: { position: "EDITORS_PICK" },
    create: { postId: posts[2].id, position: "EDITORS_PICK" },
  });
  await prisma.postPin.upsert({
    where: { postId: posts[3].id },
    update: { position: "EDITORS_PICK" },
    create: { postId: posts[3].id, position: "EDITORS_PICK" },
  });

  // Create comments
  await prisma.comment.createMany({
    data: [
      {
        postId: posts[0].id,
        userId: user1.id,
        body: "Great article! Really insightful.",
      },
      {
        postId: posts[0].id,
        userId: user2.id,
        body: "Thanks for sharing this perspective.",
      },
      {
        postId: posts[1].id,
        userId: user1.id,
        body: "This is exactly what I needed. Thank you!",
      },
    ],
  });

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


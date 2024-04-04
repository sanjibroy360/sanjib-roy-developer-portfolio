import rss from "@astrojs/rss";
// import { Config } from "~/config.ts";
import { getCollection } from "astro:content";

export const GET = async () => {
  let posts = await getCollection("posts");
  let blogs = [...posts]
    ?.sort(
      (a, b) =>
        new Date(b?.data?.publishedOn).getTime() -
        new Date(a?.data?.publishedOn).getTime()
    )
    ?.map((post) => ({
      data: {
        ...post.data,
        type: "Blog",
        link: `/blogs/${post.slug}/`,
        categories: post.data.tags,
      },
    }));

  let projects = [
    {
      appName: "Miru",
      url: "https://www.miru.so/",
      about: "Time Tracking, Invoicing, Employee management platform.",
      tags: ["React.js", "TailwindCSS", "Ruby on Rails", "PostgreSQL"],
    },
    {
      appName: "Trello",
      url: "https://github.com/sanjibroy360/trello-app",
      about: "Trello is a web-based, kanban-style, work management tool.",
      tags: ["React.js", "Node.js", "Express.js"],
    },
    {
      appName: "Quizzy",
      url: "https://github.com/sanjibroy360/quizzy-by-sanjibroy360",
      about:
        "Quiz app lets users create, share quizzes with detailed stats for creators.",

      tags: ["React.js", "Ruby on Rails"],
    },
    {
      appName: "React Notify",
      url: "https://github.com/sanjibroy360/react-notify",
      about: "Customizable toast notification solution for React.js apps.",
      tags: ["React.js"],
    },
    {
      appName: "Lean Canvas",
      url: "https://github.com/sanjibroy360/Lean_Canvas",
      about:
        "A web-based one-page business model template for rapid idea validation and execution planning.",
      tags: ["React.js"],
    },
    {
      appName: "Type-It",
      url: "https://github.com/sanjibroy360/Type-It-Vanilla-JS",
      about: "Typing game measuring typing speed and accuracy.",
      tags: ["JavaScript"],
    },
    {
      appName: "Twitter Bot",
      url: "https://github.com/sanjibroy360/Twitter-Bot",
      about:
        "@recruitments360: A bot that automatically re-tweets job related tweets.",
      tags: ["Node.js", "Express.js"],
    },
    {
      appName: "Conduit API",
      url: "https://github.com/sanjibroy360/Conduit_Api",
      about:
        "A simple blog app's API where user can create blogs, like any blog add comments etc.",
      tags: ["Node.js", "Express.js", "MongoDB"],
    },
    {
      appName: "Url Shortner",
      url: "https://github.com/sanjibroy360/url-shortner",
      about: "Simple URL shortner that also keeps tracks of number of clicks.",
      tags: ["Ruby on Rails", "PostgreSQL"],
    },
    {
      appName: "Ludo Game",
      url: "https://github.com/sanjibroy360/Ludo_Game_ruby",
      about: "A simple dice game. Only two players can play the game.",
      tags: ["Ruby"],
    },
    {
      appName: "Todo App",
      url: "https://github.com/sanjibroy360/todoist-clone",
      about: "A simple todo applications.",
      tags: ["JavaScript"],
    },
  ];
  projects = projects?.map((project) => ({
    data: {
      type: "Project",
      title: project.appName,
      summary: `${project.about} Tech stack: ${project.tags?.join(
        ", "
      )}. My GitHub username is @sanjibroy360.`,
      publishedOn: "",
      link: project.url,
      categories: project.tags,
    },
  }));

  const items = [...blogs, ...projects];

  return rss({
    // `<title>` field in output xml
    title: "Sanjib Roy | Software Developer",
    // `<description>` field in output xml
    description: `Hi, I am Sanjib Roy, a Software Developer with 3 years of remote work experience, proficient in JavaScript, React.js, Next.js, Node.js, TypeScript, Electron.js, MongoDB, Ruby, Ruby on Rails, and PostgreSQL. I completed my Bachelor of Science in Computer Science (Honours) in 2019. Throughout my career, I have led a couple of teams in developing applications from scratch, managed a couple of projects single-handedly and I love taking on challenging projects that will push me to learn and grow.`,
    // base URL for RSS <item> links
    // SITE will use "site" from your project's astro.config.
    site: import.meta.env.SITE,
    // list of `<item>`s in output xml
    // simple example: generate items for every md file in /src/pages
    // see "Generating items" section for required frontmatter and advanced use cases
    xmlns: {
      atom: "http://www.w3.org/2005/Atom",
    },
    items: items.map((item) => {
      let itemObj = {
        title: `${item.data.title} | ${item.data.type}`,
        pubDate: "2024-03-21",
        description: item.data.summary,
        link: item.data.link,
        categories: item.data.categories,
        author: "sanjibroy.dev@gmail.com (Sanjib Roy)",
      };

      if (item?.type?.toLowerCase()?.trim() === "blog") {
        itemObj.pubDate = item.data.publishedOn;
      }
      return itemObj;
    }),
    // (optional) inject custom xml
    customData: `
      <language>en-us</language>
      <atom:link href="https://sanjibroy.com/rss.xml" rel="self" type="application/rss+xml" />
    `,
  });
};

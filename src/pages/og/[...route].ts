// src/pages/og/[...route].ts
import { OGImageRoute } from "astro-og-canvas";

const directory = "src/content";

// Import all pages from the content directory
const rawPages = import.meta.glob(`${directory}/**/*.md`, { eager: true });

// Remove the /src/content prefix from the paths
const pages = Object.entries(rawPages).reduce(
  (acc, [path, page]) => ({ ...acc, [path.replace(directory, "")]: page }),
  {}
);

export const { getStaticPaths, GET } = OGImageRoute({
  param: "route",
  pages,
  getImageOptions: (_path, page) => ({
    title: page.frontmatter.title,
    description: page.frontmatter.description,
    author: page.frontmatter.author,
    date: page.frontmatter.date,
  }),
});

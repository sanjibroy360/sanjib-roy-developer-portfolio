import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import robotsTxt from "astro-robots-txt";
import { astroImageTools } from "astro-imagetools";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
// import { astroOgImagesGenerator } from "og-images-generator/astro"; // Install "og-images-generator" npm package then use it to generate opengraph image

const prettyCodeOptions = {
  theme: "dark-plus",
  showLineNumbers: true, // Enable line numbers
};

// https://astro.build/config
export default defineConfig({
  site: "https://www.sanjibroy.com",
  trailingSlash: "ignore",
  markdown: {
    extendDefaultPlugins: true,
    syntaxHighlight: false,
    rehypePlugins: [
      [rehypePrettyCode, prettyCodeOptions],
      rehypeSlug,
      rehypeAutolinkHeadings,
    ],
  },

  integrations: [
    react(),
    tailwind({ applyBaseStyles: false }),
    sitemap(),
    robotsTxt({
      policy: [
        {
          userAgent: "Googlebot",
          allow: "/",
          disallow: ["/cdn-cgi/"],
          crawlDelay: 2,
        },
        {
          userAgent: "Bingbot",
          allow: "/",
          disallow: ["/cdn-cgi/"],
          crawlDelay: 2,
        },
        {
          userAgent: "AhrefsBot",
          allow: "/",
          disallow: ["/cdn-cgi/"],
          crawlDelay: 2,
        },
        {
          userAgent: "*",
          allow: "/",
          crawlDelay: 10,
        },
      ],
    }),
    astroImageTools,
    // astroOgImagesGenerator(),
  ],
});

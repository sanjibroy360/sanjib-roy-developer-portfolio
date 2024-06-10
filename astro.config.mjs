import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import robotsTxt from "astro-robots-txt";
import { astroImageTools } from "astro-imagetools";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import partytown from "@astrojs/partytown";

const prettyCodeOptions = {
  theme: "dark-plus",
  showLineNumbers: true, // Enable line numbers
};

export default defineConfig({
  site: "https://sanjibroy.com",
  trailingSlash: "never",
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
    partytown({
      config: {
        forward: ["dataLayer.push"],
      },
    }),
    sitemap({
      customPages: [
        "https://sanjibroy.com/rss.xml",
        "https://sanjibroy.com/favicon.ico",
      ],
    }),
  ],
});

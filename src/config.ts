import ogCard from "~/assets/Images/og-images/og-card.png";
import avatarSamkit from "~/assets/Images/testimonials/avatar-samkit-jain.webp";

interface IConfig {
  me: {
    avatar: string;
    name: string;
    about: string | string[];
    job: string;
    started: string;
    stack: string;
    hobby: string;
    projectLink: string;
    resumeLink: string;
  };
  about: {
    workExperiences: WorkExperienceObj[];
    educationDetails: EducationObj[];
    skills: SkillObj[];
  };
  website: string;
  pages: LinkObj[];
  socials: {
    [name: string]: string;
  };
  projects: ProjectObj[];
  testimonials: TestimonialsObj[];
  og: {
    image: string;
  };
}

interface ProjectObj {
  appName: string;
  url: string;
  tags: string[];
  about: string;
}

interface LinkObj {
  title: string;
  url: string;
  external?: boolean;
  displayInDrawerOnly?: boolean;
}

interface WorkExperienceObj {
  title: string;
  company: string;
  years: string;
  contributions: string[];
}

interface EducationObj {
  title: string;
  institute: string;
  address: string;
  years: string;
}

interface SkillObj {
  title: string;
  icon?: string;
  svg?: string;
}

interface TestimonialsObj {
  avatar: any;
  role: string;
  name: string;
  message: string;
  link: string;
}

const AboutMe: string[] = [
  "I'm a Software Engineer with solid expertise in the MERN stack.",
  "I've built successful apps like Miru and the Juvoxa patient app.",
  "Currently, I lead projects at Saeloun Technologies Pvt. Ltd.",
  "I earned a B.Sc in Computer Science (Hons.) from Triveni.",
  "I possess advanced skills in Full Stack Web Development (MERN).",
];

const Pages: LinkObj[] = [
  {
    title: "Home",
    url: "/",
  },
  {
    title: "Profile",
    url: "/profile",
  },
  {
    title: "Blog",
    url: "/blogs",
  },
  {
    title: "Projects",
    url: "/projects",
  },
  {
    title: "Resume",
    url: "https://drive.google.com/file/d/1BpoaWbM8-6194n6OxAI4fQLuyfN4qN8r/view?usp=sharing",
    external: true,
  },
  {
    title: "GitHub",
    url: "https://github.com/sanjibroy360",
    external: true,
    displayInDrawerOnly: true,
  },
  {
    title: "LinkedIn",
    url: "https://www.linkedin.com/in/sanjibroy360",
    external: true,
    displayInDrawerOnly: true,
  },
  {
    title: "Twitter",
    url: "https://twitter.com/sanjibroy360",
    external: true,
    displayInDrawerOnly: true,
  },
  {
    title: "Instagram",
    url: "https://www.instagram.com/sanjibroy360/",
    external: true,
    displayInDrawerOnly: true,
  },
  {
    title: "sanjibroy.dev@gmail.com",
    url: "mailto:sanjibroy.dev@gmail.com",
    external: true,
    displayInDrawerOnly: true,
  },
];

const WorkExperiences: WorkExperienceObj[] = [
  {
    years: "Sep 2022 - Mar 2024",
    title: "Software Engineer",
    company: "Saeloun Technologies Pvt. Ltd (Remote)",
    contributions: [
      "Developed the Miru desktop app almost from scratch, creating an easy-to-use time-tracking system with automatic idle-state detection. Ensured it works seamlessly with the Miru web app for generating invoices.",
      "Developed the Miru marketing website with React.js, integrating Google Analytics and HubSpot for traffic tracking and lead capture.",
      "Contributed as a full stack developer to the Miru web app, a time-tracking and invoicing application. Involved in developing key features such as the PTO module, Organization settings, authentication flow, and refactoring pages related to time-tracking. Also, actively addressed bug fixes and reported issues.",
      "Contributed to the development of the Tlatocash app, a payment wallet application built using React Native. Implemented features like sharing QR codes, scanning QR codes, and enabling seamless payments to saved contacts on the mobile app.",
      "Contributed to various client projects.",
    ],
  },
  {
    years: "Aug 2021 - Aug 2022",
    title: "Frontend Engineer",
    company: "Juvoxa (Remote)",
    contributions: [
      "Undertook team lead responsibilities and successfully led high-priority sprints.",
      "Contributed to redesigning and optimizing the entire Juvoxa doctor, patient, and partner application.",
      "Migrated the vintage react code to the latest React hooks format and refactored React components to optimize the component rendering.",
      "Developed several important features like prescribing any solution to patients, creating fixed and scheduled programs, sending reports to doctors, etc.",
      "Designed the dashboard page for doctors where doctors can check patients' vitals, most prescribed contents, programs, etc.",
    ],
  },
  {
    years: "Feb 2021 - Jul 2021",
    title: "Software Engineer",
    company: "Big Binary LLC. (Remote)",
    contributions: [
      "Contributed as a full stack developer to the client project and in-house projects like Neeto KB, Neeto Auth.",
      "Contributed to implementing Single-Sign-On(SSO). Wrote functional, unit, and integration tests for application quality assurance.",
    ],
  },
];

const EducationDetails: EducationObj[] = [
  {
    title: "Full Stack Development (MERN)",
    institute: "AltCampus",
    address: "Thehr, Khaniyara Valley, Dharamshala, Himachal Pradesh, India",
    years: "2019 - 2020",
  },
  {
    title: "Bachelor of Science (B.Sc) in Computer Science (Hons.)",
    institute: "Triveni Devi Bhalotia College",
    address: "Raniganj, West Bengal, India",
    years: "2016 - 2019",
  },
  {
    title: "Higher Secondary Education (12th)",
    institute: "Raniganj High School",
    address: "Raniganj, West Bengal, India",
    years: "2013 - 2015",
  },
  {
    title: "Secondary Education (10th)",
    institute: "Raniganj High School",
    address: "Raniganj, West Bengal, India",
    years: "2007 - 2013",
  },
  {
    title: "Primary School",
    institute: "Ray Saheb Mrityunjoy School",
    address: "Raniganj, West Bengal, India",
    years: "2003 - 2006",
  },
];

const Skills: SkillObj[] = [
  {
    title: "JavaScript",
    icon: "javascript-plain bg-black bg-cover overflow-hidden",
  },
  {
    title: "React.js",
    icon: "react-plain group-hover:bg-black p-1 rounded-full",
  },
  { title: "Next.js", icon: "nextjs-plain bg-white font-normal rounded-full" },
  {
    title: "Node.js",
    icon: "nodejs-plain-wordmark p-1 group-hover:bg-slate-800 rounded-full",
  },
  { title: "TypeScript", icon: "typescript-plain" },
  {
    title: "Electron.js",
    icon: "electron-original font-bold text-primary rounded-full",
  },
  {
    title: "React Native",
    icon: "react-plain group-hover:bg-black p-1 rounded-full",
  },
  { title: "MongoDB", icon: "mongodb-plain" },
  { title: "Ruby", icon: "ruby-plain font-normal" },
  { title: "Ruby on Rails", icon: "rails-plain" },
  { title: "PostgreSQL", icon: "postgresql-plain" },
  { title: "TailwindCSS", icon: "tailwindcss-plain" },
  { title: "SCSS/SASS", icon: "sass-plain" },
  { title: "Astro.js", icon: "astro-plain" },
  { title: "Bootstrap", icon: "bootstrap-plain" },
  { title: "MaterialUI", icon: "materialui-plain" },
  { title: "GraphQL", icon: "graphql-plain" },
  { title: "HubSpot", svg: "hubspot" },
  { title: "Google Analytics", svg: "google-analytics" },
  {
    title: "Postman",
    icon: "postman-plain  bg-white font-normal rounded-full",
  },
  {
    title: "GitHub",
    icon: "github-original bg-white font-normal rounded-full",
  },
];

const Testimonials: TestimonialsObj[] = [
  {
    avatar: avatarSamkit.src,
    role: "Principal Engineer at Juvoxa",
    name: "Samkit Jain",
    message:
      "Sanjib showed tremendous growth during his tenure at Juvoxa. He is a quick learner and knows JavaScript very well. Able to convert Figma designs into reusable components to the T and regularly employed code optimisation techniques. Apart from the technical requirements, he also showcased managerial qualities by leading sprints for new product features.",
    link: "https://www.linkedin.com/in/sanjibroy360/details/recommendations",
  },
];

export const Config: IConfig = {
  me: {
    avatar: "/src/assets/Images/avatar.webp",
    name: "Sanjib Roy",
    about: AboutMe,
    job: "Full-stack engineer",
    started: "2021-02-10", // Used to calculate years of experience dynamically
    stack: "MERN stack and Ruby on Rails",
    hobby: "gamble my life savings",
    projectLink: "/projects",
    resumeLink:
      "https://drive.google.com/file/d/1BpoaWbM8-6194n6OxAI4fQLuyfN4qN8r/view?usp=sharing",
  },
  about: {
    workExperiences: WorkExperiences,
    educationDetails: EducationDetails,
    skills: Skills,
  },
  website: "www.sanjibroy.com",
  pages: Pages,
  socials: {
    GitHub: "https://github.com/sanjibroy360",
    LinkedIn: "https://www.linkedin.com/in/sanjibroy360/",
    Email: "mailto:sanjibroy.dev@gmail.com",
    Twitter: "https://twitter.com/sanjibroy360",
    Instagram: "https://www.instagram.com/sanjibroy360/",
  },
  projects: [
    {
      appName: "Miru",
      url: "https://www.miru.so/",
      about: "Time Tracking, Invoicing, Employee management platform ",
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
      about: "Customizable toast notification solution for React apps",
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
      about: "Typing game measuring typing speed and accuracy",
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
      about: "Simple URL shortner that also keeps tracks of number of clicks",
      tags: ["Ruby on Rails", "PostgreSQL"],
    },
    {
      appName: "Ludo Game",
      url: "https://github.com/sanjibroy360/Ludo_Game_ruby",
      about: "A simple dice game. Only two players can play the game",
      tags: ["Ruby"],
    },
    {
      appName: "Todo App",
      url: "https://github.com/sanjibroy360/todoist-clone",
      about: "A simple todo applications.",
      tags: ["JavaScript"],
    },
  ],
  testimonials: Testimonials,
  og: {
    image: ogCard.src,
  },
};

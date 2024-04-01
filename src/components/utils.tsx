import {
  Envelope,
  TwitterLogo,
  InstagramLogo,
  LinkedinLogo,
  GithubLogo,
  Rss,
} from "phosphor-react";

import { createKlass, createReklass } from "@klass/core/create";
import { createGroup } from "@klass/core/group/create";
import * as poly from "@klass/react/create";
import * as mono from "@klass/react/mono/create";

import { twMerge as end } from "tailwind-merge"; // optional

import clsx from "clsx";
import type { ClassValue } from "clsx";

export const cn = (...classValues: ClassValue[]) => end(clsx(classValues));

export const klass = createKlass({ end });
export const reklass = createReklass({ end });
export const klassed = poly.createKlassed(klass);
export const reklassed = poly.createReklassed(reklass);
export const group = createGroup(klass);
export const mklassed = mono.createKlassed(klass);

export const getSocialIcon = (platformName: string) => {
  const icons: any = {
    email: <Envelope />,
    twitter: <TwitterLogo />,
    linkedin: <LinkedinLogo />,
    github: <GithubLogo />,
    instagram: <InstagramLogo />,
    rss: <Rss />,
  };

  return icons[platformName?.toLowerCase()?.trim()] || null;
};

export function removeTrailingSlash(url: string) {
  return url.replace(/\/+$/, "");
}
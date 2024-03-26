import { Config } from "~/config";
import { getSocialIcon } from "../utils";

function SocialLinks() {
  return (
    <div className="relative z-20 flex gap-3 items-center ml-auto">
      {Object.keys(Config.socials || {})?.map((platformName: string) => (
        <a
          key={platformName}
          className="text-lg opacity-50 hover:opacity-80"
          href={Config.socials[platformName]}
          target="_blank"
          rel="noopener noreferrer nofollow"
          aria-label={platformName}
        >
          {getSocialIcon(platformName)}
        </a>
      ))}
    </div>
  );
}

export default SocialLinks;

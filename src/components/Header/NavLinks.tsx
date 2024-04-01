import { ArrowSquareOut, House } from "phosphor-react";
import { Config } from "~/config";
import { removeTrailingSlash } from "~/components/utils";
import clsx from "clsx";

function NavLinks({ currentPath, ctrlNavPaneStateClassName }: Iprops) {
  const navClass =
    "flex items-center w-full py-[6px] md:py-[3px] px-[8px] transition-all duration-150 ease-in-out rounded-lg";

  return (
    <nav>
      <div className="flex gap-x-1 md:flex-row flex-col space-y-2 my-2 md:my-0 md:px-0 md:space-y-0 text-base md:text-sm">
        {Config.pages.map((page) => (
          <div
            className={`${page.displayInDrawerOnly ? "md:hidden block" : ""} ${
              ctrlNavPaneStateClassName || ""
            }`}
            key={page.url}
          >
            <a
              rel={page.external ? "noopener noreferrer nofollow" : ""}
              href={removeTrailingSlash(page.url)}
              target={page.external ? "_blank" : ""}
              aria-label={page.title}
              className={clsx(
                navClass,
                !page?.external &&
                  (currentPath === page.url ||
                    (page.url !== "/" && currentPath.includes(page.url)))
                  ? "text-highlighted-btn-txt bg-highlight backdrop-blur-md"
                  : "text-secondary hover:bg-highlight hover:text-highlighted-btn-txt duration-100 md:duration-0"
              )}
            >
              {page.url?.trim() == "/" ? (
                <div className="md:w-5 md:h-5 flex items-center justify-center">
                  <House size={16} className="hidden md:flex" />
                  <span className="flex md:hidden">Home</span>
                </div>
              ) : (
                <span>{page.title}</span>
              )}
              {page?.external && (
                <span className="ml-1 text-highlighted hover:text-highlighted-btn-txt">
                  <ArrowSquareOut size={14} />
                </span>
              )}
            </a>
          </div>
        ))}
      </div>
    </nav>
  );
}

interface Iprops {
  currentPath: string;
  ctrlNavPaneStateClassName?: string;
}

export default NavLinks;

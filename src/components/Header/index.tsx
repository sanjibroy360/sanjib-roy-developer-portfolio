import MobileNavDrawer from "./MobileNavPane";
import NavLinks from "./NavLinks";
import SocialLinks from "./SocialLinks";

function Header({ currentPath }: Iprops) {
  const fixedNavbarClasses =
    "lg:fixed lg:z-20 lg:top-0 w-full bg-base-100";
  return (
    <>
      <header
        className={`${fixedNavbarClasses} container md:px-3.5 md:flex hidden w-full md:gap-2 md:justify-between md:pb-0`}
      >
        <aside className="sticky container left-0 top-[30px] overflow-auto flex text-sm py-2 rounded-[12px] mt-2 w-full bg-app">
          <NavLinks currentPath={currentPath} />
          <SocialLinks />
        </aside>
      </header>
      <MobileNavDrawer currentPath={currentPath} />
    </>
  );
}

interface Iprops {
  currentPath: string;
}

export default Header;

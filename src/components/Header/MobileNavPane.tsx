import NavLinks from "./NavLinks";
import { CaretUp, X } from "phosphor-react";

function MobileNavDrawer({ currentPath }: Iprops) {
  return (
    <aside>
      <div className="text-sm fixed left-0 bottom-0 p-2 rounded-full w-full md:hidden z-30 text-center flex items-center justify-center">
        <button
          id="mobile-nav-menu-btn"
          className="w-full !py-[12px] shadow-mobile-nav-btn-shadow backdrop-blur-md relative z-40 flex items-center justify-center px-2 rounded-lg cursor-pointer group text-sm text-gray-900  border min-h-[28px] border-mobile-nav-btn-border hover:scale-[0.98] bg-mobile-nav-btn duration-100"
        >
          <div className="flex items-center text-mobile-nav-btn-content">
            <CaretUp className="mr-2 text-mobile-nav-btn-content" />
            <span className="text-mobile-nav-btn-content">Menu</span>
          </div>
        </button>
      </div>

      <div
        id="mobile-nav-overlay"
        className="absolute hidden md:hidden md:h-0 inset-0 z-50 w-full h-full overscroll-none  bg-base-100/40 duration-100"
      />
      <nav
        id="mobile-nav-pane"
        className="fixed bottom-0 left-0 z-50 hide w-full p-2 md:hidden duration-100"
      >
        <div className="border backdrop-filter backdrop-blur bg-mobile-nav-pane-bg border-list-border bottom-0 absolute left-0 w-full pt-4 pb-8 rounded-t-lg text-sm px-3 z-50">
          <div>
            <div className="absolute top-[-50px] right-[10px] z-20">
              <button
                id="mobile-close-nav-pane-btn"
                className="hidden w-full !py-2 relative flex items-center justify-center px-2 rounded-lg cursor-pointer group text-sm shadow-sm border border-mobile-nav-btn-border min-h-[28px]  hover:scale-[0.98] bg-white dark:bg-base-100 text-mobile-nav-btn-content duration-100"
              >
                <X size={16} />
              </button>
            </div>
            <NavLinks
              currentPath={currentPath}
              ctrlNavPaneStateClassName="mobile-nav-pane-link"
            />
          </div>
        </div>
      </nav>
    </aside>
  );
}

interface Iprops {
  currentPath: string;
}

export default MobileNavDrawer;

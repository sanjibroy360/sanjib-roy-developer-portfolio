function ThemeToggler() {
  return (
    <div
      id="theme-toggle-btn"
      className="md:fixed absolute right-2 top-2 p-2 flex items-center justify-center rounded-full z-50 bg-base-100/70  shadow"
    >
      <label htmlFor="theme-input" className="swap swap-rotate">
        <input
          id="theme-input"
          type="checkbox"
          className="theme-controller hidden"
        />

        {/* sun icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          fill="#fcd34e"
          viewBox="0 0 256 256"
          className="swap-on"
        >
          <path d="M120,40V16a8,8,0,0,1,16,0V40a8,8,0,0,1-16,0Zm8,24a64,64,0,1,0,64,64A64.07,64.07,0,0,0,128,64ZM58.34,69.66A8,8,0,0,0,69.66,58.34l-16-16A8,8,0,0,0,42.34,53.66Zm0,116.68-16,16a8,8,0,0,0,11.32,11.32l16-16a8,8,0,0,0-11.32-11.32ZM192,72a8,8,0,0,0,5.66-2.34l16-16a8,8,0,0,0-11.32-11.32l-16,16A8,8,0,0,0,192,72Zm5.66,114.34a8,8,0,0,0-11.32,11.32l16,16a8,8,0,0,0,11.32-11.32ZM48,128a8,8,0,0,0-8-8H16a8,8,0,0,0,0,16H40A8,8,0,0,0,48,128Zm80,80a8,8,0,0,0-8,8v24a8,8,0,0,0,16,0V216A8,8,0,0,0,128,208Zm112-88H216a8,8,0,0,0,0,16h24a8,8,0,0,0,0-16Z"></path>
        </svg>

        {/* moon icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          fill="#fcd34e"
          viewBox="0 0 256 256"
          className="swap-off"
        >
          <path d="M240,96a8,8,0,0,1-8,8H216v16a8,8,0,0,1-16,0V104H184a8,8,0,0,1,0-16h16V72a8,8,0,0,1,16,0V88h16A8,8,0,0,1,240,96ZM144,56h8v8a8,8,0,0,0,16,0V56h8a8,8,0,0,0,0-16h-8V32a8,8,0,0,0-16,0v8h-8a8,8,0,0,0,0,16Zm65.14,94.33A88.07,88.07,0,0,1,105.67,46.86a8,8,0,0,0-10.6-9.06A96,96,0,1,0,218.2,160.93a8,8,0,0,0-9.06-10.6Z"></path>
        </svg>
      </label>
    </div>
  );
}

export default ThemeToggler;

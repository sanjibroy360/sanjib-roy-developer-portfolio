// import { html, styled, OG_SIZE, FONTS } from "og-images-generator";

// /** @type {import('og-images-generator').PathsOptions} */
// export const paths = {
//   // DEFAULTS
//   // base: './dist/blogs',
//   // out: './dist/og',
//   // json: './dist/og/index.json',
// };

// /** @type {import('og-images-generator').RenderOptions} */
// export const renderOptions = {
//   satori: {
//     fonts: [await FONTS.sourceSans()],
//     ...OG_SIZE,
//   },
// };

// /** @type {import('og-images-generator').Template} */
// export const template = ({ page }) => {
//   console.info("OG Template for: ", page.path);

//   if ("author" in page.meta.tags === false) return null;
//   if ("og:title" in page.meta.tags === false) throw Error("Missing title!");
//   if ("og:description" in page.meta.tags === false)
//     throw Error("Missing description!");

//   const title = page.meta.tags["og:title"] ?? "";
//   const author = page.meta.tags["author"] ?? "";
//   const publishedOn = page.meta.tags["publish-date"] ?? "";
//   const description = page.meta.tags["og:description"] ?? "";

//   return html`
//     <!-- -->
//     <div style=${styles.container}>
//       <div style=${styles.wrap}>
//         <header styles=${styles.header}>
//           <p styles=${styles.url}>sanjibroy.com</p>
//         </header>
//         <div
//           style="flex: 1; padding-top: 60px; display: flex; flex-direction: column; margin-right: 20px;"
//         >
//           <h1 style=${styles.mainTitle}>${title}</h1>
//           <div style="margin-top: 32px; display: flex; flex-direction: column;">
//             <p
//               style="color: #f7f7f7; font-size: 20px; margin-top: 0; font-weight: 500;"
//             >
//               By ${author}
//             </p>
//             <p
//               style="font-size: 20px; font-weight: 500; margin-top: 0; color: #f7f7f7;"
//             >
//               On ${publishedOn}
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   `;
// };

// const globalContent = {
//   siteTitle: "sanjibroy.com",
// };

// const tokens = {
//   /* Shoelace "Sky" palette (https://shoelace.style/tokens/color) */
//   slColorSky_50: `rgb(19, 61, 87)`,
//   slColorSky_100: `rgb(21, 82, 122)`,
//   slColorSky_200: `rgb(19, 93, 138)`,
//   slColorSky_300: `rgb(18, 109, 166)`,
//   slColorSky_400: `rgb(22, 137, 204)`,
//   slColorSky_500: `rgb(17, 158, 226)`,
//   slColorSky_600: `rgb(39, 186, 253)`,
//   slColorSky_700: `rgb(105, 208, 255)`,
//   slColorSky_800: `rgb(166, 227, 255)`,
//   slColorSky_900: `rgb(203, 239, 255)`,
//   slColorSky_950: `rgb(232, 253, 255)`,
// };

// const icons = {
//   main: html`
//     <!--  -->
//     <svg
//       xmlns="http://www.w3.org/2000/svg"
//       viewBox="0 0 512 512"
//       width="4rem"
//       height="4rem"
//       fill="currentColor"
//     >
//       <!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
//       <path
//         d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM388.1 312.8c12.3-3.8 24.3 6.9 19.3 18.7C382.4 390.6 324.2 432 256.3 432s-126.2-41.4-151.1-100.5c-5-11.8 7-22.5 19.3-18.7c39.7 12.2 84.5 19 131.8 19s92.1-6.8 131.8-19zm-16.9-79.2c-17.6-23.5-52.8-23.5-70.4 0c-5.3 7.1-15.3 8.5-22.4 3.2s-8.5-15.3-3.2-22.4c30.4-40.5 91.2-40.5 121.6 0c5.3 7.1 3.9 17.1-3.2 22.4s-17.1 3.9-22.4-3.2zM176.4 176a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"
//       />
//     </svg>
//   `,
// };

// const styles = {
//   header: styled.div`
//     display: flex;
//     flex-wrap: wrap;
//     flex-direction: column;
//   `,

//   url: styled.div`
//     color: #f7f7f7;
//     font-size: 20px;
//     letter-spacing: -1px;
//     font-weight: 500;
//   `,

//   container: styled.div`
//     height: 100%;
//     width: 100%;
//     display: flex;
//     flex-direction: column;
//     justify-content: flex-end;
//     align-items: center;
//     background-color: rgb(41, 74, 171);
//     box-sizing: border-box;
//   `,

//   title: styled.div`
//     font-weight: 700;
//     font-size: 70px;
//     color: white;
//   `,

//   mainTitle: styled.div`
//     letter-spacing: -2px;
//     font-weight: 800;
//     color: #f7f7f7;
//     text-shadow: 0.15em 0.15em 0.5em #00111ad9;
//     font-size: 60px;
//     width: 100%;
//   `,

//   wrap: styled.div`
//     padding: 50px 75px 0px 75px;
//     height: 100%;
//     width: 100%;
//     display: flex;
//     justify-content: space-between;
//     flex-direction: column;
//     color: #f7f7f7;
//     gap: 1rem;
//   `,

//   description: styled.div`
//     text-overflow: ellipsis;
//     display: -webkit-box;
//     -webkit-line-clamp: 4;
//     -webkit-box-orient: vertical;
//     overflow: hidden;
//     white-space: pre-wrap;
//     text-overflow: ellipsis;
//     font-size: 40px;
//     margin: 1.5rem 0 2.5rem 0;
//     flex-direction: column;
//     width: 100%;
//     overflow: hidden;
//     border-left: 5px solid ${tokens.slColorSky_950};
//     padding: 0 40px 0 40px;
//     padding-bottom: 10px;
//   `,

//   logo1: styled.div`
//     display: flex;
//     align-items: center;
//     gap: 2rem;
//   `,

//   footer: styled.div`
//     display: flex;
//     align-items: center;
//     justify-content: space-between;
//     gap: 30px;
//     font-size: 40px;
//   `,
// };
// */
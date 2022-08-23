import browser from "webextension-polyfill";

const panel = await browser.devtools.panels.create("Redi Dependencies", "", "src/frontend/devtools/panel/index.html");


export { }
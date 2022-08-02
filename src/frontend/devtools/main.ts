import browser from "webextension-polyfill";

const panel = await browser.devtools.panels.create("Redi Dependencies", "", "src/entries/devtools/panel/index.html");


export { }
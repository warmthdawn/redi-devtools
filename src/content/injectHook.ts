

if (document instanceof Document) {
    // @ts-ignore:next-line
    const b = typeof browser !== 'undefined' ? browser : chrome
    
    const script = document.createElement('script');
    script.src = b.runtime.getURL("src/injected/hook.js");
    script.type = "module";
    document.documentElement.appendChild(script);
    script.parentNode!!.removeChild(script);
}

export { }
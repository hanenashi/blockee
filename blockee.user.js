// ==UserScript==
// @name         Blockee - Global Anti-Autoplay Toggle
// @namespace    http://tampermonkey.net/
// @version      2.2
// @description  Stops videos from aggressively autoplaying globally, with a menu toggle.
// @match        *://*/*
// @allFrames    true
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // --- Extension Sandbox Context ---
    // We keep the menu and storage logic here because the Page World cannot access GM_ functions.
    let isBlockingActive = GM_getValue('autoplay_blocker_state', true);
    let menuCommandId = null;

    function updateMenu() {
        if (menuCommandId !== null) GM_unregisterMenuCommand(menuCommandId);
        
        const menuText = isBlockingActive ? "🔴 Blockee: ACTIVE" : "🟢 Blockee: PASSIVE";
        menuCommandId = GM_registerMenuCommand(menuText, () => {
            isBlockingActive = !isBlockingActive;
            GM_setValue('autoplay_blocker_state', isBlockingActive);
            updateMenu();
            if (confirm("Blockee setting saved! Reload the page to apply?")) {
                location.reload();
            }
        });
    }

    updateMenu();

    // Exit immediately if the user toggled it off
    if (!isBlockingActive) return;


    // --- Raw Page Context Injection ---
    // We inject the fortress logic as a raw string so it executes in the same 
    // memory space as video.js, overriding their native functions.
    const pageScript = `
        (function() {
            let userInteracted = false;

            const unlockPlayback = () => {
                userInteracted = true;
                document.removeEventListener('click', unlockPlayback, { capture: true });
                document.removeEventListener('touchstart', unlockPlayback, { capture: true });
                document.removeEventListener('keydown', unlockPlayback, { capture: true });
            };

            document.addEventListener('click', unlockPlayback, { capture: true });
            document.addEventListener('touchstart', unlockPlayback, { capture: true });
            document.addEventListener('keydown', unlockPlayback, { capture: true });

            // 1. Hijack native .play() method inside the raw page
            const originalPlay = window.HTMLMediaElement.prototype.play;
            window.HTMLMediaElement.prototype.play = function() {
                if (!userInteracted) {
                    console.log('Blockee: Intercepted rogue .play() call.');
                    this.removeAttribute('autoplay');
                    return Promise.reject(new Error("Autoplay prevented by Blockee."));
                }
                return originalPlay.apply(this, arguments);
            };

            // 2. Hijack the 'autoplay' property setter
            const originalAutoplay = Object.getOwnPropertyDescriptor(window.HTMLMediaElement.prototype, 'autoplay');
            if (originalAutoplay) {
                Object.defineProperty(window.HTMLMediaElement.prototype, 'autoplay', {
                    configurable: true,
                    enumerable: true,
                    get: function() { return false; },
                    set: function(val) { console.log('Blockee: Blocked autoplay property setter.'); }
                });
            }

            // 3. Capture native 'play' events and instantly pause
            document.addEventListener('play', (e) => {
                if (!userInteracted && e.target instanceof window.HTMLMediaElement) {
                    console.log('Blockee: Native autoplay event detected. Forcing pause.');
                    e.target.pause();
                }
            }, true);

            // 4. Strip attributes from dynamically loaded DOM elements
            const observer = new MutationObserver(() => {
                document.querySelectorAll('video[autoplay], audio[autoplay]').forEach(media => {
                    media.removeAttribute('autoplay');
                });
            });
            
            observer.observe(document.documentElement, { childList: true, subtree: true });
            
            const stopObserver = () => observer.disconnect();
            document.addEventListener('touchstart', stopObserver, { once: true });
            document.addEventListener('click', stopObserver, { once: true });
            document.addEventListener('keydown', stopObserver, { once: true });
        })();
    `;

    // Create the script tag and inject it at the absolute top of the document
    const scriptEl = document.createElement('script');
    scriptEl.textContent = pageScript;
    
    // Inject it immediately (before `<head>` even fully forms)
    const target = document.head || document.documentElement;
    if (target) {
        target.appendChild(scriptEl);
        scriptEl.remove(); // Delete the tag immediately to stay invisible, the code stays in memory
    }
})();

// ==UserScript==
// @name         Blockee - Global Anti-Autoplay Toggle
// @namespace    http://tampermonkey.net/
// @version      2.3
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
    if (!isBlockingActive) return;

    // --- Raw Page Context Injection ---
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

            // 1. Hijack native methods
            const originalPlay = window.HTMLMediaElement.prototype.play;
            window.HTMLMediaElement.prototype.play = function() {
                if (!userInteracted) {
                    return Promise.reject(new Error("Autoplay prevented by Blockee."));
                }
                return originalPlay.apply(this, arguments);
            };

            // 2. Capture BOTH 'play' and 'playing' events
            const forcePause = (e) => {
                if (!userInteracted && e.target instanceof window.HTMLMediaElement) {
                    e.target.pause();
                }
            };
            document.addEventListener('play', forcePause, true);
            document.addEventListener('playing', forcePause, true);

            // 3. Destroy Framework Autoplay Attributes (The CSFD Fix)
            const observer = new MutationObserver(() => {
                const triggerAttributes = [
                    'autoplay',
                    'data-autoplay',
                    'data-autoplay-video',
                    'data-video-player-autoplay',
                    'data-recommended-autoplay'
                ];
                
                triggerAttributes.forEach(attr => {
                    document.querySelectorAll('[' + attr + ']').forEach(el => {
                        el.removeAttribute(attr);
                    });
                });
            });
            
            observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true });
            
            const stopObserver = () => observer.disconnect();
            document.addEventListener('touchstart', stopObserver, { once: true });
            document.addEventListener('click', stopObserver, { once: true });
            document.addEventListener('keydown', stopObserver, { once: true });
        })();
    `;

    const scriptEl = document.createElement('script');
    scriptEl.textContent = pageScript;
    const target = document.head || document.documentElement;
    if (target) {
        target.appendChild(scriptEl);
        scriptEl.remove(); 
    }
})();

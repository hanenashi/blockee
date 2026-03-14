// ==UserScript==
// @name         Blockee - Global Anti-Autoplay Toggle
// @namespace    http://tampermonkey.net/
// @version      2.1
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

    // Load state
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

    // Exit if passive
    if (!isBlockingActive) return;

    // --- Core Fortress Logic ---
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

    // 1. Hijack native .play() method
    const originalPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function() {
        if (!userInteracted) {
            console.log('Blockee: Intercepted rogue .play() call.');
            this.removeAttribute('autoplay');
            return Promise.reject(new Error("Autoplay prevented by Blockee."));
        }
        return originalPlay.apply(this, arguments);
    };

    // 2. Hijack the 'autoplay' property setter (catches video.autoplay = true)
    Object.defineProperty(HTMLMediaElement.prototype, 'autoplay', {
        configurable: true,
        enumerable: true,
        get: function() { return false; },
        set: function(val) { console.log('Blockee: Blocked autoplay property setter.'); }
    });

    // 3. The Nuclear Option: Capture native 'play' events and instantly pause
    document.addEventListener('play', (e) => {
        if (!userInteracted && e.target instanceof HTMLMediaElement) {
            console.log('Blockee: Native autoplay event detected. Forcing pause.');
            e.target.pause();
        }
    }, true); // true = capture phase, fires before the event bubbles

    // 4. Strip attributes from dynamically loaded DOM elements
    const observer = new MutationObserver(() => {
        document.querySelectorAll('video[autoplay], audio[autoplay]').forEach(media => {
            media.removeAttribute('autoplay');
        });
    });
    
    observer.observe(document.documentElement, { childList: true, subtree: true });
    
    // Cleanup observer once unlocked
    const stopObserver = () => observer.disconnect();
    document.addEventListener('touchstart', stopObserver, { once: true });
    document.addEventListener('click', stopObserver, { once: true });

})();

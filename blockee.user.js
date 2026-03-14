// ==UserScript==
// @name         Global Anti-Autoplay Toggle
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Stops videos from aggressively autoplaying globally, with a menu toggle.
// @match        *://*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // Load the saved state (defaults to true/active)
    let isBlockingActive = GM_getValue('autoplay_blocker_state', true);
    let menuCommandId = null;

    // Function to draw/update the menu button dynamically
    function updateMenu() {
        // Clear the old menu item if it exists
        if (menuCommandId !== null) {
            GM_unregisterMenuCommand(menuCommandId);
        }
        
        // Red switch when active (blocking), Green switch when passive (allowed)
        const menuText = isBlockingActive ? "🔴 Autoplay Blocker: ACTIVE" : "🟢 Autoplay Blocker: PASSIVE";
        
        menuCommandId = GM_registerMenuCommand(menuText, () => {
            // Toggle the state and save it
            isBlockingActive = !isBlockingActive;
            GM_setValue('autoplay_blocker_state', isBlockingActive);
            
            // Redraw the menu to reflect the new state
            updateMenu();
            
            // Because our block hijacks the native play function at document-start, 
            // a page reload is required to safely apply or remove the block.
            if (confirm("Setting saved! The page needs to reload to apply the changes. Reload now?")) {
                location.reload();
            }
        });
    }

    // Initialize the toggle menu
    updateMenu();

    // If the switch is passive (green), exit here and do not inject the blocker.
    if (!isBlockingActive) return;


    // --- Core Autoplay Blocking Logic ---
    let userInteracted = false;

    const unlockPlayback = () => {
        userInteracted = true;
        document.removeEventListener('click', unlockPlayback, { capture: true });
        document.removeEventListener('touchstart', unlockPlayback, { capture: true });
    };

    document.addEventListener('click', unlockPlayback, { capture: true });
    document.addEventListener('touchstart', unlockPlayback, { capture: true });

    // Hijack native media playback
    const originalPlay = HTMLMediaElement.prototype.play;

    HTMLMediaElement.prototype.play = function() {
        if (!userInteracted) {
            console.log('Global Anti-Autoplay: Blocked rogue autoplay request.');
            this.removeAttribute('autoplay');
            return Promise.reject(new Error("Autoplay prevented by userscript."));
        }
        return originalPlay.apply(this, arguments);
    };

    // Strip autoplay attributes from elements added to the DOM dynamically
    const observer = new MutationObserver(() => {
        document.querySelectorAll('video[autoplay], audio[autoplay]').forEach(media => {
            media.removeAttribute('autoplay');
        });
    });
    
    observer.observe(document.documentElement, { childList: true, subtree: true });
    
    // Cleanup observer once the user interacts
    const stopObserver = () => observer.disconnect();
    document.addEventListener('touchstart', stopObserver, { once: true });
    document.addEventListener('click', stopObserver, { once: true });

})();

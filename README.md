# Blockee

**[⬇️ Install Blockee](https://raw.githubusercontent.com/hanenashi/blockee/main/blockee.user.js)**

**TL;DR:** A global, multi-layered userscript that forcefully stops aggressive video autoplay across all websites. It acts as an absolute fortress against rogue media players by hijacking native JavaScript methods, intercepting DOM events, and stripping HTML attributes. Features a quick 🔴/🟢 toggle right in your Tampermonkey menu.

---

## Features

* **True Global Blocking:** Works on all domains (`*://*/*`), specifically targeting stubborn sites that bypass standard browser autoplay settings using custom players like Video.js.
* **Iframe Support:** Injects into all frames to catch videos hiding inside cross-origin embeds.
* **Menu Toggle:** Quickly turn the blocker on or off via the Tampermonkey extension menu.
    * 🔴 **ACTIVE:** Autoplay is strictly blocked.
    * 🟢 **PASSIVE:** Blocker is disabled, sites behave normally.
* **Mobile-Ready:** Fully supports touch events (`touchstart`), making it perfect for use on mobile browsers like Kiwi.

## How It Works (The Multi-Layered Defense)

Many modern websites bypass your browser's global autoplay settings by forcing playback via JavaScript. Blockee fights fire with fire using a 4-step lockdown at `document-start`:

1. **The Method Hijack:** Intercepts the native `HTMLMediaElement.prototype.play` method. If a site tries to call `.play()` before you physically interact with the page, Blockee rejects the promise and prevents playback.
2. **The Property Setter Hijack:** Blocks sites from triggering autoplay by redefining the `video.autoplay = true` JavaScript property.
3. **The Nuclear Option (Event Capture):** Sets up a capture-phase event listener that watches for native `play` events. If a video manages to start playing without user interaction, Blockee catches the event before it bubbles and instantly forces a `.pause()`.
4. **The Attribute Stripper:** Utilizes a `MutationObserver` to actively watch the DOM and strip HTML `<video autoplay>` attributes from any media elements dynamically loaded onto the page.

Once you intentionally tap, click, or press a key on the page, the lockdown is lifted and standard media controls function normally.

## Requirements

* A userscript manager like [Tampermonkey](https://www.tampermonkey.net/).
* 

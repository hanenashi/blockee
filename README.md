# Blockee

**[⬇️ Install Blockee](https://raw.githubusercontent.com/hanenashi/blockee/main/blockee.user.js)**

**TL;DR:** A global userscript that forcefully stops aggressive video autoplay across all websites. It hijacks the native JavaScript `.play()` method to block videos from starting until you physically interact with the page, and features a quick 🔴/🟢 toggle right in your Tampermonkey menu.

---

## Features

* **True Global Blocking:** Works on all domains (`*://*/*`), specifically targeting sites that bypass standard browser autoplay settings using custom players like Video.js.
* **Menu Toggle:** Quickly turn the blocker on or off via the Tampermonkey extension menu.
    * 🔴 **ACTIVE:** Autoplay is strictly blocked.
    * 🟢 **PASSIVE:** Blocker is disabled, sites behave normally.
* **Mobile-Ready:** Fully supports touch events (`touchstart`), making it perfect for use on mobile setups like Kiwi Browser.

## How It Works

Many modern websites bypass your browser's global autoplay settings by forcing a programmatic `.play()` call via their own JavaScript. 

Blockee fights fire with fire by injecting at `document-start` and hijacking the `HTMLMediaElement.prototype.play` method. If a website attempts to play media before you have tapped or clicked anywhere on the screen, Blockee silently catches the request, rejects the promise, and prevents playback. Once you interact with the page, standard media controls are unlocked.

It also utilizes a `MutationObserver` to actively strip `autoplay` attributes from any video elements dynamically loaded into the DOM.

## Requirements

* A userscript manager like [Tampermonkey](https://www.tampermonkey.net/).
* 

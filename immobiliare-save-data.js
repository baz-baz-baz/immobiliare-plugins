// ==UserScript==
// @name         Save Property Data to TXT
// @namespace    http://tampermonkey.net/
// @version      1.6
// @description  Extracts property name, price, and size from Immobiliare.it and formats for Google Sheets
// @author       You
// @match        *://www.immobiliare.it/*
// @updateURL    https://raw.githubusercontent.com/baz-baz-baz/immobiliare-plugins/main/immobiliare-save-data.js
// @downloadURL  https://raw.githubusercontent.com/baz-baz-baz/immobiliare-plugins/main/immobiliare-save-data.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function parsePrice(priceText) {
        let cleanedText = priceText.replace(/\./g, "");
        let match = cleanedText.match(/\d+/);

        return match ? parseFloat(match[0]) : 0;
    }

    function extractAndCopy() {
        let listings = document.querySelectorAll(".nd-mediaObject__content.in-listingCardPropertyContent");
        let extractedData = [];

        listings.forEach(listing => {
            let titleElement = listing.querySelector(".in-listingCardTitle");
            let priceElement = listing.querySelector(".in-listingCardPrice");
            let featureElements = listing.querySelectorAll(".in-listingCardFeatureList__item");

            if (titleElement && priceElement && featureElements.length > 0) {
                let title = titleElement.innerText.trim();
                let price = parsePrice(priceElement.innerText);

                let sqm = "N/A";
                featureElements.forEach(feature => {
                    let match = feature.innerText.match(/(\d+)\s*m²/);
                    if (match) sqm = match[1];
                });

                extractedData.push(`${title}\t\t${sqm}\t${price}`);
            }
        });

        if (extractedData.length > 0) {
            let content = extractedData.join("\n");

            // Copy the data to the clipboard
            navigator.clipboard.writeText(content).then(() => {
                alert("Property data has been copied to clipboard!");
            }).catch(err => {
                alert("Failed to copy data to clipboard: " + err);
            });
        } else {
            alert("No property data found.");
        }
    }

    // Create a modern floating button
    let button = document.createElement("button");
    button.innerText = "📄 Copia Dati";
    button.style.position = "fixed";
    button.style.top = "15px";
    button.style.right = "15px"; // Moved to top-right for better UX
    button.style.zIndex = "9999";
    button.style.padding = "12px 18px";
    button.style.backgroundColor = "#007BFF"; // Modern blue color
    button.style.color = "#fff";
    button.style.fontSize = "14px";
    button.style.fontWeight = "600";
    button.style.border = "none";
    button.style.marginTop = "44px";
    button.style.borderRadius = "8px"; // Rounded edges
    button.style.boxShadow = "0px 4px 6px rgba(0, 0, 0, 0.1)"; // Subtle shadow
    button.style.cursor = "pointer";
    button.style.transition = "all 0.2s ease-in-out";

    // Hover effect
    button.onmouseover = function() {
        button.style.backgroundColor = "#0056b3"; // Darker blue
        button.style.transform = "scale(1.05)"; // Slightly enlarge
    };
    button.onmouseleave = function() {
        button.style.backgroundColor = "#007BFF";
        button.style.transform = "scale(1)";
    };

    button.onclick = extractAndCopy;
    document.body.appendChild(button);
})();

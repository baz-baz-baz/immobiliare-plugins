// ==UserScript==
// @name         Save Property Data to Clipboard
// @namespace    http://tampermonkey.net/
// @version      1.9
// @description  Extracts property name, price, and size from Immobiliare.it
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
            let url = titleElement.getAttribute("href");
            let price = parsePrice(priceElement.innerText);

            let sqm = "N/A";
            featureElements.forEach(feature => {
                let match = feature.innerText.match(/(\d+)\s*m²/);
                if (match) sqm = match[1];
            });

            // Format for Google Sheets: =HYPERLINK("url", "title")
            let linkedTitle = `=HYPERLINK("${url}"; "${title.replace(/"/g, '""')}")`;
            extractedData.push(`${linkedTitle}\t${sqm}\t${price}`);
        }
    });

    if (extractedData.length > 0) {
        let content = extractedData.join("\n");

        navigator.clipboard.writeText(content).then(() => {
            alert("Property data with clickable links copied for Google Sheets!");
        }).catch(err => {
            alert("Failed to copy data to clipboard: " + err);
        });
    } else {
        alert("No property data found.");
    }
}


    // Create a side button
    let button = document.createElement("button");
    button.innerText = "📄";
    button.style.position = "fixed";
    button.style.top = "50%";
    button.style.left = "0"; // Positioned to the left side
    button.style.zIndex = "9999";
    button.style.padding = "12px 18px";
    button.style.backgroundColor = "#007BFF"; // Modern blue color
    button.style.color = "#fff";
    button.style.fontSize = "14px";
    button.style.fontWeight = "600";
    button.style.border = "none";
    button.style.borderRadius = "8px"; // Rounded edges
    button.style.boxShadow = "0px 4px 6px rgba(0, 0, 0, 0.1)"; // Subtle shadow
    button.style.cursor = "pointer";
    button.style.transition = "all 0.3s ease-in-out";
    button.style.width = "50px"; // Narrow width initially
    button.style.height = "50px"; // Make the button square
    button.style.textAlign = "center"; // Center the text
    button.style.overflow = "hidden"; // Hide the expanded text when not hovered

    // Add the text that will appear after expansion
    let buttonText = document.createElement("span");
    buttonText.innerText = " Copia Dati";
    buttonText.style.display = "none"; // Initially hidden
    button.appendChild(buttonText);

    // Hover effect to show the full button
    button.onmouseover = function() {
        button.style.width = "200px"; // Expand the button width on hover
        buttonText.style.display = "inline"; // Show the full text
        button.style.backgroundColor = "#0056b3"; // Darker blue
        button.style.transform = "scale(1.05)"; // Slightly enlarge
    };

    button.onmouseleave = function() {
        button.style.width = "50px"; // Reset width
        buttonText.style.display = "none"; // Hide the text
        button.style.backgroundColor = "#007BFF"; // Reset to original color
        button.style.transform = "scale(1)"; // Reset to original size
    };

    button.onclick = extractAndCopy;
    document.body.appendChild(button);
})();

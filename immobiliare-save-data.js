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

    function saveTextFile(filename, content) {
        const blob = new Blob([content], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

     function parsePrice(priceText) {
        let cleanedText = priceText.replace(/\./g, "");
        let match = cleanedText.match(/\d+/);

        return match ? parseFloat(match[0]) : 0;
    }

    function extractAndSave() {
        let listings = document.querySelectorAll(".nd-mediaObject__content.in-listingCardPropertyContent");
        let extractedData = [];

        listings.forEach(listing => {
            let titleElement = listing.querySelector(".in-listingCardTitle");
            let priceElement = listing.querySelector(".in-listingCardPrice");
            let featureElements = listing.querySelectorAll(".in-listingCardFeatureList__item");

            if (titleElement && priceElement && featureElements.length > 0) {
                let title = titleElement.innerText.trim();
                let price = parsePrice(priceElement.innerText);

                // Find the square meters from feature list
                let sqm = "N/A";
                featureElements.forEach(feature => {
                    let match = feature.innerText.match(/(\d+)\s*m²/);
                    if (match) sqm = match[1];
                });

                // Format the output with tabs so it pastes correctly into Google Sheets
                extractedData.push(`${title}\t\t${sqm}\t${price}`);
            }
        });

        if (extractedData.length > 0) {
            let content = extractedData.join("\n"); // Each property on a new line
            saveTextFile("property_data.txt", content);
            alert("Property data has been saved!");
        } else {
            alert("No property data found.");
        }


    }

    // Create a modern floating button
    let button = document.createElement("button");
    button.innerText = "📄 Salva Dati";
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

    button.onclick = extractAndSave;
    document.body.appendChild(button);
})();

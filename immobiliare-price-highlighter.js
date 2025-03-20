// ==UserScript==
// @name         Price Highlighter Githib Sync
// @namespace    http://tampermonkey.net/
// @version      1.6
// @description  Highlight properties on Immobiliare.it that are below average price per square meter and show scostamento percentage
// @author       You
// @match        https://www.immobiliare.it/*
// @updateURL    https://raw.githubusercontent.com/baz-baz-baz/immobiliare-plugins/refs/heads/main/immobiliare-price-highlighter.js
// @downloadURL  https://raw.githubusercontent.com/baz-baz-baz/immobiliare-plugins/refs/heads/main/immobiliare-price-highlighter.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Dynamically load Google Fonts for Roboto
    let link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Roboto:wght@400;600&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    function extractListings() {
        let listings = document.querySelectorAll(".nd-mediaObject__content.in-listingCardPropertyContent");
        let prices = [];
        let data = [];

        listings.forEach(listing => {
            let priceElement = listing.querySelector(".in-listingCardPrice");
            let features = listing.querySelectorAll(".in-listingCardFeatureList__item");

            if (!priceElement || features.length < 2) return;

            let price = parsePrice(priceElement.innerText);
            let sqm = parseSqm(features);

            if (price && sqm) {
                let pricePerSqm = price / sqm;
                prices.push(pricePerSqm);
                data.push({ element: listing, pricePerSqm });
            }
        });

        if (prices.length === 0) return;

        let average = prices.reduce((a, b) => a + b, 0) / prices.length;

        data.forEach(item => {
            let scostamento = calculateScostamento(item.pricePerSqm, average);
            item.scostamento = scostamento;
        });

        highlightListings(data, average);
    }

    function parsePrice(priceText) {
        let cleanedText = priceText.replace(/\./g, "");
        let match = cleanedText.match(/\d+/);

        return match ? parseFloat(match[0]) : 0;
    }

    function parseSqm(features) {
        for (let feature of features) {
            let match = feature.textContent.trim().match(/(\d+(\.\d+)?)\s*m²/);
            if (match) return parseFloat(match[1]);
        }
        return 0;
    }

    function calculateScostamento(pricePerSqm, average) {
        return ((pricePerSqm - average * 0.70) / (average * 0.70));
    }

    function getScostamentoColor(scostamento) {
        if (scostamento >= 0.80) return "#FF0000"; // Red (80% and higher)
        if (scostamento >= 0 && scostamento < 0.10) return "#0000FF"; // Blue (0% to 10%)
        if (scostamento <= 0) return "#800080"; // Purple (under 0%)
    }

    function highlightListings(data, average) {
        data.forEach(({ element, pricePerSqm, scostamento }) => {
            let scostamentoText = `${(scostamento * 100).toFixed(2)}%`;
            let scostamentoColor = getScostamentoColor(scostamento);

            let scostamentoElement = document.createElement("span");
            scostamentoElement.textContent = `Scostamento [ ${scostamentoText} ]`;
            scostamentoElement.style.color = scostamentoColor;
            scostamentoElement.style.fontWeight = "300";
            scostamentoElement.style.marginLeft = "10px";
            scostamentoElement.style.marginTop = "10px";
            scostamentoElement.style.marginBottom = "4px";
            scostamentoElement.style.fontSize = "14px";
            scostamentoElement.style.fontFamily = "Roboto, sans-serif";  // Using Roboto

            element.appendChild(scostamentoElement);

            // Highlight only if scostamento is less than 10% and set border color to scostamentoColor
            if (scostamento < 0.10) {
                element.style.border = `4px solid ${scostamentoColor}`;
                element.style.borderRadius = "6px";
                element.style.padding = "5px";
            }
        });

        // Create and display average price info box in the target div
        let infoBox = document.createElement("div");
        infoBox.style.background = "rgba(30, 30, 30, 0.9)";
        infoBox.style.color = "#fff";
        infoBox.style.padding = "12px 16px";
        infoBox.style.zIndex = "9999";
        infoBox.style.borderRadius = "6px";
        infoBox.style.fontFamily = "Roboto, sans-serif"; // Apply Roboto font
        infoBox.style.fontSize = "16px";
        infoBox.style.fontWeight = "light";
        infoBox.style.boxShadow = "0 14px 16px rgba(0, 0, 0, 0.2)";
        infoBox.innerHTML = `€/m² - ${average.toFixed(2)} €`;

        // Find the div with the class 'leaflet-control-row leaflet-top' and append the info box to it
        let targetDiv = document.querySelector('.leaflet-control-row.leaflet-top');
        if (targetDiv) {
            targetDiv.appendChild(infoBox);
        }
    }

    setTimeout(extractListings, 3000); // Wait for the page to load
})();

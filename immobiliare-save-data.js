// ==UserScript==
// @name         Immobiliare.it Excel + URL JSON
// @namespace    http://tampermonkey.net/
// @version      1.6
// @description  Estrae titolo, MQ, prezzo da Immobiliare.it e copia pronto per Excel
// @author       Emiliano
// @match        https://www.immobiliare.it/search-list/*
// @updateURL    https://raw.githubusercontent.com/baz-baz-baz/immobiliare-plugins/main/immobiliare-save-data.js
// @downloadURL  https://raw.githubusercontent.com/baz-baz-baz/immobiliare-plugins/main/immobiliare-save-data.js
// @grant        GM_setClipboard
// ==/UserScript==

(function() {
    'use strict';

    const API_PREFIX =
        "https://www.immobiliare.it/api-next/search-list/listings/?";

    let capturedApiUrl = null;

    // ============================================================
    // CAPTURE FETCH REQUESTS
    // ============================================================

    const originalFetch = window.fetch;

    window.fetch = function(...args) {
        try {
            const url =
                typeof args[0] === 'string'
                    ? args[0]
                    : args[0] instanceof Request
                        ? args[0].url
                        : '';

            if (url.startsWith(API_PREFIX)) {
                capturedApiUrl = url;
                console.log("Immobiliare API captured:", capturedApiUrl);
            }
        } catch (e) {
            console.warn("Fetch interception error:", e);
        }

        return originalFetch.apply(this, args);
    };


    // ============================================================
    // CAPTURE XMLHttpRequest REQUESTS
    // ============================================================

    const originalOpen = XMLHttpRequest.prototype.open;

    XMLHttpRequest.prototype.open = function(method, url, ...rest) {

        try {
            if (
                typeof url === 'string' &&
                url.startsWith(API_PREFIX)
            ) {
                capturedApiUrl = url;
                console.log("Immobiliare XHR API captured:", capturedApiUrl);
            }
        } catch (e) {
            console.warn("XHR interception error:", e);
        }

        return originalOpen.call(this, method, url, ...rest);
    };


    // ============================================================
    // ALSO CHECK PERFORMANCE RESOURCES
    // ============================================================

    function findLatestApiUrl() {

        // First use the most recently intercepted URL
        if (capturedApiUrl) {
            return capturedApiUrl;
        }

        // Otherwise look through network resources
        const resources = performance
            .getEntriesByType("resource")
            .map(e => e.name)
            .filter(u => u.startsWith(API_PREFIX));

        if (resources.length > 0) {
            return resources[resources.length - 1];
        }

        return null;
    }


    // ============================================================
    // CREATE BUTTON
    // ============================================================

    const btn = document.createElement('button');

    btn.textContent = "Copy!";

    btn.style.position = "fixed";
    btn.style.top = "50%";
    btn.style.left = "0%";
    btn.style.transform = "translateY(-50%)";
    btn.style.zIndex = "10000";
    btn.style.padding = "12px 20px";
    btn.style.backgroundColor = "#7FDBFF";
    btn.style.color = "#000";
    btn.style.border = "none";
    btn.style.borderRadius = "5px";
    btn.style.cursor = "pointer";
    btn.style.fontFamily = "'Montserrat', sans-serif";
    btn.style.fontSize = "14px";
    btn.style.transition = "all 0.2s ease";

    btn.addEventListener("mouseenter", () => {
        btn.style.backgroundColor = "#39C0ED";
        btn.style.transform =
            "translateY(-50%) scale(1.05)";
    });

    btn.addEventListener("mouseleave", () => {
        btn.style.backgroundColor = "#7FDBFF";
        btn.style.transform =
            "translateY(-50%) scale(1)";
    });

    document.body.appendChild(btn);


    // ============================================================
    // COPY DATA
    // ============================================================

    btn.addEventListener('click', async () => {

        const apiUrl = findLatestApiUrl();

        if (!apiUrl) {
            alert(
                "URL JSON non trovato.\n\n" +
                "Vai alla pagina dei risultati e attendi che gli annunci siano caricati, " +
                "poi premi Copy!"
            );
            return;
        }

        console.log("Using Immobiliare API URL:", apiUrl);

        btn.textContent = "Loading...";

        try {

            const response = await fetch(apiUrl, {
                headers: {
                    "Accept": "application/json",
                    "X-Requested-With": "XMLHttpRequest"
                },
                credentials: "include"
            });

            if (!response.ok) {
                throw new Error(
                    `Risposta HTTP non valida: ${response.status}`
                );
            }

            const data = await response.json();

            const listings = data?.results;

            if (!listings || listings.length === 0) {
                alert(
                    "Nessun annuncio trovato nella risposta API."
                );

                btn.textContent = "Copy!";
                return;
            }


            // ====================================================
            // CONVERT LISTINGS TO EXCEL FORMAT
            // ====================================================

            const output = listings.map(item => {

                const realEstate = item.realEstate;

                const title =
                    realEstate?.title || "N/A";

                const link =
                    item.seo?.url || "#";


                const prop =
                    realEstate?.properties?.[0];

                const surface = prop?.surface
                    ? String(prop.surface).replace(/\D/g, '')
                    : "N/A";


                // PRICE

                const priceObj =
                    realEstate?.price;

                let price = "N/A";

                if (priceObj) {

                    if (priceObj.visible === false) {

                        price = "Su richiesta";

                    } else if (priceObj.value != null) {

                        price = priceObj.value;

                    } else if (priceObj.formattedValue) {

                        price = priceObj.formattedValue;
                    }
                }


                // EXCEL HYPERLINK

                const excelTitle =
                    `=COLLEG.IPERTESTUALE("${link}";"${title}")`;


                return `${excelTitle}\t${surface}\t${price}`;

            }).join("\n");


            console.log(
                `Copied ${listings.length} listings`
            );

            console.log(output);


            GM_setClipboard(output);

            alert(
                `${listings.length} annunci copiati negli appunti!\n\n` +
                "Puoi incollarli direttamente in Excel."
            );

        } catch (err) {

            console.error(
                "Errore durante il recupero dei dati:",
                err
            );

            alert(
                `Errore durante il recupero dei dati:\n${err.message}`
            );

        } finally {

            btn.textContent = "Copy!";
        }

    });

})();

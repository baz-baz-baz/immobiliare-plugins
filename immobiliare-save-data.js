// ==UserScript==
// @name         Immobiliare.it Excel + URL JSON
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Estrae titolo, MQ, prezzo da Immobiliare.it e copia pronto per Excel
// @author       Emiliano
// @match        https://www.immobiliare.it/search-list/*
// @updateURL    https://raw.githubusercontent.com/baz-baz-baz/immobiliare-plugins/main/immobiliare-save-data.js
// @downloadURL  https://raw.githubusercontent.com/baz-baz-baz/immobiliare-plugins/main/immobiliare-save-data.js
// @grant        GM_setClipboard
// ==/UserScript==

(function() {
    'use strict';

    // Intercetta le chiamate API in tempo reale (fix buffer performance)
    let capturedApiUrl = null;
    const API_PREFIX = "https://www.immobiliare.it/api-next/search-list/listings/?";

    const _originalFetch = window.fetch;
    window.fetch = function(...args) {
        const url = typeof args[0] === 'string' ? args[0] : (args[0] instanceof Request ? args[0].url : '');
        if (url.startsWith(API_PREFIX)) {
            capturedApiUrl = url;
        }
        return _originalFetch.apply(this, args);
    };

    const _originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
        if (typeof url === 'string' && url.startsWith(API_PREFIX)) {
            capturedApiUrl = url;
        }
        return _originalOpen.call(this, method, url, ...rest);
    };

    // --- Crea il bottone ---
    const btn = document.createElement('button');
    btn.textContent = "Copy!";

    btn.style.position = "fixed";
    btn.style.top = "50%";
    btn.style.left = "0%";
    btn.style.transform = "translateY(-50%)";
    btn.style.zIndex = 10000;
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
        btn.style.transform = "translateY(-50%) scale(1.05)";
    });
    btn.addEventListener("mouseleave", () => {
        btn.style.backgroundColor = "#7FDBFF";
        btn.style.transform = "translateY(-50%) scale(1)";
    });

    document.body.appendChild(btn);

    // --- Logica del bottone ---
    btn.addEventListener('click', () => {
        const apiUrl = capturedApiUrl || performance.getEntriesByType("resource")
            .map(e => e.name)
            .find(u => u.startsWith(API_PREFIX));

        if (!apiUrl) {
            alert("URL JSON non trovato. Interagisci con la mappa o aggiorna la lista e riprova.");
            return;
        }

        console.log("URL JSON trovato:", apiUrl);

        fetch(apiUrl, {
            headers: {
                "Accept": "application/json",
                "X-Requested-With": "XMLHttpRequest"
            },
            credentials: "include"
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Risposta HTTP non valida: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // La struttura reale è data.results (array diretto, verificato sull'API)
            const listings = data?.results;

            if (!listings || listings.length === 0) {
                alert("Nessun annuncio trovato nella risposta API. Riprova dopo aver interagito con la mappa.");
                return;
            }

            const output = listings.map(item => {
                const realEstate = item.realEstate;
                const title = realEstate?.title || "N/A";
                const link = item.seo?.url || "#";

                const prop = realEstate?.properties?.[0];
                const surface = prop?.surface
                    ? String(prop.surface).replace(/\D/g, '')
                    : "N/A";

                // Alcuni annunci hanno price.visible = false ("prezzo su richiesta")
                // In quel caso value non esiste, usiamo formattedValue come fallback
                const priceObj = realEstate?.price;
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

                const excelTitle = `=COLLEG.IPERTESTUALE("${link}";"${title}")`;
                return `${excelTitle}\t${surface}\t${price}`;
            }).join("\n");

            console.log(output);
            GM_setClipboard(output);
            alert("Dati pronti per Excel copiati negli appunti!");
        })
        .catch(err => {
            console.error("Errore nella richiesta:", err);
            alert(`Errore durante il recupero dei dati: ${err.message}`);
        });
    });
})();

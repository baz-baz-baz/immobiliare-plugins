// ==UserScript==
// @name         Immobiliare.it Excel + URL JSON
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Estrae titolo, MQ, prezzo da Immobiliare.it e copia pronto per Excel
// @author       Emiliano
// @match        https://www.immobiliare.it/search-list/*
// @updateURL    https://raw.githubusercontent.com/baz-baz-baz/immobiliare-plugins/main/immobiliare-save-data.js
// @downloadURL  https://raw.githubusercontent.com/baz-baz-baz/immobiliare-plugins/main/immobiliare-save-data.js
// @grant        GM_setClipboard
// ==/UserScript==

(function() {
    'use strict';

    // Crea il bottone
    const btn = document.createElement('button');
    btn.textContent = "Copy!";

    // Stili principali
    btn.style.position = "fixed";
    btn.style.top = "50%"; // metà pagina verticale
    btn.style.left = "0%"// verso sinistra
    btn.style.transform = "translateY(-50%)"; // centra verticalmente rispetto al top
    btn.style.zIndex = 10000;
    btn.style.padding = "12px 20px";
    btn.style.backgroundColor = "#7FDBFF"; // azzurro chiaro
    btn.style.color = "#000";//testo nero
    btn.style.border = "none";
    btn.style.borderRadius = "5px";
    btn.style.cursor = "pointer";
    btn.style.fontFamily = "'Montserrat', sans-serif";
    btn.style.fontSize = "14px";
    btn.style.transition = "all 0.2s ease"; // transizione per hover

    // Hover effect
    btn.addEventListener("mouseenter", () => {
        btn.style.backgroundColor = "#39C0ED"; // colore più scuro al passaggio del mouse
        btn.style.transform = "translateY(-50%) scale(1.05)";
    });
    btn.addEventListener("mouseleave", () => {
        btn.style.backgroundColor = "#7FDBFF";
        btn.style.transform = "translateY(-50%) scale(1)";
    });

    document.body.appendChild(btn);

    // Funzione del bottone
    btn.addEventListener('click', () => {
        const apiUrl = performance.getEntriesByType("resource")
            .map(e => e.name)
            .find(u => u.startsWith("https://www.immobiliare.it/api-next/search-list/listings/?"));

        if(!apiUrl) {
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
        .then(response => response.json())
        .then(data => {
            const listings = data.results;

            const output = listings.map(item => {
                const realEstate = item.realEstate;
                const title = realEstate.title || "N/A";
                const link = item.seo && item.seo.url ? item.seo.url : "#";
                const prop = realEstate.properties[0];
                const surface = prop && prop.surface ? String(prop.surface).replace(/\D/g,'') : "N/A";
                const price = realEstate.price ? realEstate.price.value : "N/A";

                const excelTitle = `=COLLEG.IPERTESTUALE("${link}";"${title}")`;

                return `${excelTitle}\t${surface}\t${price}`;
            }).join("\n");

            console.log(output);
            GM_setClipboard(output);
            alert("Dati pronti per Excel copiati negli appunti!");
        })
        .catch(err => console.error("Errore nella richiesta:", err));
    });
})();

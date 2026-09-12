// ==UserScript==
// @name         Immobiliare.it Excel + URL JSON
// @namespace    http://tampermonkey.net/
// @version      1.7
// @description  Estrae titolo, MQ, prezzo da Immobiliare.it e copia pronto per Excel
// @author       Emiliano
// @match        https://www.immobiliare.it/search-list/*
// @updateURL    https://raw.githubusercontent.com/baz-baz-baz/immobiliare-plugins/main/immobiliare-save-data.js
// @downloadURL  https://raw.githubusercontent.com/baz-baz-baz/immobiliare-plugins/main/immobiliare-save-data.js
// @grant        GM_setClipboard
// ==/UserScript==

(function () {
    'use strict';

    const API_BASE =
        'https://www.immobiliare.it/api-next/search-list/listings/';

    // ============================================================
    // GET CURRENT PAGE NUMBER
    // ============================================================

    function getCurrentPage() {
        const params = new URLSearchParams(window.location.search);
        return params.get('pag') || '1';
    }


    // ============================================================
    // BUILD API URL FROM CURRENT PAGE URL
    // ============================================================

    function buildApiUrl() {

        const pageUrl = new URL(window.location.href);

        const pageParams = pageUrl.searchParams;

        const apiParams = new URLSearchParams();

        // Copy all search parameters from the Immobiliare page
        for (const [key, value] of pageParams.entries()) {
            apiParams.append(key, value);
        }

        // Make sure the page parameter is present
        apiParams.set('pag', getCurrentPage());

        // These parameters are used by Immobiliare's API
        apiParams.set('paramsCount', '5');
        apiParams.set('path', '/search-list/');

        return API_BASE + '?' + apiParams.toString();
    }


    // ============================================================
    // CREATE BUTTON
    // ============================================================

    const btn = document.createElement('button');

    btn.textContent = 'Copy!';

    btn.style.position = 'fixed';
    btn.style.top = '50%';
    btn.style.left = '0';
    btn.style.transform = 'translateY(-50%)';
    btn.style.zIndex = '10000';
    btn.style.padding = '12px 20px';
    btn.style.backgroundColor = '#7FDBFF';
    btn.style.color = '#000';
    btn.style.border = 'none';
    btn.style.borderRadius = '5px';
    btn.style.cursor = 'pointer';
    btn.style.fontFamily = "'Montserrat', sans-serif";
    btn.style.fontSize = '14px';
    btn.style.transition = 'all 0.2s ease';

    btn.addEventListener('mouseenter', () => {
        btn.style.backgroundColor = '#39C0ED';
        btn.style.transform =
            'translateY(-50%) scale(1.05)';
    });

    btn.addEventListener('mouseleave', () => {
        btn.style.backgroundColor = '#7FDBFF';
        btn.style.transform =
            'translateY(-50%) scale(1)';
    });

    document.body.appendChild(btn);


    // ============================================================
    // COPY BUTTON
    // ============================================================

    btn.addEventListener('click', async () => {

        const currentPage = getCurrentPage();
        const apiUrl = buildApiUrl();

        console.log('Current Immobiliare page:', currentPage);
        console.log('API URL:', apiUrl);

        btn.textContent = 'Loading...';

        try {

            const response = await fetch(apiUrl, {
                method: 'GET',

                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },

                credentials: 'include'
            });


            if (!response.ok) {
                throw new Error(
                    `Risposta HTTP non valida: ${response.status}`
                );
            }


            const data = await response.json();

            console.log(
                'Immobiliare API response:',
                data
            );


            // ====================================================
            // GET LISTINGS
            // ====================================================

            const listings = data?.results;


            if (!Array.isArray(listings) || listings.length === 0) {

                alert(
                    `Nessun annuncio trovato nella pagina ${currentPage}.`
                );

                return;
            }


            // ====================================================
            // CONVERT LISTINGS TO EXCEL
            // ====================================================

            const output = listings.map(item => {

                const realEstate = item?.realEstate;

                const title =
                    realEstate?.title || 'N/A';


                const link =
                    item?.seo?.url || '#';


                // ------------------------------------------------
                // SURFACE
                // ------------------------------------------------

                const prop =
                    realEstate?.properties?.[0];


                const surface =
                    prop?.surface
                        ? String(prop.surface).replace(/\D/g, '')
                        : 'N/A';


                // ------------------------------------------------
                // PRICE
                // ------------------------------------------------

                const priceObj =
                    realEstate?.price;


                let price = 'N/A';


                if (priceObj) {

                    if (priceObj.visible === false) {

                        price = 'Su richiesta';

                    } else if (priceObj.value != null) {

                        price = priceObj.value;

                    } else if (priceObj.formattedValue) {

                        price = priceObj.formattedValue;
                    }
                }


                // ------------------------------------------------
                // EXCEL HYPERLINK
                // ------------------------------------------------

                const excelTitle =
                    `=COLLEG.IPERTESTUALE("${link}";"${title}")`;


                return `${excelTitle}\t${surface}\t${price}`;

            }).join('\n');


            // ====================================================
            // COPY TO CLIPBOARD
            // ====================================================

            GM_setClipboard(output);


            console.log(
                `Page ${currentPage}: ${listings.length} listings copied.`
            );


            alert(
                `${listings.length} annunci della pagina ${currentPage} ` +
                `copiati negli appunti!\n\n` +
                `Puoi incollarli direttamente in Excel.`
            );


        } catch (error) {

            console.error(
                'Errore durante il recupero dei dati:',
                error
            );


            alert(
                `Errore durante il recupero dei dati:\n\n` +
                error.message
            );


        } finally {

            btn.textContent = 'Copy!';
        }

    });

})();

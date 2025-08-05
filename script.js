// Stockage de l'id_user
window.addEventListener("message", (event) => {
    if (event.source !== window) return; // sécurité
    if (event.data.type && event.data.type === "FROM_WEB_APP") {
        console.log("Message reçu de la page web :", event.data.data);
        // tu peux maintenant faire ce que tu veux avec cette info
        // Stocker une donnée
        chrome.storage.sync.set({ key: event.data.data }, () => {
            console.log("Donnée stockée !");
        }); 
    }
});

// Fonction pour extraire la saison et l'épisode
function extraireSaisonEtEpisode(titre) {
    // On extrait tous les nombres de la chaîne
    const numbers = titre.match(/\d+/g);

    if (!numbers) return [];

    // S'il y a un seul nombre → épisode uniquement
    if (numbers.length === 1) {
        return { 
            saison: 1, 
            episode: parseInt(numbers[0], 10) 
        };
    }

    // S'il y a deux nombres → saison + épisode
    return {
        saison: parseInt(numbers[0], 10),
        episode: parseInt(numbers[1], 10),
    };
}

// Exécution du code spécifique à la plateforme
let url = window.location.href
let nom = "", saison = "", ep = "", img = "", domain = "", categorie = "";
let urlSplit = url.split("/");

// Papadustream
if (url.includes("papadustream")) {
    // Empêche le site de nettoyer la console
    console.clear = () => {};
    
    // Envoie des infos
    if (urlSplit.length >= 8) {
        // Récupération des infos
        nom = urlSplit[5].split("-").slice(1).join(" ").toUpperCase();
        saison = urlSplit[6][0];
        ep = parseInt(urlSplit[7]);
        domain = urlSplit[2];
        img = 
            document.querySelector("#full_header-bg .full_header__bg-img").style.backgroundImage.slice(4, -1).replace(/"/g, "").includes("https") 
            ? document.querySelector("#full_header-bg .full_header__bg-img").style.backgroundImage.slice(4, -1).replace(/"/g, "") 
            : "https://" + domain + document.querySelector("#full_header-bg .full_header__bg-img").style.backgroundImage.slice(4, -1).replace(/"/g, "");
        categorie = urlSplit[4].includes("animation") ? "animé" : "série";
        sendData(nom, saison, ep, img, domain, categorie);
    }

}

// Anime sama
if (url.includes("anime-sama")) {
    // Récupération des infos
    nom = urlSplit[4].replaceAll("-", " ").toUpperCase();
    saison = urlSplit[5] == "film" ? 0 : urlSplit[5][6];
    ep = urlSplit[5] == "film" ? 0 : document.getElementById("selectEpisodes")?.value.split(" ")[1] || "";
    img = document.getElementById("imgOeuvre")?.getAttribute("src") || "";
    domain = "anime-sama.fr";
    categorie = urlSplit[5] == "film" ? "film" : "animé";

    // Attendre que la vidéo apparaisse dans le DOM
    const waitForVideo = setInterval(() => {
        const video = document.querySelector("video");

        if (video) {
            clearInterval(waitForVideo);
            console.log("[EXT] Vidéo détectée, suivi lancé.");

            // Envoie des données à supabase dès le chargement de la vidéo
            sendData(nom, saison, ep, img, domain, categorie);

            // Envoie des données à supabase à la fermetture de la page
            window.addEventListener("beforeunload", () => {
                // Récupération des infos
                nom = urlSplit[4].replaceAll("-", " ").toUpperCase();
                saison = urlSplit[5] == "film" ? 0 : urlSplit[5][6];
                ep = urlSplit[5] == "film" ? 0 : document.getElementById("selectEpisodes")?.value.split(" ")[1] || "";
                img = document.getElementById("imgOeuvre")?.getAttribute("src") || "";
                domain = "anime-sama.fr";
                categorie = urlSplit[5] == "film" ? "film" : "animé";

                // Envoie des infos
                sendData(nom, saison, ep, img, domain, categorie);
            });
        }
    }, 1000);
}

//  Voiranime
if (url.includes("voiranime")) {

    // Envoie des infos
    if (urlSplit.length >= 7) {
        // Récupération des infos
        nom = document.querySelectorAll('.breadcrumb li a')[1].innerText.toUpperCase();

        fetch(`https://api.jikan.moe/v4/anime?q=${nom}`)
            .then(response => response.json())
            .then(data => {
                // console.log(data.data[0].mal_id);
                fetch(`https://api.jikan.moe/v4/anime/${data.data[0].mal_id}/pictures`)
                    .then(response => response.json())
                    .then(data => {
                        img = data.data[0].webp.large_image_url;
                        saison = extraireSaisonEtEpisode(urlSplit[5]).saison || 0;
                        ep = extraireSaisonEtEpisode(urlSplit[5]).episode || 0;
                        domain = urlSplit[2];
                        categorie = url.includes("film") ? "film" : "animé";
                
                        sendData(nom, saison, ep, img, domain, categorie);
                        console.log(nom, saison, ep, domain, img, categorie);
                    })
            })
    }

    
}

if (url.includes("voirdrama")) {

    if (urlSplit.length >= 7) {
        nom = document.querySelectorAll('.breadcrumb li a')[1].innerText.toUpperCase();
        img = "";
        saison = extraireSaisonEtEpisode(urlSplit[5]).saison || 0;
        ep = extraireSaisonEtEpisode(urlSplit[5]).episode || 0;
        domain = urlSplit[2];
        categorie = url.includes("film") ? "film" : "série";
    
        sendData(nom, saison, ep, img, domain, categorie);
        console.log(nom, saison, ep, domain, img, categorie);
    }

}

if (url.includes("empire-stream")) {

    // Extraction d'informations
    function extractEmpireStreamData(url) {
        try {
            const u = new URL(url);
            const domain = u.hostname;
            const pathname = u.pathname;
    
            // Détermination de la catégorie
            const isSerie = pathname.includes("/serie/");
            const categorie = isSerie ? "série" : "film";
    
            // Titre brut extrait du chemin et décodé
            const pathParts = pathname.split("/");
            const rawSlug = decodeURIComponent(pathParts[2] || "");  // 👈 Ajout du decodeURIComponent
    
            // Nettoyage du titre
            const cleanedTitle = rawSlug
                .replace(/-en-streaming.*$/i, "")
                .replace(/-/g, " ")
                .replace(/\s+/g, " ")
                .trim()
                .toUpperCase();
    
            // Saison & épisode
            const saison = isSerie ? u.searchParams.get("saison") || "1" : "0";
            const episode = isSerie ? u.searchParams.get("episode") || "1" : "0";
    
            return {
                nom: cleanedTitle,
                saison,
                episode,
                categorie,
                domain
            };
        } catch (err) {
            console.error("URL invalide :", err);
            return null;
        }
    }
     

    window.addEventListener('beforeunload', () => {

        if (urlSplit.length >= 6) {
        // Récupération des infos
        url = window.location.href
        nom = extractEmpireStreamData(url).nom;
        saison = extractEmpireStreamData(url).saison;
        ep = extractEmpireStreamData(url).episode;
        domain = extractEmpireStreamData(url).domain;
        img = "https://" + domain + document.querySelectorAll('.container-image-media img')[document.querySelectorAll('.container-image-media img').length - 1]?.getAttribute("src");
        categorie = extractEmpireStreamData(url).categorie;

        sendData(nom, saison, ep, img, domain, categorie);
        }

    })

    // nom = extractEmpireStreamData(url).nom;
    // saison = extractEmpireStreamData(url).saison;
    // ep = extractEmpireStreamData(url).episode;
    // domain = extractEmpireStreamData(url).domain;
    // img = "https://" + domain + document.querySelectorAll('.container-image-media img')[document.querySelectorAll('.container-image-media img').length - 1]?.getAttribute("src");
    // categorie = extractEmpireStreamData(url).categorie;

    // console.log(
    //     nom,
    //     saison,
    //     ep,
    //     img,
    //     domain,
    //     categorie,
    // );

}

// Hurawatch
if (url.includes("hurawatch")) {
    // Empêche le site de nettoyer la console
    console.clear = () => {};

    window.addEventListener('beforeunload', () => {
        if (urlSplit.length >= 5) {

            nom = document.querySelectorAll('.breadcrumb li')[2].innerText.toUpperCase();
            img = document.querySelector('meta[property="og:image"]')?.content;
            const {content} = document.querySelector('meta[name="keywords"]') || {};
            const [_, season, episode] = content?.match(/Season (\d+) Episode (\d+)/i) || [];
            saison = season || 0;
            ep = episodeNumber || episode || 0;
            domain = urlSplit[2];
            categorie = urlSplit[3].includes("tv") ? "série" : "film";

            if ((urlSplit[3].includes("tv") && saison != 0) || (urlSplit[3].includes("movie"))) {
                sendData(nom, saison, ep, img, domain, categorie);
            }   
        }
    })

let episodeNumber = null;

window.addEventListener("click", (e) => {
    const epsItem = e.target.closest(".eps-item");

    if (epsItem) {
        // 1) Récupère le texte du <strong>
        const strongEl = epsItem.querySelector("strong");

        if (strongEl) {
            // Exemple : "Eps 4:"
            const strongText = strongEl.innerText.trim();

            // 2) Extraire le nombre uniquement
            const match = strongText.match(/Eps\s*(\d+)/i);
            if (match) {
                episodeNumber = match[1];
            }
        }

        // Si tu veux aussi le titre entier (optionnel)
        // const titleAttr = epsItem.getAttribute('title');
        // console.log('Titre brut :', titleAttr);
    }
});


}

// Fonction pour envoyer les données à supabase
function sendData(name, saison, ep, img, domain, categorie) {
    // Récupération de l'id_user
    chrome.storage.sync.get("key", (result) => {
        let idUser = result.key;
        console.log(idUser);

        fetch(
            "https://lphgeqzuyoxsckjjbxyi.supabase.co/rest/v1/elements_visionnes?on_conflict=nom,domain",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwaGdlcXp1eW94c2NrampieHlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyOTUxMzEsImV4cCI6MjA2NDg3MTEzMX0.OdsihjJ6e66AH7-4vHZ3rkGxYqKtjtluSj5y7udBAkQ",
                    Authorization:
                        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwaGdlcXp1eW94c2NrampieHlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyOTUxMzEsImV4cCI6MjA2NDg3MTEzMX0.OdsihjJ6e66AH7-4vHZ3rkGxYqKtjtluSj5y7udBAkQ",
                    Prefer: "resolution=merge-duplicates",
                },
                body: JSON.stringify({
                    id_user: idUser,
                    nom: name,
                    saison: saison,
                    episode: ep,
                    image: img,
                    // point_arret: pointArret,
                    url: url,
                    domain: domain,
                    categorie: categorie,
                }),
                keepalive: true,
            }
        );
    });
}

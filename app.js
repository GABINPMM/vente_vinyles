/* ==========================================================================
   LE SILLON D'ORLÉANS — Script Simplifié Sans Parenthèses
   ========================================================================== */

const VINYL_CATALOG = [
    {
        id: "VIN-01",
        artist: "Pink Floyd",
        title: "Wish You Were Here",
        genre: "Rock & Psyché",
        year: 1975,
        format: "33 Tours",
        isNewArrival: true,
        price: 35.00,
        jacketColor: "linear-gradient(135deg, #1f2b38 0%, #3a4e63 100%)",
        labelColor: "#d99b26",
        tracks: ["Shine On You Crazy Diamond", "Welcome to the Machine", "Have a Cigar", "Wish You Were Here"]
    },
    {
        id: "VIN-02",
        artist: "Miles Davis",
        title: "Ascenseur pour l'échafaud",
        genre: "Jazz & Blues",
        year: 1958,
        format: "33 Tours",
        isNewArrival: true,
        price: 40.00,
        jacketColor: "linear-gradient(135deg, #2b2623 0%, #4a413b 100%)",
        labelColor: "#1e4d3b",
        tracks: ["Générique", "L'Assassinat de Carala", "Sur l'autoroute", "Julien dans l'ascenseur", "Florence sur les Champs-Élysées", "Dîner au motel"]
    },
    {
        id: "VIN-03",
        artist: "Serge Gainsbourg",
        title: "Histoire de Melody Nelson",
        genre: "Chanson & Variété FR",
        year: 1971,
        format: "33 Tours",
        isNewArrival: false,
        price: 45.00,
        jacketColor: "linear-gradient(135deg, #5e1914 0%, #2e0c0a 100%)",
        labelColor: "#1f3a60",
        tracks: ["Melody", "Ballade de Melody Nelson", "Valse de Melody", "Ah ! Melody", "L'Hôtel particulier", "En Melody", "Cargo culte"]
    },
    {
        id: "VIN-04",
        artist: "Marvin Gaye",
        title: "What's Going On",
        genre: "Soul & Funk",
        year: 1971,
        format: "33 Tours",
        isNewArrival: true,
        price: 30.00,
        jacketColor: "linear-gradient(135deg, #593a22 0%, #8c5d38 100%)",
        labelColor: "#c93b2b",
        tracks: ["What's Going On", "What's Happening Brother", "Flyin' High", "Save the Children", "Mercy Mercy Me", "Inner City Blues"]
    },
    {
        id: "VIN-05",
        artist: "Daft Punk",
        title: "Homework",
        genre: "Hip-Hop & Electro",
        year: 1997,
        format: "Double 33T",
        isNewArrival: false,
        price: 30.00,
        jacketColor: "linear-gradient(135deg, #111111 0%, #2c2c2c 100%)",
        labelColor: "#b82525",
        tracks: ["Daftendirekt", "Revolution 909", "Da Funk", "Around the World", "Rollin' & Scratchin'", "Alive"]
    },
    {
        id: "VIN-06",
        artist: "Bob Marley & The Wailers",
        title: "Exodus",
        genre: "Reggae & World",
        year: 1977,
        format: "33 Tours",
        isNewArrival: true,
        price: 22.00,
        jacketColor: "linear-gradient(135deg, #8a6421 0%, #bd8b2d 100%)",
        labelColor: "#d96b27",
        tracks: ["Natural Mystic", "So Much Things to Say", "Guiltiness", "The Heathen", "Exodus", "Jamming", "Waiting in Vain", "Three Little Birds"]
    },
    {
        id: "VIN-07",
        artist: "Black Sabbath",
        title: "Paranoid",
        genre: "Hard & Metal",
        year: 1970,
        format: "33 Tours",
        isNewArrival: false,
        price: 35.00,
        jacketColor: "linear-gradient(135deg, #2e1530 0%, #61264b 100%)",
        labelColor: "#e6dfd3",
        tracks: ["War Pigs", "Paranoid", "Planet Caravan", "Iron Man", "Electric Funeral", "Hand of Doom", "Fairies Wear Boots"]
    },
    {
        id: "VIN-08",
        artist: "Jacques Brel",
        title: "Ces Gens-Là",
        genre: "Chanson & Variété FR",
        year: 1966,
        format: "45 Tours",
        isNewArrival: true,
        price: 10.00,
        jacketColor: "linear-gradient(135deg, #3b3228 0%, #5e5041 100%)",
        labelColor: "#d97a26",
        tracks: ["Ces gens-là", "Jacky", "L'âge idiot", "Fernand"]
    },
    {
        id: "VIN-09",
        artist: "Fela Kuti & Africa 70",
        title: "Zombie",
        genre: "Reggae & World",
        year: 1977,
        format: "33 Tours",
        isNewArrival: true,
        price: 25.00,
        jacketColor: "linear-gradient(135deg, #214d2e 0%, #3b7a4c 100%)",
        labelColor: "#e8c44d",
        tracks: ["Zombie", "Mister Follow Follow"]
    },
    {
        id: "VIN-10",
        artist: "The Doors",
        title: "L.A. Woman",
        genre: "Rock & Psyché",
        year: 1971,
        format: "33 Tours",
        isNewArrival: false,
        price: 28.00,
        jacketColor: "linear-gradient(135deg, #4f1c1d 0%, #7d2c2e 100%)",
        labelColor: "#c79a2c",
        tracks: ["The Changeling", "Love Her Madly", "Been Down So Long", "Cars Hiss by My Window", "L.A. Woman", "Riders on the Storm"]
    },
    {
        id: "VIN-11",
        artist: "IAM",
        title: "L'École du Micro d'Argent",
        genre: "Hip-Hop & Electro",
        year: 1997,
        format: "Double 33T",
        isNewArrival: true,
        price: 30.00,
        jacketColor: "linear-gradient(135deg, #2d3033 0%, #52575c 100%)",
        labelColor: "#a3a8ad",
        tracks: ["L'École du Micro d'Argent", "Nés sous la même étoile", "La Saga", "Petit frère", "Demain, c'est loin"]
    },
    {
        id: "VIN-12",
        artist: "Aretha Franklin",
        title: "Respect / Dr. Feelgood",
        genre: "Soul & Funk",
        year: 1967,
        format: "45 Tours",
        isNewArrival: false,
        price: 10.00,
        jacketColor: "linear-gradient(135deg, #872b1b 0%, #b83d27 100%)",
        labelColor: "#c93b2b",
        tracks: ["Face A : Respect", "Face B : Dr. Feelgood"]
    }
];

// État
let activeGenre = "all";
let searchQuery = "";
let sortBy = "recent";
let crateIds = JSON.parse(localStorage.getItem("orleans_vinyl_selection") || "[]");
let buyPhotosFiles = [];
let sellPhotosFiles = [];

// Éléments DOM
const recordsContainer = document.getElementById("records-container");
const emptyState = document.getElementById("empty-state");
const searchInput = document.getElementById("search-input");
const btnClearSearch = document.getElementById("btn-clear-search");
const sortSelect = document.getElementById("sort-select");
const genreTabs = document.querySelectorAll(".crate-tab");
const btnEmptyReset = document.getElementById("btn-empty-reset");
const btnAskStockFromEmpty = document.getElementById("btn-ask-stock-from-empty");

const recordModal = document.getElementById("record-modal");
const modalBody = document.getElementById("modal-body");
const btnCloseModal = document.getElementById("btn-close-modal");
const selectionCountEl = document.getElementById("selection-count");

const contactModeSelect = document.getElementById("contact-mode-select");
const formBuy = document.getElementById("form-buy");
const formSell = document.getElementById("form-sell");
const buyCustomRequest = document.getElementById("buy-custom-request");
const formConfirmationBox = document.getElementById("form-confirmation-box");

function formatEUR(val) {
    return val.toFixed(0) + " €";
}

// Changement de formulaire via le menu déroulant
window.switchFormTab = function(mode) {
    formConfirmationBox.hidden = true;
    if (contactModeSelect) {
        contactModeSelect.value = mode === "sell" ? "sell" : "buy";
    }
    if (mode === "sell") {
        formSell.hidden = false;
        formBuy.hidden = true;
    } else {
        formBuy.hidden = false;
        formSell.hidden = true;
    }
};

if (contactModeSelect) {
    contactModeSelect.addEventListener("change", e => {
        switchFormTab(e.target.value);
    });
}

// Aller au formulaire
window.openActionTab = function(mode, prefillQuery = "") {
    switchFormTab(mode);
    const formsSection = document.getElementById("formulaires-contact");
    if (formsSection) {
        formsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (mode === "buy" && prefillQuery) {
        buyCustomRequest.value = `Bonjour, avez-vous en stock : ${prefillQuery} ?`;
        setTimeout(() => buyCustomRequest.focus(), 400);
    }
};

// Filtrer et trier les disques
function getFilteredRecords() {
    const q = searchQuery.trim().toLowerCase();

    let list = VINYL_CATALOG.filter(item => {
        if (activeGenre !== "all" && item.genre !== activeGenre) return false;
        if (q) {
            const haystack = `${item.artist} ${item.title} ${item.year} ${item.genre}`.toLowerCase();
            if (!haystack.includes(q)) return false;
        }
        return true;
    });

    list.sort((a, b) => {
        if (sortBy === "price-asc") return a.price - b.price;
        if (sortBy === "price-desc") return b.price - a.price;
        if (sortBy === "artist-asc") return a.artist.localeCompare(b.artist, "fr");
        return (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0);
    });

    return list;
}

// Afficher la grille épurée
function renderCatalog() {
    const records = getFilteredRecords();

    if (records.length === 0) {
        recordsContainer.innerHTML = "";
        emptyState.hidden = false;
        return;
    }

    emptyState.hidden = true;

    recordsContainer.innerHTML = records.map(rec => {
        const inCrate = crateIds.includes(rec.id);
        return `
            <article class="record-card">
                <div class="price-sticker">${formatEUR(rec.price)}</div>

                <div class="sleeve-visual" onclick="openRecordModal('${rec.id}')" title="Voir les morceaux">
                    <div class="album-jacket" style="background: ${rec.jacketColor};">
                        <div class="jacket-top-meta">${rec.year}</div>
                        <div>
                            <div class="jacket-artist">${rec.artist}</div>
                            <div class="jacket-title">${rec.title}</div>
                        </div>
                        <div class="jacket-cat">${rec.format}</div>
                    </div>
                    <div class="vinyl-disc">
                        <div class="vinyl-center-label" style="background-color: ${rec.labelColor};">
                            <div class="vinyl-hole"></div>
                        </div>
                    </div>
                </div>

                <div class="record-body">
                    <div class="record-meta-top">
                        <span>${rec.genre}</span>
                        <span>${rec.format} • ${rec.year}</span>
                    </div>
                    <h3 class="record-artist">${rec.artist}</h3>
                    <p class="record-title">${rec.title}</p>

                    <div class="record-actions">
                        <button class="btn-details" onclick="openRecordModal('${rec.id}')">Titres</button>
                        <button class="btn-reserve ${inCrate ? "in-crate" : ""}" onclick="toggleCrate('${rec.id}')">
                            ${inCrate ? "Sélectionné" : "+ Choisir"}
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join("");
}

// Fenêtre simple pour voir les titres d'un disque
window.openRecordModal = function(recordId) {
    const rec = VINYL_CATALOG.find(r => r.id === recordId);
    if (!rec) return;
    const inCrate = crateIds.includes(rec.id);

    modalBody.innerHTML = `
        <h2 style="font-family:var(--font-display); font-size:24px;">${rec.artist}</h2>
        <p style="font-style:italic; font-size:17px; color:var(--ink-muted); margin-bottom:10px;">
            ${rec.title} • ${rec.format} • ${rec.year} — <strong style="color:var(--accent-red);">${formatEUR(rec.price)}</strong>
        </p>
        <p style="font-size:13px; margin-bottom:10px;">Bon état • Remise sur Orléans</p>

        <div class="modal-tracklist">
            <strong>Morceaux :</strong>
            <ol>
                ${rec.tracks.map(t => `<li>${t}</li>`).join("")}
            </ol>
        </div>

        <button class="btn-primary btn-full" onclick="toggleCrate('${rec.id}'); recordModal.hidden = true;">
            ${inCrate ? "Retirer de ma sélection" : "+ Ajouter à ma sélection"}
        </button>
    `;
    recordModal.hidden = false;
};

// Ajouter / Retirer un disque de sa sélection
window.toggleCrate = function(recordId) {
    if (crateIds.includes(recordId)) {
        crateIds = crateIds.filter(id => id !== recordId);
    } else {
        crateIds.push(recordId);
    }
    localStorage.setItem("orleans_vinyl_selection", JSON.stringify(crateIds));
    updateCrateUI();
    renderCatalog();
};

function updateCrateUI() {
    selectionCountEl.textContent = crateIds.length;
    const buyFormSelectedList = document.getElementById("buy-form-selected-list");

    if (crateIds.length === 0) {
        buyFormSelectedList.innerHTML = `<span style="color:var(--ink-muted); font-style:italic;">Aucun disque sélectionné.</span>`;
        return;
    }

    let subtotal = 0;
    const rows = crateIds.map(id => {
        const rec = VINYL_CATALOG.find(r => r.id === id);
        if (!rec) return "";
        subtotal += rec.price;
        return `
            <div class="crate-item">
                <span><strong>${rec.artist}</strong> — ${rec.title} • ${formatEUR(rec.price)}</span>
                <button type="button" class="crate-remove" onclick="toggleCrate('${rec.id}')">Retirer</button>
            </div>
        `;
    }).join("");

    buyFormSelectedList.innerHTML = `
        ${rows}
        <div style="margin-top:6px; padding-top:6px; border-top:1px solid #1c1a17; display:flex; justify-content:space-between;">
            <span>Total :</span>
            <strong>${formatEUR(subtotal)}</strong>
        </div>
    `;
}

// Gestion de l'aperçu des photos
function setupPhotoUpload(inputId, previewId, filesArrayRef) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);

    function renderPreviews() {
        preview.innerHTML = filesArrayRef.map((file, idx) => {
            const url = URL.createObjectURL(file);
            return `
                <div class="photo-thumb">
                    <img src="${url}" alt="${file.name}">
                    <button type="button" data-idx="${idx}">×</button>
                </div>
            `;
        }).join("");

        preview.querySelectorAll("button[data-idx]").forEach(btn => {
            btn.addEventListener("click", () => {
                filesArrayRef.splice(Number(btn.dataset.idx), 1);
                renderPreviews();
            });
        });
    }

    input.addEventListener("change", e => {
        Array.from(e.target.files || []).forEach(f => filesArrayRef.push(f));
        input.value = "";
        renderPreviews();
    });
}

setupPhotoUpload("buy-photos", "buy-photos-preview", buyPhotosFiles);
setupPhotoUpload("sell-photos", "sell-photos-preview", sellPhotosFiles);

// Envoi des formulaires
formBuy.addEventListener("submit", e => {
    e.preventDefault();
    const name = document.getElementById("buy-name").value.trim();
    const contact = document.getElementById("buy-contact").value.trim();
    const customReq = buyCustomRequest.value.trim();

    if (crateIds.length === 0 && !customReq) {
        alert("Choisissez un vinyle du site ou écrivez le disque recherché.");
        buyCustomRequest.focus();
        return;
    }

    formConfirmationBox.innerHTML = `
        <strong>Message envoyé !</strong> Merci ${name}, je vous recontacte très vite au <strong>${contact}</strong>.
    `;
    formConfirmationBox.hidden = false;
});

formSell.addEventListener("submit", e => {
    e.preventDefault();
    const name = document.getElementById("sell-name").value.trim();
    const contact = document.getElementById("sell-contact").value.trim();

    formConfirmationBox.innerHTML = `
        <strong>Proposition envoyée !</strong> Merci ${name}, je vous recontacte très vite au <strong>${contact}</strong>.
    `;
    formConfirmationBox.hidden = false;
});

// Événements de recherche et tri
searchInput.addEventListener("input", e => {
    searchQuery = e.target.value;
    btnClearSearch.hidden = searchQuery.length === 0;
    renderCatalog();
});

btnClearSearch.addEventListener("click", () => {
    searchInput.value = "";
    searchQuery = "";
    btnClearSearch.hidden = true;
    renderCatalog();
});

btnAskStockFromEmpty.addEventListener("click", () => {
    openActionTab("buy", searchQuery.trim());
});

sortSelect.addEventListener("change", e => {
    sortBy = e.target.value;
    renderCatalog();
});

genreTabs.forEach(tab => {
    tab.addEventListener("click", () => {
        genreTabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        activeGenre = tab.dataset.genre;
        renderCatalog();
    });
});

btnEmptyReset.addEventListener("click", () => {
    activeGenre = "all";
    searchQuery = "";
    searchInput.value = "";
    btnClearSearch.hidden = true;
    genreTabs.forEach(t => t.classList.toggle("active", t.dataset.genre === "all"));
    renderCatalog();
});

btnCloseModal.addEventListener("click", () => (recordModal.hidden = true));
recordModal.addEventListener("click", e => {
    if (e.target === recordModal) recordModal.hidden = true;
});

// Initialisation
updateCrateUI();
renderCatalog();

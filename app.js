/* ==========================================================================
   BARWETA RECORDS — Front-End Sécurisé (Anti-XSS, Anti-CSRF, Session Bcrypt)
   Aucun mot de passe n'est présent dans ce code : tout est chiffré (BCRYPT)
   et vérifié côté serveur dans api.php.
   ========================================================================== */

let vinylCatalog = [];
let activeGenre = "all";
let searchQuery = "";
let sortBy = "recent";
let isVendorLoggedIn = false;
let csrfToken = "";
let crateIds = JSON.parse(localStorage.getItem("barweta_records_selection") || "[]");
let buyPhotosFiles = [];
let sellPhotosFiles = [];
let adminUploadedPhotoDataUrl = "";

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

// Éléments DOM Espace Vendeur
const adminPanel = document.getElementById("admin-panel");
const btnOpenLogin = document.getElementById("btn-open-login");
const loginModal = document.getElementById("login-modal");
const btnCloseLogin = document.getElementById("btn-close-login");
const formLogin = document.getElementById("form-login");
const loginPasswordInput = document.getElementById("login-password");
const loginError = document.getElementById("login-error");
const btnAdminLogout = document.getElementById("btn-admin-logout");

const formAdminAdd = document.getElementById("form-admin-add");
const adminPhotoInput = document.getElementById("admin-photo-input");
const adminPhotoPreview = document.getElementById("admin-photo-preview");
const adminPhotoPlaceholder = document.getElementById("admin-photo-placeholder");
const btnRemoveAdminPhoto = document.getElementById("btn-remove-admin-photo");
const adminMsg = document.getElementById("admin-msg");
const formChangePassword = document.getElementById("form-change-password");
const newVendorPasswordInput = document.getElementById("new-vendor-password");

function formatEUR(val) {
    return Number(val).toFixed(0) + " €";
}

// Échappement strict Anti-XSS pour toute donnée affichée dans le HTML
function escapeHTML(str) {
    return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Requête POST sécurisée avec Jeton Anti-CSRF
async function securePost(action, payload = {}) {
    return fetch(`api.php?action=${encodeURIComponent(action)}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken
        },
        credentials: "same-origin",
        body: JSON.stringify(payload)
    });
}

// ==========================================================================
// CHARGEMENT DU CATALOGUE DEPUIS LA BASE DE DONNÉES (api.php)
// ==========================================================================
async function fetchCatalogFromServer() {
    try {
        const res = await fetch("api.php?action=list", { credentials: "same-origin" });
        if (!res.ok) throw new Error("Serveur PHP non démarré");
        const data = await res.json();
        if (data.ok) {
            vinylCatalog = data.vinyls || [];
            isVendorLoggedIn = Boolean(data.isLoggedIn);
            csrfToken = data.csrfToken || "";
            updateVendorUI();
            updateCrateUI();
        }
    } catch (err) {
        recordsContainer.innerHTML = `
            <div style="grid-column: 1 / -1; background:#fff; border:2px solid #1c1a17; padding:18px; font-family:var(--font-mono); font-size:13px;">
                <strong>Serveur PHP requis :</strong><br>
                Double-cliquez sur le fichier <code>LANCER_SITE_LOCAL.bat</code> dans le dossier du site pour ouvrir <code>http://localhost:8080</code> avec la sécurité Bcrypt et la base de données actives.
            </div>
        `;
    }
}

// ==========================================================================
// ESPACE VENDEUR SÉCURISÉ (AUTHENTIFICATION SERVEUR BCRYPT + ANTI-BRUTEFORCE)
// ==========================================================================
function updateVendorUI() {
    adminPanel.hidden = !isVendorLoggedIn;
    btnOpenLogin.textContent = isVendorLoggedIn ? "Mode Vendeur Actif" : "Accès Vendeur";
    renderCatalog();
}

btnOpenLogin.addEventListener("click", () => {
    if (isVendorLoggedIn) {
        adminPanel.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
    }
    loginPasswordInput.value = "";
    loginError.hidden = true;
    loginModal.hidden = false;
    setTimeout(() => loginPasswordInput.focus(), 100);
});

btnCloseLogin.addEventListener("click", () => (loginModal.hidden = true));
loginModal.addEventListener("click", e => {
    if (e.target === loginModal) loginModal.hidden = true;
});

// Vérification du mot de passe côté serveur via Bcrypt + Jeton CSRF
formLogin.addEventListener("submit", async e => {
    e.preventDefault();
    loginError.hidden = true;
    const password = loginPasswordInput.value.trim();

    try {
        const res = await securePost("login", { password });
        const data = await res.json();
        if (res.ok && data.ok) {
            isVendorLoggedIn = true;
            if (data.csrfToken) csrfToken = data.csrfToken;
            loginModal.hidden = true;
            updateVendorUI();
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
            loginError.textContent = data.error || "Code incorrect. Réessayez.";
            loginError.hidden = false;
        }
    } catch (err) {
        loginError.textContent = "Impossible de joindre le serveur PHP.";
        loginError.hidden = false;
    }
});

btnAdminLogout.addEventListener("click", async () => {
    try {
        const res = await securePost("logout");
        const data = await res.json();
        if (data.csrfToken) csrfToken = data.csrfToken;
    } catch (e) {}
    isVendorLoggedIn = false;
    updateVendorUI();
});

// Changement de code vendeur (haché avec Bcrypt coût 12 côté serveur)
if (formChangePassword) {
    formChangePassword.addEventListener("submit", async e => {
        e.preventDefault();
        const newPassword = newVendorPasswordInput.value.trim();
        const res = await securePost("change_password", { newPassword });
        const data = await res.json();
        if (res.ok && data.ok) {
            newVendorPasswordInput.value = "";
            adminMsg.textContent = "Votre nouveau code vendeur a été chiffré et enregistré dans la base de données !";
            adminMsg.hidden = false;
        } else {
            alert(data.error || "Erreur lors du changement de code.");
        }
    });
}

// Compression automatique de la photo avant envoi au serveur
function compressImageFile(file, callback) {
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement("canvas");
            const MAX_SIZE = 600;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_SIZE) {
                    height *= MAX_SIZE / width;
                    width = MAX_SIZE;
                }
            } else {
                if (height > MAX_SIZE) {
                    width *= MAX_SIZE / height;
                    height = MAX_SIZE;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
            callback(dataUrl);
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

adminPhotoInput.addEventListener("change", e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    compressImageFile(file, dataUrl => {
        adminUploadedPhotoDataUrl = dataUrl;
        adminPhotoPreview.src = dataUrl;
        adminPhotoPreview.hidden = false;
        adminPhotoPlaceholder.hidden = true;
        btnRemoveAdminPhoto.hidden = false;
    });
});

btnRemoveAdminPhoto.addEventListener("click", () => {
    adminUploadedPhotoDataUrl = "";
    adminPhotoInput.value = "";
    adminPhotoPreview.src = "";
    adminPhotoPreview.hidden = true;
    adminPhotoPlaceholder.hidden = false;
    btnRemoveAdminPhoto.hidden = true;
});

// Ajout d'un vinyle dans la base de données serveur
formAdminAdd.addEventListener("submit", async e => {
    e.preventDefault();
    const artist = document.getElementById("admin-artist").value.trim();
    const title = document.getElementById("admin-title").value.trim();
    const genre = document.getElementById("admin-genre").value;
    const format = document.getElementById("admin-format").value;
    const price = Number(document.getElementById("admin-price").value);
    const yearInput = document.getElementById("admin-year").value.trim();
    const tracksInput = document.getElementById("admin-tracks").value.trim();

    if (!adminUploadedPhotoDataUrl) {
        alert("Cliquez sur le cadre à gauche pour choisir ou prendre la photo de la pochette du vinyle.");
        return;
    }

    const tracksList = tracksInput
        ? tracksInput.split(",").map(t => t.trim()).filter(Boolean)
        : ["Morceaux à découvrir sur le disque"];

    const res = await securePost("add", {
        artist,
        title,
        genre,
        format,
        price,
        year: yearInput || "Époque",
        tracks: tracksList,
        photoData: adminUploadedPhotoDataUrl
    });

    const data = await res.json();
    if (res.ok && data.ok) {
        vinylCatalog.unshift(data.vinyl);
        formAdminAdd.reset();
        btnRemoveAdminPhoto.click();

        adminMsg.textContent = `Le vinyle « ${artist} — ${title} » a bien été enregistré dans la base de données !`;
        adminMsg.hidden = false;

        activeGenre = "all";
        genreTabs.forEach(t => t.classList.toggle("active", t.dataset.genre === "all"));
        renderCatalog();
    } else {
        alert(data.error || "Erreur lors de l'enregistrement du vinyle.");
    }
});

// Suppression d'un vinyle de la base de données serveur
window.deleteRecordFromCatalog = async function(recordId) {
    const rec = vinylCatalog.find(r => r.id === recordId);
    if (!rec) return;
    const ok = confirm(`Voulez-vous supprimer définitivement le vinyle « ${rec.artist} - ${rec.title} » de la base de données ?`);
    if (!ok) return;

    const res = await securePost("delete", { id: recordId });
    const data = await res.json();
    if (res.ok && data.ok) {
        vinylCatalog = vinylCatalog.filter(r => r.id !== recordId);
        crateIds = crateIds.filter(id => id !== recordId);
        localStorage.setItem("barweta_records_selection", JSON.stringify(crateIds));
        updateCrateUI();
        renderCatalog();
    } else {
        alert(data.error || "Erreur lors de la suppression.");
    }
};

// ==========================================================================
// FORMULAIRE VISITEUR (ACHETER / VENDRE)
// ==========================================================================
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

// ==========================================================================
// RECHERCHE, TRI & AFFICHAGE DU CATALOGUE (AVEC PROTECTION ANTI-XSS)
// ==========================================================================
function getFilteredRecords() {
    const q = searchQuery.trim().toLowerCase();

    let list = vinylCatalog.filter(item => {
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
        return 0;
    });

    return list;
}

function renderCatalog() {
    const records = getFilteredRecords();

    if (records.length === 0) {
        recordsContainer.innerHTML = "";
        emptyState.hidden = false;
        return;
    }

    emptyState.hidden = true;

    recordsContainer.innerHTML = records.map(rec => {
        const safeId = escapeHTML(rec.id);
        const safeArtist = escapeHTML(rec.artist);
        const safeTitle = escapeHTML(rec.title);
        const safeGenre = escapeHTML(rec.genre);
        const safeFormat = escapeHTML(rec.format);
        const safeYear = escapeHTML(rec.year);
        const safePhotoUrl = escapeHTML(rec.photoUrl || "");
        const inCrate = crateIds.includes(rec.id);

        const jacketHTML = safePhotoUrl
            ? `<img src="${safePhotoUrl}" alt="${safeArtist} - ${safeTitle}" class="album-jacket-photo">`
            : `<div class="album-jacket" style="background: ${escapeHTML(rec.jacketColor || "linear-gradient(135deg, #2b2623 0%, #4a413b 100%)")};">
                    <div class="jacket-top-meta">${safeYear}</div>
                    <div>
                        <div class="jacket-artist">${safeArtist}</div>
                        <div class="jacket-title">${safeTitle}</div>
                    </div>
                    <div class="jacket-cat">${safeFormat}</div>
               </div>`;

        return `
            <article class="record-card">
                <div class="price-sticker">${formatEUR(rec.price)}</div>

                <div class="sleeve-visual" onclick="openRecordModal('${safeId}')" title="Voir les morceaux">
                    ${jacketHTML}
                    <div class="vinyl-disc">
                        <div class="vinyl-center-label" style="background-color: ${escapeHTML(rec.labelColor || "#c93b2b")};">
                            <div class="vinyl-hole"></div>
                        </div>
                    </div>
                </div>

                <div class="record-body">
                    <div class="record-meta-top">
                        <span>${safeGenre}</span>
                        <span>${safeFormat} • ${safeYear}</span>
                    </div>
                    <h3 class="record-artist">${safeArtist}</h3>
                    <p class="record-title">${safeTitle}</p>

                    <div class="record-actions">
                        <button class="btn-details" onclick="openRecordModal('${safeId}')">Titres</button>
                        <button class="btn-reserve ${inCrate ? "in-crate" : ""}" onclick="toggleCrate('${safeId}')">
                            ${inCrate ? "Sélectionné" : "+ Choisir"}
                        </button>
                    </div>
                    ${isVendorLoggedIn ? `
                        <button type="button" class="btn-delete-record" onclick="deleteRecordFromCatalog('${safeId}')">
                            Supprimer ce vinyle
                        </button>
                    ` : ""}
                </div>
            </article>
        `;
    }).join("");
}

window.openRecordModal = function(recordId) {
    const rec = vinylCatalog.find(r => r.id === recordId);
    if (!rec) return;
    const inCrate = crateIds.includes(rec.id);

    const safeId = escapeHTML(rec.id);
    const safeArtist = escapeHTML(rec.artist);
    const safeTitle = escapeHTML(rec.title);
    const safeFormat = escapeHTML(rec.format);
    const safeYear = escapeHTML(rec.year);
    const safePhotoUrl = escapeHTML(rec.photoUrl || "");

    modalBody.innerHTML = `
        ${safePhotoUrl ? `<img src="${safePhotoUrl}" alt="${safeTitle}" style="width:160px; height:160px; object-fit:cover; border:2px solid #1c1a17; margin-bottom:10px;">` : ""}
        <h2 style="font-family:var(--font-display); font-size:24px;">${safeArtist}</h2>
        <p style="font-style:italic; font-size:17px; color:var(--ink-muted); margin-bottom:10px;">
            ${safeTitle} • ${safeFormat} • ${safeYear} — <strong style="color:var(--accent-red);">${formatEUR(rec.price)}</strong>
        </p>
        <p style="font-size:13px; margin-bottom:10px;">Bon état • Remise sur Orléans</p>

        <div class="modal-tracklist">
            <strong>Morceaux :</strong>
            <ol>
                ${(rec.tracks || []).map(t => `<li>${escapeHTML(t)}</li>`).join("")}
            </ol>
        </div>

        <button class="btn-primary btn-full" onclick="toggleCrate('${safeId}'); recordModal.hidden = true;">
            ${inCrate ? "Retirer de ma sélection" : "+ Ajouter à ma sélection"}
        </button>
    `;
    recordModal.hidden = false;
};

window.toggleCrate = function(recordId) {
    if (crateIds.includes(recordId)) {
        crateIds = crateIds.filter(id => id !== recordId);
    } else {
        crateIds.push(recordId);
    }
    localStorage.setItem("barweta_records_selection", JSON.stringify(crateIds));
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
        const rec = vinylCatalog.find(r => r.id === id);
        if (!rec) return "";
        subtotal += Number(rec.price);
        const safeId = escapeHTML(rec.id);
        return `
            <div class="crate-item">
                <span><strong>${escapeHTML(rec.artist)}</strong> — ${escapeHTML(rec.title)} • ${formatEUR(rec.price)}</span>
                <button type="button" class="crate-remove" onclick="toggleCrate('${safeId}')">Retirer</button>
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

function setupPhotoUpload(inputId, previewId, filesArrayRef) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);

    function renderPreviews() {
        preview.innerHTML = filesArrayRef.map((file, idx) => {
            const url = URL.createObjectURL(file);
            return `
                <div class="photo-thumb">
                    <img src="${url}" alt="${escapeHTML(file.name)}">
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

formBuy.addEventListener("submit", e => {
    e.preventDefault();
    const name = escapeHTML(document.getElementById("buy-name").value.trim());
    const contact = escapeHTML(document.getElementById("buy-contact").value.trim());
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
    const name = escapeHTML(document.getElementById("sell-name").value.trim());
    const contact = escapeHTML(document.getElementById("sell-contact").value.trim());

    formConfirmationBox.innerHTML = `
        <strong>Proposition envoyée !</strong> Merci ${name}, je vous recontacte très vite au <strong>${contact}</strong>.
    `;
    formConfirmationBox.hidden = false;
});

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

// Initialisation au chargement de la page
fetchCatalogFromServer();

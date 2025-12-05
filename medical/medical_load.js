// ===============================================================
//  1) GLOBAL DEĞİŞKENLER
// ===============================================================

let full_order = [];
const ta = document.getElementById("ta_medi");



// ===============================================================
//  2) UYGULAMA BAŞLANGICI
// ===============================================================

async function initApp() {

    await buildFullOrder();         // ⬅ FULL ORDER hazır olmadan hiçbir şey başlamaz

    setupUI();                      // tüm butonlar, popup, highlight, copy…
    setupDrugImageGallery("bt_meds", drugImages);
}

initApp();



// ===============================================================
//  3) FULL_ORDER HAZIRLAMA
// ===============================================================

function buildFullOrder() {
    return new Promise(resolve => {
        full_order = [];
        let skippedItems = 0;

        ilaclar.forEach((x, index) => {
            if (!x || typeof x !== "object") {
                console.warn(`${index}. indeksteki öğe geçersiz`);
                skippedItems++;
                return;
            }

            // İlaç adını log'la (debug için)
            const drugName = Array.isArray(x.ad) ? x.ad[0] : x.ad;
            
            if (x.doz) {
                if (Array.isArray(x.doz)) {
                    x.doz.forEach((d, i) => {
                        if (typeof d === "string" && d.trim()) {
                            full_order.push(d.trim());
                        } else {
                            console.warn(`${drugName} ilacının ${i}. dozu geçersiz:`, d);
                        }
                    });
                } else if (typeof x.doz === "string") {
                    if (x.doz.trim()) {
                        full_order.push(x.doz.trim());
                    }
                } else {
                    console.warn(`${drugName} ilacının doz formatı geçersiz:`, x.doz);
                    skippedItems++;
                }
            } else {
                //console.warn(`${drugName} ilacında doz bilgisi yok`);
                skippedItems++;
            }
        });

        console.log(`Toplam: ${full_order.length} doz, Atlanan: ${skippedItems} ilaç`);

        resolve();
    });
}


// ===============================================================
//  4) ARAYÜZ / BUTON / POPUP KURULUMU
// ===============================================================

function setupUI() {

    const hoverPopup = createHoverPopup();
    const lettersSeen = new Set();

    ta.title = "Sarı arkaplan tıkla, seçili hale gelir.\nYeni değer tıkla değişir.";
    document.getElementById("im_tik").src = "../iko/r_click.png";

    // ------------------------
    //  BUTONLAR OLUŞTURULUYOR
    // ------------------------
    Object.entries(bt_others).forEach(([color, items]) => {

        const group = document.getElementById(color + "Group") || 
                       document.getElementById("orangeGroup");

        items.forEach(label => {

            const b = document.createElement("button");
            b.textContent = label;

            // class
            b.classList.add(color === "orange" ? "grayBt" : color);
            if (bt_meds.includes(label)) b.classList.add("bt_meds");

            // Sadece ilk harfi büyük süslü yapma kontrolü
            if (color === "orange") applyFancyLetter(b, label, lettersSeen);

            // POPUP — sadece ilaç butonlarında
            if (bt_meds.includes(label)) setupHoverPopup(b, label, hoverPopup);

            // Normal click işlemi
            b.addEventListener("click", () => insertAtCursor(label));

            group.appendChild(b);
        });
    });

    // highlightNumbers — ortak
    ta.addEventListener("click", e => {
        if (e.target.classList.contains("highlight")) {
            selectSpanContent(e.target);
        }
    });

    // copy – del – back – sent
    setupUtilityButtons();
}



// ===============================================================
//  5) HOVER POPUP OLUŞTURMA
// ===============================================================

function createHoverPopup() {
    const div = document.createElement("div");
    div.id = "hoverPopup";
    document.body.appendChild(div);
    return div;
}

function setupHoverPopup(button, label, hoverPopup) {

    button.addEventListener("mouseenter", () => {

        setTimeout(() => {

            const matches = full_order.filter(f =>
                f.toLowerCase().includes(label.toLowerCase())
            );
            if (!matches.length) return;

            hoverPopup.innerHTML = "";
            matches.forEach(m => {
                const row = document.createElement("div");
                row.className = "hoverItem";
                row.textContent = m;

                row.addEventListener("click", () => {
                    insertAtEnd(m + ",");
                    hoverPopup.style.display = "none";
                });

                hoverPopup.appendChild(row);
            });

            positionHoverPopup(button, hoverPopup);
            hoverPopup.style.display = "block";

        }, 120);

    });

    // Popup kapanış
    [button, hoverPopup].forEach(el => {
        el.addEventListener("mouseleave", () => {
            if (!hoverPopup.matches(':hover') && !button.matches(':hover')) {
                hoverPopup.style.display = "none";
            }
        });
    });
}

function positionHoverPopup(btn, popup) {
    const rect = btn.getBoundingClientRect();
    const popupWidth = 260;
    let left = rect.left;
    let top = rect.bottom;

    if (left + popupWidth > innerWidth) {
        left = innerWidth - popupWidth - 10;
    }
    if (left < 0) left = 5;

    popup.style.left = left + "px";
    popup.style.top  = top  + "px";
}



// ===============================================================
//  6) METİN İŞLEMLERİ
// ===============================================================

// ===============================================================
//  1) İMLEÇ KONUMUNA EKLEME (Buton tıklaması için)
// ===============================================================
function insertAtCursor(text) {
    const sel = window.getSelection();
    const range = sel.rangeCount ? sel.getRangeAt(0) : null;
    const node = document.createTextNode(text);

    if (range) {
        range.deleteContents();
        range.insertNode(node);
        range.setStartAfter(node);
        range.setEndAfter(node);
        sel.removeAllRanges();
        sel.addRange(range);
    } else {
        // imleç yoksa sona ekle
        ta.appendChild(node);
    }
}

// ===============================================================
//  2) METNİN SONUNA EKLEME (Hover popup / arama sonuçları)
// ===============================================================
function insertAtEnd(text) {
    let current = ta.innerText.trim();

    if (current) {
        // Eğer mevcut metin zaten virgülle bitiyorsa ekleme sadece text
        if (current.endsWith(",")) {
            ta.innerText += " " + text;
        } else {
            ta.innerText += ", " + text;
        }
    } else {
        ta.innerText = text;
    }

    highlightNumbers();
}


function highlightNumbers() {
    let html = ta.innerText;
    html = html.replace(/(\d+(?=\s*[a-zA-Z%]))/g, '<span class="highlight">$1</span>');
    ta.innerHTML = html;
}

function selectSpanContent(node) {
    const range = document.createRange();
    range.selectNodeContents(node);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
}

function applyFancyLetter(btn, label, lettersSeen) {
    const first = label[0].toLocaleLowerCase("tr");
    if (lettersSeen.has(first)) return;
    lettersSeen.add(first);

    const firstChar = label[0].toLocaleUpperCase("tr");
    const rest = label.slice(1);

    btn.innerHTML =
        `<span style="font-size:1.5em;color:#c7c583;font-weight:bold;
        font-family:'Comic Sans MS','Brush Script MT','Lucida Handwriting',cursive;">
        ${firstChar}</span>${rest}`;
}



// ===============================================================
//  7) COPY / DEL / BACK / SENT butonları
// ===============================================================

function setupUtilityButtons() {

    document.getElementById("copy").addEventListener("click", () => {
        navigator.clipboard.writeText(ta.innerText);
    });

    document.getElementById("del").addEventListener("click", () => {
        ta.innerHTML = "";
    });

    document.getElementById("back").addEventListener("click", () => {
        let t = ta.innerText.trim();
        if (!t) return;
        const lastComma = t.lastIndexOf(",");
        ta.innerText = lastComma === -1 ? "" : t.substring(0, lastComma).trim();
        highlightNumbers();
    });

    document.getElementById("sent").addEventListener("click", () => {
        let text = ta.innerText.replace(/\s+/g, " ").trim();
        localStorage.setItem("med_tedavi", text);
        localStorage.setItem("hideMedDiv", "true");
    });
}



// ===============================================================
//  8) RESİM & BİLGİ GALERİSİ
// ===============================================================

function setupDrugImageGallery(buttonClass, imageList) {
    const imgBox = document.getElementById("drugImgBox");
    const modalOverlay = document.getElementById("imgModalOverlay");
    const modalImg = document.getElementById("imgModal");
    const imgCounter = document.getElementById("imgCounter");
    const infoBox = document.getElementById("imgInfoBox");

    const searchInput = document.getElementById("img_search");
    const searchResults = document.getElementById("searchResults");

    const tedInput = document.getElementById("ted_search");
    const tedResults = document.getElementById("searchResults2");
    const taMedi = document.getElementById("ta_medi");

    let currentImages = [];
    let currentIndex = 0;
    let hasInfoOnly = false;

    function normalizeName(s) {
        if (!s || typeof s !== "string") return "";
        s = s.trim().toLowerCase();
        s = s.replace(/^acilci\//, "");
        s = s.replace(/\.[a-z0-9]{1,5}$/i, "");
        s = s.replace(/[-_\.]+/g, " ").replace(/\s+/g, " ").trim();
        return s;
    }

    // --- BUTONLARA MARKER EKLE (RENK DÜZELTMESİ) ---
    document.querySelectorAll(`.${buttonClass}`).forEach(btn => {
        const drug = btn.textContent.trim().toLowerCase();
        
        // İlacı ilaçlar dizisinde ara
        let ilacMatch = null;
        if (Array.isArray(ilaclar)) {
            for (const obj of ilaclar) {
                if (!obj || typeof obj !== "object" || !obj.ad) continue;
                const adNorm = normalizeName(String(obj.ad));
                const drugNorm = normalizeName(drug);
                if (adNorm === drugNorm || adNorm.includes(drugNorm) || drugNorm.includes(adNorm)) {
                    ilacMatch = obj;
                    break;
                }
            }
        }

        const hasImage = imageList.some(img => {
            const imgNorm = normalizeName(String(img));
            const drugNorm = normalizeName(drug);
            return imgNorm.includes(drugNorm) || drugNorm.includes(imgNorm);
        });

        const hasInfo = ilacMatch && ilacMatch.bilgi;

        // Eğer resim VEYA bilgi varsa marker ekle
        if (hasImage || hasInfo) {
            const marker = document.createElement("span");
            
            // MARKER RENK BELİRLEME - CSS'i tek satırda değil, ayrı ayrı set edelim
            let markerColor = "";
            if (hasImage && hasInfo) {
                // Hem resim hem bilgi varsa: yeşil
                markerColor = "lime";
            } else if (hasImage && !hasInfo) {
                // Sadece resim varsa: yeşil
                markerColor = "lime";
            } else if (!hasImage && hasInfo) {
                // Sadece bilgi varsa: KAHVERENGİ
                markerColor = "#8B4513"; // Kahverengi
            }
            
            // CSS'i ayrı ayrı set et - bu önemli!
            marker.style.position = "absolute";
            marker.style.top = "2px";
            marker.style.right = "2px";
            marker.style.width = "20px";
            marker.style.height = "10px";
            marker.style.backgroundColor = markerColor; // Bu satır önemli!
            marker.style.border = "1px solid #fff";
            marker.style.borderRadius = "2px";
            marker.style.zIndex = "5";
            marker.style.cursor = "pointer";
            
            btn.style.position = "relative";
            btn.appendChild(marker);

            marker.addEventListener("click", e => {
                e.stopPropagation();
                openImagesForDrug(drug);
            });
            
            // Marker'a hover efekti ekleyelim (opsiyonel)
            marker.addEventListener("mouseenter", () => {
                marker.style.opacity = "0.8";
            });
            marker.addEventListener("mouseleave", () => {
                marker.style.opacity = "1";
            });
        }
    });

    // --- GENEL ARAMA FONKSİYONU ---
    function setupSearch(inputEl, resultsEl, list, onClick) {
        inputEl.addEventListener("input", () => {
            const q = inputEl.value.trim().toLowerCase();
            resultsEl.innerHTML = "";
            resultsEl.style.display = "none";
            if (!q) return;

            const matches = list.filter(item => item.toLowerCase().includes(q));
            matches.forEach(item => {
                const div = document.createElement("div");
                div.textContent = item;
                div.style.cssText = "cursor:pointer; padding:4px; border-bottom:1px solid #ccc;";
                div.addEventListener("mouseenter", () => div.style.background = "yellow");
                div.addEventListener("mouseleave", () => div.style.background = "white");
                div.addEventListener("click", () => onClick(item));
                resultsEl.appendChild(div);
            });

            if (matches.length) {
                const rect = inputEl.getBoundingClientRect();
                resultsEl.style.cssText += `
                    position:absolute; top:${rect.bottom + window.scrollY}px; left:${rect.left + window.scrollX}px;
                    width:${rect.width}px; max-height:150px; overflow:auto; background:#fff; z-index:1000; color:#000;
                `;
                resultsEl.style.display = "block";
            }
        });
    }

    // --- img_search için ---
    setupSearch(searchInput, searchResults, imageList, item => {
        openImagesForDrug(item);
        searchInput.value = "";
        searchResults.innerHTML = "";
        searchResults.style.display = "none";
    });

    // --- ted_search için ---
    setupSearch(tedInput, tedResults, full_order, item => {
        taMedi.innerHTML += (taMedi.innerHTML ? ", " : "") + item;
        tedInput.value = "";
        tedResults.innerHTML = "";
        tedResults.style.display = "none";
    });

    // --- RESİM AÇMA FONKSİYONU ---
    function openImagesForDrug(drugOrSrc) {
        imgBox.innerHTML = "";
        imgBox.style.display = "none";
        currentImages = [];
        currentIndex = 0;
        hasInfoOnly = false;

        infoBox.style.display = "none";
        infoBox.innerHTML = "";

        const queryNorm = normalizeName(String(drugOrSrc));

        let ilacMatch = null;
        if (Array.isArray(ilaclar)) {
            for (const obj of ilaclar) {
                if (!obj || typeof obj !== "object" || !obj.ad) continue;
                const adNorm = normalizeName(String(obj.ad));
                if (adNorm === queryNorm || adNorm.includes(queryNorm) || queryNorm.includes(adNorm)) {
                    ilacMatch = obj;
                    break;
                }
            }
        }

        let found = [];
        if (String(drugOrSrc).startsWith("acilci/")) {
            found.push(drugOrSrc);
        } else {
            imageList.forEach(img => {
                const imgNorm = normalizeName(String(img));
                if (imgNorm.includes(queryNorm) || queryNorm.includes(imgNorm)) {
                    found.push("acilci/" + img);
                }
            });
        }

        if (ilacMatch && ilacMatch.bilgi) {
            infoBox.innerHTML = "<b>" + (ilacMatch.ad || "İlaç") + "</b><hr>" + ilacMatch.bilgi.replace(/\n/g, "<br>");
            
            if (!found.length) {
                hasInfoOnly = true;
                infoBox.style.display = "block";
                modalOverlay.style.display = "flex";
                modalImg.style.display = "none";
                imgCounter.style.display = "none";
                return;
            } else {
                infoBox.style.display = "block";
            }
        }

        if (!found.length && !hasInfoOnly) {
            console.log(`"${drugOrSrc}" için resim yok.`);
            return;
        }

        currentImages = found;

        if (found.length === 1 && !hasInfoOnly) {
            showModal();
        } else if (found.length > 1 && !hasInfoOnly) {
            found.forEach(src => {
                const img = new Image();
                img.src = src;
                img.onload = () => { 
                    imgBox.appendChild(img); 
                    imgBox.style.display = "block"; 
                };
                img.onerror = () => console.log("Yüklenemedi:", src);
            });
        }
    }

    // --- thumbnail tıklama ---
    imgBox.addEventListener("click", e => {
        if (e.target.tagName === "IMG") {
            modalImg.src = e.target.src;
            modalImg.style.display = "block";
            imgCounter.style.display = "block";
            currentIndex = currentImages.indexOf(e.target.src);
            imgCounter.textContent = `${currentIndex+1} / ${currentImages.length}`;
            modalOverlay.style.display = "flex";
            
            if (infoBox.innerHTML) {
                infoBox.style.display = "block";
            }
        }
    });

    function showModal() {
        if (currentImages.length > 0) {
            modalImg.src = currentImages[currentIndex];
            modalImg.style.display = "block";
            imgCounter.style.display = "block";
            imgCounter.textContent = `${currentIndex+1} / ${currentImages.length}`;
        } else {
            modalImg.style.display = "none";
            imgCounter.style.display = "none";
        }
        
        modalOverlay.style.display = "flex";
        
        if (infoBox.innerHTML) {
            infoBox.style.display = "block";
        }
    }

    modalOverlay.addEventListener("click", e => {
        if (e.target.id === "imgModalOverlay" || e.target.id === "imgModal") {
            modalOverlay.style.display = "none";
            modalImg.style.display = "block";
            imgCounter.style.display = "block";
        }
    });

    document.addEventListener("keydown", e => {
        if (modalOverlay.style.display !== "flex") return;
        
        if (currentImages.length > 0) {
            if (e.key === "ArrowRight") {
                currentIndex = (currentIndex+1)%currentImages.length;
                showModal();
            } else if (e.key === "ArrowLeft") {
                currentIndex = (currentIndex-1+currentImages.length)%currentImages.length;
                showModal();
            }
        }
        
        if (e.key === "Escape") {
            modalOverlay.style.display = "none";
            modalImg.style.display = "block";
            imgCounter.style.display = "block";
        }
    });

    imgBox.addEventListener("mouseleave", () => imgBox.style.display = "none");
}

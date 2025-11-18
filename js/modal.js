/*
  modal.js
  - Simpelt script til at åbne en modal (lightbox) og vise enten
    en YouTube-video eller et opskriftbillede.
  - Alle kommentarer er på dansk og forklare hvad koden gør i "dumme" ord.
  - Mobile-first tankegang: modal er enkel og fylder bredden på mobil.
*/

// --- Hjælpefunktioner / selectorer -------------------------------------------------
// Vi vælger de elementer vi har brug for. Hvis elementerne ikke findes, stopper vi
// senere uden at kaste fejl (sikkerhed for at scriptet kan køre på andre sider).
const modal = document.getElementById('media-modal');
const mediaContainer = modal ? modal.querySelector('.media-container') : null;
const overlay = modal ? modal.querySelector('.modal-overlay') : null;
const closeBtn = modal ? modal.querySelector('.modal-close') : null;

// find alle knapper der skal åbne en video eller vise et billede
const videoButtons = document.querySelectorAll('.open-video');
const imageButtons = document.querySelectorAll('.show-image');

// --- Hjælpere: åben og luk modal -----------------------------------------------
// Vi bruger aria-hidden="false" når modal er åben, og "true" når den er lukket.
// Det gør det lettere for skærmlæsere at forstå hvad der sker.
function openModalWithHTML(html) {
  if (!modal || !mediaContainer) return;
  // sæt indhold (iframe eller img)
  mediaContainer.innerHTML = html;
  // gør modal synlig for brugeren
  modal.setAttribute('aria-hidden', 'false');
  // lås baggrundsskrolling (simpel måde)
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  if (!modal || !mediaContainer) return;
  // ryd indhold for at stoppe video-afspilning
  mediaContainer.innerHTML = '';
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

// --- Håndter klik på 'Se video' knapper --------------------------------------
videoButtons.forEach(btn => {
  btn.addEventListener('click', (e) => {
    // data-video-id er hentet fra HTML (data-video-id="feHf-khAmTM")
    const videoId = btn.dataset.videoId;
    if (!videoId) return;
    // YouTube embed URL - autoplay=1 starter video automatisk
    const src = `https://www.youtube.com/embed/${videoId}?rel=0&showinfo=0&autoplay=1`;
    // Vi laver en iframe og sætter den ind i modal
    const iframe = `
      <iframe src="${src}" title="YouTube video" frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen>
      </iframe>`;
    openModalWithHTML(iframe);
  });
});

// --- Håndter klik på 'Se opskriftbillede' knapper -----------------------------
imageButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const src = btn.dataset.imageSrc || '';
    if (!src) return;
    // Vi viser billedet i modal. Billedet er responsive pga. CSS.
    const img = `<img src="${src}" alt="Opskrift billede">`;
    openModalWithHTML(img);
  });
});

// --- Luk modal ved klik på overlay eller luk-knap eller ESC -------------------
if (overlay) overlay.addEventListener('click', closeModal);
if (closeBtn) closeBtn.addEventListener('click', closeModal);

document.addEventListener('keydown', (ev) => {
  if (!modal) return;
  if (ev.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') {
    closeModal();
  }
});

// --- Init: sæt modal til skjult state ved load ---------------------------------
if (modal) {
  modal.setAttribute('aria-hidden', 'true');
}

// Kort forklaring (dansk, let sprog):
// - Vi bruger "aria-hidden" for at fortælle hjælpemidler (fx skærmlæsere)
//   om modal er synlig eller ej. "true" betyder skjult, "false" betyder synlig.
// - Vi sletter også modal-teksten når vi lukker, så videoen stopper med at spille.
// - Event listeners: det er små funktioner der venter på at brugeren klikker eller
//   trykker Esc. Når det sker, bliver de funktioner vi skrev ovenfor kørt.

/*
  Forklaring (danske noter, "dumme" sprog):
  - Vi har lavet nogle knapper i HTML (fx <button class="open-video" data-video-id="..."></button>).
  - Når du klikker 'Se video' tager vi video-id'et fra knappen og sætter en iframe i modal.
  - Når du klikker 'Se opskriftbillede' sætter vi et <img> i modal.
  - Når modal lukkes, fjerner vi indholdet så videoen stopper med at spille.
*/

/* Fokus-trap (simpel):
   - Når modal er åben, vil vi sikre at Tab-tasten kun bevæger sig mellem fokusable
     elementer i modal (så brugere med tastatur kan navigere korrekt).
   - Dette er en simpel implementation, der finder alle fokusable elementer i modal
     og fanger Tab/Shift+Tab for at rulle rundt.
*/
function trapFocus(modalEl) {
  if (!modalEl) return;
  const focusableSelectors = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
  const focusable = Array.from(modalEl.querySelectorAll(focusableSelectors)).filter(el => el.offsetParent !== null);
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  function handleKey(e){
    if (e.key !== 'Tab') return;
    if (e.shiftKey) { // Shift + Tab
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else { // Tab
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  // Når modal åbnes, sæt fokus på første element og tilføj keydown listener
  modalEl.addEventListener('keydown', handleKey);
  // returner en funktion der fjerner listener (bruges ved close)
  return () => modalEl.removeEventListener('keydown', handleKey);
}

// Gem reference til unsubscribe funktion når modal er åben
let releaseFocusTrap = null;

// Opdater openModalWithHTML og closeModal for at starte/stoppe trap
const _openModalWithHTML = openModalWithHTML;
openModalWithHTML = function(html){
  _openModalWithHTML(html);
  if (!modal) return;
  // sæt fokus til close-knappen så tastaturbrugere kan lukke
  const close = modal.querySelector('.modal-close');
  if (close) close.focus();
  // start trap
  releaseFocusTrap = trapFocus(modal.querySelector('.modal-content') || modal);
}

const _closeModal = closeModal;
closeModal = function(){
  // slip trap først
  if (releaseFocusTrap) { releaseFocusTrap(); releaseFocusTrap = null; }
  _closeModal();
}

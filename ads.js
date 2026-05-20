// =========================
// LISTA DE PROXIES
// =========================
const proxies = [
    "https://proxy.killcors.com/?url=",
    "https://api.allorigins.win/raw?url=",
    "https://test.cors.workers.dev/?",
    "https://api.codetabs.com/v1/proxy?quest=",
    "https://cors.x2u.in/",
    "https://corsproxy.org/?",
    "https://proxy.cors.sh/",
    "https://cors.lol/?url="
];

// =========================
// EXTRACCIÓN MEJORADA (más agresiva)
// =========================
function extraerVideoDirecto(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    let matches = [];

    // 1. Elementos normales
    doc.querySelectorAll('video, source, [src], [data-src], [data-url], [data-file]').forEach(el => {
        const attrs = ['src', 'data-src', 'data-url', 'data-file', 'data-hls', 'data-manifest'];
        attrs.forEach(attr => {
            const val = el.getAttribute(attr);
            if (val && /https?:\/\/[^"'<> ]+\.(m3u8|mp4|webm|mov|ts)/i.test(val)) {
                matches.push(val);
            }
        });
    });

    // 2. Buscar dentro de TODOS los scripts (incluyendo JSON y variables)
    doc.querySelectorAll('script').forEach(script => {
        let texto = script.textContent || '';

        // Buscar patrones comunes
        const patterns = [
            /https?:\/\/[^"'<> ]+\.(m3u8|mp4|webm|mov|ts)(\?[^"'<> ]*)?/gi,
            /["'](?:file|source|url|hls|manifest|video)["']\s*[:=]\s*["']([^"']+\.(m3u8|mp4|webm))["']/gi,
            /source\s*:\s*["']([^"']+)["']/gi
        ];

        patterns.forEach(p => {
            let m;
            while ((m = p.exec(texto)) !== null) {
                if (m[1]) matches.push(m[1]);
                if (m[0]) matches.push(m[0]);
            }
        });
    });

    // 3. Buscar en todo el HTML como respaldo
    const regex = /https?:\/\/[^"'<> ]+\.(m3u8|mp4|webm|mov|ts)(\?[^"'<> ]*)?/gi;
    matches.push(...(html.match(regex) || []));

    // Limpiar y filtrar
    matches = [...new Set(matches)].filter(url => {
        const lower = url.toLowerCase();
        return url.length > 55 &&
            !lower.includes('thumb') && !lower.includes('preview') &&
            !lower.includes('banner') && !lower.includes('logo') &&
            !lower.includes('sprite') && !lower.includes('ads') &&
            !lower.includes('doubleclick') && !lower.includes('googlesyndication') &&
            !lower.includes('analytics') && !lower.includes('cloudflareinsights') &&
            !lower.includes('yandex') && !lower.includes('tracking');
    });

    if (!matches.length) return null;

    // Ordenar por calidad + token
    matches.sort((a, b) => {
        let sa = a.length;
        let sb = b.length;
        if (a.includes('1080')) sa += 600;
        if (a.includes('720')) sa += 400;
        if (a.includes('master')) sa += 500;
        if (a.includes('index')) sa += 300;
        if (a.includes('.m3u8')) sa += 350;
        if (a.includes('?')) sa += 200;
        if (b.includes('1080')) sb += 600;
        if (b.includes('720')) sb += 400;
        if (b.includes('master')) sb += 500;
        if (b.includes('index')) sb += 300;
        if (b.includes('.m3u8')) sb += 350;
        if (b.includes('?')) sb += 200;
        return sb - sa;
    });

    return matches[0];
}

// =========================
// FETCH
// =========================
async function fetchConProxies(url) {
    for (let proxy of proxies) {
        try {
            const res = await fetch(proxy + encodeURIComponent(url), {
                headers: { "User-Agent": "Mozilla/5.0" }
            });
            if (res.ok) {
                const text = await res.text();
                if (text.length > 800) return text;
            }
        } catch(e){}
    }
    return null;
}

// =========================
// GENERAR CON BLOQUEADOR TRANSPARENTE
// =========================
async function generar() {
    const urlInput = document.getElementById("url").value.trim();
    const status = document.getElementById("status");
    const resultado = document.getElementById("resultado");

    if (!urlInput) return alert("❌ URL inválida");

    resultado.innerHTML = "";
    status.innerHTML = "🔄 Obteniendo página...";

    const html = await fetchConProxies(urlInput);
    if (!html) {
        status.innerHTML = "❌ No se pudo obtener la página";
        return;
    }

    status.innerHTML = "🔍 Buscando video...";
    const videoDirecto = extraerVideoDirecto(html);

    if (!videoDirecto) {
        status.innerHTML = `<span style="color:#ffaa00">⚠️ No se encontró video directo.</span>`;
        resultado.innerHTML = `<p style="color:#aaa">Sitio muy protegido. Prueba otro enlace.</p>`;
        return;
    }

    // === HTML CON PANTALLA TRANSPARENTE ANTI-POPUPS ===
    const cleanHTML = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Video Limpio</title>
<style>
html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#000}
video{width:100vw;height:100vh;object-fit:contain;background:#000}

/* === PANTALLA TRANSPARENTE ANTI-POPUPS === */
#antiPopupOverlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    z-index: 999999;
    background: transparent;
    pointer-events: auto;
}
</style>
</head>
<body>
<video id="player" controls autoplay playsinline controlsList="nodownload noplaybackrate" disablePictureInPicture>
<source src="${videoDirecto}" type="application/x-mpegURL">
<source src="${videoDirecto}" type="video/mp4">
</video>

<!-- Pantalla transparente que bloquea clics peligrosos -->
<div id="antiPopupOverlay"></div>

<script>
(function(){
const block = () => false;
window.open = block;
window.alert = block;
window.confirm = block;
window.prompt = block;

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(r => r.forEach(reg => reg.unregister()));
    navigator.serviceWorker.register = () => Promise.reject();
}

const blocked = ['doubleclick','googlesyndication','adservice','popads','exoclick','adsterra','propellerads','banner','popup','analytics','tracking','cloudflareinsights','yandex'];
const origFetch = window.fetch;
window.fetch = function(u){ const s=String(u).toLowerCase(); if(blocked.some(b=>s.includes(b)))return Promise.reject('blocked'); return origFetch.apply(this,arguments); };

const origOpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(m,u){ const s=String(u).toLowerCase(); if(blocked.some(b=>s.includes(b)))return; return origOpen.apply(this,arguments); };

// === BLOQUEADOR TRANSPARENTE MEJORADO ===
const overlay = document.getElementById('antiPopupOverlay');
if (overlay) {
    overlay.addEventListener('click', function(e) {
        const target = e.target;
        if (target.tagName === 'A' || target.closest('a')) {
            e.preventDefault();
            e.stopImmediatePropagation();
            return false;
        }
        // Bloquear cualquier clic que pueda abrir popup
        if (target.onclick || target.getAttribute('onclick')) {
            e.preventDefault();
            e.stopImmediatePropagation();
        }
    }, true);

    // Capturar todos los eventos de mouse
    ['mousedown', 'mouseup', 'contextmenu'].forEach(evt => {
        overlay.addEventListener(evt, function(e) {
            if (e.target.tagName === 'A' || e.target.closest('a')) {
                e.preventDefault();
                e.stopImmediatePropagation();
            }
        }, true);
    });
}

document.addEventListener('click', function(e) {
    if (e.target.tagName === 'A' || e.target.closest('a')) {
        e.preventDefault();
        e.stopPropagation();
    }
}, true);

const video = document.getElementById('player');
if (video) {
    video.volume = 1;
    video.play().catch(() => {});
    
    video.onerror = function() {
        document.body.innerHTML = '<div style="color:#fff;text-align:center;padding:50px;font-family:sans-serif"><h2>❌ Video bloqueado por protección</h2><p>Este sitio usa tokens que impiden la reproducción externa.</p></div>';
    };
}
})();
<\/script>
</body>
</html>`;

    const base64 = btoa(unescape(encodeURIComponent(cleanHTML)));
    const dataUrl = "data:text/html;base64," + base64;

    resultado.innerHTML = `
        <iframe sandbox="allow-same-origin allow-scripts" allowfullscreen src="${dataUrl}" style="width:100%;height:82vh;border:none;border-radius:10px;background:#000"></iframe>
        <br><br>
        <button onclick="navigator.clipboard.writeText('${dataUrl}')" style="padding:13px 26px;background:#222;color:#0f0;border:1px solid #0f0;border-radius:8px;cursor:pointer;font-size:15px">
            📋 Copiar Enlace Limpio
        </button>
    `;
    status.innerHTML = `<span style="color:lime">✅ Video encontrado + Bloqueador activo</span>`;
}

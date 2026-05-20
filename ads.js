// =========================
// LISTA DE PROXIES (2026)
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
// EXTRACCIÓN MEJORADA
// =========================
function extraerVideoDirecto(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    let matches = [];

    // Buscar en elementos normales
    doc.querySelectorAll('video, source, [src], [data-src], [data-url], [data-file], [data-hls]').forEach(el => {
        ['src','data-src','data-url','data-file','data-hls'].forEach(attr => {
            const val = el.getAttribute(attr);
            if (val && /https?:\/\/[^"'<> ]+\.(m3u8|mp4|webm|mov|ts)/i.test(val)) matches.push(val);
        });
    });

    // Buscar dentro de scripts
    doc.querySelectorAll('script').forEach(script => {
        const texto = script.textContent || '';
        const found = texto.match(/https?:\/\/[^"'<> ]+\.(m3u8|mp4|webm|mov|ts)(\?[^"'<> ]*)?/gi) || [];
        matches.push(...found);
    });

    matches = [...new Set(matches)].filter(url => {
        const l = url.toLowerCase();
        return url.length > 55 && 
            !l.includes('thumb') && !l.includes('preview') && !l.includes('banner') &&
            !l.includes('ads') && !l.includes('doubleclick') && !l.includes('yandex');
    });

    if (!matches.length) return null;

    matches.sort((a,b) => {
        let sa = a.length, sb = b.length;
        if (a.includes('1080')) sa += 600;
        if (a.includes('720')) sa += 400;
        if (a.includes('master')) sa += 500;
        if (a.includes('.m3u8')) sa += 350;
        if (a.includes('?')) sa += 200;
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
                if (text.length > 700) return text;
            }
        } catch(e){}
    }
    return null;
}

// =========================
// GENERAR - VERSIÓN EQUILIBRADA
// =========================
async function generar() {
    const urlInput = document.getElementById("url").value.trim();
    const status = document.getElementById("status");
    const resultado = document.getElementById("resultado");

    if (!urlInput) return alert("❌ URL inválida");

    resultado.innerHTML = "";
    status.innerHTML = "🔄 Procesando...";

    const html = await fetchConProxies(urlInput);
    if (!html) {
        status.innerHTML = "❌ No se pudo cargar";
        return;
    }

    const videoDirecto = extraerVideoDirecto(html);

    // === SI ENCONTRÓ VIDEO DIRECTO ===
    if (videoDirecto) {
        const cleanHTML = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Video</title>
<style>html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#000}video{width:100vw;height:100vh;object-fit:contain}</style>
</head><body>
<video id="player" controls autoplay playsinline>
<source src="${videoDirecto}" type="application/x-mpegURL">
<source src="${videoDirecto}" type="video/mp4">
</video>
<script>
(function(){
window.open = () => false;
const v = document.getElementById('player');
if(v){ v.volume=1; v.play().catch(()=>{}); }
})();
<\/script></body></html>`;

        const base64 = btoa(unescape(encodeURIComponent(cleanHTML)));
        const dataUrl = "data:text/html;base64," + base64;

        resultado.innerHTML = `
            <iframe sandbox="allow-same-origin allow-scripts" allowfullscreen src="${dataUrl}" style="width:100%;height:82vh;border:none;border-radius:10px;background:#000"></iframe>
            <br><br>
            <button onclick="navigator.clipboard.writeText('${dataUrl}')" style="padding:12px 24px;background:#222;color:#0f0;border:1px solid #0f0;border-radius:8px;cursor:pointer">📋 Copiar Enlace</button>
        `;
        status.innerHTML = `<span style="color:lime">✅ Video directo encontrado</span>`;
        return;
    }

    // === SI NO ENCONTRÓ VIDEO DIRECTO → MODO CAJA TRANSPARENTE INTELIGENTE ===
    status.innerHTML = "🛡️ Activando Modo Seguro...";

    const safeHTML = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Modo Seguro</title>
<style>
html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#000}
#originalContent{position:absolute;top:0;left:0;width:100%;height:100%;overflow:auto}
#glassBox{position:fixed;top:0;left:0;width:100%;height:100%;z-index:999999;background:transparent;pointer-events:auto}
</style>
</head>
<body>
<div id="originalContent">${html}</div>
<div id="glassBox"></div>
<script>
(function(){
window.open = () => false;
if('serviceWorker' in navigator){ navigator.serviceWorker.getRegistrations().then(r=>r.forEach(reg=>reg.unregister())); }

const glass = document.getElementById('glassBox');

// Permitir clics SOLO en el área del reproductor de video
glass.addEventListener('click', function(e){
    const target = e.target;
    const isVideoArea = target.tagName === 'VIDEO' || 
                        target.closest('video') || 
                        target.closest('.jwplayer') || 
                        target.closest('.plyr') || 
                        target.closest('.video-js') ||
                        target.closest('[class*="player"]');

    if (!isVideoArea) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return false;
    }
}, true);

['mousedown','contextmenu','touchstart'].forEach(evt => {
    glass.addEventListener(evt, function(e){
        const target = e.target;
        const isVideoArea = target.tagName === 'VIDEO' || target.closest('video') || target.closest('[class*="player"]');
        if (!isVideoArea) {
            e.preventDefault();
            e.stopImmediatePropagation();
        }
    }, true);
});

document.addEventListener('click', function(e){
    if (e.target.tagName === 'A' || e.target.closest('a')) {
        e.preventDefault();
        e.stopPropagation();
    }
}, true);

console.log('%c[SafeBox] Caja transparente inteligente activada', 'color:#0f0');
})();
<\/script>
</body>
</html>`;

    const base64 = btoa(unescape(encodeURIComponent(safeHTML)));
    const dataUrl = "data:text/html;base64," + base64;

    resultado.innerHTML = `
        <iframe sandbox="allow-same-origin allow-scripts" allowfullscreen src="${dataUrl}" style="width:100%;height:85vh;border:none;border-radius:12px;background:#000"></iframe>
        <br><br>
        <button onclick="navigator.clipboard.writeText('${dataUrl}')" style="padding:13px 26px;background:#111;color:#0f0;border:2px solid #0f0;border-radius:10px;cursor:pointer">📋 Copiar Enlace Seguro</button>
        <p style="color:#888;font-size:13px;margin-top:8px">Puedes reproducir el video normalmente. Los clics fuera del reproductor están bloqueados.</p>
    `;
    status.innerHTML = `<span style="color:lime">✅ Modo Seguro activado</span>`;
}

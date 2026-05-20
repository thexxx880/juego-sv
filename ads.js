// =========================
// LISTA DE PROXIES (mejorada)
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
// EXTRAER VIDEO DIRECTO (mejorado)
// =========================
function extraerVideoDirecto(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    let matches = [];

    // Buscar en video y source
    doc.querySelectorAll('video, source').forEach(el => {
        const src = el.src || el.getAttribute('src') || el.getAttribute('data-src');
        if (src) matches.push(src);
    });

    // Buscar dentro de scripts (muy importante)
    doc.querySelectorAll('script').forEach(script => {
        const texto = script.textContent || '';
        const found = texto.match(/https?:\/\/[^"'<> ]+\.(m3u8|mp4|webm|mov|ts)(\?[^"'<> ]*)?/gi) || [];
        matches.push(...found);
    });

    // Regex de respaldo
    const regex = /https?:\/\/[^"'<> ]+\.(m3u8|mp4|webm|mov|ts)(\?[^"'<> ]*)?/gi;
    const regexMatches = html.match(regex) || [];
    matches.push(...regexMatches);

    matches = [...new Set(matches)];

    matches = matches.filter(url => {
        const lower = url.toLowerCase();
        return url.length > 50 &&
            !lower.includes('thumb') && !lower.includes('preview') &&
            !lower.includes('banner') && !lower.includes('logo') &&
            !lower.includes('sprite') && !lower.includes('ads') &&
            !lower.includes('doubleclick') && !lower.includes('googlesyndication') &&
            !lower.includes('analytics') && !lower.includes('cloudflareinsights') &&
            !lower.includes('yandex');
    });

    if (!matches.length) return null;

    matches.sort((a, b) => {
        function score(url) {
            let s = url.length;
            if (url.includes('1080')) s += 500;
            if (url.includes('720')) s += 300;
            if (url.includes('master')) s += 400;
            if (url.includes('index')) s += 200;
            if (url.includes('.m3u8')) s += 250;
            if (url.includes('?')) s += 100;
            return s;
        }
        return score(b) - score(a);
    });

    return matches[0];
}

// =========================
// FETCH CON PROXIES
// =========================
async function fetchConProxies(url) {
    for (let proxy of proxies) {
        try {
            const res = await fetch(proxy + encodeURIComponent(url), {
                headers: { "User-Agent": "Mozilla/5.0" }
            });
            if (res.ok) {
                const text = await res.text();
                if (text && text.length > 800) return text;
            }
        } catch(e){}
    }
    return null;
}

// =========================
// GENERAR (VERSIÓN ESTABLE)
// =========================
async function generar() {
    const urlInput = document.getElementById("url").value.trim();
    const status = document.getElementById("status");
    const resultado = document.getElementById("resultado");

    if (!urlInput) {
        alert("❌ URL inválida");
        return;
    }

    resultado.innerHTML = "";
    status.innerHTML = "🔄 Obteniendo página...";

    const html = await fetchConProxies(urlInput);
    if (!html) {
        status.innerHTML = "❌ No se pudo obtener la página con ningún proxy";
        return;
    }

    status.innerHTML = "🔍 Buscando video directo...";
    const videoDirecto = extraerVideoDirecto(html);

    if (!videoDirecto) {
        status.innerHTML = `<span style="color:#ffaa00">⚠️ No se encontró video directo en esta página.</span>`;
        resultado.innerHTML = `
            <p style="color:#ccc">Este sitio probablemente carga el video de forma dinámica o dentro de un iframe.</p>
            <p><strong>Enlace original:</strong> <a href="${urlInput}" target="_blank" style="color:#ffd700">${urlInput}</a></p>
        `;
        return;
    }

    // === SOLO MODO VIDEO DIRECTO (más estable) ===
    const cleanHTML = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Video Limpio</title>
<style>
html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#000}
video{width:100vw!important;height:100vh!important;object-fit:contain!important;background:#000}
</style>
</head>
<body>
<video id="player" controls autoplay playsinline controlsList="nodownload noplaybackrate" disablePictureInPicture>
<source src="${videoDirecto}" type="application/x-mpegURL">
<source src="${videoDirecto}" type="video/mp4">
</video>
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
window.fetch = function(u){ 
    const s = String(u).toLowerCase(); 
    if (blocked.some(b => s.includes(b))) return Promise.reject('blocked'); 
    return origFetch.apply(this,arguments); 
};

const origOpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(m,u){ 
    const s = String(u).toLowerCase(); 
    if (blocked.some(b => s.includes(b))) return; 
    return origOpen.apply(this,arguments); 
};

document.addEventListener('click', function(e){
    if (e.target.tagName === 'A' || e.target.closest('a')) {
        e.preventDefault(); e.stopPropagation();
    }
}, true);

const video = document.getElementById('player');
if (video) {
    video.volume = 1;
    video.play().catch(()=>{});
}
})();
<\/script>
</body>
</html>`;

    const base64 = btoa(unescape(encodeURIComponent(cleanHTML)));
    const dataUrl = "data:text/html;base64," + base64;

    resultado.innerHTML = `
        <iframe sandbox="allow-same-origin allow-scripts" allowfullscreen src="${dataUrl}" style="width:100%; height:80vh; border:none; border-radius:8px;"></iframe>
        <br><br>
        <button onclick="navigator.clipboard.writeText('${dataUrl}')" style="padding:12px 24px; background:#222; color:#0f0; border:1px solid #0f0; border-radius:8px; cursor:pointer;">
            📋 Copiar Enlace Limpio
        </button>
    `;
    status.innerHTML = `<span style="color:lime">✅ ¡Video directo encontrado!</span>`;
}

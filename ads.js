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

async function fetchConProxies(url) {
    for (let proxy of proxies) {
        try {
            const res = await fetch(proxy + encodeURIComponent(url), {
                headers: { "User-Agent": "Mozilla/5.0" }
            });
            if (res.ok) {
                const text = await res.text();
                if (text.length > 600) return text;
            }
        } catch(e){}
    }
    return null;
}

async function generar() {
    const urlInput = document.getElementById("url").value.trim();
    const status = document.getElementById("status");
    const resultado = document.getElementById("resultado");

    if (!urlInput) return alert("❌ URL inválida");

    resultado.innerHTML = "";
    status.innerHTML = "🔄 Cargando página...";

    const html = await fetchConProxies(urlInput);
    if (!html) {
        status.innerHTML = "❌ No se pudo cargar la página";
        return;
    }

    status.innerHTML = "🛡️ Creando caja segura...";

    // === VERSIÓN LIMPIA Y ESTABLE ===
    const cleanHTML = `<!DOCTYPE html>
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
    // Anti popups
    window.open = () => false;
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(r => r.forEach(reg => reg.unregister()));
    }

    const glass = document.getElementById('glassBox');

    // Permitir clics SOLO en el reproductor de video
    function isVideoArea(target) {
        return target.tagName === 'VIDEO' || 
               target.closest('video') || 
               target.closest('.jwplayer') || 
               target.closest('.plyr') || 
               target.closest('.video-js') ||
               target.closest('[class*="player"]') ||
               target.closest('#vplayer');
    }

    glass.addEventListener('click', function(e) {
        if (!isVideoArea(e.target)) {
            e.preventDefault();
            e.stopImmediatePropagation();
            return false;
        }
    }, true);

    ['mousedown', 'contextmenu', 'touchstart'].forEach(evt => {
        glass.addEventListener(evt, function(e) {
            if (!isVideoArea(e.target)) {
                e.preventDefault();
                e.stopImmediatePropagation();
            }
        }, true);
    });

    // Bloquear enlaces
    document.addEventListener('click', function(e) {
        if (e.target.tagName === 'A' || e.target.closest('a')) {
            e.preventDefault();
            e.stopPropagation();
        }
    }, true);

    console.log('%c[SafeBox] Caja transparente activada correctamente', 'color:#0f0');
})();
<\/script>
</body>
</html>`;

    const base64 = btoa(unescape(encodeURIComponent(cleanHTML)));
    const dataUrl = "data:text/html;base64," + base64;

    resultado.innerHTML = `
        <iframe sandbox="allow-same-origin allow-scripts" allowfullscreen src="${dataUrl}" style="width:100%;height:85vh;border:none;border-radius:12px;background:#000"></iframe>
        <br><br>
        <button onclick="navigator.clipboard.writeText('${dataUrl}')" style="padding:13px 26px;background:#111;color:#0f0;border:2px solid #0f0;border-radius:10px;cursor:pointer">
            📋 Copiar Enlace Seguro
        </button>
        <p style="color:#888;font-size:13px;margin-top:10px">Puedes reproducir el video. Los clics fuera del reproductor están bloqueados.</p>
    `;
    status.innerHTML = `<span style="color:lime">✅ Modo Seguro activado</span>`;
}

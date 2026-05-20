// =========================
// LISTA DE PROXIES (actualizada - sin corsproxy.io)
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
// EXTRAER VIDEO DIRECTO
// =========================
function extraerVideoDirecto(html) {
    const regex = /https?:\/\/[^"'<> ]+\.(m3u8|mp4|webm|mov|ts)(\?[^"'<> ]*)?/gi;
    let matches = html.match(regex) || [];
    const extra = html.match(/https?:\/\/[^"' ]+\.m3u8[^"' ]*/gi);
    if (extra) {
        matches = matches.concat(extra);
    }
    matches = [...new Set(matches)];
    matches = matches.filter(function(url){
        const lower = url.toLowerCase();
        return (
            url.length > 40 &&
            !lower.includes('thumb') &&
            !lower.includes('preview') &&
            !lower.includes('banner') &&
            !lower.includes('logo') &&
            !lower.includes('sprite') &&
            !lower.includes('ads') &&
            !lower.includes('doubleclick') &&
            !lower.includes('googlesyndication') &&
            !lower.includes('analytics') &&
            !lower.includes('cloudflareinsights') &&
            !lower.includes('yandex')
        );
    });
    if (!matches.length) return null;
    matches.sort(function(a,b){
        function score(url){
            let s = url.length;
            if (url.includes('1080')) s += 500;
            if (url.includes('720')) s += 300;
            if (url.includes('master')) s += 400;
            if (url.includes('index')) s += 200;
            if (url.includes('.m3u8')) s += 250;
            return s;
        }
        return score(b) - score(a);
    });
    return matches[0];
}

// =========================
// FETCH CON PROXIES
// =========================
async function fetchConProxies(url){
    for (let proxy of proxies){
        try {
            const res = await fetch(
                proxy + encodeURIComponent(url),
                {
                    headers: {
                        "User-Agent": "Mozilla/5.0"
                    }
                }
            );
            if (res.ok){
                const text = await res.text();
                if (text && text.length > 100){
                    return text;
                }
            }
        } catch(e){}
    }
    return null;
}

// =========================
// GENERAR
// =========================
async function generar(){
    const urlInput = document.getElementById("url").value.trim();
    const status = document.getElementById("status");
    const resultado = document.getElementById("resultado");
    if (!urlInput){
        alert("❌ URL inválida");
        return;
    }
    resultado.innerHTML = "";
    status.innerHTML = "🔄 Obteniendo página...";
    const html = await fetchConProxies(urlInput);
    if (!html){
        status.innerHTML = "❌ No se pudo obtener la página";
        return;
    }
    status.innerHTML = "🔍 Buscando video...";
    const videoDirecto = extraerVideoDirecto(html);

    const cleanHTML = `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src * data: blob: 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval' data: blob:; style-src * 'unsafe-inline'; img-src * data: blob:; media-src * data: blob:; connect-src *; frame-src *;">
<title>Video Limpio</title>
<style>
html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#000}
video{width:100vw!important;height:100vh!important;object-fit:contain!important;background:#000}
iframe{width:100vw;height:100vh;border:none}
*{box-sizing:border-box}
</style>
</head>
<body>
${videoDirecto ? `
<video id="player" controls autoplay playsinline controlsList="nodownload noplaybackrate" disablePictureInPicture>
<source src="${videoDirecto}" type="application/x-mpegURL">
<source src="${videoDirecto}" type="video/mp4">
</video>` : html}
<script>
(function(){
const block = function(){ return false; };
window.open = block;
window.alert = block;
window.confirm = block;
window.prompt = block;
try{ history.pushState = block; history.replaceState = block; }catch(e){}
['open','assign','replace','reload'].forEach(function(fn){ try{ window.location[fn] = function(){}; }catch(e){} });

if ('serviceWorker' in navigator){
    navigator.serviceWorker.getRegistrations().then(function(regs){ regs.forEach(function(reg){ reg.unregister(); }); });
    navigator.serviceWorker.register = function(){ return Promise.reject(); };
}

const blocked = [
    'doubleclick','googlesyndication','adservice','popads','exoclick','adsterra','propellerads',
    'banner','popup','analytics','tracking','cloudflareinsights','yandex','mc.yandex'
];
const originalFetch = window.fetch;
window.fetch = function(url){
    const u = String(url).toLowerCase();
    if (blocked.some(function(b){ return u.includes(b); })) return Promise.reject('blocked');
    return originalFetch.apply(this, arguments);
};
const originalOpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(method, url){
    const u = String(url).toLowerCase();
    if (blocked.some(function(b){ return u.includes(b); })) return;
    return originalOpen.apply(this, arguments);
};

function limpiarAds(){
    document.querySelectorAll('*').forEach(function(el){
        const html = (el.outerHTML || '').toLowerCase();
        const cls = (el.className || '').toString().toLowerCase();
        const id = (el.id || '').toLowerCase();
        if (
            html.includes('doubleclick') || html.includes('googlesyndication') || html.includes('popup') ||
            html.includes('banner') || html.includes('ads') || html.includes('cloudflareinsights') || html.includes('yandex') ||
            cls.includes('ad') || cls.includes('popup') || cls.includes('banner') ||
            id.includes('ad') || id.includes('popup')
        ){
            el.remove();
            return;
        }
        const style = window.getComputedStyle(el);
        const z = parseInt(style.zIndex) || 0;
        if (style.position === 'fixed' && z > 999 && !el.querySelector('video')) el.remove();
        if (el.offsetWidth > window.innerWidth * 0.9 && el.offsetHeight > window.innerHeight * 0.9 && !el.querySelector('video')) el.remove();
    });
}
setInterval(limpiarAds, 1000);

new MutationObserver(function(mutations){
    mutations.forEach(function(mutation){
        mutation.addedNodes.forEach(function(node){
            if (!node.tagName) return;
            const tag = node.tagName.toLowerCase();
            if (tag === 'iframe' || tag === 'script' || tag === 'embed' || tag === 'object'){
                node.remove();
                return;
            }
            const html = (node.outerHTML || '').toLowerCase();
            if (html.includes('doubleclick') || html.includes('googlesyndication') || html.includes('popup') || html.includes('banner') || html.includes('ads') || html.includes('yandex')){
                node.remove();
            }
        });
    });
}).observe(document.documentElement, { childList:true, subtree:true });

['click','mousedown','mouseup','touchstart','touchend','contextmenu'].forEach(function(evt){
    document.addEventListener(evt, function(e){
        const el = e.target;
        if (el.tagName === 'A' || el.closest('a')){
            e.preventDefault();
            e.stopPropagation();
        }
    }, true);
});

document.querySelectorAll('*').forEach(function(el){
    Array.from(el.attributes).forEach(function(attr){
        if (attr.name.startsWith('on')) el.removeAttribute(attr.name);
    });
});

const video = document.getElementById('player');
if (video){
    video.volume = 1;
    video.play().catch(function(){});
}
})();
<\/script>
</body>
</html>`;

    const base64 = btoa(unescape(encodeURIComponent(cleanHTML)));
    const dataUrl = "data:text/html;base64," + base64;
    resultado.innerHTML = `
        <iframe sandbox="allow-same-origin allow-scripts" allowfullscreen src="${dataUrl}"></iframe>
        <br><br>
        <button onclick="navigator.clipboard.writeText('${dataUrl}')" style="padding:12px 20px; background:#111; color:#0f0; border:none; border-radius:8px; cursor:pointer;">
            📋 Copiar URL
        </button>
    `;
    status.innerHTML = "✅ Limpieza completada";
}
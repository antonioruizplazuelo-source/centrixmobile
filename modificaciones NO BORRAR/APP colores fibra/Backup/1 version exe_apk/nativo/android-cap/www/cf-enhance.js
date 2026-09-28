/* ============================================================================
 * cf-enhance.js  —  Mejoras nativas para Código Fibras (PC exe + Android APK)
 *   1) PC: zoom de toda la interfaz con Ctrl+rueda / Ctrl +,-,0 (sin botones);
 *      indicador discreto del nivel de zoom en la barra superior.
 *      Android: el zoom es el PELLIZCO NATIVO del WebView (fluido) — aquí solo
 *      se habilita el viewport; no hay botones ni zoom por JS.
 *   2) Botón físico "atrás" de Android: se comporta como la flecha atrás de la
 *      app (cierra visores/hojas, retrocede de pantalla en pantalla) y, ya en el
 *      inicio, muestra un aviso moderno (Cerrar / Cambiar diseño / Volver) que
 *      respeta el tema claro/oscuro.
 * ==========================================================================*/
(function () {
  'use strict';
  if (window.__cfEnhanceLoaded) return;
  window.__cfEnhanceLoaded = true;

  var UA = navigator.userAgent || '';
  var IS_PC = /Electron/i.test(UA);
  var IS_ANDROID = (typeof window.CFNative !== 'undefined') || (/Android/.test(UA) && !IS_PC);
  window.CF_PLATFORM = IS_PC ? 'pc' : (IS_ANDROID ? 'android' : 'web');

  // ---------------------------------------------------------------------------
  // Estilos propios (usan las variables de tema de la app -> claro/oscuro auto)
  // ---------------------------------------------------------------------------
  var css = document.createElement('style');
  css.textContent = [
    /* Indicador de zoom (solo PC), integrado en la barra superior */
    '.cf-zoom-ind{display:inline-flex;align-items:center;gap:5px;margin-left:8px;padding:3px 9px;',
    '  font-size:12px;font-weight:600;line-height:1;white-space:nowrap;border-radius:999px;',
    '  color:var(--ink-2,#94a3b8);background:var(--bg-soft,rgba(127,127,127,.12));',
    '  border:1px solid var(--line,rgba(127,127,127,.25));opacity:.75;user-select:none;}',
    '.cf-zoom-ind.cf-z-active{opacity:1;color:var(--ink,#e2e8f0);}',
    '.cf-zoom-ind svg{width:13px;height:13px;flex:0 0 auto;}',
    '@media print{.cf-zoom-ind{display:none!important;}}',
    /* Diálogo de salida (Android) */
    '.cf-exit-back{position:fixed;inset:0;z-index:2147483600;background:rgba(0,0,0,.45);',
    '  display:flex;align-items:center;justify-content:center;padding:24px;animation:cfFade .18s ease;}',
    '@keyframes cfFade{from{opacity:0}to{opacity:1}}',
    '.cf-exit-card{width:100%;max-width:360px;background:var(--bg-elev,#fff);color:var(--ink,#111);',
    '  border:1px solid var(--line,rgba(127,127,127,.2));border-radius:20px;padding:22px 20px 16px;',
    '  box-shadow:var(--shadow-lg,0 24px 60px rgba(0,0,0,.3));font-family:inherit;',
    '  animation:cfPop .2s cubic-bezier(.2,.9,.3,1.2);}',
    '@keyframes cfPop{from{transform:scale(.92);opacity:.4}to{transform:scale(1);opacity:1}}',
    '.cf-exit-card h3{margin:0 0 6px;font-size:18px;font-weight:800;color:var(--ink,#111);}',
    '.cf-exit-card p{margin:0 0 18px;font-size:14px;line-height:1.4;color:var(--ink-2,#667);}',
    '.cf-exit-actions{display:flex;flex-direction:column;gap:9px;}',
    '.cf-exit-actions button{all:unset;cursor:pointer;text-align:center;padding:13px 16px;border-radius:12px;',
    '  font-size:15px;font-weight:700;transition:filter .15s,background .15s;}',
    '.cf-btn-danger{background:var(--danger,#dc2626);color:#fff;}.cf-btn-danger:active{filter:brightness(.9);}',
    '.cf-btn-alt{background:var(--bg-soft,rgba(127,127,127,.14));color:var(--ink,#111);}',
    '.cf-btn-alt:active{filter:brightness(.95);}',
    '.cf-btn-ghost{color:var(--ink-2,#667);}.cf-btn-ghost:active{background:var(--bg-soft,rgba(127,127,127,.1));}'
  ].join('\n');
  (document.head || document.documentElement).appendChild(css);

  // ===========================================================================
  // 1a) ANDROID: pellizco nativo del WebView (fluido). Solo hay que permitir el
  //     escalado en el viewport; el zoom lo hace el propio WebView (ver también
  //     WebSettings en MainActivity).
  // ===========================================================================
  if (IS_ANDROID) {
    var vp = document.querySelector('meta[name="viewport"]');
    if (vp) vp.setAttribute('content',
      'width=device-width, initial-scale=1, viewport-fit=cover, minimum-scale=1, maximum-scale=6, user-scalable=yes');
  }

  // ===========================================================================
  // 1b) PC: zoom de la interfaz con Ctrl+rueda / teclado + indicador en la barra
  // ===========================================================================
  var MINZ = 0.6, MAXZ = 3, STEP = 0.1;
  var zoom = parseFloat(localStorage.getItem('cf.uiZoom') || '1') || 1;

  function zoomRoot() { return document.getElementById('root'); }
  function applyZoom() {
    if (!IS_PC) return;
    zoom = Math.min(MAXZ, Math.max(MINZ, Math.round(zoom * 100) / 100));
    var r = zoomRoot();
    if (r) r.style.zoom = zoom;
    localStorage.setItem('cf.uiZoom', String(zoom));
    updateIndicator();
  }
  function setZoom(z) { zoom = z; applyZoom(); }
  function bumpZoom(d) { setZoom(zoom + d); }

  var indicator = null;
  function makeIndicator() {
    var el = document.createElement('div');
    el.className = 'cf-zoom-ind';
    el.title = 'Nivel de zoom (Ctrl + rueda del ratón). Ctrl+0 = 100%';
    el.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><span class="cf-z-val">100%</span>';
    el.addEventListener('click', function () { setZoom(1); });
    return el;
  }
  function updateIndicator() {
    if (!indicator) return;
    var pct = Math.round(zoom * 100);
    var v = indicator.querySelector('.cf-z-val');
    if (v) v.textContent = pct + '%';
    indicator.classList.toggle('cf-z-active', pct !== 100);
  }
  function ensureIndicator() {
    if (!IS_PC) return;
    var bar = document.querySelector('.topbar');
    if (!bar) return;
    if (!indicator) indicator = makeIndicator();
    if (indicator.parentElement !== bar) bar.appendChild(indicator);
    updateIndicator();
  }

  if (IS_PC) {
    // Ctrl/Cmd + rueda
    window.addEventListener('wheel', function (e) {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      bumpZoom(e.deltaY < 0 ? STEP : -STEP);
    }, { passive: false });
    // Teclado Ctrl +/-/0
    window.addEventListener('keydown', function (e) {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === '+' || e.key === '=') { e.preventDefault(); bumpZoom(STEP); }
      else if (e.key === '-' || e.key === '_') { e.preventDefault(); bumpZoom(-STEP); }
      else if (e.key === '0') { e.preventDefault(); setZoom(1); }
    });
  }

  // ===========================================================================
  // 2) BOTÓN ATRÁS (Android)  —  window.__cfHandleBack() lo llama MainActivity.
  //    Vale para la versión Pro (barra lateral) y Móvil (pestañas + flecha atrás).
  // ===========================================================================
  function isLight() {
    var t = document.documentElement.getAttribute('data-theme');
    return t !== 'dark';
  }

  function closeExitDialog() {
    var d = document.querySelector('.cf-exit-back');
    if (d) { d.remove(); return true; }
    return false;
  }
  function showExitDialog() {
    if (document.querySelector('.cf-exit-back')) return;
    var back = document.createElement('div');
    back.className = 'cf-exit-back';
    back.innerHTML =
      '<div class="cf-exit-card" role="dialog" aria-modal="true">' +
      '  <h3>¿Salir de Código Fibras?</h3>' +
      '  <p>Estás en la pantalla inicial. ¿Qué quieres hacer?</p>' +
      '  <div class="cf-exit-actions">' +
      '    <button class="cf-btn-danger" data-act="close">Cerrar app</button>' +
      '    <button class="cf-btn-alt" data-act="design">Cambiar diseño</button>' +
      '    <button class="cf-btn-ghost" data-act="back">Volver</button>' +
      '  </div>' +
      '</div>';
    back.addEventListener('click', function (e) {
      var act = e.target && e.target.getAttribute && e.target.getAttribute('data-act');
      if (e.target === back) act = 'back';
      if (!act) return;
      if (act === 'back') closeExitDialog();
      else if (act === 'design') { localStorage.removeItem('codigoFibras.preferredVersion'); location.href = 'index.html?choose=1'; }
      else if (act === 'close') {
        if (window.CFNative && window.CFNative.closeApp) window.CFNative.closeApp();
        else { try { window.close(); } catch (x) {} }
      }
    });
    document.body.appendChild(back);
  }

  // Cierra la capa superpuesta más alta (visor de foto, modal Pro o hoja Móvil)
  function closeTopOverlay() {
    var lb = document.querySelector('.lightbox');
    if (lb) { lb.click(); return true; }
    var overlays = document.querySelectorAll('.modal-back, .sheet-back');
    if (overlays.length) {
      var top = overlays[overlays.length - 1];
      var x = top.querySelector('.modal-head button, .sheet-head button, .sheet-head .iconbtn');
      if (x) x.click(); else top.click();
      return true;
    }
    return false;
  }

  // Flecha atrás PROPIA de la app (Móvil): cable->lista, sub-vista->menú Más
  function clickAppBackArrow() {
    var b = document.querySelector('.topbar [aria-label="Lista"], .topbar [aria-label="Atrás"], .topbar [aria-label="Volver"]');
    if (b) { b.click(); return true; }
    return false;
  }

  // Retrocede a la pantalla inicial (Pro: nav Cables · Móvil: pestaña Lista)
  function goHome() {
    // Móvil: barra de pestañas inferior
    var tabs = document.querySelectorAll('.tabbar .tab');
    if (tabs.length) {
      var act = document.querySelector('.tabbar .tab.active');
      if (act && tabs[0] && act !== tabs[0]) { tabs[0].click(); return true; }
      return false;
    }
    // Pro: barra lateral
    var navs = document.querySelectorAll('.nav-btn');
    if (navs.length) {
      var a = document.querySelector('.nav-btn.active');
      if (a && navs[0] && a !== navs[0]) { navs[0].click(); return true; }
      return false;
    }
    return false;
  }

  window.__cfHandleBack = function () {
    try {
      if (closeExitDialog()) return 'handled';   // aviso de salida abierto -> Volver
      if (closeTopOverlay()) return 'handled';    // visor / modal / hoja
      if (clickAppBackArrow()) return 'handled';  // flecha atrás propia (móvil)
      if (goHome()) return 'handled';             // retroceder hasta el inicio
      showExitDialog();                            // ya en el inicio -> aviso
      return 'handled';
    } catch (e) { return 'noop'; }
  };

  // ---------------------------------------------------------------------------
  // Arranque
  // ---------------------------------------------------------------------------
  function boot() {
    applyZoom();
    ensureIndicator();
    if (IS_PC) {
      // Re-inserta el indicador si React re-renderiza la barra superior
      var host = document.getElementById('root') || document.body;
      try {
        var mo = new MutationObserver(function () { ensureIndicator(); });
        mo.observe(host, { childList: true, subtree: true });
      } catch (e) {}
      var tries = 0;
      var iv = setInterval(function () {
        tries++; ensureIndicator();
        if (tries > 40 || (indicator && indicator.parentElement)) clearInterval(iv);
      }, 250);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

package com.aruiz.codigofibras;

import android.os.Build;
import android.os.Bundle;
import android.webkit.ValueCallback;
import android.webkit.WebSettings;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;

public class MainActivity extends BridgeActivity {

    /**
     * Interceptor inyectado en la página: captura los clics sobre <a download> cuyo href es blob: o data:
     * (backup .json, exportaciones .xlsx/.zip, fotos...), lee el contenido y lo entrega al puente nativo
     * CFNative para guardarlo en Descargas. Se ejecuta en fase de captura y sólo cancela la acción por
     * defecto (que en un WebView no guardaría nada); no interfiere con el resto de la lógica de la app.
     */
    private static final String DOWNLOAD_INTERCEPTOR_JS =
        "(function(){" +
        "  if (window.__cfDownloadHook) return; window.__cfDownloadHook = true;" +
        "  document.addEventListener('click', function(e){" +
        "    try {" +
        "      var a = e.target && e.target.closest ? e.target.closest('a[download]') : null;" +
        "      if (!a || !a.href) return;" +
        "      if (a.href.indexOf('blob:') === 0 || a.href.indexOf('data:') === 0) {" +
        "        e.preventDefault();" +
        "        var name = a.getAttribute('download') || 'codigo-fibras.bin';" +
        "        fetch(a.href).then(function(r){ return r.blob(); }).then(function(b){" +
        "          var fr = new FileReader();" +
        "          fr.onloadend = function(){ try { CFNative.saveBase64(fr.result, name, b.type || ''); } catch(err){} };" +
        "          fr.readAsDataURL(b);" +
        "        }).catch(function(){});" +
        "      }" +
        "    } catch(err){}" +
        "  }, true);" +
        "})();";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Android <= 9 necesita permiso de escritura para el fallback a Descargas; en 10+ no hace falta.
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            if (checkSelfPermission(android.Manifest.permission.WRITE_EXTERNAL_STORAGE)
                    != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[]{ android.Manifest.permission.WRITE_EXTERNAL_STORAGE }, 1001);
            }
        }

        final WebView webView = this.bridge.getWebView();
        webView.addJavascriptInterface(new DownloadBridge(this), "CFNative");

        // Zoom por PELLIZCO nativo del WebView (fluido, acelerado por GPU) — sin controles a la vista.
        // El viewport se ajusta desde cf-enhance.js para permitir el escalado.
        WebSettings ws = webView.getSettings();
        ws.setSupportZoom(true);
        ws.setBuiltInZoomControls(true);
        ws.setDisplayZoomControls(false);

        this.bridge.addWebViewListener(new WebViewListener() {
            @Override
            public void onPageLoaded(WebView view) {
                view.evaluateJavascript(DOWNLOAD_INTERCEPTOR_JS, null);
            }
        });
    }

    /**
     * Botón físico "atrás": en vez de cerrar la app, se lo pasamos a la web (window.__cfHandleBack),
     * que cierra modales/visores, navega hasta la pantalla inicial y, ya en el inicio, muestra el aviso
     * moderno (Cerrar / Volver / Cambiar diseño). Solo si la web no está lista, minimizamos la app.
     */
    @Override
    public void onBackPressed() {
        final WebView webView = this.bridge != null ? this.bridge.getWebView() : null;
        if (webView == null) {
            super.onBackPressed();
            return;
        }
        webView.evaluateJavascript(
            "(window.__cfHandleBack ? window.__cfHandleBack() : 'noop')",
            new ValueCallback<String>() {
                @Override
                public void onReceiveValue(String value) {
                    String v = value == null ? "" : value.replace("\"", "");
                    if ("noop".equals(v)) {
                        // La web aún no ha cargado el gestor: minimizar (no cerrar de golpe).
                        moveTaskToBack(true);
                    }
                    // "handled": la web ya ha actuado; consumimos el atrás.
                }
            }
        );
    }
}

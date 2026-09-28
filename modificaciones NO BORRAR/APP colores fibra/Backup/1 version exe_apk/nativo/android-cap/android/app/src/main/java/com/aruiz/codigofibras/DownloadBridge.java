package com.aruiz.codigofibras;

import android.app.Activity;
import android.content.ContentValues;
import android.content.Context;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.widget.Toast;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

/**
 * Puente JavaScript <-> Android para GUARDAR de verdad las descargas que la app hace por Blob/data URL
 * (backup .json, exportaciones .xlsx/.zip, fotos...). En un WebView, un <a download> con blob: no guarda
 * nada por sí solo: aquí recibimos el contenido en base64 y lo escribimos en la carpeta pública Descargas.
 *
 * NO se modifica el código de la app: la interceptación se inyecta desde MainActivity (fase de captura de
 * clics sobre <a download>), de modo que el mismo www vale para PC y Android.
 */
public class DownloadBridge {

    private final Activity activity;

    public DownloadBridge(Activity activity) {
        this.activity = activity;
    }

    /**
     * @param dataUrl  data URL completa: "data:<mime>;base64,<datos>"
     * @param filename nombre sugerido por la app (a.download)
     * @param mime     tipo MIME del blob (puede venir vacío)
     */
    @JavascriptInterface
    public void saveBase64(final String dataUrl, final String filename, final String mime) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    String base64 = dataUrl;
                    int comma = dataUrl.indexOf(',');
                    if (comma >= 0) base64 = dataUrl.substring(comma + 1);
                    byte[] bytes = Base64.decode(base64, Base64.DEFAULT);

                    String name = (filename == null || filename.trim().isEmpty()) ? "codigo-fibras.bin" : filename;
                    String type = (mime == null || mime.isEmpty()) ? guessMime(name) : mime;

                    boolean ok = writeToDownloads(name, type, bytes);
                    toast(ok ? ("Guardado en Descargas:\n" + name) : "No se pudo guardar el archivo");
                } catch (Exception e) {
                    toast("Error al guardar: " + e.getMessage());
                }
            }
        }).start();
    }

    private boolean writeToDownloads(String name, String mime, byte[] bytes) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                Context ctx = activity.getApplicationContext();
                ContentValues values = new ContentValues();
                values.put(MediaStore.Downloads.DISPLAY_NAME, name);
                values.put(MediaStore.Downloads.MIME_TYPE, mime);
                values.put(MediaStore.Downloads.IS_PENDING, 1);
                Uri collection = MediaStore.Downloads.EXTERNAL_CONTENT_URI;
                Uri item = ctx.getContentResolver().insert(collection, values);
                if (item == null) return false;
                try (OutputStream os = ctx.getContentResolver().openOutputStream(item)) {
                    if (os == null) return false;
                    os.write(bytes);
                    os.flush();
                }
                values.clear();
                values.put(MediaStore.Downloads.IS_PENDING, 0);
                ctx.getContentResolver().update(item, values, null, null);
                return true;
            } else {
                // API < 29: escritura directa a la carpeta pública de Descargas (requiere WRITE_EXTERNAL_STORAGE)
                File dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                if (!dir.exists()) dir.mkdirs();
                File out = new File(dir, name);
                try (FileOutputStream fos = new FileOutputStream(out)) {
                    fos.write(bytes);
                    fos.flush();
                }
                return true;
            }
        } catch (Exception e) {
            return false;
        }
    }

    /** Cierra la app del todo (lo llama el diálogo de salida al pulsar "Cerrar app"). */
    @JavascriptInterface
    public void closeApp() {
        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                activity.finishAffinity();
            }
        });
    }

    private String guessMime(String name) {
        String n = name.toLowerCase();
        if (n.endsWith(".json")) return "application/json";
        if (n.endsWith(".xlsx")) return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        if (n.endsWith(".zip")) return "application/zip";
        if (n.endsWith(".png")) return "image/png";
        if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
        if (n.endsWith(".csv")) return "text/csv";
        return "application/octet-stream";
    }

    private void toast(final String msg) {
        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                Toast.makeText(activity.getApplicationContext(), msg, Toast.LENGTH_LONG).show();
            }
        });
    }
}

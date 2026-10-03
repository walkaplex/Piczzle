package com.walkaplex.piczzle;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.View;
import android.view.Window;
import android.webkit.JavascriptInterface;

import com.getcapacitor.BridgeActivity;
import androidx.activity.OnBackPressedCallback;
import androidx.core.content.FileProvider;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

public class MainActivity extends BridgeActivity {
    private boolean backPending;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window window = getWindow();
        int piczzleDark = Color.parseColor("#0B1020");
        window.setStatusBarColor(piczzleDark);
        window.setNavigationBarColor(piczzleDark);
        window.getDecorView().setSystemUiVisibility(0);

        bridge.getWebView().addJavascriptInterface(new PiczzleAndroidBridge(this), "PiczzleAndroid");
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (backPending) return;
                backPending = true;
                bridge.getWebView().evaluateJavascript(
                    "Boolean(window.PiczzleGame && window.PiczzleGame.back())",
                    handled -> {
                        backPending = false;
                        if (!"true".equals(handled)) moveTaskToBack(true);
                    });
            }
        });
    }

    @Override
    public void onResume() {
        super.onResume();
        setPuzzleActive(true);
    }

    @Override
    public void onPause() {
        setPuzzleActive(false);
        super.onPause();
    }

    private void setPuzzleActive(boolean active) {
        if (bridge != null) {
            bridge.getWebView().evaluateJavascript(
                "window.PiczzleGame && window.PiczzleGame.setActive(" + active + ")", null);
        }
    }

    public static class PiczzleAndroidBridge {
        private final Context context;

        PiczzleAndroidBridge(Context context) {
            this.context = context;
        }

        @JavascriptInterface
        public String shareLink(String url) {
            try {
                Intent sendIntent = new Intent(Intent.ACTION_SEND);
                sendIntent.setType("text/plain");
                sendIntent.putExtra(Intent.EXTRA_SUBJECT, "Piczzle");
                sendIntent.putExtra(Intent.EXTRA_TITLE, "Piczzle");
                sendIntent.putExtra(Intent.EXTRA_TEXT, url);

                Intent chooser = Intent.createChooser(sendIntent, "Share Piczzle");
                chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(chooser);
                return "shared";
            } catch (Exception error) {
                return "error:" + error.getClass().getSimpleName();
            }
        }

        @JavascriptInterface
        public String saveImage(String filename, String dataUrl) {
            try {
                int comma = dataUrl.indexOf(',');
                String base64 = comma >= 0 ? dataUrl.substring(comma + 1) : dataUrl;
                byte[] imageBytes = Base64.decode(base64, Base64.DEFAULT);
                String mimeType = dataUrl.startsWith("data:image/png") ? "image/png" : "image/jpeg";

                if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
                    // Older Android needs storage permission for MediaStore; share a cache file instead.
                    File directory = new File(context.getCacheDir(), "piczzle-saves");
                    if (!directory.exists() && !directory.mkdirs()) return "error:cache-directory";
                    File file = new File(directory, new File(filename).getName());
                    try (FileOutputStream out = new FileOutputStream(file)) {
                        out.write(imageBytes);
                    }
                    Uri imageUri = FileProvider.getUriForFile(context, context.getPackageName() + ".fileprovider", file);
                    Intent send = new Intent(Intent.ACTION_SEND);
                    send.setType(mimeType);
                    send.putExtra(Intent.EXTRA_STREAM, imageUri);
                    send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    Intent chooser = Intent.createChooser(send, "Save Piczzle image");
                    chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    context.startActivity(chooser);
                    return "shared";
                }

                ContentResolver resolver = context.getContentResolver();
                ContentValues values = new ContentValues();
                values.put(MediaStore.Images.Media.DISPLAY_NAME, filename);
                values.put(MediaStore.Images.Media.MIME_TYPE, mimeType);

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    values.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/Piczzle");
                    values.put(MediaStore.Images.Media.IS_PENDING, 1);
                }

                Uri uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);
                if (uri == null) return "error:media-store";

                try (OutputStream out = resolver.openOutputStream(uri)) {
                    if (out == null) throw new IllegalStateException("No image output stream");
                    out.write(imageBytes);
                } catch (Exception error) {
                    resolver.delete(uri, null, null);
                    throw error;
                }

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    values.clear();
                    values.put(MediaStore.Images.Media.IS_PENDING, 0);
                    resolver.update(uri, values, null, null);
                }

                return "saved";
            } catch (Exception error) {
                return "error:" + error.getClass().getSimpleName();
            }
        }
    }
}

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

import androidx.core.content.FileProvider;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window window = getWindow();
        int piczzleDark = Color.parseColor("#0B1020");
        window.setStatusBarColor(piczzleDark);
        window.setNavigationBarColor(piczzleDark);
        window.getDecorView().setSystemUiVisibility(0);

        bridge.getWebView().addJavascriptInterface(new PiczzleAndroidBridge(this), "PiczzleAndroid");
    }

    public static class PiczzleAndroidBridge {
        private final Context context;

        PiczzleAndroidBridge(Context context) {
            this.context = context;
        }

        @JavascriptInterface
        public String shareLink(String url, String dataUrl) {
            try {
                Intent sendIntent = new Intent(Intent.ACTION_SEND);
                sendIntent.putExtra(Intent.EXTRA_SUBJECT, "Piczzle");
                sendIntent.putExtra(Intent.EXTRA_TEXT, "I made you a puzzle. Solve it to reveal the photo.\n\n" + url);

                Uri imageUri = previewImageUri(dataUrl);
                if (imageUri != null) {
                    sendIntent.setType("image/jpeg");
                    sendIntent.putExtra(Intent.EXTRA_STREAM, imageUri);
                    sendIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                } else {
                    sendIntent.setType("text/plain");
                }

                Intent chooser = Intent.createChooser(sendIntent, "Share Piczzle");
                chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                chooser.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                context.startActivity(chooser);
                return "shared";
            } catch (Exception error) {
                return "error:" + error.getClass().getSimpleName();
            }
        }

        private Uri previewImageUri(String dataUrl) throws Exception {
            if (dataUrl == null || dataUrl.length() == 0) return null;

            int comma = dataUrl.indexOf(',');
            String base64 = comma >= 0 ? dataUrl.substring(comma + 1) : dataUrl;
            byte[] imageBytes = Base64.decode(base64, Base64.DEFAULT);

            File shareDir = new File(context.getCacheDir(), "shared");
            if (!shareDir.exists() && !shareDir.mkdirs()) return null;

            File imageFile = new File(shareDir, "piczzle-share-preview.jpg");
            try (FileOutputStream out = new FileOutputStream(imageFile)) {
                out.write(imageBytes);
            }

            return FileProvider.getUriForFile(context, context.getPackageName() + ".fileprovider", imageFile);
        }

        @JavascriptInterface
        public String saveImage(String filename, String dataUrl) {
            try {
                int comma = dataUrl.indexOf(',');
                String base64 = comma >= 0 ? dataUrl.substring(comma + 1) : dataUrl;
                byte[] imageBytes = Base64.decode(base64, Base64.DEFAULT);

                ContentResolver resolver = context.getContentResolver();
                ContentValues values = new ContentValues();
                values.put(MediaStore.Images.Media.DISPLAY_NAME, filename);
                values.put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg");

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    values.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/Piczzle");
                    values.put(MediaStore.Images.Media.IS_PENDING, 1);
                }

                Uri uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);
                if (uri == null) return "error:media-store";

                try (OutputStream out = resolver.openOutputStream(uri)) {
                    if (out == null) return "error:output-stream";
                    out.write(imageBytes);
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

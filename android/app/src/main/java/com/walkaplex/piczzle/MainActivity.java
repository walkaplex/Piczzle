package com.walkaplex.piczzle;

import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.view.Window;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window window = getWindow();
        int piczzleDark = Color.parseColor("#0B1020");
        window.setStatusBarColor(piczzleDark);
        window.setNavigationBarColor(piczzleDark);
        window.getDecorView().setSystemUiVisibility(0);
    }
}

package com.fretquency.app;

import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

// Overrides the MainActivity that `npx cap add android` generates, to run the
// app in true immersive full-screen: both system bars (status bar + navigation
// bar) are hidden and only reappear as a transient overlay when the user swipes
// in from the edge. The APK workflow copies this file into the generated
// android/ project after `cap add`.
//
// It also registers AppUpdaterPlugin (the in-app APK self-update, driven from
// src/utils/appUpdate.ts), which has to happen before super.onCreate().
public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AppUpdaterPlugin.class);
        super.onCreate(savedInstanceState);
        // Let the WebView paint into the display cutout / notch region. Without
        // this, Android letterboxes the status-bar strip with the activity's
        // (light-mode DayNight) window background — a grey bar across the top
        // above the notch, even though both system bars are hidden below it.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            getWindow().getAttributes().layoutInDisplayCutoutMode =
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
        }
        applyImmersive();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            applyImmersive();
        }
    }

    private void applyImmersive() {
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        WindowInsetsControllerCompat controller =
            WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        if (controller != null) {
            controller.hide(WindowInsetsCompat.Type.systemBars());
            controller.setSystemBarsBehavior(
                WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        }
    }
}

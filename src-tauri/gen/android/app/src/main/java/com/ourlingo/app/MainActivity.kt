package com.ourlingo.app

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.activity.enableEdgeToEdge
import androidx.core.view.WindowCompat

class MainActivity : TauriActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
  }

  override fun onWebViewCreate(webView: WebView) {
    webView.addJavascriptInterface(AppBridge(), "OurLingoAndroid")
  }

  inner class AppBridge {
    // Lets the web app match status and navigation bar icons to its chosen
    // theme, which may differ from the device's light or dark setting.
    @JavascriptInterface
    fun setDarkTheme(dark: Boolean) {
      runOnUiThread {
        WindowCompat.getInsetsController(window, window.decorView).apply {
          isAppearanceLightStatusBars = !dark
          isAppearanceLightNavigationBars = !dark
        }
      }
    }

    // Opens the email app with the weekly report filled in; the user sends it.
    // Returns false when no email app is installed.
    @JavascriptInterface
    fun sendEmail(to: String, subject: String, body: String): Boolean {
      val intent = Intent(Intent.ACTION_SENDTO).apply {
        data = Uri.parse("mailto:")
        putExtra(Intent.EXTRA_EMAIL, to.split(",").map { it.trim() }.filter { it.isNotEmpty() }.toTypedArray())
        putExtra(Intent.EXTRA_SUBJECT, subject)
        putExtra(Intent.EXTRA_TEXT, body)
      }
      if (intent.resolveActivity(packageManager) == null) return false
      runOnUiThread { startActivity(Intent.createChooser(intent, null)) }
      return true
    }
  }
}

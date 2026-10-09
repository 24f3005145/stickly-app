package com.example.stickly

import android.os.Bundle
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(SticklyPlugin::class.java) // must come before super.onCreate
        super.onCreate(savedInstanceState)
    }
}

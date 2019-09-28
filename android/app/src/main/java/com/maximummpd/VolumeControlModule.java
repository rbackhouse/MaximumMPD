/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2019 Richard Backhouse
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */
package com.maximummpd;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.LifecycleEventListener;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.IntentFilter;
import android.media.AudioManager;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

public class VolumeControlModule extends ReactContextBaseJavaModule implements ActivityEventListener, LifecycleEventListener {
    private AudioManager am;
    private VolumeBroadcastReceiver volumeBR;
    private float maxVolume = (float) 0.0;

    public VolumeControlModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "VolumeControl";
    }

    @Override
    public void onHostResume() {
        registerVolumeReceiver();
    }

    @Override
    public void onHostPause() {
        unregisterVolumeReceiver();
    }

    @Override
    public void onHostDestroy() {
    }

    @Override
    public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
    }

    @Override
    public void onNewIntent(Intent intent) {
    }

    @Override
    public void initialize() {
        super.initialize();

        try {
            am = (AudioManager) getReactApplicationContext().getSystemService(Context.AUDIO_SERVICE);
            maxVolume = am.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
            volumeBR = new VolumeBroadcastReceiver();
            registerVolumeReceiver();
        } catch (Exception e) {
            Log.d("VolumeControl", "Failed to initialize", e);
        }
    }

    @ReactMethod
    public void setVolume(Float volume) {
        try {
            am.setStreamVolume(AudioManager.STREAM_MUSIC, (int) (volume * maxVolume), 0);
        } catch (Exception e) {
            Log.d("VolumeControl", "Failed to set volume", e);
        }
    }

    @ReactMethod
    public void getVolume(Promise promise) {
        promise.resolve(getNormalizedVolume());
    }

    private float getNormalizedVolume() {
        return am.getStreamVolume(AudioManager.STREAM_MUSIC) * 1.0f / maxVolume;
    }

    private void registerVolumeReceiver() {
        if (!volumeBR.isRegistered()) {
            IntentFilter filter = new IntentFilter("android.media.VOLUME_CHANGED_ACTION");
            getReactApplicationContext().registerReceiver(volumeBR, filter);
            volumeBR.setRegistered(true);
        }
    }

    private void unregisterVolumeReceiver() {
        if (volumeBR.isRegistered()) {
            getReactApplicationContext().unregisterReceiver(volumeBR);
            volumeBR.setRegistered(false);
        }
    }

    public class VolumeBroadcastReceiver extends BroadcastReceiver {

        private boolean isRegistered = false;

        public void setRegistered(boolean registered) {
            isRegistered = registered;
        }

        public boolean isRegistered() {
            return isRegistered;
        }

        @Override
        public void onReceive(Context context, Intent intent) {
            if (intent.getAction().equals("android.media.VOLUME_CHANGED_ACTION")) {
                float volume = getNormalizedVolume();
                WritableMap params = Arguments.createMap();
                params.putDouble("volume", volume);
                try {
                    getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit("OnVolumeChange", params);
                } catch (RuntimeException e) {
                }
            }
        }
    }
}

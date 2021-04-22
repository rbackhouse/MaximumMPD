package com.maximummpd;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import net.mm2d.upnp.Device;

import java.util.HashMap;

public class AudioStreamerModule extends ReactContextBaseJavaModule  {
    public AudioStreamerModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "AudioStreamer";
    }

    @ReactMethod
    public void addSong(String strUrl) {

    }

    @ReactMethod
    public void play() {
    }

    @ReactMethod
    public void pause() {
    }

    @ReactMethod
    public void next() {
    }

    @ReactMethod
    public void getQueue(Promise promise) {
    }

    @ReactMethod
    public void clearQueue() {
    }
}

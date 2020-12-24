package com.maximummpd;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class UPnPModule extends ReactContextBaseJavaModule {
    public UPnPModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "UPnP";
    }

    @ReactMethod
    public void startListening() {
    }

    @ReactMethod
    public void stopListening() {
    }

    @ReactMethod
    public void browse(String udn, String objectId, Promise promise) {
    }

    @ReactMethod
    public void search(String udn, String containerId, String searchCriteria, String filter, Promise promise) {
    }
}

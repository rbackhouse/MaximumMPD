package com.maximummpd;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import android.net.nsd.NsdManager;
import android.net.nsd.NsdServiceInfo;
import android.util.Log;

public class BonjourListenerModule extends ReactContextBaseJavaModule {
    private NsdManager.DiscoveryListener discoveryListener = null;
    private NsdManager nsdManager = null;

    public BonjourListenerModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "BonjourListener";
    }

    @ReactMethod
    public void listen(String type, String domain) {
        discoveryListener = new NsdManager.DiscoveryListener() {
            @Override
            public void onDiscoveryStarted(String regType) {
                Log.d("BonjourListener", "Service discovery started");
            }

            @Override
            public void onServiceFound(NsdServiceInfo service) {
                Log.d("BonjourListener", "Service found : "+service.getServiceName()+" "+service.getServiceType()+" "+service.getHost()+":"+service.getPort());
                WritableMap params = Arguments.createMap();
                params.putString("type", "discover");
                params.putString("name", service.getServiceName());
                getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit("OnDiscover", params);

                nsdManager.resolveService(service, new NsdManager.ResolveListener() {
                    @Override
                    public void onServiceResolved(NsdServiceInfo s) {
                        WritableMap params = Arguments.createMap();
                        params.putString("type", "add");
                        params.putString("name", s.getServiceName());
                        params.putString("hostname", s.getHost().getHostName());
                        params.putInt("port", s.getPort());
                        params.putString("ipAddress", s.getHost().getHostAddress());

                        getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit("OnDiscover", params);
                    }

                    @Override
                    public void onResolveFailed(NsdServiceInfo serviceInfo, int errorCode) {

                    }
                });
            }

            @Override
            public void onServiceLost(NsdServiceInfo service) {
                Log.d("BonjourListener", "Service lost : ");
                WritableMap params = Arguments.createMap();
                params.putString("type", "remove");
                params.putString("name", service.getServiceName());
                getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit("OnDiscover", params);
            }

            @Override
            public void onDiscoveryStopped(String serviceType) {
                Log.d("BonjourListener", "Service discovery stopped : ");

            }

            @Override
            public void onStartDiscoveryFailed(String serviceType, int errorCode) {

            }

            @Override
            public void onStopDiscoveryFailed(String serviceType, int errorCode) {

            }
        };
        nsdManager = (NsdManager)getReactApplicationContext().getSystemService(getReactApplicationContext().NSD_SERVICE);

        nsdManager.discoverServices("_mpd._tcp.", NsdManager.PROTOCOL_DNS_SD, discoveryListener);
    }
}

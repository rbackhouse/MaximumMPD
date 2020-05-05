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
                Log.d("BonjourListener", "Service found : ["+service.getServiceName()+"] ["+service.getServiceType()+"]");
                WritableMap params = Arguments.createMap();
                params.putString("type", "discover");
                params.putString("name", service.getServiceName());
                getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit("OnDiscover", params);
                startResolveListener(service);
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

    @ReactMethod
    public void stopListening() {
        nsdManager.stopServiceDiscovery(discoveryListener);
    }

    private void startResolveListener(NsdServiceInfo service) {
        final NsdServiceInfo _service = service;
        nsdManager.resolveService(service, new NsdManager.ResolveListener() {
            @Override
            public void onServiceResolved(NsdServiceInfo s) {
                Log.d("BonjourListener", "Service resolved : ["+s.getServiceName()+"] ["+s.getServiceType()+"] ["+s.getHost().getHostName()+"] ["+s.getPort()+"] ["+s.getHost().getHostAddress()+"]");
                WritableMap params = Arguments.createMap();
                params.putString("type", "add");
                params.putString("name", s.getServiceName());
                params.putString("hostname", s.getHost().getHostName());
                params.putInt("port", s.getPort());
                params.putString("ipAddress", s.getHost().getHostAddress());

                getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit("OnDiscover", params);
            }

            @Override
            public void onResolveFailed(NsdServiceInfo service, int errorCode) {
                Log.d("BonjourListener", "Service resolve error : ["+service.getServiceName()+"] ["+service.getServiceType()+"] "+errorCode);
                if (errorCode == NsdManager.FAILURE_ALREADY_ACTIVE) {
                    try {
                        Thread.currentThread().sleep(500);
                    } catch (InterruptedException e) {}
                    startResolveListener(_service);
                }
            }
        });
    }
}

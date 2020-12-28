package com.maximummpd;

import android.util.Log;
import android.util.Xml;

import java.io.IOException;
import java.io.StringReader;
import java.util.Map;
import java.util.HashMap;
import java.util.concurrent.Executor;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import net.mm2d.upnp.Action;
import net.mm2d.upnp.ControlPointFactory;
import net.mm2d.upnp.ControlPoint;
import net.mm2d.upnp.Device;
import net.mm2d.upnp.Protocol;
import net.mm2d.upnp.TaskExecutor;
import net.mm2d.upnp.util.NetworkUtils;


import org.xmlpull.v1.XmlPullParser;
import org.xmlpull.v1.XmlPullParserException;

public class UPnPModule extends ReactContextBaseJavaModule implements ControlPoint.DiscoveryListener {
    private ControlPoint cp = null;
    private Map<String, Device> servers = null;
    private Map<String, Device> renderers = null;

    public UPnPModule(ReactApplicationContext reactContext) {
        super(reactContext);
        servers = new HashMap<String, Device>();
        renderers = new HashMap<String, Device>();
    }

    @Override
    public String getName() {
        return "UPnP";
    }

    @ReactMethod
    public void startListening() {
        Log.d("UPnP", "startListening");

        cp = ControlPointFactory.builder()
                .setProtocol(Protocol.DEFAULT)
                .setInterfaces(NetworkUtils.getNetworkInterfaceList())
                .setCallbackExecutor(new TaskExecutor() {
                    private ExecutorService executor = Executors.newSingleThreadExecutor();

                    @Override
                    public boolean execute(Runnable task) {
                        executor.execute(task);
                        return true;
                    }

                    @Override
                    public void terminate() {
                        executor.shutdownNow();
                    }
                })
                .build();
        cp.addDiscoveryListener(this);
        cp.initialize();
        cp.start();
        cp.search("ssdp:all");
    }

    @ReactMethod
    public void stopListening() {
        Log.d("UPnP", "stopListening");

        cp.removeDiscoveryListener(this);
        cp.stop();
        cp.terminate();
        cp = null;
    }

    @ReactMethod
    public void browse(String udn, String objectId, Promise promise) {
        Device d = servers.get(udn);
        if (d != null) {
            Action browser = d.findAction("Browse");
            Map<String, String> params = new HashMap<String, String>();
            params.put("ObjectID", objectId);
            params.put("BrowseFlag", "BrowseDirectChildren");
            params.put("Filter", "*");
            params.put("StartingIndex", "0");
            params.put("RequestedCount", "0");
            params.put("SortCriteria", "");
            try {
                Map<String, String> response = browser.invokeSync(params, true);
                //Log.d("UPnP", "Browse "+response.get("Result"));
                WritableArray items = parseResults(response.get("Result"));
                promise.resolve(items);
            } catch (IOException e) {
                promise.reject("Failed to UPnP Browse", e);
            }
        } else {
            promise.reject("No UPnP Server found for "+udn);
        }
    }

    @ReactMethod
    public void search(String udn, String containerId, String searchCriteria, String filter, Promise promise) {
        Device d = servers.get(udn);
        if (d != null) {
            Action searcher = d.findAction("Search");
            Map<String, String> params = new HashMap<String, String>();
            params.put("ContainerID", containerId);
            params.put("SearchCriteria", searchCriteria);
            params.put("Filter", filter);
            params.put("StartingIndex", "0");
            params.put("RequestedCount", "0");
            params.put("SortCriteria", "");
            try {
                WritableArray items = Arguments.createArray();
                Map<String, String> response = searcher.invokeSync(params, true);
                String searchResult = response.get("Result");
                //Log.d("UPnP", "Search Response = "+response);
                if (searchResult != null) {
                    items = parseSearchResults(searchResult);
                }
                promise.resolve(items);
            } catch (IOException e) {
                promise.reject("Failed to UPnP Search", e);
            }
        } else {
            promise.reject("No UPnP Server found for "+udn);
        }
    }

    @Override
    public void onDiscover(Device device) {
        Log.d("UPnP", "Discover "+device.getUdn()+" "+device.getFriendlyName()+ " "+device.getDeviceType());

        if (device.getDeviceType().startsWith("urn:schemas-upnp-org:device:MediaServer")) {
            servers.put(device.getUdn(), device);
            WritableMap params = Arguments.createMap();
            params.putString("action", "find");
            params.putString("name", device.getFriendlyName());
            params.putString("udn", device.getUdn());
            params.putString("type", "mediaserver");
            getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit("OnUPnPDiscover", params);
        } else if (device.getDeviceType().startsWith("urn:schemas-upnp-org:device:MediaRenderer")) {
            renderers.put(device.getUdn(), device);
            WritableMap params = Arguments.createMap();
            params.putString("action", "find");
            params.putString("name", device.getFriendlyName());
            params.putString("udn", device.getUdn());
            params.putString("type", "mediarenderer");
            getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit("OnUPnPDiscover", params);
        }
    }

    @Override
    public void onLost(Device device) {
        Log.d("UPnP", "Lost "+device.getUdn()+" "+device.getFriendlyName()+ " "+device.getDeviceType());

        if (device.getDeviceType().startsWith("urn:schemas-upnp-org:device:MediaServer")) {
            servers.remove(device.getUdn());
            WritableMap params = Arguments.createMap();
            params.putString("action", "remove");
            params.putString("name", device.getFriendlyName());
            params.putString("udn", device.getUdn());
            params.putString("type", "mediaserver");
            getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit("OnUPnPDiscover", params);
        } else if (device.getDeviceType().startsWith("urn:schemas-upnp-org:device:MediaRenderer")) {
            renderers.remove(device.getUdn());
            WritableMap params = Arguments.createMap();
            params.putString("action", "remove");
            params.putString("name", device.getFriendlyName());
            params.putString("udn", device.getUdn());
            params.putString("type", "mediarenderer");
            getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit("OnUPnPDiscover", params);
        }
    }

    private WritableArray parseResults(String resultsString) {
        WritableArray items = Arguments.createArray();
        try {
            XmlPullParser parser = Xml.newPullParser();
            parser.setFeature(XmlPullParser.FEATURE_PROCESS_NAMESPACES, false);
            parser.setInput(new StringReader(resultsString));
            int eventType = parser.getEventType();
            String currentText = null;
            String currentTag = null;
            WritableMap item = null;
            while (eventType != XmlPullParser.END_DOCUMENT) {
                if (eventType == XmlPullParser.START_TAG) {
                    currentTag = parser.getName();
                    //Log.d("UPnP", "Start Tag "+parser.getName());
                    if (parser.getName().equals("container") || parser.getName().equals("item")) {
                        if (item != null) {
                            items.pushMap(item);
                        }
                        item = Arguments.createMap();
                        item.putString("albumTitle", "");
                        item.putString("artist", "");
                        item.putString("childCount", "0");
                        item.putString("genre", "");
                        item.putString("date", "");
                        item.putString("trackNumber", "0");
                        item.putString("albumArtURL", "");
                        item.putString("isContainer", "FALSE");
                        for (int i = 0; i < parser.getAttributeCount(); i++) {
                            String name = parser.getAttributeName(i);
                            String value = parser.getAttributeValue(i);
                            //Log.d("UPnP", "Attribute "+parser.getAttributeName(i)+" "+parser.getAttributeValue(i));
                            if (name.equals("id")) {
                                item.putString("objectID", value);
                            } else if (name.equals("parentID")) {
                                item.putString("parentID", value);
                            } else if (name.equals("childCount")) {
                                item.putString("childCount", value);
                                item.putString("isContainer", "TRUE");
                            }
                        }
                    }
                } else if (eventType == XmlPullParser.END_TAG) {
                    //Log.d("UPnP", "End Tag "+parser.getName());
                    String text = currentText;
                    if (text == null) {
                        text = "";
                    }
                    if (parser.getName().equals("dc:title")) {
                        item.putString("title", text);
                    } else if (parser.getName().equals("upnp:class")) {
                        item.putString("class", text);
                    } else if (parser.getName().equals("upnp:genre")) {
                        item.putString("genre", text);
                    } else if (parser.getName().equals("upnp:album")) {
                        item.putString("albumTitle", text);
                    } else if (parser.getName().equals("upnp:artist")) {
                        item.putString("artist", text);
                    } else if (parser.getName().equals("upnp:albumArtURI")) {
                        item.putString("albumArtURL", text);
                    } else if (parser.getName().equals("dc:date")) {
                        item.putString("date", text);
                    } else if (parser.getName().equals("upnp:originalTrackNumber")) {
                        item.putString("trackNumber", text);
                    }
                } else if (eventType == XmlPullParser.TEXT) {
                    currentText = parser.getText();
                    //Log.d("UPnP", "Text "+parser.getText());
                }
                eventType = parser.next();
            }
            items.pushMap(item);
        } catch (XmlPullParserException e) {
           Log.d("UPnP", "Failed to parse item"+e.getLocalizedMessage());
        } catch (IOException e) {
            Log.d("UPnP", "Failed to parse item"+e.getLocalizedMessage());
        }
        return items;
    }

    private WritableArray parseSearchResults(String resultsString) {
        WritableArray items = Arguments.createArray();
        try {
            XmlPullParser parser = Xml.newPullParser();
            parser.setFeature(XmlPullParser.FEATURE_PROCESS_NAMESPACES, false);
            parser.setInput(new StringReader(resultsString));
            int eventType = parser.getEventType();
            String title = null;
            String albumArtURL = null;
            String objectID = null;
            String parentID = null;
            String text = null;
            while (eventType != XmlPullParser.END_DOCUMENT) {
                if (eventType == XmlPullParser.START_TAG) {
                    if (parser.getName().equals("container") || parser.getName().equals("item")) {
                        for (int i = 0; i < parser.getAttributeCount(); i++) {
                            String name = parser.getAttributeName(i);
                            String value = parser.getAttributeValue(i);
                            if (name.equals("id")) {
                                objectID = value;
                            } else if (name.equals("parentID")) {
                                parentID = value;
                            }
                        }
                    }
                } else if (eventType == XmlPullParser.END_TAG) {
                    if (parser.getName().equals("container") || parser.getName().equals("item")) {
                        WritableMap item = Arguments.createMap();
                        item.putString("objectID", objectID);
                        item.putString("parentID", parentID);
                        item.putString("title", title);
                        if (albumArtURL != null) {
                            item.putString("albumArtURL", albumArtURL);
                            items.pushMap(item);
                            albumArtURL = null;
                        }
                    } else if (parser.getName().equals("dc:title")) {
                        title = text;
                    } else if (parser.getName().equals("upnp:albumArtURI")) {
                        albumArtURL = text;
                    }
                } else if (eventType == XmlPullParser.TEXT) {
                    text = parser.getText();
                }
                eventType = parser.next();
            }
        } catch (XmlPullParserException e) {
            Log.d("UPnP", "Failed to parse item"+e.getLocalizedMessage());
        } catch (IOException e) {
            Log.d("UPnP", "Failed to parse item"+e.getLocalizedMessage());
        }
        return items;
    }

}

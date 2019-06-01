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
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.modules.core.PermissionAwareActivity;
import com.facebook.react.modules.core.PermissionListener;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.ByteArrayOutputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.io.UnsupportedEncodingException;
import java.io.File;
import java.net.Socket;
import javax.annotation.Nullable;

import android.Manifest;
import android.content.pm.PackageManager;
import android.support.annotation.NonNull;
import android.util.Base64;
import android.util.Log;
import android.os.Environment;
import android.os.AsyncTask;

public class SocketConnectionModule extends ReactContextBaseJavaModule implements LifecycleEventListener {
    private static final byte[] errPrefix = new byte[] {0x41, 0x43, 0x4b, 0x20, 0x5b};
    private static final byte[] initPrefix = new byte[] {0x4f, 0x4b, 0x20, 0x4d, 0x50, 0x44, 0x20};
    private static final byte[] binaryPrefix = new byte[] {0x62, 0x69, 0x6e, 0x61, 0x72, 0x79, 0x3a, 0x20};
    private String host = null;
    private int port = 0;
    private ReadThread readThread = null;
    private Socket socket = null;
    private PrintWriter pw = null;
    private String albumArtFilename = null;
    private File documentDir = null;

    public SocketConnectionModule(ReactApplicationContext reactContext) {
        super(reactContext);

        if (!isPermissionGranted()) {
            String[] PERMISSIONS = {Manifest.permission.WRITE_EXTERNAL_STORAGE,Manifest.permission.READ_EXTERNAL_STORAGE};
            if (getCurrentActivity() != null) {
                ((PermissionAwareActivity) getCurrentActivity()).requestPermissions(PERMISSIONS, 1, new PermissionListener() {
                    public boolean onRequestPermissionsResult(final int requestCode,
                                                              @NonNull final String[] permissions,
                                                              @NonNull final int[] grantResults) {
                        boolean permissionsGranted = true;
                        for (int i = 0; i < permissions.length; i++) {
                            final boolean granted = grantResults[i] == PackageManager.PERMISSION_GRANTED;
                            permissionsGranted = permissionsGranted && granted;
                        }
                        Log.d("SockectConnection", "permissionsGranted "+permissionsGranted);
                        return permissionsGranted;
                    }
                });
            }
        }
        reactContext.addLifecycleEventListener(this);

        File dir = getReactApplicationContext().getApplicationContext().getExternalFilesDir(Environment.DIRECTORY_PICTURES);
        documentDir = new File(dir, "mpd_album_art");
        if (!documentDir.exists()) {
            boolean created = documentDir.mkdirs();
            if (!created) {
                Log.d("SockectConnection", "failed to create mpd_album_art directory");
            }
        }
    }

    @Override
    public String getName() {
        return "SocketConnection";
    }

    @ReactMethod
    public void connect(String host, int port) {
        this.host = host;
        this.port = port;
        mpdConnect(false);
    }

    @ReactMethod
    public void disconnect() {
        mpdDisconnect();
        host = null;
        port = 0;
    }

    @ReactMethod
    public void writeMessage(String message, String filename) {
        //Log.d("SockectConnection", "writeMessage : "+message);
        if (filename != null) {
            albumArtFilename = filename;
        }
        pw.print(message);
        pw.flush();
    }

    @ReactMethod
    public void deleteAlbumArtFile(String filename) {
        File f = new File(documentDir, filename);
        //Log.d("SockectConnection", "attempting to delete mpd_album_art file : "+f.getAbsolutePath());
        boolean deleted = f.delete();
        if (!deleted) {
            Log.d("SockectConnection", "failed to delete mpd_album_art file : "+f.getAbsolutePath());
        }
    }

    @ReactMethod
    public void listAlbumArtDir(Promise promise) {
        File[] files = documentDir.listFiles();
        WritableArray array = Arguments.createArray();
        for (File f: files) {
            array.pushString(f.getName());
        }
        promise.resolve(array);
    }

    @Override
    public void onHostResume() {
        if (host != null) {
            Log.d("SockectConnection", "resumed");
            sendEvent("OnPauseResume", "msg", "resumed");
            mpdConnect(true);
        }
    }

    @Override
    public void onHostPause() {
        if (socket != null) {
            Log.d("SockectConnection", "paused");
            sendEvent("OnPauseResume", "msg", "paused");
            mpdDisconnect();
        }
    }

    @Override
    public void onHostDestroy() {
    }

    private void sendEvent(String eventName, String id, Exception e) {
        WritableMap params = Arguments.createMap();
        params.putString(id, e.getLocalizedMessage());
        sendEvent(eventName, params);
    }

    private void sendEvent(String eventName, String id, String param) {
        WritableMap params = Arguments.createMap();
        params.putString(id, param);
        sendEvent(eventName, params);
    }

    private void sendEvent(String eventName, @Nullable WritableMap params) {
        getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit(eventName, params);
    }

    private void mpdConnect(boolean internalConnect) {
        Log.d("SockectConnection", "mpdConnect");
        readThread = new ReadThread();
        new Thread(readThread).start();
        WritableMap params = Arguments.createMap();
        params.putString("albumArtDir", documentDir.getAbsolutePath());

        if (internalConnect) {
            params.putString("msg", "internalConnected");
        } else {
            params.putString("msg", "connected");
        }
        sendEvent("OnStateChange", params);
    }

    private void mpdDisconnect() {
        Log.d("SockectConnection", "mpdDisconnect");
        readThread.shutdown();
    }

    private boolean isPermissionGranted() {
        String permission = Manifest.permission.WRITE_EXTERNAL_STORAGE;
        int res = getReactApplicationContext().checkCallingOrSelfPermission(permission);
        return res == PackageManager.PERMISSION_GRANTED;
    }

    public class ReadThread implements Runnable {
        private boolean shutdown = false;
        private InputStream is = null;
        private boolean binaryFound = false;
        private int binaryOffset = 0;
        private int binarySize = 0;
        private String binaryText = null;
        private ByteArrayOutputStream baos = new ByteArrayOutputStream();

        public ReadThread() {}

        public void run() {
            try {
                socket = new Socket(host, port);
                BufferedOutputStream bos = new BufferedOutputStream(socket.getOutputStream());
                pw = new PrintWriter(bos);

                is = new BufferedInputStream(socket.getInputStream());
            } catch (Exception e) {
                Log.d("SockectConnection", "error : "+e.toString());
                sendEvent("OnError", "error", e);
            }
            byte[] bytes = new byte[8192];
            int len;

            Log.d("SockectConnection", "started reading");
            while(!shutdown) {
                try {
                    len = is.read(bytes, 0, 8192);
                    if (len > 0) {
                        baos.write(bytes, 0, len);
                        findBinary();

                        if (findBufferEnd()) {
                            if (binaryFound) {
                                byte[] b = baos.toByteArray();
                                byte[] binaryData = new byte[(int)binarySize];
                                System.arraycopy(b, binaryOffset+1, binaryData, 0, binarySize);
                                String path = writeAlbumArt(binaryData);
                                WritableMap results = Arguments.createMap();
                                binaryText += "\nOK\n";
                                results.putString("data", binaryText);
                                results.putString("filename", path);
                                sendEvent("OnResponse", results);
                                baos.reset();
                                //Log.d("SockectConnection", "binary out ["+binaryData.length+"] ["+binaryText+"]");
                                binaryText = null;
                                binaryFound = false;
                            } else {
                                byte[] b = baos.toByteArray();
                                String out = new String(b, "UTF8");
                                WritableMap results = Arguments.createMap();
                                results.putString("data", out);
                                sendEvent("OnResponse", results);
                                //Log.d("SockectConnection", "out : "+out);
                                baos.reset();
                            }
                        }

                        if (findInit()) {
                            byte[] b = baos.toByteArray();
                            String data = new String(b, "UTF8");
                            WritableMap results = Arguments.createMap();
                            results.putString("data", data);
                            sendEvent("OnInit", results);
                            baos.reset();
                            //Log.d("SockectConnection", "init : "+data);
                        }

                        if (findError()) {
                            byte[] b = baos.toByteArray();
                            String data = new String(b, "UTF8");
                            WritableMap results = Arguments.createMap();
                            results.putString("data", data);
                            sendEvent("OnResponseError", results);
                            baos.reset();
                            //Log.d("SockectConnection", "error : "+data);
                        }
                    }
                } catch (IOException e) {
                    String errMsg = e.getMessage();
                    if (errMsg.equals("Socket closed")) {
                        //sendEvent("OnStateChange", "msg", "disconnected");
                    } else {
                        Log.d("SockectConnection", "error3 : " + e.getLocalizedMessage());
                        sendEvent("OnError", "error", e);
                    }
                }
            }
            Log.d("SockectConnection", "shutting down");
        }

        public void shutdown() {
            Log.d("SockectConnection", "shutdown request");
            try {
                pw.close();
                socket.close();
                socket = null;
            } catch (IOException e) {
                Log.d("SockectConnection", "error2 : "+e.getLocalizedMessage());
                sendEvent("OnError", "error", e);
            }
            shutdown = true;
        }

        private boolean findBinary() {
            if (binaryFound) {
                return true;
            }

            byte[] bytes = baos.toByteArray();
            int location = searchBytes(bytes, binaryPrefix);

            if (location != -1) {
                int crLocation = -1;
                for (int i = location; i < bytes.length; i++) {
                    if (bytes[i] == 0x0a) {
                        crLocation = i;
                        break;
                    }
                }
                if (crLocation != -1) {
                    byte[] textBytes = new byte[crLocation];
                    System.arraycopy(bytes, 0, textBytes, 0, crLocation);
                    try {
                        binaryText = new String(textBytes, "UTF8");
                        binaryFound = true;
                        byte[] sizeBytes = new byte[crLocation - (location+8)];
                        System.arraycopy(bytes, location+8, sizeBytes, 0, crLocation - (location+8));
                        String size = new String(sizeBytes, "UTF8");
                        binarySize = Integer.valueOf(size);
                        binaryOffset = crLocation;
                        //Log.d("SockectConnection", "binary found at "+location+" offset "+binaryOffset+" size "+binarySize);
                    } catch(UnsupportedEncodingException e) {
                        sendEvent("OnError", "error", e);
                    }
                } else {
                    sendEvent("OnError", "error", "cr not found");
                }
                return true;
            } else {
                return false;
            }
        }

        private boolean findInit() {
            byte[] bytes = baos.toByteArray();
            int pos = searchBytes(bytes, initPrefix);
            if (pos != -1) {
                //Log.d("SockectConnection", "init found at "+pos);
                return true;
            } else {
                return false;
            }
        }

        private boolean findError() {
            byte[] bytes = baos.toByteArray();
            int pos = searchBytes(bytes, errPrefix);
            if (pos != -1) {
                //Log.d("SockectConnection", "error found at "+pos);
                return true;
            } else {
                return false;
            }
        }

        private boolean findBufferEnd() {
            byte[] bytes = baos.toByteArray();
            byte b1 = bytes[bytes.length-1];
            byte b2 = bytes[bytes.length-2];
            byte b3 = bytes[bytes.length-3];
            if (b1 == 0x0a && b2 == 0x4b && b3 == 0x4f) {
                if (bytes.length > 3) {
                    byte b4 = bytes[bytes.length-4];
                    if (b4 == 0x0a) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return true;
                }
            } else {
                return false;
            }
        }

        private int searchBytes(byte[] bytes, byte[] searchBytes) {
            for (int i = 0; i < bytes.length - searchBytes.length+1; ++i) {
                boolean found = true;
                for (int j = 0; j < searchBytes.length; ++j) {
                    if (bytes[i+j] != searchBytes[j]) {
                        found = false;
                        break;
                    }
                }
                if (found) return i;
            }
            return -1;
        }

        private String writeAlbumArt(byte[] binaryData) {
            File albumArtFile = new File(documentDir, albumArtFilename);
            if (!albumArtFile.exists()) {
                try {
                    albumArtFile.createNewFile();
                } catch (IOException e) {
                    Log.d("SockectConnection", "failed to create mpd_album_art file "+albumArtFile.getAbsolutePath());
                    return albumArtFile.getAbsolutePath();
                }
            }

            BufferedOutputStream os = null;
            try {
                os = new BufferedOutputStream(new FileOutputStream(albumArtFile, true));
                os.write(binaryData);
                //Log.d("SockectConnection", "written "+binaryData.length+" to "+albumArtFile.getAbsolutePath());
            } catch(IOException e) {
                Log.d("SockectConnection", "exception while writing album art data to : "+albumArtFile.getAbsolutePath()+" "+e.getLocalizedMessage());
            } finally {
                if (os != null) {
                    try {
                        os.close();
                    } catch (IOException e) {}
                }
            }
            return albumArtFile.getAbsolutePath();
        }
    }
}
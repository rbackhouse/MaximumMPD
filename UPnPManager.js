/*
* The MIT License (MIT)
*
* Copyright (c) 2020 Richard Backhouse
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

import { NativeEventEmitter, NativeModules } from 'react-native';
import EventEmitter from "react-native/Libraries/vendor/emitter/EventEmitter";

const { UPnP } = NativeModules;

const emitter = new NativeEventEmitter(UPnP);
const upnpEventEmiiter = new EventEmitter();

class Discoverer {
    constructor() {
        this.mediaservers = {};
        this.mediarenderers = {};
    }

    startListening() {
        this.subscription = emitter.addListener(
            "OnUPnPDiscover",
            (discovered) => {
                if (discovered.type === "mediaserver") {
                    if (discovered.action === "find") {
                        this.mediaservers[discovered.udn] = discovered;
                    } else {
                        delete this.mediaservers[discovered.udn];
                    }
                    upnpEventEmiiter.emit('OnServerDiscover', discovered);
                } else if (discovered.type === "mediarenderer") {
                    if (discovered.action === "find") {
                        this.mediarenderers[discovered.udn] = discovered;
                    } else {
                        delete this.mediarenderers[discovered.udn];
                    }
                    upnpEventEmiiter.emit('OnRendererDiscover', discovered);
                }
            }
        );
        UPnP.startListening();
    }

    stopListening() {
        UPnP.stopListening();
        this.mediaservers = {};
        this.mediarenderers = {};
        this.subscription.remove();
    }

    getServerList() {
        let serverList = [];
        for (let name in this.mediaservers) {
            serverList.push(this.mediaservers[name]);
        }
        return serverList;
    }

    getRendererList() {
        let rendererList = [];
        for (let name in this.mediarenderers) {
            rendererList.push(this.mediarenderers[name]);
        }
        return rendererList;
    }
}

const discoverer = new Discoverer();
discoverer.startListening();

let currentServer;
let currentRenderer;

export default {
    browse: (objectId) => {
        if (currentServer && currentServer.udn) {
            return UPnP.browse(currentServer.udn, objectId);
        } else {
            return Promise.resolve([]);
        }
    },
    search: (containerId, searchCriteria, filter) => {
        if (currentServer && currentServer.udn) {
            return UPnP.search(currentServer.udn, containerId, searchCriteria, filter);
        } else {
            return Promise.resolve([]);
        }
    },
    connectServer: (udn) => {
        if (discoverer.mediaservers[udn]) {
            currentServer = discoverer.mediaservers[udn];
            console.log("currentServer set to "+currentServer.name);
        }
        return currentServer;
    },
    connectRenderer: (udn) => {
        if (discoverer.mediarenderers[udn]) {
            currentRenderer = discoverer.mediarenderers[udn];
        }
    },
    addListener: (event, listener) => {
        return  upnpEventEmiiter.addListener(event, listener);
    },
    getServers: () => {
        return discoverer.getServerList();
    },
    getRenderers: () => {
        return discoverer.getRendererList();
    },
    rescan: () => {
        discoverer.stopListening();
        discoverer.startListening();
    },
    getCurrentServer: () => {
        return currentServer;
    }
}
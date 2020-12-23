/*
* The MIT License (MIT)
*
* Copyright (c) 2018 Richard Backhouse
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

import AsyncStorage from '@react-native-community/async-storage';

import MPDConnection from './MPDConnection';
import EventEmitter from "react-native/Libraries/vendor/emitter/EventEmitter";
import UPnPManager from './UPnPManager';

const albumArtEventEmiiter = new EventEmitter();

const STARTED = 0;
const COMPLETE = 1;
const ERROR = 2;

let albumArt = {};
let artistArt = {};
let loaders = {};

function startLoader(options) {
    for (let id in loaders) {
        //console.log("stopping loader "+id);
        loaders[id].stop = true;
    }
    setTimeout(() => {
        loaders = {};
        const loaderId = ""+Date.now();
        loaders[loaderId] = {stop: false, queueSize: 0};            
        loader(options, loaderId);
    }, 200);
}

async function getAlbumArt(album, options, loaderId) {
    return new Promise(async (resolve, reject) => {
        const songs = await MPDConnection.current().getSongsForAlbum(album.name, album.artist);
        if (songs.length > 0) {
            albumArtEventEmiiter.emit('OnAlbumArtStart', album);
            const key = MPDConnection.current().toAlbumArtFilename(album.artist, album.name);
            await albumArtStorage.updateState(key, STARTED);
            try {
                if (options.useUPnP) {
                    if (UPnPManager.connectServer(options.upnpServer.udn)) {
                        const items = await UPnPManager.search(
                            "0", 
                            "upnp:class derivedfrom \"object.container.album.musicAlbum\" and upnp:artist = \""+album.artist+"\" and dc:title contains \""+album.name+"\"",
                            "dc:title,upnp:albumArtURI"
                        );
                        if (loaders[loaderId].stop) {
                            resolve(false);
                            return;
                        }
                        if (items.length > 0 && items[0].albumArtURL.length > 0) {
                            await MPDConnection.current().albumartFromUPnP(items[0].albumArtURL, album.artist, album.name);
                        } else {
                            throw Error("Empty URL ["+album.artist+"] ["+album.name+"]");
                        }
                    }
                } else if (options.useHTTP) {
                    const host = options.host === "" ? undefined : options.host;
                    await MPDConnection.current().albumartFromURL(songs[0].file, options.port, album.artist, album.name, options.urlPrefix, options.fileName, host);
                } else {
                    await MPDConnection.current().albumart(songs[0].file, album.artist, album.name, (offset, size) => {
                        const percentageDowloaded = Math.round((offset / size) * 100);
                        const sizeInK = Math.round(size / 1024);
                        albumArtEventEmiiter.emit('OnAlbumArtStatus', {album: album, size: sizeInK, percentageDowloaded: percentageDowloaded});
                    });
                }
                albumArt[key] = album.path;
                if (!artistArt[album.artist]) {
                    artistArt[album.artist] = album.path;
                }
                albumArtEventEmiiter.emit('OnAlbumArtEnd', album);
                await albumArtStorage.updateState(key, COMPLETE);
                resolve(!loaders[loaderId].stop);
            } catch (err) {
                console.log(err);
                albumArtEventEmiiter.emit('OnAlbumArtError', {album:album, err: err});
                await albumArtStorage.updateState(key, ERROR);
                if (err.message && err.message === "Album Art error") {
                    resolve(false);
                } else {
                    resolve(!loaders[loaderId].stop);
                }
            }
        } else {
            resolve(!loaders[loaderId].stop);
        }
        if (loaders[loaderId].queueSize === 0) {
            albumArtEventEmiiter.emit('OnAlbumArtComplete', {});
        }
    });
}

const loader = async (options, loaderId) => {
    const isAlbumArtSupported = options.useHTTP || options.useUPnP || MPDConnection.current().isAlbumArtSupported();
    if (options.enabled && MPDConnection.isConnected() && isAlbumArtSupported) {
        //console.log("loader started");
        let albums = [];
        const state = await albumArtStorage.getState();
        const allAlbums = await MPDConnection.current().getAllAlbums();
        const files = await MPDConnection.current().listAlbumArtDir();
        allAlbums.forEach((album) => {
            const key = MPDConnection.current().toAlbumArtFilename(album.artist, album.name);
            const filename = 'albumart_'+key+".png";
            const full = MPDConnection.current().getAlbumArtDir()+'/'+filename;
            album.path = full;

            let add = true;

            if (state[key]) {
                if (state[key] === ERROR) {
                    return;
                }
                add = state[key] === STARTED;
            }

            if (files.includes(filename) && add) {
                MPDConnection.current().deleteAlbumArt(filename);                
            }

            if (add) {
                albums.push(album);
            } else {
                albumArt[key] = full;
                if (files.includes(filename) && !artistArt[album.artist]) {
                    artistArt[album.artist] = full;
                }
            }
        });
        loaders[loaderId].queueSize = albums.length;
        if (loaders[loaderId].queueSize > 0) {
            albums.reduce((p, album, index) => {
                return p.then((continueOn) => {
                    loaders[loaderId].queueSize--;
                    if (loaders[loaderId].queueSize === 0) {
                        //console.log("loader finished");
                        albumArtEventEmiiter.emit('OnAlbumArtComplete', {});
                        delete loaders[loaderId];
                        return Promise.resolve(false);
                    }
                    if (continueOn) {
                        return getAlbumArt(album, options, loaderId);
                    } else {
                        return Promise.resolve(false);
                    }
                });
            }, Promise.resolve(true));
        } else {
            albumArtEventEmiiter.emit('OnAlbumArtComplete', {});
        }
    }
}

const migrate = async () => {
    let missingStr = await AsyncStorage.getItem('@MPD:albumart_missing');
    if (missingStr !== null) {
        let state = {};
        const files = await MPDConnection.current().listAlbumArtDir();
        files.forEach((file) => {
            let key = file;
            key = key.substring('albumart_'.length, key.indexOf('.png'));
            //console.log("file = "+file+" key = "+key);
            state[key] = COMPLETE;
        });
        await AsyncStorage.setItem('@MPD:albumart_state', JSON.stringify(state));
        await AsyncStorage.removeItem('@MPD:albumart_missing');
    }
}

const getMissing = async () => {
    return new Promise(async (resolve, reject) => {
        const allAlbums = await MPDConnection.current().getAllAlbums();
        const state = await albumArtStorage.getState();

        let missing = [];

        allAlbums.forEach((album) => {
            const key = MPDConnection.current().toAlbumArtFilename(album.artist, album.name);
            if (state[key] === ERROR) {
                missing.push(album);
            }
        });

        resolve(missing);
    });

}

const retryMissing = async () => {
    return new Promise(async (resolve, reject) => {
        const loaderId = ""+Date.now();
        loaders[loaderId] = {stop: false, queueSize: 0};        
        const options = await albumArtStorage.getOptions(); 
        const missing = await getMissing();

        if (missing.length > 0) {
            loaders[loaderId].queueSize = missing.length;
            missing.reduce((p, album) => {
                return p.then((continueOn) => {
                    loaders[loaderId].queueSize--;
                    if (continueOn) {
                        return getAlbumArt(album, options, loaderId);
                    } else {
                        return Promise.resolve(false);
                    }
                });
            }, Promise.resolve(true));
        }
        resolve();
    });
}

const onConnect = MPDConnection.getEventEmitter().addListener(
    "OnConnect",
    () => {
        albumArtStorage.isEnabled().then((enabled) => {
            if (enabled === "true") {
                migrate().then(() => {
                    setTimeout(() => {
                        albumArtStorage.getOptions()
                        .then((options) => {
                            startLoader(options);
                        });
                    }, 2000);
                });
            }
        });
    }
);

const onPauseResume = MPDConnection.getEventEmitter().addListener(
    "OnPauseResume",
    (type) => {
        albumArtStorage.isEnabled().then((enabled) => {
            if (enabled === "true") {
                if (type.msg === "paused") {
                    for (let id in loaders) {
                        loaders[id].stop = true;
                    }            
                }
            }
        });
    }
);

const onDisconnect = MPDConnection.getEventEmitter().addListener(
    "OnDisconnect",
    () => {
        for (let id in loaders) {
            loaders[id].stop = true;
        }
    }
);

const onInternalConnect = MPDConnection.getEventEmitter().addListener(
    "OnInternalConnect", 
    () => {
       setTimeout(() => {
            albumArtStorage.getOptions()
            .then((options) => {
                startLoader(options);
            });
        }, 2000);
    }
);

class AlbumArtStorage {
    async enable() {
        await AsyncStorage.setItem('@MPD:albumart_enabled', "true");
        return this.getOptions();
    }

    async disable() {
        AsyncStorage.setItem('@MPD:albumart_enabled', "false");
    }

    async clearCache() {
        AsyncStorage.setItem('@MPD:albumart_state', "{}");
    }

    async getState() {
        let state;

        try {
            let stateStr = await AsyncStorage.getItem('@MPD:albumart_state');

            if (stateStr === null) {
                state = {};
                AsyncStorage.setItem('@MPD:albumart_state', JSON.stringify(state));
            } else {
                state = JSON.parse(stateStr);
            }
        } catch(err) {
            console.log(err);
            state = {};
            AsyncStorage.setItem('@MPD:albumart_state', JSON.stringify(state));
        }
        return state;
    }

    async updateState(key, entry) {
        let state = await this.getState();
        state[key] = entry;
        return AsyncStorage.setItem('@MPD:albumart_state', JSON.stringify(state));
    }

    async isEnabled() {
        let enabled = await AsyncStorage.getItem('@MPD:albumart_enabled');
        if (enabled === null) {
            return "false";
        }
        return enabled;
    }

    async getOptions() {
        let optionsStr = await AsyncStorage.getItem('@MPD:albumart_options');
        let options;
        if (optionsStr === null) {
            options = {useHTTP: false, host: "", port: 8080, urlPrefix: "", fileName: "", useUPnP: false, upnpServer: {name:"", udn: ""}};
            await AsyncStorage.setItem('@MPD:albumart_options', JSON.stringify(options));
        } else {
            options = JSON.parse(optionsStr);
        }

        const enabled = await AsyncStorage.getItem('@MPD:albumart_enabled');
        if (enabled === null) {
            options.enabled = false;
        } else {
            options.enabled = enabled === "true" ? true : false;
        }
        if (!options.urlPrefix) {
            options.urlPrefix = "";
            await AsyncStorage.setItem('@MPD:albumart_options', JSON.stringify(options));
        }
        if (!options.fileName) {
            options.fileName = "";
            await AsyncStorage.setItem('@MPD:albumart_options', JSON.stringify(options));
        }
        if (!options.host) {
            options.host = "";
            await AsyncStorage.setItem('@MPD:albumart_options', JSON.stringify(options));
        }
        if (!options.upnpServer) {
            options.useUPnP = false;
            options.upnpServer = {name:"", udn: ""};
            await AsyncStorage.setItem('@MPD:albumart_options', JSON.stringify(options));
        }
        return options; 
    }

    async setHTTPSPort(port) {
        let optionsStr = await AsyncStorage.getItem('@MPD:albumart_options');
        let options = JSON.parse(optionsStr);
        AsyncStorage.setItem('@MPD:albumart_options', JSON.stringify({
            useHTTP: options.useHTTP, 
            host: options.host, 
            port: port, 
            urlPrefix: options.urlPrefix,
            fileName: options.fileName,
            useUPnP: options.useUPnP,
            upnpServer: options.upnpServer
        }));
    }

    async setHTTPHost(host) {
        let optionsStr = await AsyncStorage.getItem('@MPD:albumart_options');
        let options = JSON.parse(optionsStr);
        AsyncStorage.setItem('@MPD:albumart_options', JSON.stringify({
            useHTTP: options.useHTTP, 
            host: host, 
            port: options.port, 
            urlPrefix: options.urlPrefix, 
            fileName: options.fileName,
            useUPnP: options.useUPnP,
            upnpServer: options.upnpServer
        }));
    }

    async setUseHTTP(useHTTP) {
        let optionsStr = await AsyncStorage.getItem('@MPD:albumart_options');
        let options = JSON.parse(optionsStr);
        AsyncStorage.setItem('@MPD:albumart_options', JSON.stringify({
            useHTTP: useHTTP, 
            host: options.host, 
            port: options.port, 
            urlPrefix: options.urlPrefix, 
            fileName: options.fileName,
            useUPnP: options.useUPnP,
            upnpServer: options.upnpServer
        }));
    }

    async setURLPrefix(urlPrefix) {
        let optionsStr = await AsyncStorage.getItem('@MPD:albumart_options');
        let options = JSON.parse(optionsStr);
        AsyncStorage.setItem('@MPD:albumart_options', JSON.stringify({
            useHTTP: options.useHTTP,
            host: options.host,  
            port: options.port, 
            urlPrefix: urlPrefix, 
            fileName: options.fileName,
            useUPnP: options.useUPnP,
            upnpServer: options.upnpServer
        }));
    }

    async setFileName(fileName) {
        let optionsStr = await AsyncStorage.getItem('@MPD:albumart_options');
        let options = JSON.parse(optionsStr);
        AsyncStorage.setItem('@MPD:albumart_options', JSON.stringify({
            useHTTP: options.useHTTP, 
            host: options.host, 
            port: options.port, 
            urlPrefix: options.urlPrefix, 
            fileName: fileName,
            useUPnP: options.useUPnP,
            upnpServer: options.upnpServer
        }));
    }

    async setUseUPnP(useUPnP) {
        let optionsStr = await AsyncStorage.getItem('@MPD:albumart_options');
        let options = JSON.parse(optionsStr);

        AsyncStorage.setItem('@MPD:albumart_options', JSON.stringify({
            useHTTP: options.useHTTP, 
            host: options.host, 
            port: options.port, 
            urlPrefix: options.urlPrefix, 
            fileName: options.fileName,
            useUPnP: useUPnP,
            upnpServer: options.upnpServer
        }));
    }

    async setUPnPServer(upnpServer) {
        let optionsStr = await AsyncStorage.getItem('@MPD:albumart_options');
        let options = JSON.parse(optionsStr);
        AsyncStorage.setItem('@MPD:albumart_options', JSON.stringify({
            useHTTP: options.useHTTP, 
            host: options.host, 
            port: options.port, 
            urlPrefix: options.urlPrefix, 
            fileName: options.fileName,
            useUPnP: options.useUPnP,
            upnpServer: upnpServer
        }));
    }
}

let albumArtStorage = new AlbumArtStorage();

export default {
    getAlbumArt: (artist, album) => {
        let promise = new Promise((resolve, reject) => {
            albumArtStorage.isEnabled().then((enabled) => {
                if (enabled === "true") {
                    const key = MPDConnection.current().toAlbumArtFilename(artist, album);
                    if (albumArt[key]) {
                        //console.log("path found for ["+artist+"] ["+album+"] ["+albumArt[key]+"]");
                        resolve(albumArt[key]);
                    } else {
                        //console.log("path not found for ["+artist+"] ["+album+"]");
                        resolve();
                    }
                } else {
                    resolve();
                }
            });
        });
        return promise;
    },
    clearCache: () => {
        albumArtStorage.clearCache();
    },
    enable: () => {
        albumArtStorage.enable()
        .then((options) => {
            startLoader(options);
        });
    },
    disable: () => {
        for (let id in loaders) {
            loaders[id].stop = true;
        }
        albumArtStorage.disable();
    },
    isEnabled: () => {
        return albumArtStorage.isEnabled();
    },
    getOptions: () => {
        return albumArtStorage.getOptions();
    },
    setHTTPSPort: (port) => {
        return albumArtStorage.setHTTPSPort(port);
    },
    setUseHTTP: (useHTTP) => {
        return albumArtStorage.setUseHTTP(useHTTP);
    },
    setHTTPHost: (host) => {
        return albumArtStorage.setHTTPHost(host);
    },
    setURLPrefix: (urlPrefix) => {
        return albumArtStorage.setURLPrefix(urlPrefix);
    },
    setFileName: (fileName) => {
        return albumArtStorage.setFileName(fileName);
    },
    setUseUPnP: (useUPnP) => {
        return albumArtStorage.setUseUPnP(useUPnP);
    },
    setUPnPServer: (upnpServer) => {
        return albumArtStorage.setUPnPServer(upnpServer);
    },
    getAlbumArtForArtists: () => {
        let promise = new Promise((resolve, reject) => {
            resolve(artistArt);
        });
        return promise;
    },
    getEventEmitter: () => {
        return albumArtEventEmiiter;
    },
    getQueueSize: () => {
        for (let id in loaders) {
            return loaders[id].queueSize;
        }
    },
    getAlbumArtForAlbums: (albums) => {
        let promise = new Promise((resolve, reject) => {
            albumArtStorage.isEnabled().then((enabled) => {
                if (enabled === "true") {
                    albums.forEach((album) => {
                        const key = MPDConnection.current().toAlbumArtFilename(album.artist, album.name);
                        if (albumArt[key]) {
                            album.imagePath = "file://"+albumArt[key];
                        }
                    });
                }
                resolve(albums);
            });
        });
        return promise;
    },
    getMissing: (albums) => {
        return getMissing();
    },
    reloadAlbumArt: (album, artist) => {
        let promise = new Promise((resolve, reject) => {
            Promise.all([albumArtStorage.getOptions(), albumArtStorage.getState()])
            .then((results) => {
                const options = results[0];
                const state = results[1];
                const key = MPDConnection.current().toAlbumArtFilename(artist, album);
                const filename = 'albumart_'+key+".png";
                const path = MPDConnection.current().getAlbumArtDir()+'/'+filename;
    
                if (state[key] && state[key] === COMPLETE) {
                    MPDConnection.current().deleteAlbumArt(filename);
                }
                const loaderId = ""+Date.now();
                loaders[loaderId] = {stop: false, queueSize: 0};
                getAlbumArt({name: album, artist: artist, path: path}, options, loaderId)
                .then(() => {
                    delete loaders[loaderId];
                });
                resolve();
            });
        });
        return promise;
    },
    retryMissing: () => {
        return retryMissing();
    },
    getState: () => {
        return albumArtStorage.getState();
    }
}

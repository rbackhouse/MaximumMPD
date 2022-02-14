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

import AsyncStorage from '@react-native-async-storage/async-storage';

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
        albumArtEventEmiiter.emit('OnAlbumArtStart', album);
        if (songs.length > 0) {
            const key = MPDConnection.current().toAlbumArtFilename(album.artist, album.name);
            let imageUrl = album.path;
            let entryState = COMPLETE;
            await albumArtStorage.updateState(key, STARTED);
            try {
                if (options.type === "UPnP") {
                    if (UPnPManager.connectServer(options.upnp.udn)) {
                        let url;
                        let items = [];
                        try {
                            items = await UPnPManager.search(
                                "0", 
                                "upnp:class derivedfrom \"object.container.album.musicAlbum\" and upnp:artist = \""+album.artist+"\" and dc:title contains \""+album.name+"\"",
                                "dc:title,upnp:albumArtURI"
                            );
                        } catch (err) {                            
                            console.log("Error searching for album ["+album.artist+"] ["+album.name+"] "+err.message);
                        }
                        if (loaders[loaderId].stop) {
                            resolve(false);
                            return;
                        }
                        if (items.length > 0 && items[0].albumArtURL.length > 0) {
                            url = items[0].albumArtURL;
                        } else {
                            const song = await UPnPManager.search(
                                "0", 
                                "upnp:class derivedfrom \"object.item.audioItem.musicTrack\" and dc:title = \""+songs[0].title+"\" and upnp:artist = \""+songs[0].artist+"\"",
                                "dc:title,upnp:albumArtURI"
                            );
                            if (loaders[loaderId].stop) {
                                resolve(false);
                                return;
                            }    
                            if (song.length > 0 && song[0].albumArtURL.length > 0) {
                                url = song[0].albumArtURL;
                            }
                        }
                        if (url) {                            
                            await MPDConnection.current().albumartFromUPnP(url, album.artist, album.name);
                        } else {
                            throw Error("No URL for ["+album.artist+"] ["+album.name+"]");
                        }
                    } else {
                        throw Error("No UPnP Server found for "+options.upnp.udn);
                    }
                } else if (options.type === 'HTTP') {
                    const host = options.http.host === "" ? undefined : options.http.host;
                    if (options.http.searchForImageFile) {
                        const httpImageUrl = await MPDConnection.current().albumartFromURLWithSearch(songs[0].file, options.http.port, album.artist, album.name, options.http.urlPrefix, !options.http.useAsURL, host);
                        album.path = MPDConnection.current().buildURLPrefix(options.http.port, options.http.urlPrefix, host)+httpImageUrl;
                        imageUrl = album.path;
                        if (options.http.useAsURL) {
                            entryState = httpImageUrl;
                        }
                    } else {
                        await MPDConnection.current().albumartFromURL(songs[0].file, options.http.port, album.artist, album.name, options.http.urlPrefix, options.http.fileName, host);
                    }
                } else if (options.type === 'MPD Embedded') {
                    await MPDConnection.current().binarylimit(options.mpd.binarylimit);
                    await MPDConnection.current().readpicture(songs[0].file, album.artist, album.name, (offset, size) => {
                        const percentageDowloaded = Math.round((offset / size) * 100);
                        const sizeInK = Math.round(size / 1024);
                        albumArtEventEmiiter.emit('OnAlbumArtStatus', {album: album, size: sizeInK, percentageDowloaded: percentageDowloaded});
                    }).catch((err) => {
                        throw Error(err);
                    });
                } else {
                    await MPDConnection.current().binarylimit(options.mpd.binarylimit);
                    await MPDConnection.current().albumart(songs[0].file, album.artist, album.name, (offset, size) => {
                        const percentageDowloaded = Math.round((offset / size) * 100);
                        const sizeInK = Math.round(size / 1024);
                        albumArtEventEmiiter.emit('OnAlbumArtStatus', {album: album, size: sizeInK, percentageDowloaded: percentageDowloaded});
                    });
                }
                albumArt[key] = imageUrl;
                if (!artistArt[album.artist]) {
                    artistArt[album.artist] = imageUrl;
                }
                albumArtEventEmiiter.emit('OnAlbumArtEnd', album);
                await albumArtStorage.updateState(key, entryState);
                resolve(!loaders[loaderId].stop);
            } catch (err) {
                console.log(err);
                await albumArtStorage.updateState(key, ERROR);
                let showAlert = false;
                const errorMessage = err.message || "";
                if (errorMessage === "Album Art error" || errorMessage.indexOf("No UPnP Server found for") === 0) {
                    resolve(false);
                    showAlert = true;
                } else {
                    resolve(!loaders[loaderId].stop);
                }
                albumArtEventEmiiter.emit('OnAlbumArtError', {album:album, err: err, showAlert: showAlert});
            }
        } else {
            albumArtEventEmiiter.emit('OnAlbumArtError', {album:album, err: "No songs found", showAlert: false});
            resolve(!loaders[loaderId].stop);
        }
        if (loaders[loaderId].queueSize === 0) {
            albumArtEventEmiiter.emit('OnAlbumArtComplete', {});
        }
    });
}

const loader = async (options, loaderId) => {
    const isAlbumArtSupported = options.type === "HTTP" || options.type === "UPnP" || MPDConnection.current().isAlbumArtSupported();
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
            let urlPrefix = "file://";
            album.path = urlPrefix+full;
            let imageUrl = urlPrefix+full;
            let add = true;

            if (state[key]) {
                if (state[key] === ERROR) {
                    return;
                }
                if (typeof state[key] === 'string' || state[key] instanceof String) {
                    add = false;
                    const host = options.http.host === "" ? undefined : options.http.host;
                    imageUrl = MPDConnection.current().buildURLPrefix(options.http.port, options.http.urlPrefix, host)+state[key];
                } else {
                    add = state[key] === STARTED;
                }
            }

            if (files.includes(filename) && add) {
                MPDConnection.current().deleteAlbumArt(filename);                
            }

            if (add) {
                albums.push(album);
            } else {
                albumArt[key] = imageUrl;
                if (!artistArt[album.artist]) {
                    artistArt[album.artist] = imageUrl;
                }
            }
        });
        loaders[loaderId].queueSize = albums.length;
        if (loaders[loaderId].queueSize > 0) {
            albums.reduce((p, album, index) => {
                return p.then((continueOn) => {
                    if (loaders[loaderId].queueSize === 0) {
                        //console.log("loader finished");
                        albumArtEventEmiiter.emit('OnAlbumArtComplete', {});
                        delete loaders[loaderId];
                        return Promise.resolve(false);
                    }
                    loaders[loaderId].queueSize--;
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
            options = {
                type: "MPD",
                mpd: {
                    binarylimit: 8192
                },
                http: {
                    host: "", 
                    port: 8080, 
                    urlPrefix: "", 
                    fileName: "",
                    searchForImageFile: false,
                    useAsURL: false
                },                 
                upnp: {
                    name:"", 
                    udn: ""
                }
            };
            await AsyncStorage.setItem('@MPD:albumart_options', JSON.stringify(options));
        } else {
            options = JSON.parse(optionsStr);
            if (options.port !== undefined) {
                let newoptions = {
                    type: "MPD",
                    mpd: {
                        binarylimit: 8192
                    },
                    http: {
                        host: options.host || "", 
                        port: options.port || 8080, 
                        urlPrefix: options.urlPrefix || "", 
                        fileName: options.fileName || "",
                        searchForImageFile: false,
                        useAsURL: false
                    },                 
                    upnp: {
                        name: "", 
                        udn: ""
                    }
                };
                if (options.upnpServer) {
                    newoptions.upnp.name = options.upnpServer.name || "";
                    newoptions.upnp.udn = options.upnpServer.udn || "";
                }
    
                if (options.useHTTP) {
                    newoptions.type = "HTTP";
                } else if (options.useUPnP) {
                    newoptions.type = "UPnP";
                }
                await AsyncStorage.setItem('@MPD:albumart_options', JSON.stringify(newoptions));
                options = newoptions;
            }
        }

        const enabled = await AsyncStorage.getItem('@MPD:albumart_enabled');
        if (enabled === null) {
            options.enabled = false;
        } else {
            options.enabled = enabled === "true" ? true : false;
        }
        return options; 
    }

    async setHTTPPort(port) {
        let optionsStr = await AsyncStorage.getItem('@MPD:albumart_options');
        let options = JSON.parse(optionsStr);
        options.http.port = port;
        AsyncStorage.setItem('@MPD:albumart_options', JSON.stringify(options));
    }

    async setHTTPHost(host) {
        let optionsStr = await AsyncStorage.getItem('@MPD:albumart_options');
        let options = JSON.parse(optionsStr);
        options.http.host = host;
        AsyncStorage.setItem('@MPD:albumart_options', JSON.stringify(options));
    }

    async setType(type) {
        let optionsStr = await AsyncStorage.getItem('@MPD:albumart_options');
        let options = JSON.parse(optionsStr);
        options.type = type;
        AsyncStorage.setItem('@MPD:albumart_options', JSON.stringify(options));
    }

    async setURLPrefix(urlPrefix) {
        let optionsStr = await AsyncStorage.getItem('@MPD:albumart_options');
        let options = JSON.parse(optionsStr);
        options.http.urlPrefix = urlPrefix;
        AsyncStorage.setItem('@MPD:albumart_options', JSON.stringify(options));
    }

    async setFileName(fileName) {
        let optionsStr = await AsyncStorage.getItem('@MPD:albumart_options');
        let options = JSON.parse(optionsStr);
        options.http.fileName = fileName;
        AsyncStorage.setItem('@MPD:albumart_options', JSON.stringify(options));
    }

    async setUPnPServer(upnpServer) {
        let optionsStr = await AsyncStorage.getItem('@MPD:albumart_options');
        let options = JSON.parse(optionsStr);
        options.upnp = upnpServer;
        AsyncStorage.setItem('@MPD:albumart_options', JSON.stringify(options));
    }

    async setBinaryLimit(binarylimit) {
        let optionsStr = await AsyncStorage.getItem('@MPD:albumart_options');
        let options = JSON.parse(optionsStr);
        options.mpd.binarylimit = binarylimit;
        AsyncStorage.setItem('@MPD:albumart_options', JSON.stringify(options));
    }

    async setHTTPSearchForImageFile(value) {
        let optionsStr = await AsyncStorage.getItem('@MPD:albumart_options');
        let options = JSON.parse(optionsStr);
        options.http.searchForImageFile = value;
        AsyncStorage.setItem('@MPD:albumart_options', JSON.stringify(options));
    }

    async setHTTPUseAsURL(value) {
        let optionsStr = await AsyncStorage.getItem('@MPD:albumart_options');
        let options = JSON.parse(optionsStr);
        options.http.useAsURL = value;
        AsyncStorage.setItem('@MPD:albumart_options', JSON.stringify(options));
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
    setHTTPPort: (port) => {
        return albumArtStorage.setHTTPPort(port);
    },
    setType: (type) => {
        return albumArtStorage.setType(type);
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
                            album.imagePath = albumArt[key];
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

                const onAlbumArtEnd = albumArtEventEmiiter.addListener(
                    "OnAlbumArtEnd",
                    (album) => {
                        resolve();
                    }
                );
                const onAlbumArtError = albumArtEventEmiiter.addListener(
                    "OnAlbumArtError",
                    (details) => {
                        reject(details.err);
                    }
                );
                const onAlbumArtComplete = albumArtEventEmiiter.addListener(
                    "OnAlbumArtComplete",
                    () => {
                    }
                );
        
                getAlbumArt({name: album, artist: artist, path: path}, options, loaderId)
                .then(() => {
                    delete loaders[loaderId];
                    onAlbumArtEnd.remove();
                    onAlbumArtComplete.remove();
                    onAlbumArtError.remove();            
                });
            });
        });
        return promise;
    },
    retryMissing: () => {
        return retryMissing();
    },
    getState: () => {
        return albumArtStorage.getState();
    },
    setBinaryLimit: (limit) => {
        albumArtStorage.setBinaryLimit(limit);
    },
    setHTTPSearchForImageFile: (value) => {
        albumArtStorage.setHTTPSearchForImageFile(value);
    },
    setHTTPUseAsURL: (value) => {
        albumArtStorage.setHTTPUseAsURL(value);
    }
}

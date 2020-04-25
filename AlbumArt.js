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

import Base64 from './Base64';
import MPDConnection from './MPDConnection';
import EventEmitter from "react-native/Libraries/vendor/emitter/EventEmitter";

const albumArtEventEmiiter = new EventEmitter();

const STARTED = 0;
const COMPLETE = 1;
const ERROR = 2;

let albumArt = {};
let artistArt = {};
let stop = false;
let queueSize = 0

async function getAlbumArt(album, options) {
    return new Promise(async (resolve, reject) => {
        const songs = await MPDConnection.current().getSongsForAlbum(album.name, album.artist);
        if (songs.length > 0) {
            albumArtEventEmiiter.emit('OnAlbumArtStart', album);
            const key = MPDConnection.current().toAlbumArtFilename(album.artist, album.name);
            await albumArtStorage.updateState(key, STARTED);
            try {
                let path;
                if (options.useHTTP) {
                    path = await MPDConnection.current().albumartFromURL(songs[0].file, options.port, album.artist, album.name);
                } else {
                    path = await MPDConnection.current().albumart(songs[0].file, album.artist, album.name, (offset, size) => {
                        const percentageDowloaded = Math.round((offset / size) * 100);
                        const sizeInK = Math.round(size / 1024);
                        albumArtEventEmiiter.emit('OnAlbumArtStatus', {album: album, size: sizeInK, percentageDowloaded: percentageDowloaded});
                    });
                }
                albumArt[key] = path;
                if (!artistArt[album.artist]) {
                    artistArt[album.artist] = path;
                }
                albumArtEventEmiiter.emit('OnAlbumArtEnd', album);
                await albumArtStorage.updateState(key, COMPLETE);
                resolve(!stop);
            } catch (err) {
                console.log(err);
                albumArtEventEmiiter.emit('OnAlbumArtError', {album:album, err: err});
                await albumArtStorage.updateState(key, ERROR);
                if (err.message && err.message === "Album Art error") {
                    resolve(false);
                } else {
                    resolve(!stop);
                }
            }
        } else {
            resolve(!stop);
        }
    });
}

const loader = async (options) => {
    const isAlbumArtSupported = options.useHTTP || MPDConnection.current().isAlbumArtSupported();
    if (options.enabled && MPDConnection.isConnected() && isAlbumArtSupported) {
        let albums = [];
        const state = await albumArtStorage.getState();
        const allAlbums = await MPDConnection.current().getAllAlbums();
        const files = await MPDConnection.current().listAlbumArtDir();
        allAlbums.forEach((album) => {
            const key = MPDConnection.current().toAlbumArtFilename(album.artist, album.name);
            const filename = 'albumart_'+key+".png";
            const full = MPDConnection.current().getAlbumArtDir()+'/'+filename;

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
        queueSize = albums.length;
        console.log("queueSize = "+queueSize);
        albums.reduce((p, album) => {
            return p.then((continueOn) => {
                queueSize--;
                if (continueOn) {
                    return getAlbumArt(album, options);
                } else {
                    return Promise.resolve(false);
                }
            });
        }, Promise.resolve(true));
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

const onConnect = MPDConnection.getEventEmitter().addListener(
    "OnConnect",
    () => {
        albumArtStorage.isEnabled().then((enabled) => {
            if (enabled === "true") {
                stop = false;
                migrate().then(() => {
                    albumArtStorage.getOptions()
                    .then((options) => {
                        loader(options);
                    });
                });
            }
        });
    }
);

const onPauseResume = MPDConnection.getEventEmitter().addListener(
    "OnPauseResume",
    (type) => {
        console.log("OnPauseResume "+type.msg);
        albumArtStorage.isEnabled().then((enabled) => {
            if (enabled === "true") {
                if (type.msg === "paused") {
                    stop = true;
                }
            }
        });
    }
);

const onDisconnect = MPDConnection.getEventEmitter().addListener(
    "OnDisconnect",
    () => {
        //console.log("Stopping albumart poller");
        stop = true;
    }
);

const onInternalConnect = MPDConnection.getEventEmitter().addListener(
    "OnInternalConnect", 
    () => {
        stop = false;
        setTimeout(() => {
            albumArtStorage.getOptions()
            .then((options) => {
                loader(options);
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
            options = {useHTTP: false, port: 8080};
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
        return options; 
    }

    async setHTTPSPort(port) {
        let optionsStr = await AsyncStorage.getItem('@MPD:albumart_options');
        let options = JSON.parse(optionsStr);
        AsyncStorage.setItem('@MPD:albumart_options', JSON.stringify({useHTTP: options.useHTTP, port: port}));
    }

    async setUseHTTP(useHTTP) {
        let optionsStr = await AsyncStorage.getItem('@MPD:albumart_options');
        let options = JSON.parse(optionsStr);
        AsyncStorage.setItem('@MPD:albumart_options', JSON.stringify({useHTTP: useHTTP, port: options.port}));
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
        stop = false;
        albumArtStorage.enable()
        .then((options) => {
            loader(options);
        });
    },
    disable: () => {
        stop = true;
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
        return queueSize;
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
    }
}

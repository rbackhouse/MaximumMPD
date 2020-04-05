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
            if (options.useHTTP) {
                try {
                    const path = await MPDConnection.current().albumartFromURL(songs[0].file, options.port, album.artist, album.name);
                    albumArt[key] = path;
                    if (!artistArt[album.artist]) {
                        artistArt[album.artist] = path;
                    }
                    albumArtEventEmiiter.emit('OnAlbumArtEnd', album);
                    resolve(!stop);
                } catch (err) {
                    albumArtEventEmiiter.emit('OnAlbumArtError', {album:album, err: err});
                    await albumArtStorage.addMissing(key)
                    resolve(!stop);
                }
            } else {
                try {
                    const path = await MPDConnection.current().albumart(songs[0].file, album.artist, album.name, (offset, size) => {
                        const percentageDowloaded = Math.round((offset / size) * 100);
                        const sizeInK = Math.round(size / 1024);
                        albumArtEventEmiiter.emit('OnAlbumArtStatus', {album: album, size: sizeInK, percentageDowloaded: percentageDowloaded});
                    });
                    albumArt[key] = path.path;
                    if (!artistArt[album.artist]) {
                        artistArt[album.artist] = path.path;
                    }
                    albumArtEventEmiiter.emit('OnAlbumArtEnd', album);
                    resolve(!stop);
                } catch(err) {
                    albumArtEventEmiiter.emit('OnAlbumArtError', {album:album, err: err});
                    if (err === "ACK [50@0] {albumart} No file exists") {
                        await albumArtStorage.addMissing(key)
                    }
                    resolve(!stop);
                }
            }
        } else {
            resolve(!stop);
        }
    });
}

const loader = async (options) => {
    if (options.enabled && MPDConnection.isConnected() && MPDConnection.current().isAlbumArtSupported()) {
        let albums = [];
        const missing = await albumArtStorage.getMissing();
        const allAlbums = await MPDConnection.current().getAllAlbums();
        const files = await MPDConnection.current().listAlbumArtDir();
        allAlbums.forEach((album) => {
            const key = MPDConnection.current().toAlbumArtFilename(album.artist, album.name);
            const filename = 'albumart_'+key+".png";
            if (files.includes(filename)) {
                const full = MPDConnection.current().getAlbumArtDir()+'/'+filename;
                albumArt[key] = full;
                if (!artistArt[album.artist]) {
                    artistArt[album.artist] = full;
                }
            } else {
                if (!missing.includes(key)) {
                    albums.push(album);
                }
            }
        });
        queueSize = albums.length;
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

const onConnect = MPDConnection.getEventEmitter().addListener(
    "OnConnect",
    () => {
        albumArtStorage.isEnabled().then((enabled) => {
            if (enabled === "true") {
                stop = false;
                albumArtStorage.getOptions()
                .then((options) => {
                    loader(options);
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
        AsyncStorage.setItem('@MPD:albumart_missing', "[]");
    }

    async getMissing() {
        let missing;
        try {
            let missingStr = await AsyncStorage.getItem('@MPD:albumart_missing');
            missing = JSON.parse(missingStr);
            if (missing === null) {
                missing = [];
                AsyncStorage.setItem('@MPD:albumart_missing', JSON.stringify(missing));
            }
            //console.log(missing);
        } catch(err) {
            //console.log("missing is not found");
            console.log(err);
            missing = [];
            AsyncStorage.setItem('@MPD:albumart_missing', JSON.stringify(missing));
        }
        return missing;
    }

    async addMissing(missingEntry) {
        let missing = await this.getMissing();
        missing.push(missingEntry);
        return AsyncStorage.setItem('@MPD:albumart_missing', JSON.stringify(missing));
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
        albumArtStorage.isEnabled().then((enabled) => {
            if (enabled === "true") {
                for (let key in albumArt) {
                    const path = albumArt[key];
                    //console.log("deleting path for ["+key+"] ["+path+"]");
                    MPDConnection.current().deleteAlbumArt(path);
                }
            }
        });
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

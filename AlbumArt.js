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

import { AsyncStorage } from 'react-native';

import Base64 from './Base64';
import MPDConnection from './MPDConnection';
import EventEmitter from 'EventEmitter';

const albumArtEventEmiiter = new EventEmitter();

let albums;
let albumArt = {};
let artistArt = {};

const processor = () => {
    if (albums !== undefined && albums.length < 1) {
        albumArtEventEmiiter.emit('OnAlbumArtComplete', albumArt);
        return Promise.resolve(false);
    }

    if (MPDConnection.isConnected() && MPDConnection.isIdle() && MPDConnection.current().isAlbumArtSupported()) {
        const promise = new Promise((resolve, reject) => {
            if (albums === undefined) {
                albums = [];
                MPDConnection.current().getAllAlbums()
                .then((results) => {
                    MPDConnection.current().listAlbumArtDir()
                    .then((files) => {
                        results.forEach((album) => {
                            const key = MPDConnection.current().toAlbumArtFilename(album.artist, album.name);
                            const filename = 'albumart_'+key+".png";
                            if (files.includes(filename)) {
                                const full = MPDConnection.current().getAlbumArtDir()+'/'+filename;
                                console.log("albumart found for ["+album.artist+"] ["+album.name+"] ["+full+"]");
                                albumArt[key] = full;
                                if (!artistArt[album.artist]) {
                                    artistArt[album.artist] = full;
                                }
                            } else {
                                console.log("albumart missing for ["+album.artist+"] ["+album.name+"]");
                                albums.push(album);
                                albumArtEventEmiiter.emit('OnAlbumArtQueue', album);
                            }
                        });
                        resolve(true);
                    });
                });
            } else {
                const album = albums.shift();
                MPDConnection.current().getSongsForAlbum(album.name, album.artist)
                .then((songs) => {
                    if (songs.length > 0) {
                        albumArtEventEmiiter.emit('OnAlbumArtStart', album);
                        console.log("getting path for ["+album.artist+"] ["+album.name+"] ["+songs[0].file+"]");
                        MPDConnection.current().albumart(songs[0].file, album.artist, album.name)
                        .then((path) => {
                            const key = MPDConnection.current().toAlbumArtFilename(album.artist, album.name);
                            console.log("saving path for ["+album.artist+"] ["+album.name+"] ["+path.path+"]");
                            albumArt[key] = path.path;
                            if (!artistArt[album.artist]) {
                                artistArt[album.artist] = path.path;
                            }
                            albumArtEventEmiiter.emit('OnAlbumArtEnd', album);
                            resolve(true);
                        })
                        .catch((err) => {
                            console.log("error getting path for ["+album.artist+"] ["+album.name+"] ["+err+"]");
                            albumArtEventEmiiter.emit('OnAlbumArtError', {album:album, err: err});
                            resolve(true);
                        });
                    } else {
                        console.log("error no songs found for path for ["+album.artist+"] ["+album.name+"]");
                        resolve(true);
                    }
                })
                .catch((err) => {
                    console.log("error getting path for ["+album.artist+"] ["+album.name+"] ["+err+"]");
                    resolve(false);
                });
            }
        });
        return promise;
    } else {
        //albumArtEventEmiiter.emit('OnAlbumArtComplete', albumArt);
        return Promise.resolve(true);
    }
}

const poller = () => {
    processor().then((poll) => {
        if (poll) {
            setTimeout(poller, 3000);
        }
    });
};

const onConnect = MPDConnection.getEventEmitter().addListener(
    "OnConnect",
    () => {
        albumArtStorage.isEnabled().then((enabled) => {
            if (enabled === "true") {
                albums = undefined;
                console.log("Starting albumart poller");
                poller();
            }
        });
    }
);

const onInternalConnect = MPDConnection.getEventEmitter().addListener(
    "OnInternalConnect",
    () => {
        /*
        albumArtStorage.isEnabled().then((enabled) => {
            if (enabled === "true") {
                console.log("Starting albumart poller");
                poller();
            }
        });
        */
    }
);

const onDisconnect = MPDConnection.getEventEmitter().addListener(
    "OnDisconnect",
    () => {
        console.log("Stopping albumart poller");
        albums = [];
    }
);

class AlbumArtStorage {
    async enable() {
        AsyncStorage.setItem('@MPD:albumart_enabled', "true");
    }

    async disable() {
        AsyncStorage.setItem('@MPD:albumart_enabled', "false");
    }

    async isEnabled() {
        let enabled = await AsyncStorage.getItem('@MPD:albumart_enabled');
        if (enabled === null) {
            return "false";
        }
        return enabled;
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
                        console.log("path found for ["+artist+"] ["+album+"] ["+albumArt[key]+"]");
                        resolve(albumArt[key]);
                    } else {
                        console.log("path not found for ["+artist+"] ["+album+"]");
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
                    console.log("deleting path for ["+key+"] ["+path+"]");
                    MPDConnection.current().deleteAlbumArt(path);
                }
            }
        });
    },
    enable: () => {
        poller();
        albumArtStorage.enable();
    },
    disable: () => {
        albums = [];
        albumArtStorage.disable();
    },
    isEnabled: () => {
        return albumArtStorage.isEnabled();
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
    getQueue: () => {
        return albums || [];
    }
}

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

class AlbumArtStorage {
    async getAlbumArt(artist, album) {
        try {
            return await AsyncStorage.getItem('@MPD:albumart_'+encodeURIComponent(artist+album));
        } catch (err) {
            console.log(err);
            return null;
        }
    }

    async getAlbumArtForArtists(artists) {
        try {
            let artMap = {};
            let albumArtArtistsStr = await AsyncStorage.getItem('@MPD:albumart_artists');
            console.log("albumArtArtistsStr = "+albumArtArtistsStr);
            if (albumArtArtistsStr !== null) {
                let albumArtArtists = JSON.parse(albumArtArtistsStr);

                for (let i = 0; i < artists.length; i++) {
                    const artist = artists[i];
                    if (albumArtArtists[artist.name]) {
                        let b64 = await AsyncStorage.getItem('@MPD:albumart_'+albumArtArtists[artist.name]);
                        artMap[artist.name] = b64;
                    }
                }
            }
            return artMap;
        } catch (err) {
            console.log(err);
            return null;
        }
    }

    async setAlbumArt(artist, album, b64) {
        AsyncStorage.setItem('@MPD:albumart_'+encodeURIComponent(artist+album), b64);
        let albumArtArtistsStr = await AsyncStorage.getItem('@MPD:albumart_artists');
        let albumArtArtists;
        if (albumArtArtistsStr === null) {
            albumArtArtists = {};
        } else {
            albumArtArtists = JSON.parse(albumArtArtistsStr);
        }
        if (!albumArtArtists[artist]) {
            albumArtArtists[artist] = encodeURIComponent(artist+album);
            AsyncStorage.setItem('@MPD:albumart_artists', JSON.stringify(albumArtArtists));
        }
    }

    async enable() {
        AsyncStorage.setItem('@MPD:albumart', "true");
    }

    async disable() {
        AsyncStorage.setItem('@MPD:albumart', "false");
    }

    async isEnabled() {
        return await AsyncStorage.getItem('@MPD:albumart');
    }
}

let albumArtStorage = new AlbumArtStorage();

export default {
    getAlbumArt: function(artist, album, songfile) {
        let promise = new Promise((resolve, reject) => {
            albumArtStorage.isEnabled().then((enabled) => {
                if (enabled === "true") {
                    albumArtStorage.getAlbumArt(artist, album)
                    .then((b64) => {
                        if (b64 !== undefined && b64 !== null) {
                            console.log("b64 found for ["+artist+"] ["+album+"] ["+b64.length+"]");
                            if (b64 === "Not Found") {
                                resolve()
                            } else {
                                resolve(b64);
                            }
                        } else if (songfile) {
                            console.log("getting b64 ["+artist+"] ["+album+"] ["+songfile+"]");
                            MPDConnection.current().albumart(songfile)
                            .then((b64) => {
                                console.log("writing b64 for ["+artist+"] ["+album+"] ["+b64.length+"]");
                                albumArtStorage.setAlbumArt(artist, album, b64);
                                resolve(b64);
                            })
                            .catch((err) => {
                                console.log("error b64 for ["+artist+"] ["+album+"] ["+err+"]");
                                //albumArtStorage.setAlbumArt(artist, album, "Not Found");
                                resolve();
                            });
                        } else {
                            console.log("getting b64 ["+artist+"] ["+album+"]");
                            MPDConnection.current().albumArtForAlbum(artist, album)
                            .then((b64) => {
                                console.log("writing b64 for ["+artist+"] ["+album+"] ["+b64.length+"]");
                                albumArtStorage.setAlbumArt(artist, album, b64);
                                resolve(b64);
                            })
                            .catch((err) => {
                                console.log("error b64 for ["+artist+"] ["+album+"] ["+err+"]");
                                //albumArtStorage.setAlbumArt(artist, album, "Not Found");
                                resolve();
                            });
                        }
                    });
                } else {
                    resolve();
                }
            });
        });
        return promise;
    },
    clearCache: function() {
        AsyncStorage.getAllKeys((err, keys) => {
            keys.forEach((key) => {
                if (key.indexOf('@MPD:albumart_') !== -1) {
                    console.log("deleting b64 for ["+key+"]");
                    AsyncStorage.removeItem(key);
                }
            });
        });
    },
    enable: function() {
        albumArtStorage.enable();
    },
    disable: function() {
        albumArtStorage.disable();
    },
    isEnabled: function() {
        return albumArtStorage.isEnabled();
    },
    getAlbumArtForArtists: function(artists) {
        return albumArtStorage.getAlbumArtForArtists(artists);
    }
}

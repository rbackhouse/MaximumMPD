import { AsyncStorage } from 'react-native';

import Base64 from './Base64';
import MPDConnection from './MPDConnection';

class AlbumArtStorage {
    async getAlbumArt(artist, album) {
        try {
            return await AsyncStorage.getItem('@MPD:albumart_'+encodeURIComponent(artist+album));
        } catch (err) {
            return null;
        }
    }

    async setAlbumArt(artist, album, b64) {
        AsyncStorage.setItem('@MPD:albumart_'+encodeURIComponent(artist+album), b64);
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
                            MPDConnection.current().albumart(songfile,
                                (b64) => {
                                    console.log("writing b64 for ["+artist+"] ["+album+"] ["+b64.length+"]");
                                    albumArtStorage.setAlbumArt(artist, album, b64);
                                    resolve(b64);
                                },
                                (err) => {
                                    console.log("error b64 for ["+artist+"] ["+album+"] ["+err+"]");
                                    //albumArtStorage.setAlbumArt(artist, album, "Not Found");
                                    resolve();
                                }
                            )
                        } else {
                            console.log("getting b64 ["+artist+"] ["+album+"]");
                            MPDConnection.current().albumArtForAlbum(artist, album,
                                (b64) => {
                                    console.log("writing b64 for ["+artist+"] ["+album+"] ["+b64.length+"]");
                                    albumArtStorage.setAlbumArt(artist, album, b64);
                                    resolve(b64);
                                },
                                (err) => {
                                    console.log("error b64 for ["+artist+"] ["+album+"] ["+err+"]");
                                    //albumArtStorage.setAlbumArt(artist, album, "Not Found");
                                    resolve();
                                }
                            )
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
                if (key.indexOf('@MPD:albumart') !== -1) {
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
    }
}

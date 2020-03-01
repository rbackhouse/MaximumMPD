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

import AsyncStorage from '@react-native-community/async-storage';

class ConfigStorage {
    async getConfig() {
        let config;
        try {
            const configStr = await AsyncStorage.getItem('@MPD:config');
            if (configStr !== null) {
                config = JSON.parse(configStr);
            } else {
                config = {
                    sortAlbumsByDate: false,
                    randomPlaylistByType: false,
                    maxListSize: 0,
                    autoConnect: false,
                    autoConnectServer: {},
                    useDeviceVolume: true,
                    useGridView: false
                };
                AsyncStorage.setItem('@MPD:config', JSON.stringify(config));
            }
        } catch (err) {

        }
        return config;
    }

    async setConfig(config) {
        try {
            AsyncStorage.setItem('@MPD:config', JSON.stringify(config));
        } catch (err) {

        }
    }
}

const configStorage = new ConfigStorage();

export default {
    isRandomPlaylistByType: () => {
        let promise = new Promise((resolve, reject) => {
            configStorage.getConfig()
            .then((config) => {
                resolve(config.randomPlaylistByType);
            });
        });
        return promise;
    },
    setRandomPlaylistByType: (randomPlaylistByType) => {
        let promise = new Promise((resolve, reject) => {
            configStorage.getConfig()
            .then((config) => {
                config.randomPlaylistByType = randomPlaylistByType;
                configStorage.setConfig(config)
                .then(() => {
                    resolve();
                })
            });
        });
        return promise;
    },
    isSortAlbumsByDate: () => {
        let promise = new Promise((resolve, reject) => {
            configStorage.getConfig()
            .then((config) => {
                resolve(config.sortAlbumsByDate);
            });
        });
        return promise;
    },
    setSortAlbumsByDate: (byDate) => {
        let promise = new Promise((resolve, reject) => {
            configStorage.getConfig()
            .then((config) => {
                config.sortAlbumsByDate = byDate;
                configStorage.setConfig(config)
                .then(() => {
                    resolve();
                })
            });
        });
        return promise;
    },
    isAutoConnect: () => {
        let promise = new Promise((resolve, reject) => {
            configStorage.getConfig()
            .then((config) => {
                resolve({autoConnect: config.autoConnect, server: config.autoConnectServer});
            });
        });
        return promise;
    },
    setAutoConnect: (autoConnect, server) => {
        let promise = new Promise((resolve, reject) => {
            configStorage.getConfig()
            .then((config) => {
                config.autoConnect = autoConnect;
                config.autoConnectServer = server;
                configStorage.setConfig(config)
                .then(() => {
                    resolve();
                })
            });
        });
        return promise;
    },
    getMaxListSize: () => {
        let promise = new Promise((resolve, reject) => {
            configStorage.getConfig()
            .then((config) => {
                resolve(config.maxListSize);
            });
        });
        return promise;
    },
    isUseDeviceVolume: () => {
        let promise = new Promise((resolve, reject) => {
            configStorage.getConfig()
            .then((config) => {
                if (config.useDeviceVolume !== undefined) {
                    resolve(config.useDeviceVolume);
                } else {
                    config.useDeviceVolume = true;
                    configStorage.setConfig(config)
                    .then(() => {
                        resolve(config.useDeviceVolume);
                    });
                }
            });
        });
        return promise;
    },
    setUseDeviceVolume: (useDeviceVolume) => {
        let promise = new Promise((resolve, reject) => {
            configStorage.getConfig()
            .then((config) => {
                config.useDeviceVolume = useDeviceVolume;
                configStorage.setConfig(config)
                .then(() => {
                    resolve();
                })
            });
        });
        return promise;
    },
    isUseGrdiView: () => {
        let promise = new Promise((resolve, reject) => {
            configStorage.getConfig()
            .then((config) => {
                if (config.useGridView !== undefined) {
                    resolve(config.useGridView);
                } else {
                    config.useGridView = false;
                    configStorage.setConfig(config)
                    .then(() => {
                        resolve(config.useGridView);
                    });
                }
            });
        });
        return promise;
    },
    setUseGridView: (useGridView) => {
        let promise = new Promise((resolve, reject) => {
            configStorage.getConfig()
            .then((config) => {
                config.useGridView = useGridView;
                configStorage.setConfig(config)
                .then(() => {
                    resolve();
                })
            });
        });
        return promise;
    }
}

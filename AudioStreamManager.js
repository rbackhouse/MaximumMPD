/*
* The MIT License (MIT)
*
* Copyright (c) 2021 Richard Backhouse
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

const { AudioStreamer } = NativeModules;

const emitter = new NativeEventEmitter(AudioStreamer);
let currentQueue = {};

export default {
    addSong: (item) => {
        if (item.resources[0] && item.resources[0].resourceURLString) {
            let song = {
                url: item.resources[0].resourceURLString,
                title: item.title,
                albumArtURL: item.albumArtURL,
                artist: item.artist,
                album: item.albumTitle,
                trackNumber: item.trackNumber,
                duration:  item.resources[0].duration,
                bitrate: item.resources[0].bitrate
            }
            song.id = AudioStreamer.addSong(song.url);
            currentQueue[song.id] = song;
        }
    },
    removeSong: (url) => {
        AudioStreamer.removeSong(url);
    },
    play: () => {
        AudioStreamer.play();
    },
    pause: () => {
        AudioStreamer.pause();
    },
    next: () => {
        AudioStreamer.next();
    },
    getQueue: () => {
        let promise = new Promise((resolve, reject) => {
            AudioStreamer.getQueue()
            .then((urls) => {
                let queue = []
                urls.forEach((url) => {
                    if (currentQueue[url]) {
                        queue.push(currentQueue[url]);
                    }
                });
                resolve(queue);
            });
        });
        return promise;
    },
    clearQueue: () => {
        AudioStreamer.clearQueue();
    },
    addListener: (eventName, listener) => {
        return emitter.addListener(eventName, listener);
    }
}
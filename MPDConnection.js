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

import Base64 from './Base64';
import EventEmitter from "react-native/Libraries/vendor/emitter/EventEmitter";

import { NativeEventEmitter, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import Config from './Config';

const { SocketConnection } = NativeModules;
const { BonjourListener } = NativeModules;
const { NowPlayingControl } = NativeModules;

const socketConnectionEmitter = new NativeEventEmitter(SocketConnection);
const bonjourListenerEmitter = new NativeEventEmitter(BonjourListener);
const nowPlayingEmitter = new NativeEventEmitter(NowPlayingControl);

const mpdEventEmiiter = new EventEmitter();

const ARTIST_PREFIX = "Artist: ";
const ALBUM_PREFIX = "Album: ";
const ALBUM_PREFIX_NO_SPACE = "Album:";
const TITLE_PREFIX = "Title: ";
const TRACK_PREFIX = "Track: ";
const FILE_PREFIX = "file: ";
const TIME_PREFIX = "Time: ";
const ID_PREFIX = "Id: ";
const POS_PREFIX = "Pos: ";
const DIR_PREFIX = "directory: ";
const PLAYLIST_PREFIX = "playlist: ";
const OUTPUTID_PREFIX = "outputid: ";
const OUTPUTNAME_PREFIX = "outputname: ";
const OUTPUTENABLED_PREFIX = "outputenabled: ";
const SUFFIX_PREFIX = "suffix: ";
const REPLAY_GAIN_MODE = "replay_gain_mode: ";
const SIZE_PREFIX = "size: ";
const BINARY_PREFIX = "binary: ";
const BITRATE_PREFIX = "bitrate: ";
const AUDIO_PREFIX = "audio: ";
const GENRE_PREFIX = "Genre: ";
const ALBUMARTIST_PREFIX = "AlbumArtist: ";
const DATE_PREFIX = "Date: ";
const NAME_PREFIX = "Name: ";
const DURATION_PREFIX = "duration: ";
const SONGS_PREFIX = "songs: ";
const COMMENT_PREFIX = "comment: ";
const PERFORMER_PREFIX = "performer: ";
const COMPOSER_PREFIX = "composer: ";

const INITIAL = 0;
const WRITTEN = 1;
const READING = 2;
const COMPLETE = 3;

Config.isUseNowPlayingControl()
.then((value) => {
    if (value === true) {
        NowPlayingControl.start();
    }
});

class Discoverer {
    constructor() {
        this.discovered = {};
    }

    startListening() {
        this.subscription = bonjourListenerEmitter.addListener(
            "OnDiscover",
            (discovered) => {
                console.log("Discovered : "+JSON.stringify(discovered));
                if (discovered.type === "add") {
                    if (discovered.name) {
                        if (connection && connection.isConnected) {
                            if (discovered.name === connection.name &&
                                discovered.ipAddress === connection.host &&
                                discovered.port === connection.port) {
                                discovered.stats = connection.stats;
                            }
                        }
                        this.discovered[discovered.name] = discovered;

                        mpdEventEmiiter.emit('OnDiscover', discovered);
                    }
                } else if (discovered.type === "remove") {
                    if (discovered.name) {
                        delete this.discovered[discovered.name];
                        mpdEventEmiiter.emit('OnDiscover', discovered);
                    }
                } else if (discovered.type === "discover") {
                    //console.log("Discovered : "+discovered.name);
                }
            }
        );
        BonjourListener.listen('_mpd._tcp.', 'local.');
    }

    stopListening() {
        this.subscription.remove();
        BonjourListener.stopListening();
    }

    getDiscoveredList() {
        let discoveredList = [];
        for (let name in this.discovered) {
            discoveredList.push(this.discovered[name]);
        }
        if (connection && connection.isConnected) {
            discoveredList.forEach((c) => {
                if (c.name === connection.name &&
                    c.ipAddress === connection.host &&
                    c.port === connection.port) {
                    c.stats = connection.stats;
                }
            });
        }

        return discoveredList;
    }
}

const discoverer = new Discoverer();
discoverer.startListening();

class MPDConnection {
	constructor(name, host, port) {
        this.name = name;
        this.host = host;
		this.port = port;
		this.queue = [];
		this.isConnected = false;
	}

	connect(pwd, callback, noemit) {
        this.pwd = pwd;
        this.stateSubscription = socketConnectionEmitter.addListener(
            "OnStateChange",
            (status) => {
                let state = status.msg;
                if (state == "connected") {
                    this.albumArtDir = status.albumArtDir;
    				this.queue = [];
    				this.isConnected = true;
                    if (pwd) {
                        this.login(pwd)
                        .then(() => {
                        })
                        .catch((err) => {
                            callback(err);
                        });
                    }
                    this.startEmittingStatus(30000);
                    if (!noemit) {
                        mpdEventEmiiter.emit('OnConnect', {host: this.host, port: this.port});
                        console.log("Connected");
                    }
                    this._loadFileSuffixes();
                    this.getStats((stats) => {
                        this.stats = {};
                        this.stats.numberOfSongs = parseInt(stats["songs"]);
                        this.stats.numberOfArtists = parseInt(stats["artists"]);
                        this.stats.numberOfAlbums = parseInt(stats["albums"]);
                        if (callback) {
                            callback();
                        }
                    });
                    AsyncStorage.getItem('@MPD:'+this.host+'_'+this.port+'_autoplaysong')
                    .then((autoplaysong) => {
                        if (autoplaysong !== null) {
                            this.autoplaysong = JSON.parse(autoplaysong);
                        }
                    });
    			} else if (state == "internalConnected") {
                    this.albumArtDir = status.albumArtDir;
    				this.queue = [];
    				this.isConnected = true;
                    if (pwd) {
                        this.login(pwd).then(() => {}).catch((err) => {});
                    }
                    console.log("Internal Connected");
                    mpdEventEmiiter.emit('OnInternalConnect', {host: this.host, port: this.port});
    			} else if (state == "disconnected") {
                    //mpdEventEmiiter.emit('OnDisconnect', {host: this.host, port: this.port});
                    this.stopEmittingStatus();
                    this.disconnect();
                    //connection = undefined;
    				//console.log("Disconnected");
    				this.connect(undefined, undefined, false);
    			}
            }
        )

        this.errorSubscription = socketConnectionEmitter.addListener(
            "OnError",
            (errorDetails) => {
                let error = errorDetails.error;
                this.isConnected = false;
				console.log("Connection error : "+error);
				if (this.queue.length > 0) {
					var task = this.queue[0];
					task.error = error;
					task.state = MPDConnection.COMPLETE;
				}
				if (error === "Error: read ETIMEDOUT") {
					this.connect();
				} else if (callback) {
					callback(error);
				}
            }
        );

		var data = "";

        this.responseSubscription = socketConnectionEmitter.addListener(
            "OnResponse",
            (response) => {
                if (this.queue.length > 0) {
                    var task = this.queue.shift();
                    task.response += response.data.substring(0, response.data.length - 4);
                    task.state = MPDConnection.COMPLETE;
                    //console.log("cmd ["+task.cmd+"] complete");
                    var result;
                    if (task.process) {
                        try {
                            result = task.process(task.response, response.filename);
                        } catch(err) {
                            if (task.errorcb) {
                                task.errorcb(err);
                            }
                            console.log("Error running task ["+task.cmd+"] : "+err);
                        }
                    }
                    if (task.cb) {
                        task.cb(result);
                    }
                    processQueue();
                }
            }
        );

        this.initSubscription = socketConnectionEmitter.addListener(
            "OnInit",
            (init) => {
                let versionString = init.data.substring("OK MPD ".length);
                console.log(versionString);
                let split = versionString.split(".");
                this.version = parseInt(split[1]);
                this.minorVersion = parseInt(split[2]);
                /*
                console.log("version: "+this.version+" minorVersion: "+this.minorVersion);
                if (this.version < 21 && this.minorVersion === 0) {
                    console.log("old protocol");
                } else {
                    console.log("new protocol");
                }
                */
            }
        );

        this.errorSubscription = socketConnectionEmitter.addListener(
            "OnResponseError",
            (error) => {
                if (this.queue.length > 0) {
                    var task = this.queue.shift();
                    task.error = error.data.trim();
                    task.state = MPDConnection.COMPLETE;
                    if (task.errorcb) {
                        task.errorcb(task.error);
                    }
                    console.log("Error running task ["+task.cmd+"] : "+task.error);
                } else {
                    console.log("Error : "+error);
                }
            }
        );

        this.timeoutSubscription = socketConnectionEmitter.addListener(
            "OnTimeout",
            (timeout) => {
                if (callback) {
                    callback("timeout");
                }
            }
        );

        this.pauseResumeSubscription = socketConnectionEmitter.addListener(
            "OnPauseResume",
            (msg) => {
                mpdEventEmiiter.emit('OnPauseResume', msg);
            }
        );

        this.nowPlayingSubscription = nowPlayingEmitter.addListener(
            "OnNowPlayingEvent",
            (event) => {
                switch (event.type) {
                    case "play":
                        this.play(undefined, true);
                        break;
                    case "pause":
                        this.pause(true);
                        break;
                    case "stop":
                        this.stop();
                        break;
                    case "previous":
                        this.previous();
                        break;
                    case "next":
                        this.next();
                        break;
                    case "next":
                        this.next();
                        break;
                    case "playpause":
                        if (this.currentstatus.state === "play") {
                            this.pause(true);
                        } else if (this.currentstatus.state === "pause") {
                            this.play(undefined, true);
                        }
                        break;
                }
            }
        );

		SocketConnection.connect(this.host, this.port);

		let processQueue = () => {
			if (this.isConnected && this.queue.length > 0) {
				if (this.queue[0].state === MPDConnection.INITIAL) {
					//console.log("cmd ["+this.queue[0].cmd+"] started");
                    if (this.queue[0].filename) {
                        SocketConnection.writeMessage(this.queue[0].cmd+"\n", this.queue[0].filename);
                    } else {
                        SocketConnection.writeMessage(this.queue[0].cmd+"\n", null);
                    }
					this.queue[0].state = MPDConnection.WRITTEN;
					this.queue[0].count = 0;
				}
				if (this.queue[0].count > 360) {
					var task = this.queue.shift();
					if (task.errorcb) {
						task.errorcb("Timeout on "+task.cmd);
					}
					console.log("Timeout on "+task.cmd);
				} else {
					this.queue[0].count++;
				}
			}
		};

		let poller = () => {
			processQueue();
			setTimeout(poller, 500);
		};
		poller();
	}

	disconnect() {
        mpdEventEmiiter.emit('OnDisconnect', {host: this.host, port: this.port});
        this.stateSubscription.remove();
        this.errorSubscription.remove();
        this.responseSubscription.remove();
        this.initSubscription.remove();
        this.timeoutSubscription.remove();
        this.nowPlayingSubscription.remove();
        this.pauseResumeSubscription.remove();
		this.isConnected = false;
		SocketConnection.disconnect();
	}

    startEmittingStatus(timeout) {
        this.stopEmittingStatus();
        this.intervalId = setInterval(() => {
            if (this.isConnected) {
                this.getStatus((status) => {
                    this.repeatValue = status.repeat;
                    this.consumeValue = status.consume;
                    if (this.autoplaysong && this.autoplaysong.song !== status.currentsong.b64file) {
                        status.reloadqueue = true;
                        let restorecmd = "command_list_begin\n";
                        restorecmd += "clear\n";
                        if (this.autoplaysong.saved) {
                            restorecmd += "load __playlist_to_restore\n";
                            restorecmd += "rm __playlist_to_restore\n";
                        }
                        restorecmd += "command_list_end";
                        this.createPromise(restorecmd)
                        .then(() => {
                            mpdEventEmiiter.emit('OnStatus', status);
                        })
                        .catch((err) => {
                            mpdEventEmiiter.emit('OnStatus', status);
                        });
                        Promise.all([this.repeat((this.autoplaysong.repeat === '1') ? true : false), this.consume((this.autoplaysong.consume === '1') ? true : false)]);
                        this.autoplaysong = undefined;
                        AsyncStorage.removeItem('@MPD:'+this.host+'_'+this.port+'_autoplaysong');
                    } else {
                        mpdEventEmiiter.emit('OnStatus', status);
                    }
                });
            }
        }, timeout);
    }

    stopEmittingStatus() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
        }
    }

	toBase64(value) {
		try {
			return Base64.btoa(encodeURIComponent(value));
		} catch(err) {
			console.log(err);
			return "";
		}
	}

	decode(uri) {
		return decodeURIComponent(uri);
	}

    createPromise(cmd, processor, filename) {
        const promise = new Promise((resolve, reject) => {
            this.queue.push({
                cmd: cmd,
    			process: processor,
    			cb: (result) => {
                    resolve(result);
                },
    			errorcb: (err) => {
                    reject(err);
                },
    			response: "",
    			state: INITIAL,
                filename: filename
    		});
        });
        return promise;
    }

    search(filter, start, end) {
        const processor = (data) => {
			const lines = MPDConnection._lineSplit(data);
			let songs = [];
            let song;
			lines.forEach((line) => {
                if (line.indexOf(ARTIST_PREFIX) === 0) {
					song.artist = line.substring(ARTIST_PREFIX.length);
				} else if (line.indexOf(ALBUM_PREFIX) === 0) {
					song.album = line.substring(ALBUM_PREFIX.length);
				} else if (line.indexOf(TITLE_PREFIX) === 0) {
					song.title = line.substring(TITLE_PREFIX.length);
				} else if (line.indexOf(TRACK_PREFIX) === 0) {
					song.track = line.substring(TRACK_PREFIX.length);
				} else if (line.indexOf(TIME_PREFIX) === 0) {
					song.time = MPDConnection._convertTime(line.substring(TIME_PREFIX.length));
				} else if (line.indexOf(DURATION_PREFIX) === 0) {
					song.duration = MPDConnection._convertTime(line.substring(DURATION_PREFIX.length));
				} else if (line.indexOf(FILE_PREFIX) === 0) {
					song = {};
					songs.push(song);
					const file = line.substring(FILE_PREFIX.length);
					song.file = file;
					song.b64file = this.toBase64(file);
				}
            });
            songs.forEach((song) => {
                if (song.duration) {
                    song.time = song.duration;
                    song.duration = undefined;
                }
            });
			return songs;
		};
        let searchCmd = "search any \""+filter+"\"";
        if (this.version > 19) {
            searchCmd += " window "+start+":"+end;
        }
        return this.createPromise(searchCmd, processor);
    }

    getAllArtists(filter) {
		const processor = (data) => {
			const lines = MPDConnection._lineSplit(data);
			let artists = [];
            lines.forEach((line) => {
				let name = line.substring(ARTIST_PREFIX.length);
				if (name && name.trim().length > 0) {
					if (filter) {
						if (name.toLowerCase().indexOf(filter.toLowerCase()) === 0) {
							artists.push({name: name});
						}
					} else {
						artists.push({name: name});
					}
				}
			});
			artists.sort((a,b) => {
                let artist1 = a.name;
                let artist2 = b.name;
                let split = artist1.split(' ');
                if (split.length > 1 && split[0].toLowerCase() === "the" && split[1].toLowerCase() !== "the") {
                    split.shift();
                    artist1 = split.join(' ');
                }
                split = artist2.split(' ');
                if (split.length > 1 && split[0].toLowerCase() === "the" && split[1].toLowerCase() !== "the") {
                    split.shift();
                    artist2 = split.join(' ');
                }
				if (artist1 < artist2) {
					return -1;
				} else if (artist1 > artist2) {
					return 1;
				} else {
					return 0;
				}
			});
			return artists;
		};
        return this.createPromise("list artist", processor);
	}

	getAllAlbums(useAlbumArtist, sortByArtist) {
		const processor = (data) => {
			const lines = MPDConnection._lineSplit(data);
			let albums = [];
            let album;
            let currentArtist;

            lines.forEach((line) => {
				if (line.indexOf(ARTIST_PREFIX) === 0) {
					let artist = line.substring(ARTIST_PREFIX.length);
					if (artist && artist.trim().length > 0) {
                        if (this.version < 21 && this.minorVersion === 0) {
                            album.artist = artist;
                            if (album.name && album.artist) {
        						albums.push({artist: album.artist, name: album.name});
                            }
                        } else {
                            currentArtist = artist;
                        }
					}
                } else if (line.indexOf(ALBUMARTIST_PREFIX) === 0) {
					let artist = line.substring(ALBUMARTIST_PREFIX.length);
					if (artist && artist.trim().length > 0) {
                        if (this.version < 21 && this.minorVersion === 0) {
                            album.artist = artist;
                            if (album.name && album.artist) {
        						albums.push({artist: album.artist, name: album.name});
                            }
                        } else {
                            currentArtist = artist;
                        }
					}
                } else if (line.indexOf(ALBUM_PREFIX_NO_SPACE) === 0) {
                    if (this.version < 21 && this.minorVersion === 0) {
                        album = {};
                    }
					let name = line.substring(ALBUM_PREFIX_NO_SPACE.length);
					if (name && name.trim().length > 0) {
                        name = name.trim();
                        if (this.version < 21 && this.minorVersion === 0) {
                            album.name = name;
                        } else {
                            albums.push({name: name, artist: currentArtist});
                        }
					}
				}
			});
			albums.sort((a,b) => {
                comp1 = a.name;
                comp2 = b.name;
                if (sortByArtist && a.artist && b.artist) {
                    comp1 = a.artist;
                    comp2 = b.artist;
                }
                if (comp1 < comp2) {
                    return -1;
                } else if (comp1 > comp2) {
                    return 1;
                } else {
                    return 0;
                }    
			});
			return albums;
        };
        let cmd = "list album group ";
        if (useAlbumArtist) {
            cmd += "albumartist";
        } else {
            cmd += "artist";
        }
        return this.createPromise(cmd, processor);
	}

	getStatus(cb, errorcb) {
		var processor = function(data) {
			var lines = MPDConnection._lineSplit(data);
			var status = {};
			var currentsong = {};
			var line;
			for (var i = 0; i < lines.length; i++) {
				line = lines[i];
				if (line.indexOf(TITLE_PREFIX) === 0) {
					currentsong.title = lines[i].substring(TITLE_PREFIX.length);
				} else if (line.indexOf(ARTIST_PREFIX) === 0) {
					currentsong.artist = lines[i].substring(ARTIST_PREFIX.length);
				} else if (line.indexOf(ALBUM_PREFIX) === 0) {
					currentsong.album = lines[i].substring(ALBUM_PREFIX.length);
				} else if (line.indexOf(REPLAY_GAIN_MODE) === 0) {
					status.replayGainStatus = (line.substring(REPLAY_GAIN_MODE.length));
                } else if (line.indexOf(BITRATE_PREFIX) === 0) {
                    status.bitrate = (line.substring(BITRATE_PREFIX.length));
                } else if (line.indexOf(AUDIO_PREFIX) === 0) {
                    status.audio = (line.substring(AUDIO_PREFIX.length));
                } else if (line.indexOf(FILE_PREFIX) === 0) {
					var file = line.substring(FILE_PREFIX.length);
					currentsong.file = file;
					currentsong.b64file = this.toBase64(file);
				} else if (line.indexOf(NAME_PREFIX) === 0) {
                    currentsong.name = line.substring(NAME_PREFIX.length);
				} else if (line.indexOf(DATE_PREFIX) === 0) {
                    currentsong.date = line.substring(DATE_PREFIX.length);
				} else {
					var key = line.substring(0, line.indexOf(':'));
					var value = line.substring(line.indexOf(':')+2);
					status[key] = value;
				}
			}
            status.currentsong = currentsong;
            this.currentstatus = status;
            if (status.elapsed) {
                this.updateNowPlaying(status.state);
            }            
			return status;
		}.bind(this);
		var cmd = "command_list_begin\n";
		cmd += "status\n";
		cmd += "currentsong\n";
		cmd += "replay_gain_status\n";
		cmd += "command_list_end";
		this.queue.push({
			cmd: cmd,
			process: processor,
			cb: cb,
			errorcb: errorcb,
			response: "",
			state: INITIAL
		});
	}

	getStats(cb, errorcb) {
		var processor = function(data) {
			var lines = MPDConnection._lineSplit(data);
			var stats = {};
			var line;
			for (var i = 0; i < lines.length; i++) {
				line = lines[i];
				var key = line.substring(0, line.indexOf(':'));
				var value = line.substring(line.indexOf(':')+2);
				stats[key] = value;
			}
			return stats;
		}.bind(this);
		this.queue.push({
			cmd: "stats",
			process: processor,
			cb: cb,
			errorcb: errorcb,
			response: "",
			state: INITIAL
		});
	}

	getCurrentSong(cb, errorcb) {
		var processor = function(data) {
			var lines = MPDConnection._lineSplit(data);
			var currentsong = {};
			for (var i = 0; i < lines.length; i++) {
				var line = lines[i];
				if (line.indexOf(TITLE_PREFIX) === 0) {
					currentsong.title = lines[i].substring(TITLE_PREFIX.length);
				} else if (line.indexOf(ARTIST_PREFIX) === 0) {
					currentsong.artist = lines[i].substring(ARTIST_PREFIX.length);
				} else if (line.indexOf(ALBUM_PREFIX) === 0) {
					currentsong.album = lines[i].substring(ALBUM_PREFIX.length);
				}
			}
			return currentsong;
		}.bind(this);
		this.queue.push({
			cmd: "currentsong",
			process: processor,
			errorcb: errorcb,
			cb: cb,
			response: "",
			state: INITIAL
		});
	}

	getAlbumsForArtist(artist, sortAlbumsByDate) {
		const processor = (data) => {
			const lines = MPDConnection._lineSplit(data);
			let albums = [];
            let album;
            let currentDate;
            lines.forEach((line) => {
                if (line.indexOf(ALBUM_PREFIX) === 0) {
                    if (this.version < 21 && this.minorVersion === 0) {
                        if (album) {
                            albums.push({name: album.name, artist: artist});
                        }
                        album = {};
                    }
    				let name = line.substring(ALBUM_PREFIX.length);
    				if (name && name.trim().length > 0) {
                        if (this.version < 21 && this.minorVersion === 0) {
                            album.name = name;
                        } else {
                            const date = currentDate;
                            //const date = currentDate || "Unknown";
                            albums.push({name: name, artist: artist, date: date});
                        }
    				}
                } else if (line.indexOf(DATE_PREFIX) === 0) {
                    const date = line.substring(DATE_PREFIX.length);
                    if (date && date.trim().length > 0) {
                        if (this.version < 21 && this.minorVersion === 0) {
                            album.date = date;
                            if (album.name && album.date) {
        						albums.push({name: album.name, artist: artist, date: album.date});
                                album = undefined;
                            }
                        } else {
                            currentDate = date;
                        }
                    }
                }
			});
            if (this.version < 21 && this.minorVersion === 0) {
                if (album && album.name) {
                    albums.push({name: album.name, artist: artist});
                }
            }
			albums.sort((a,b) => {
                if (sortAlbumsByDate) {
                    let d1;
                    let d2;
                    try {
                        d1 = a.date ? parseInt(a.date) : 100000;
                    } catch(err) {
                        d1 = 100000;
                    }
                    try {
                        d2 = b.date ? parseInt(b.date) : 100000;
                    } catch(err) {
                        d2 = 100000;
                    }
                    if (d1 < d2) {
    					return -1;
    				} else if (d1 > d2) {
    					return 1;
    				} else {
    					return 0;
    				}
                } else {
    				if (a.name < b.name) {
    					return -1;
    				} else if (a.name > b.name) {
    					return 1;
    				} else {
    					return 0;
    				}
                }
			});
			return albums;
		};
        let cmd = "list album artist \""+artist+"\"";
        if (sortAlbumsByDate) {
            cmd += " group date";
        }
        return this.createPromise(cmd, processor);
	}

	getSongsForAlbum(album, artist) {
		const processor = (data) => {
			const lines = MPDConnection._lineSplit(data);
			let songs = [];
			let song;
            lines.forEach((line) => {
				if (line.indexOf(TITLE_PREFIX) === 0) {
					song.title = line.substring(TITLE_PREFIX.length);
				} else if (line.indexOf(TRACK_PREFIX) === 0) {
					song.track = line.substring(TRACK_PREFIX.length);
				} else if (line.indexOf(TIME_PREFIX) === 0) {
					song.time = MPDConnection._convertTime(line.substring(TIME_PREFIX.length));
				} else if (line.indexOf(DURATION_PREFIX) === 0) {
					song.duration = MPDConnection._convertTime(line.substring(DURATION_PREFIX.length));
				} else if (line.indexOf(ARTIST_PREFIX) === 0) {
					song.artist = line.substring(ARTIST_PREFIX.length);
				} else if (line.indexOf(ALBUMARTIST_PREFIX) === 0) {
					song.albumartist = line.substring(ALBUMARTIST_PREFIX.length);
				} else if (line.indexOf(COMMENT_PREFIX) === 0) {
					song.comment = line.substring(COMMENT_PREFIX.length);
				} else if (line.indexOf(PERFORMER_PREFIX) === 0) {
					song.performer = line.substring(PERFORMER_PREFIX.length);
				} else if (line.indexOf(COMPOSER_PREFIX) === 0) {
					song.composer = line.substring(COMPOSER_PREFIX.length);
				} else if (line.indexOf(FILE_PREFIX) === 0) {
					song = {};
					songs.push(song);
					var file = line.substring(FILE_PREFIX.length);
					song.file = file;
					song.b64file = this.toBase64(file);
				}
			});
            songs.forEach((song) => {
                if (song.duration) {
                    song.time = song.duration;
                    song.duration = undefined;
                }
            });
            songs.sort((a,b) => {
                let comp1 = a.file;
                let comp2 = b.file;
                if (a.track && b.track) {
                    try {
                        comp1 = parseInt(a.track);
                        comp2 = parseInt(b.track);
                    } catch (err) {
                        comp1 = a.title;
                        comp2 = b.title;
                    }
                }
                if (comp1 < comp2) {
                    return -1;
                } else if (comp1 > comp2) {
                    return 1;
                } else {
                    return 0;
                }
            });
			return songs;
		};
		var cmd = "find album \""+album.replace(/"/g, "\\\"")+"\"";
		if (artist) {
			cmd += " artist \""+artist.replace(/"/g, "\\\"")+"\"";
		}
        return this.createPromise(cmd, processor);
	}

	getSongs(songFilter, type) {
		const processor = (data) => {
			const lines = MPDConnection._lineSplit(data);
			let songs = [];
			let song;
			let count = 0;
            lines.forEach((line) => {
				if (line.indexOf(ARTIST_PREFIX) === 0) {
					song.artist = line.substring(ARTIST_PREFIX.length);
				} else if (line.indexOf(ALBUM_PREFIX) === 0) {
					song.album = line.substring(ALBUM_PREFIX.length);
				} else if (line.indexOf(TITLE_PREFIX) === 0) {
					song.title = line.substring(TITLE_PREFIX.length);
				} else if (line.indexOf(TRACK_PREFIX) === 0) {
					song.track = line.substring(TRACK_PREFIX.length);
				} else if (line.indexOf(TIME_PREFIX) === 0) {
					song.time = MPDConnection._convertTime(line.substring(TIME_PREFIX.length));
				} else if (line.indexOf(DURATION_PREFIX) === 0) {
					song.duration = MPDConnection._convertTime(line.substring(DURATION_PREFIX.length));
				} else if (line.indexOf(FILE_PREFIX) === 0) {
					song = {};
					if (count++ > 99) {
						return;
					}
					songs.push(song);
					const file = line.substring(FILE_PREFIX.length);
					song.file = file;
					song.b64file = this.toBase64(file);
				}
			});
            songs.forEach((song) => {
                if (song.duration) {
                    song.time = song.duration;
                    song.duration = undefined;
                }
            });
			return songs;
		};
		if (!type) {
			type = "title";
		}
        return this.createPromise("search "+type+" \""+songFilter.replace(/"/g, "\\\"")+"\"", processor);
    }
    
    getSongCountWithNoAlbum(artist) {
        if (this.version < 21) {
            return Promise.resolve(0);
        }

        const processor = (data) => {
            const lines = MPDConnection._lineSplit(data);
            let count = 0;
            lines.forEach((line) => {
                if (line.indexOf(SONGS_PREFIX) === 0) {
                    count = parseInt(line.substring(SONGS_PREFIX.length));
                }
            });
            return count;
        };
        const cmd = "count \"((Artist == \\\""+artist.replace(/"/g, "\\\"")+ "\\\") AND (album == \\\"\\\"))\"";
        return this.createPromise(cmd, processor);
    }

    getSongsWithNoAlbum(artist) {
        if (this.version < 21) {
            return Promise.resolve([]);
        }
        const processor = (data) => {
            const lines = MPDConnection._lineSplit(data);
			let songs = [];
			let song;
            
            lines.forEach((line) => {
				if (line.indexOf(TITLE_PREFIX) === 0) {
					song.title = line.substring(TITLE_PREFIX.length);
				} else if (line.indexOf(TRACK_PREFIX) === 0) {
					song.track = line.substring(TRACK_PREFIX.length);
				} else if (line.indexOf(TIME_PREFIX) === 0) {
					song.time = MPDConnection._convertTime(line.substring(TIME_PREFIX.length));
				} else if (line.indexOf(DURATION_PREFIX) === 0) {
					song.duration = MPDConnection._convertTime(line.substring(DURATION_PREFIX.length));
				} else if (line.indexOf(ARTIST_PREFIX) === 0) {
					song.artist = line.substring(ARTIST_PREFIX.length);
				} else if (line.indexOf(ALBUMARTIST_PREFIX) === 0) {
					song.albumartist = line.substring(ALBUMARTIST_PREFIX.length);
				} else if (line.indexOf(COMMENT_PREFIX) === 0) {
					song.comment = line.substring(COMMENT_PREFIX.length);
				} else if (line.indexOf(PERFORMER_PREFIX) === 0) {
					song.performer = line.substring(PERFORMER_PREFIX.length);
				} else if (line.indexOf(COMPOSER_PREFIX) === 0) {
					song.composer = line.substring(COMPOSER_PREFIX.length);
				} else if (line.indexOf(FILE_PREFIX) === 0) {
					song = {};
					songs.push(song);
					var file = line.substring(FILE_PREFIX.length);
					song.file = file;
					song.b64file = this.toBase64(file);
				}
			});
            songs.forEach((song) => {
                if (song.duration) {
                    song.time = song.duration;
                    song.duration = undefined;
                }
            });
            songs.sort((a,b) => {
                let comp1 = a.file;
                let comp2 = b.file;
                if (a.track && b.track) {
                    try {
                        comp1 = parseInt(a.track);
                        comp2 = parseInt(b.track);
                    } catch (err) {
                        comp1 = a.title;
                        comp2 = b.title;
                    }
                }
                if (comp1 < comp2) {
                    return -1;
                } else if (comp1 > comp2) {
                    return 1;
                } else {
                    return 0;
                }
            });
			return songs;
        };
        const cmd = "find \"((Artist == \\\""+artist.replace(/"/g, "\\\"")+ "\\\") AND (album == \\\"\\\"))\"";
        return this.createPromise(cmd, processor);
    }

    getPlayListInfo() {
        return this.getNamedPlayListInfo(undefined);
    }

	getNamedPlayListInfo(name) {
		const processor = (data) => {
			const lines = MPDConnection._lineSplit(data);
			let songs = [];
			let song;
            lines.forEach((line) => {
				if (line.indexOf(ARTIST_PREFIX) === 0) {
					song.artist = line.substring(ARTIST_PREFIX.length);
				} else if (line.indexOf(ALBUM_PREFIX) === 0) {
					song.album = line.substring(ALBUM_PREFIX.length);
				} else if (line.indexOf(TITLE_PREFIX) === 0) {
					song.title = line.substring(TITLE_PREFIX.length);
				} else if (line.indexOf(TRACK_PREFIX) === 0) {
					song.track = line.substring(TRACK_PREFIX.length);
				} else if (line.indexOf(TIME_PREFIX) === 0) {
                    const time = line.substring(TIME_PREFIX.length);
                    song.rawTime = time;
					song.time = MPDConnection._convertTime(time);
				} else if (line.indexOf(DURATION_PREFIX) === 0) {
                    const duration = line.substring(DURATION_PREFIX.length);
                    song.rawDuration = duration;
					song.duration = MPDConnection._convertTime(duration);
				} else if (line.indexOf(FILE_PREFIX) === 0) {
					song = {artist: "", album: ""};
					songs.push(song);
					song.file = line.substring(FILE_PREFIX.length);
                    song.title = song.file;
				} else if (line.indexOf(ID_PREFIX) === 0) {
					song.id = parseInt(line.substring(ID_PREFIX.length));
				} else if (line.indexOf(POS_PREFIX) === 0) {
					song.pos = parseInt(line.substring(POS_PREFIX.length));
				} else if (line.indexOf(NAME_PREFIX) === 0) {
                    song.name = line.substring(NAME_PREFIX.length);
                }
            });
            songs.forEach((song) => {
                if (song.duration) {
                    song.time = song.duration;
                    song.rawTime = song.rawDuration;
                    song.duration = undefined;
                    song.rawDuration = undefined;
                }
            });            
			return songs;
		};
        let cmd;
        if (name) {
            cmd = "listplaylistinfo \""+name+"\"";
        } else {
            cmd = "playlistinfo"
        }
        return this.createPromise(cmd, processor);
	}

	next() {
        this.createPromise("next")
        .then(() => {
            this.updateNowPlaying("play");
        });
	}

	previous() {
        this.createPromise("previous")
        .then(() => {
            this.updateNowPlaying("play");
        });
	}

	play(songid, dontPlaySilence) {
		var cmd;
		if (songid) {
			cmd = "playid "+songid;
		} else {
			cmd = "play";
        }
        this.createPromise(cmd)
        .then(() => {
            this.updateNowPlaying("play");
            if (!dontPlaySilence) {
                NowPlayingControl.playSilence();
            }
        });
	}

	pause(dontPauseSilence) {
        this.createPromise("pause")
        .then(() => {
            this.updateNowPlaying("pause");
            if (!dontPauseSilence) {                
                NowPlayingControl.pauseSilence();
            }
        });
	}

	stop() {
        this.createPromise("stop")
        .then(() => {
            this.updateNowPlaying("stop");
        });
	}

	setVolume(volume) {
		this.queue.push({
			cmd: "setvol "+volume,
			response: "",
			state: INITIAL
		});
    }
    
    updateNowPlaying(state) {
        let nowPlayingStatus = {};
        nowPlayingStatus.state = state;

        const currentsong = this.currentstatus.currentsong;

        if (currentsong.title) {
            nowPlayingStatus.title = currentsong.title;
            nowPlayingStatus.artist = currentsong.artist;
            nowPlayingStatus.albumTitle = currentsong.album;
            nowPlayingStatus.albumTrackNumber = this.currentstatus.Track;
            let time = 0;
            if (this.currentstatus.elapsed) {
                time = Math.floor(parseInt(this.currentstatus.elapsed));
            }
            let dur = 0;
            if (this.currentstatus.duration) {
                dur = Math.floor(parseInt(this.currentstatus.duration));
            } else {
                dur = parseInt(this.currentstatus.Time);
            }
            if (isNaN(dur)) {
                dur = 0;
            }
            nowPlayingStatus.MPNowPlayingInfoPropertyElapsedPlaybackTime = time;
            nowPlayingStatus.playbackDuration = dur;
        }
        NowPlayingControl.setNowPlaying(nowPlayingStatus);
    }

	addAlbumToPlayList(albumName, artistName, autoplay) {
        if (autoplay && this.autoplaysong) {
            return Promise.reject("There is already a 'Play Now' song playing");
        }

        const promise = new Promise((resolve, reject) => {
            this.getSongsForAlbum(albumName, artistName)
            .then((songs) => {
    			let cmd = "command_list_begin\n";
                if (autoplay) {
                    cmd += "clear\n";
                }
                songs.forEach((song) => {
    				cmd += "add \""+song.file+"\"\n";
    			});
                if (autoplay) {
                    cmd += "play\n";
                }
    			cmd += "command_list_end";
                this.createPromise(cmd)
                .then(() => {
                    resolve();
                })
                .catch((err) => {
                    reject(err);
                })
    		})
            .catch((err) => {
                reject(err);
            })
        });
        return promise;
	}

    addAlbumToNamedPlayList(albumName, artistName, playlist) {
        const promise = new Promise((resolve, reject) => {
            this.getSongsForAlbum(albumName, artistName)
            .then((songs) => {
    			let cmd = "command_list_begin\n";
                songs.forEach((song) => {
                    cmd += "playlistadd \""+playlist+"\" \""+song.file+"\"\n";
    			});
    			cmd += "command_list_end";
                this.createPromise(cmd)
                .then(() => {
                    resolve();
                })
                .catch((err) => {
                    reject(err);
                })
    		})
            .catch((err) => {
                reject(err);
            })
        });
        return promise;
    }

    addGenreSongsToNamedPlayList(genre, playlist) {
        const promise = new Promise((resolve, reject) => {
            this.getSongsForGenre(genre)
            .then((songs) => {
    			let cmd = "command_list_begin\n";
                songs.forEach((song) => {
                    cmd += "playlistadd \""+playlist+"\" \""+song.file+"\"\n";
    			});
    			cmd += "command_list_end";
                this.createPromise(cmd)
                .then(() => {
                    resolve();
                })
                .catch((err) => {
                    reject(err);
                })
    		})
            .catch((err) => {
                reject(err);
            })
        });
        return promise;
    }

    addGenreSongsToPlayList(genre, autoplay) {
        if (autoplay && this.autoplaysong) {
            return Promise.reject("There is already a 'Play Now' song playing");
        }

        const promise = new Promise((resolve, reject) => {
            this.getSongsForGenre(genre)
            .then((songs) => {
    			let cmd = "command_list_begin\n";
                if (autoplay) {
                    cmd += "clear\n";
                }
                songs.forEach((song) => {
    				cmd += "add \""+song.file+"\"\n";
    			});
                if (autoplay) {
                    cmd += "play\n";
                }
    			cmd += "command_list_end";
                this.createPromise(cmd)
                .then(() => {
                    resolve();
                })
                .catch((err) => {
                    reject(err);
                })
    		})
            .catch((err) => {
                reject(err);
            })
        });
        return promise;

    }

	addSongToPlayList(song, autoplay) {
        if (autoplay) {
            if (this.autoplaysong) {
                return Promise.reject("There is already a 'Play Now' song playing");
            } else {
                this.autoplaysong = {
                    song: this.toBase64(song),
                    repeat: this.repeatValue,
                    consume: this.consumeValue
                };
            }
            Promise.all([this.repeat(false), this.consume(false)]);
            let cmd = "command_list_begin\n";
            if (this.currentstatus.playlistlength && parseInt(this.currentstatus.playlistlength) > 0) {
                cmd += "save __playlist_to_restore\n";
                this.autoplaysong.saved = true;
            }
            AsyncStorage.setItem('@MPD:'+this.host+'_'+this.port+'_autoplaysong', JSON.stringify(this.autoplaysong));
            cmd += "clear\n";
            cmd += "add \""+song+"\"\n";
            cmd += "play\n";
            cmd += "command_list_end";
            return this.createPromise(cmd);    
        } else {
            return this.createPromise("add \""+song+"\"");
        }
	}

    addSongToNamedPlayList(song, playlist) {
        return this.createPromise("playlistadd \""+playlist+"\" \""+song+"\"");
	}

	addSongsToPlayList(songs, autoplay) {
        if (this.autoplaysong) {
            return Promise.reject("There is already a 'Play Now' song playing");
        }
        let cmd = "command_list_begin\n";
        if (autoplay) {
            cmd += "clear\n";
        }
        songs.forEach((song) => {
			cmd += "add \""+song+"\"\n";
        });
        if (autoplay) {
            cmd += "play\n";
        }
		cmd += "command_list_end";
        return this.createPromise(cmd);
	}

	addSongsToNamedPlayList(songs, playlist) {
		let cmd = "command_list_begin\n";
        songs.forEach((song) => {
			cmd += "playlistadd \""+playlist+"\" \""+song+"\"\n";
		});
		cmd += "command_list_end";
        return this.createPromise(cmd);
	}

    addDirectoryToNamedPlayList(dir, playlist) {
        const promise = new Promise((resolve, reject) => {
    		this.listFiles(dir)
            .then((filelist) => {
    			let cmd = "command_list_begin\n";
    			filelist.files.forEach((fileEntry) => {
                    if (!this.isPlaylistFile(fileEntry.file)) {
    					cmd += "playlistadd \""+playlist+"\"  \""+fileEntry.file+"\"\n";
    				}
    			});
    			cmd += "command_list_end";
                this.createPromise(cmd)
                .then(() => {
                    resolve();
                })
                .catch((err) => {
                    reject(err);
                });
    		})
            .catch((err) => {
                reject(err);
            });
        });
        return promise;
	}

	addDirectoryToPlayList(dir, autoplay) {
        if (autoplay && this.autoplaysong) {
            return Promise.reject("There is already a 'Play Now' song playing");
        }

        const promise = new Promise((resolve, reject) => {
    		this.listFiles(dir)
            .then((filelist) => {
    			let cmd = "command_list_begin\n";
                if (autoplay) {
                    cmd += "clear\n";
                }
    			filelist.files.forEach((fileEntry) => {
                    if (!this.isPlaylistFile(fileEntry.file)) {
                        cmd += "add \""+fileEntry.file+"\"\n";
    				}
    			});
                if (autoplay) {
                    cmd += "play\n";
                }
    			cmd += "command_list_end";
                this.createPromise(cmd)
                .then(() => {
                    resolve();
                })
                .catch((err) => {
                    reject(err);
                });
    		});
        });
        return promise;
	}

	clearPlayList() {
		this.queue.push({
			cmd: "clear",
			response: "",
			state: INITIAL
		});
	}

	removeSong(songid) {
        return this.createPromise("deleteid "+songid);
	}

	update() {
		this.queue.push({
			cmd: "update ",
			response: "",
			state: INITIAL
		});
	}

	login(password) {
        return this.createPromise("password "+password);
	}

	runCommand(cmd) {
		const processor = (data) => {
			return MPDConnection._lineSplit(data);
		};
        return this.createPromise(cmd, processor);
	}

    runCommandWithDebug(cmd) {
		const processor = (data) => {
            const lines = MPDConnection._lineSplit(data);
            const debugData = {
                cmd: cmd,
                debug: lines
            }
            SocketConnection.saveDebugData(JSON.stringify(debugData, ' ', '\t'));
			return lines;
		};
        return this.createPromise(cmd, processor);
    }
    
    randomPlayList(size, type, typevalue) {
        if (type) {
            return this.randomPlayListByType(size, type, typevalue);
        } else {
            if (this.version < 20) {
                return this.randomPlayListOrig(size);
            } else {
                return this.randomPlayListAlt(size);
            }
        }
    }

    randomPlayListAlt(size) {
        let cmdPrefix = "search title \"\"";
        const promise = new Promise((resolve, reject) => {
    		const processor = (data) => {
    			const lines = MPDConnection._lineSplit(data);
    			let songs = [];
    			let count = 0;
                lines.forEach((line) => {
    				if (line.indexOf(FILE_PREFIX) === 0) {
    					songs.push(line.substring(FILE_PREFIX.length));
    				}
    			});
    			return songs;
    		};

            let indexes = [];
            const playlistSize = this.stats.numberOfSongs < size ? this.stats.numberOfSongs : size;
            for (let i = 0;  i < playlistSize; i++) {
                indexes[i] = Math.floor((Math.random()*this.stats.numberOfSongs-1)+1);
            }
            let cmd = "command_list_begin\n";
            indexes.forEach((index) => {
                if (index < (this.stats.numberOfSongs-1)) {
                    cmd += cmdPrefix+" window "+index+":"+(index+1)+"\n";
                }
            })
            cmd += "command_list_end";
            this.createPromise(cmd, processor)
            .then((songs) => {
    			this.addSongsToPlayList(songs)
                .then(() => {
    				resolve();
    			})
                .catch((err) => {
                    reject(err);
                });
            })
            .catch((err) => {
                reject(err);
            })

        });
        return promise;
    }

	randomPlayListOrig(size) {
        const promise = new Promise((resolve, reject) => {
    		const processor = (data) => {
    			const lines = MPDConnection._lineSplit(data);
    			let songs = [];
    			let count = 0;
                lines.forEach((line) => {
    				if (line.indexOf(FILE_PREFIX) === 0) {
    					songs.push(line.substring(FILE_PREFIX.length));
    				}
    			});
    			return songs;
    		};
    		let cmd = "search title \"\"";
            this.createPromise(cmd, processor)
            .then((songs) => {
                let random = [];
    			if (songs.length > size+10) {
    				let count = 0;
    				while (count < size) {
    					let index = Math.floor((Math.random()*songs.length-1)+1);
    					if (random.indexOf(songs[index]) < 0) {
    						count++;
    						random.push(songs[index]);
    					}
    				}
    			} else {
    				for (var i = 0; songs.length > size ? i < size : i < songs.length; i++) {
    					random.push(songs[i]);
    				}
    			}
    			this.addSongsToPlayList(random)
                .then(() => {
    				resolve();
    			})
                .catch((err) => {
                    reject(err);
                });
            })
            .catch((err) => {
                reject(err);
            })
        });
        return promise;
	}

	randomPlayListByType(size, type, typevalue) {
        const promise = new Promise((resolve, reject) => {
    		const processor = (data) => {
    			const lines = MPDConnection._lineSplit(data);
    			let songs = [];
    			let count = 0;
                lines.forEach((line) => {
    				if (line.indexOf(FILE_PREFIX) === 0) {
    					songs.push(line.substring(FILE_PREFIX.length));
    				}
    			});
    			return songs;
    		};
    		let cmd = "";
            if (typevalue.indexOf("+") !== -1) {
                const typevalues = typevalue.split("+");
                cmd += "command_list_begin\n";
                typevalues.forEach((value) => {
                    cmd += "search ";
                    cmd += type;
                    cmd += " \"";
                    cmd += value;
                    cmd += "\"\n";
                });
                cmd += "command_list_end";
            } else {
                cmd += "search ";
                cmd += type;
                cmd += " \"";
                cmd += typevalue;
                cmd += "\"";
            }
            this.createPromise(cmd, processor)
            .then((songs) => {
                let random = [];
    			if (songs.length > size+10) {
    				let count = 0;
    				while (count < size) {
    					let index = Math.floor((Math.random()*songs.length-1)+1);
    					if (random.indexOf(songs[index]) < 0) {
    						count++;
    						random.push(songs[index]);
    					}
    				}
    			} else {
    				for (var i = 0; songs.length > size ? i < size : i < songs.length; i++) {
    					random.push(songs[i]);
    				}
    			}
    			this.addSongsToPlayList(random)
                .then(() => {
    				resolve();
    			})
                .catch((err) => {
                    reject(err);
                });
            })
            .catch((err) => {
                reject(err);
            })
        });
        return promise;
	}

	listFiles(uri, sortByTitle) {
		const processor = (data) => {
			const lines = MPDConnection._lineSplit(data);
			let dirs = [];
            let files = [];
            let f;
            lines.forEach((line) => {
				if (line.indexOf(FILE_PREFIX) === 0) {
                    f = undefined;
					const file = line.substring(FILE_PREFIX.length);
                    for (let suffix of this.fileSuffixes) {
						if (file.indexOf('.') === -1 || MPDConnection._endsWith(file, suffix)) {
                            const b64file = this.toBase64(file);
                            f = {file: file, b64file: b64file};
							files.push(f);
                            break;
						}
					}
				} else if (line.indexOf(DIR_PREFIX) === 0) {
					const dir = line.substring(DIR_PREFIX.length);
                    const b64dir = this.toBase64(dir);
                    const dirEntry = {dir: dir, b64dir: b64dir};
                    if (dirs.indexOf(dirEntry) === -1) {
                        dirs.push(dirEntry);
                    }
                } else if (line.indexOf(PLAYLIST_PREFIX) === 0) {
                    const playlist = line.substring(PLAYLIST_PREFIX.length);
                    if (this.isPlaylistFile(playlist)) {
                        files.push({file: playlist, b64file: this.toBase64(playlist)})
                    }
                } else if (line.indexOf(ARTIST_PREFIX) === 0) {
                    if (f) {
                        f.artist = line.substring(ARTIST_PREFIX.length);
                    }
                } else if (line.indexOf(ALBUM_PREFIX) === 0) {
                    if (f) {
                        f.album = line.substring(ALBUM_PREFIX.length);
                    }
                } else if (line.indexOf(TITLE_PREFIX) === 0) {
                    if (f) {
                        f.title = line.substring(TITLE_PREFIX.length);
                    }
				}
			});
            files.sort((a,b) => {
                let comp1 = a.file || a.dir;
                let comp2 = b.file || b.dir;
    
                if (sortByTitle && a.title && b.title) {
                    comp1 = a.title;
                    comp2 = b.title;
                    if (comp1 < comp2) {
                        return -1;
                    } else if (comp1 > comp2) {
                        return 1;
                    } else {
                        return 0;
                    }
                } else {
                    if (comp1 < comp2) {
                        return !sortByTitle ? -1 : 1;
                    } else if (comp1 > comp2) {
                        return !sortByTitle ? 1 : -1;
                    } else {
                        return 0;
                    }                
                }
			});
            dirs.sort((a,b) => {
				if (a.dir < b.dir) {
					return -1;
				} else if (a.dir > b.dir) {
					return 1;
				} else {
					return 0;
				}
			});

			return {files: files, dirs: dirs};
		};
		let cmd = "lsinfo";
		if (uri && uri !== "") {
			cmd += " \""+this.decode(uri) + "\"";
		}
        return this.createPromise(cmd, processor);
	}

    readpicture(uri, artist, album, statusHandler) {
        if (this.version > 21) {
            return this.albumart(uri, artist, album, statusHandler, "readpicture");
        } else {
            return Promise.reject("readpicture is not supported");
        }
    }

    binarylimit(limit) {
        if (this.version > 21) {
            return this.createPromise("binarylimit "+limit);
        } else {
            return Promise.resolve();
        }
    }

	albumart(uri, artist, album, statusHandler, type) {
        const basecmd = type || "albumart";
        const filename = 'albumart_'+this.toAlbumArtFilename(artist, album)+".png";
        const promise = new Promise((resolve, reject) => {
            if (this.version < 21) {
                reject("Albumart is not supported");
                return;
            }
            let offset = 0;
            let processor = (data, filename) => {
                const lines = MPDConnection._lineSplit(data);
                let meta = {filename: filename};
                lines.forEach((line) => {
                    if (line.indexOf(SIZE_PREFIX) === 0) {
                        meta.size = parseInt(line.substring(SIZE_PREFIX.length));
                    } else if (line.indexOf(BINARY_PREFIX) === 0) {
                        meta.binary = parseInt(line.substring(BINARY_PREFIX.length));
                    }
                });
                return meta;
            };

            const addTask = () => {
                let cmd = basecmd;
                if (uri && uri !== "") {
                    cmd += " \""+uri+"\" "+offset;
                }
                this.createPromise(cmd, processor, filename)
                .then((meta) => {
                    if (!meta.size) {
                        reject("No embedded album art for "+artist+" "+album);
                        return;
                    }
                    offset += meta.binary;
                    if (offset < meta.size) {
                        statusHandler(offset, meta.size);
                        addTask();
                    } else {
                        resolve({artist: artist, album: album, song: uri, path: meta.filename, size: meta.size});
                    }
                })
                .catch((err) => {
                    reject(err);
                });
            }
            addTask();
        });
        return promise;
    }
    
    albumartFromURL(uri, port, artist, album, prefix, suffix, host) {
        const filename = 'albumart_'+this.toAlbumArtFilename(artist, album)+".png";
        let path = uri.substring(0, uri.lastIndexOf('/'))+"/";
        const hostStr = host === undefined ? this.host : host;
        let url = "http://"+hostStr+":"+port;
        if (prefix && prefix !== "") {
            url += prefix;
        }
        url += "/";
        if (suffix && suffix !== "") {
            path += suffix;
        } else {
            path += "cover.png";        
        }
        url += encodeURI(path);
        return SocketConnection.writeAlbumArtFromURL(filename, url);
    }

    albumartFromUPnP(url, artist, album) {
        const filename = 'albumart_'+this.toAlbumArtFilename(artist, album)+".png";
        return SocketConnection.writeAlbumArtFromURL(filename, url);
    }

    deleteAlbumArt(filename) {
        SocketConnection.deleteAlbumArtFile(filename);
    }

    albumArtForAlbum(artist, album) {
        const promise = new Promise((resolve, reject) => {
            this.getSongsForAlbum(album, artist)
            .then((songs) => {
                if (songs.length > 0) {
                    this.albumart(songs[0].file, artist, album)
                    .then((path) => {
                        resolve(path);
                    })
                    .catch((err) =>{
                        reject(err);
                    })
                } else {
                    reject("Songs for "+artist+" "+album+" not found");
                }
            })
            .catch((err) => {
                reject(err);
            });
        });
        return promise;
    }

    listAlbumArtDir() {
        return SocketConnection.listAlbumArtDir();
    }

    getAlbumArtDir() {
        return this.albumArtDir;
    }

    isAlbumArtSupported() {
        return this.version > 20;
    }

	listMounts(cb, errorcb) {
		const processor = (data) => {
			const lines = MPDConnection._lineSplit(data);
            lines.forEach((line) => {
                console.log(line);
            });
			return {};
		};
        return this.createPromise("listmounts", processor);
	}

	listNeighbors(cb, errorcb) {
        const processor = (data) => {
			const lines = MPDConnection._lineSplit(data);
            lines.forEach((line) => {
                console.log(line);
            });
			return {};
		};
        return this.createPromise("listneighbors", processor);
	}

	listPlayLists() {
		const processor = (data) => {
			const lines = MPDConnection._lineSplit(data);
			let playlists = [];
			lines.forEach(function(line) {
				if (line.indexOf(PLAYLIST_PREFIX) === 0) {
					playlists.push(line.substring(PLAYLIST_PREFIX.length));
				}
			});
            playlists.sort((a,b) => {
                if (a < b) {
                    return -1;
                } else if (a > b) {
                    return 1;
                } else {
                    return 0;
                }
            });

			return playlists;
		};
        return this.createPromise("listplaylists", processor);
	}

	loadPlayList(name, autoplay) {
        let cmd;
        if (autoplay) {
            if (this.autoplaysong) {
                return Promise.reject("There is already a 'Play Now' song playing");
            }
            cmd = "command_list_begin\n";
            cmd += "clear\n";
            cmd += "load \""+name+"\"\n";
            cmd += "play\n";
            cmd += "command_list_end";
        } else {
            cmd = "load \""+name+"\"";
        }
        return this.createPromise(cmd);
	}

	savePlayList(name) {
        const promise = new Promise((resolve, reject) => {
    		this.getPlayListInfo()
    		.then((songs) => {
				let cmd = "command_list_begin\n";
				songs.forEach((song) => {
					cmd += "playlistadd \""+name+"\" \""+song.file+"\"\n";
				})
				cmd += "command_list_end";
                this.createPromise(cmd)
                .then(() => {
                    resolve();
                })
                .catch((err) => {
                    reject(err);
                })
			})
    		.catch((err) => {
                reject(err);
    		});
        });
        return promise;
	}

	deletePlayList(name) {
        return this.createPromise("rm \""+name+"\"");
	}

    deletePlayListItem(name, pos) {
        return this.createPromise("playlistdelete \""+name+"\" "+pos);
    }

    isPlaylistFile(file) {
        isPlaylist = false;
        for (let suffix of this.playlistSuffixes) {
            if (MPDConnection._endsWith(file, suffix)) {
                isPlaylist = true;
                break;
            }
        }
        return isPlaylist;
    }

	getOutputs() {
		const processor = (data) => {
			const lines = MPDConnection._lineSplit(data);
			let outputs = [];
			let output;
			lines.forEach((line) => {
				if (line.indexOf(OUTPUTID_PREFIX) === 0) {
					output = {};
					output.id = line.substring(OUTPUTID_PREFIX.length);
					outputs.push(output);
				} else if (line.indexOf(OUTPUTNAME_PREFIX) === 0) {
					output.name = line.substring(OUTPUTNAME_PREFIX.length);
				} else if (line.indexOf(OUTPUTENABLED_PREFIX) === 0) {
					output.enabled = line.substring(OUTPUTENABLED_PREFIX.length) === "1" ? true : false;
				}
			});
			return outputs;
		};
        return this.createPromise("outputs", processor);
	}

	enableOutput(id) {
        return this.createPromise("enableoutput "+id);
	}

	disableOutput(id) {
        return this.createPromise("disableoutput "+id);
	}

	shuffle(on) {
		var state = (on === true) ? 1 : 0;
        return this.createPromise("random "+state);
	}

	repeat(on) {
		var state = (on === true) ? 1 : 0;
        return this.createPromise("repeat "+state);
	}

	consume(on) {
		var state = (on === true) ? 1 : 0;
        return this.createPromise("consume "+state);
	}

	single(on) {
		var state = (on === true) ? 1 : 0;
        return this.createPromise("single "+state);
	}

	crossfade(seconds) {
        return this.createPromise("crossfade "+seconds);
	}

	replayGainMode(mode, cb, errorcb) {
        return this.createPromise("replay_gain_mode "+mode);
	}

    seekCurrrent(value) {
        return this.createPromise("seekcur "+value);
    }

    swap(id1, id2) {
        return this.createPromise("swapid "+id1+" "+id2);
    }

    move(id1, id2) {
        return this.createPromise("moveid "+id1+" "+id2);
    }
/*
    createPlaylistsFromAlbums(cb, errorcb) {
        this.getAllAlbums(
            undefined,
            function(albums) {
                albums.sort(function(a,b) {
    				if (a.artist > b.artist) {
    					return -1;
    				} else if (a.artist < b.artist) {
    					return 1;
    				} else {
    					return 0;
    				}
    			});

                var cmd = "command_list_begin\n";
                var seen = {};
        		albums.forEach(function(a) {
                    var name = a.artist+" - "+a.name
                    var plname = name.replace(/[\/\?<>\\:\*\|":]/g, ' ').replace(/^\.+$/, " ");
                    if (seen[plname.toLowerCase()]) {
                        console.log(plname);
                        return;
                    }
                    seen[plname.toLowerCase()] = true;
                    cmd += "clear\n";
                    cmd += "findadd album \""+a.name.replace(/"/g, "\\\"")+"\" artist \""+a.artist.replace(/"/g, "\\\"")+"\"\n";
                    cmd += "save \""+plname+"\"\n";
        		});
                cmd += "clear\n";
        		cmd += "command_list_end";

                this.queue.push({
    				cmd: cmd,
    				cb: function() {
                        cb(albums.length + " Total playlists created");
                    },
    				errorcb: errorcb,
    				response: "",
    				state: INITIAL
    			});

            }.bind(this),
            function(err) {
                errorcb(err);
            }
        );
    }
*/
    getCurrentPlaylistName() {
        return this.currentPlaylistName;
    }

    setCurrentPlaylistName(name) {
        this.currentPlaylistName = name;
    }

    toAlbumArtFilename(artist, album) {
        let filename = artist+"_"+album;
        filename = filename.replace(/[^a-z0-9]/gi, '_');
        return filename;
    }

    getAllGenres() {
        const processor = (data) => {
			const lines = MPDConnection._lineSplit(data);
			let genres = {};
            let currentAlbum;
            lines.forEach((line) => {
                if (line.indexOf(GENRE_PREFIX) === 0) {
                    const genre = line.substring(GENRE_PREFIX.length);
                    if (genre !== "") {
                        if (!genres[genre]) {
                            genres[genre] = [];
                        }
                        if (currentAlbum !== "") {
                            genres[genre].push(currentAlbum);
                        }
                    }
                } else if (line.indexOf(ALBUM_PREFIX) === 0) {
                    currentAlbum = line.substring(ALBUM_PREFIX.length);
                }
			});
			return genres;
		};
        return this.createPromise("list genre group album", processor);
    }

    getSongsForGenre(genre) {
        const processor = (data) => {
			const lines = MPDConnection._lineSplit(data);
			let songs = [];
			let song;
            lines.forEach((line) => {
				if (line.indexOf(TITLE_PREFIX) === 0) {
					song.title = line.substring(TITLE_PREFIX.length);
				} else if (line.indexOf(TRACK_PREFIX) === 0) {
					song.track = line.substring(TRACK_PREFIX.length);
				} else if (line.indexOf(TIME_PREFIX) === 0) {
					song.time = MPDConnection._convertTime(line.substring(TIME_PREFIX.length));
				} else if (line.indexOf(DURATION_PREFIX) === 0) {
					song.duration = MPDConnection._convertTime(line.substring(DURATION_PREFIX.length));
                } else if (line.indexOf(ARTIST_PREFIX) === 0) {
					song.artist = line.substring(ARTIST_PREFIX.length);
				} else if (line.indexOf(ALBUM_PREFIX) === 0) {
					song.album = line.substring(ALBUM_PREFIX.length);
				} else if (line.indexOf(FILE_PREFIX) === 0) {
					song = {};
					var file = line.substring(FILE_PREFIX.length);
					song.file = file;
					song.b64file = this.toBase64(file);
                    songs.push(song);
				}
			});
            songs.forEach((song) => {
                if (song.duration) {
                    song.time = song.duration;
                    song.duration = undefined;
                }
            });
            songs.sort((a,b) => {
                let comp1 = a.file;
                let comp2 = b.file;
                if (a.track && b.track) {
                    try {
                        comp1 = parseInt(a.track);
                        comp2 = parseInt(b.track);
                    } catch (err) {
                        comp1 = a.title;
                        comp2 = b.title;
                    }
                }
                if (comp1 < comp2) {
                    return -1;
                } else if (comp1 > comp2) {
                    return 1;
                } else {
                    return 0;
                }
            });
			return songs;
		};
		var cmd = "find genre \""+genre.replace(/"/g, "\\\"")+"\"";
        return this.createPromise(cmd, processor);
    }

	_loadFileSuffixes() {
        this.playlistSuffixes = ['cue', 'pls', 'asx', 'xspf'];
		this.fileSuffixes = [];
		const processor = (data) => {
			const lines = MPDConnection._lineSplit(data);
			lines.forEach((line) => {
				const suffix = line.substring(SUFFIX_PREFIX.length);
				if (line.indexOf(SUFFIX_PREFIX) === 0 && this.fileSuffixes.indexOf(suffix) === -1) {
					this.fileSuffixes.push("."+suffix);
				}
			});
		};
		this.queue.push({
			cmd: "decoders",
			process: processor,
			response: "",
			state: INITIAL
		});
	}

	static _lineSplit(data) {
		let lines = [];
		let split = data.split(/\n\r|\n|\r/);
		while(split.length) {
			const line = split.shift().replace(/^\s\s*/, '').replace(/\s\s*$/, '');
			if (line !== "") {
				lines.push(line);
			}
		}
		return lines;
	}

	static _convertTime(rawTime) {
		const time = Math.floor(parseInt(rawTime));
		const minutes = Math.floor(time / 60);
		let seconds = time - minutes * 60;
		seconds = (seconds < 10 ? '0' : '') + seconds;
		return minutes+":"+seconds;
	}

	static _endsWith(subjectString, searchString, position) {
		if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
			position = subjectString.length;
		}
		position -= searchString.length;
		const lastIndex = subjectString.lastIndexOf(searchString, position);
		return lastIndex !== -1 && lastIndex === position;
	}

	static get INITIAL() {
    	return INITIAL;
  	}

	static get WRITTEN() {
    	return WRITTEN;
  	}

	static get READING() {
    	return READING;
  	}

	static get COMPLETE() {
    	return COMPLETE;
  	}
}

class ConnectionsStorage {
    async getConnectionList() {
        try {
            let connectionList;
            let connstr = await AsyncStorage.getItem('@MPD:connections');
            if (connstr === null) {
                connstr = '[]';
                await AsyncStorage.setItem('@MPD:connections', connstr);
                connectionList = [];
            } else {
                connectionList = JSON.parse(connstr);
            }
            if (connection && connection.isConnected) {
                connectionList.forEach((c) => {
                    if (c.name === connection.name &&
                        c.ipAddress === connection.host &&
                        c.port === connection.port) {
                        c.stats = connection.stats;
                    }
                });
            }
            return connectionList;
        } catch (e) {
            console.log(e);
            return [];
        }
    }

    async addConnection(name, host, port, pwd) {
        try {
            return this.getConnectionList().then((connectionList) => {
                let add = true;
                connectionList.forEach((connection) => {
                    if (connection.name === name) {
                        add = false;
                    } 
                    if (connection.ipAddress === host && connection.port === port) {
                        add = false;
                    }
                });
                if (add) {
                    connectionList.push({name:name, ipAddress:host, port:port, pwd:pwd});
                    AsyncStorage.setItem('@MPD:connections', JSON.stringify(connectionList));
                }
            });
        } catch (e) {
            console.log(e);
        }
    }

    async updateConnection(connection) {
        try {
            return this.getConnectionList().then((connectionList) => {
                let conn;
                connectionList.forEach((c) => {
                    if (connection.name === c.name && connection.ipAddress === c.host && connection.port === c.port) {
                        conn = c;
                    }
                });
                if (conn) {
                    AsyncStorage.setItem('@MPD:connections', JSON.stringify(connectionList));
                }
            });
        } catch (e) {
            console.log(e);
        }
    }

    async removeConnection(connection) {
        try {
            return this.getConnectionList().then((connectionList) => {
                let index = -1;
                connectionList.forEach((c, i) => {
                    if (connection.name === c.name && connection.ipAddress === c.ipAddress && connection.port === c.port) {
                        index = i;
                    }
                });
                if (index > -1) {
                    connectionList.splice(index, 1);
                    AsyncStorage.setItem('@MPD:connections', JSON.stringify(connectionList));
                }
            });
        } catch (e) {
            console.log(e);
        }
    }
}

let connectionsStorage = new ConnectionsStorage();

let connection;

export default {
    connect: function(name, host, port, pwd) {
        if (connection) {
            this.disconnect();
        }
        connection = new MPDConnection(name, host, port);
        let promise = new Promise((resolve, reject) => {
            mpdEventEmiiter.emit('OnConnecting', {host: host, port: port});
            connection.connect(pwd, (error) => {
                if (error) {
                    mpdEventEmiiter.emit('OnDisconnect', {host: host, port: port});
                    reject(error);
                } else {
                    resolve();
                }
            });
        })
        return promise;
    },
    disconnect: function() {
        if (connection) {
            connection.disconnect();
            connection = undefined;
        }
    },
    isConnected: function() {
        return connection !== undefined && connection.isConnected;
    },
    isIdle: function() {
        return connection !== undefined && connection.queue.length < 1;
    },
    current: function() {
        return connection;
    },
    getDiscoveredList: function() {
        return discoverer.getDiscoveredList();
    },
    getConnectionList: function() {
        return connectionsStorage.getConnectionList();
    },
    addConnection: function(name, host, port, pwd) {
        return connectionsStorage.addConnection(name, host, port, pwd);
    },
    updateConnection: function(connection) {
        return connectionsStorage.updateConnection(connection);
    },
    removeConnection: function(connection) {
        return connectionsStorage.removeConnection(connection);
    },
    getEventEmitter: function() {
        return mpdEventEmiiter;
    },
    rescan: function() {
        discoverer.stopListening();
        discoverer.startListening();
    }
}

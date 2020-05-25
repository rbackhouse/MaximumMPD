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

import React from 'react';
import { Text, View, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { SearchBar } from "react-native-elements";

import Icon from 'react-native-vector-icons/Ionicons';
import FAIcon from 'react-native-vector-icons/FontAwesome';

import ActionButton from 'react-native-action-button';

import { SwipeListView, SwipeRow } from 'react-native-swipe-list-view';

import MPDConnection from './MPDConnection';
import Base64 from './Base64';
import AlbumArt from './AlbumArt';
import NewPlaylistModal from './NewPlaylistModal';
import { styles as common, songsStyles as styles, iconColor } from './Styles';

export default class SongsScreen extends React.Component {
    static navigationOptions = ({ navigation }) => {
        let type = navigation.getParam('album');
        if (!type) {
            type = navigation.getParam('genre');
        }
        return {
            title: "Songs ("+type+")"
        };
    };

    constructor(props) {
        super(props);
        this.state = {
          songs: [],
          fullset: [],
          loading: false,
          modalVisible: false,
          selectedItem: "",
          imagePath: "",
          searchValue: "",
          defaultSort: true
        };
    }

    componentDidMount() {
        const { navigation } = this.props;
        const artist = navigation.getParam('artist');
        const album = navigation.getParam('album');
        const genre = navigation.getParam('genre');
        navigation.setParams({ sort: this.sort });

        this.setState({loading: true});

        if (album) {
            MPDConnection.current().getSongsForAlbum(album, artist)
            .then((songs) => {
                this.setState({loading: false});
                this.setState({songs: songs, fullset: songs});
                AlbumArt.getAlbumArt(songs[0].artist, album)
                .then((path) => {
                    if (path) {
                        this.setState({imagePath: "file://"+path});
                    }
                });
            })
            .catch((err) => {
                this.setState({loading: false});
                Alert.alert(
                    "MPD Error",
                    "Error : "+err
                );
            });
        } else if (genre) {
            MPDConnection.current().getSongsForGenre(genre)
            .then((songs) => {
                this.setState({loading: false});
                this.setState({songs: songs, fullset: songs});
            })
            .catch((err) => {
                this.setState({loading: false});
                Alert.alert(
                    "MPD Error",
                    "Error : "+err
                );
            });
        }
        this.onDisconnect = MPDConnection.getEventEmitter().addListener(
            "OnDisconnect",
            () => {
                this.setState({songs: [], fullset: []});
                this.props.navigation.popToTop();
            }
        );
    }

    componentWillUnmount() {
        this.onDisconnect.remove();
    }

    search = (text) => {
        if (text.length > 0) {
            let filtered = this.state.fullset.filter((song) => {
                return song.title.toLowerCase().indexOf(text.toLowerCase()) > -1;
            });
            this.setState({songs: filtered, searchValue: text});
        } else {
            this.setState({songs: this.state.fullset, searchValue: text});
        }
    }

    addAll(toPlaylist) {
        const { navigation } = this.props;
        const artist = navigation.getParam('artist');
        const album = navigation.getParam('album');
        const genre = navigation.getParam('genre');

        if (toPlaylist === true) {
            this.setState({modalVisible: true, selectedItem: "all"});
        } else {
            if (album) {
                this.setState({loading: true});
                MPDConnection.current().addAlbumToPlayList(album, artist)
                .then(() => {
                    this.setState({loading: false});
                })
                .catch((err) => {
                    this.setState({loading: false});
                    Alert.alert(
                        "MPD Error",
                        "Error : "+err
                    );
                });
            } else if (genre) {
                this.setState({loading: true});
                MPDConnection.current().addGenreSongsToPlayList(genre)
                .then(() => {
                    this.setState({loading: false});
                })
                .catch((err) => {
                    this.setState({loading: false});
                    Alert.alert(
                        "MPD Error",
                        "Error : "+err
                    );
                });
            }
        }
    }

    onPress(item, toPlaylist, autoplay) {
        if (toPlaylist === true) {
            this.setState({modalVisible: true, selectedItem: item.b64file});
        } else {
            this.setState({loading: true});
            MPDConnection.current().addSongToPlayList(decodeURIComponent(Base64.atob(item.b64file)), autoplay)
            .then(() => {
                this.setState({loading: false});
            })
            .catch((err) => {
                this.setState({loading: false});
                Alert.alert(
                    "MPD Error",
                    "Error : "+err
                );
            });
        }
    }

    queue(rowMap, item, autoplay) {
        if (rowMap[item.b64file]) {
			rowMap[item.b64file].closeRow();
		}
        this.onPress(item, false, autoplay);
    }

    playlist(rowMap, item) {
        if (rowMap[item.b64file]) {
			rowMap[item.b64file].closeRow();
		}
        this.onPress(item, true, false);
    }

    finishAdd(name, selectedItem) {
        this.setState({modalVisible: false});
        MPDConnection.current().setCurrentPlaylistName(name);

        this.setState({loading: true});

        if (selectedItem === "all") {
            const { navigation } = this.props;
            const artist = navigation.getParam('artist');
            const album = navigation.getParam('album');
            const genre = navigation.getParam('genre');
            if (album) {
                MPDConnection.current().addAlbumToNamedPlayList(album, artist, MPDConnection.current().getCurrentPlaylistName())
                .then(() => {
                    this.setState({loading: false});
                })
                .catch((err) => {
                    this.setState({loading: false});
                    Alert.alert(
                        "MPD Error",
                        "Error : "+err
                    );
                });
            } else if (genre) {
                MPDConnection.current().addGenreSongsToNamedPlayList(genre, MPDConnection.current().getCurrentPlaylistName())
                .then(() => {
                    this.setState({loading: false});
                })
                .catch((err) => {
                    this.setState({loading: false});
                    Alert.alert(
                        "MPD Error",
                        "Error : "+err
                    );
                });
            }    
        } else {
            MPDConnection.current().addSongToNamedPlayList(decodeURIComponent(Base64.atob(selectedItem)), MPDConnection.current().getCurrentPlaylistName())
            .then(() => {
                this.setState({loading: false});
            })
            .catch((err) => {
                this.setState({loading: false});
                Alert.alert(
                    "MPD Error",
                    "Error : "+err
                );
            });
        }
    }

    autoPlay() {
        const { navigation } = this.props;
        const artist = navigation.getParam('artist');
        const album = navigation.getParam('album');
        const genre = navigation.getParam('genre');

        if (album) {
            this.setState({loading: true});
            MPDConnection.current().addAlbumToPlayList(album, artist, true)
            .then(() => {
                this.setState({loading: false});
            })
            .catch((err) => {
                this.setState({loading: false});
                Alert.alert(
                    "MPD Error",
                    "Error : "+err
                );
            });
        } else if (genre) {
            MPDConnection.current().addGenreSongsToPlayList(genre, true)
            .then(() => {
                this.setState({loading: false});
            })
            .catch((err) => {
                this.setState({loading: false});
                Alert.alert(
                    "MPD Error",
                    "Error : "+err
                );
            });
        }
    }

    sort = () => {
        const useDefault = !this.state.defaultSort;
        this.setState({defaultSort: useDefault});
        this.state.songs.sort((a,b) => {
            let comp1 = a.file;
            let comp2 = b.file;
            if (!useDefault && a.title && b.title) {
                comp1 = a.title;
                comp2 = b.title;
            } else if (a.track && b.track) {
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
        this.setState({songs: this.state.songs});
    };

    renderSeparator = () => {
        return (
            <View
                style={common.separator}
            />
        );
    };

    render() {
        return (
            <View style={common.container1}>
                <View style={common.container2}>
                    <View style={common.flex75}>
                        <SearchBar
                            clearIcon
                            lightTheme
                            round
                            cancelButtonTitle="Cancel"
                            placeholder='Search'
                            onChangeText={this.search}
                            value={this.state.searchValue}
                            containerStyle={common.searchbarContainer}
                            inputContainerStyle={common.searchbarInputContainer}
                            inputStyle={common.searchbarInput}
                    />
                    </View>
                    <View style={common.flex25}>
                        <Text style={common.text}>
                            Total : {this.state.songs.length}
                        </Text>
                    </View>
                </View>
                <View style={styles.container5}>
                <SwipeListView
					useFlatList
                    data={this.state.songs}
                    keyExtractor={item => item.b64file}
                    renderItem={(data, map) => {
                        const item = data.item;
                        return (
                        <SwipeRow leftOpenValue={75} rightOpenValue={-150}>
                            <View style={[common.rowBack, {height: 85}]}>
                                <TouchableOpacity style={common.backLeftBtn} onPress={ _ => this.queue(map, item, true) }>
                                    <Text style={common.backTextWhite}>Play</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[common.backRightBtn, common.backRightBtnLeft]} onPress={ _ => this.queue(map, item, false) }>
                                    <Text style={common.backTextWhite}>Queue</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[common.backRightBtn, common.backRightBtnRight]} onPress={ _ => this.playlist(map, item) }>
                                    <Text style={common.backTextWhite}>Playlist</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={[styles.container6, common.rowFront, {height: 85}]}>
                                <View style={styles.paddingLeft}/>
                                {this.state.imagePath.length < 1 &&
                                    <Image style={styles.albumart} source={require('./images/icons8-cd-filled-50.png')}/>
                                }
                                {this.state.imagePath.length > 0 &&
                                    <Image style={styles.noalbumart} source={{uri: this.state.imagePath}}/>
                                }
                                <View style={common.container4}>
                                    <Text numberOfLines={1} ellipsizeMode='tail' style={styles.item}>{item.title}</Text>
                                    {item.artist !== undefined &&
                                        <Text numberOfLines={1} ellipsizeMode='tail' style={styles.item}>{item.artist}</Text>
                                    }
                                    {item.album !== undefined &&
                                        <Text numberOfLines={1} ellipsizeMode='tail' style={styles.item}>{item.album}</Text>
                                    }
                                    <Text style={styles.item}>Track: {item.track} Time: {item.time}</Text>
                                </View>
                                <Icon name="ios-swap" size={20} color={iconColor} style={common.icon}/>
                            </View>
                        </SwipeRow>
                    );}}
                    renderSectionHeader={({section}) => <Text style={common.sectionHeader}>{section.title}</Text>}
                    ItemSeparatorComponent={this.renderSeparator}
				/>
                </View>
                {this.state.loading &&
                    <View style={common.loading}>
                        <ActivityIndicator size="large" color="#0000ff"/>
                    </View>
                }
                <NewPlaylistModal visible={this.state.modalVisible} selectedItem={this.state.selectedItem} onSet={(name, selectedItem) => {this.finishAdd(name, selectedItem);}} onCancel={() => this.setState({modalVisible: false})}></NewPlaylistModal>

                <ActionButton buttonColor="rgba(231,76,60,1)" hideShadow={true}>
                    <ActionButton.Item buttonColor='#1abc9c' title="Play Now" size={40} textStyle={common.actionButtonText} onPress={() => {this.autoPlay();}}>
                        <FAIcon name="play" size={15} color="#e6e6e6" />
                    </ActionButton.Item>
                    <ActionButton.Item buttonColor='#3498db' title="All to Queue" size={40} textStyle={common.actionButtonText} onPress={() => {this.addAll(false);}}>
                        <FAIcon name="plus-square" size={15} color="#e6e6e6" />
                    </ActionButton.Item>
                    <ActionButton.Item buttonColor='#9b59b6' title="All to Playlist" size={40} textStyle={common.actionButtonText} onPress={() => {this.addAll(true);}}>
                        <FAIcon name="plus-square" size={15} color="#e6e6e6" />
                    </ActionButton.Item>
                </ActionButton>
            </View>
        );
    }
}

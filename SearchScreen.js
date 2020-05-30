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
import { View, Text, ActivityIndicator, TouchableOpacity, Alert, Image } from 'react-native';
import { SearchBar } from "react-native-elements";
import Icon from 'react-native-vector-icons/Ionicons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SwipeListView, SwipeRow } from 'react-native-swipe-list-view';

import MPDConnection from './MPDConnection';
import Base64 from './Base64';
import NewPlaylistModal from './NewPlaylistModal';
import AlbumArt from './AlbumArt';
import { StyleManager } from './Styles';

export default class SearchScreen extends React.Component {

    static navigationOptions = {
        title: 'Search'
    };

    constructor(props) {
        super(props);
        this.state = {
          searchValue: "",
          artists: [],
          albums: [],
          songs: [],
          loading: false,
          modalVisible: false,
          selectedItem: ""
        };
    }

    componentDidMount() {
        if (!MPDConnection.isConnected()) {
            this.props.navigation.navigate('Settings');
            this.props.navigation.navigate('Connections');
        }

        this.onConnect = MPDConnection.getEventEmitter().addListener(
            "OnConnect",
            () => {
            }
        );
        this.onDisconnect = MPDConnection.getEventEmitter().addListener(
            "OnDisconnect",
            () => {
                this.setState({artists: [], albums: [], songs: [], searchValue: ""});
            }
        );
    }

    componentWillUnmount() {
        this.onConnect.remove();
        this.onDisconnect.remove();
    }

    search = (text) => {
        this.setState({searchValue: text});
        let artists = [], albums = [], songs = [], artistCheck = [], albumCheck = [];
        if (text.length > 2) {
            this.setState({loading: true});
            MPDConnection.current().search(text.toLowerCase(), 0, 49)
            .then((results) => {
                this.setState({loading: false});
                results.forEach((result) => {
                    let artist = {artist: result.artist, key: result.artist, traverse: true};
                    let album = {album: result.album, key: result.album, artist: result.artist, traverse: true};
                    if (result.artist && !artistCheck.includes(result.artist) && artist.key.toLowerCase().indexOf(text.toLowerCase()) > -1) {
                        artists.push(artist);
                        artistCheck.push(result.artist);
                        AlbumArt.getAlbumArtForArtists()
                        .then((artistArt) => {
                            if (artistArt[artist.artist]) {
                                artist.imagePath = "file://"+artistArt[artist.artist];
                                this.setState({artists: artists});
                            }
                        });
                    }
                    if (result.album && !albumCheck.includes(result.album) && album.key.toLowerCase().indexOf(text.toLowerCase()) > -1) {
                        albums.push(album);
                        albumCheck.push(result.album);
                        AlbumArt.getAlbumArt(artist.artist, album.album)
                        .then((path) => {
                            if (path) {
                                album.imagePath = "file://"+path;
                                this.setState({albums: albums});
                            }
                        });
                    }
                    if (result.title && result.title.toLowerCase().indexOf(text.toLowerCase()) > -1) {
                        let song = {
                            title: result.title,
                            time: result.time,
                            key: result.b64file,
                            artist: result.artist,
                            album: result.album,
                            b64file: result.b64file
                        }
                        songs.push(song);
                        AlbumArt.getAlbumArt(artist.artist, album.album)
                        .then((path) => {
                            if (path) {
                                song.imagePath = "file://"+path;
                                this.setState({songs: songs});
                            }
                        });
                    }
                });
                this.setState({
                    artists: artists,
                    albums: albums,
                    songs: songs
                });
            })
            .catch((err) => {
                this.setState({loading: false});
                console.log(err);
                Alert.alert(
                    "MPD Error",
                    "Error : "+err
                );
            });
        } else {
            let state = {
                artists: artists,
                albums: albums,
                songs: songs
            };
            this.setState(state);
        }
    };

    onPress(item) {
        if (item.album) {
            this.props.navigation.navigate('Songs', {artist: item.artist, album: item.album});
        } else {
            this.props.navigation.navigate('Albums', {artist: item.artist});
        }
    }

    queue(rowMap, item, autoplay) {
        if (rowMap[item.key]) {
			rowMap[item.key].closeRow();
		}

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

    playlist(rowMap, item) {
        if (rowMap[item.key]) {
			rowMap[item.key].closeRow();
		}
        this.setState({modalVisible: true, selectedItem: item.b64file});
    }

    finishAdd(name, selectedItem) {
        this.setState({modalVisible: false});
        MPDConnection.current().setCurrentPlaylistName(name);

        this.setState({loading: true});

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

    renderSeparator = () => {
        const common = StyleManager.getStyles("styles");
        return (
            <View
                style={common.separator}
            />
        );
    };

    render() {
        const styles = StyleManager.getStyles("searchStyles");
        const common = StyleManager.getStyles("styles");
        return (
            <View style={common.container1}>
                <View style={common.container2}>
                    <View style={styles.container3}>
                        <SearchBar
                            clearIcon
                            lightTheme
                            round
                            platform="ios"
                            cancelButtonTitle="Cancel"
                            placeholder='Search'
                            onChangeText={this.search}
                            value={this.state.searchValue}
                            containerStyle={common.searchbarContainer}
                            inputContainerStyle={common.searchbarInputContainer}
                            inputStyle={common.searchbarInput}
                    />
                    </View>
                </View>
                <View style={styles.container4}>
                <SwipeListView
                    useSectionList
                    sections={[
                        {title: 'Artist', data: this.state.artists},
                        {title: 'Albums', data: this.state.albums},
                        {title: 'Songs', data: this.state.songs}
                    ]}
                    keyExtractor={item => item.key}
                    renderItem={(data, map) => {
                        const item = data.item;
                        if (item.title) {
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
                                    <View style={[styles.container1, common.rowFront, {height: 85}]}>
                                        <View style={styles.paddingLeft}/>
                                        {item.imagePath === undefined &&
                                            <Icon name="ios-musical-notes" size={20} style={common.icon}/>
                                        }
                                        {item.imagePath !== undefined &&
                                            <Image style={styles.albumart} source={{uri: item.imagePath}}/>
                                        }
                                        <View style={common.container4}>
                                            {item.title && <Text numberOfLines={1} ellipsizeMode='tail' style={styles.item}>{item.title}</Text>}
                                            {item.artist && <Text numberOfLines={1} ellipsizeMode='tail' style={styles.item}>{item.artist}</Text>}
                                            {item.album && <Text numberOfLines={1} ellipsizeMode='tail' style={styles.item}>{item.album}</Text>}
                                            {item.time && <Text numberOfLines={1} ellipsizeMode='tail' style={styles.item}>{item.time}</Text>}
                                        </View>
                                        <Icon name="ios-swap" size={20} style={common.icon}/>
                                    </View>
                                </SwipeRow>
                            );
                        } else {
                            return (
                                <TouchableOpacity onPress={this.onPress.bind(this, item)}>
                                    <View style={styles.container7}>
                                        <View style={styles.paddingLeft}/>
                                        {item.imagePath === undefined &&
                                            <MaterialCommunityIcon name="artist" size={20} style={common.icon}/>
                                        }
                                        {item.imagePath !== undefined &&
                                            <Image style={styles.albumart} source={{uri: item.imagePath}}/>
                                        }
                                        <View style={common.container4}>
                                            {item.artist && <Text style={styles.item}>{item.artist}</Text>}
                                            {item.album && <Text style={styles.item}>{item.album}</Text>}
                                        </View>
                                        <Icon name="ios-more" size={20} style={common.icon}/>
                                    </View>
                                </TouchableOpacity>
                            );
                        }
                    }}
                    renderSectionHeader={({section}) => <Text style={common.sectionHeaderAlt}>{section.title}</Text>}
                    ItemSeparatorComponent={this.renderSeparator}
                />
                </View>
                <NewPlaylistModal visible={this.state.modalVisible} selectedItem={this.state.selectedItem} onSet={(name, selectedItem) => {this.finishAdd(name, selectedItem);}} onCancel={() => this.setState({modalVisible: false})}></NewPlaylistModal>

                {this.state.loading &&
                    <View style={common.loading}>
                        <ActivityIndicator size="large" color="#0000ff"/>
                    </View>
                }
            </View>
        );
    }
}

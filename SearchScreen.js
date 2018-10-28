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
import { View, Text, StyleSheet, SectionList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { SearchBar } from "react-native-elements";
import Icon from 'react-native-vector-icons/Ionicons';
import { SwipeListView, SwipeRow } from 'react-native-swipe-list-view';

import MPDConnection from './MPDConnection';
import Base64 from './Base64';
import NewPlaylistModal from './NewPlaylistModal';

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
        this.didBlurSubscription = this.props.navigation.addListener(
            'didBlur',
            payload => {
                //this.setState({artists: [], albums: [], songs: []});
            }
        );
        this.didFocusSubscription = this.props.navigation.addListener(
            'didFocus',
            payload => {
            }
        );
    }

    componentWillUnmount() {
        this.onConnect.remove();
        this.onDisconnect.remove();
        this.didBlurSubscription.remove();
        this.didFocusSubscription.remove();
    }

    search = (text) => {
        let artists = [], albums = [], songs = [], artistCheck = [], albumCheck = [];
        if (text.length > 3) {
            this.setState({loading: true});
            MPDConnection.current().search(text.toLowerCase(), 0, 99,
                (results) => {
                    this.setState({loading: false});
                    results.forEach((result) => {
                        let artist = {artist: result.artist, key: result.artist, traverse: true};
                        let album = {album: result.album, key: result.album, artist: result.artist, traverse: true};
                        if (!artistCheck.includes(result.artist) && artist.key.toLowerCase().indexOf(text.toLowerCase()) > -1) {
                            artists.push(artist);
                            artistCheck.push(result.artist);
                        }
                        if (!albumCheck.includes(result.album) && album.key.toLowerCase().indexOf(text.toLowerCase()) > -1) {
                            albums.push(album);
                            albumCheck.push(result.album);
                        }
                        if (result.title.toLowerCase().indexOf(text.toLowerCase()) > -1) {
                            songs.push({
                                title: result.title,
                                time: result.time,
                                key: result.b64file,
                                artist: result.artist,
                                album: result.album,
                                b64file: result.b64file
                            });
                        }
                    });
                    this.setState({
                        artists: artists,
                        albums: albums,
                        songs: songs,
                        searchValue: text
                    });
                },
                (err) => {
                    this.setState({loading: false});
                    console.log(err);
                    Alert.alert(
                        "MPD Error",
                        "Error : "+err
                    );
                }
            );
        } else {
            this.setState({
                artists: artists,
                albums: albums,
                songs: songs,
                searchValue: text
            });
        }
    };

    onPress(item) {
        if (item.album) {
            this.props.navigation.navigate('Songs', {artist: item.artist, album: item.album});
        } else {
            this.props.navigation.navigate('Albums', {artist: item.artist});
        }
    }

    queue(rowMap, item) {
        if (rowMap[item.key]) {
			rowMap[item.key].closeRow();
		}

        MPDConnection.current().addSongToPlayList(
            decodeURIComponent(Base64.atob(item.b64file)),
            () => {
                this.setState({loading: false});
            },
            (err) => {
                this.setState({loading: false});
                console.log(err);
                Alert.alert(
                    "MPD Error",
                    "Error : "+err
                );
            }
        );

    }

    playlist(rowMap, item) {
        if (rowMap[item.key]) {
			rowMap[item.key].closeRow();
		}
        if (!MPDConnection.current().getCurrentPlaylistName()) {
            this.setState({modalVisible: true, selectedItem: item.b64file});
            return;
        }
        MPDConnection.current().addSongToNamedPlayList(
            decodeURIComponent(Base64.atob(item.b64file)),
            MPDConnection.current().getCurrentPlaylistName(),
            () => {
                this.setState({loading: false});
            },
            (err) => {
                this.setState({loading: false});
                Alert.alert(
                    "MPD Error",
                    "Error : "+err
                );
            }
        );
    }

    finishAdd(name, selectedItem) {
        this.setState({modalVisible: false});
        MPDConnection.current().setCurrentPlaylistName(name);

        this.setState({loading: true});

        MPDConnection.current().addSongToNamedPlayList(
            decodeURIComponent(Base64.atob(selectedItem)),
            MPDConnection.current().getCurrentPlaylistName(),
            () => {
                this.setState({loading: false});
            },
            (err) => {
                this.setState({loading: false});
                Alert.alert(
                    "MPD Error",
                    "Error : "+err
                );
            }
        );
    }

    renderSeparator = () => {
        return (
            <View
                style={{
                  height: 1,
                  width: "90%",
                  backgroundColor: "#CED0CE",
                  marginLeft: "5%"
                }}
            />
        );
    };

    render() {
        return (
            <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'stretch' }}>
                <View style={{flex: .1, flexDirection: 'row', alignItems: 'center'}}>
                    <View style={{flex: 1}}>
                        <SearchBar
                            clearIcon
                            lightTheme
                            round
                            platform="ios"
                            cancelButtonTitle="Cancel"
                            placeholder='Search'
                            onChangeText={this.search}
                            value={this.state.searchValue}
                        />
                    </View>
                </View>

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
                                <SwipeRow rightOpenValue={-150}>
                                    <View style={styles.rowBack}>
                                        <TouchableOpacity style={[styles.backRightBtn, styles.backRightBtnLeft]} onPress={ _ => this.queue(map, item) }>
                                            <Text style={styles.backTextWhite}>Queue</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[styles.backRightBtn, styles.backRightBtnRight]} onPress={ _ => this.playlist(map, item) }>
                                            <Text style={styles.backTextWhite}>Playlist</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View style={[{flex: 1, flexDirection: 'row', alignItems: 'center'}, styles.rowFront]}>
                                        <Icon name="ios-musical-notes" size={20} color="black" style={{ paddingLeft: 20, paddingRight: 20 }}/>
                                        <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'space-evenly', alignItems: 'stretch', padding: 5}}>
                                            {item.title && <Text style={styles.item}>{item.title}</Text>}
                                            {item.artist && <Text style={styles.item}>{item.artist}</Text>}
                                            {item.album && <Text style={styles.item}>{item.album}</Text>}
                                            {item.time && <Text style={styles.item}>{item.time}</Text>}
                                        </View>
                                        <Icon name="ios-swap" size={20} color="black" style={{ paddingLeft: 20, paddingRight: 20 }}/>
                                    </View>
                                </SwipeRow>
                            );
                        } else {
                            return (
                                <TouchableOpacity onPress={this.onPress.bind(this, item)}>
                                    <View style={{flex: 1, flexDirection: 'row', alignItems: 'center'}}>
                                        <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'space-evenly', alignItems: 'stretch', padding: 5}}>
                                            {item.artist && <Text style={styles.item}>{item.artist}</Text>}
                                            {item.album && <Text style={styles.item}>{item.album}</Text>}
                                        </View>
                                        <Icon name="ios-more" size={20} color="black" style={{ paddingLeft: 20, paddingRight: 20 }}/>
                                    </View>
                                </TouchableOpacity>
                            );
                        }
                    }}
                    renderSectionHeader={({section}) => <Text style={styles.sectionHeader}>{section.title}</Text>}
                    ItemSeparatorComponent={this.renderSeparator}
                />

                <NewPlaylistModal visible={this.state.modalVisible} selectedItem={this.state.selectedItem} onSet={(name, selectedItem) => {this.finishAdd(name, selectedItem);}} onCancel={() => this.setState({modalVisible: false})}></NewPlaylistModal>

                {this.state.loading &&
                    <View style={styles.loading}>
                        <ActivityIndicator size="large" color="#0000ff"/>
                    </View>
                }
            </View>
        );
    }
}

const styles = StyleSheet.create({
    item: {
        fontSize: 17,
        fontFamily: 'GillSans-Italic',
        paddingLeft: 10
    },
    sectionHeader: {
        paddingTop: 2,
        paddingLeft: 10,
        paddingRight: 10,
        paddingBottom: 2,
        fontSize: 17,
        fontFamily: 'GillSans-Italic',
        fontWeight: 'bold',
        backgroundColor: 'rgba(247,247,247,1.0)',
    },
    backTextWhite: {
		color: '#FFF'
	},
    rowFront: {
		alignItems: 'center',
		backgroundColor: '#FFFFFF',
		justifyContent: 'center',
	},
	rowBack: {
		alignItems: 'center',
		backgroundColor: '#DDD',
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingLeft: 15,
	},
	backRightBtn: {
		alignItems: 'center',
		bottom: 0,
		justifyContent: 'center',
		position: 'absolute',
		top: 0,
		width: 75
	},
	backRightBtnLeft: {
		backgroundColor: 'grey',
		right: 75
	},
	backRightBtnRight: {
		backgroundColor: 'darkgray',
		right: 0
	},
    loading: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center'
    }
});

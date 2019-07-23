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
import { Text, View, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image, InteractionManager } from 'react-native';
import { SearchBar, ButtonGroup } from "react-native-elements";
import Icon from 'react-native-vector-icons/Ionicons';

import MPDConnection from './MPDConnection';
import Base64 from './Base64';
import AlbumArt from './AlbumArt';

export default class ArtistsScreen extends React.Component {
    static navigationOptions = ({ navigation }) => {
        return {
            title: "Browse"
        };
    };

    constructor(props) {
        super(props);
        this.state = {
          searchValue: "",
          searchGenreValue: "",
          searchAlbumValue: "",
          artists: [],
          fullset: [],
          genres: [],
          genresFullset: [],
          albums: [],
          albumsFullset: [],
          selectedTab: 0,
          loading: false,
          realTotal: 0
        };
    }

    componentDidMount() {
        if (!MPDConnection.isConnected()) {
            this.props.navigation.navigate('Settings');
            this.props.navigation.navigate('Connections');
        }

        const { navigation } = this.props;

        this.load();

        this.onConnect = MPDConnection.getEventEmitter().addListener(
            "OnConnect",
            () => {
                this.load();
            }
        );
        this.onDisconnect = MPDConnection.getEventEmitter().addListener(
            "OnDisconnect",
            () => {
                this.setState({artists: [], fullset: []});
            }
        );
        this.onAlbumArtEnd = AlbumArt.getEventEmitter().addListener(
            "OnAlbumArtEnd",
            () => {
                this.updateAlbumArt();
            }
        );
        this.onAlbumArtError = AlbumArt.getEventEmitter().addListener(
            "OnAlbumArtError",
            () => {
                this.updateAlbumArt();
            }
        );
        this.onAlbumArtComplete = AlbumArt.getEventEmitter().addListener(
            "OnAlbumArtComplete",
            () => {
                this.updateAlbumArt();
            }
        );
    }

    updateAlbumArt() {
        AlbumArt.getAlbumArtForArtists()
        .then((artMap) => {
            this.state.fullset.forEach((artist) => {
                if (artMap[artist.name]) {
                    artist.imagePath = "file://"+artMap[artist.name];
                }
            })
            this.setState({artists: this.state.artists, fullset: this.state.fullset});
        });

        AlbumArt.getAlbumArtForAlbums(this.state.albumsFullset).then((albums) => {
            this.setState({albums: this.subset(albums), albumsFullset: albums});
        });
    }

    load() {
        const allArtist = MPDConnection.current().getAllArtists();
        const allAlbums = MPDConnection.current().getAllAlbums();
        const allGenres = MPDConnection.current().getAllGenres();

        this.setState({loading: true});

        Promise.all([allArtist, allAlbums, allGenres])
        .then((results) => {
            this.setState({loading: false});
            let artists = results[0];
            let albums = results[1];
            let genres = results[2];

            artists.forEach((artist, index) => {
                artist.key = ""+(index+1);
            });

            this.setState({artists: artists, fullset: artists});
            AlbumArt.getAlbumArtForArtists()
            .then((artMap) => {
                artists.forEach((artist) => {
                    if (artMap[artist.name]) {
                        artist.imagePath = "file://"+artMap[artist.name];
                    }
                })
                this.setState({artists: this.state.artists, fullset: this.state.fullset});
            });
            albums.forEach((album, index) => {
                album.key = ""+(index+1);
                AlbumArt.getAlbumArt(album.artist, album.name).then((path) => {
                    if (path) {
                        album.imagePath = "file://"+path;
                    }
                });
            });
            this.setState({albums: this.subset(albums), albumsFullset: albums});
            let genreList = [];
            genres.forEach((genre, index) => {
                genreList.push({
                    key: ""+(index+1),
                    name: genre
                });
            });
            this.setState({genres: genreList, genresFullset: genreList});
        })
        .catch((err) => {
            this.setState({loading: false});
            Alert.alert(
                "MPD Error",
                "Error : "+err
            );
        });
    }

    componentWillUnmount() {
        this.onConnect.remove();
        this.onDisconnect.remove();
        this.onAlbumArtEnd.remove();
        this.onAlbumArtComplete.remove();
        this.onAlbumArtError.remove();
    }

    search = (text) => {
        if (text.length > 0) {
            let filtered = this.state.fullset.filter((artist) => {
                return artist.name.toLowerCase().indexOf(text.toLowerCase()) > -1;
            });
            this.setState({artists: filtered, searchValue: text});
        } else {
            this.setState({artists: this.state.fullset, searchValue: text});
        }
    }

    searchGenres = (text) => {
        if (text.length > 0) {
            let filtered = this.state.genresFullset.filter((genre) => {
                return genre.name.toLowerCase().indexOf(text.toLowerCase()) > -1;
            });
            this.setState({genres: filtered, searchGenreValue: text});
        } else {
            this.setState({genres: this.state.genresFullset, searchGenreValue: text});
        }
    }

    searchAlbums = (text) => {
        if (text.length > 0) {
            let filtered = this.state.albumsFullset.filter((album) => {
                return album.name.toLowerCase().indexOf(text.toLowerCase()) > -1;
            });
            this.setState({albums: this.subset(filtered), searchAlbumValue: text});
        } else {
            this.setState({albums: this.subset(this.state.albumsFullset), searchAlbumValue: text});
        }
    }

    onPress(item) {
        const { navigation } = this.props;
        navigation.navigate('Albums', {artist: item.name});
    }

    onGenrePress(item) {
        const { navigation } = this.props;
        navigation.navigate('Songs', {genre: item.name});
    }

    onAlbumPress(item) {
        const { navigation } = this.props;
        navigation.navigate('Songs', {artist: item.artist, album: item.name});
    }

    subset(albums) {
        this.setState({realTotal: albums.length});
        const maxListSize = MPDConnection.current().getMaxListSize();
        if (maxListSize === 0) {
            return albums;
        }
        if (albums.length > maxListSize) {
            return albums.slice(0, maxListSize);
        } else {
            return albums;
        }
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

    renderItem = ({item}) => {
        return (
            <TouchableOpacity onPress={this.onPress.bind(this, item)}>
                <View style={{flex: 1, flexDirection: 'row', alignItems: 'center'}}>
                    {item.imagePath === undefined &&
                        <Image style={{width: 20, height: 20, paddingLeft: 20, paddingRight: 20, resizeMode: 'contain'}} source={require('./images/icons8-dj-30.png')}/>
                    }
                    {item.imagePath !== undefined &&
                        <Image style={{width: 35, height: 35, paddingLeft: 20, paddingRight: 20, resizeMode: 'contain'}} source={{uri: item.imagePath}}/>
                    }
                    <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'space-evenly', alignItems: 'stretch', padding: 5}}>
                        <Text style={styles.item}>{item.name}</Text>
                    </View>
                    <Icon name="ios-more" size={20} color="black" style={{ paddingLeft: 20, paddingRight: 20 }}/>
                </View>
            </TouchableOpacity>
        );
    };

    renderGenreItem = ({item}) => {
        return (
            <TouchableOpacity onPress={this.onGenrePress.bind(this, item)}>
                <View style={{flex: 1, flexDirection: 'row', alignItems: 'center'}}>
                    <Icon name="ios-musical-notes" size={20} color="black" style={{ paddingLeft: 20, paddingRight: 20 }}/>
                    <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'space-evenly', alignItems: 'stretch', padding: 5}}>
                        <Text style={styles.item}>{item.name}</Text>
                    </View>
                    <Icon name="ios-more" size={20} color="black" style={{ paddingLeft: 20, paddingRight: 20 }}/>
                </View>
            </TouchableOpacity>
        );
    }

    renderAlbumItem = ({item}) => {
        return (
            <TouchableOpacity onPress={this.onAlbumPress.bind(this, item)}>
                <View style={{flex: 1, flexDirection: 'row', alignItems: 'center'}}>
                    {item.imagePath === undefined &&
                        <Image style={{width: 20, height: 20, paddingLeft: 20, paddingRight: 20, resizeMode: 'contain'}} source={require('./images/icons8-cd-filled-50.png')}/>
                    }
                    {item.imagePath !== undefined &&
                        <Image style={{width: 35, height: 35, paddingLeft: 20, paddingRight: 20, resizeMode: 'contain'}} source={{uri: item.imagePath}}/>
                    }
                    <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'space-evenly', alignItems: 'stretch', padding: 5}}>
                        <Text style={styles.albumItem}>{item.name}</Text>
                        <Text style={styles.albumItem}>{item.artist}</Text>
                    </View>
                    <Icon name="ios-more" size={20} color="black" style={{ paddingLeft: 20, paddingRight: 20 }}/>
                </View>
            </TouchableOpacity>
        );
    }

    render() {
        if (this.state.selectedTab === 0) {
            return (
                <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'stretch' }}>
                    <View style={{flex: .06, width: "100%"}}>
                        <ButtonGroup
                            onPress={(index) => {
                                this.setState({selectedTab:index});
                            }}
                            selectedIndex={this.state.selectedTab}
                            buttons={['Artists', 'Albums', 'Genres']}
                            containerStyle={{height: 25}}
                            selectedButtonStyle={{backgroundColor: '#3396FF'}}
                            selectedTextStyle={{color: 'white'}}
                        />
                    </View>
                    <View style={{flex: .1, flexDirection: 'row', alignItems: 'center'}}>
                        <View style={{flex: .75}}>
                            <SearchBar
                                clearIcon
                                lightTheme
                                round
                                cancelButtonTitle="Cancel"
                                placeholder='Search'
                                onChangeText={this.search}
                                value={this.state.searchValue}
                            />
                        </View>
                        <View style={{flex: .25}}>
                            <Text style={{fontSize: 15,fontFamily: 'GillSans-Italic'}}>
                                Total : {this.state.artists.length}
                            </Text>
                        </View>
                    </View>

                    <View style={{flex: .84, width: "100%"}}>
                        <FlatList
                            data={this.state.artists}
                            renderItem={this.renderItem}
                            renderSectionHeader={({section}) => <Text style={styles.sectionHeader}>{section.title}</Text>}
                            keyExtractor={item => item.key}
                            ItemSeparatorComponent={this.renderSeparator}
                        />
                    </View>
                    {this.state.loading &&
                        <View style={styles.loading}>
                            <ActivityIndicator size="large" color="#0000ff"/>
                        </View>
                    }
                </View>
            );
        } else if (this.state.selectedTab === 1) {
            return (
                <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'stretch' }}>
                    <View style={{flex: .06, width: "100%"}}>
                        <ButtonGroup
                            onPress={(index) => {
                                this.setState({selectedTab:index});
                            }}
                            selectedIndex={this.state.selectedTab}
                            buttons={['Artists', 'Albums', 'Genres']}
                            containerStyle={{height: 25}}
                            selectedButtonStyle={{backgroundColor: '#3396FF'}}
                            selectedTextStyle={{color: 'white'}}
                        />
                    </View>
                    <View style={{flex: .1, flexDirection: 'row', alignItems: 'center'}}>
                        <View style={{flex: .75}}>
                            <SearchBar
                                clearIcon
                                lightTheme
                                round
                                cancelButtonTitle="Cancel"
                                placeholder='Search'
                                onChangeText={this.searchAlbums}
                                value={this.state.searchAlbumValue}
                            />
                        </View>
                        <View style={{flex: .25}}>
                            <Text style={{fontSize: 15,fontFamily: 'GillSans-Italic'}}>
                                Total : {this.state.realTotal}
                            </Text>
                        </View>
                    </View>
                    <View style={{flex: .84, width: "100%"}}>
                        <FlatList
                            data={this.state.albums}
                            renderItem={this.renderAlbumItem}
                            renderSectionHeader={({section}) => <Text style={styles.sectionHeader}>{section.title}</Text>}
                            keyExtractor={item => item.key}
                            ItemSeparatorComponent={this.renderSeparator}
                        />
                    </View>
                    {this.state.loading &&
                        <View style={styles.loading}>
                            <ActivityIndicator size="large" color="#0000ff"/>
                        </View>
                    }
                </View>
            );
        } else if (this.state.selectedTab === 2) {
            return (
                <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'stretch' }}>
                    <View style={{flex: .06, width: "100%"}}>
                        <ButtonGroup
                            onPress={(index) => {
                                this.setState({selectedTab:index});
                            }}
                            selectedIndex={this.state.selectedTab}
                            buttons={['Artists', 'Albums', 'Genres']}
                            containerStyle={{height: 25}}
                            selectedButtonStyle={{backgroundColor: '#3396FF'}}
                            selectedTextStyle={{color: 'white'}}
                        />
                    </View>
                    <View style={{flex: .1, flexDirection: 'row', alignItems: 'center'}}>
                        <View style={{flex: .75}}>
                            <SearchBar
                                clearIcon
                                lightTheme
                                round
                                cancelButtonTitle="Cancel"
                                placeholder='Search'
                                onChangeText={this.searchGenres}
                                value={this.state.searchGenreValue}
                            />
                        </View>
                        <View style={{flex: .25}}>
                            <Text style={{fontSize: 15,fontFamily: 'GillSans-Italic'}}>
                                Total : {this.state.genres.length}
                            </Text>
                        </View>
                    </View>
                    <View style={{flex: .84, width: "100%"}}>
                        <FlatList
                            data={this.state.genres}
                            renderItem={this.renderGenreItem}
                            renderSectionHeader={({section}) => <Text style={styles.sectionHeader}>{section.title}</Text>}
                            keyExtractor={item => item.key}
                            ItemSeparatorComponent={this.renderSeparator}
                        />
                    </View>
                    {this.state.loading &&
                        <View style={styles.loading}>
                            <ActivityIndicator size="large" color="#0000ff"/>
                        </View>
                    }
                </View>
            );
        }
    }
}

const styles = StyleSheet.create({
    item: {
        fontSize: 17,
        fontFamily: 'GillSans-Italic',
        padding: 10
    },
    albumItem: {
        fontSize: 17,
        fontFamily: 'GillSans-Italic',
        padding: 3
    },
    sectionHeader: {
        paddingTop: 2,
        paddingLeft: 10,
        paddingRight: 10,
        paddingBottom: 2,
        fontSize: 14,
        fontWeight: 'bold',
        backgroundColor: 'rgba(247,247,247,1.0)',
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

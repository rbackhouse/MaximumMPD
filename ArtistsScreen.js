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
import { Text, View, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image, InteractionManager, Dimensions } from 'react-native';
import { SearchBar, ButtonGroup } from "react-native-elements";
import { SwipeListView, SwipeRow } from 'react-native-swipe-list-view';
import Icon from 'react-native-vector-icons/Ionicons';
import ActionButton from 'react-native-action-button';

import MPDConnection from './MPDConnection';
import Base64 from './Base64';
import AlbumArt from './AlbumArt';
import Config from './Config';

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
          genreMap: {},
          albums: [],
          albumsFullset: [],
          selectedTab: 0,
          loading: false,
          realTotal: 0,
          maxListSize: 0,
          grid: false,
          numColumns: 1
        };
    }

    componentDidMount() {
        if (!MPDConnection.isConnected()) {
            this.props.navigation.navigate('Settings');
            this.props.navigation.navigate('Connections');
        }

        Config.isUseGrdiView()
        .then((useGridView) => {
            if (useGridView) {
                this.setState({grid: true});
            }
        });

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
        Config.getMaxListSize()
        .then((size) => {
            //this.setState({maxListSize: size});
        });
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
            });
            AlbumArt.getAlbumArtForAlbums(albums).then((albums) => {
                this.setState({albums: this.subset(albums), albumsFullset: albums});
            });
            let genreList = [];
            let index = 0;
            for (let genre in genres) {
                genreList.push({
                    key: ""+(++index),
                    name: genre
                });
            }

            this.setState({genres: genreList, genresFullset: genreList, genreMap: genres});
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

    onAlbumPress(item) {
        const { navigation } = this.props;
        navigation.navigate('Songs', {artist: item.artist, album: item.name});
    }

    subset(albums) {
        this.setState({realTotal: albums.length});
        const maxListSize = this.state.maxListSize;
        if (maxListSize === 0) {
            return albums;
        }
        if (albums.length > maxListSize) {
            return albums.slice(0, maxListSize);
        } else {
            return albums;
        }
    }

    genreAlbums(rowMap, item) {
        if (rowMap[item.key]) {
			rowMap[item.key].closeRow();
		}
        const albumNames = this.state.genreMap[item.name];

        let albums = [];
        albumNames.forEach((albumName) => {
            let artist;
            this.state.albumsFullset.forEach((album) => {
                if (album.name === albumName) {
                    artist = album.artist;
                }
            })
            albums.push({name: albumName, artist: artist});
        });

        const { navigation } = this.props;
        navigation.navigate('Albums', {albums: albums, genre: item.name});
    }

    genreSongs(rowMap, item) {
        if (rowMap[item.key]) {
			rowMap[item.key].closeRow();
		}
        const { navigation } = this.props;
        navigation.navigate('Songs', {genre: item.name});
    }

    changeTab(index) {
        let numColumns = 1;
        const {height, width} = Dimensions.get('window');
        if (index === 1 && this.state.grid) {
            numColumns = width > 375 ? 3 : 2;
        }
        this.setState({
            selectedTab: index,
            numColumns: numColumns
        });
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
                <View style={{flex: 1, flexDirection: 'row', alignItems: 'center', height: 65 }}>
                    <View style={{paddingLeft: 10}}/>
                    {item.imagePath === undefined &&
                        <Image style={{width: 20, height: 20, paddingLeft: 20, paddingRight: 35, resizeMode: 'contain'}} source={require('./images/icons8-dj-30.png')}/>
                    }
                    {item.imagePath !== undefined &&
                        <Image style={{width: 55, height: 55, paddingLeft: 20, paddingRight: 20, resizeMode: 'contain'}} source={{uri: item.imagePath}}/>
                    }
                    <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'space-evenly', alignItems: 'stretch', padding: 5}}>
                        <Text style={styles.item}>{item.name}</Text>
                    </View>
                    <Icon name="ios-more" size={20} color="black" style={{ paddingLeft: 20, paddingRight: 20 }}/>
                </View>
            </TouchableOpacity>
        );
    };

    renderGenreItem = (data, map) => {
        const item = data.item;
        return (
            <SwipeRow rightOpenValue={-150}>
                <View style={styles.rowBack}>
                    <TouchableOpacity style={[styles.backRightBtn, styles.backRightBtnLeft]} onPress={ _ => this.genreAlbums(map, item) }>
                        <Text style={styles.backTextWhite}>Albums</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.backRightBtn, styles.backRightBtnRight]} onPress={ _ => this.genreSongs(map, item) }>
                        <Text style={styles.backTextWhite}>Songs</Text>
                    </TouchableOpacity>
                </View>
                <View style={[{flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent:'space-between'}, styles.rowFront]}>
                    <Image style={{width: 20, height: 20, paddingLeft: 20, paddingRight: 20, resizeMode: 'contain'}} source={require('./images/icons8-cd-filled-50.png')}/>
                    <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'space-evenly', alignItems: 'stretch', padding: 5}}>
                        <Text style={styles.item}>{item.name}</Text>
                    </View>
                    <Icon name="ios-swap" size={20} color="black" style={{ paddingLeft: 20, paddingRight: 20 }}/>
                </View>
            </SwipeRow>
        );
    }

    renderAlbumItem = ({item}) => {
        return (
            <TouchableOpacity onPress={this.onAlbumPress.bind(this, item)}>
                <View style={{flex: 1, flexDirection: 'row', alignItems: 'center', height: 65 }}>
                    <View style={{paddingLeft: 10}}/>
                    {item.imagePath === undefined &&
                        <Image style={{width: 20, height: 20, paddingLeft: 20, paddingRight: 35, resizeMode: 'contain'}} source={require('./images/icons8-cd-filled-50.png')}/>
                    }
                    {item.imagePath !== undefined &&
                        <Image style={{width: 55, height: 55, paddingLeft: 20, paddingRight: 20, resizeMode: 'contain'}} source={{uri: item.imagePath}}/>
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

    renderGridAlbumItem = ({item}) => {
        const size = Dimensions.get('window').width/this.state.numColumns;
        const gridStyles = StyleSheet.create({
          itemContainer: {
            width: size,
            height: size,
            alignItems: 'center'
          }
        });

        return (
            <TouchableOpacity onPress={this.onAlbumPress.bind(this, item)}>
                <View style={gridStyles.itemContainer}>
                    {item.imagePath === undefined &&
                        <Image style={{width: size-30, height: size-30, paddingLeft: 5, paddingRight: 5, resizeMode: 'contain'}} source={require('./images/cd-large.png')}/>
                    }
                    {item.imagePath !== undefined &&
                        <Image style={{width: size-30, height: size-30, paddingLeft: 5, paddingRight: 5, resizeMode: 'contain'}} source={{uri: item.imagePath}}/>
                    }
                    <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'space-evenly', alignItems: 'center', paddingTop: 5, paddingBottom: 5, paddingLeft: 5, paddingRight: 5}}>
                        <Text numberOfLines={1} ellipsizeMode='tail' style={styles.albumGridItem}>{item.name}</Text>
                        <Text numberOfLines={1} ellipsizeMode='tail' style={styles.albumGridItem}>{item.artist}</Text>
                    </View>
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
                                this.changeTab(index);
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
                            key={this.state.numColumns}
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
                                this.changeTab(index);
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
                        {this.state.grid === false &&
                            <FlatList
                                data={this.state.albums}
                                renderItem={this.renderAlbumItem}
                                renderSectionHeader={({section}) => <Text style={styles.sectionHeader}>{section.title}</Text>}
                                keyExtractor={item => item.key}
                                ItemSeparatorComponent={this.renderSeparator}
                                key={this.state.numColumns}
                            />
                        }
                        {this.state.grid === true &&
                            <FlatList
                                data={this.state.albums}
                                renderItem={this.renderGridAlbumItem}
                                keyExtractor={item => item.key}
                                numColumns={this.state.numColumns}
                                columnWrapperStyle={styles.row}
                                key={this.state.numColumns}
                            />
                        }
                    </View>
                    <ActionButton buttonColor="rgba(231,76,60,1)">
                        <ActionButton.Item buttonColor='#3498db' title="List View" size={40} textStyle={styles.actionButtonText} onPress={() => {this.setState({grid: false, numColumns: 1});}}>
                            <Icon name="ios-list" size={20} color="white"/>
                        </ActionButton.Item>
                        <ActionButton.Item buttonColor='#9b59b6' title="Grid View" size={40} textStyle={styles.actionButtonText} onPress={() => {
                            const {height, width} = Dimensions.get('window');
                            numColumns = width > 375 ? 3 : 2;
                            this.setState({grid: true, numColumns: numColumns});
                        }}>
                            <Icon name="ios-grid" size={20} color="white"/>
                        </ActionButton.Item>
                    </ActionButton>
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
                                this.changeTab(index);
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
                        <SwipeListView
        					useFlatList
                            data={this.state.genres}
                            keyExtractor={item => item.key}
                            renderItem={this.renderGenreItem}
                            renderSectionHeader={({section}) => <Text style={styles.sectionHeader}>{section.title}</Text>}
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
    albumGridItem: {
        fontSize: 13,
        fontFamily: 'GillSans-Italic'
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
    actionButtonText: {
        fontSize: 13,
        fontFamily: 'GillSans-Italic'
    },
    row: {
        flex: 1,
        justifyContent: "space-around"
    }
});

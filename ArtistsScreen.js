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
import { Text, View, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image, Dimensions, Appearance, ActionSheetIOS, Platform } from 'react-native';
import { SearchBar, ButtonGroup } from "@rneui/themed";
import { SwipeListView, SwipeRow } from 'react-native-swipe-list-view';
import Icon from 'react-native-vector-icons/Ionicons';
import EntypoIcon from 'react-native-vector-icons/Entypo';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import ActionButton from 'react-native-action-button';
import { ActionSheetCustom as ActionSheet } from 'react-native-actionsheet';

import MPDConnection from './MPDConnection';
import AlbumArt from './AlbumArt';
import Config from './Config';
import { StyleManager } from './Styles';
import NewPlaylistModal from './NewPlaylistModal';

class AlbumListItem extends React.PureComponent {
    constructor(props) {
        super(props);
    }

    onAlbumPress(item) {
        this.props.onAlbumPress(item);
    }

    onLongPress(item) {
        this.props.onLongPress(item);
    }

    render() {
        const styles = StyleManager.getStyles("artistsStyles");
        const common = StyleManager.getStyles("styles");
        const item = this.props.albumItem;
        return (
            <TouchableOpacity onPress={this.onAlbumPress.bind(this, item)} onLongPress={this.onLongPress.bind(this, item)}>
                <View onLayout={(event) => {
                    const {x, y, width, height} = event.nativeEvent.layout;
                    this.props.setAlbumRowHeight(height+1);
                }} style={styles.itemContainer}>
                    <View style={styles.paddingLeft}/>
                    {item.imagePath === undefined &&
                        <FontAwesome5 name="compact-disc" size={20} style={common.icon}/>
                    }
                    {item.imagePath !== undefined &&
                        <Image style={styles.iconAlbumArt} source={{uri: item.imagePath}}/>
                    }
                    <View style={styles.itemTextContainer}>
                        <Text style={styles.albumItem}>{item.name}</Text>
                        <Text style={styles.albumItem}>{item.artist}</Text>
                    </View>
                    <EntypoIcon name="dots-three-horizontal" size={20} style={common.icon}/>
                </View>
            </TouchableOpacity>    
        );
    }
}

class GridAlbumListItem extends React.PureComponent {
    constructor(props) {
        super(props);
    }

    onAlbumPress(item) {
        this.props.onAlbumPress(item);
    }

    onLongPress(item) {
        this.props.onLongPress(item);
    }

    render() {
        const styles = StyleManager.getStyles("artistsStyles");
        const item = this.props.albumItem;
        const size = Dimensions.get('window').width/this.props.numColumns;
        const gridStyles = StyleSheet.create({
          itemContainer: {
            width: size,
            height: size,
            alignItems: 'center'
          }
        });

        return (
            <TouchableOpacity onPress={this.onAlbumPress.bind(this, item)} onLongPress={this.onLongPress.bind(this, item)}>
                <View style={gridStyles.itemContainer}>
                    {item.imagePath === undefined &&
                        <Image style={{width: size-30, height: size-30, paddingLeft: 5, paddingRight: 5, resizeMode: 'contain'}} source={require('./images/cd-large.png')}/>
                    }
                    {item.imagePath !== undefined &&
                        <Image style={{width: size-30, height: size-30, paddingLeft: 5, paddingRight: 5, resizeMode: 'contain'}} source={{uri: item.imagePath}}/>
                    }
                    <View style={styles.gridItem}>
                        <Text numberOfLines={1} ellipsizeMode='tail' style={styles.albumGridItem}>{item.name}</Text>
                        <Text numberOfLines={1} ellipsizeMode='tail' style={styles.albumGridItem}>{item.artist}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    }
}

class ArtistListItem extends React.PureComponent {
    constructor(props) {
        super(props);
    }

    onPress(item) {
        this.props.onPress(item);
    }

    render() {
        const styles = StyleManager.getStyles("artistsStyles");
        const common = StyleManager.getStyles("styles");
        const item = this.props.artistItem;
        return (
            <TouchableOpacity onPress={this.onPress.bind(this, item)}>
                <View onLayout={(event) => {
                    const {x, y, width, height} = event.nativeEvent.layout;
                    this.props.setArtistRowHeight(height+1);
                }} style={styles.itemContainer}>
                    <View style={styles.paddingLeft}/>
                    {item.imagePath === undefined &&
                        <MaterialCommunityIcon name="account-music" size={20} style={common.icon}/>
                    }
                    {item.imagePath !== undefined &&
                        <Image style={styles.iconAlbumArt} source={{uri: item.imagePath}}/>
                    }
                    <View style={styles.itemTextContainer}>
                        <Text style={styles.item}>{item.name}</Text>
                    </View>
                    <EntypoIcon name="dots-three-horizontal" size={20} style={common.icon}/>
                </View>
            </TouchableOpacity>
        );
    }
}

class GenreListItem extends React.PureComponent {
    constructor(props) {
        super(props);
    }

    genreAlbums() {
        this.props.genreAlbums(this.props.genreMap, this.props.genreItem);
    }

    genreSongs(item) {
        this.props.genreSongs(this.props.genreMap, this.props.genreItem);
    }

    render() {
        const styles = StyleManager.getStyles("artistsStyles");
        const common = StyleManager.getStyles("styles");
        const item = this.props.genreItem;
        return (
            <SwipeRow rightOpenValue={-150}>
                <View style={common.rowBack}>
                    <TouchableOpacity style={[common.backRightBtn, common.backRightBtnLeft]} onPress={ _ => this.genreAlbums() }>
                        <Text style={common.backTextWhite}>Albums</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[common.backRightBtn, common.backRightBtnRight]} onPress={ _ => this.genreSongs() }>
                        <Text style={common.backTextWhite}>Songs</Text>
                    </TouchableOpacity>
                </View>
                <View style={[styles.genreContainer, common.rowFront]}>
                    <MaterialCommunityIcon name="guitar-acoustic" size={20} style={common.icon}/>
                    <View style={styles.itemTextContainer}>
                        <Text style={styles.item}>{item.name}</Text>
                    </View>
                    <Icon name="swap-horizontal" size={20} style={common.icon}/>
                </View>
            </SwipeRow>
        );
    }
}

export default class ArtistsScreen extends React.Component {
    static navigationOptions = ({ navigation }) => {
        return {
            title: "Browse"
        };
    };

    constructor(props) {
        super(props);
        this.artistRowHeight = 60;
        this.albumRowHeight = 60;

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
          numColumns: 1,
          defaultArtistSort: true,
          defaultAlbumSort: true,
          defaultGenreSort: true,
          modalVisible: false,
          selectedItem: {}
        };
    }

    componentDidMount() {
        if (!MPDConnection.isConnected()) {
            this.props.navigation.navigate('Settings');
            this.props.navigation.navigate('Connections');
        }

        Config.getGridViewConfig()
        .then((gridViewConfig) => {
            if (gridViewConfig[0]) {
                this.setState({grid: true});
            }
        });

        const { navigation } = this.props;
        navigation.setParams({ sort: this.sort });

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
            (album) => {
                let idx = this.state.fullset.findIndex((a) => {return a.name === album.artist});
                if (idx !== -1 && this.state.fullset[idx].imagePath === undefined) {
                    this.state.fullset[idx].imagePath = album.path;
                    this.setState({artists: this.state.artists, fullset: this.state.fullset});
                }
                idx = this.state.albumsFullset.findIndex((a) => {return a.name === album.name && a.artist === album.artist});
                if (idx !== -1) {
                    this.state.albumsFullset[idx].imagePath = album.path;
                    this.setState({albums: this.subset(this.state.albumsFullset), albumsFullset: this.state.albumsFullset});
                }
            }
        );
        this.onAlbumArtError = AlbumArt.getEventEmitter().addListener(
            "OnAlbumArtError",
            (details) => {
                let idx = this.state.fullset.findIndex((a) => {return a.name === details.album.artist});
                if (idx !== -1 && this.state.fullset[idx].imagePath === undefined) {
                    this.state.fullset[idx].imagePath = undefined;
                    this.setState({artists: this.state.artists, fullset: this.state.fullset});
                }
                idx = this.state.albumsFullset.findIndex((a) => {return a.name === details.album.name && a.artist === details.album.artist});
                if (idx !== -1) {
                    this.state.albumsFullset[idx].imagePath = undefined;
                    this.setState({albums: this.subset(this.state.albumsFullset), albumsFullset: this.state.albumsFullset});
                }
            }
        );
        this.onAlbumArtComplete = AlbumArt.getEventEmitter().addListener(
            "OnAlbumArtComplete",
            () => {
                this.updateAlbumArt();
            }
        );

        this.onApperance = Appearance.addChangeListener(({ colorScheme }) => {
            this.setState({loading: this.state.loading});
        });

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
                    artist.imagePath = artMap[artist.name];
                }
            })
            this.setState({artists: this.state.artists, fullset: this.state.fullset});
        });

        AlbumArt.getAlbumArtForAlbums(this.state.albumsFullset).then((albums) => {
            this.setState({albums: this.subset(albums), albumsFullset: albums});
        });
    }

    load() {
        Config.getSortSettings()
        .then((sortSettings) => {
            const allArtist = MPDConnection.current().getAllArtists();
            const allAlbums = MPDConnection.current().getAllAlbums(true, sortSettings.albumSortByArtist);
            const allGenres = MPDConnection.current().getAllGenres();

            this.setState({loading: true, defaultAlbumSort: !sortSettings.albumSortByArtist});

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
                            artist.imagePath = artMap[artist.name];
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
                genreList.sort((a,b) => {
                    if (a.name < b.name) {
                        return -1;
                    } else if (a.name > b.name) {
                        return 1;
                    } else {
                        return 0;
                    }
                });
                this.setState({genres: genreList, genresFullset: genreList, genreMap: genres});
            })
            .catch((err) => {
                this.setState({loading: false});
                Alert.alert(
                    "MPD Error",
                    "Error : "+err
                );
            });
        });
    }

    componentWillUnmount() {
        this.onConnect.remove();
        this.onDisconnect.remove();
        this.onAlbumArtEnd.remove();
        this.onAlbumArtComplete.remove();
        this.onAlbumArtError.remove();
        if (this.onApperance) {
            this.onApperance.remove();
        }
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

    sort = () => {
        if (this.state.selectedTab === 0) {
            const useDefault = !this.state.defaultArtistSort;
            this.setState({defaultArtistSort: useDefault});
            this.state.artists.sort((a,b) => {
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
					return useDefault ? -1 : 1;
				} else if (artist1 > artist2) {
					return useDefault ? 1 : -1;
				} else {
					return 0;
				}
            });
            this.setState({artists: this.state.artists});
        } else if (this.state.selectedTab === 1) {
            const useDefault = !this.state.defaultAlbumSort;
            this.setState({defaultAlbumSort: useDefault});
            this.state.albums.sort((a,b) => {
                comp1 = a.name;
                comp2 = b.name;
                if (!useDefault && a.artist && b.artist) {
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
            this.setState({albums: this.state.albums});
        } else if (this.state.selectedTab === 2) {
            const useDefault = !this.state.defaultGenreSort;
            this.setState({defaultGenreSort: useDefault});
            this.state.genres.sort((a,b) => {
				if (a.name < b.name) {
					return useDefault ? -1 : 1;
				} else if (a.name > b.name) {
					return useDefault ? 1 : -1;
				} else {
					return 0;
				}
            });
            this.setState({genres: this.state.genres});
        }
    };

    onPress(item) {
        const { navigation } = this.props;
        navigation.navigate('Albums', {artist: item.name});
    }

    onAlbumPress(item) {
        const { navigation } = this.props;
        navigation.navigate('Songs', {album: item.name});
    }

    onLongPress(item) {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions({
                options: ['Add to Queue', 'Add to Playlist', 'Reload Album Art', 'Cancel'],
                title: item.artist,
                message: item.name,
                cancelButtonIndex: 3
            }, (idx) => {
                this.doActionSheetAction(idx, item);
            });
        } else {
            this.currentItem = item;
            this.ActionSheet.show();            
        }    
    }

    doActionSheetAction(idx, i) {
        const item = i || this.currentItem;
        switch (idx) {
            case 0:
                this.setState({loading: true});
                MPDConnection.current().addAlbumToPlayList(item.name, item.artist)
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
                break;
            case 1:
                this.setState({modalVisible: true, selectedItem: {artist: item.artist, album: item.name}});
                break;
            case 2:
                this.setState({loading: true});
                AlbumArt.reloadAlbumArt(item.name, item.artist)
                .then(()=> {
                    this.setState({loading: false});
                })
                .catch((err) => {
                    this.setState({loading: false});
                });
                break;
        }
        this.currentItem = undefined;
    }

    finishAdd(name, selectedItem) {
        this.setState({modalVisible: false});
        MPDConnection.current().setCurrentPlaylistName(name);
        this.setState({loading: true});

        MPDConnection.current().addAlbumToNamedPlayList(selectedItem.album, selectedItem.artist, MPDConnection.current().getCurrentPlaylistName())
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
        const albums = this.state.genreMap[item.name];

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
        const {height, width} = Dimensions.get('window');
        if (index === 1 && this.state.grid) {
            Config.getGridViewColumns()
            .then((numColumns) => {
                this.setState({
                    selectedTab: index,
                    numColumns: numColumns
                });
            });
        } else {
            this.setState({
                selectedTab: index,
                numColumns: 1
            });
        }
    }

    renderSeparator = () => {
        const common = StyleManager.getStyles("styles");

        return (
            <View
                style={common.separator}
            />
        );
    };

    renderItem = ({item}) => {
        const styles = StyleManager.getStyles("artistsStyles");
        const common = StyleManager.getStyles("styles");
        return (
            <TouchableOpacity onPress={this.onPress.bind(this, item)}>
                <View onLayout={(event) => {
                    const {x, y, width, height} = event.nativeEvent.layout;
                    this.artistRowHeight = height+1;
                }} style={styles.itemContainer}>
                    <View style={styles.paddingLeft}/>
                    {item.imagePath === undefined &&
                        <MaterialCommunityIcon name="account-music" size={20} style={common.icon}/>
                    }
                    {item.imagePath !== undefined &&
                        <Image style={styles.iconAlbumArt} source={{uri: item.imagePath}}/>
                    }
                    <View style={styles.itemTextContainer}>
                        <Text style={styles.item}>{item.name}</Text>
                    </View>
                    <EntypoIcon name="dots-three-horizontal" size={20} style={common.icon}/>
                </View>
            </TouchableOpacity>
        );
    };

    renderGenreItem = (data, map) => {
        const styles = StyleManager.getStyles("artistsStyles");
        const common = StyleManager.getStyles("styles");
        const item = data.item;
        return (
            <SwipeRow rightOpenValue={-150}>
                <View style={common.rowBack}>
                    <TouchableOpacity style={[common.backRightBtn, common.backRightBtnLeft]} onPress={ _ => this.genreAlbums(map, item) }>
                        <Text style={common.backTextWhite}>Albums</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[common.backRightBtn, common.backRightBtnRight]} onPress={ _ => this.genreSongs(map, item) }>
                        <Text style={common.backTextWhite}>Songs</Text>
                    </TouchableOpacity>
                </View>
                <View style={[styles.genreContainer, common.rowFront]}>
                    <MaterialCommunityIcon name="guitar-acoustic" size={20} style={common.icon}/>
                    <View style={styles.itemTextContainer}>
                        <Text style={styles.item}>{item.name}</Text>
                    </View>
                    <Icon name="swap-horizontal" size={20} style={common.icon}/>
                </View>
            </SwipeRow>
        );
    }
 
/*
    renderAlbumItem = ({item}) => {
        const styles = StyleManager.getStyles("artistsStyles");
        const common = StyleManager.getStyles("styles");
        return (
            <TouchableOpacity onPress={this.onAlbumPress.bind(this, item)} onLongPress={this.onLongPress.bind(this, item)}>
                <View onLayout={(event) => {
                    const {x, y, width, height} = event.nativeEvent.layout;
                    this.albumRowHeight = height+1;
                }} style={styles.itemContainer}>
                    <View style={styles.paddingLeft}/>
                    {item.imagePath === undefined &&
                        <FontAwesome5 name="compact-disc" size={20} style={common.icon}/>
                    }
                    {item.imagePath !== undefined &&
                        <Image style={styles.iconAlbumArt} source={{uri: item.imagePath}}/>
                    }
                    <View style={styles.itemTextContainer}>
                        <Text style={styles.albumItem}>{item.name}</Text>
                        <Text style={styles.albumItem}>{item.artist}</Text>
                    </View>
                    <EntypoIcon name="dots-three-horizontal" size={20} style={common.icon}/>                    
                </View>
            </TouchableOpacity>
        );
    }
*/
    renderAlbumItem = ({item}) => {
        return (
            <AlbumListItem 
                albumItem={item} 
                onAlbumPress={(item) => {this.onAlbumPress(item);}} 
                onLongPress={(item) => {this.onLongPress(item);}} 
                setAlbumRowHeight={(height) => {this.albumRowHeight = height;}}/>
        );
    }

/*
    renderGridAlbumItem = ({item}) => {
        const styles = StyleManager.getStyles("artistsStyles");
        const common = StyleManager.getStyles("styles");

        const size = Dimensions.get('window').width/this.state.numColumns;
        const gridStyles = StyleSheet.create({
          itemContainer: {
            width: size,
            height: size,
            alignItems: 'center'
          }
        });

        return (
            <TouchableOpacity onPress={this.onAlbumPress.bind(this, item)} onLongPress={this.onLongPress.bind(this, item)}>
                <View style={gridStyles.itemContainer}>
                    {item.imagePath === undefined &&
                        <Image style={{width: size-30, height: size-30, paddingLeft: 5, paddingRight: 5, resizeMode: 'contain'}} source={require('./images/cd-large.png')}/>
                    }
                    {item.imagePath !== undefined &&
                        <Image style={{width: size-30, height: size-30, paddingLeft: 5, paddingRight: 5, resizeMode: 'contain'}} source={{uri: item.imagePath}}/>
                    }
                    <View style={styles.gridItem}>
                        <Text numberOfLines={1} ellipsizeMode='tail' style={styles.albumGridItem}>{item.name}</Text>
                        <Text numberOfLines={1} ellipsizeMode='tail' style={styles.albumGridItem}>{item.artist}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    }
*/    

    renderGridAlbumItem = ({item}) => {
        return (
            <GridAlbumListItem 
                numColumns={this.state.numColumns} 
                albumItem={item} 
                onAlbumPress={(item) => {this.onAlbumPress(item);}} 
                onLongPress={(item) => {this.onLongPress(item);}}/>
        );
    }

/*
    renderItem = ({item}) => {
        return (
            <ArtistListItem 
                artistItem={item} 
                onPress={(item) => {this.onPress(item);}} 
                setArtistRowHeight={(height) => {this.artistRowHeight = height;}}/>
        );
    };

    renderGenreItem = (data, map) => {
        const item = data.item;
        return (
            <GenreListItem
                genreItem={item}
                genreMap={map} 
                genreAlbums={(map, item) => {this.genreAlbums(map, item);}} 
                genreSongs={(map, item) => {this.genreSongs(map, item);}}/>
        );
    }
*/
    getArtistItemLayout = (item, index) => {
        return {offset: this.artistRowHeight * index, length: this.artistRowHeight, index: index};
    }

    getAlbumItemLayout = (item, index) => {
        return {offset: this.albumRowHeight * index, length: this.albumRowHeight, index: index};
    }

    render() {
        const styles = StyleManager.getStyles("artistsStyles");
        const common = StyleManager.getStyles("styles");
        const {height, width} = Dimensions.get('window');
        let bg = .07;
        let sb = .1;
        let fl = .84;

        if (width < 321) {
            bg = .1;
            fl = .8;
        }
        if (this.state.selectedTab === 0) {
            return (
                <View style={common.container1}>
                    <View style={{flex: bg, width: "100%"}}>
                        <ButtonGroup
                            onPress={(index) => {
                                this.changeTab(index);
                            }}
                            selectedIndex={this.state.selectedTab}
                            buttons={['Artists', 'Albums', 'Genres']}
                            containerStyle={common.containerStyle}
                            selectedButtonStyle={common.selectedButtonStyle}
                            selectedTextStyle={common.selectedTextStyle}
                        />
                    </View>
                    <View style={{flex: sb, flexDirection: 'row', alignItems: 'center'}}>
                        <View style={common.flex75}>
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
                        <View style={common.flex25}>
                            <Text style={common.text}>
                                Total : {this.state.artists.length}
                            </Text>
                        </View>
                    </View>

                    <View style={{flex: fl, width: "100%"}}>
                        <FlatList
                            data={this.state.artists}
                            renderItem={this.renderItem}
                            renderSectionHeader={({section}) => <Text style={common.sectionHeader}>{section.title}</Text>}
                            keyExtractor={item => item.key}
                            ItemSeparatorComponent={this.renderSeparator}
                            key={this.state.numColumns}
                            getItemLayout={this.getArtistItemLayout}
                       />
                    </View>
                    {this.state.loading &&
                        <View style={common.loading}>
                            <ActivityIndicator size="large" color="#0000ff"/>
                        </View>
                    }
                </View>
            );
        } else if (this.state.selectedTab === 1) {
            return (
                <View style={common.container1}>
                    <View style={{flex: bg, width: "100%"}}>
                        <ButtonGroup
                            onPress={(index) => {
                                this.changeTab(index);
                            }}
                            selectedIndex={this.state.selectedTab}
                            buttons={['Artists', 'Albums', 'Genres']}
                            containerStyle={common.containerStyle}
                            selectedButtonStyle={common.selectedButtonStyle}
                            selectedTextStyle={common.selectedTextStyle}
                        />
                    </View>
                    <View style={{flex: sb, flexDirection: 'row', alignItems: 'center'}}>
                        <View style={common.flex75}>
                            <SearchBar
                                clearIcon
                                lightTheme
                                round
                                platform="ios"
                                cancelButtonTitle="Cancel"
                                placeholder='Search'
                                onChangeText={this.searchAlbums}
                                value={this.state.searchAlbumValue}
                                containerStyle={common.searchbarContainer}
                                inputContainerStyle={common.searchbarInputContainer}
                                inputStyle={common.searchbarInput}
                            />
                        </View>
                        <View style={common.flex25}>
                            <Text style={common.text}>
                                Total : {this.state.realTotal}
                            </Text>
                        </View>
                    </View>
                    <View style={{flex: fl, width: "100%"}}>
                        {this.state.grid === false &&
                            <FlatList
                                data={this.state.albums}
                                renderItem={this.renderAlbumItem}
                                renderSectionHeader={({section}) => <Text style={common.sectionHeader}>{section.title}</Text>}
                                keyExtractor={item => item.key}
                                ItemSeparatorComponent={this.renderSeparator}
                                key={this.state.numColumns}
                                getItemLayout={this.getAlbumItemLayout}
                            />
                        }
                        {this.state.grid === true &&
                            <FlatList
                                data={this.state.albums}
                                renderItem={this.renderGridAlbumItem}
                                keyExtractor={item => item.key}
                                numColumns={this.state.numColumns}
                                columnWrapperStyle={common.row}
                                key={this.state.numColumns}
                            />
                        }
                    </View>
                    <NewPlaylistModal visible={this.state.modalVisible} selectedItem={this.state.selectedItem} onSet={(name, selectedItem) => {this.finishAdd(name, selectedItem);}} onCancel={() => this.setState({modalVisible: false})}></NewPlaylistModal>
                    {Platform.OS === 'android' &&
                        <ActionSheet
                            ref={o => this.ActionSheet = o}
                            options={['Add to Queue', 'Add to Playlist', 'Reload Album Art', 'Cancel']}
                            cancelButtonIndex={3}
                            onPress={(idx) => { 
                                this.doActionSheetAction(idx);
                            }}
                        />
                    }
                    <ActionButton buttonColor="rgba(231,76,60,1)" hideShadow={true}>
                        <ActionButton.Item buttonColor='#3498db' title="List View" size={40} textStyle={common.actionButtonText} onPress={() => {this.setState({grid: false, numColumns: 1});}}>
                            <Icon name="ios-list" size={20} color="white"/>
                        </ActionButton.Item>
                        <ActionButton.Item buttonColor='#9b59b6' title="Grid View" size={40} textStyle={common.actionButtonText} onPress={() => {
                            Config.getGridViewColumns()
                            .then((numColumns) => {
                                this.setState({grid: true, numColumns: numColumns});
                            });
                        }}>
                            <Icon name="ios-grid" size={20} color="white"/>
                        </ActionButton.Item>
                    </ActionButton>
                    {this.state.loading &&
                        <View style={common.loading}>
                            <ActivityIndicator size="large" color="#0000ff"/>
                        </View>
                    }
                </View>
            );
        } else if (this.state.selectedTab === 2) {
            return (
                <View style={common.container1}>
                    <View style={{flex: bg, width: "100%"}}>
                        <ButtonGroup
                            onPress={(index) => {
                                this.changeTab(index);
                            }}
                            selectedIndex={this.state.selectedTab}
                            buttons={['Artists', 'Albums', 'Genres']}
                            containerStyle={common.containerStyle}
                            selectedButtonStyle={common.selectedButtonStyle}
                            selectedTextStyle={common.selectedTextStyle}
                        />
                    </View>
                    <View style={{flex: sb, flexDirection: 'row', alignItems: 'center'}}>
                        <View style={common.flex75}>
                            <SearchBar
                                clearIcon
                                lightTheme
                                round
                                platform="ios"
                                cancelButtonTitle="Cancel"
                                placeholder='Search'
                                onChangeText={this.searchGenres}
                                value={this.state.searchGenreValue}
                                containerStyle={common.searchbarContainer}
                                inputContainerStyle={common.searchbarInputContainer}
                                inputStyle={common.searchbarInput}    
                            />
                        </View>
                        <View style={common.flex25}>
                            <Text style={common.text}>
                                Total : {this.state.genres.length}
                            </Text>
                        </View>
                    </View>
                    <View style={{flex: fl, width: "100%"}}>
                        <SwipeListView
        					useFlatList
                            data={this.state.genres}
                            keyExtractor={item => item.key}
                            renderItem={this.renderGenreItem}
                            renderSectionHeader={({section}) => <Text style={common.sectionHeader}>{section.title}</Text>}
                            ItemSeparatorComponent={this.renderSeparator}
                        />
                    </View>
                    {this.state.loading &&
                        <View style={common.loading}>
                            <ActivityIndicator size="large" color="#0000ff"/>
                        </View>
                    }
                </View>
            );
        }
    }
}

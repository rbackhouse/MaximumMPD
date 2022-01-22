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
import { SearchBar } from "react-native-elements";
import Icon from 'react-native-vector-icons/Ionicons';
import FAIcon from 'react-native-vector-icons/FontAwesome';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import EntypoIcon from 'react-native-vector-icons/Entypo';
import ActionButton from 'react-native-action-button';
import { ActionSheetCustom as ActionSheet } from 'react-native-actionsheet';

import MPDConnection from './MPDConnection';
import AlbumArt from './AlbumArt';
import NewPlaylistModal from './NewPlaylistModal';
import Config from './Config';
import { StyleManager } from './Styles';
import Base64 from './Base64';

export default class AlbumsScreen extends React.Component {
    static navigationOptions = ({ navigation }) => {
        const artist = navigation.getParam('artist');
        const genre = navigation.getParam('genre');
        let title;
        if (!artist) {
            title = "Albums ("+genre+")";
        } else {
            title = "Albums ("+artist+")";
        }
        return {
            title: title
        };
    };

    constructor(props) {
        super(props);
        this.rowHeight = 60;

        this.state = {
          searchValue: "",
          albums: [],
          fullset: [],
          loading: false,
          modalVisible: false,
          grid: false,
          numColumns: 1
        };
    }

    componentDidMount() {
        const { navigation } = this.props;
        Config.getGridViewConfig()
        .then((gridViewConfig) => {
            if (gridViewConfig[0]) {
                this.setState({grid: true, numColumns: gridViewConfig[1]});
            }
        });
        const artist = navigation.getParam('artist');
        const albums = navigation.getParam('albums');
        if (artist) {
            this.setState({loading: true});
            Config.isSortAlbumsByDate()
            .then((sortAlbumsByDate) => {
                const a = MPDConnection.current().getSongCountWithNoAlbum(artist);
                const b = MPDConnection.current().getAlbumsForArtist(artist, sortAlbumsByDate);
    
                Promise.all([a, b])                    
                .then((results) => {
                    this.setState({loading: false});
                    let noAlbumCount = results[0];
                    let albums = results[1];
                    if (noAlbumCount > 0) {
                        albums.push({name: "No Album", artist: artist, hasNoAlbum: true});
                    }
                    albums.forEach((album, id)=> {
                        album.id = id.toString();
                    })
                    AlbumArt.getAlbumArtForAlbums(albums).then((albums) => {
                        this.setState({albums: albums, fullset: albums});
                    });
                })
                .catch((err) => {
                    this.setState({loading: false});
                    Alert.alert(
                        "MPD Error",
                        "Error : "+err
                    );
                });
            })
        } else {
            AlbumArt.getAlbumArtForAlbums(albums).then((albums) => {
                this.setState({albums: albums, fullset: albums});
            });
        }
        this.onDisconnect = MPDConnection.getEventEmitter().addListener(
            "OnDisconnect",
            () => {
                this.setState({albums: [], fullset: []});
                this.props.navigation.popToTop();
            }
        );
        this.onApperance = Appearance.addChangeListener(({ colorScheme }) => {
            this.setState({loading: this.state.loading});
        });
        this.onAlbumArtEnd = AlbumArt.getEventEmitter().addListener(
            "OnAlbumArtEnd",
            (album) => {
                idx = this.state.fullset.findIndex((a) => {return a.name === album.name && a.artist === album.artist});
                if (idx !== -1) {
                    this.state.fullset[idx].imagePath = album.path;
                    this.setState({albums: this.state.albums, fullset: this.state.fullset});
                }
            }
        );
        this.onAlbumArtError = AlbumArt.getEventEmitter().addListener(
            "OnAlbumArtError",
            (details) => {
                idx = this.state.fullset.findIndex((a) => {return a.name === details.album.name && a.artist === details.album.artist});
                if (idx !== -1) {
                    this.state.fullset[idx].imagePath = undefined;
                    this.setState({albums: this.state.albums, fullset: this.state.fullset});
                }
            }
        );
        this.onAlbumArtComplete = AlbumArt.getEventEmitter().addListener(
            "OnAlbumArtComplete",
            () => {
            }
        );
    }

    componentWillUnmount() {
        this.onAlbumArtEnd.remove();
        this.onAlbumArtError.remove();
        this.onAlbumArtComplete.remove();
        this.onDisconnect.remove();
        if (this.onApperance) {
            this.onApperance.remove();
        }
    }

    addAll(toPlaylist) {
        const { navigation } = this.props;

        const artist = navigation.getParam('artist');

        if (toPlaylist) {
            this.setState({modalVisible: true, selectedItem: {}});
        } else {
            this.state.albums.forEach((album) => {
                this.setState({loading: true});
                MPDConnection.current().addAlbumToPlayList(album.name, artist)
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
            });
        }
    }

    search = (text) => {
        if (text.length > 0) {
            let filtered = this.state.fullset.filter((album) => {
                return album.name.toLowerCase().indexOf(text.toLowerCase()) > -1;
            });
            this.setState({albums: filtered, searchValue: text});
        } else {
            this.setState({albums: this.state.fullset, searchValue: text});
        }
    }

    onPress(item) {
        const { navigation } = this.props;
        let artist = navigation.getParam('artist');
        if (!artist) {
            artist = item.artist;
        }
        navigation.navigate('Songs', {artist: artist, album: item.name, hasNoAlbum: item.hasNoAlbum});
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
                if (item.hasNoAlbum) {
                    MPDConnection.current().getSongsWithNoAlbum(item.artist)
                    .then((songs) => {
                        this.setState({loading: false});
                        let songurls = [];
                        songs.forEach((song) => {
                            songurls.push(decodeURIComponent(Base64.atob(song.b64file)));
                        });
                        this.setState({loading: true});
                        MPDConnection.current().addSongsToPlayList(songurls)
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
                    })
                    .catch((err) => {
                        this.setState({loading: false});
                        Alert.alert(
                            "MPD Error",
                            "Error : "+err
                        );
                    });            
                } else {
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
                }
                break;
            case 1:
                this.setState({modalVisible: true, selectedItem: {artist: item.artist, album: item.name, hasNoAlbum: item.hasNoAlbum}});
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

        if (selectedItem.hasNoAlbum) {
            this.setState({loading: true});

            MPDConnection.current().getSongsWithNoAlbum(selectedItem.artist)
            .then((songs) => {
                this.setState({loading: false});
                let songurls = [];
                songs.forEach((song) => {
                    songurls.push(decodeURIComponent(Base64.atob(song.b64file)));
                });
                this.setState({loading: true});
                MPDConnection.current().addSongsToNamedPlayList(songurls, MPDConnection.current().getCurrentPlaylistName())
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
            })
            .catch((err) => {
                this.setState({loading: false});
                Alert.alert(
                    "MPD Error",
                    "Error : "+err
                );
            });            
        } else if (selectedItem.album) {
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
        } else {
            const { navigation } = this.props;
            const artist = navigation.getParam('artist');
            this.state.albums.forEach((album) => {
                this.setState({loading: true});

                MPDConnection.current().addAlbumToNamedPlayList(album.name, artist, MPDConnection.current().getCurrentPlaylistName())
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
        const styles = StyleManager.getStyles("albumsStyles");
        const common = StyleManager.getStyles("styles");
        return (
            <TouchableOpacity onPress={this.onPress.bind(this, item)} onLongPress={this.onLongPress.bind(this, item)}>
                <View onLayout={(event) => {
                    const {x, y, width, height} = event.nativeEvent.layout;
                    this.rowHeight = height+1;
                }} style={styles.container1}>
                    <View style={styles.paddingLeft}/>
                    {item.imagePath === undefined &&
                        <FontAwesome5 name="compact-disc" size={20} style={common.icon}/>
                    }
                    {item.imagePath !== undefined &&
                        <Image style={styles.albumart} source={{uri: item.imagePath}}/>
                    }
                    <View style={common.container4}>
                        <Text style={styles.item}>{item.name}</Text>
                    </View>
                    {item.date !== undefined &&
                        <Text style={styles.item}>({item.date})</Text>
                    }
                    <EntypoIcon name="dots-three-horizontal" size={20} style={common.icon}/>
                </View>
            </TouchableOpacity>
        );
    };

    renderGridAlbumItem = ({item}) => {
        const styles = StyleManager.getStyles("albumsStyles");
        const size = Dimensions.get('window').width/this.state.numColumns;
        const gridStyles = StyleSheet.create({
            itemContainer: {
                width: size,
                height: size,
                alignItems: 'center'
            },
            albumartbig: {
                width: size-30, 
                height: size-30, 
                paddingLeft: 5, 
                paddingRight: 5, 
                resizeMode: 'contain'
            }
        });

        return (
            <TouchableOpacity onPress={this.onPress.bind(this, item)} onLongPress={this.onLongPress.bind(this, item)}>
                <View style={gridStyles.itemContainer}>
                    {item.imagePath === undefined &&
                        <Image style={gridStyles.albumartbig} source={require('./images/cd-large.png')}/>
                    }
                    {item.imagePath !== undefined &&
                        <Image style={gridStyles.albumartbig} source={{uri: item.imagePath}}/>
                    }
                    <View style={styles.container3}>
                        <Text numberOfLines={1} ellipsizeMode='tail' style={styles.albumGridItem}>{item.name}</Text>
                        {item.date !== undefined &&
                            <Text style={styles.albumGridItem}>({item.date})</Text>
                        }
                    </View>
                </View>
            </TouchableOpacity>
        );
    }

    getItemLayout = (item, index) => {
        return {offset: this.rowHeight * index, length: this.rowHeight, index: index};
    }

    render() {
        const common = StyleManager.getStyles("styles");

        return (
            <View style={common.container1}>
                <View style={common.container2}>
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
                            Total : {this.state.albums.length}
                        </Text>
                    </View>
                </View>
                {this.state.grid === false &&
                    <View style={common.container4}>
                    <FlatList
                        data={this.state.albums}
                        renderItem={this.renderItem}
                        renderSectionHeader={({section}) => <Text style={common.sectionHeader}>{section.title}</Text>}
                        keyExtractor={item => item.id}
                        ItemSeparatorComponent={this.renderSeparator}
                        key={this.state.numColumns}
                        ref={(ref) => { this.listRef = ref; }}
                        getItemLayout={this.getItemLayout}
                    />
                    </View>
                }
                {this.state.grid === true &&
                    <View style={common.container4}>
                    <FlatList
                        data={this.state.albums}
                        renderItem={this.renderGridAlbumItem}
                        keyExtractor={item => item.id}
                        numColumns={this.state.numColumns}
                        columnWrapperStyle={common.row}
                        key={this.state.numColumns}
                    />
                    </View>
                }
                {this.state.loading &&
                    <View style={common.loading}>
                        <ActivityIndicator size="large" color="#0000ff"/>
                    </View>
                }
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

                    <ActionButton.Item buttonColor='#3498db' title="Add to Queue" size={40} textStyle={common.actionButtonText} onPress={() => {this.addAll(false);}}>
                        <FAIcon name="plus-square" size={15} color="#e6e6e6" />
                    </ActionButton.Item>
                    <ActionButton.Item buttonColor='#9b59b6' title="Add to Playlist" size={40} textStyle={common.actionButtonText} onPress={() => {this.addAll(true);}}>
                        <FAIcon name="plus-square" size={15} color="#e6e6e6" />
                    </ActionButton.Item>
                </ActionButton>
            </View>
        );
    }
}

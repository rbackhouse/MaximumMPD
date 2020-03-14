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
import { Text, View, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image, Dimensions } from 'react-native';
import { SearchBar } from "react-native-elements";
import Icon from 'react-native-vector-icons/Ionicons';
import FAIcon from 'react-native-vector-icons/FontAwesome';
import ActionButton from 'react-native-action-button';
import { StackActions, NavigationActions } from 'react-navigation';

import MPDConnection from './MPDConnection';
import Base64 from './Base64';
import AlbumArt from './AlbumArt';
import NewPlaylistModal from './NewPlaylistModal';
import Config from './Config';

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
        Config.isUseGrdiView()
        .then((useGridView) => {
            if (useGridView) {
                const {height, width} = Dimensions.get('window');
                numColumns = width > 375 ? 3 : 2;
                this.setState({grid: true, numColumns: numColumns});
            }
        });
        const artist = navigation.getParam('artist');
        const albums = navigation.getParam('albums');
        if (artist) {
            this.setState({loading: true});
            Config.isSortAlbumsByDate()
            .then((sortAlbumsByDate) => {
                MPDConnection.current().getAlbumsForArtist(artist, sortAlbumsByDate)
                .then((albums) => {
                    this.setState({loading: false});
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
    }

    componentWillUnmount() {
        this.onDisconnect.remove();
    }

    addAll(toPlaylist) {
        const { navigation } = this.props;

        const artist = navigation.getParam('artist');

        if (toPlaylist) {
            this.setState({modalVisible: true});
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
        navigation.navigate('Songs', {artist: artist, album: item.name});
    }

    finishAdd(name) {
        this.setState({modalVisible: false});
        MPDConnection.current().setCurrentPlaylistName(name);
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
                <View onLayout={(event) => {
                    const {x, y, width, height} = event.nativeEvent.layout;
                    this.rowHeight = height+1;
                }} style={{flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent:'space-between', height: 65 }}>
                    <View style={{paddingLeft: 10}}/>
                    {item.imagePath === undefined &&
                        <Image style={{width: 20, height: 20, paddingLeft: 20, paddingRight: 35, resizeMode: 'contain'}} source={require('./images/icons8-cd-filled-50.png')}/>
                    }
                    {item.imagePath !== undefined &&
                        <Image style={{width: 55, height: 55, paddingLeft: 20, paddingRight: 20, resizeMode: 'contain'}} source={{uri: item.imagePath}}/>
                    }
                    <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'space-evenly', alignItems: 'stretch', padding: 5}}>
                        <Text style={styles.item}>{item.name}</Text>
                    </View>
                    {item.date !== undefined &&
                        <Text style={styles.item}>({item.date})</Text>
                    }
                    <Icon name="ios-more" size={20} color="black" style={{ paddingLeft: 20, paddingRight: 20 }}/>
                </View>
            </TouchableOpacity>
        );
    };

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
            <TouchableOpacity onPress={this.onPress.bind(this, item)}>
                <View style={gridStyles.itemContainer}>
                    {item.imagePath === undefined &&
                        <Image style={{width: size-30, height: size-30, paddingLeft: 5, paddingRight: 5, resizeMode: 'contain'}} source={require('./images/cd-large.png')}/>
                    }
                    {item.imagePath !== undefined &&
                        <Image style={{width: size-30, height: size-30, paddingLeft: 5, paddingRight: 5, resizeMode: 'contain'}} source={{uri: item.imagePath}}/>
                    }
                    <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'space-evenly', alignItems: 'center', paddingTop: 5, paddingBottom: 5}}>
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
        return (
            <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'stretch' }}>
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
                            containerStyle={{backgroundColor: 'white'}}
                            inputContainerStyle={{backgroundColor: '#EBECEC'}}
                            inputStyle={{backgroundColor: '#EBECEC'}}
                        />
                    </View>
                    <View style={{flex: .25}}>
                        <Text style={{fontSize: 15,fontFamily: 'GillSans-Italic'}}>
                            Total : {this.state.albums.length}
                        </Text>
                    </View>
                </View>
                {this.state.grid === false &&
                    <View style={{flex: .9, flexDirection: 'row', alignItems: 'flex-start' }}>
                    <FlatList
                        data={this.state.albums}
                        renderItem={this.renderItem}
                        renderSectionHeader={({section}) => <Text style={styles.sectionHeader}>{section.title}</Text>}
                        keyExtractor={item => item.name}
                        ItemSeparatorComponent={this.renderSeparator}
                        key={this.state.numColumns}
                        ref={(ref) => { this.listRef = ref; }}
                        getItemLayout={this.getItemLayout}
                    />
                    </View>
                }
                {this.state.grid === true &&
                    <View style={{flex: .9, flexDirection: 'row', alignItems: 'flex-start' }}>
                    <FlatList
                        data={this.state.albums}
                        renderItem={this.renderGridAlbumItem}
                        keyExtractor={item => item.name}
                        numColumns={this.state.numColumns}
                        columnWrapperStyle={styles.row}
                        key={this.state.numColumns}
                    />
                    </View>
                }
                {this.state.loading &&
                    <View style={styles.loading}>
                        <ActivityIndicator size="large" color="#0000ff"/>
                    </View>
                }
                <NewPlaylistModal visible={this.state.modalVisible} onSet={(name) => {this.finishAdd(name);}} onCancel={() => this.setState({modalVisible: false})}></NewPlaylistModal>
                <ActionButton buttonColor="rgba(231,76,60,1)" hideShadow={true}>
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

                    <ActionButton.Item buttonColor='#3498db' title="Add to Queue" size={40} textStyle={styles.actionButtonText} onPress={() => {this.addAll(false);}}>
                        <FAIcon name="plus-square" size={15} color="#e6e6e6" />
                    </ActionButton.Item>
                    <ActionButton.Item buttonColor='#9b59b6' title="Add to Playlist" size={40} textStyle={styles.actionButtonText} onPress={() => {this.addAll(true);}}>
                        <FAIcon name="plus-square" size={15} color="#e6e6e6" />
                    </ActionButton.Item>
                </ActionButton>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    item: {
        fontFamily: 'GillSans-Italic',
        padding: 10
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
    actionButtonText: {
        fontSize: 13,
        fontFamily: 'GillSans-Italic'
    },
    row: {
        flex: 1,
        justifyContent: "space-around"
    }
});

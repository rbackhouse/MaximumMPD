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
import { Text, View, StyleSheet, TouchableOpacity, Image, Alert, Platform, Linking, ActivityIndicator } from 'react-native';
import { Slider, ButtonGroup } from 'react-native-elements'
import Icon from 'react-native-vector-icons/FontAwesome';
import IonIcon from 'react-native-vector-icons/Ionicons';
import HeaderButtons from 'react-navigation-header-buttons';

import { NativeEventEmitter, NativeModules, Dimensions } from 'react-native';
import Menu, { MenuItem, MenuDivider } from 'react-native-material-menu';

import PlaylistScreen from './PlaylistScreen';
import PlaylistEditor from './PlaylistEditor';
import NewPlaylistModal from './NewPlaylistModal';

import MPDConnection from './MPDConnection';
import Base64 from './Base64';
import AlbumArt from './AlbumArt';

const { VolumeControl } = NativeModules;
const volumeEmitter = new NativeEventEmitter(VolumeControl);

class HeaderPlaylist extends React.Component {
    playlist = () => {
        this.props.navigation.navigate('Playlist')
    };

    render() {
        return (
            <HeaderButtons IconComponent={Icon} iconSize={23} color="red">
                <HeaderButtons.Item title="Playlist" iconName="list" onPress={this.playlist} />
            </HeaderButtons>
        );
    }
}

export default class PlayScreen extends React.Component {
    static navigationOptions = ({ navigation }) => {
        return {
            title: 'Play',
            //headerLeft:  <HeaderPlaylist navigation={navigation}/>
        };
    };

    constructor(props) {
        super(props)
        this.state = {
            isPlaying: false,
            volume: 0,
            postion: 0,
            status: undefined,
            selectedTab: 0,
            imagePath: "",
            searchedForAlbumArt: false,
            urlCommand: "",
            selectedItem: "",
            modalVisible: false,
            loading: false
        }
    }

    componentDidMount() {
        /*
        const {height, width} = Dimensions.get('window');
        Alert.alert(
            "Dimensions",
            "Height: "+height+" Width : "+width
        );
        */
        const { navigation } = this.props;
        if (!MPDConnection.isConnected()) {
            navigation.navigate('Settings');
            navigation.navigate('Connections');
        }
        this.navigateOnConnect = navigation.getParam('navigateOnConnect', true);
        const urlCommand = navigation.getParam('urlCommand', "");
        if (urlCommand !== "") {
            this.setState({urlCommand: urlCommand});
        }
        this.onStatus = MPDConnection.getEventEmitter().addListener(
            "OnStatus",
            (status) => {
                let currentsong = -1;
                if (this.state.status) {
                    currentsong = this.state.status.song;
                } else {
                    let volume = parseInt(status.volume);
                    this.setState({volume:volume});
                    VolumeControl.setVolume(volume/100);
                }
                this.setState({status: status, isPlaying: status.state === "play"});
                //this.setState({status: status, volume: parseInt(status.volume), isPlaying: status.state === "play"});
                if (status.song) {
                    if (currentsong !== status.song) {
                        this.setState({imagePath: '', searchedForAlbumArt: false});
                    }
                    if (!this.state.searchedForAlbumArt && this.state.imagePath.length < 1) {
                        AlbumArt.getAlbumArt(status.currentsong.artist, status.currentsong.album)
                        .then((path) => {
                            if (path) {
                                this.setState({imagePath: "file://"+path, searchedForAlbumArt: true});
                            } else {
                                this.setState({searchedForAlbumArt: true});
                            }
                        });
                    }
                } else {
                    this.setState({imagePath: '', searchedForAlbumArt: false});
                }
                if (this.state.urlCommand !== '') {
                    console.log("running urlCommand "+this.state.urlCommand);
                    switch (this.state.urlCommand) {
                        case 'playpause':
                            this.onPlayPause();
                            break;
                        case 'stop':
                            this.onStop();
                            break;
                        case 'next':
                            this.onNext();
                            break;
                        case 'previous':
                            this.onPrevious();
                            break;
                    }
                    this.setState({urlCommand: ''});
                }
            }
        );

        this.onDisconnect = MPDConnection.getEventEmitter().addListener(
            "OnDisconnect",
            () => {
                this.setState({status: undefined});
            }
        );

        this.didBlurSubscription = this.props.navigation.addListener(
            'didBlur',
            payload => {
                //MPDConnection.current().stopEmittingStatus();
                MPDConnection.current().startEmittingStatus(30000);
            }
        );
        this.didFocusSubscription = this.props.navigation.addListener(
            'didFocus',
            payload => {
                MPDConnection.current().startEmittingStatus(1000);
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

        this.onVolumeChange = volumeEmitter.addListener(
            "OnVolumeChange",
            (result) => {
                const newVolume = Math.round(result.volume*100);
                console.log("OnVolumeChange "+newVolume);
                this.setState({volume:newVolume});
                MPDConnection.current().setVolume(newVolume);
            }
        );

        Linking.addEventListener('url', this.handleOpenURL);
    }

    componentWillUnmount() {
        this.didBlurSubscription.remove();
        this.didFocusSubscription.remove();
        this.onStatus.remove();
        this.onAlbumArtEnd.remove();
        this.onAlbumArtComplete.remove();
        this.onAlbumArtError.remove();
        this.onVolumeChange.remove();
        this.onDisconnect.remove();
        Linking.removeEventListener('url', this.handleOpenURL);
    }


    handleOpenURL = (event) => {
        if (event.url.indexOf('maximummpd://') === 0) {
            const command = event.url.substring('maximummpd://'.length);
            this.setState({urlCommand: command});
        }
    };

    updateAlbumArt() {
        if (this.state.status) {
            const currentsong = this.state.status.currentsong;
            AlbumArt.getAlbumArt(currentsong.artist, currentsong.album)
            .then((path) => {
                if (path) {
                    this.setState({imagePath: "file://"+path});
                }
            });
        }
    }

    onPrevious() {
        MPDConnection.current().previous();
    }

    onPlayPause() {
        this.state.isPlaying ? MPDConnection.current().pause() : MPDConnection.current().play();
    }

    onNext() {
        MPDConnection.current().next();
    }

    onStop() {
        MPDConnection.current().stop();
    }

    onMute() {
        this.setVolume(0);
    }

    onMax() {
        this.setVolume(100);
    }

    onMore() {
        this.menu.show();
    }

    setVolume = (value) => {
        this.setState({volume:value});
        VolumeControl.setVolume(value/100);
        MPDConnection.current().setVolume(value);
    };

    setPosition = (value) => {
        MPDConnection.current().seekCurrrent(value);
    };

    setMenuRef = ref => {
        this.menu = ref;
    };

    addToPlaylist = () => {
        this.menu.hide(() => {
            if (this.state.status.currentsong.b64file) {
                this.setState({modalVisible: true, selectedItem: this.state.status.currentsong.b64file});
            }
        });
    };

    finishAdd(name, selectedItem) {
        this.setState({modalVisible: false, loading: true});
        MPDConnection.current().setCurrentPlaylistName(name);
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

    onRandom = () => {
        this.menu.hide();
        MPDConnection.current().clearPlayList();
        this.setState({loading: true});
        MPDConnection.current().randomPlayList()
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

    onClear= () => {
        this.menu.hide();
        MPDConnection.current().clearPlayList();
    }

    render() {
      const playPauseIcon = this.state.isPlaying == true ? "pause" : "play";
      let timeTrack = "";
      let time = 0;
      let dur = 0;
      let elapsed = "0:00";
      let duration = "0:00";
      let currentsong = {
          artist: "",
          album: "",
          title: ""
      }
      if (this.state.status) {
          currentsong = this.state.status.currentsong;
          if (this.state.status.elapsed && this.state.status.song) {
              time = Math.floor(parseInt(this.state.status.elapsed));
              let minutes = Math.floor(time / 60);
              let seconds = time - minutes * 60;
              seconds = (seconds < 10 ? '0' : '') + seconds;
              elapsed = minutes+":"+seconds;
              if (this.state.status.duration) {
                  dur = Math.floor(parseInt(this.state.status.duration));
              } else {
                  dur = parseInt(this.state.status.Time);
              }
              if (isNaN(dur)) {
                  dur = 0;
              }
              let dmins = Math.floor(dur / 60);
              let dsecs = dur - dmins * 60;
              dsecs = (dsecs < 10 ? '0' : '') + dsecs;
              duration = dmins+":"+dsecs;
              timeTrack = "Track: "+(parseInt(this.state.status.song)+1)+ " Format: "+this.state.status.audio;
          }
      }
      const {height, width} = Dimensions.get('window');

      let padding = 35;
      let isMedium = false;
      if (width < 321) {
          padding = 45;
          isMedium = true;
      }
      albumArtSize = Math.round((height/10) * 4) - padding;

      if (this.state.selectedTab === 0) {
          return (
              <View style={styles.container}>
                  <View style={styles.content}>
                      <View style={{flex: .1, width: "100%", padding: 5}}>
                            <ButtonGroup
                                onPress={(index) => {
                                    this.setState({selectedTab:index});
                                }}
                                selectedIndex={this.state.selectedTab}
                                buttons={['Playing', 'Queue', 'Playlists']}
                                containerStyle={{height: 25}}
                                selectedButtonStyle={{backgroundColor: '#3396FF'}}
                                selectedTextStyle={{color: 'white'}}
                            />
                        </View>
                      <View style={{flex: .1, width: "85%", height: 65, alignItems: 'center', justifyContent: 'center', paddingLeft: 5, paddingRight: 5}}>
                            <View style={{flex: 1, flexDirection: 'row', alignItems: 'center'}}>
                              <Text style={{ paddingRight: 15 }}>{elapsed}</Text>
                                <Slider
                                    value={time}
                                    onValueChange={this.setPosition}
                                    maximumValue={dur}
                                    step={1}
                                    style={{width: "80%"}}
                                    thumbTintColor="#3396FF"
                                />
                                <Text style={{ paddingLeft: 15 }}>{duration}</Text>
                            </View>
                      </View>
                      <View style={{flex: .6, width: "60%", alignItems: 'center', justifyContent: 'center'}} >
                          {this.state.imagePath.length < 1 &&
                              <Image style={{width: albumArtSize, height: albumArtSize}} source={require('./images/cd-large.png')}/>
                          }
                          {this.state.imagePath.length > 0 &&
                              <Image style={{width: albumArtSize, height: albumArtSize, resizeMode: 'contain'}} source={{uri: this.state.imagePath}}/>
                          }
                      </View>
                      <View style={{flex: .1, width: "80%", height: "15%", padding: 15, alignItems: 'center', justifyContent: 'center'}}>
                          <Text numberOfLines={1} style={styles.item}>{currentsong.artist}</Text>
                          <Text numberOfLines={1} style={styles.item}>{currentsong.album}</Text>
                          <Text numberOfLines={1} style={styles.item}>{currentsong.title}</Text>
                          <Text numberOfLines={1} style={styles.item}>{timeTrack}</Text>
                      </View>
                      <View style={{flex: .1, width: "85%", height: 65, alignItems: 'center', justifyContent: 'center'}}>
                          <View style={{flex: 1, flexDirection: 'row', alignItems: 'center'}}>
                              <TouchableOpacity
                                  onPress={this.onMute.bind(this)}>
                                    <Icon name="volume-off" size={20} color="grey" style={{ paddingRight: 10 }}/>
                                </TouchableOpacity>
                                <Slider
                                    value={this.state.volume}
                                    onValueChange={this.setVolume}
                                    maximumValue={100}
                                    step={1}
                                    style={{width: "85%"}}
                                    thumbTintColor="#3396FF"
                                />
                                <TouchableOpacity
                                    onPress={this.onMax.bind(this)}>
                                    <Icon name="volume-up" size={20} color="grey" style={{ paddingLeft: 10 }}/>
                                </TouchableOpacity>
                            </View>
                      </View>
                  </View>
                  <View style={styles.tabBar}>
                        <View style={styles.tabBarButton} >
                            <TouchableOpacity
                             onPress={this.onPrevious}>
                                    <View style={[styles.button, styles.mediumButton]}>
                                        <Icon name="fast-backward" size={15} color="#e6e6e6" />
                                    </View>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.tabBarButton}>
                            <TouchableOpacity
                             onPress={this.onStop}>
                                    <View style={[styles.button, isMedium ? styles.mediumButton : styles.largeButton]}>
                                        <Icon name="stop" size={12} color="#e6e6e6" />
                                    </View>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.tabBarButton}>
                            <TouchableOpacity
                             onPress={this.onPlayPause.bind(this)}>
                                    <View style={[styles.button, isMedium ? styles.mediumButton : styles.largeButton]}>
                                        <Icon name={playPauseIcon} size={15} color="#e6e6e6" />
                                    </View>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.tabBarButton}>
                            <TouchableOpacity
                             onPress={this.onNext}>
                                    <View style={[styles.button, styles.mediumButton]}>
                                        <Icon name="fast-forward" size={15} color="#e6e6e6" />
                                    </View>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.tabBarButton}>
                            <Menu
                              ref={this.setMenuRef}
                              button={<TouchableOpacity
                               onPress={this.onMore.bind(this)}>
                                      <View style={[styles.button, styles.smallButton]}>
                                          <IonIcon name="ios-more" size={20} color="#e6e6e6" style={{ paddingLeft: 1 }}/>
                                      </View>
                              </TouchableOpacity>}
                            >
                              <MenuItem textStyle={styles.meniItem} onPress={this.addToPlaylist}>Add to Playlist</MenuItem>
                              <MenuItem textStyle={styles.meniItem} onPress={this.onRandom}>Random Playlist</MenuItem>
                              <MenuItem textStyle={styles.meniItem} onPress={this.onClear}>Clear Queue</MenuItem>
                            </Menu>
                        </View>
                  </View>
                  <NewPlaylistModal visible={this.state.modalVisible} selectedItem={this.state.selectedItem} onSet={(name, selectedItem) => {this.finishAdd(name, selectedItem);}} onCancel={() => this.setState({modalVisible: false})}></NewPlaylistModal>
                  {this.state.loading &&
                      <View style={styles.loading}>
                          <ActivityIndicator size="large" color="#0000ff"/>
                      </View>
                  }
              </View>
          );
        } else if (this.state.selectedTab === 1) {
            return (
                <View style={{flex:1}}>
                    <View style={{flex:.07, width: "100%", alignItems: 'stretch', justifyContent: 'center', padding: 5}}>
                        <ButtonGroup
                            onPress={(index) => {
                                this.setState({selectedTab:index});
                            }}
                            selectedIndex={this.state.selectedTab}
                            buttons={['Playing', 'Queue', 'Playlists']}
                            containerStyle={{height: 25}}
                            selectedButtonStyle={{backgroundColor: '#3396FF'}}
                            selectedTextStyle={{color: 'white'}}
                        />
                      </View>
                      <PlaylistScreen navigation={this.props.navigation}/>
                  </View>
            );
        } else {
            return (
                <View style={{flex:1}}>
                    <View style={{flex:.07, width: "100%", alignItems: 'stretch', justifyContent: 'center', padding: 5}}>
                        <ButtonGroup
                            onPress={(index) => {
                                this.setState({selectedTab:index});
                            }}
                            selectedIndex={this.state.selectedTab}
                            buttons={['Playing', 'Queue', 'Playlists']}
                            containerStyle={{height: 25}}
                            selectedButtonStyle={{backgroundColor: '#3396FF'}}
                            selectedTextStyle={{color: 'white'}}
                        />
                      </View>
                      <PlaylistEditor navigation={this.props.navigation}/>
                  </View>
            );
        }
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    button: {
        backgroundColor: '#3396FF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowOpacity: 0.35,
        shadowOffset: {
          width: 0,
          height: 5
        },
        shadowColor: "#000",
        shadowRadius: 3,
        elevation: 5
    },
    largeButton: {
        width: 60,
        height: 60,
        borderRadius: 50,
    },
    mediumButton: {
        width: 50,
        height: 50,
        borderRadius: 35,
    },
    smallButton: {
        width: 40,
        height: 40,
        borderRadius: 30,
    },
    tabBar: {
        paddingLeft: 20,
        paddingRight: 20,
        paddingBottom: 20,
        flexDirection: 'row',
        height: 80
    },
    tabBarButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    item: {
        fontSize: 18,
        fontFamily: 'GillSans-Italic'
    },
    meniItem: {
        fontSize: 16,
        fontFamily: 'GillSans-Italic'
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
})

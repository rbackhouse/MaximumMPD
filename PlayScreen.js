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
import { Text, View, TouchableOpacity, Image, Alert, Platform, Linking, ActivityIndicator, Appearance, ActionSheetIOS } from 'react-native';
import { Slider, ButtonGroup } from 'react-native-elements'
import Icon from 'react-native-vector-icons/FontAwesome';
import EntypoIcon from 'react-native-vector-icons/Entypo';
import HeaderButtons from 'react-navigation-header-buttons';
import { ActionSheetCustom as ActionSheet } from 'react-native-actionsheet';

import { NativeEventEmitter, NativeModules, Dimensions } from 'react-native';

import PlaylistScreen from './PlaylistScreen';
import PlaylistEditor from './PlaylistEditor';
import NewPlaylistModal from './NewPlaylistModal';

import MPDConnection from './MPDConnection';
import Base64 from './Base64';
import AlbumArt from './AlbumArt';
import Config from './Config';
import { StyleManager } from './Styles';

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
            loading: false,
            isVisible: true
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
                let currenttitle = "";

                if (this.state.status) {
                    currenttitle = this.state.status.currentsong.name !== undefined ? this.state.status.currentsong.name : this.state.status.currentsong.title;
                } else {
                    let volume = parseInt(status.volume);
                    if (isNaN(volume)) {
                        volume = 0;
                    }
                    this.setState({volume:volume});
                    Config.isUseDeviceVolume()
                    .then((useDeviceVolume) => {
                        if (useDeviceVolume) {
                            VolumeControl.setVolume(volume/100);
                        }
                    });
                }
                this.setState({status: status, isPlaying: status.state === "play"});
                //this.setState({status: status, volume: parseInt(status.volume), isPlaying: status.state === "play"});
                if (status.song) {
                    const title = status.currentsong.name !== undefined ? status.currentsong.name : status.currentsong.title;
                    if (currenttitle !== title) {
                        this.setState({imagePath: '', searchedForAlbumArt: false});
                    }

                    if (!this.state.searchedForAlbumArt && this.state.imagePath.length < 1) {
                        AlbumArt.getAlbumArt(status.currentsong.artist, status.currentsong.album)
                        .then((path) => {
                            if (path) {
                                this.setState({imagePath: path, searchedForAlbumArt: true});
                            } else {
                                this.setState({searchedForAlbumArt: true});
                            }
                        });
                    }
                } else {
                    this.setState({imagePath: '', searchedForAlbumArt: false});
                }
                if (this.state.urlCommand !== '') {
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
                this.setState({isVisible: false});
                MPDConnection.current().startEmittingStatus(30000);
            }
        );
        this.didFocusSubscription = this.props.navigation.addListener(
            'didFocus',
            payload => {
                this.setState({isVisible: true});
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
                Config.isUseDeviceVolume()
                .then((useDeviceVolume) => {
                    if (useDeviceVolume) {
                        const newVolume = Math.round(result.volume*100);
                        this.setState({volume:newVolume});
                        MPDConnection.current().setVolume(newVolume);
                    }
                });
            }
        );
        this.onInternalConnect = MPDConnection.getEventEmitter().addListener(
            "OnInternalConnect",
            () => {
                if (this.state.isVisible) {
                    MPDConnection.current().startEmittingStatus(1000);
                }
            }
        );
        this.onConnect = MPDConnection.getEventEmitter().addListener(
            "OnConnect",
            () => {
                if (this.state.isVisible) {
                    MPDConnection.current().startEmittingStatus(1000);
                }
            }
        );

        this.onApperance = Appearance.addChangeListener(({ colorScheme }) => {
            this.setState({loading: this.state.loading});
        });        

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
        this.onConnect.remove();
        this.onInternalConnect.remove();
        if (this.onApperance) {
            this.onApperance.remove();
        }
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
                    this.setState({imagePath: path});
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

    setVolume = (value) => {
        this.setState({volume:value});
        Config.isUseDeviceVolume()
        .then((useDeviceVolume) => {
            if (useDeviceVolume) {
                VolumeControl.setVolume(value/100);
            }
        });
        MPDConnection.current().setVolume(value);
    };

    setPosition = (value) => {
        MPDConnection.current().seekCurrrent(value);
    };

    addToPlaylist = () => {
        if (this.state.status.currentsong.b64file) {
            this.setState({modalVisible: true, selectedItem: this.state.status.currentsong.b64file});
        }
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
        MPDConnection.current().clearPlayList();
        this.setState({loading: true});
        Config.getRandomPlaylistSize()
        .then((size) => {
            MPDConnection.current().randomPlayList(size)
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

    onClear= () => {
        MPDConnection.current().clearPlayList();
    }

    onGoTo = () => {
        if (this.state.status && this.state.status.currentsong) {
            currentsong = this.state.status.currentsong;
            if (currentsong.artist && currentsong.album) {
                const { navigation } = this.props;
                navigation.navigate('Browse');
                navigation.navigate('Songs', {artist: currentsong.artist, album: currentsong.album});
            }
        }
    }

    onConnections = () => {
        const { navigation } = this.props;
        navigation.navigate('Connections');
    }

    onMore = () => {
        if (Platform.OS === 'ios') {        
            ActionSheetIOS.showActionSheetWithOptions({
                options: ['Add to Playlist', 'Random Playlist', 'Clear Queue', 'Goto Album', 'Connections', 'Cancel'],
                cancelButtonIndex: 5
            }, (idx) => {
                this.doActionSheetAction(idx);
            });
        } else {
            this.ActionSheet.show();
        }
    }

    doActionSheetAction(idx) {
        switch (idx) {
            case 0:
                this.addToPlaylist();
                break;
            case 1: 
                this.onRandom();
                break;
            case 2:
                this.onClear();
                break;
            case 3:
                this.onGoTo();
                break;
            case 4:
                this.onConnections();
                break;
        }
    }

    render() {
      const styles = StyleManager.getStyles("playStyles");
      const common = StyleManager.getStyles("styles");
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
              if (currentsong.date) {
                timeTrack += " Date: "+currentsong.date;
              }        
          }
      }
      const {height, width} = Dimensions.get('window');

      let padding = 35;
      let isMedium = false;
      let bg = .1;
      if (width < 321) {
          padding = 45;
          isMedium = true;
          bg = .13;
      }
      const albumArtSize = Math.round((height/10) * 4) - padding;
      const title = currentsong.name !== undefined ? currentsong.name : currentsong.title

      if (this.state.selectedTab === 0) {
          return (
              <View style={styles.container}>
                  <View style={styles.content}>
                      <View style={{flex: bg, width: "100%", alignItems: 'stretch', justifyContent: 'center', padding: 5}}>
                            <ButtonGroup
                                onPress={(index) => {
                                    this.setState({selectedTab:index});
                                }}
                                selectedIndex={this.state.selectedTab}
                                buttons={['Playing', 'Queue', 'Playlists']}
                                containerStyle={common.containerStyle}
                                selectedButtonStyle={common.selectedButtonStyle}
                                selectedTextStyle={common.selectedTextStyle}
                                />
                      </View>
                      <View style={styles.container2}>
                            <View style={common.container3}>
                              <Text style={styles.paddingRight}>{elapsed}</Text>
                                <Slider
                                    value={time}
                                    onSlidingComplete={this.setPosition}
                                    maximumValue={dur}
                                    step={1}
                                    style={styles.positionSlider}
                                    thumbTintColor="#3396FF"
                                />
                                <Text style={styles.paddingLeft}>{duration}</Text>
                            </View>
                      </View>
                      <View style={styles.container4} >
                          {this.state.imagePath.length < 1 &&
                              <Image style={{width: albumArtSize, height: albumArtSize}} source={require('./images/cd-large.png')}/>
                          }
                          {this.state.imagePath.length > 0 &&
                              <Image style={{width: albumArtSize, height: albumArtSize, resizeMode: 'contain'}} source={{uri: this.state.imagePath}}/>
                          }
                      </View>
                      <View style={styles.container5}>
                          <Text numberOfLines={1} style={styles.item}>{currentsong.artist}</Text>
                          <Text numberOfLines={1} style={styles.item}>{currentsong.album}</Text>
                          <Text numberOfLines={1} style={styles.item}>{title}</Text>
                          <Text numberOfLines={1} style={styles.item}>{timeTrack}</Text>
                      </View>
                      <View style={styles.container6}>
                          <View style={common.container3}>
                              <TouchableOpacity
                                  onPress={this.onMute.bind(this)}>
                                    <Icon name="volume-off" size={20} color="grey" style={styles.paddingRightSmall}/>
                                </TouchableOpacity>
                                <Slider
                                    value={this.state.volume}
                                    onSlidingComplete={this.setVolume}
                                    maximumValue={100}
                                    step={1}
                                    style={styles.volumeSlider}
                                    thumbTintColor="#3396FF"
                                />
                                <TouchableOpacity
                                    onPress={this.onMax.bind(this)}>
                                    <Icon name="volume-up" size={20} color="grey" style={styles.paddingLeftSmall}/>
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
                            <TouchableOpacity
                             onPress={this.onMore}>
                                    <View style={[styles.button, styles.smallButton]}>
                                        <EntypoIcon name="dots-three-horizontal" size={20} color="#e6e6e6" style={styles.iconMore}/>
                                    </View>
                            </TouchableOpacity>
                        </View>
                  </View>
                  <NewPlaylistModal visible={this.state.modalVisible} selectedItem={this.state.selectedItem} onSet={(name, selectedItem) => {this.finishAdd(name, selectedItem);}} onCancel={() => this.setState({modalVisible: false})}></NewPlaylistModal>
                  {Platform.OS === 'android' &&
                        <ActionSheet
                            ref={o => this.ActionSheet = o}
                            options={['Add to Playlist', 'Random Playlist', 'Clear Queue', 'Goto Album', 'Connections', 'Cancel']}
                            cancelButtonIndex={5}
                            onPress={(idx) => { 
                                this.doActionSheetAction(idx);
                            }}
                        />
                    }
                  {this.state.loading &&
                      <View style={common.loading}>
                          <ActivityIndicator size="large" color="#0000ff"/>
                      </View>
                  }
              </View>
          );
        } else if (this.state.selectedTab === 1) {
            return (
                <View style={styles.tabcontainer1}>
                    <View style={{flex: bg, width: "100%", alignItems: 'stretch', justifyContent: 'center', padding: 5}}>
                        <ButtonGroup
                            onPress={(index) => {
                                this.setState({selectedTab:index});
                            }}
                            selectedIndex={this.state.selectedTab}
                            buttons={['Playing', 'Queue', 'Playlists']}
                            containerStyle={common.containerStyle}
                            selectedButtonStyle={common.selectedButtonStyle}
                            selectedTextStyle={common.selectedTextStyle}
                        />
                    </View>
                    <PlaylistScreen navigation={this.props.navigation}/>
                </View>
            );
        } else {
            return (
                <View style={styles.tabcontainer1}>
                    <View style={{flex: bg, width: "100%", alignItems: 'stretch', justifyContent: 'center', padding: 5}}>
                        <ButtonGroup
                            onPress={(index) => {
                                this.setState({selectedTab:index});
                            }}
                            selectedIndex={this.state.selectedTab}
                            buttons={['Playing', 'Queue', 'Playlists']}
                            containerStyle={common.containerStyle}
                            selectedButtonStyle={common.selectedButtonStyle}
                            selectedTextStyle={common.selectedTextStyle}
                        />
                    </View>
                    <PlaylistEditor navigation={this.props.navigation}/>
                </View>
            );
        }
    }
}

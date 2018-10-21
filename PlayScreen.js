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
import { Text, View, StyleSheet, TouchableOpacity, ProgressViewIOS, SegmentedControlIOS, Image } from 'react-native';
import { Slider } from 'react-native-elements'
import Icon from 'react-native-vector-icons/FontAwesome';
import IonIcon from 'react-native-vector-icons/Ionicons';
import HeaderButtons from 'react-navigation-header-buttons';
import PlaylistScreen from './PlaylistScreen';
import PlaylistEditor from './PlaylistEditor';

import MPDConnection from './MPDConnection';

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
            selectedTab: 0
        }
    }

    componentDidMount() {
        if (!MPDConnection.isConnected()) {
            this.props.navigation.navigate('Settings');
            this.props.navigation.navigate('Connections');
        }
        MPDConnection.getEventEmitter().addListener(
            "OnStatus",
            (status) => {
                this.setState({status: status, volume: parseInt(status.volume), isPlaying: status.state === "play"});
            }
        );

        this.didBlurSubscription = this.props.navigation.addListener(
            'didBlur',
            payload => {
                MPDConnection.current().stopEmittingStatus();
            }
        );
        this.didFocusSubscription = this.props.navigation.addListener(
            'didFocus',
            payload => {
                MPDConnection.current().startEmittingStatus();
            }
        );
    }

    componentWillUnmount() {
        this.didBlurSubscription.remove();
        this.didFocusSubscription.remove();
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
        MPDConnection.current().setVolume(0);
    }

    onMax() {
        MPDConnection.current().setVolume(100);
    }

    setVolume = (value) => {
        this.setState({volume:value});
        MPDConnection.current().setVolume(value);
    };

    setPosition = (value) => {
        MPDConnection.current().seekCurrrent(value);
    };

    render() {
      const playPauseIcon = this.state.isPlaying == true ? "pause" : "play";
      let timeTrack = "";
      let time;
      let dur;
      let elapsed = "0:00";
      let duration = "0:00";
      let currentsong = {
          artist: "",
          album: "",
          title: ""
      }
      if (this.state.status) {
          currentsong = this.state.status.currentsong;
          if (this.state.status.time && this.state.status.song) {
              time = Math.floor(parseInt(this.state.status.time));
              let minutes = Math.floor(time / 60);
              let seconds = time - minutes * 60;
              seconds = (seconds < 10 ? '0' : '') + seconds;
              elapsed = minutes+":"+seconds;

              dur = Math.floor(parseInt(this.state.status.duration));
              let dmins = Math.floor(dur / 60);
              let dsecs = dur - dmins * 60;
              dsecs = (dsecs < 10 ? '0' : '') + dsecs;
              duration = dmins+":"+dsecs;
              timeTrack = "Track: "+(parseInt(this.state.status.song)+1);
          }
      }
      if (this.state.selectedTab === 0) {
          return (
              <View style={styles.container}>
                  <View style={styles.content}>
                      <View style={{flex: .1, width: "100%", padding: 5}}>
                          <SegmentedControlIOS
                              values={['Playing', 'Queue', 'Playlists']}
                                selectedIndex={this.state.selectedTab}
                                onChange={(event) => {
                                  this.setState({selectedTab: event.nativeEvent.selectedSegmentIndex});
                                }}
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
                      <View style={{flex: .4, width: "60%", alignItems: 'center', justifyContent: 'center'}} >
                          <Image source={require('./icons8-cd-100.png')}/>
                      </View>
                      <View style={{flex: .2, width: "80%", height: "15%", padding: 15, alignItems: 'center', justifyContent: 'center'}}>
                          <Text numberOfLines={1} style={styles.item}>{currentsong.artist}</Text>
                          <Text numberOfLines={1} style={styles.item}>{currentsong.album}</Text>
                          <Text numberOfLines={1} style={styles.item}>{currentsong.title}</Text>
                          <Text numberOfLines={1} style={styles.item}>{timeTrack}</Text>
                      </View>
                      <View style={{flex: .2, width: "85%", height: 65, alignItems: 'center', justifyContent: 'center'}}>
                          <View style={{flex: 1, flexDirection: 'row', alignItems: 'center'}}>
                              <TouchableOpacity
                                  onPress={this.onMute.bind(this)}>
                                    <Icon name="volume-off" size={20} color="grey" style={{ paddingRight: 15 }}/>
                                </TouchableOpacity>
                                <Slider
                                    value={this.state.volume}
                                    onValueChange={this.setVolume}
                                    maximumValue={100}
                                    step={1}
                                    style={{width: "80%"}}
                                    thumbTintColor="#3396FF"
                                />
                                <TouchableOpacity
                                    onPress={this.onMax.bind(this)}>
                                    <Icon name="volume-up" size={20} color="grey" style={{ paddingLeft: 15 }}/>
                                </TouchableOpacity>
                        </View>
                      </View>
                  </View>
                  <View style={styles.tabBar}>
                        <View style={styles.tabBarButton} >
                            <TouchableOpacity
                             onPress={this.onPrevious}>
                                    <View style={styles.button}>
                                        <Icon name="fast-backward" size={15} color="#e6e6e6" />
                                    </View>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.tabBarButton}>
                            <TouchableOpacity
                             onPress={this.onStop}>
                                    <View style={styles.button}>
                                        <Icon name="stop" size={12} color="#e6e6e6" />
                                    </View>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.tabBarButton}>
                            <TouchableOpacity
                             onPress={this.onPlayPause.bind(this)}>
                                    <View style={styles.button}>
                                        <Icon name={playPauseIcon} size={15} color="#e6e6e6" />
                                    </View>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.tabBarButton}>
                            <TouchableOpacity
                             onPress={this.onNext}>
                                    <View style={styles.button}>
                                        <Icon name="fast-forward" size={15} color="#e6e6e6" />
                                    </View>
                            </TouchableOpacity>
                        </View>
                  </View>
              </View>
          );
        } else if (this.state.selectedTab === 1) {
            return (
                <View style={{flex:1}}>
                    <View style={{flex:.07, width: "100%", alignItems: 'stretch', justifyContent: 'center', padding: 5}}>
                        <SegmentedControlIOS
                            values={['Playing', 'Queue', 'Playlists']}
                              selectedIndex={this.state.selectedTab}
                              onChange={(event) => {
                                this.setState({selectedTab: event.nativeEvent.selectedSegmentIndex});
                              }}
                          />
                      </View>
                      <PlaylistScreen navigation={this.props.navigation}/>
                  </View>
            );
        } else {
            return (
                <View style={{flex:1}}>
                    <View style={{flex:.07, width: "100%", alignItems: 'stretch', justifyContent: 'center', padding: 5}}>
                        <SegmentedControlIOS
                            values={['Playing', 'Queue', 'Playlists']}
                              selectedIndex={this.state.selectedTab}
                              onChange={(event) => {
                                this.setState({selectedTab: event.nativeEvent.selectedSegmentIndex});
                              }}
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
        width: 60,
        height: 60,
        backgroundColor: '#3396FF',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 50,
        shadowOpacity: 0.35,
        shadowOffset: {
          width: 0,
          height: 5
        },
        shadowColor: "#000",
        shadowRadius: 3,
        elevation: 5
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
    }
})

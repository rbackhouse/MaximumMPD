/*
* The MIT License (MIT)
*
* Copyright (c) 2021 Richard Backhouse
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
import { Text, View, TouchableOpacity, Image, ActivityIndicator, Dimensions, FlatList, Alert } from 'react-native';
import { Slider, ButtonGroup } from "@rneui/themed";
import Icon from 'react-native-vector-icons/FontAwesome';
import IonIcon from 'react-native-vector-icons/Ionicons';
import EntypoIcon from 'react-native-vector-icons/Entypo';

import { StyleManager } from './Styles';
import ActionButton from 'react-native-action-button';

import AudioStreamManager from './AudioStreamManager';

export default class StreamPlayScreen extends React.Component {
    static navigationOptions = ({ navigation }) => {
        return {
            title: 'Play',
        };
    };

    constructor(props) {
        super(props)

        this.state = {
            isPlaying: false,
            volume: 0,
            elapsed: 0,
            selectedTab: 0,
            imagePath: "",
            queue: [],
            totalTime: ""
        }
    }

    componentDidMount() {
        this.subscription = AudioStreamManager.addListener(
            "OnItemStatus",
            (status) => {
                switch (status.type) {
                    case "finishedPlaying":
                        console.log("FinishedPlaying : "+status.url);
                        this.load();
                        this.setState({isPlaying: false});
                        break;
                    case "failedToPlay":
                        console.log("FinishedPlaying : "+status.url);
                        Alert.alert(
                            "Streaming Error",
                            "Error : "+status.error
                        );
                        this.load();
                        break;
                    case "timeStatus":
                        this.setState({elapsed: Math.floor(status.timeElapsed)});
                        break;
                    case "isPlaying":
                        console.log("Is Playing : "+status.isPlaying);
                        this.load();
                        this.setState({isPlaying: status.isPlaying});
                        break;
                    case "readyToPlay":
                        console.log("readyToPlay : "+status.url);
                        break;
                }
            }
        );

        this.load();

        this.didFocusSubscription = this.props.navigation.addListener(
            'didFocus',
            payload => {
                this.load();
            }
        );
    }

    componentWillUnmount() {
        this.subscription.remove();
        this.didFocusSubscription.remove();
    }

    load() {
        this.setState({loading: true});
        AudioStreamManager.getQueue()
        .then((queue) => {
            let imagePath = "";
            if (queue.length > 0 && queue[0].albumArtURL) {
                imagePath = queue[0].albumArtURL;
            }
            this.setState({loading: false, queue: queue, imagePath: imagePath});
        })
    }

    onPlayPause() {
        this.state.isPlaying ? AudioStreamManager.pause() : AudioStreamManager.play();
    }

    onNext = () =>  {
        AudioStreamManager.next();
        this.load();
    }

    onClear = () => {
        AudioStreamManager.clearQueue();
        this.load();
    }

    onMute() {
        this.setVolume(0);
    }

    onMax() {
        this.setVolume(100);
    }

    setVolume = (value) => {
        this.setState({volume:value});
    };

    setPosition = (value) => {
    };

    onPress(item) {
    }

    onLongPress(item) {
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
        const styles = StyleManager.getStyles("playlistStyles");
        const common = StyleManager.getStyles("styles");
        let timeTrack;
        if (item.time) {
            timeTrack = "Time: "+item.time;
        }
        let bitrate;
        let audio;
        //const isSelected = this.state.selected.get(item.artist+item.album+item.title)
        const isSelected = false;
        const selected = isSelected ? "flex" : "none";
        let pressModeIcon = "ios-musical-notes";

        /*
        if (isSelected && this.state.status && this.state.status.time) {
            let time = Math.floor(parseInt(this.state.status.time));
            let minutes = Math.floor(time / 60);
            let seconds = time - minutes * 60;
            seconds = (seconds < 10 ? '0' : '') + seconds;
            let elapsed = minutes+":"+seconds;
            timeTrack = "Time: "+item.time+" Elapsed: "+elapsed;
            bitrate = "Bitrate: "+this.state.status.bitrate +" kbps";
            audio = "Format: "+this.state.status.audio;
        }
        */
        return (
            <TouchableOpacity onPress={this.onPress.bind(this, item)} onLongPress={this.onLongPress.bind(this, item)}>
                <View onLayout={(event) => {
                    const {x, y, width, height} = event.nativeEvent.layout;
                    if (isSelected) {
                        this.selectedRowHeight = height+1;
                    } else {
                        this.rowHeight = height+1;
                    }
                }} style={common.container3}>
                    <IonIcon name={pressModeIcon} size={20} style={common.icon}/>
                    <View style={common.container4}>
                        {item.artist !== "" &&
                            <Text numberOfLines={1} ellipsizeMode='tail' style={styles.item}>{item.artist}</Text>
                        }
                        {item.album !== "" &&
                            <Text numberOfLines={1} ellipsizeMode='tail' style={styles.item}>{item.album}</Text>
                        }
                        <Text numberOfLines={1} ellipsizeMode='tail' style={styles.item}>{item.title}</Text>
                        {timeTrack !== undefined &&
                            <Text style={styles.item}>{timeTrack}</Text>
                        }
                        {bitrate !== undefined &&
                            <Text style={styles.item}>{bitrate}</Text>
                        }
                        {audio !== undefined &&
                            <Text style={styles.item}>{audio}</Text>
                        }
                    </View>
                    <IonIcon name="ios-checkmark" size={30} style={[{ display: selected}, common.icon]}/>
                </View>
            </TouchableOpacity>
        );
    };

    render() {
        const styles = StyleManager.getStyles("playStyles");
        const playlistStyles = StyleManager.getStyles("playlistStyles");
        const common = StyleManager.getStyles("styles");
        const playPauseIcon = this.state.isPlaying == true ? "pause" : "play";

        const {height, width} = Dimensions.get('window');

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

        if (this.state.queue.length > 0 ) {
            currentsong = {
                artist: this.state.queue[0].artist,
                album: this.state.queue[0].album,
                title: this.state.queue[0].title
            }
            const split = this.state.queue[0].duration.split(':');
            let dursecs = Math.floor(+split[2]);
            dursecs = (dursecs < 10 ? '0' : '') + dursecs;
            duration = split[1]+":"+dursecs;            
            dur = (+split[0]) * 60 * 60 + (+split[1]) * 60 + (+split[2]);

            time = this.state.elapsed;
            let minutes = Math.floor(time / 60);

            let seconds = time - minutes * 60;
            seconds = (seconds < 10 ? '0' : '') + seconds;
            elapsed = minutes+":"+seconds;

        }
  
        let padding = 35;
        let isMedium = false;
        let bg = .1;
        if (width < 321) {
            padding = 45;
            isMedium = true;
            bg = .13;
        }

        let actionButtonSize = 40;
        if (height < 570) {
            actionButtonSize = 30;
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
                                buttons={['Playing', 'Queue']}
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
                                    onValueChange={this.setPosition}
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
                                    onValueChange={this.setVolume}
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
                            buttons={['Playing', 'Queue']}
                            containerStyle={common.containerStyle}
                            selectedButtonStyle={common.selectedButtonStyle}
                            selectedTextStyle={common.selectedTextStyle}
                        />
                    </View>
                    <View style={playlistStyles.container1}>
                        <View style={playlistStyles.container2}>
                            <View style={playlistStyles.container3}>
                                <Text style={[common.text, {paddingLeft: 10}]}>
                                    Total : {this.state.queue.length}   Time : {this.state.totalTime}
                                </Text>
                            </View>
                        </View>
                        <View style={playlistStyles.container4}>
                        <FlatList
                            data={this.state.queue}
                            renderItem={this.renderItem}
                            renderSectionHeader={({section}) => <Text style={common.sectionHeader}>{section.title}</Text>}
                            keyExtractor={item => ""+item.id}
                            ItemSeparatorComponent={this.renderSeparator}
                            //extraData={this.state.selected}
                            ref={(ref) => { this.listRef = ref; }}
                        />
                        </View>
                        {this.state.loading &&
                            <View style={common.loading}>
                                <ActivityIndicator size="large" color="#0000ff"/>
                            </View>
                        }
                        <ActionButton buttonColor="rgba(231,76,60,1)" hideShadow={true}>
                            <ActionButton.Item size={actionButtonSize} buttonColor='#1abc9c' title="Clear Queue" textStyle={common.actionButtonText} onPress={this.onClear.bind(this)}>
                                <Icon name="eraser" size={15} color="#e6e6e6" />
                            </ActionButton.Item>
                            <ActionButton.Item size={actionButtonSize} buttonColor='#1abc9c' title="Play/Pause" textStyle={common.actionButtonText} onPress={this.onPlayPause.bind(this)}>
                                <Icon name={playPauseIcon} size={15} color="#e6e6e6" />
                            </ActionButton.Item>
                            <ActionButton.Item size={actionButtonSize} buttonColor='#9b59b6' title="Next" textStyle={common.actionButtonText} onPress={this.onNext.bind(this)}>
                                <Icon name="fast-forward" size={15} color="#e6e6e6" />
                            </ActionButton.Item>
                        </ActionButton>
                    </View>
                </View>
            );
        }
    }
}

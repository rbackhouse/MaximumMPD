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
import { Text, View, FlatList, TouchableOpacity, ActivityIndicator, Alert, Appearance, ActionSheetIOS, Platform } from 'react-native';
import { SearchBar } from "@rneui/themed";
import Icon from 'react-native-vector-icons/Ionicons';
import FAIcon from 'react-native-vector-icons/FontAwesome';
import EntypoIcon from 'react-native-vector-icons/Entypo';
import ActionButton from 'react-native-action-button';
import { ActionSheetCustom as ActionSheet } from 'react-native-actionsheet';

import MPDConnection from './MPDConnection';
import { StyleManager } from './Styles';
import SeachUtil from './SeachUtil';

export default class PlaylistDetails extends React.Component {
    static navigationOptions = ({ navigation }) => {
        return {
            title: navigation.getParam('playlist')
        };
    };

    constructor(props) {
        super(props);
        this.state = {
          searchValue: "",
          playlist: [],
          fullset: [],
          loading: false
        };
    }

    componentDidMount() {
        const { navigation } = this.props;
        this.playlistName = navigation.getParam('playlist');
        const isNew = navigation.getParam('isNew');
        //if (!isNew) {
        //    this.load();
        //}

        this.didFocusSubscription = this.props.navigation.addListener(
            'didFocus',
            payload => {
                this.load();
            }
        );

        this.onApperance = Appearance.addChangeListener(({ colorScheme }) => {
            this.setState({loading: this.state.loading});
        });
    }

    componentWillUnmount() {
        this.didFocusSubscription.remove();
        if (this.onApperance) {
            this.onApperance.remove();
        }
    }

    load() {
        this.setState({loading: true});
        MPDConnection.current().getNamedPlayListInfo(this.playlistName)
        .then((playlist) => {
            this.setState({loading: false});
            playlist.forEach((entry, index) => {
                entry.pos = index;
            })
            this.setState({playlist: playlist, fullset: playlist});
        })
        .catch((err) => {
            this.setState({loading: false});
            if (err.indexOf("No such playlist") === -1) {
                Alert.alert(
                    "MPD Error",
                    "Error : "+err
                );
            }
        });
    }

    search = (text) => {
        if (text.length > 0) {
            text = SeachUtil.convert(text);
            let filtered = this.state.fullset.filter((entry) => {
                return entry.title.toLowerCase().indexOf(text.toLowerCase()) > -1;
            });
            this.setState({playlist: filtered, searchValue: text});
        } else {
            this.setState({playlist: this.state.fullset, searchValue: text});
        }
    }

    onPress(item, index) {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions({
                options: ['Delete Playlist Entry', 'Goto Album', 'Move Up', 'Move Down', 'Move to Top', 'Move to Bottom', 'Cancel'],
                title: item.title,
                message: item.artist,
                cancelButtonIndex: 6
            }, (idx) => {
                this.doActionSheetAction(idx, item, index);
            });
        } else {
            this.currentItem = item;
            this.currentIndex = index;
            this.ActionSheet.show();
        }            
    }

    doActionSheetAction(idx, i, itemIndex) {
        const item = i || this.currentItem;
        const index = itemIndex === undefined ? this.currentIndex : itemIndex;
        switch (idx) {
            case 0:
                Alert.alert(
                    "Delete Playlist Entry",
                    "Are you sure you want to delete ''"+item.title+"'' ?",
                    [
                        {text: 'OK', onPress: () => {
                            this.setState({loading: true});
                            MPDConnection.current().deletePlayListItem(this.playlistName, index)
                            .then(() => {
                                this.setState({loading: false});
                                this.load();
                            })
                            .catch((err) => {
                                this.setState({loading: false});
                                Alert.alert(
                                    "MPD Error",
                                    "Error : "+err
                                );
                            });
                        }},
                        {text: 'Cancel'}
                    ]
                );        
                break;
            case 1:
                const { navigation } = this.props;
                if (item.artist && item.album) {
                    navigation.navigate('Browse');
                    navigation.navigate('Songs', {artist: item.artist, album: item.album});
                }
                break;
            case 2:
                if (index-1 > -1) {
                    this.movePlayListItem(index, index-1);
                }
                break;    
            case 3:
                if (index+1 < this.state.fullset.length) {
                    this.movePlayListItem(index, index+1);
                }
                break;
            case 4:
                if (index != 0) {
                    this.movePlayListItem(index, 0);
                }
                break
            case 5:
                if (index != this.state.fullset.length-1) {
                    this.movePlayListItem(index, this.state.fullset.length-1);
                }
                break
            }
        this.currentItem = undefined;
        this.currentIndex = undefined;
    }

    movePlayListItem(from, to) {
        this.setState({loading: true});
        MPDConnection.current().movePlayListItem(this.playlistName, from, to)
        .then(() => {
            this.setState({loading: false});
            this.load();
        })
        .catch((err) => {
            this.setState({loading: false});
            Alert.alert(
                "MPD Error",
                "Error : "+err
            );
        });
    }

    onDelete() {
        const { navigation } = this.props;
        Alert.alert(
            "Delete Playlist",
            "Are you sure you want to delete ?",
            [
                {text: 'OK', onPress: () => {
                    this.setState({loading: true});
                    MPDConnection.current().deletePlayList(this.playlistName)
                    .then(() => {
                        this.setState({loading: false});
                        navigation.pop();
                    })
                    .catch((err) => {
                        this.setState({loading: false});
                        Alert.alert(
                            "MPD Error",
                            "Error : "+err
                        );
                    });
                }},
                {text: 'Cancel'}
            ]
        );
    }

    onLoad(autoplay) {
        this.setState({loading: true});

        MPDConnection.current().loadPlayList(this.playlistName, autoplay)
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

    renderSeparator = () => {
        const common = StyleManager.getStyles("styles");
        return (
            <View
                style={common.separator}
            />
        );
    };

    renderItem = ({item, index}) => {
        const styles = StyleManager.getStyles("playlistDetailsStyles");
        const common = StyleManager.getStyles("styles");

        const pressModeIcon = "dots-three-horizontal";
        return (
            <TouchableOpacity onPress={this.onPress.bind(this, item, index)}>
                <View style={common.container3}>
                    <Icon name="ios-musical-notes" size={20} style={common.icon}/>
                    <View style={common.container4}>
                        {item.name !== undefined &&
                            <Text numberOfLines={1} ellipsizeMode='tail' style={styles.item}>{item.name}</Text>
                        }
                        <Text numberOfLines={1} ellipsizeMode='tail' style={styles.item}>{item.title}</Text>
                        <Text numberOfLines={1} ellipsizeMode='tail' style={styles.item}>{item.artist}</Text>
                        <Text numberOfLines={1} ellipsizeMode='tail' style={styles.item}>{item.album}</Text>
                        {item.time !== undefined &&
                            <Text numberOfLines={1} ellipsizeMode='tail' style={styles.item}>Time: {item.time}</Text>
                        }
                    </View>
                    <EntypoIcon name={pressModeIcon} size={28} style={common.icon}/>
                </View>
            </TouchableOpacity>
        );
    };

    render() {
        const styles = StyleManager.getStyles("playlistDetailsStyles");
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
                            Total : {this.state.playlist.length}
                        </Text>
                    </View>
                </View>
                <View style={styles.container5}>
                <FlatList
                    data={this.state.playlist}
                    renderItem={this.renderItem}
                    renderSectionHeader={({section}) => <Text style={common.sectionHeader}>{section.title}</Text>}
                    keyExtractor={item => ""+item.pos}
                    ItemSeparatorComponent={this.renderSeparator}
                />
                </View>
                {this.state.loading &&
                    <View style={common.loading}>
                        <ActivityIndicator size="large" color="#0000ff"/>
                    </View>
                }
                {Platform.OS === 'android' &&
                    <ActionSheet
                        ref={o => this.ActionSheet = o}
                        options={['Delete Playlist Entry', 'Goto Album', 'Move Up', 'Move Down', 'Move to Top', 'Move to Bottom', 'Cancel']}
                        cancelButtonIndex={6}
                        onPress={(idx) => { 
                            this.doActionSheetAction(idx);
                        }}
                    />
                }
                <ActionButton buttonColor="rgba(231,76,60,1)" hideShadow={true}>
                    <ActionButton.Item buttonColor='#1abc9c' title="Play Now" size={40} textStyle={common.actionButtonText} onPress={() => {this.onLoad(true);}}>
                        <FAIcon name="play" size={15} color="#e6e6e6" />
                    </ActionButton.Item>
                    <ActionButton.Item buttonColor='#3498db' title="Queue" size={40} textStyle={common.actionButtonText} onPress={() => {this.onLoad();}}>
                        <Icon name="ios-checkmark" size={30} color="#e6e6e6" />
                    </ActionButton.Item>
                    <ActionButton.Item buttonColor='#1abc9c' title="Delete" size={40} textStyle={common.actionButtonText} onPress={() => {this.onDelete();}}>
                        <Icon name="ios-trash" size={23} color="#e6e6e6" />
                    </ActionButton.Item>
                </ActionButton>
            </View>
        );
    }
}

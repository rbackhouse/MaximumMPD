/*
* The MIT License (MIT)
*
* Copyright (c) 2020 Richard Backhouse
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
import { Text, View, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { SearchBar } from "@rneui/themed";
import Icon from 'react-native-vector-icons/Ionicons';
import FAIcon from 'react-native-vector-icons/FontAwesome';
import EntypoIcon from 'react-native-vector-icons/Entypo';
import { HeaderBackButton } from 'react-navigation-stack';
import ActionButton from 'react-native-action-button';
import { SwipeListView, SwipeRow } from 'react-native-swipe-list-view';

import { StyleManager } from './Styles';
import Config from './Config';
import UPnPManager from './UPnPManager';
import AudioStreamManager from './AudioStreamManager';
import SeachUtil from './SeachUtil';

export default class UPnPBrowseScreen extends React.Component {
    static navigationOptions = ({ navigation }) => {
        const showBackbutton = navigation.getParam('showBackbutton', false);
        let ret = {
            title: 'UPnP Browse'
        }
        if (showBackbutton) {
            ret.headerLeft = () => ( <HeaderBackButton onPress={navigation.getParam('backlinkHandler')}/> )
        }
        return ret;
    };

    constructor(props) {
        super(props);
        this.state = {
          items: [],
          fullset: [],
          loading: false,
          searchValue: "",
        };
        this.parentIDs = [];
    }

    componentDidMount() {
        this.props.navigation.setParams({ backlinkHandler: this.backlinkHandler });
        this.load("0");
        this.didFocusSubscription = this.props.navigation.addListener(
            'didFocus',
            payload => {
                if (this.state.currentServer && this.state.currentServer !== UPnPManager.getCurrentServer().udn) {
                    this.load("0");
                }
            }
        );
    }

    componentWillUnmount() {
        this.didFocusSubscription.remove();
    }

    backlinkHandler = () => {
        if (this.parentIDs.length > 0) {
            const parentID = this.parentIDs.pop();
            this.load(parentID);
        }
    }

    onPress(item) {
        this.parentIDs.push(item.parentID);
        this.load(item.objectID);
    }

    onLongPress(item) {
    }

    play(rowMap, item) {
        if (rowMap[item.objectID]) {
			rowMap[item.objectID].closeRow();
		}
        AudioStreamManager.addSong(item);
        this.props.navigation.navigate('Play');
    }

    queue(rowMap, item) {
        if (rowMap[item.objectID]) {
			rowMap[item.objectID].closeRow();
		}
        AudioStreamManager.addSong(item);
    }

    addAll() {
        this.state.items.forEach((item) => {
            AudioStreamManager.addSong(item);
        });
    }

    load(id) {
        this.setState({loading: true, currentServer: UPnPManager.getCurrentServer().udn});

        UPnPManager.browse(id)
        .then((items) => {
            const show = id === "0" ? false : true;
            this.props.navigation.setParams({ showBackbutton: show });
            this.setState({loading: false, items: items, fullset: items});
        })
        .catch((err) => {
            this.parentIDs.pop();
            this.setState({loading: false});
            Alert.alert(
                "UPnP Error",
                "Error : "+err
            );

        })
    }

    search = (text) => {
        if (text.length > 0) {
            text = SeachUtil.convert(text);
            let filtered = this.state.fullset.filter((item) => {
                return item.title.toLowerCase().indexOf(text.toLowerCase()) > -1;
            });
            this.setState({items: filtered, searchValue: text});
        } else {
            this.setState({items: this.state.fullset, searchValue: text});
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

    render() {
        const styles = StyleManager.getStyles("upnpBrowseStyles");
        const common = StyleManager.getStyles("styles");
        const count = this.state.items.length;
        return (
            <View style={common.container1}>
                <View style={common.container2}>
                    <View style={common.flex75}>
                        <SearchBar
                            clearIcon
                            lightTheme
                            round
                            platform="ios"
                            cancelButtonTitle=""
                            placeholder='Search'
                            onChangeText={this.search}
                            value={this.state.searchValue}
                            containerStyle={common.searchbarContainer}
                            inputContainerStyle={common.searchbarInputContainer}
                            inputStyle={common.searchbarInput}
                            showCancel={true}
                    />
                    </View>
                    <View style={common.flex25}>
                        <Text style={common.text}>
                            Total: {count}
                        </Text>
                    </View>
                </View>
                <View style={styles.container4}>
                <SwipeListView
					useFlatList
                    data={this.state.items}
                    keyExtractor={item => item.objectID}
                    renderItem={(data, map) => {
                        const item = data.item;
                        let title = item.title;
                        if (item.childCount != 0) {
                            title += " ("+item.childCount+")";
                        }
                        if (item.isContainer === "TRUE") {
                            return (
                                <TouchableOpacity onPress={this.onPress.bind(this, item)} onLongPress={this.onLongPress.bind(this, item)}>
                                    <View style={common.container3}>
                                        {item.albumArtURL.length < 1 &&
                                            <Icon name="ios-folder" size={20} style={common.icon}/>
                                        }
                                        {item.albumArtURL.length > 0 &&
                                            <Image style={styles.albumart} source={{uri: item.albumArtURL}}/>
                                        }
                                        <View style={common.container4}>
                                            <Text numberOfLines={1} ellipsizeMode='middle' style={styles.file}>{title}</Text>
                                            {item.artist !== '' &&
                                                <Text numberOfLines={1} ellipsizeMode='tail' style={styles.file}>{item.artist}</Text>
                                            }
                                            {item.albumTitle !== '' &&
                                                <Text numberOfLines={1} ellipsizeMode='tail' style={styles.file}>{item.albumTitle}</Text>
                                            }
                                            {item.trackNumber !== '0' &&
                                                <Text numberOfLines={1} ellipsizeMode='tail' style={styles.file}>Track: {item.trackNumber}</Text>
                                            }
                                        </View>
                                        <EntypoIcon name="dots-three-horizontal" size={20} style={common.icon}/>                    
                                    </View>
                                </TouchableOpacity>
                            );
                        } else {
                            return (
                                <SwipeRow rightOpenValue={-150}>
                                    <View style={[common.rowBack, {paddingTop: 3, paddingBottom: 3}]}>
                                        <TouchableOpacity style={[common.backRightBtn, common.backRightBtnLeft]} onPress={ _ => this.queue(map, item) }>
                                            <Text style={common.backTextWhite}>Queue</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[common.backRightBtn, common.backRightBtnRight]} onPress={ _ => this.play(map, item) }>
                                            <Text style={common.backTextWhite}>Play</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View style={common.container3}>
                                        {item.albumArtURL.length < 1 &&
                                            <Icon name="ios-folder" size={20} style={common.icon}/>
                                        }
                                        {item.albumArtURL.length > 0 &&
                                            <Image style={styles.albumart} source={{uri: item.albumArtURL}}/>
                                        }
                                        <View style={common.container4}>
                                            <Text numberOfLines={1} ellipsizeMode='middle' style={styles.file}>{title}</Text>
                                            {item.artist !== '' &&
                                                <Text numberOfLines={1} ellipsizeMode='tail' style={styles.file}>{item.artist}</Text>
                                            }
                                            {item.albumTitle !== '' &&
                                                <Text numberOfLines={1} ellipsizeMode='tail' style={styles.file}>{item.albumTitle}</Text>
                                            }
                                            {item.trackNumber !== '0' &&
                                                <Text numberOfLines={1} ellipsizeMode='tail' style={styles.file}>Track: {item.trackNumber}</Text>
                                            }
                                        </View>
                                        <Icon name="swap-horizontal" size={20} style={common.icon}/>
                                    </View>
                                </SwipeRow>
                            );
                        }
                    }}
                    renderSectionHeader={({section}) => <Text style={common.sectionHeader}>{section.title}</Text>}
                    ItemSeparatorComponent={this.renderSeparator}
				/>
                </View>
                {this.state.loading &&
                    <View style={common.loading}>
                        <ActivityIndicator size="large" color="#0000ff"/>
                    </View>
                }
                <ActionButton buttonColor="rgba(231,76,60,1)" hideShadow={true}>
                    <ActionButton.Item buttonColor='#9b59b6' title="Add to Queue" size={40} textStyle={common.actionButtonText} onPress={() => {this.addAll();}}>
                        <FAIcon name="plus-square" size={15} color="#e6e6e6" />
                    </ActionButton.Item>
                </ActionButton>
            </View>
        );
    }
}

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
import { Text, View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SearchBar } from "react-native-elements";
import Icon from 'react-native-vector-icons/Ionicons';
import FAIcon from 'react-native-vector-icons/FontAwesome';
import { HeaderBackButton } from 'react-navigation';
import { Button } from 'react-native-elements'
import ActionButton from 'react-native-action-button';
import { SwipeListView, SwipeRow } from 'react-native-swipe-list-view';

import MPDConnection from './MPDConnection';
import Base64 from './Base64';
import NewPlaylistModal from './NewPlaylistModal';
import { StyleManager } from './Styles';

export default class FilesScreen extends React.Component {
    static navigationOptions = ({ navigation }) => {
        const showBackbutton = navigation.getParam('showBackbutton', false);
        let ret = {
            title: 'Files'
        }
        if (showBackbutton) {
            ret.headerLeft = <HeaderBackButton onPress={navigation.getParam('backlinkHandler')}/>;
        }
        return ret;
    };

    constructor(props) {
        super(props);
        this.state = {
          files: [],
          dirs: [],
          fullset: [],
          loading: false,
          modalVisible: false,
          selectedItem: "",
          searchValue: "",
          defaultSort: true
        };
    }

    componentDidMount() {
        if (!MPDConnection.isConnected()) {
            this.props.navigation.navigate('Settings');
            this.props.navigation.navigate('Connections');
        }

        this.props.navigation.setParams({ backlinkHandler: this.backlinkHandler });
        this.props.navigation.setParams({ sort: this.sort });

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
                this.setState({files: [], dirs: [], fullset: []});
                this.props.navigation.popToTop();
            }
        );
        this.didBlurSubscription = this.props.navigation.addListener(
            'didBlur',
            payload => {
                /*
                this.setState({files: [], dirs: []});
                this.props.navigation.popToTop();
                */
            }
        );
        this.didFocusSubscription = this.props.navigation.addListener(
            'didFocus',
            payload => {
                let uri;
                if (this.state.dirs.length > 0) {
                    uri = this.state.dirs[this.state.dirs.length-1];
                }
                this.load(uri);
            }
        );
    }

    componentWillUnmount() {
        this.onConnect.remove();
        this.onDisconnect.remove();
        this.didBlurSubscription.remove();
        this.didFocusSubscription.remove();
    }

    sort = () => {
        const useDefault = !this.state.defaultSort;
        this.setState({defaultSort: useDefault});
        this.state.files.sort((a,b) => {
            let comp1 = a.file || a.dir;
            let comp2 = b.file || b.dir;

            if (!useDefault && a.title && b.title) {
                comp1 = a.title;
                comp2 = b.title;
                if (comp1 < comp2) {
                    return -1;
                } else if (comp1 > comp2) {
                    return 1;
                } else {
                    return 0;
                }
            } else {
                if (comp1 < comp2) {
                    return useDefault ? -1 : 1;
                } else if (comp1 > comp2) {
                    return useDefault ? 1 : -1;
                } else {
                    return 0;
                }                
            }
        });
        this.setState({files: this.state.files});
    };

    backlinkHandler = () => {
        if (this.state.dirs.length > 0) {
            let dir = decodeURIComponent(Base64.atob(this.state.dirs.pop()));
            if (dir.indexOf('/') !== -1) {
                dir = dir.substring(0, dir.lastIndexOf('/'));
            } else {
                dir = "";
            }
            this.load(Base64.btoa(encodeURIComponent(dir)));
        }
    }

    addAll(toPlaylist) {
        const path = Base64.atob(this.state.dirs[this.state.dirs.length-1]);
        if (toPlaylist) {
            this.setState({modalVisible: true, selectedItem: "all"});
        } else {
            this.setState({loading: true});

            MPDConnection.current().addDirectoryToPlayList(decodeURIComponent(path))
            .then(() => {
                this.setState({loading: false});
            })
            .catch((err) => {
                this.setState({loading: false});
                console.log(err);
                Alert.alert(
                    "MPD Error",
                    "Error : "+err
                );
            });
        }
    }

    onPress(item, toPlaylist) {
        this.load(item.b64dir);
        this.state.dirs.push(item.b64dir);
    }

    load(uri) {
        let path = "";
		if (uri) {
			path += Base64.atob(uri);
		}
        this.setState({loading: true});
        MPDConnection.current().listFiles(path)
        .then((files) => {
            this.setState({loading: false, defaultSort: true, files: [...files.files, ...files.dirs], fullset: [...files.files, ...files.dirs]});
            if (this.state.dirs.length < 1) {
                this.props.navigation.setParams({ showBackbutton: false });
            } else {
                this.props.navigation.setParams({ showBackbutton: true });
            }
        })
        .catch((err) => {
            this.setState({loading: false});
            console.log(err);
            Alert.alert(
                "MPD Error",
                "Error : "+err
            );
        });
    }

    search = (text) => {
        if (text.length > 0) {
            let filtered = this.state.fullset.filter((file) => {
                if (file.dir) {
                    return file.dir.toLowerCase().indexOf(text.toLowerCase()) > -1;
                } else {
                    return file.file.toLowerCase().indexOf(text.toLowerCase()) > -1;
                }
            });
            this.setState({files: filtered, searchValue: text});
        } else {
            this.setState({files: this.state.fullset, searchValue: text});
        }
    };

    queue(rowMap, item, autoplay) {
        if (rowMap[item.b64file]) {
			rowMap[item.b64file].closeRow();
		}
        const path = Base64.atob(item.b64file);

        this.setState({loading: true});

        if (MPDConnection.current().isPlaylistFile(item.file)) {
            if (autoplay) {
                Alert.alert(
                    "MPD Error",
                    "Cannot autoplay a Playlist"
                );
                this.setState({loading: false});
                return;
            }
    
            MPDConnection.current().loadPlayList(decodeURIComponent(path))
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
            MPDConnection.current().addSongToPlayList(decodeURIComponent(path), autoplay)
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
    }

    playlist(rowMap, item) {
        if (rowMap[item.b64file]) {
			rowMap[item.b64file].closeRow();
		}
        if (MPDConnection.current().isPlaylistFile(item.file)) {
            Alert.alert(
                "MPD Error",
                "Cannot add a Playlist to a Playlist"
            );

            return;
        }
        this.setState({modalVisible: true, selectedItem: item.b64file});
    }

    finishAdd(name, selectedItem) {
        this.setState({modalVisible: false});
        MPDConnection.current().setCurrentPlaylistName(name);

        this.setState({loading: true});

        if (selectedItem === "all") {
            const path = Base64.atob(this.state.dirs[this.state.dirs.length-1]);

            MPDConnection.current().addDirectoryToNamedPlayList(decodeURIComponent(path), MPDConnection.current().getCurrentPlaylistName())
            .then(() => {
                this.setState({loading: false});
            })
            .catch((err) => {
                this.setState({loading: false});
                console.log(err);
                Alert.alert(
                    "MPD Error",
                    "Error : "+err
                );
            });
        } else {
            const path = Base64.atob(selectedItem);

            MPDConnection.current().addSongToNamedPlayList(decodeURIComponent(path), MPDConnection.current().getCurrentPlaylistName())
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
    }

    autoPlay() {
        const path = Base64.atob(this.state.dirs[this.state.dirs.length-1]);
        this.setState({loading: true});

        MPDConnection.current().addDirectoryToPlayList(decodeURIComponent(path), true)
        .then(() => {
            this.setState({loading: false});
        })
        .catch((err) => {
            this.setState({loading: false});
            console.log(err);
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

    render() {
        const styles = StyleManager.getStyles("filesStyles");
        const common = StyleManager.getStyles("styles");
        let showAddAll = false;
        let dirCount = 0;
        let fileCount = 0;

        this.state.files.forEach((f) => {
            if (f.file) {
                fileCount++;
                showAddAll = true;
            } else {
                dirCount++;
            }
        });

        return (
            <View style={common.container1}>
                <View style={common.container2}>
                    <View style={styles.container3}>
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
                    <View style={styles.container3}>
                        <Text style={common.text}>
                            Directories : {dirCount} Files: {fileCount}
                        </Text>
                    </View>
                </View>
                <View style={common.container4}>
                <SwipeListView
					useFlatList
                    data={this.state.files}
                    keyExtractor={item => item.b64file || item.b64dir}
                    renderItem={(data, map) => {
                        const item = data.item;
                        if (item.file) {
                            let file = item.file;
                            if (file.indexOf('/') !== -1) {
                                file = file.substring(file.lastIndexOf('/')+1);
                            }

                            return (
                                <SwipeRow leftOpenValue={75} rightOpenValue={-150}>
                                    <View style={[common.rowBack, {paddingTop: 3, paddingBottom: 3}]}>
                                        <TouchableOpacity style={common.backLeftBtn} onPress={ _ => this.queue(map, item, true) }>
                                            <Text style={common.backTextWhite}>Play</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[common.backRightBtn, common.backRightBtnLeft]} onPress={ _ => this.queue(map, item, false) }>
                                            <Text style={common.backTextWhite}>Queue</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[common.backRightBtn, common.backRightBtnRight]} onPress={ _ => this.playlist(map, item) }>
                                            <Text style={common.backTextWhite}>Playlist</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View style={[common.container3, common.rowFront, {paddingTop: 3, paddingBottom: 3}]}>
                                        <Icon name="ios-musical-notes" size={20} style={common.icon}/>
                                        <View style={common.container4}>
                                            {item.artist &&
                                                <Text numberOfLines={1} ellipsizeMode='tail' style={styles.file}>{item.artist}</Text>
                                            }
                                            {item.album &&
                                                <Text numberOfLines={1} ellipsizeMode='tail' style={styles.file}>{item.album}</Text>
                                            }
                                            {item.title &&
                                                <Text numberOfLines={1} ellipsizeMode='tail' style={styles.file}>{item.title}</Text>
                                            }
                                            <Text numberOfLines={1} ellipsizeMode='middle' style={styles.file}>{file}</Text>
                                        </View>
                                        <Icon name="ios-swap" size={20} style={common.icon}/>
                                    </View>
                                </SwipeRow>
                            );
                        } else if (item.dir) {
                            let dir = item.dir;
                            if (dir.indexOf('/') !== -1) {
                                dir = dir.substring(dir.lastIndexOf('/')+1);
                            }
                            return (
                                <TouchableOpacity onPress={this.onPress.bind(this, item)}>
                                    <View style={common.container3}>
                                        <Icon name="ios-folder" size={20} style={common.icon}/>
                                        <View style={common.container4}>
                                            <Text numberOfLines={1} ellipsizeMode='tail' style={styles.item}>{dir}</Text>
                                        </View>
                                        <Icon name="ios-more" size={20} style={common.icon}/>
                                    </View>
                                </TouchableOpacity>
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
                <NewPlaylistModal visible={this.state.modalVisible} selectedItem={this.state.selectedItem} onSet={(name, selectedItem) => {this.finishAdd(name, selectedItem);}} onCancel={() => this.setState({modalVisible: false})}></NewPlaylistModal>
                {showAddAll && <ActionButton buttonColor="rgba(231,76,60,1)" hideShadow={true}>
                    <ActionButton.Item buttonColor='#1abc9c' title="Play Now" size={40} textStyle={common.actionButtonText} onPress={() => {this.autoPlay();}}>
                        <FAIcon name="play" size={15} color="#e6e6e6" />
                    </ActionButton.Item>
                    <ActionButton.Item buttonColor='#3498db' title="Add to Queue" size={40} textStyle={common.actionButtonText} onPress={() => {this.addAll(false);}}>
                        <FAIcon name="plus-square" size={15} color="#e6e6e6" />
                    </ActionButton.Item>
                    <ActionButton.Item buttonColor='#9b59b6' title="Add to Playlist" size={40} textStyle={common.actionButtonText} onPress={() => {this.addAll(true);}}>
                        <FAIcon name="plus-square" size={15} color="#e6e6e6" />
                    </ActionButton.Item>
                </ActionButton>}
            </View>
        );
    }
}

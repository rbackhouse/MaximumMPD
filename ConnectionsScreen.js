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
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    SectionList,
    TouchableOpacity,
    Modal,
    Alert,
    ActivityIndicator,
    Animated,
    Dimensions,
    PanResponder } from 'react-native';
import MPDConnection from './MPDConnection';
import Icon from 'react-native-vector-icons/FontAwesome';
import { FormLabel, FormInput, Button } from 'react-native-elements'
import ActionButton from 'react-native-action-button';
import { SwipeListView, SwipeRow } from 'react-native-swipe-list-view';

class AddConnectionModal extends React.Component {
    state = {
        name: "",
        host: "",
        port: 6600,
        password: ""
    };

    onCancel(visible) {
        this.props.onCancel();
    }

    addConnection() {
        this.props.addConnection(this.state.name, this.state.host, this.state.port, this.state.password);
    }

    render() {
        const visible = this.props.visible;
        return (
            <Modal
                animationType="fade"
                transparent={false}
                visible={visible}
                onRequestClose={() => {
            }}>
                <View style={{marginTop: 22, flex: .8, flexDirection: 'column', justifyContent: 'space-around'}}>
                    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
                        <Text style={{fontSize: 20, fontFamily: 'GillSans-Italic'}}>Add MPD Connection</Text>
                    </View>
                    <FormLabel>Name</FormLabel>
                    <FormInput onChangeText={(name) => this.setState({name})} style={styles.entryField}></FormInput>
                    <FormLabel>Host</FormLabel>
                    <FormInput onChangeText={(host) => this.setState({host})} style={styles.entryField}></FormInput>
                    <FormLabel>Port</FormLabel>
                    <FormInput keyboardType='numeric' maxLength={5} onChangeText={(port) => this.setState({port})} style={styles.entryField}></FormInput>
                    <FormLabel>Password (if required by MPD server)</FormLabel>
                    <FormInput secureTextEntry={true} onChangeText={(password) => this.setState({password})} style={styles.entryField}></FormInput>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' }}>
                        <Button
                            onPress={() => {this.addConnection();}}
                            title="Add"
                            icon={{name: 'plus', type: 'font-awesome'}}
                            raised={true}
                            rounded
                            backgroundColor={'#3396FF'}
                        />
                        <Button
                            onPress={() => {this.onCancel();}}
                            title="Cancel"
                            icon={{name: 'times-circle', type: 'font-awesome'}}
                            raised={true}
                            rounded
                            backgroundColor={'#3396FF'}
                        />
                    </View>
                </View>
            </Modal>
        );
    }
}

export default class ConnectionsScreen extends React.Component {

    static navigationOptions = {
        title: 'Connections'
    };

    state = {
        discovered: [],
        configured: [],
        selected: (new Map(): Map<string, boolean>),
        modalVisible: false,
        loading: false
    }

    componentDidMount() {
        const { navigation } = this.props;
        this.navigateOnConnect = navigation.getParam('navigateOnConnect', true);
        MPDConnection.getEventEmitter().addListener(
            "OnDiscover",
            (discovered) => {
                let discoveredList = MPDConnection.getDiscoveredList();
                discoveredList.forEach((d) => {
                    d.key = d.name+d.ipAddress+d.port;
                })
                this.setState({discovered: discoveredList});
            }
        );

        this.onDisconnect = MPDConnection.getEventEmitter().addListener(
            "OnDisconnect",
            () => {
            }
        );

        const currentConnection = MPDConnection.current();
        if (currentConnection !== undefined && currentConnection.isConnected) {
            console.log("currentConnection "+currentConnection.name+currentConnection.host+currentConnection.port);
            this.state.selected.set(currentConnection.name+currentConnection.host+currentConnection.port, true);
        }
        let discovered = MPDConnection.getDiscoveredList();
        discovered.forEach((d) => {
            d.key = d.name+d.ipAddress+d.port;
        })
        this.setState({discovered: discovered});
        MPDConnection.getConnectionList()
            .then((connections) => {
                connections.forEach((c) => {
                    c.key = c.name+c.ipAddress+c.port;
                })
                this.setState({configured: connections});
            });
    }
    componentWillUnmount() {
        this.onDisconnect.remove();
    }

    keyExtractor = (item, index) => item.name+item.ipAddress+item.port;

    onPress(item) {
        this.setState((state) => {
            const selected = new Map(state.selected);
            if (selected.get(item.name+item.ipAddress+item.port) === true) {
                return {selected};
            }
            for (let key of selected.keys()) {
                selected.set(key, false);
            }
            selected.set(item.name+item.ipAddress+item.port, true);
            let port = item.port;
            if (!Number.isInteger(port)) {
                port = Number.parseInt(port);
            }
            this.setState({loading: true});

            MPDConnection.connect(item.name, item.ipAddress, port, item.pwd, item.randomPlaylistByType).then(
                () => {
                    this.setState({loading: false});
                    if (this.navigateOnConnect) {
                        console.log("navigateOnConnect "+this.navigateOnConnect);
                        this.props.navigation.navigate('MainPage');
                    }
                },
                (err) => {
                    this.setState({loading: false});
                    Alert.alert(
                        "MPD Error",
                        "Error : "+err
                    );
                }
            );
            return {selected};
        });
    }

    onCancel() {
        this.setState({modalVisible: false});
    }

    onAdd() {
        this.setState({modalVisible: true});
    }

    addConnection = (name, host, port, password) => {
        if (name === "") {
            Alert.alert(
                "Create Connection Error",
                "Name must not be blank"
            );
            return;
        }
        if (host === "") {
            Alert.alert(
                "Create Connection Error",
                "Host must not be blank"
            );
            return;
        }
        if (port === "") {
            Alert.alert(
                "Create Connection Error",
                "Port must not be blank"
            );
            return;
        }

        let parsedPort = parseInt(port);
        if (isNaN(parsedPort)) {
            Alert.alert(
                "Create Connection Error",
                "Port value must be a number"
            );
        } else {
            MPDConnection.addConnection(name, host, parsedPort, password, false)
                .then(() => {
                    MPDConnection.getConnectionList()
                        .then((connections) => {
                            this.setState({configured: connections});
                            this.onCancel();
                        });
                });
        }
    };

    onRemove() {
        this.state.configured.forEach((configured) => {
            if (this.state.selected.get(configured.name+configured.ipAddress+configured.port)) {
                Alert.alert(
                    "Delete Connection",
                    "Are you sure you want to delete "+configured.name+" ?",
                    [
                        {text: 'OK', onPress: () => {
                            MPDConnection.removeConnection(configured)
                            .then(() => {
                                MPDConnection.getConnectionList()
                                    .then((connections) => {
                                        this.setState({configured: connections});
                                    });
                            });
                        }},
                        {text: 'Cancel'}
                    ]
                );
            }
        });
    }

    onRemoveAll() {
        this.state.configured.forEach((configured) => {
            MPDConnection.removeConnection(configured)
            .then(() => {
                MPDConnection.getConnectionList()
                    .then((connections) => {
                        this.setState({configured: connections});
                    });
            });
        });
    }

    onRowDidOpen() {

    }

    connectRow(rowMap, item) {
        if (rowMap[item.name+item.ipAddress+item.port]) {
			rowMap[item.name+item.ipAddress+item.port].closeRow();
		}
        this.onPress(item);
    }

    deleteRow(rowMap, item) {
        if (rowMap[item.name+item.ipAddress+item.port]) {
			rowMap[item.name+item.ipAddress+item.port].closeRow();
		}
        Alert.alert(
            "Delete Connection",
            "Are you sure you want to delete "+item.name+" ?",
            [
                {text: 'OK', onPress: () => {
                    MPDConnection.removeConnection(item)
                    .then(() => {
                        MPDConnection.getConnectionList()
                            .then((connections) => {
                                this.setState({configured: connections});
                            });
                    });
                }},
                {text: 'Cancel'}
            ]
        );
    }

    renderSeparator = () => {
        return (
            <View
                style={{
                  height: 1,
                  width: "86%",
                  backgroundColor: "#CED0CE",
                  marginLeft: "14%"
                }}
            />
        );
    };

    render() {
        const navigation = this.props.navigation;
        return (
            <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'stretch' }}>
                <AddConnectionModal visible={this.state.modalVisible} onCancel={() => {this.onCancel();}} addConnection={this.addConnection}></AddConnectionModal>
                <SwipeListView
					useSectionList
					sections={[
                        {title: 'Discovered', data: this.state.discovered},
                        {title: 'Configured', data: this.state.configured},
                    ]}
                    renderItem={(data, map) => {
                        const openVal = data.section.title === "Discovered" ? -75 : -150;
                        const item = data.item;
                        const selected = this.state.selected.get(item.name+item.ipAddress+item.port) ? "flex" : "none";
                        return (
                        <SwipeRow rightOpenValue={openVal}>
                            <View style={styles.rowBack}>
                                {data.section.title === "Configured" &&
                                    <TouchableOpacity style={[styles.backRightBtn, styles.backRightBtnLeft]} onPress={ _ => this.deleteRow(map, item) }>
                                        <Text style={styles.backTextWhite}>Delete</Text>
                                    </TouchableOpacity>
                                }
                                <TouchableOpacity style={[styles.backRightBtn, styles.backRightBtnRight]} onPress={ _ => this.connectRow(map, item) }>
                                    <Text style={styles.backTextWhite}>Connect</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={[{flex: 1, flexDirection: 'row', alignItems: 'center'}, styles.rowFront]}>
                                <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'space-evenly', alignItems: 'stretch', padding: 5 }}>
                                    <Text style={styles.item}>{item.name}</Text>
                                    <Text style={styles.item}>{item.ipAddress}</Text>
                                    <Text style={styles.item}>{item.port}</Text>
                                </View>
                                <Icon name="check" size={15} color="black" style={{ display: selected, paddingLeft: 20, paddingRight: 20 }}/>
                            </View>
                        </SwipeRow>
                    );}}
                    renderSectionHeader={({section}) => <Text style={styles.sectionHeader}>{section.title}</Text>}
				/>
                {this.state.loading &&
                    <View style={styles.loading}>
                        <ActivityIndicator size="large" color="#0000ff"/>
                    </View>
                }

                <ActionButton buttonColor="rgba(231,76,60,1)">
                    <ActionButton.Item buttonColor='#3498db' title="Add Connection" size={40} textStyle={styles.actionButtonText} onPress={() => {this.onAdd();}}>
                        <Icon name="plus-square" size={15} color="#e6e6e6" />
                    </ActionButton.Item>
                </ActionButton>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    item: {
        fontSize: 17,
        fontFamily: 'GillSans-Italic',
        paddingLeft: 10
    },
    sectionHeader: {
        paddingTop: 2,
        paddingLeft: 10,
        paddingRight: 10,
        paddingBottom: 2,
        fontSize: 17,
        fontFamily: 'GillSans-Italic',
        fontWeight: 'bold',
        backgroundColor: 'rgba(247,247,247,1.0)',
    },
    button: {
        alignItems: 'center',
        backgroundColor: '#3396FF',
        padding: 10,
        borderRadius: 5
    },
    entryField: {
        width: 150,
        height: 30,
        margin: 15,
        borderColor: '#e3e5e5',
        borderWidth: 1
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
    backTextWhite: {
		color: '#FFF'
	},
	rowFront: {
		alignItems: 'center',
		backgroundColor: '#FFFFFF',
		justifyContent: 'center',
	},
	rowBack: {
		alignItems: 'center',
		backgroundColor: '#DDD',
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingLeft: 15,
	},
	backRightBtn: {
		alignItems: 'center',
		bottom: 0,
		justifyContent: 'center',
		position: 'absolute',
		top: 0,
		width: 75
	},
	backRightBtnLeft: {
		backgroundColor: 'grey',
		right: 75
	},
	backRightBtnRight: {
		backgroundColor: 'darkgray',
		right: 0
	}
});

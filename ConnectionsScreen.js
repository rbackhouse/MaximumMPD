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
    TouchableOpacity,
    Modal,
    Alert,
    ActivityIndicator,
    Appearance
} from 'react-native';
import MPDConnection from './MPDConnection';
import IonIcon  from 'react-native-vector-icons/Ionicons';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Input, Button } from 'react-native-elements'
import ActionButton from 'react-native-action-button';
import { SwipeListView, SwipeRow } from 'react-native-swipe-list-view';
import Config from './Config';
import { StyleManager } from './Styles';

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
        const styles = StyleManager.getStyles("connectionsStyles");
        const common = StyleManager.getStyles("styles");

        const visible = this.props.visible;
        return (
            <Modal
                animationType="fade"
                transparent={true}
                visible={visible}
                onRequestClose={() => {
            }}>
                <View style={styles.dialog1}>
                    <View style={styles.dialog2}>
                        <Text style={styles.dialogtext}>Add MPD Connection</Text>
                    </View>
                    <Input label="Name" 
                            autoCapitalize="none" 
                            onChangeText={(name) => this.setState({name})} 
                            style={styles.entryField}
                            inputStyle={styles.label}
                            labelStyle={styles.label}>
                    </Input>
                    <Input label="Host" 
                            autoCapitalize="none" 
                            onChangeText={(host) => this.setState({host})} 
                            style={styles.entryField}
                            inputStyle={styles.label}
                            labelStyle={styles.label}>
                    </Input>
                    <Input keyboardType='numeric' 
                            label="Port" 
                            onChangeText={(port) => this.setState({port})} 
                            style={styles.entryField} 
                            inputStyle={styles.label}
                            labelStyle={styles.label}>
                    </Input>
                    <Input secureTextEntry={true} 
                            label="Password (if required by MPD server)" 
                            onChangeText={(password) => this.setState({password})} 
                            style={styles.entryField} 
                            inputStyle={styles.label}
                            labelStyle={styles.label}>
                    </Input>
                    <View style={styles.dialog3}>
                        <Button
                            onPress={() => {this.addConnection();}}
                            title="Add"
                            icon={{name: 'plus', size: 15, type: 'font-awesome'}}
                            raised={true}
                            type="outline"
                        />
                        <Button
                            onPress={() => {this.onCancel();}}
                            title="Cancel"
                            icon={{name: 'times-circle', size: 15, type: 'font-awesome'}}
                            raised={true}
                            type="outline"
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
        this.onDiscover = MPDConnection.getEventEmitter().addListener(
            "OnDiscover",
            (discovered) => {
                this.state.discovered = this.state.discovered.filter((d) => {
                        return !(d.name === discovered.name);
                });
                if (discovered.type === "add") {
                    discovered.key = discovered.name+discovered.ipAddress+discovered.port;
                    this.state.discovered.push(discovered);
                }
                this.setState({discovered: this.state.discovered});
            }
        );

        this.onDisconnect = MPDConnection.getEventEmitter().addListener(
            "OnDisconnect",
            () => {
            }
        );

        const currentConnection = MPDConnection.current();
        if (currentConnection !== undefined && currentConnection.isConnected) {
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
        if (this.navigateOnConnect) {
            Config.isAutoConnect()
            .then((autoConnect) => {
                if (autoConnect.autoConnect && autoConnect.server) {
                    this.connect(autoConnect.server.name, autoConnect.server.host, autoConnect.server.port, autoConnect.server.pwd);
                }
            });
        }        
        this.onApperance = Appearance.addChangeListener(({ colorScheme }) => {
            this.setState({loading: this.state.loading});
        });
    }

    componentWillUnmount() {
        this.onDisconnect.remove();
        this.onDiscover.remove();
        if (this.onApperance) {
            this.onApperance.remove();
        }
    }

    keyExtractor = (item, index) => item.name+item.ipAddress+item.port;

    onPress(item) {
        this.setState((state) => {
            const selected = new Map(state.selected);
            for (let key of selected.keys()) {
                selected.set(key, false);
            }
            return {selected};
        });
        let port = item.port;
        if (!Number.isInteger(port)) {
            port = Number.parseInt(port);
        }
        this.connect(item.name, item.ipAddress, port, item.pwd);
    }

    connect(name, ipAddress, port, pwd) {
        if (this.navigateOnConnect) {
            this.setState({loading: true});
        }
        MPDConnection.connect(name, ipAddress, port, pwd).then(
            () => {
                this.setState((state) => {
                    const selected = new Map(state.selected);
                    selected.set(name+ipAddress+port, true);
                    return {selected};
                });
                Config.isAutoConnect()
                .then((autoConnect) => {
                    if (autoConnect.autoConnect) {
                        const server = {
                            name: name,
                            host: ipAddress,
                            port: port,
                            pwd: pwd
                        };
                        Config.setAutoConnect(true, server);
                    }
                });

                if (this.navigateOnConnect) {
                    this.setState({loading: false});
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

    }

    onCancel() {
        this.setState({modalVisible: false});
    }

    onAdd() {
        this.setState({modalVisible: true});
    }

    onRescan() {
        this.setState({discovered: []});
        MPDConnection.rescan();
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
            MPDConnection.addConnection(name, host, parsedPort, password, false, 0)
                .then(() => {
                    MPDConnection.getConnectionList()
                        .then((connections) => {
                            connections.forEach((c) => {
                                c.key = c.name+c.ipAddress+c.port;
                            })
                            this.setState({configured: connections});
                            this.onCancel();
                        });
                });
        }
    };

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
                    MPDConnection.disconnect();
                    MPDConnection.removeConnection(item)
                    .then(() => {
                        MPDConnection.getConnectionList()
                            .then((connections) => {
                                connections.forEach((c) => {
                                    c.key = c.name+c.ipAddress+c.port;
                                })
                                this.setState({configured: connections});
                            });
                    });
                }},
                {text: 'Cancel'}
            ]
        );
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
        const styles = StyleManager.getStyles("connectionsStyles");
        const common = StyleManager.getStyles("styles");

        const navigation = this.props.navigation;
        return (
            <View style={common.container1}>
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
                        const selected = this.state.selected.get(item.name+item.ipAddress+item.port) === true ? "flex" : "none";
                        return (
                        <SwipeRow rightOpenValue={openVal}>
                            <View style={common.rowBack}>
                                {data.section.title === "Configured" &&
                                    <TouchableOpacity style={[common.backRightBtn, common.backRightBtnLeft]} onPress={ _ => this.deleteRow(map, item) }>
                                        <Text style={common.backTextWhite}>Delete</Text>
                                    </TouchableOpacity>
                                }
                                <TouchableOpacity style={[common.backRightBtn, common.backRightBtnRight]} onPress={ _ => this.connectRow(map, item) }>
                                    <Text style={common.backTextWhite}>Connect</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={[common.container3, common.rowFront]}>
                                <View style={common.container4}>
                                    <Text style={styles.item}>{item.name}</Text>
                                    <Text style={styles.item}>{item.ipAddress}</Text>
                                    <Text style={styles.item}>{item.port}</Text>
                                </View>
                                <Icon name="check" size={15} style={[{ display: selected }, common.icon]}/>
                            </View>
                        </SwipeRow>
                    );}}
                    renderSectionHeader={({section}) => <Text style={common.sectionHeaderAlt}>{section.title}</Text>}
                    ItemSeparatorComponent={this.renderSeparator}
				/>
                {this.state.loading &&
                    <View style={common.loading}>
                        <ActivityIndicator size="large" color="#0000ff"/>
                    </View>
                }

                <ActionButton buttonColor="rgba(231,76,60,1)" hideShadow={true}>
                    <ActionButton.Item buttonColor='#1abc9c' title="Rescan" size={40} textStyle={common.actionButtonText} onPress={() => {this.onRescan();}}>
                        <IonIcon name="ios-refresh" size={20} color="white"/>
                    </ActionButton.Item>
                    <ActionButton.Item buttonColor='#3498db' title="Add Connection" size={40} textStyle={common.actionButtonText} onPress={() => {this.onAdd();}}>
                        <Icon name="plus-square" size={15} color="#e6e6e6" />
                    </ActionButton.Item>
                </ActionButton>
            </View>
        );
    }
}

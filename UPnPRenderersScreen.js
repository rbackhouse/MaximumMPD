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
import {
    View,
    TouchableOpacity,
    Text,
    Alert,
    ActivityIndicator
} from 'react-native';
import UPnPManager from './UPnPManager';
import Icon from 'react-native-vector-icons/FontAwesome';
import { SwipeListView, SwipeRow } from 'react-native-swipe-list-view';
import { StyleManager } from './Styles';
import ActionButton from 'react-native-action-button';
import IonIcon  from 'react-native-vector-icons/Ionicons';

export default class ConnectionsScreen extends React.Component {
    
    static navigationOptions = {
        title: 'Renderers'
    };

    state = {
        upnpRenderers: [],
        selected: (new Map(): Map<string, boolean>),
        loading: false
    }

    componentDidMount() {
        this.onUPnPRendererDiscover = UPnPManager.addListener(
            "OnRendererDiscover",
            (renderer) => {
                this.state.upnpRenderers = this.state.upnpRenderers.filter((u) => {
                    return !(u.udn === renderer.udn);
                });
                if (renderer.action === "find") {
                    renderer.key = renderer.udn;
                    this.state.upnpRenderers.push(renderer);
                }
                this.setState({upnpServers: this.state.upnpRenderers});
            }
        );
        this.load();
    }

    componentWillUnmount() {
        this.onUPnPRendererDiscover.remove();
    }

    load() {
        let upnpRenderers = UPnPManager.getRenderers();
        upnpRenderers.forEach((u) => {
            u.key = u.udn;
        });
        this.setState({upnpRenderers: upnpRenderers});        
    }

    connectRow(rowMap, item) {
        if (rowMap[item.udn]) {
			rowMap[item.udn].closeRow();
        }
        UPnPManager.connectRenderer(item.udn);
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
                <SwipeListView
					useSectionList
					sections={[
                        {title: 'UPnP Renderers', data: this.state.upnpRenderers}
                    ]}
                    renderItem={(data, map) => {
                        const openVal = -75;
                        const item = data.item;
                        const selected = this.state.selected.get(item.udn) === true ? "flex" : "none";
                        return (
                        <SwipeRow rightOpenValue={openVal}>
                            <View style={common.rowBack}>
                                <TouchableOpacity style={[common.backRightBtn, common.backRightBtnRight]} onPress={ _ => this.connectRow(map, item) }>
                                    <Text style={common.backTextWhite}>Connect</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={[common.container3, common.rowFront]}>
                                <View style={common.container4}>
                                    <Text style={styles.item}>{item.name}</Text>
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
                </ActionButton>
            </View>
        );
    }
}

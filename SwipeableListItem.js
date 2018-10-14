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
import { View, Text, StyleSheet, Animated, Dimensions, PanResponder } from 'react-native';

export default class SwipableListItem extends React.PureComponent {
    constructor(props) {
        super(props);

        this.gestureDelay = -35;
        this.scrollViewEnabled = true;

        const position = new Animated.ValueXY();
        const panResponder = PanResponder.create({
            onStartShouldSetPanResponder: (evt, gestureState) => false,
            onMoveShouldSetPanResponder: (evt, gestureState) => true,
            onPanResponderTerminationRequest: (evt, gestureState) => false,
            onPanResponderMove: (evt, gestureState) => {
                if (gestureState.dx > 35) {
                    this.setScrollViewEnabled(false);
                    let newX = gestureState.dx + this.gestureDelay;
                    position.setValue({x: newX, y: 0});
                }
            },
            onPanResponderRelease: (evt, gestureState) => {
                if (gestureState.dx < 150) {
                    Animated.timing(this.state.position, {
                        toValue: {x: 0, y: 0},
                        duration: 150,
                    }).start(() => {
                        this.setScrollViewEnabled(true);
                    });
                } else {
                    Animated.timing(this.state.position, {
                        toValue: {x: width, y: 0},
                        duration: 300,
                    }).start(() => {
                        this.props.swiped(this.props.text);
                        this.setScrollViewEnabled(true);
                    });
                }
            },
        });

        this.panResponder = panResponder;
        this.state = {position};
     }

     setScrollViewEnabled(enabled) {
         if (this.scrollViewEnabled !== enabled) {
             this.props.setScrollEnabled(enabled);
             this.scrollViewEnabled = enabled;
         }
     }

     render() {
         return (
             <View style={styles.listItem}>
                 <Animated.View style={[this.state.position.getLayout()]} {...this.panResponder.panHandlers}>
                     <View style={styles.absoluteCell}>
                         <Text style={styles.absoluteCellText}>Delete</Text>
                     </View>
                     <View style={styles.innerCell}>
                         <Text>
                             {this.props.text}
                         </Text>
                     </View>
                 </Animated.View>
             </View>
         );
     }
   }
}

const styles = StyleSheet.create({
    listItem: {
        height: 80,
        marginLeft: -100,
        justifyContent: 'center',
        backgroundColor: 'red',
    },
    absoluteCell: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        width: 100,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    absoluteCellText: {
        margin: 16,
        color: '#FFF',
    },
    innerCell: {
        width: width,
        height: 80,
        marginLeft: 100,
        backgroundColor: 'yellow',
        justifyContent: 'center',
        alignItems: 'center',
    }
});

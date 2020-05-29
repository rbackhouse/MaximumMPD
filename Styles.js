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

import { StyleSheet } from 'react-native'

let darkMode = true;

const Colors = {
    dark: '#000',
    light: '#fff'
};

const iconColor = darkMode ? Colors.light : Colors.dark;
const bgColor = darkMode ? Colors.dark : Colors.light;
const textColor = darkMode ? Colors.light : Colors.dark;
const separatorColor = darkMode ? "#303030" : "#CED0CE";
const searchbarColor = darkMode ? '#303030' : '#EBECEC';

const styles = StyleSheet.create({
    separator: {
        height: 1,
        width: "95%",
        backgroundColor: separatorColor,
        marginLeft: "3%",
        marginRight: "3%"
    },
    icon: { 
        paddingLeft: 20, 
        paddingRight: 20,
        backgroundColor: bgColor
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
    searchbarContainer: {
        backgroundColor: bgColor
    },
    searchbarInputContainer: {
        backgroundColor: searchbarColor
    },
    searchbarInput: { 
        backgroundColor: searchbarColor
    },
    text: {
        fontSize: 15,
        fontFamily: 'GillSans-Italic',
        color: textColor
    },
    actionButtonText: {
        fontSize: 13,
        fontFamily: 'GillSans-Italic'
    },
    row: {
        flex: 1,
        justifyContent: "space-around"
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
	},
	backLeftBtn: {
		alignItems: 'center',
		bottom: 0,
		justifyContent: 'center',
		position: 'absolute',
		top: 0,
		width: 75,
		backgroundColor: '#F08080'
    },
    backTextWhite: {
        color: textColor
	},
    sectionHeader: {
        paddingTop: 2,
        paddingLeft: 10,
        paddingRight: 10,
        paddingBottom: 2,
        fontSize: 14,
        fontWeight: 'bold',
        color: textColor,
        backgroundColor: bgColor,
    },
    sectionHeaderAlt: {
        paddingTop: 2,
        paddingLeft: 10,
        paddingRight: 10,
        paddingBottom: 2,
        fontSize: 17,
        fontFamily: 'GillSans-Italic',
        fontWeight: 'bold',
        color: textColor,
        backgroundColor: bgColor,
    },
    rowFront: {
		alignItems: 'center',
		backgroundColor: bgColor,
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
    containerStyle: { height: 28, backgroundColor: bgColor },
    selectedButtonStyle: {backgroundColor: '#3396FF'},    
    selectedTextStyle: {color: textColor},    
    flex75: {flex: .75},
    flex25: {flex: .25},
    container1: { flex: 1, justifyContent: 'flex-start', alignItems: 'stretch', backgroundColor: bgColor},
    container2: { flex: .1, flexDirection: 'row', alignItems: 'center', backgroundColor: bgColor },
    container3: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: bgColor },
    container4: { flex: 1, flexDirection: 'column', justifyContent: 'space-evenly', alignItems: 'stretch', padding: 5, backgroundColor: bgColor }
});

const albumsStyles = StyleSheet.create({
    item: {
        fontFamily: 'GillSans-Italic',
        padding: 10,
        color: textColor
    },
    albumGridItem: {
        fontSize: 13,
        fontFamily: 'GillSans-Italic',
        color: textColor
    },
    paddingLeft: {
        paddingLeft: 10
    },
    albumart: {
        width: 55, 
        height: 55, 
        paddingLeft: 20, 
        paddingRight: 20, 
        resizeMode: 'contain'
    },
    container1: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent:'space-between', height: 65, backgroundColor: bgColor },
    container3: { flex: 1, flexDirection: 'column', justifyContent: 'space-evenly', alignItems: 'center', paddingTop: 5, paddingBottom: 5, backgroundColor: bgColor },
});

const appStyles = StyleSheet.create({
    connectiing: {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center'
    },
    paddingRight: { paddingRight: 15 },
    headerStyle: {
        backgroundColor: bgColor
    },
    headerTitleStyle: {
        color: textColor
    },
    tabBar: {
        backgroundColor: bgColor
    }
});

const artistsStyles = StyleSheet.create({
    item: {
        fontFamily: 'GillSans-Italic',
        padding: 10,
        color: textColor
    },
    albumItem: {
        fontFamily: 'GillSans-Italic',
        padding: 3,
        color: textColor
    },
    albumGridItem: {
        fontSize: 13,
        fontFamily: 'GillSans-Italic',
        color: textColor
    },
    itemContainer: {flex: 1, flexDirection: 'row', alignItems: 'center', height: 65, backgroundColor: bgColor },
    itemTextContainer: { flex: 1, flexDirection: 'column', justifyContent: 'space-evenly', alignItems: 'stretch', padding: 5, backgroundColor: bgColor },
    genreContainer: {flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent:'space-between', backgroundColor: bgColor},
    paddingLeft: {paddingLeft: 10},
    gridItem: { flex: 1, flexDirection: 'column', justifyContent: 'space-evenly', alignItems: 'center', paddingTop: 5, paddingBottom: 5, paddingLeft: 5, paddingRight: 5, backgroundColor: bgColor},
    iconAlbumArt: {width: 55, height: 55, paddingLeft: 20, paddingRight: 20, resizeMode: 'contain', backgroundColor: bgColor },
    iconGenre: {width: 20, height: 20, paddingLeft: 20, paddingRight: 20, resizeMode: 'contain', backgroundColor: bgColor }
});

const connectionsStyles = StyleSheet.create({
    item: {
        fontFamily: 'GillSans-Italic',
        paddingLeft: 10,
        color: textColor
    },
    label: {
        fontSize: 17,
        fontFamily: 'GillSans-Italic',
        fontWeight: 'normal',
        color: textColor
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
    dialog1: {marginTop: 22, flex: .8, flexDirection: 'column', justifyContent: 'space-around', backgroundColor: bgColor},
    dialog2: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: bgColor},
    dialog3: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', backgroundColor: bgColor },
    dialogtext: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: bgColor, color: textColor}
});

const debugStyles = StyleSheet.create({
    textInput: {
      borderColor: '#CCCCCC',
      borderTopWidth: 1,
      borderBottomWidth: 1,
      height: 50,
      fontSize: 25,
      paddingLeft: 20,
      paddingRight: 20,
      color: textColor
    },
    item: {
        fontSize: 17,
        fontFamily: 'GillSans-Italic',
        padding: 10,
        color: textColor
    },
    container3: { flex: .1, flexDirection: 'row', alignItems: 'center', backgroundColor: bgColor },
    container4: { flex: 1, backgroundColor: bgColor }
});

const filesStyles = StyleSheet.create({
    item: {
        fontFamily: 'GillSans-Italic',
        padding: 10,
        color: textColor
    },
    file: {
        fontFamily: 'GillSans-Italic',
        paddingLeft: 10,
        paddingTop: 2,
        paddingBottom: 2,
        color: textColor
    },
    container3: { flex: .5, backgroundColor: bgColor }
});

const newPlaylistStyles = StyleSheet.create({
    entryField: {
        width: 150,
        height: 30,
        margin: 15,
        borderColor: '#e3e5e5',
        borderWidth: 1
    },
    item: {
        fontSize: 17,
        fontFamily: 'GillSans-Italic',
        padding: 10,
        color: textColor
    },
    label: {
        fontSize: 17,
        fontFamily: 'GillSans-Italic',
        fontWeight: 'normal',
        color: textColor
    },
    container3: { marginTop: 25, flex: 1, flexDirection: 'column', justifyContent: 'space-around', backgroundColor: bgColor },
    container4: { flex: .1, justifyContent: 'flex-start', alignItems: 'stretch', marginBottom: 20, backgroundColor: bgColor },
    container5: { flex: .5, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: bgColor },
    container6: { flex: .5, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: bgColor },
    container7: { flex: .1, justifyContent: 'flex-start', alignItems: 'stretch', backgroundColor: bgColor },
    container8: { flex: .2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', backgroundColor: bgColor },
    container9: { flex: .6, justifyContent: 'flex-start', alignItems: 'stretch', backgroundColor: bgColor },
    container10: {flex: .1, flexDirection: 'row', alignItems: 'center', backgroundColor: bgColor },
    container13: {flex: .9, flexDirection: 'row', alignItems: 'flex-start', backgroundColor: bgColor },
    text1: {fontSize: 20, fontFamily: 'GillSans-Italic', color: textColor},
    text2: {fontSize: 16, fontFamily: 'GillSans-Italic', color: textColor},
    text3: {fontSize: 15,fontFamily: 'GillSans-Italic', color: textColor}
});

const outputsStyles = StyleSheet.create({
    container1 : { backgroundColor: searchbarColor, flex:1 },
    item: {color: textColor},
    headerStyle: {marginTop:15, color: textColor, backgroundColor: searchbarColor}
});

const playlistDetailsStyles = StyleSheet.create({
    item: {
        fontFamily: 'GillSans-Italic',
        color: textColor
    },
    container5: { flex: .9, flexDirection: 'row', alignItems: 'stretch', backgroundColor: bgColor },

});

const playlistEditorStyles = StyleSheet.create({
    item: {
        fontFamily: 'GillSans-Italic',
        padding: 10,
        color: textColor
    },
    label: {
        fontSize: 17,
        fontFamily: 'GillSans-Italic',
        fontWeight: 'normal',
        color: textColor
    },
    container5: { flex: .9, flexDirection: 'row', alignItems: 'flex-start', backgroundColor: bgColor },
    dialog1: {marginTop: 22, flex: .6, flexDirection: 'column', justifyContent: 'space-around', backgroundColor: bgColor },
    dialog2: { flex: .3, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: bgColor },
    dialog3: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', backgroundColor: bgColor },
    dialogtext: {fontSize: 20, fontFamily: 'GillSans-Italic', color: textColor}
});

const playlistStyles = StyleSheet.create({
    item: {
        fontFamily: 'GillSans-Italic',
        color: textColor
    },
    label: {
        fontSize: 17,
        fontFamily: 'GillSans-Italic',
        fontWeight: 'normal',
        color: textColor
    },
    button: {
        width: 35,
        height: 35,
        backgroundColor: '#3396FF',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 50
    },
    tabBar: {
        paddingLeft: 20,
        paddingRight: 20,
        paddingTop: 10,
        flexDirection: 'row',
        width: "85%"
    },
    tabBarButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionButtonIcon: {
        fontSize: 20,
        height: 22,
        color: 'white',
    },
    entryField: {
        width: 150,
        height: 30,
        margin: 15,
        borderColor: '#e3e5e5',
        borderWidth: 1
    },
    container1: { flex: 1, justifyContent: 'flex-start', alignItems: 'flex-start', backgroundColor: bgColor },
    container2: { flex: .05, flexDirection: 'row', alignItems: 'flex-start', backgroundColor: bgColor },
    container3: { flex: 1, justifyContent: 'center', backgroundColor: bgColor },
    container4: { flex: .95, flexDirection: 'row', alignItems: 'flex-start', backgroundColor: bgColor },
    dialog1: {marginTop: 22, flex: .6, flexDirection: 'column', justifyContent: 'space-around', backgroundColor: bgColor },
    dialog2: { flex: .3, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: bgColor },
    dialog3: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', backgroundColor: bgColor },
    dialogtext: {fontSize: 20, fontFamily: 'GillSans-Italic', color: textColor}
});

const playStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: bgColor
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center', 
        backgroundColor: bgColor
    },
    button: {
        backgroundColor: '#3396FF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowOpacity: 0.35,
        shadowOffset: {
          width: 0,
          height: 5
        },
        shadowColor: "#000",
        shadowRadius: 3,
        elevation: 5
    },
    largeButton: {
        width: 60,
        height: 60,
        borderRadius: 50,
    },
    mediumButton: {
        width: 50,
        height: 50,
        borderRadius: 35,
    },
    smallButton: {
        width: 40,
        height: 40,
        borderRadius: 30,
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
        fontFamily: 'GillSans-Italic',
        color: textColor
    },
    meniItem: {
        fontSize: 16,
        fontFamily: 'GillSans-Italic',
        color: textColor
    },
    menu: {backgroundColor: bgColor},
    tabcontainer1: { flex:1, backgroundColor: bgColor },
    container1: { flex: .1, width: "100%", padding: 5, backgroundColor: bgColor },
    container2: { flex: .1, width: "85%", height: 65, alignItems: 'center', justifyContent: 'center', paddingLeft: 5, paddingRight: 5, backgroundColor: bgColor },
    container4: { flex: .6, width: "60%", alignItems: 'center', justifyContent: 'center', backgroundColor: bgColor },
    container5: { flex: .1, width: "80%", height: "15%", padding: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: bgColor },
    container6: { flex: .1, width: "85%", height: 65, alignItems: 'center', justifyContent: 'center', backgroundColor: bgColor },
    paddingRight: { paddingRight: 15, color: textColor },
    paddingLeft: { paddingLeft: 15, color: textColor  },
    paddingRightSmall: { paddingRight: 10 },
    paddingLeftSmall: { paddingLeft: 10 },
    iconMore: { paddingLeft: 1 },
    positionSlider: {width: "80%"},
    volumeSlider: {width: "85%"}
})

const searchStyles = StyleSheet.create({
    item: {
        fontFamily: 'GillSans-Italic',
        paddingLeft: 10,
        color: textColor
    },
    container1: { flex: 1, flexDirection: 'row', backgroundColor: bgColor },
    container3: { flex: 1, backgroundColor: bgColor },
    container4: { flex: .9, flexDirection: 'row', alignItems: 'stretch', backgroundColor: bgColor },
    container7: { flex: 1, flexDirection: 'row', alignItems: 'center', height: 65, backgroundColor: bgColor },
    paddingLeft: {
        paddingLeft: 10
    },
    albumart: {
        width: 55, 
        height: 55, 
        paddingLeft: 20, 
        paddingRight: 20, 
        resizeMode: 'contain'
    }
});

const settingsStyles = StyleSheet.create({
    entryField: {
        width: 150,
        height: 30,
        margin: 15,
        borderColor: '#e3e5e5',
        borderWidth: 1
    },
    label: {
        fontFamily: 'GillSans-Italic',
        fontWeight: 'normal',
        color: textColor
    },
    status: {
        fontFamily: 'GillSans-Italic',
        margin: 15,
        color: textColor
    },
    text1: {fontSize: 15,fontFamily: 'GillSans-Italic', color: textColor},
    text2: {fontSize: 20, fontFamily: 'GillSans-Italic', color: textColor},
    flexStart: {flex: .5, alignItems: 'flex-start'},
    flexEnd: {flex: .5, alignItems: 'flex-end'},
    flex1: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' },
    flex2: {flex: .2, flexDirection: 'row', alignItems: 'stretch', justifyContent: 'flex-start'},
    flex3: { flex: .3, flexDirection: 'row', justifyContent: 'center', alignItems: 'center'},
    container1: { marginTop: 22, flex: .6, flexDirection: 'column', justifyContent: 'space-around', backgroundColor: bgColor },
    container2: { flex: .1, flexDirection: 'row', alignItems: 'center', margin: 15, backgroundColor: bgColor },
    container3: { flex: .2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', backgroundColor: bgColor },
    container4: { flex: .2, flexDirection: 'row', alignItems: 'center', margin: 15, backgroundColor: bgColor },
    container5: { marginTop: 25, flex: 1, flexDirection: 'column', justifyContent: 'flex-start', backgroundColor: bgColor },
    container6: { flex: .1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: bgColor },
    container7: { backgroundColor: searchbarColor, flex:1 },
    textInput1: {
        width: 75,
        height: 35,
        borderColor: '#e3e5e5',
        borderWidth: 1                            
    },
    textInput2: {
        width: 150,
        height: 35,
        borderColor: '#e3e5e5',
        borderWidth: 1                            
    },
    item: {color: textColor},
    headerStyle: {marginTop:15, color: textColor, backgroundColor: searchbarColor}
});

const songsStyles = StyleSheet.create({
    item: {
        fontFamily: 'GillSans-Italic',
        color: textColor
    },
    paddingLeft: {
        paddingLeft: 10
    },
    albumart: {
        width: 55, 
        height: 55, 
        paddingLeft: 20, 
        paddingRight: 20, 
        resizeMode: 'contain',
        backgroundColor: bgColor
    },
    container5: { flex: .9, flexDirection: 'row', alignItems: 'stretch', backgroundColor: bgColor },
    container6: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent:'space-between', backgroundColor: bgColor },
});

const welcomeStyles = StyleSheet.create({
    title: {
        fontSize: 30,
        fontFamily: 'GillSans-Italic',
        padding: 10,
        color: textColor
    },
    intro: {
        fontSize: 16,
        fontFamily: 'GillSans-Italic',
        paddingLeft: 10,
        paddingRight: 10,
        color: textColor
    },
    container2: { flex: .3, alignItems: 'center', justifyContent: 'center', paddingTop: 10, backgroundColor: bgColor }
});

export { 
    styles, 
    albumsStyles,
    appStyles,
    artistsStyles,
    connectionsStyles,
    debugStyles,
    filesStyles,
    newPlaylistStyles,
    outputsStyles,
    playlistDetailsStyles,
    playlistEditorStyles,
    playlistStyles,
    playStyles,
    searchStyles,
    settingsStyles,
    songsStyles,
    welcomeStyles,
    iconColor,
    bgColor
}; 
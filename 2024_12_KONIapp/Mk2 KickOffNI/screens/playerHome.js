import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native'; // Needed to wrap the Tab Navigator
import GreenArrow from '../assets/GreenArrow.png'; // Import image showing the Green Arrow.
// Imported images to fill spaces
import discoverFillerRecommended from '../assets/PlayerRecommendedPicture.png';
import discoverFillerTodaysGames from '../assets/PlayerTodaysGamesPicture.png';
import communityFiller1 from '../assets/PlayerCommunityPicture1.png';
import communityFiller2 from '../assets/PlayerCommunityPicture2.png';
import scheduleFillerTop from '../assets/PlayerScheduleTop.png';
import scheduleFillerMiddle from '../assets/PlayerScheduleMiddle.png';
import scheduleFillerBottom from '../assets/PlayerScheduleBottom.png';
import profileFillerTop from '../assets/PlayerProfileTop.png';
import profileFillerBottom from '../assets/PlayerProfileBottom.png';

// For the Map on the Fields screen
import FieldMap from 'react-native-maps';

// For Tab Navigator and relevant Icons
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AntDesign, MaterialCommunityIcons, Fontisto, Ionicons, MaterialIcons } from '@expo/vector-icons'; // Search/Football/Globe/Calendar/Profile Icons (respectively)

export default function PlayerHome({ navigation }){

    const PlayerName = navigation.getParam('username'); // Stores player name in variable for easier access

    const BottomTabNav = createBottomTabNavigator(); // Bottom tabs for navigation

    const logoutHandler = () => {
        navigation.goBack(); // Pops Player screen off stack, returning to welcome screen!
    }

    // options={{tabBarIcon: ({ color, size }) => (<AntDesign name="search1" size={24} color={{focused? "rgb(0,225,130)":"rgb(4, 151, 229)"}} />)}} />

    return (
        <NavigationContainer> 
            <BottomTabNav.Navigator // Tab Navigator at bottom, used to navigate between screens.
                screenOptions={() => ({
                    headerShown: false,
                    tabBarStyle: {
                        backgroundColor: 'rgba(34,36,40,1)', // Grey background of the tabNavigator
                        borderTopWidth: 0, // gets rid of little white line above the tabs
                    },
                    tabBarActiveTintColor: 'rgb(0,225,130)', // turqoise green
                    tabBarInactiveTintColor: 'grey',
                })}
                >
                <BottomTabNav.Screen name="Discover" component={DiscoverScreen} 
                    options={({ navigation }) => ({
                        tabBarIcon: ({ focused, color }) => (
                        //   <Feather name="home" size={24} color={focused ? "red" : "green"} />
                          <AntDesign name="search1" size={24} color={focused ? "rgb(0,225,130)" : "grey"} /> // Changes icon's colour, turquoise green if active, grey if not.
                        ),
                      })} />
                <BottomTabNav.Screen name="Field" component={FieldScreen} 
                    options={({ navigation }) => ({
                        tabBarIcon: ({ focused, color }) => (
                          <MaterialCommunityIcons name="soccer-field" size={24} color={focused ? "rgb(0,225,130)" : "grey"} />
                        ),
                      })} />
                <BottomTabNav.Screen name="Community" component={CommunityScreen} 
                    options={({ navigation }) => ({
                        tabBarIcon: ({ focused, color }) => (
                          <Fontisto name="world-o" size={24} color={focused ? "rgb(0,225,130)" : "grey"} />
                        ),
                      })} />
                <BottomTabNav.Screen name="Schedule" component={ScheduleScreen} 
                    options={({ navigation }) => ({
                        tabBarIcon: ({ focused, color }) => (
                          <Ionicons name="calendar-outline" size={24} color={focused ? "rgb(0,225,130)" : "grey"} />
                        ),
                      })} />
                <BottomTabNav.Screen name="Profile" component={ProfileScreen} 
                    options={({ navigation }) => ({
                        tabBarIcon: ({ focused, color }) => (
                            <MaterialIcons name="person-outline" size={24} color={focused ? "rgb(0,225,130)" : "grey"} />
                        ),
                      })} />
            </BottomTabNav.Navigator>
        </NavigationContainer>
    )

    // Screens:
    // DISCOVER
    function DiscoverScreen() {
        return (
            <View style = {styles.container}>
                {/* ALL STYLES WILL BE SEMI-ORGANISED BELOW, BUT WILL BE FAR TIDIER ONCE ALL IN SEPARATE SCREENS WITH INDIVIDUAL STYLESHEETS!! */}
                <View style = {styles.discoverFixedView}>
                    <Text style={styles.discoverGreeting}>Hello {PlayerName}!</Text>
                    <Text style={styles.discoverInstruction}>Discover your next game:</Text>

                    {/* Input fields */}
                    {/* In a view to make them placed beside each other via 'flexDirection: row' */}
                    <View style={{flexDirection:'row'}}> 
                        <TextInput 
                            style={styles.discoverInputSmall}
                            // onChangeText={setLocation}
                            // value={location}
                            placeholder="> Location"
                            placeholderTextColor= '#7D7678' />
                        <TextInput 
                            style={styles.discoverInputSmall}
                            // onChangeText={setDate}
                            // value={date}
                            placeholder="> Date"
                            placeholderTextColor= '#7D7678' />
                    </View>

                    <TextInput 
                            style={styles.discoverInputLarge}
                            // onChangeText={setSearch}
                            // value={search}
                            placeholder="> Find a pitch, games and teams..."
                            placeholderTextColor= '#7D7678' />
                </View>

                <View  style = {styles.discoverScrollView}>
                    <ScrollView style={styles.discoverScrollableView}>
                        {/* Touchable so can tap anywhere to open the window */}
                        <TouchableOpacity> 
                            <Text style={styles.discoverFillerTitle}>Recommended for you        <Image source={GreenArrow} style={styles.discoverGArrow} /></Text>
                            <Image source={discoverFillerRecommended} style={styles.discoverFillerImage} />
                        </TouchableOpacity>
                        
                        {/* Touchable so can tap anywhere to open the window */}
                        <TouchableOpacity> 
                            <Text style={styles.discoverFillerTitle}>Today's Games        <Image source={GreenArrow} style={styles.discoverGArrow} /></Text>
                            <Image source={discoverFillerTodaysGames} style={styles.discoverFillerImage} />
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        );
    }

    // FIELD
    function FieldScreen() {
        return (
            <View style = {styles.container}>
                {/* ALL STYLES WILL BE SEMI-ORGANISED BELOW, BUT WILL BE FAR TIDIER ONCE ALL IN SEPARATE SCREENS WITH INDIVIDUAL STYLESHEETS!! */}
                <View style = {styles.fieldFixedView}>
                    <Text style={styles.fieldGreeting}>Choose your preferred location: </Text>

                    {/* Input field for location */}
                    <TextInput 
                            style={styles.fieldInputLarge}
                            // onChangeText={setSearch}
                            // value={search}
                            placeholder="> Search"
                            placeholderTextColor= '#7D7678' />
                </View>

                <View style = {styles.fieldMapView}>
                    {/* MAPPPP!!! */}
                    <FieldMap style={styles.fieldMap} />
                </View>
            </View>
        );
    }

    // Community
    function CommunityScreen() {
        return (
            <View style = {styles.container}>
                {/* ALL STYLES WILL BE SEMI-ORGANISED BELOW, BUT WILL BE FAR TIDIER ONCE ALL IN SEPARATE SCREENS WITH INDIVIDUAL STYLESHEETS!! */}
                <View style = {styles.comsFixedView}>
                    <Text style={styles.comsGreeting}>Community: </Text>
                    <Text style={styles.comsInstruction}>A digital space for all football-lovers to communicate and share their experience with the beautiful game. </Text>
                </View>

                {/* Scroll view for storing community content */}
                <ScrollView style = {styles.comsScrollable}>
                    <Image source={communityFiller1} style={styles.communityFillerImage} />
                    <Image source={communityFiller2} style={styles.communityFillerImage} />
                </ScrollView>
            </View>
        );
    }

    // Schedule
    function ScheduleScreen() {
        return (
            <View style = {styles.container}>
                {/* ALL STYLES WILL BE SEMI-ORGANISED BELOW, BUT WILL BE FAR TIDIER ONCE ALL IN SEPARATE SCREENS WITH INDIVIDUAL STYLESHEETS!! */}
                <View style = {styles.scheduleFixedView}>
                    <Text style={styles.scheduleGreeting}>Schedule: </Text>
                </View>

                {/* Scroll view for storing schedule content */}
                <ScrollView style = {styles.scheduleScrollable}>
                    {/* Touchable so can tap anywhere to open the window */}
                    <TouchableOpacity> 
                        <Image source={scheduleFillerTop} style={styles.scheduleFillerImage} />
                    </TouchableOpacity>

                    {/* Touchable so can tap anywhere to open the window */}
                    <TouchableOpacity> 
                        <Text style={styles.discoverFillerTitle}>Your upcoming games        <Image source={GreenArrow} style={styles.scheduleGArrow} /></Text>
                        <Image source={scheduleFillerMiddle} style={styles.scheduleFillerImage} />
                    </TouchableOpacity>
                        
                    {/* Touchable so can tap anywhere to open the window */}
                    <TouchableOpacity> 
                        <Text style={styles.discoverFillerTitle}>Your Previous games        <Image source={GreenArrow} style={styles.scheduleGArrow} /></Text>
                        <Image source={scheduleFillerBottom} style={styles.scheduleFillerImage} />
                    </TouchableOpacity>
                </ScrollView>
            </View>
        );
    }

    // Profile
    function ProfileScreen() {
        return (
            <View style = {styles.container}>
                {/* ALL STYLES WILL BE SEMI-ORGANISED BELOW, BUT WILL BE FAR TIDIER ONCE ALL IN SEPARATE SCREENS WITH INDIVIDUAL STYLESHEETS!! */}
                <View style = {styles.profileFixedView}>
                    <Text style={styles.profileGreeting}>Profile: </Text>
                </View>

                {/* Scroll view for storing profile content */}
                <ScrollView style = {styles.profileScrollable}>
                    {/* Touchable so can tap anywhere to open the window */}
                    <TouchableOpacity> 
                        <Image source={profileFillerTop} style={styles.profileFillerImage} />
                    </TouchableOpacity>

                    <TouchableOpacity> 
                        <Image source={profileFillerBottom} style={styles.profileFillerImage} />
                    </TouchableOpacity>

                    {/* "Logout" button */}
                    <TouchableOpacity style = {styles.logoutOpacity} onPress={() => logoutHandler()}>
                        <Text style = {styles.logoutText}>Sign Out <Image source={GreenArrow} style={styles.profileGArrow} /></Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1, // take up the whole screen
        // No backgroundColor as contains the individual views which are styled accordingly.
    },
    // ==================== DISCOVER SCREEN ====================
    discoverFixedView: {
        flex: 0.35, // Looks about ~1/4 of screen. Needs checked and clarified.
        position: 'relative', // relative to the parent view, so 35% of screen
        paddingTop: 24,
        backgroundColor: 'rgb(35, 31, 32)', // charcoal grey
    },

    discoverGreeting: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#a4a3a3', // Light gray, as from Figma
        paddingLeft: 24,
    },

    discoverInstruction: {
        fontSize: 18,
        fontWeight: '400',
        color: 'white',
        paddingLeft: 24,
    },

    discoverInputSmall: {
        height: 40,
        width: '40%',
        margin: 20, // 20px all round
        borderRadius: 10,
        paddingLeft: 10,
        backgroundColor: '#413C3D', // Lighter gray

        fontSize: 22, // Font size of text within input field
        color: 'white' // Colour of INPUTTED text
    },

    discoverInputLarge: {
        height: 40,
        width: '90%',
        margin: 20, // 20px all round
        marginTop: 0, // So closer to above fields, looker better.
        borderRadius: 10,
        paddingLeft: 10,
        backgroundColor: '#413C3D', // Lighter gray

        fontSize: 22, // Font size of text within input field
        color: 'white' // Colour of INPUTTED text
    },

    discoverScrollView: {
        flex: 0.65, // Fills rest of screen. Needs checked and clarified.
        position: 'relative',
        backgroundColor: '#262424' // lighter gray than fixed view
    },

    discoverFillerTitle: {
        fontSize: 22,
        fontWeight: '500',
        color: 'rgb(0,225,130)', // turqoise green
        paddingLeft: 24,
        marginTop: 10,
    },

    discoverGArrow: {
        width: 24, 
        height: 24,
    },

    discoverFillerImage:{
        width: '100%',
        resizeMode: 'contain',
    },


    // ==================== FIELD SCREEN ====================
    fieldFixedView: {
        flex: 0.2, // Uses 1/5 of the screen (Excluding the TabNavigator)
        position: 'relative', // relative to the parent view, so 35% of screen
        paddingTop: 24,
        backgroundColor: 'rgb(35, 31, 32)', // charcoal grey
    },

    fieldGreeting: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#a4a3a3', // Light gray, as from Figma
        paddingLeft: 24,
    },

    fieldInputLarge: {
        height: 40,
        width: '90%',
        margin: 20, // 20px all round
        borderRadius: 10,
        paddingLeft: 10,
        backgroundColor: '#413C3D', // Lighter gray

        fontSize: 22, // Font size of text within input field
        color: 'white' // Colour of INPUTTED text
    },

    fieldMapView: {
        flex: 0.8, // Uses rest of the screen (Excluding the TabNavigator)
        position: 'relative', // relative to the parent view
        backgroundColor: 'red', // charcoal grey
    },

    fieldMap: {
        flex: 1,
    },

    // ==================== COMMUNITY SCREEN ====================
    comsFixedView: {
        flex: 0.2, // Uses 1/5 of the screen (Excluding the TabNavigator)
        position: 'relative', // relative to the parent view, so 35% of screen
        paddingTop: 24,
        backgroundColor: 'rgb(35, 31, 32)', // charcoal grey
    },

    comsGreeting: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#a4a3a3', // Light gray, as from Figma
        paddingLeft: 24,
    },

    comsInstruction: {
        fontSize: 18,
        fontWeight: '400',
        color: 'white',
        paddingLeft: 24,
    },

    comsScrollable: {
        flex: 0.8, // Uses 4/5 of the screen (Excluding the TabNavigator)
        position: 'relative', // relative to the parent view, so 35% of screen
        backgroundColor: '#1c191a', // same colour as picture to look better when at max scroll
    },

    // ==================== SCHEDULE SCREEN ====================
    scheduleFixedView: {
        flex: 0.08,
        position: 'relative',
        paddingTop: 24,
        backgroundColor: 'rgb(35, 31, 32)', // charcoal grey
    },

    scheduleGreeting: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#a4a3a3', // Light gray, as from Figma
        paddingLeft: 24,
    },

    scheduleScrollable: {
        flex: 0.92,
        position: 'relative',
        backgroundColor: '#1c191a', // same colour as picture to look better when at max scroll
    },

    scheduleFillerImage: {
        width: '100%',
        resizeMode: 'contain',
    },

    scheduleGArrow: {
        width: 24, 
        height: 24,
    },

    // ==================== PROFILE SCREEN ====================
    profileFixedView: {
        flex: 0.08,
        position: 'relative',
        paddingTop: 24,
        backgroundColor: 'rgb(35, 31, 32)', // charcoal grey
    },

    profileGreeting: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#a4a3a3', // Light gray, as from Figma
        paddingLeft: 24,
    },

    profileScrollable: {
        flex: 0.92,
        position: 'relative',
        backgroundColor: '#1c191a', // same colour as picture to look better when at max scroll
    },

    profileFillerImage: {
        marginTop: 20,
        width: '100%',
        resizeMode: 'contain',
    },
    
    logoutOpacity: { // "Logout" button
        padding: 15,
        backgroundColor: 'rgb(0,225,130)', // turqoise green
        borderRadius: 100,
        margin: 20,
    },
    
    logoutText: {
        textAlign: 'center',
        fontSize: 24,
        fontWeight: '700',
        color: 'white',
    },

    profileGArrow: {
        width: 24, 
        height: 24,
        backgroundColor: 'white',
        borderRadius: 10,
    },
});
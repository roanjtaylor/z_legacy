import React from 'react';
import { View, Text, Image, TouchableOpacity, TextInput, StyleSheet} from 'react-native';
import GreenArrow from '../assets/GreenArrow.png'; // Import image showing the Green Arrow.
// import UsernameLogo from '../assets/usernameLogo.png'; // Add in future
import GoogleIcon from '../assets/GoogleIcon.png';      // Import images
import AppleIcon from '../assets/AppleIcon.png';        // for the alternative
import FacebookIcon from '../assets/FacebookIcon.png';  // signIn options.

export default function Login({ navigation }){

    const [username, onChangeUsername] = React.useState('');
    const [password, onChangePassword] = React.useState('');

    const registerHandler = () => {
        navigation.goBack(); // Pops Login screen off stack
        navigation.navigate('Register'); // Pushes Register screen onto stack
    }

    const loginHandler = () => {
        navigation.goBack(); // Pops Login screen off stack
        navigation.navigate('PlayerHome', {username}); // Pushes PlayerHomepage screen onto stack
    }

    return (
        <View style = {styles.container}>
            {/* Screen Title */}
            <Text style={styles.headingText}>
                Welcome Back!
            </Text>

            {/* Username entry field */}
            <TextInput 
                style={styles.inputFields}
                onChangeText={onChangeUsername}
                value={username}
                placeholder="> Username or Email"
                placeholderTextColor= '#7D7678' />

            {/* Password entry field */}
            <TextInput 
                style={styles.inputFields}
                onChangeText={onChangePassword}
                value={password}
                placeholder="> Password"
                placeholderTextColor= '#7D7678'
                secureTextEntry={true} />

            {/* "Forgot password?" button */}
            <TouchableOpacity style = {styles.fpOpacity}>
                <Text style = {styles.fpText}>Forgot password?</Text>
            </TouchableOpacity>


            {/* Media sign in options */}
            <Text style={styles.mediaText}>Or Sign In with one of the following:</Text>
            <View style={{justifyContent: 'center', flexDirection: 'row'}}>
                <TouchableOpacity style={styles.mediaTouchable}><Image source={GoogleIcon} style={styles.mediaImage} /></TouchableOpacity>
                <TouchableOpacity style={styles.mediaTouchable}><Image source={AppleIcon} style={styles.mediaImage} /></TouchableOpacity>
                <TouchableOpacity style={styles.mediaTouchable}><Image source={FacebookIcon} style={styles.mediaImage} /></TouchableOpacity>
            </View>

            {/* "Sign In" button */}
            <TouchableOpacity style = {styles.siOpacity} onPress={() => loginHandler()}>
                <Text style = {styles.siText}>Sign In <Image source={GreenArrow} style={styles.gArrow} /></Text>
            </TouchableOpacity>

            {/* "Don't have an account?" button */}
            <TouchableOpacity style = {styles.registerOpacity} onPress={() => registerHandler()}>
                <Text style = {styles.registerText}>Don't have an account?</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1, // take up the whole screen
        padding: 10,
        backgroundColor: 'rgb(35, 31, 32)', // charcoal grey
    },

    // Headline texts
    headingText: {
        fontSize: 32,
        fontWeight: '700',
        color: 'rgb(0,225,130)', // turqoise green
        textAlign: 'center',
        marginTop: 40
    },

    // Input fields
    inputFields: {
        height: 40,
        margin: 20, // 20px all round
        borderRadius: 10,
        padding: 30,
        backgroundColor: '#413C3D', // Lighter gray

        fontSize: 18, // Font size of text within input field
        color: 'white' // Colour of INPUTTED text
    },

    // "Forgot password?" button
    fpOpacity: {
        marginRight: 20,
        marginTop: -8, // So positioned below input field nicely, pushes it into the Input field's margin
    },
    
    fpText: {
        textAlign: 'right',
        fontSize: 18,
        color: 'rgb(0,225,130)', // turqoise green
    },

    // Media options
    mediaText: {
        marginTop: 20,
        textAlign: 'center',
        color: 'cyan',
        fontSize: 18,
    },

    mediaTouchable: {
        margin: 10,         // Have blank gap between adjacent components.
        marginLeft: 20,     // Override horizontal margins here to increase spacing.
        marginRight: 20,
        padding: 10,        // Extend grey background
        backgroundColor: '#413C3D', // Lighter gray
        borderRadius: 100,
    },

    mediaImage: {
        alignSelf: 'center',
        width: 40, // Image dimensions
        height: 40,
    },

    // "Sign In" button
    siOpacity: {
        marginTop: 50,
        padding: 15,
        backgroundColor: 'rgb(0,225,130)', // turqoise green
        borderRadius: 100,
    },
    
    siText: {
        textAlign: 'center',
        fontSize: 24,
        fontWeight: '700',
        color: 'white',
    },

    gArrow: {
        width: 24, 
        height: 24, 
        backgroundColor: 'white',
        borderRadius: 10,
    },

    // "Don't have an account?" button
    registerOpacity: {
        marginTop: 20,
        padding: 0,
    },
    
    registerText: {
        textAlign: 'center',
        fontSize: 18,
        color: 'rgb(0,225,130)', // turqoise green
    },
});
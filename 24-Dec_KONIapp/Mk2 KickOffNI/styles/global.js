import { StyleSheet } from "react-native";

// Redundant now, don't use it- maybe helpful in the future...

export const globalStyles = StyleSheet.create({

    container: {
        flex: 1, // take up the whole screen
        padding: 24,
        backgroundColor: 'white',
    },

    titleText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },

    paragraph: {
        marginVertical: 8,
        lineHeight: 20, // distance between lines of text
    }


});
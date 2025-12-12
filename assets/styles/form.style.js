import { Dimensions, StyleSheet } from "react-native";
import { COLORS } from '../../constants/colors';

const { height } = Dimensions.get("window");

export const formStyle = StyleSheet.create({

    campTitle :{
        fontSize: 18,
        fontFamily: 'elvetica',
        color: COLORS.titleform,
    },

    textInput: {
        fontSize: 16,
        color: COLORS.text,
        paddingVertical: 16,
        paddingHorizontal: 20,
        backgroundColor: COLORS.background,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        margin: 5,
    },
    image: {
        width: 200,
        height: 200,
    },

    newInventoryButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 15,
        borderRadius: 12,
        marginTop: 10,
        width: '200',
        alignSelf: 'center',
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.white,
        textAlign: "center",
    },

})
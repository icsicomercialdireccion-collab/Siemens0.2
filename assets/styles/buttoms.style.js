import { Dimensions, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

const { width } = Dimensions.get("window");

export const buttomAddInventory = StyleSheet.create ({
    floatingButton:{
        position: 'absolute',
        bottom: 18,
        alignSelf: 'center',
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 30,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: width, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },

    floatingButtonText:{
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
        width: 150
    },

}) 

export const buttomAddLap = StyleSheet.create({

})  

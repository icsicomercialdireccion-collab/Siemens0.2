import { homeStyles } from '@/assets/styles/home.style';
import React from 'react';
import { ScrollView, View } from 'react-native';


const HomeScreenAdmin = () => {
  return (
    <View style={homeStyles.container}>
     <ScrollView
        showsVerticalScrollIndicator={false}
        ContainerStyle={homeStyles.scrollContent}
      >
        {/*<buttomInventoryG/>*/}
      </ScrollView>
      
    </View>
  )
}

export default HomeScreenAdmin
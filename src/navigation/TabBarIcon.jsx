import React from 'react';
import { View } from 'react-native';

// Icon with a soft pill background when the tab is focused
const TabBarIcon = ({ icon: Icon, focused, color, activeBg }) => (
  <View
    style={{
      width: 46,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: focused ? activeBg : 'transparent',
    }}
  >
    <Icon size={21} color={color} strokeWidth={focused ? 2.4 : 2} />
  </View>
);

export default TabBarIcon;

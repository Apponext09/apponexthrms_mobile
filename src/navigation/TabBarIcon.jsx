import React from 'react';
import { Ionicons } from '@react-native-vector-icons/ionicons';

// Active tab shows the filled glyph in the brand color; inactive tabs use the outline glyph
const TabBarIcon = ({ name, focused, color, size = 24 }) => (
  <Ionicons
    name={focused ? name : `${name}-outline`}
    size={size}
    color={color}
  />
);

export default TabBarIcon;

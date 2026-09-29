import React from 'react';
import { Ionicons } from '@react-native-vector-icons/ionicons';

// App-wide icon set, backed by Ionicons.
// Each icon renders the outline glyph by default; pass `filled` for the solid
// glyph (used on colored tiles, quick actions and header buttons).
// Usage: <Mail size={18} color={colors.primary} /> or <Wallet filled />
const make = (glyph, displayName) => {
  const Icon = ({ size = 20, color, filled = false, style }) => (
    <Ionicons
      name={filled ? glyph : `${glyph}-outline`}
      size={size}
      color={color}
      style={style}
    />
  );
  Icon.displayName = displayName;
  return Icon;
};

export const AlarmClock = make('alarm', 'AlarmClock');
export const AlertCircle = make('alert-circle', 'AlertCircle');
export const BadgeCheck = make('checkmark-done-circle', 'BadgeCheck');
export const Bell = make('notifications', 'Bell');
export const BellOff = make('notifications-off', 'BellOff');
export const BellRing = make('notifications', 'BellRing');
export const Briefcase = make('briefcase', 'Briefcase');
export const Building = make('business', 'Building');
export const Building2 = make('business', 'Building2');
export const CalendarCheck = make('calendar', 'CalendarCheck');
export const CalendarClock = make('calendar-clear', 'CalendarClock');
export const CalendarDays = make('calendar', 'CalendarDays');
export const CalendarOff = make('calendar-clear', 'CalendarOff');
export const CalendarPlus = make('calendar', 'CalendarPlus');
export const CalendarRange = make('calendar', 'CalendarRange');
export const CalendarX2 = make('calendar-clear', 'CalendarX2');
export const Camera = make('camera', 'Camera');
export const Check = make('checkmark', 'Check');
export const CheckCheck = make('checkmark-done', 'CheckCheck');
export const CheckCircle2 = make('checkmark-circle', 'CheckCircle2');
export const ChevronDown = make('chevron-down', 'ChevronDown');
export const ChevronLeft = make('chevron-back', 'ChevronLeft');
export const ChevronRight = make('chevron-forward', 'ChevronRight');
export const ChevronUp = make('chevron-up', 'ChevronUp');
export const ClipboardCheck = make('clipboard', 'ClipboardCheck');
export const ClipboardList = make('clipboard', 'ClipboardList');
export const Clock = make('time', 'Clock');
export const Coffee = make('cafe', 'Coffee');
export const Eye = make('eye', 'Eye');
export const EyeOff = make('eye-off', 'EyeOff');
export const FileText = make('document-text', 'FileText');
export const HelpCircle = make('help-circle', 'HelpCircle');
export const History = make('finger-print', 'History');
export const Hourglass = make('hourglass', 'Hourglass');
export const ImagePlus = make('images', 'ImagePlus');
export const Inbox = make('file-tray', 'Inbox');
export const Info = make('information-circle', 'Info');
export const KeyRound = make('key', 'KeyRound');
export const Layers = make('layers', 'Layers');
export const Lock = make('lock-closed', 'Lock');
export const LogIn = make('log-in', 'LogIn');
export const LogOut = make('log-out', 'LogOut');
export const Mail = make('mail', 'Mail');
export const MapPin = make('location', 'MapPin');
export const Moon = make('moon', 'Moon');
export const Phone = make('call', 'Phone');
export const Play = make('play', 'Play');
export const Plus = make('add', 'Plus');
export const Receipt = make('receipt', 'Receipt');
export const ReceiptText = make('receipt', 'ReceiptText');
export const Settings = make('settings', 'Settings');
export const ShieldCheck = make('shield-checkmark', 'ShieldCheck');
export const Smartphone = make('phone-portrait', 'Smartphone');
export const Sun = make('sunny', 'Sun');
export const Trash2 = make('trash', 'Trash2');
export const TrendingDown = make('trending-down', 'TrendingDown');
export const UserPen = make('create', 'UserPen');
export const UserPlus = make('person-add', 'UserPlus');
export const UserRound = make('person', 'UserRound');
export const Users = make('people', 'Users');
export const Wallet = make('wallet', 'Wallet');
export const X = make('close', 'X');
export const XCircle = make('close-circle', 'XCircle');

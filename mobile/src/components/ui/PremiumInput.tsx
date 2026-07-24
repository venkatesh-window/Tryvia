import React, { useState } from 'react';
import { TextInput, TextInputProps, StyleSheet, View } from 'react-native';
import { MotiView, MotiText } from 'moti';
import { useTheme } from '../../hooks/useTheme';
import * as Haptics from 'expo-haptics';

interface PremiumInputProps extends TextInputProps {
  label: string;
}

export const PremiumInput: React.FC<PremiumInputProps> = ({
  label,
  value,
  onChangeText,
  onFocus,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const theme = useTheme();

  const isFloating = isFocused || (value && value.length > 0);

  const handleFocus = (e: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  return (
    <View style={styles.container}>
      <MotiView
        animate={{
          borderColor: isFocused ? theme.colors.tertiary.main : theme.colors.border.glass,
          backgroundColor: isFocused ? theme.colors.background.default : theme.colors.background.paper,
        }}
        transition={{ type: 'timing', duration: 300 }}
        style={[
          styles.inputContainer,
          { borderRadius: theme.radius.md },
        ]}
      >
        <MotiText
          animate={{
            translateY: isFloating ? -24 : 14,
            scale: isFloating ? 0.85 : 1,
          }}
          transition={{ type: 'timing', duration: 250 }}
          style={[styles.label, { left: 16, color: isFocused ? theme.colors.tertiary.main : theme.colors.text.secondary }]}
        >
          {label}
        </MotiText>
        
        <TextInput
          style={[
            styles.input,
            { color: theme.colors.text.primary, fontSize: 16 },
          ]}
          onFocus={handleFocus}
          onBlur={() => setIsFocused(false)}
          value={value}
          onChangeText={onChangeText}
          {...props}
        />
      </MotiView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  inputContainer: {
    borderWidth: 1,
    height: 56,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  label: {
    position: 'absolute',
    top: 0,
    transformOrigin: 'top left',
  },
  input: {
    height: 30,
    padding: 0,
    margin: 0,
  },
});

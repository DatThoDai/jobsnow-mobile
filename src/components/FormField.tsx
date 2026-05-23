import React from 'react';
import { StyleSheet, TextInput, View, TextInputProps } from 'react-native';
import { AppText } from './AppText';
import { colors, radius, spacing, fontFamilies } from '../theme';

interface FormFieldProps extends Omit<TextInputProps, 'onChangeText' | 'value' | 'onChange'> {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  error?: string;
}

export function FormField({
  label,
  value,
  onChange,
  hint,
  error,
  multiline,
  placeholder,
  ...rest
}: FormFieldProps) {
  return (
    <View style={styles.wrap}>
      <AppText variant="caption" color="textSecondary" style={styles.label}>
        {label}
      </AppText>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline, error && styles.inputError]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        {...rest}
      />
      {hint && !error ? (
        <AppText variant="caption" color="textMuted" style={styles.hint}>
          {hint}
        </AppText>
      ) : null}
      {error ? (
        <AppText variant="caption" style={styles.errorText}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: { marginBottom: spacing.xs, fontWeight: '600' },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontFamily: fontFamilies.body,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  inputMultiline: { minHeight: 96, textAlignVertical: 'top' },
  inputError: { borderColor: colors.danger },
  hint: { marginTop: spacing.xs },
  errorText: { marginTop: spacing.xs, color: colors.danger },
});

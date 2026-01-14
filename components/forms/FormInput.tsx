import { forwardRef } from "react";
import { TextInput, TextInputProps } from "react-native";
import {
  Controller,
  Control,
  FieldValues,
  Path,
  RegisterOptions,
} from "react-hook-form";
import { Input } from "@/components/ui/Input";
import { Ionicons } from "@expo/vector-icons";

interface FormInputProps<T extends FieldValues>
  extends Omit<TextInputProps, "value" | "onChangeText"> {
  name: Path<T>;
  control: Control<T>;
  rules?: RegisterOptions<T, Path<T>>;
  label?: string;
  hint?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerClassName?: string;
  inputClassName?: string;
}

/**
 * Form-connected Input component using React Hook Form
 * Automatically handles validation errors and form state
 */
export const FormInput = forwardRef(function FormInputInner<
  T extends FieldValues
>(
  {
    name,
    control,
    rules,
    label,
    hint,
    leftIcon,
    rightIcon,
    onRightIconPress,
    containerClassName,
    inputClassName,
    ...props
  }: FormInputProps<T>,
  ref: React.Ref<TextInput>
) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({
        field: { onChange, onBlur, value },
        fieldState: { error },
      }) => (
        <Input
          ref={ref}
          label={label}
          value={value}
          onChangeText={onChange}
          onBlur={onBlur}
          error={error?.message}
          hint={hint}
          leftIcon={leftIcon}
          rightIcon={rightIcon}
          onRightIconPress={onRightIconPress}
          containerClassName={containerClassName}
          inputClassName={inputClassName}
          {...props}
        />
      )}
    />
  );
}) as <T extends FieldValues>(
  props: FormInputProps<T> & { ref?: React.Ref<TextInput> }
) => JSX.Element;

import React from "react";
import { NumberInput } from "@tremor/react";
import { useTranslate } from "@/i18n";

interface NumericalInputProps {
  step?: number;
  style?: React.CSSProperties;
  placeholder?: string;
  min?: number;
  max?: number;
  onChange?: any; // Using any to avoid type conflicts with Tremor's NumberInput
  [key: string]: any;
}

/**
 * A reusable numerical input component
 * @param {Object} props - Component props
 * @param {number} [props.step=0.01] - Step increment for the input
 * @param {Object} [props.style] - Custom styles to apply
 * @param {string} [props.placeholder] - Placeholder text
 * @param {number} [props.min] - Minimum value
 * @param {number} [props.max] - Maximum value
 * @param {Function} [props.onChange] - On change handler
 * @param {any} props.rest - Additional props passed to NumberInput
 */
const NumericalInput: React.FC<NumericalInputProps> = ({
  step = 0.01,
  style = { width: "100%" },
  placeholder,
  min,
  max,
  onChange,
  ...rest
}) => {
  const t = useTranslate();
  const defaultPlaceholder = t("Enter a numerical value");

  return (
    <NumberInput
      onWheel={(event) => event.currentTarget.blur()}
      step={step}
      style={style}
      placeholder={placeholder || defaultPlaceholder}
      min={min}
      max={max}
      onChange={onChange}
      {...rest}
    />
  );
};

export default NumericalInput;


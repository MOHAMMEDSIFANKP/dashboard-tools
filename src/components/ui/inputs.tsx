import Select, { StylesConfig, GroupBase, OptionsOrGroups, Props as SelectProps } from 'react-select';

type OptionType = {
  label: string;
  value: string | number;
};

interface CustomSelectProps extends Partial<SelectProps<OptionType, false, GroupBase<OptionType>>> {
  options?: OptionsOrGroups<OptionType, GroupBase<OptionType>>;
  borderColor?: string;
  className?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options = [],
  borderColor = "#1172a6",
  value,
  onChange,
  onFocus,
  onBlur,
  placeholder = "",
  className = "",
  ...rest
}) => {
    type OptionType = {
      label: string;
      value: string | number;
    };
    
    const customStyles: StylesConfig<OptionType, false, GroupBase<OptionType>> = {
      control: (provided, state) => ({
        ...provided,
        borderRadius: '10px',
        height: '20px',
        boxShadow: 'none',
        // borderColor: '#1172a6',
        backgroundColor: state.isFocused ? 'white' : 'white',
        // '&:hover': {
        //   borderColor: '#1172a6',
        // },
      }),
      placeholder: (provided) => ({
        ...provided,
        color: '#BABABA',
        fontFamily: "Roboto, sans-serif",
        fontSize: "14px",
        lineHeight: "20px",
      }),
      indicatorSeparator: () => ({
        display: 'none',
      }),
      menu: (provided) => ({
        ...provided,
        borderRadius: '6px',
        overflow: 'hidden',
        zIndex: 11,
      }),
      option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isFocused ? '#79bfe5' : 'white',
        color: '#000',
        '&:hover': {
          backgroundColor: '#79bfe5',
        },
      }),
    };
    

  return (
    <Select
      styles={customStyles}
      value={value}
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
      placeholder={placeholder}
      options={options}
      className={className}
      {...rest}
    />
  );
};

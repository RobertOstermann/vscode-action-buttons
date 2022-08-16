type DropdownOptions = {
  ignoreFocusOut?: boolean;
  placeholder?: string;
  prompt?: string;
  title?: string;
};

type Dropdown = {
  id?: string;
  label?: string;
  commands?: string[];
  color?: string;
  ignoreFocusOut?: boolean;
  tooltip?: string;
  options?: DropdownOptions;
};

export default Dropdown;

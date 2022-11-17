export type TerminalOptions = {
  name?: string;
  clear?: boolean;
  workingDirectory?: string;
  focus?: boolean;
  singleInstance?: boolean;
};

type CustomCommand = {
  id: string;
  label: string;
  command: string;
  executeCommand: boolean;
  executeCommandArguments: string[];
  terminal: TerminalOptions;
};

export default CustomCommand;

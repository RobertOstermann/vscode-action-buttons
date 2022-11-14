import * as vscode from "vscode";

import CommandButton, { TerminalOptions } from "./types/command";

export const getPackageJson = async (): Promise<undefined | any> =>
  new Promise(resolve => {
    const cwd = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0]?.uri?.fsPath : undefined;

    try {
      const packageJson = require(`${cwd}/package.json`); // eslint-disable-line @typescript-eslint/no-var-requires

      resolve(packageJson);
    } catch (e) {
      resolve(undefined);
    }
  });

export const buildConfigFromPackageJson = async (defaultColor: string) => {
  const packageJson = await getPackageJson();
  if (!packageJson) {
    return [];
  }
  const { scripts } = packageJson;

  const cwd = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0]?.uri?.fsPath : undefined;
  const terminalOptions: TerminalOptions = {
    cwd,
    focus: true,
    singleInstance: true
  };

  return Object.keys(scripts).map((key) => {
    const command: CommandButton = {
      id: key,
      label: key,
      command: `npm run ${key}`,
      alignment: vscode.StatusBarAlignment.Left,
      color: defaultColor,
      priority: 0,
      saveAll: false,
      showButton: true,
      tooltip: undefined,
      terminal: terminalOptions,
      useVsCodeApi: false,
      args: [],
    };

    return command;
  }) as CommandButton[];
};

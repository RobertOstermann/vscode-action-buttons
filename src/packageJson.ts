import { StatusBarAlignment, workspace } from "vscode";

import CommandButton, { TerminalOptions } from "./types/command";

export const getPackageJson = async (): Promise<undefined | any> =>
  new Promise(resolve => {
    const cwd = workspace.workspaceFolders[0].uri.fsPath;

    try {
      const packageJson = require(`${cwd}/package.json`); // eslint-disable-line @typescript-eslint/no-var-requires

      resolve(packageJson);
    } catch (e) {
      resolve(undefined);
    }
  });

export const buildConfigFromPackageJson = async (defaultColor: string) => {
  const pkg = await getPackageJson();
  if (!pkg) {
    return [];
  }
  const { scripts } = pkg;

  const terminalOptions: TerminalOptions = {
    cwd: workspace.workspaceFolders[0].uri.fsPath,
    focus: true,
    singleInstance: true
  };

  return Object.keys(scripts).map(key => ({
    id: key,
    label: key,
    command: `npm run ${key}`,
    alignment: StatusBarAlignment.Left,
    color: defaultColor,
    priority: 0,
    createButton: true,
    saveAll: false,
    showButton: true,
    tooltip: null,
    terminal: terminalOptions,
    useVsCodeApi: false,
    args: [],
  })) as CommandButton[];
};

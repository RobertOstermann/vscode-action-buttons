import * as vscode from "vscode";

import Button from "./buttons/button";
import Command from "./buttons/command";
import Dropdown from "./buttons/dropdown";
import Configuration from "./helpers/configuration";
import { buildConfigFromPackageJson } from "./packageJson";
import CommandButton from "./types/command";
import StatusBarButton from "./types/statusBar";

const init = async (context: vscode.ExtensionContext, disposables: vscode.Disposable[]): Promise<vscode.Disposable[]> => {
  const commands: CommandButton[] = [];
  const commandIds: Set<string> = new Set();

  if (Configuration.showReloadButton()) {
    const statusBarOptions: StatusBarButton = {
      alignment: vscode.StatusBarAlignment.Left,
      color: Configuration.defaultColor(),
      command: Configuration.extensionName + ".refreshButtons",
      label: Configuration.reloadButton(),
      tooltip: "Refresh the status bar buttons.",
      priority: 0
    };

    Button.createStatusBarButton(statusBarOptions, disposables);
  }

  if (Configuration.commands() && Configuration.commands().length) {
    commands.push(...Configuration.commands());
  }

  if (Configuration.loadNpmCommands()) {
    commands.push(...(await buildConfigFromPackageJson(Configuration.defaultColor())));
  }

  Command.createCommands(context, commands, commandIds, disposables);
  Dropdown.createDropdowns(context, commands, commandIds, disposables);

  return disposables;
};

export default init;

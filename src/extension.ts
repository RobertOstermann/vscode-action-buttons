"use strict";
import * as vscode from "vscode";

import Command from "./commands/command";
import Dropdown from "./commands/dropdown";
import StatusBarItem from "./commands/statusBar/statusBarItem";
import StatusBarButton from "./commands/statusBar/types/statusBarButton";
import CustomCommand from "./commands/types/command";
import Configuration from "./helpers/configuration";

const refreshCommand = ".refreshButtons";
let disposables: vscode.Disposable[] = [];

const initialize = async (context: vscode.ExtensionContext, disposables: vscode.Disposable[]): Promise<vscode.Disposable[]> => {
  const commands: CustomCommand[] = [];
  const commandIds: Set<string> = new Set();

  if (Configuration.showReloadButton()) {
    const statusBarOptions: StatusBarButton = {
      alignment: vscode.StatusBarAlignment.Left,
      color: Configuration.defaultColor(),
      command: Configuration.extensionName + refreshCommand,
      label: Configuration.reloadButton(),
      tooltip: "Refresh the custom commands extension.",
      priority: 0
    };

    StatusBarItem.createStatusBarButton(statusBarOptions, disposables);
  }

  if (Configuration.commands() && Configuration.commands().length) {
    commands.push(...Configuration.commands());
  }

  Command.createCommands(context, commands, commandIds, disposables);
  Dropdown.createDropdowns(context, commands, commandIds, disposables);

  /* Status Bar */
  // StatusBarItem.createStatusBarButton(statusBarOptions, disposables);

  return disposables;
};

const refresh = async (context: vscode.ExtensionContext): Promise<void> => {
  // Clean up the previous commands.
  disposables.forEach((disposable: vscode.Disposable) => disposable.dispose());
  disposables.splice(0, disposables.length);

  // Add the new commands to the list of disposables.
  disposables = Configuration.initialize(context);
  disposables = await initialize(context, disposables);
};

export function activate(context: vscode.ExtensionContext) {
  refresh(context);

  const disposable = vscode.commands.registerCommand(
    `${Configuration.extensionName}.${refreshCommand}`,
    () => refresh(context)
  );

  context.subscriptions.push(disposable);
}

// This method is called when the extension is deactivated
export function deactivate() {
  return;
}

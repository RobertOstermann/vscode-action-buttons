import * as vscode from "vscode";

import Configuration from "../helpers/configuration";
import CommandButton from "../types/command";
import StatusBarButton from "../types/statusBar";
import Button from "./button";

export default class Command {
  static createCommands(context: vscode.ExtensionContext, commands: CommandButton[], commandIds: Set<string>, disposables: vscode.Disposable[]): void {
    if (!commands.length) {
      vscode.window.setStatusBarMessage(
        "Status Bar Buttons: You have no commands or dropdowns.",
        4000
      );

      return;
    }

    commands.forEach(
      (command: CommandButton) => {
        const vsCommand = Configuration.extensionName + "." + command.id.replace(" ", "");

        if (commandIds.has(vsCommand)) {
          vscode.window.showErrorMessage(`The id '${command.id}' is used for multiple commands or dropdowns. Please remove duplicate id's.`);
          return;
        }
        commandIds.add(vsCommand);

        const disposable = vscode.commands.registerCommand(vsCommand, async () => {
          const variables = Configuration.variables(command);

          if (!command) {
            vscode.window.showErrorMessage("No command to execute for this action");
            return;
          }

          if (command.saveAll) {
            vscode.commands.executeCommand("workbench.action.files.saveAll");
          }

          if (command.useVsCodeApi) {
            vscode.commands.executeCommand(command.command, ...(command.args || []));
          } else {
            const terminalName = command.terminal.name || command.label;

            let associatedTerminal = vscode.window.terminals.find(terminal => terminal.name === terminalName);
            if (!associatedTerminal || !command.terminal.singleInstance) {
              associatedTerminal = vscode.window.createTerminal({ name: terminalName, cwd: variables.cwd });
            }

            if (command.terminal.clear) {
              associatedTerminal.sendText("clear");
            }

            associatedTerminal.show(!command.terminal.focus);
            associatedTerminal.sendText(this.interpolateString(command.command, variables));
          }
        });

        context.subscriptions.push(disposable);
        disposables.push(disposable);

        if (command.showButton) {
          const statusBarOptions: StatusBarButton = {
            alignment: command.alignment,
            color: command.color || Configuration.defaultColor(),
            command: vsCommand,
            label: command.label,
            tooltip: command.tooltip || vsCommand,
            priority: command.priority
          };

          Button.createStatusBarButton(statusBarOptions, disposables);
        }
      }
    );
  }

  static interpolateString(command: string, variables: object): string {
    const regex = /\$\{([^\}]+)\}/g; // eslint-disable-line no-useless-escape

    const match = command.match(regex);
    while (match?.length) {
      const placeholder = match.pop();
      const argument = placeholder.replace("${", "").replace("}", "");
      const path = argument;
      const variable = variables[path];
      command = command.replace(placeholder, variable);
    }

    return command;
  }
}

import * as vscode from "vscode";

import Button from "./buttons/button";
import Dropdown from "./buttons/dropdown";
import Configuration from "./helpers/configuration";
import { buildConfigFromPackageJson } from "./packageJson";
import CommandButton from "./types/command";
import StatusBarButton from "./types/statusBar";

const registerCommand = vscode.commands.registerCommand;

const init = async (context: vscode.ExtensionContext, disposables: vscode.Disposable[]): Promise<vscode.Disposable[]> => {
  const commands: CommandButton[] = [];
  const commandIds: Set<string> = new Set();

  if (Configuration.showReloadButton()) {
    const statusBarOptions: StatusBarButton = {
      alignment: vscode.StatusBarAlignment.Left,
      color: Configuration.defaultColor(),
      command: Configuration.extensionName + ".refreshButtons",
      label: Configuration.reloadButton(),
      tooltip: "Refresh the action buttons.",
      priority: 0
    };

    Button.createStatusBarButton(statusBarOptions, disposables);
  }

  if (Configuration.commands() && Configuration.commands().length) {
    commands.push(...Configuration.commands());
  }

  if (Configuration.loadNpmCommands() !== false) {
    commands.push(...(await buildConfigFromPackageJson(Configuration.defaultColor())));
  }

  if (commands.length) {
    const terminals: { [name: string]: vscode.Terminal; } = {};
    commands.forEach(
      (command: CommandButton) => {
        const vsCommand = Configuration.extensionName + "." + command.id.replace(" ", "");

        if (commandIds.has(vsCommand)) {
          vscode.window.showErrorMessage(`The id '${command.id}' is used for multiple commands. Please remove duplicate id's.`);
          return;
        }
        commandIds.add(vsCommand);

        const disposable = registerCommand(vsCommand, async () => {
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
            let associatedTerminal = terminals[vsCommand];
            if (!associatedTerminal) {
              associatedTerminal = vscode.window.createTerminal({ name: command.label, cwd: variables.cwd });
              terminals[vsCommand] = associatedTerminal;
            } else {
              if (command.terminal.singleInstance) {
                delete terminals[vsCommand];
                associatedTerminal.dispose();
                associatedTerminal = vscode.window.createTerminal({ name: command.label, cwd: variables.cwd });
                terminals[vsCommand] = associatedTerminal;
              } else {
                associatedTerminal.sendText("clear");
              }
            }
            associatedTerminal.show(!command.terminal.focus);
            associatedTerminal.sendText(interpolateString(command.command, variables));
          }
        });

        context.subscriptions.push(disposable);
        disposables.push(disposable);

        if (command.createButton) {
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
  } else {
    vscode.window.setStatusBarMessage(
      "VsCode Action Buttons: You have no run commands.",
      4000
    );
  }

  Dropdown.createDropdowns(context, commands, commandIds, disposables);

  return disposables;
};

function interpolateString(command: string, data: object): string {
  let match: RegExpExecArray;
  const regex = /\$\{([^\}]+)\}/g; // eslint-disable-line no-useless-escape
  while (match = regex.exec(command)) { // eslint-disable-line no-cond-assign
    const path = match[1].split(".").reverse();
    let obj = data[path.pop()];
    while (path.length) obj = obj[path.pop()];
    command = command.replace(match[0], obj);
  }
  return command;
}

export default init;

import { buildConfigFromPackageJson } from './packageJson';
import * as vscode from 'vscode';
import * as path from 'path';
import Configuration from "./helpers/configuration";
import Command from "./types/command";
import Dropdown from "./types/dropdown";

const registerCommand = vscode.commands.registerCommand;

const init = async (context: vscode.ExtensionContext, disposables: Array<vscode.Disposable>): Promise<Array<vscode.Disposable>> => {
  const config = vscode.workspace.getConfiguration('actionButtons');
  const dropdowns = config.get<Dropdown[]>('dropdowns');
  const commands: Command[] = [];
  const commandIds: Set<string> = new Set();

  if (Configuration.showReloadButton()) {
    loadButton(
      {
        command: "actionButtons.refreshButtons",
        label: Configuration.reloadButton(),
        tooltip: "Refreshes the action buttons",
        color: Configuration.defaultColor(),
      },
      disposables
    );
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
      (command: Command) => {
        const vsCommand = Configuration.extensionName + '.' + command.id.replace(' ', '');

        if (commandIds.has(vsCommand)) {
          vscode.window.showErrorMessage(`The id '${command.id}' is used for multiple commands. Please remove duplicate id's.`);
          return;
        }
        commandIds.add(vsCommand);

        const disposable = registerCommand(vsCommand, async () => {
          const rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;

          const vars = {
            // - the path of the folder opened in VS Code
            workspaceFolder: rootPath,

            // - the name of the folder opened in VS Code without any slashes (/)
            workspaceFolderBasename: (rootPath) ? path.basename(rootPath) : null,

            // - the current opened file
            file: (vscode.window.activeTextEditor) ? vscode.window.activeTextEditor.document.fileName : null,

            // - the current opened file relative to workspaceFolder
            relativeFile: (vscode.window.activeTextEditor && rootPath) ? path.relative(
              rootPath,
              vscode.window.activeTextEditor.document.fileName
            ) : null,

            // - the current opened file's basename
            fileBasename: (vscode.window.activeTextEditor) ? path.basename(vscode.window.activeTextEditor.document.fileName) : null,

            // - the current opened file's basename with no file extension
            fileBasenameNoExtension: (vscode.window.activeTextEditor) ? path.parse(path.basename(vscode.window.activeTextEditor.document.fileName)).name : null,

            // - the current opened file's dirname
            fileDirname: (vscode.window.activeTextEditor) ? path.dirname(vscode.window.activeTextEditor.document.fileName) : null,

            // - the current opened file's extension
            fileExtname: (vscode.window.activeTextEditor) ? path.parse(path.basename(vscode.window.activeTextEditor.document.fileName)).ext : null,

            // - the task runner's current working directory on startup
            cwd: command.terminal.cwd || rootPath || require('os').homedir(),

            // - the current selected line number in the active file
            lineNumber: (vscode.window.activeTextEditor) ? vscode.window.activeTextEditor.selection.active.line + 1 : null,

            // - the current selected text in the active file
            selectedText: (vscode.window.activeTextEditor) ? vscode.window.activeTextEditor.document.getText(vscode.window.activeTextEditor.selection) : null,

            // - the path to the running VS Code executable
            execPath: process.execPath
          };

          if (!command) {
            vscode.window.showErrorMessage('No command to execute for this action');
            return;
          }

          if (command.saveAll) {
            vscode.commands.executeCommand('workbench.action.files.saveAll');
          }

          if (command.useVsCodeApi) {
            vscode.commands.executeCommand(command.command, ...(command.args || []));
          } else {
            let associatedTerminal = terminals[vsCommand];
            if (!associatedTerminal) {
              associatedTerminal = vscode.window.createTerminal({ name: command.label, cwd: vars.cwd });
              terminals[vsCommand] = associatedTerminal;
            } else {
              if (command.terminal.singleInstance) {
                delete terminals[vsCommand];
                associatedTerminal.dispose();
                associatedTerminal = vscode.window.createTerminal({ name: command.label, cwd: vars.cwd });
                terminals[vsCommand] = associatedTerminal;
              } else {
                associatedTerminal.sendText('clear');
              }
            }
            associatedTerminal.show(!command.terminal.focus);
            associatedTerminal.sendText(interpolateString(command.command, vars));
          }
        });

        context.subscriptions.push(disposable);
        disposables.push(disposable);

        if (command.createButton) {
          loadButton(
            {
              command: vsCommand,
              label: command.label,
              tooltip: command.tooltip || vsCommand,
              color: command.color || Configuration.defaultColor(),
            },
            disposables
          );
        }
      }
    );
  } else {
    vscode.window.setStatusBarMessage(
      'VsCode Action Buttons: You have no run commands.',
      4000
    );
  }

  if (commands.length && dropdowns.length) {
    dropdowns.forEach((dropdown: Dropdown) => {
      const vsCommand = Configuration.extensionName + "." + dropdown.id.replace(" ", "");

      if (commandIds.has(vsCommand)) {
        vscode.window.showErrorMessage(
          `The id '${dropdown.id}' is used for multiple commands or dropdowns. Please remove duplicate id's.`
        );
        return;
      }
      commandIds.add(vsCommand);

      const dropdownCommands = commands.filter(
        (command: Command) =>
          dropdown.commands.includes(command.id) ||
          dropdown.commands.includes(command.label)
      );
      const quickPickItems: vscode.QuickPickItem[] = [];
      dropdownCommands.forEach((command: Command) => {
        const quickPickItem: vscode.QuickPickItem = {
          label: command.label,
          description: Configuration.extensionName + "." + command.id.replace(" ", ""),
        };
        quickPickItems.push(quickPickItem);
      });

      const disposable = registerCommand(vsCommand, async () => {
        const quickPick = vscode.window.createQuickPick();
        quickPick.items = quickPickItems;
        quickPick.ignoreFocusOut = dropdown.ignoreFocusOut || false;
        quickPick.onDidChangeSelection((selection) => {
          if (selection[0]) {
            quickPick.hide();
            const quickPickCommand = selection[0].description;
            vscode.commands.executeCommand(quickPickCommand);
          }
        });
        quickPick.onDidHide(() => quickPick.dispose());
        quickPick.show();
      });

      context.subscriptions.push(disposable);

      disposables.push(disposable);

      loadButton(
        {
          command: vsCommand,
          label: dropdown.label,
          tooltip: dropdown.tooltip || null,
          color: dropdown.color || Configuration.defaultColor(),
        },
        disposables
      );
    });
  }

  return disposables;
};

/**
 * @param ButtonOptions Button Options
 * @param disposables An array of disposables
 */
function loadButton(
  { command, label, tooltip, color }: Command,
  disposables: Array<vscode.Disposable>
) {
  const alignment = vscode.StatusBarAlignment.Left;
  const priority = 0;
  const runButton = vscode.window.createStatusBarItem(alignment, priority);
  runButton.text = label;
  runButton.color = color;
  runButton.tooltip = tooltip;

  runButton.command = command;
  runButton.show();
  disposables.push(runButton);
}

function interpolateString(command: string, data: object): string {
  let match: RegExpExecArray;
  let regex = /\$\{([^\}]+)\}/g;
  while (match = regex.exec(command)) {
    let path = match[1].split('.').reverse();
    let obj = data[path.pop()];
    while (path.length) obj = obj[path.pop()];
    command = command.replace(match[0], obj);
  }
  return command;
}

export default init;

import { homedir } from "os";
import * as path from "path";
import * as vscode from "vscode";

import CommandButton, { BackgroundColor } from "../types/command";
import DropdownButton from "../types/dropdown";
import Variables from "../types/variables";

export default class Configuration {
  static extensionName = "actionButtons";

  /**
   * Initialize the configuration options that require a reload upon change.
   */
  static initialize(context: vscode.ExtensionContext): vscode.Disposable {
    if (this.showReloadButton()) return null;

    const configurationChange = vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("actionButtons")) {
        vscode.commands.executeCommand("actionButtons.refreshButtons");
      }
    });
    context.subscriptions.push(configurationChange);

    return configurationChange;
  }

  /**
   * @returns The color to use for action button text. The default is the theme color.
   */
  static defaultColor(): string {
    return vscode.workspace
      .getConfiguration(this.extensionName)
      .get("defaultColor") || "statusBar.foreground";
  }

  /**
   * @returns Automatically generate buttons from npm commands listed in `package.json`.
   */
  static loadNpmCommands(): boolean {
    return vscode.workspace
      .getConfiguration(this.extensionName)
      .get("loadNpmCommands");
  }

  /**
   * @returns The text for the reload button. The default is to reload on configuration change and not show a reload button.
   */
  static reloadButton(): string | null {
    return vscode.workspace
      .getConfiguration(this.extensionName)
      .get<string | null>("reloadButton");
  }

  /**
   * @returns The text for the reload button. The default is to reload on configuration change and not show a reload button.
   */
  static showReloadButton(): boolean {
    return vscode.workspace
      .getConfiguration(this.extensionName)
      .get<string | null>("reloadButton") !== null;
  }

  /**
   * @returns A list of action buttons for specified commands.
   */
  static commands(): Array<CommandButton> {
    const commands = vscode.workspace
      .getConfiguration(this.extensionName)
      .get<CommandButton[]>("commands");

    commands.forEach((command) => {
      // Set defaults for the undefined properties. ID, label, and command must be defined.
      if (command.alignment === undefined) command.alignment = vscode.StatusBarAlignment.Left;
      if (command.backgroundColor === undefined) command.backgroundColor = BackgroundColor.Default;
      if (command.color === undefined) command.color = Configuration.defaultColor();
      if (command.createButton === undefined) command.createButton = true;
      if (command.priority === undefined) command.priority = 0;
      if (command.saveAll === undefined) command.saveAll = false;
      if (command.terminal.cwd === undefined) command.terminal.cwd === null;
      if (command.terminal.focus === undefined) command.terminal.focus = false;
      if (command.terminal.singleInstance === undefined) command.terminal.singleInstance = true;
      if (command.tooltip === undefined) command.tooltip = null;
      if (command.useVsCodeApi === undefined) command.useVsCodeApi = false;
      if (command.args === undefined) command.args = [];
    });

    return commands;
  }

  /**
   * @returns An action button that opens a quick-select of specified commands.
   */
  static dropdowns(): Array<DropdownButton> {
    // Set defaults for the undefined properties. ID and label.
    const dropdowns = vscode.workspace
      .getConfiguration(this.extensionName)
      .get<DropdownButton[]>("dropdowns");

    dropdowns.forEach((dropdown) => {
      if (dropdown.alignment === undefined) dropdown.alignment = vscode.StatusBarAlignment.Left;
      if (dropdown.color === undefined) dropdown.color = Configuration.defaultColor();
      if (dropdown.priority === undefined) dropdown.priority = 0;
      if (dropdown.tooltip === undefined) dropdown.tooltip = null;
      if (dropdown.options === undefined) dropdown.options = {
        ignoreFocusOut: false,
        placeholder: null,
        prompt: null,
        title: null
      };
      if (dropdown.options?.ignoreFocusOut === undefined) dropdown.options.ignoreFocusOut = false;
      if (dropdown.options?.placeholder === undefined) dropdown.options.placeholder = null;
      if (dropdown.options?.prompt === undefined) dropdown.options.prompt = null;
      if (dropdown.options?.title === undefined) dropdown.options.title = null;
    });

    return dropdowns;
  }

  /**
   * @returns The variables for a terminal
   */
  static variables(command: CommandButton): Variables {
    const rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;

    const vars: Variables = {
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
      cwd: command.terminal.cwd || rootPath || homedir(),

      // - the current selected line number in the active file
      lineNumber: (vscode.window.activeTextEditor) ? vscode.window.activeTextEditor.selection.active.line + 1 : null,

      // - the current selected text in the active file
      selectedText: (vscode.window.activeTextEditor) ? vscode.window.activeTextEditor.document.getText(vscode.window.activeTextEditor.selection) : null,

      // - the path to the running VS Code executable
      execPath: process.execPath
    };

    return vars;
  }
}

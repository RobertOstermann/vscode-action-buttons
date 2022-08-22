# Better Status Bar

Add customizable buttons to the status bar to execute actions or tasks in VS Code.

## Features

- Execute command in terminal
- Execute VS Code command
  - Any command that can be activated via a keyboard shortcut can be activated via a button
- Ability to customize text color for each button
- Add icons to buttons
  - Icons can be added to buttons by using the Markdown icons-in-labels syntax. For example, to add an alert icon you include `$(alert) in the button name. See https://code.visualstudio.com/api/references/icons-in-labels for more info

### Example

![](action.gif)

## Installation and setup

- [x] Install the `Better Status Bar` extension in your VS Code instance.
- [x] After installing, open your VS Code settings.json file.
- [x] Define the status bar buttons you want. Below is a sample configuration for reference.
- [x] Reload the VS Code window to see the new buttons. Alternatively, you can run the `Refresh Action Buttons` command to refresh without reloading the window.

```json
{
  // Better Status Bar
  "betterStatusBar.defaultColor": "statusBar.foreground",
  "betterStatusBar.configurationFile": true,
  "betterStatusBar.loadNpmCommands": false,
  "betterStatusBar.reloadButton": "Refresh Status Bar",
  "betterStatusBar.commands": [
    {
      "id": "3",
      "label": "Git Status",
      "command": "git status",
      "tooltip": "STATUS",
      "color": "blue",
      "terminal": {
        "name": "test",
        "focus": false,
        "singleInstance": true,
        "clear": false
      }
    },
    {
      "id": "4",
      "label": "Git Status 2",
      "command": "git status",
      "alignment": 2,
      "priority": 1000,
      "terminal": {
        "name": "test",
        "focus": false,
        "singleInstance": true,
        "clear": false
      }
    }
  ],
  "betterStatusBar.dropdowns": [
    {
      "id": "5",
      "label": "Dropdown",
      "commands": ["status"],
      "options": {
        "placeholder": "temp",
        "ignoreFocusOut": true,
        "title": "temp"
      }
    }
  ]
}
```

## Configuration File

You can create a `statusBar.json` file to add the settings to a different place than the settings.json file.
The settings in `statusBar.json` overrides the `settings.json` properties.
The commands and dropdowns from `statusBar.json` and `settings.json` are combined.

## Keyboard Shortcuts

Keyboard Shortcuts can be set up for each of the commands/dropdowns that have been created.

- Go to File -> Preferences -> Keyboard Shortcuts to manually set keyboard shortcuts.
- Search for **betterStatusBar**.
  - If the commands are not available/correct, try refreshing action buttons or reloading the window.
- There should now be a list of commands with the specified ids (from settings.json).
- Set the desired keyboard shortcut.

## Config Vars

As seen in the previous example, vars such as `${file}` can be used. Below is a list of each of them and what they do.

- `workspaceFolder` - the path of the folder opened in VS Code
- `workspaceFolderBasename` - the name of the folder opened in VS Code without any slashes (/)
- `file` - the current opened file
- `relativeFile` - the current opened file relative to workspaceFolder
- `fileBasename` - the current opened file's basename
- `fileBasenameNoExtension` - the current opened file's basename with no file extension
- `fileDirname` - the current opened file's dirname
- `fileExtname` - the current opened file's extension
- `cwd` - the task runner's current working directory on startup
- `lineNumber` - the current selected line number in the active file
- `selectedText` - the current selected text in the active file
- `execPath` - the path to the running VS Code executable

## Credits

- [seunlanlege](https://github.com/seunlanlege) for the original extension [vscode-action-buttons](https://github.com/seunlanlege/vscode-action-buttons)
- [VSCode's Extension Samples](https://github.com/microsoft/vscode-extension-samples/tree/master/decorator-sample), which was a huge help to get started
- [All Contributors](../../contributors)

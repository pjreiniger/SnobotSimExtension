// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as path from 'path';
import * as vscode from 'vscode';
import { setupSnobotSimFiles } from './shared/add_config';
import { exists, readFile } from './shared/file_utils';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

    const disposable = vscode.commands.registerCommand('snobotsim.setupProject', async () => {

        // Display a message box to the user
        vscode.window.showInformationMessage('Hello World!');

        await displayWebView(context, vscode.ViewColumn.Active, true, {
            enableScripts: true,
            retainContextWhenHidden: true,
          });
    });
    context.subscriptions.push(disposable);
}

async function displayWebView(context: vscode.ExtensionContext, showOptions: vscode.ViewColumn | { preserveFocus: boolean, viewColumn: vscode.ViewColumn },
                              reveal?: boolean, options?: vscode.WebviewPanelOptions & vscode.WebviewOptions) {

    const webview = vscode.window.createWebviewPanel('View Type', 'Title', showOptions, options);
    webview.webview.html = await getWebviewContent(context);

    webview.webview.onDidReceiveMessage(async (data: any) => {

        if (data.type === 'createproject') {
            const addCustomSimulator = false;
            const useVsCode = data.data.use_vscode;
            const useEclipse = data.data.use_eclipse;
            const useIntellij = data.data.use_intellij;
            const basepath = context.extensionPath;
            const projectFolder = data.data.projectFolder;

            const toFolder = path.join(projectFolder, 'snobotsim');
            if (!await exists(toFolder)) {
                const wpilibJsonPath = path.join(projectFolder, '.wpilib', 'wpilib_preferences.json');
                if (!await exists(wpilibJsonPath)) {
                  vscode.window.showErrorMessage('This isnt a WPILib project');
                  return;
                }

                // Read the wpilib settings to figure out the project type
                const wpilibConfig = JSON.parse(await readFile(wpilibJsonPath));
                await setupSnobotSimFiles(wpilibConfig, addCustomSimulator, useVsCode, useEclipse, useIntellij, basepath, projectFolder, toFolder);
                vscode.window.showInformationMessage('Added SnobotSim configuration!');
            } else {
                vscode.window.showWarningMessage('SnobotSim is already configured, any updates have to be made manually');
            }
        } else {
            vscode.window.showWarningMessage('Unknown option ' + data.type + ' - ' + typeof(data.type));
        }
    });

    if (reveal) {
        webview.reveal();
    }
}

async function getWebviewContent(context: vscode.ExtensionContext) {
    let html = await readFile(path.join(context.extensionPath, 'resources', 'index.html'));

    const scriptOnDisk = vscode.Uri.file(path.join(context.extensionPath, 'resources', 'dist', 'snobotSimUpdaterPage.js'));
    const scriptResourcePath = scriptOnDisk.with({ scheme: 'vscode-resource' });
    html += '\r\n<script src="';
    html += scriptResourcePath.toString();
    html += '">\r\n';
    html += '\r\n</script>\r\n';
    console.log(html);

    return html;
}

// this method is called when your extension is deactivated
// tslint:disable-next-line
export function deactivate() {}

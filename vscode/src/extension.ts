// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as path from 'path';
import * as vscode from 'vscode';
import { readFile } from './shared/file_utils';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

    let disposable = vscode.commands.registerCommand('snobotsim.setupProject', async () => {

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

    let webview = vscode.window.createWebviewPanel("View Type", "Title", showOptions, options);
    webview.webview.html = await getWebviewContent(context);
    
    webview.webview.onDidReceiveMessage(async (data: any) => {
        console.log("Got something ")
        console.log("Got something " + data)
        console.log("Got something " + data.type)

        if(data.type == "createProject") {

        }
    });

    if (reveal) {
        webview.reveal();
    }
}



async function getWebviewContent(context: vscode.ExtensionContext) {
    let html = await readFile(path.join(context.extensionPath, 'resources', 'index.html'));
    
    const scriptOnDisk = vscode.Uri.file(path.join(context.extensionPath, 'resources', 'dist', 'snobotSimUpdaterPage.js'));
    console.log('dfjlskfj ' + context.extensionPath)
    console.log('dfjlskfj ' + path.join(context.extensionPath, 'resources', 'dist', 'snobotSimUpdaterPage.js'))
    console.log('dfjlskfj ' + scriptOnDisk)
    const scriptResourcePath = scriptOnDisk.with({ scheme: 'vscode-resource' });
    html += '\r\n<script src="';
    html += scriptResourcePath.toString();
    html += '">\r\n';
    html += '\r\n</script>\r\n';
    console.log(html)

    return html
}

// this method is called when your extension is deactivated
export function deactivate() {}

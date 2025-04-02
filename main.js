const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
const axios = require('axios'); // Add axios for HTTP requests

let mainWindow;
let serverProcess;

app.whenReady().then(() => {
    // Start the server
    serverProcess = spawn('node', ['server.js'], { cwd: __dirname });

    serverProcess.stdout.on('data', (data) => {
        console.log(`Server: ${data}`);
    });

    serverProcess.stderr.on('data', (data) => {
        console.error(`Server Error: ${data}`);
    });

    serverProcess.on('close', (code) => {
        console.log(`Server process exited with code ${code}`);
    });

    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile('login.html');

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        if (serverProcess) {
            serverProcess.kill();
        }
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        app.whenReady().then(() => {
            mainWindow = new BrowserWindow({
                width: 800,
                height: 600,
                webPreferences: {
                    nodeIntegration: true,
                    contextIsolation: false
                }
            });
            mainWindow.loadFile('login.html');
        });
    }
});

ipcMain.on('login', async (event, { username, password }) => {
    try {
        const response = await axios.post('http://localhost:3000/login', { username, password });
        const { role } = response.data;

        if (role === 'user') {
            mainWindow.loadFile('user.html');
        } else if (role === 'admin') {
            mainWindow.loadFile('admin.html');
        } else {
            mainWindow.webContents.send('login-failed');
        }
    } catch (error) {
        console.error('Login error:', error.message);
        mainWindow.webContents.send('login-failed');
    }
});

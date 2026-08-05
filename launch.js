import { exec } from 'child_process';
import path from 'path';

const exePath = path.resolve('dist/win-unpacked/electron.exe');
console.log('Launching standalone executable:', exePath);

const child = exec(`"${exePath}"`, (err) => {
  if (err) {
    console.error('Execution error:', err);
  }
});
child.unref();

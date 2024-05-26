// Helper function to sign the video with the manifest


function signVideoWithManifest(base64Video, manifestJson) {
    return new Promise((resolve, reject) => {
      // Create a temporary directory
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'c2pa-'));
  
      // Create temporary input and output file paths
      const tempInputPath = path.join(tempDir, 'input.mp4');
      const tempOutputPath = path.join(tempDir, 'signed.mp4');
  
      // Convert the base64 video to a Buffer
      const videoBuffer = Buffer.from(base64Video, 'base64');
  
      // Write the video buffer to the temporary input file
      fs.writeFileSync(tempInputPath, videoBuffer);
  
      // Convert the manifest JSON to a string
      const manifestString = JSON.stringify(manifestJson);
  
      // Spawn the c2patool process
      const c2patool = spawn('c2patool', [
        tempInputPath,
        '-m', '-', // Use - to read the manifest from stdin
        '-o', tempOutputPath, // Output to the temporary file
      ]);
  
      // Write the manifest to the c2patool's stdin
      c2patool.stdin.write(manifestString);
      c2patool.stdin.end();
  
      // Collect the stderr output
      let stderr = '';
      c2patool.stderr.on('data', (data) => {
        stderr += data.toString();
      });
  
      // Wait for the c2patool process to exit
      c2patool.on('close', (code) => {
        if (code === 0) {
          // Read the signed video file as base64
          const signedVideoBase64 = fs.readFileSync(tempOutputPath, 'base64');
  
          // Clean up the temporary directory and files
          fs.rmdirSync(tempDir, { recursive: true });
  
          resolve(signedVideoBase64);
        } else {
          // Clean up the temporary directory and files
          fs.rmdirSync(tempDir, { recursive: true });
          reject(new Error(`c2patool exited with code ${code}. stderr: ${stderr}`));
        }
      });
    });
  }
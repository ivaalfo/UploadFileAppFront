(async () => {
  const replace = require('replace-in-file');

  const options = {
    files: 'dist/fileTransfer/config.js',
    from: ['__AUTH_BASE_URL__', '__AUTH_API_URL__'],
    to: ['http://localhost:3001/fileTransferLOGINwar/', 'http://localhost:3001/fileTransfer/'],
  };

  try {
    const results = await replace(options)
    console.log('Replacement results:', results);
  }
  catch (error) {
    console.error('Error occurred:', error);
    process.exit(1);
  }
})();

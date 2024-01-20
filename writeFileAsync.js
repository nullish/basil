const fs = require('fs');
const { Stream } = require('stream');

/** @function writeFileAsync - Function containing fs.createWriteStream 
 * @param {string} filePath - Destination on local file system
 * @param {Stream} dataStream - stream from HTTP resurce retrieved by HTTPS module
*/
const writeFileAsync = async (filePath, dataStream) => {
  const stream = fs.createWriteStream(filePath);

  // Pipe the data stream to the file stream
  dataStream.pipe(stream);

  // Wait for the stream to finish
  await new Promise((resolve, reject) => {
    dataStream.on('end', resolve);
    dataStream.on('error', reject);
  });
};

module.exports = writeFileAsync;

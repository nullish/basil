/** @file CSV to OneDim Array
 * Reads a local single column CSV file and returns a one dimensional array
 */

const fs = require('fs');

const csvOneDimArray = (inputFile) => {
    /** @function csvOneDimArray
     * @param {string} inputFile - path to a local one column CSV file
     */

    const inCsv = fs.readFileSync(inputFile).toString();
    const arrOut = inCsv.split('\n');
    return arrOut;
};

module.exports = csvOneDimArray;

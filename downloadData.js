const fs = require('fs');
const axios = require('axios');
const https = require('https');

/** @function downloadData - Function to download data from an HTTP resource 
 * @param {string} url - URL to download from
*/
const downloadData = async (url) => {
    const response = await axios({
        method: 'get',
        url,
        responseType: 'stream',
        httpsAgent: new https.Agent({ keepAlive: true }) // If using https
    });

    return response.data;
};

module.exports = downloadData;



var fs = require('fs');
var fs_Extra = require('fs-extra');
var path = require('path');

var source = './deployments/fuji';
var destinationWeb = './../DAPP_WEB/my-app/src/abis';
var destinationMobile = './../DAPP_MOBILE/abis';

var copyRecursiveSync = function() {

    if (!fs.existsSync(destinationWeb)){
        fs.mkdirSync(destinationWeb, { recursive: true });
    }

    fs_Extra.copy(source, destinationWeb, function(error) {
        if (error) {
            throw error;
        } else {
        console.log("Copied ABIs to WEB");
        }
    });

    if (!fs.existsSync(destinationMobile)){
        fs.mkdirSync(destinationMobile, { recursive: true });
    }

    fs_Extra.copy(source, destinationMobile, function(error) {
        if (error) {
            throw error;
        } else {
        console.log("Copied ABIs to MOBILE");
        }
    }); 
}
copyRecursiveSync();
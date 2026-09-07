/* The same tour with prefers-color-scheme forced to light, which is the mode the store
   screenshots use. drive.js only forces dark, so the page is switched here.
   node _shiptools/drive.js http://127.0.0.1:8823/index.html sillage/test/09-light.js --out sillage/test/shots-light */
const tour = require('./08-tour.js');
module.exports = async (kit) => {
  await kit.page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
  await tour(kit);
};

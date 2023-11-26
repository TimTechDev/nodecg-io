let easymidi = require("easymidi");

console.log(easymidi.getInputs().map((device) => [device, { device }]));


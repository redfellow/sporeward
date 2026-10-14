const { withDangerousMod } = require('expo/config-plugins');
const { mkdirSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
// Studio's daemon criteria override JAVA_HOME. Pin the same JDK used by local builds.
module.exports = config => withDangerousMod(config, ['android', async config => {
 const folder=join(config.modRequest.platformProjectRoot,'gradle');
 mkdirSync(folder,{recursive:true});
 writeFileSync(join(folder,'gradle-daemon-jvm.properties'),'# Sporeward Android builds use the installed JDK 17.\ntoolchainVersion=17\n');
 return config;
}]);

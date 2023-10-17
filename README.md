# react-native-get-asset

[![npm version](http://img.shields.io/npm/v/react-native-get-asset.svg?style=flat-square)](https://npmjs.org/package/react-native-get-asset "View this project on npm")
[![npm downloads](http://img.shields.io/npm/dm/react-native-get-asset.svg?style=flat-square)](https://npmjs.org/package/react-native-get-asset "View this project on npm")
[![npm licence](http://img.shields.io/npm/l/react-native-get-asset.svg?style=flat-square)](https://npmjs.org/package/react-native-get-asset "View this project on npm")
[![Platform](https://img.shields.io/badge/platform-ios%20%7C%20android%20%7C%20web-989898.svg?style=flat-square)](https://npmjs.org/package/react-native-get-asset "View this project on npm")

Described how to bundle asset automatically at bundle time, and one function to copy asset to file system or read asset as base64 data url on Android, iOS and Web at debug or release run time.

## Install

    npm install react-native-get-asset

Note: `peerDependencies` are `expo-asset` and `react-native-fs`.

## Bundle asset

Use `environment.dds` as an example, it's very simple to bundle `environment.dds` file into APP as an asset automatically at bundle time:

* add `'dds'` in `metro.config.js` e.g. <https://github.com/flyskywhy/GCanvasRNExamples/blob/master/metro.config.js>
* move file as `APP/public/textures/environment.dds`
* `require('../public/textures/environment.dds')` in `APP/src/SomeComponent.js`

## `src` below support Android, iOS and Web

Cause `appHtml: resolveApp('public/index.html')` in `node_modules/react-scripts/config/paths.js` which works with [react-native-web](https://github.com/necolas/react-native-web) and [react-app-rewired](https://github.com/timarney/react-app-rewired), so it's better to put assets files into `APP/public/` thus Web can use them too, that's why e.g. `src: Platform.OS !== 'web' ? require('../public/textures/environment.dds') : 'textures/environment.dds'` below.

PS: The usage of `react-app-rewired` can ref to [my blog](https://github.com/flyskywhy/g/blob/master/i%E4%B8%BB%E8%A7%82%E7%9A%84%E4%BD%93%E9%AA%8C%E6%96%B9%E5%BC%8F/t%E5%BF%AB%E4%B9%90%E7%9A%84%E4%BD%93%E9%AA%8C/%E7%94%B5%E4%BF%A1/Tool/%E7%BC%96%E7%A8%8B%E8%AF%AD%E8%A8%80/JavaScript/React%E4%BD%BF%E7%94%A8%E8%AF%A6%E8%A7%A3.md#rn--060-%E7%9A%84%E5%AE%89%E8%A3%85-react-native-web).

## `downloadUrlOrRequireId2Storage()` to copy asset to file system

e.g. you can modify
```
const MODEL_URL =
  'https://github.com/facebookresearch/playtorch/releases/download/v0.2.0/yolov5s.ptl';
...
    const filePath = await MobileModel.download(MODEL_URL);

```
into
```
import GetAsset from 'react-native-get-asset';
...
const MODEL_URL =
  Platform.OS !== 'web'
    ? require('../../public/pytorch/yolov5s.ptl')
    : 'pytorch/yolov5s.ptl';
...
      const filePath = await GetAsset.downloadUrlOrRequireId2Storage({
        src: MODEL_URL,
        dst:
          Platform.OS !== 'web' &&
          Platform.select({
            android: `${RNFS.ExternalDirectoryPath}/detectObjects.ptl`,
            ios: `${RNFS.DocumentDirectoryPath}/detectObjects.ptl`,
          }),
        iosReleaseRequireIdAvoidCopy: true, // default is false
      });
```
Unlike asset on Android zipped in release.apk so must unzip copy, asset on iOS release is in bundle folder so that can avoid copy to access it directly, so can `iosReleaseRequireIdAvoidCopy: true` here.

PS: If `react-native-get-asset` does not satisfy your APP situation, you can try [react-native-filereader](https://github.com/flyskywhy/react-native-filereader) or [react-native-blob-util](https://github.com/RonRadtke/react-native-blob-util).

## `downloadUrlOrRequireId2DataURL()` to read asset as base64 data url

e.g. <https://github.com/flyskywhy/GCanvasRNExamples/blob/master/src/nonDeclarative.js>:
```
import GetAsset from 'react-native-get-asset';
...
  const url = await GetAsset.downloadUrlOrRequireId2DataURL({
    // src: 'https://raw.githubusercontent.com/brianzinn/react-babylonjs/v3.1.3/packages/storybook/storyboard-site/assets/textures/environment.dds';
    src: Platform.OS !== 'web' ? require('../public/textures/environment.dds') : 'textures/environment.dds',
    urlAvoidDataURL: true, // default is false
  });
```
If your other code can deal with http url, you can `urlAvoidDataURL: true` here to return url instead of data url.

PS: [data-uri.macro](https://github.com/Andarist/data-uri.macro) can convert files to data-uris at bundle time to avoid these asset matter.

## Donate
To support my work, please consider donate.

- ETH: 0xd02fa2738dcbba988904b5a9ef123f7a957dbb3e

- <img src="https://raw.githubusercontent.com/flyskywhy/flyskywhy/main/assets/alipay_weixin.png" width="500">

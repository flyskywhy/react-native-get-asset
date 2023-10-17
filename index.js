import {Platform} from 'react-native';
import {Asset} from 'expo-asset';
if (Platform.OS !== 'web') {
  var RNFS = require('react-native-fs');
}

async function downloadUrlOrRequireId2Storage({
  src, // can be `src: Platform.OS !== 'web' ? require('../../public/yolov5s/yolov5s.ptl') : 'yolov5s/yolov5s.ptl'` or just an arbitrary http url
  dst = Platform.OS !== 'web' &&
    Platform.select({
      android: `${RNFS.ExternalDirectoryPath}/detectObjects.ptl`,
      ios: `${RNFS.DocumentDirectoryPath}/detectObjects.ptl`,
    }),
  iosReleaseRequireIdAvoidCopy = false, // unlike asset on Android zipped in release.apk so must copy, asset on iOS release can avoid copy to access directly
}) {
  const isRequireId = typeof src === 'number';
  const asset = isRequireId && Asset.fromModule(src);
  let url = '';
  if (asset) {
    url = asset.uri;
  } else if (typeof src === 'string') {
    url = src;
  } else {
    // say if `src: require('JsonIsNotAsset.json')` then src will be a json object, I just return it
    return src;
  }

  if (Platform.OS !== 'web') {
    if (url.match('^http')) {
      // In react-native debug/dev mode the asset will be served over http://localhost:8081
      // console.warn(asset);
      // {
      //   downloaded: false,
      //   downloading: false,
      //   hash: 'e57fc2e467eb5595c3c1a0ebf7b2770b',
      //   height: null,
      //   localUri: null,
      //   name: 'yolov5s',
      //   type: ptl,
      //   uri: 'http://localhost:8081/assets/public/yolov5s/yolov5s.ptl?platform=android&hash=e57fc2e467eb5595c3c1a0ebf7b2770b',
      //   width: null
      // }

      // just remove query string (such as '?platform=android&hash=') if isRequireId === true
      // explained in downloadUrlOrRequireId2DataURL() below
      if (asset) {
        url = url.replace(/\?.*/, '');
      }

      const options = {
        fromUrl: url,
        toFile: dst,
        progressDivider: 1,
        begin: res => {
          // console.warn('begin download', res);
        },
        progress: res => {
          // console.warn('download progress', res);
        },
      };
      const ret = RNFS.downloadFile(options);
      try {
        await ret.promise;
        // console.warn('download complete');
        return dst;
      } catch (error) {
        console.warn(error);
        // console.warn('download error');
      }
    } else {
      // In release mode the asset will be on the file system.

      const dstPath = dst.substring(0, dst.lastIndexOf('/') + 1);
      if (!(await RNFS.exists(dstPath))) {
        await RNFS.mkdir(dstPath);
      }

      if (Platform.OS === 'android') {
        // On android we get a resource id instead of a regular path. We need
        // to load the file from the res/raw folder using this id.
        try {
          await RNFS.copyFileRes(`${asset.uri}.${asset.type}`, dst);
          return dst;
        } catch (err) {
          throw new Error(`Error reading resource ${asset.uri}. Make sure the file
                            exist in the res/raw folder of the APK file`);
        }
      } else {
        // On ios we get a regular path like
        // file:///private/var/containers/Bundle/Application/SOME-HASH/YourAppName.app/assets/public/yolov5s/yolov5s.ptl
        // that match
        // 'file://' + RNFS.MainBundlePath + /assets/public/yolov5s/yolov5s.ptl
        if (iosReleaseRequireIdAvoidCopy) {
          // So we can just use asset.uri with removed 'file://'
          return asset.uri.replace(/^file:\/\//, '');
        } else {
          // Or still copy it to dst
          try {
            await RNFS.copyFile(asset.uri, dst);
            return dst;
          } catch (err) {
            throw new Error(`Error reading resource ${asset.uri}. Make sure the file
                              exist in the assets folder of the bundle folder`);
          }
        }
      }
    }
  } else {
    // In react-native-web debug mode the asset will be served over http://localhost:3000
    // so you can also use `src: require('../../public/yolov5s/yolov5s.ptl')` instead of
    // `src: 'yolov5s/yolov5s.ptl';` above, if you wish
    // {
    //   downloaded: false,
    //   downloading: false,
    //   hash: null,
    //   height: null,
    //   localUri: null,
    //   name: 'yolov5s.6140ab69a9155fbef5c1.ptl',
    //   type: 'ptl',
    //   uri: '/static/media/yolov5s.6140ab69a9155fbef5c1.ptl',
    //   width: null,
    // }

    // Download the file to where then use it in Web APP? levelDB? IPFS?
    // Maybe need downloadUrlOrRequireId2DataURL() below instead.
    return url;
  }
}

async function downloadUrlOrRequireId2DataURL({
  src, // can be `src: Platform.OS !== 'web' ? require('../../public/textures/environment.dds' : 'textures/environment.dds')` or just an arbitrary http url
  urlAvoidDataURL = false, // can just return url instead of data url on Web
}) {
  const isRequireId = typeof src === 'number';
  const asset = isRequireId && Asset.fromModule(src);
  let url = '';
  if (asset) {
    url = asset.uri;
  } else if (typeof src === 'string') {
    url = src;
  } else {
    // say if `src: require('JsonIsNotAsset.json')` then src will be a json object, I just return it
    return src;
  }

  if (Platform.OS !== 'web') {
    if (url.match('^http')) {
      // because ThinEngine.prototype._createTextureBase() in @babylonjs/core/Engines/thinEngine.js
      // will "Remove query string", so we can just use the uri
      // url = asset.uri;
      // but to fix "Cannot load cubemap because files were not defined" of createCubeTextureBase()
      // in @babylonjs/core/Engines/Extensions/engine.cubeTexture.js , still need
      // remove query string (such as '?platform=android&hash=') if isRequireId === true
      if (asset) {
        url = url.replace(/\?.*/, '');
      }

      return urlAvoidDataURL ? url : await fetchUrlToDataURL(url);
    } else {
      let type = require('react-native-mime-types').types[asset.type] || false;
      if (!type) {
        switch (asset.type) {
          case 'dds': {
            type = 'image/vnd.ms-dds';
            break;
          }
          default:
            break;
        }
      }

      // const isText = /text/i.test(type);
      // readAsDataURL text file on Web still return base64, so use `isText = false` below
      const isText = false;

      let string = '';
      if (Platform.OS === 'android') {
        try {
          string = await RNFS.readFileRes(
            `${asset.uri}.${asset.type}`,
            isText ? 'utf8' : 'base64',
          );
        } catch (err) {
          throw new Error(`Error reading resource ${asset.uri}. Make sure the file
                            exist in the res/raw folder of the APK file`);
        }
      } else {
        try {
          string = await RNFS.readFile(asset.uri, isText ? 'utf8' : 'base64');
        } catch (err) {
          throw new Error(`Error reading resource ${asset.uri}. Make sure the file
                            exist in the assets folder of the bundle folder`);
        }
      }

      let dataUrl = 'data:';
      if (type) {
        dataUrl += type + ';';
      }
      dataUrl += isText ? 'charset=utf-8,' : 'base64,';
      dataUrl += string;

      return dataUrl;
    }
  } else {
    // Here `urlAvoidDataURL: true` will just return url so that it can be used by other package e.g.
    // LoadFile() then RequestFile() in node_modules/@babylonjs/core/Misc/fileTools.js
    // and the usage example is CubeTexture.CreateFromPrefilteredData() in
    // https://github.com/flyskywhy/GCanvasRNExamples/blob/master/src/nonDeclarative.js
    return urlAvoidDataURL ? url : await fetchUrlToDataURL(url);
  }
}

export async function fetchUrlToDataURL(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsDataURL(blob);
  });
}

export default {
  downloadUrlOrRequireId2Storage,
  downloadUrlOrRequireId2DataURL,
};

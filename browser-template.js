;(function (global) {

  var PublicSuffixList = require('./index.js');
  var EFFECTIVE_TLD_NAMES = '{{ effective_tld_names.dat }}';

  // Copyright (c) 2013 Pieroxy <pieroxy@pieroxy.net>
  // This work is free. You can redistribute it and/or modify it
  // under the terms of the WTFPL, Version 2
  // For more information see LICENSE.txt or http://www.wtfpl.net/
  //
  // For more information, the home page:
  // http://pieroxy.net/blog/pages/lz-string/testing.html
  //
  // LZ-based compression algorithm, version 1.3.6
  var LZString = {

    // private property
    _keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    _f : String.fromCharCode,

    decompressFromBase64 : function (input) {
      if (input == null) return "";
      var output = "",
          ol = 0,
          output_,
          chr1, chr2, chr3,
          enc1, enc2, enc3, enc4,
          i = 0, f=LZString._f;

      input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

      while (i < input.length) {

        enc1 = LZString._keyStr.indexOf(input.charAt(i++));
        enc2 = LZString._keyStr.indexOf(input.charAt(i++));
        enc3 = LZString._keyStr.indexOf(input.charAt(i++));
        enc4 = LZString._keyStr.indexOf(input.charAt(i++));

        chr1 = (enc1 << 2) | (enc2 >> 4);
        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        chr3 = ((enc3 & 3) << 6) | enc4;

        if (ol%2==0) {
          output_ = chr1 << 8;

          if (enc3 != 64) {
            output += f(output_ | chr2);
          }
          if (enc4 != 64) {
            output_ = chr3 << 8;
          }
        } else {
          output = output + f(output_ | chr1);

          if (enc3 != 64) {
            output_ = chr2 << 8;
          }
          if (enc4 != 64) {
            output += f(output_ | chr3);
          }
        }
        ol+=3;
      }

      return LZString.decompress(output);

    },

    decompress: function (compressed) {
      if (compressed == null) return "";
      if (compressed == "") return null;
      var dictionary = [],
          next,
          enlargeIn = 4,
          dictSize = 4,
          numBits = 3,
          entry = "",
          result = "",
          i,
          w,
          bits, resb, maxpower, power,
          c,
          f = LZString._f,
          data = {string:compressed, val:compressed.charCodeAt(0), position:32768, index:1};

      for (i = 0; i < 3; i += 1) {
        dictionary[i] = i;
      }

      bits = 0;
      maxpower = Math.pow(2,2);
      power=1;
      while (power!=maxpower) {
        resb = data.val & data.position;
        data.position >>= 1;
        if (data.position == 0) {
          data.position = 32768;
          data.val = data.string.charCodeAt(data.index++);
        }
        bits |= (resb>0 ? 1 : 0) * power;
        power <<= 1;
      }

      switch (next = bits) {
        case 0:
            bits = 0;
            maxpower = Math.pow(2,8);
            power=1;
            while (power!=maxpower) {
              resb = data.val & data.position;
              data.position >>= 1;
              if (data.position == 0) {
                data.position = 32768;
                data.val = data.string.charCodeAt(data.index++);
              }
              bits |= (resb>0 ? 1 : 0) * power;
              power <<= 1;
            }
          c = f(bits);
          break;
        case 1:
            bits = 0;
            maxpower = Math.pow(2,16);
            power=1;
            while (power!=maxpower) {
              resb = data.val & data.position;
              data.position >>= 1;
              if (data.position == 0) {
                data.position = 32768;
                data.val = data.string.charCodeAt(data.index++);
              }
              bits |= (resb>0 ? 1 : 0) * power;
              power <<= 1;
            }
          c = f(bits);
          break;
        case 2:
          return "";
      }
      dictionary[3] = c;
      w = result = c;
      while (true) {
        if (data.index > data.string.length) {
          return "";
        }

        bits = 0;
        maxpower = Math.pow(2,numBits);
        power=1;
        while (power!=maxpower) {
          resb = data.val & data.position;
          data.position >>= 1;
          if (data.position == 0) {
            data.position = 32768;
            data.val = data.string.charCodeAt(data.index++);
          }
          bits |= (resb>0 ? 1 : 0) * power;
          power <<= 1;
        }

        switch (c = bits) {
          case 0:
            bits = 0;
            maxpower = Math.pow(2,8);
            power=1;
            while (power!=maxpower) {
              resb = data.val & data.position;
              data.position >>= 1;
              if (data.position == 0) {
                data.position = 32768;
                data.val = data.string.charCodeAt(data.index++);
              }
              bits |= (resb>0 ? 1 : 0) * power;
              power <<= 1;
            }

            dictionary[dictSize++] = f(bits);
            c = dictSize-1;
            enlargeIn--;
            break;
          case 1:
            bits = 0;
            maxpower = Math.pow(2,16);
            power=1;
            while (power!=maxpower) {
              resb = data.val & data.position;
              data.position >>= 1;
              if (data.position == 0) {
                data.position = 32768;
                data.val = data.string.charCodeAt(data.index++);
              }
              bits |= (resb>0 ? 1 : 0) * power;
              power <<= 1;
            }
            dictionary[dictSize++] = f(bits);
            c = dictSize-1;
            enlargeIn--;
            break;
          case 2:
            return result;
        }

        if (enlargeIn == 0) {
          enlargeIn = Math.pow(2, numBits);
          numBits++;
        }

        if (dictionary[c]) {
          entry = dictionary[c];
        } else {
          if (c === dictSize) {
            entry = w + w.charAt(0);
          } else {
            return null;
          }
        }
        result += entry;

        // Add w+entry[0] to the dictionary.
        dictionary[dictSize++] = w + entry.charAt(0);
        enlargeIn--;

        w = entry;

        if (enlargeIn == 0) {
          enlargeIn = Math.pow(2, numBits);
          numBits++;
        }

      }
    }
  };
  global.atob = global.atob || function (input) {
    input = String(input);
    var position = 0,
        output = [],
        buffer = 0, bits = 0, n;

    input = input.replace(/\s/g, '');
    if ((input.length % 4) === 0) { input = input.replace(/=+$/, ''); }
    if ((input.length % 4) === 1) { throw new Error("InvalidCharacterError"); }
    if (/[^+/0-9A-Za-z]/.test(input)) { throw new Error("InvalidCharacterError"); }

    while (position < input.length) {
      n = LZString._keyStr.indexOf(input.charAt(position));
      buffer = (buffer << 6) | n;
      bits += 6;

      if (bits === 24) {
        output.push(String.fromCharCode((buffer >> 16) & 0xFF));
        output.push(String.fromCharCode((buffer >>  8) & 0xFF));
        output.push(String.fromCharCode(buffer & 0xFF));
        bits = 0;
        buffer = 0;
      }
      position += 1;
    }

    if (bits === 12) {
      buffer = buffer >> 4;
      output.push(String.fromCharCode(buffer & 0xFF));
    } else if (bits === 18) {
      buffer = buffer >> 2;
      output.push(String.fromCharCode((buffer >> 8) & 0xFF));
      output.push(String.fromCharCode(buffer & 0xFF));
    }

    return output.join('');
  };


  var lines = atob(LZString.decompressFromBase64(EFFECTIVE_TLD_NAMES)).split(/\n/g);
  var psl = new PublicSuffixList({ lines : lines });
  psl.initializeSync();
  global.psl = psl;
  module.exports = psl;
  return psl;


})(typeof window !== 'undefined' ? window : global);

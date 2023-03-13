class BytesHexStrUtil {
    static bytesToHexString(byteArray, isOrder = true) {
      if (!byteArray || byteArray.length <= 0) return null;
  
      let stringBuilder = '';
      let hexArray = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
  
      if (isOrder) {
        for (let i = 0; i < byteArray.length; i++) {
          let v = byteArray[i] & 0xFF;
          let hv = v.toString(16);
          if (hv.length < 2) stringBuilder += '0';
          stringBuilder += hv + ' ';
        }
      } else {
        for (let i = byteArray.length - 1; i >= 0; i--) {
          let v = byteArray[i] & 0xFF;
          let hv = v.toString(16);
          if (hv.length < 2) stringBuilder += '0';
          stringBuilder += hv + ' ';
        }
      }
  
      return stringBuilder.trim().toUpperCase();
    }
  
    static hexStringToBytes(hexString, isOrder = true) {
      if (!hexString) return null;
      hexString = hexString.replace(/ /g, '').toUpperCase();
  
      let length = hexString.length / 2;
      let hexChars = hexString.split('');
      let byteArray = new Array(length);
  
      if (isOrder) {
        for (let i = 0; i < length; i++) {
          let pos = i * 2;
          byteArray[i] = (this.charToByte(hexChars[pos]) << 4) | this.charToByte(hexChars[pos + 1]);
        }
      } else {
        for (let i = 0; i < length; i++) {
          let pos = (length - 1 - i) * 2;
          byteArray[i] = (this.charToByte(hexChars[pos]) << 4) | this.charToByte(hexChars[pos + 1]);
        }
      }
  
      return byteArray;
    }
  
    static charToByte(c) {
      return '0123456789ABCDEF'.indexOf(c);
    }
    static byteArrayToHexStr(byteArray) {
        if (!byteArray) return null;
        const hexArray = "0123456789ABCDEF".split("");
        let hexStr = "";
        for (let i = 0; i < byteArray.length; i++) {
          let v = byteArray[i] & 0xff;
          hexStr += hexArray[(v >> 4)] + hexArray[v & 0xf];
        }
        return hexStr;
      }
      
      static hexStrToByteArray(hexStr) {
        if (!hexStr) return null;
        hexStr = hexStr.replace(/ /g, "");
        if (!hexStr) return new Uint8Array();
        const byteArray = new Uint8Array(hexStr.length / 2);
        for (let i = 0; i < byteArray.length; i++) {
          let subStr = hexStr.substr(2 * i, 2);
          byteArray[i] = parseInt(subStr, 16);
        }
        return byteArray;
      }
    }
    module.exports={BytesHexStrUtil};
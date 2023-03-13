const {BytesHexStrUtil} = require('../util/BytesHexStrUtil')
const {CMD_DataHead} = require('./CMD_DataHead')
const {CMD_DataBody} = require('./CMD_DataBody')



class CMD_Model {
    //  headData = new CMD_DataHead;
    //   bodyData = new CMD_DataBody;
    constructor(headData, bodyData, originalData) {
      this.headData = headData;
      this.bodyData = bodyData;
      this.objectData = {};
      if (originalData) {
        this.objectData = {
          sequenceId: headData.sequenceId,
          length: headData.length,
          checkCRC: headData.checkCRC,
          version: headData.propertie.version,
          flagACK: headData.propertie.flag_ACK,
          originalData: BytesHexStrUtil.bytesToHexString(originalData)
        };
      }
    }
  
    getHeadData() {
      return this.headData;
    }
  
    setHeadData(headData) {
      this.headData = headData;
    }
  
    getBodyData() {
      return this.bodyData;
    }
  
    setBodyData(bodyData) {
      this.bodyData = bodyData;
    }
  
    getObjectData() {
      return this.objectData;
    }
  }
  module.exports ={CMD_Model};
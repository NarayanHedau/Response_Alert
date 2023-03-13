class CMD_DataHead {
    constructor() {
      this.header = 0;
      this.propertie = new Propertie();
      this.length = 0;
      this.checkCRC = 0;
      this.sequenceId = 0;
    }
  
    getHeader() {
      return this.header;
    }
  
    setHeader(header) {
      this.header = header;
    }
  
    getPropertie() {
      return this.propertie;
    }
  
    setPropertie(propertie) {
      this.propertie = propertie;
    }
  
    getLength() {
      return this.length;
    }
  
    setLength(length) {
      this.length = length;
    }
  
    getCheckCRC() {
      return this.checkCRC;
    }
  
    setCheckCRC(checkCRC) {
      this.checkCRC = checkCRC;
    }
  
    getSequenceId() {
      return this.sequenceId;
    }
  
    setSequenceId(sequenceId) {
      this.sequenceId = sequenceId;
    }
  }
  
  class Propertie {
    constructor() {
      this.version = 0;
      this.flag_ACK = false;
      this.flag_ERR = false;
      this.encryption = 0;
    }
  
    getVersion() {
      return this.version;
    }
  
    setVersion(version) {
      this.version = version;
    }
  
    isFlag_ACK() {
      return this.flag_ACK;
    }
  
    setFlag_ACK(flag_ACK) {
      this.flag_ACK = flag_ACK;
    }
  
    isFlag_ERR() {
      return this.flag_ERR;
    }
  
    setFlag_ERR(flag_ERR) {
      this.flag_ERR = flag_ERR;
    }
  
    getEncryption() {
      return this.encryption;
    }
  
    setEncryption(encryption) {
      this.encryption = encryption;
    }
  }
  module.exports={CMD_DataHead,Propertie};
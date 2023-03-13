class CMD_DataBody {
  cmdData = new CMD;
  constructor() {
    this.cmdType = 0;
    this.cmdData =[ ];
  }

  getCmdType() {
    return this.cmdType;
  }

  setCmdType(cmdType) {
    this.cmdType = cmdType;
  }

  getCmdData=()=> {
    return this.cmdData;
  }

  setCmdData=(cmdData) =>{
    this.cmdData = cmdData;
  }

  addCmdData(cmdLength, cmdKey, cmdValue) {
    this.cmdData.push(new CMD(cmdLength, cmdKey, cmdValue));
  }
}

class CMD {
  constructor(cmdLength, cmdKey, cmdValue) {
    this.cmdLength = cmdLength;
    this.cmdKey = cmdKey;
    this.cmdValue = cmdValue;
  }

  getCmdLength() {
    return this.cmdLength;
  }

  setCmdLength(cmdLength) {
    this.cmdLength = cmdLength;
  }

  getCmdKey() {
    return this.cmdKey;
  }

  setCmdKey(cmdKey) {
    this.cmdKey = cmdKey;
  }

  getCmdValue() {
    return this.cmdValue;
  }

  setCmdValue(cmdValue) {
    this.cmdValue = cmdValue;
  }
}
module.exports={CMD_DataBody,CMD};
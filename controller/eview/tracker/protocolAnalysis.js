const {CMD_DataBody,CMD} =  require('./CMD_DataBody');
const {CMD_DataHead,Propertie}   = require('./CMD_DataHead');
const {CMD_CONST}= require('./CMD_CONST');
const{CheckCRC}= require('../util/CheckCRC');
const {CMD_Model}= require ('./CMD_Model');
const{BytesHexStrUtil}= require('../util/BytesHexStrUtil')

function protocolAnalysis(data) {
    let cmdDataList = [];
    let cmdModelList = analysisCMD_Model(data);///////////// done
    for (let cmdModel of cmdModelList) {
      let cmdDataMap = cmdModel.getObjectData();
      let cmdType = cmdModel.getBodyData().getCmdType();
      if (cmdType === CMD_CONST.CMD_Type_Data) {
        let locationData = analysisLocationData(cmdModel);
        cmdDataMap.cmdType = CMD_CONST.CMD_Type_Data;
        cmdDataMap.cmdData = locationData;
      } else if (cmdType === CMD_CONST.CMD_Type_Config) {
        let configData = analysisConfigData(cmdModel);
        cmdDataMap.cmdType = CMD_CONST.CMD_Type_Config;
        cmdDataMap.cmdData = configData;
      } else if (cmdType === CMD_CONST.CMD_Type_Service) {
        let servicesData = analysisServicesData(cmdModel);
        cmdDataMap.cmdType = CMD_CONST.CMD_Type_Service;
        cmdDataMap.cmdData = servicesData;
      } else if (cmdType === CMD_CONST.CMD_Type_System) {
        cmdDataMap.cmdType = CMD_CONST.CMD_Type_System;
        cmdDataMap.cmdData = null;
      } else if (cmdType === CMD_CONST.CMD_Type_Update) {
        let updateData = analysisUpdateData(cmdModel);
        cmdDataMap.cmdType = CMD_CONST.CMD_Type_Update;
        cmdDataMap.cmdData = updateData;
      } else if (cmdType === CMD_CONST.CMD_Type_Response) {
        let responseData = analysisResponseData(cmdModel);
        cmdDataMap.cmdType = CMD_CONST.CMD_Type_Response;
        cmdDataMap.cmdData = responseData;
      }
      cmdDataList.push(cmdDataMap);
    }
    return cmdDataList;
  }
   


  function analysisCMD_Model(data) {/////////////****done */
    let cmdList = [];
    let read = 0;
    while (read + 8 < data.length) {
      let headData = []
      headData=data.slice(read, read + 8);
      let cmd_headData= new CMD_DataHead
         cmd_headData = analysisHeadData(headData);
      if (cmd_headData.getHeader() === CMD_CONST.CMD_Head) {
        if (data.length >= read + cmd_headData.getLength() + 8) {
          let bodyData = data.slice(read + 8, read + cmd_headData.length + 8);
          let cmd_bodyData = new CMD_DataBody
          cmd_bodyData = analysisBodyData(bodyData);
          let checkCRC = CheckCRC.crc16_bit(bodyData);
          if (cmd_headData.getCheckCRC() === checkCRC) {
            let originalData = [...headData,...bodyData];
            cmdList.push(new CMD_Model(cmd_headData, cmd_bodyData, originalData))

          } else {
            console.debug("Protocol CRC validation failed");
          }
        } else {
          console.debug("Protocol Length validation failed");
        }
      } else {
        console.debug("Protocol Head validation failed");
      }
      read += cmd_headData.getLength() + 8;
    }
    return cmdList;
  }

function analysisHeadData(headData) {/////////////****done */
  let cmd_headData  = new CMD_DataHead;
  let header = headData[0] & 0xFF;
  let properties = headData[1] & 0xFF;
  let version = properties & 0xF;
  let flag_ACK = (properties & 0x10) > 0 ? 1 : 0;
  let flag_ERR = (properties & 0x20) > 0 ? 1 : 0;
  let encryption = (properties >> 6 & 0xc0);
  let length = (headData[2] & 0xFF) | (headData[3] & 0xFF) << 8;
  let checkCRC = (headData[4] & 0xFF) | (headData[5] & 0xFF) << 8;
  let sequenceId = (headData[6] & 0xFF) | (headData[7] & 0xFF) << 8;
  cmd_headData.setHeader(header) ;
  let  propertie = new Propertie ;
  propertie = cmd_headData.getPropertie() 
  propertie.setVersion(version)
  propertie.setFlag_ACK((flag_ACK) == 1 ? true : false);
		propertie.setFlag_ERR((flag_ERR) == 1 ? true : false);
		propertie.setEncryption(encryption);
		cmd_headData.setPropertie(propertie);
		cmd_headData.setLength(length);
		cmd_headData.setCheckCRC(checkCRC);
		cmd_headData.setSequenceId(sequenceId);
    return cmd_headData;
}
   

const analysisBodyData = (bodyData) => {
  const cmd_bodyData = new CMD_DataBody
  let cmdType = bodyData[0] & 0xFF;
  cmd_bodyData.setCmdType(cmdType);
  let readData = 1;
  while (readData + 1 < bodyData.length) {
  let cmdLength = bodyData[readData] & 0xFF;
  let cmdKey = bodyData[readData + 1] & 0xFF;
  let cmdValue = [];
  if (cmdLength === 0) {
  cmdValue = bodyData.slice(readData + 2, bodyData.length);
  cmd_bodyData.addCmdData (cmdLength, cmdKey, cmdValue);
  break;
  }
  if (readData + 2 < bodyData.length) {
  cmdValue = bodyData.slice(readData + 2, readData + 1 + cmdLength);
  }
  readData += cmdLength + 1;
  cmd_bodyData.addCmdData  (cmdLength, cmdKey, cmdValue);
  }
  return cmd_bodyData;
  }


/**
 *  
 * @param {CMD_Model} cmd_Model 
 */ 

  let analysisLocationData = (cmd_Model) => {////////****done */
    let map_ev07b = {};
    let dataList = [];
    map_ev07b["dataList"] = dataList;
    let data;
    // let cmdDataList = new CMD
    let cmdDataList =cmd_Model.getBodyData().getCmdData();
    for (let cmd of cmdDataList) {
    let cmdValue = cmd.getCmdValue();
    if (cmd.getCmdKey() === CMD_CONST.CMD_Data_IMEI) {
    map_ev07b["imei"] = getIMEI(cmdValue);
    } else if (cmd.cmdKey === CMD_CONST.CMD_Data_Status) {
    let ev07b_status = data2Model_Status(cmdValue);
    data = {};
    data["status"] = ev07b_status;
    dataList.push(data);
    } else if (cmd.cmdKey === CMD_CONST.CMD_Data_GPS) {
    let ev07b_gps = data2Model_GPS(cmdValue);
    data = dataList[dataList.length - 1];
    data["gps"] = ev07b_gps;
    } else if (cmd.cmdKey === CMD_CONST.CMD_Data_GSM) {
    let ev07b_gsm = data2Model_GSM(cmdValue);
    data = dataList[dataList.length - 1];
    data["gsm"] = ev07b_gsm;
    } else if (cmd.cmdKey === CMD_CONST.CMD_Data_WIFI) {
    let ev07b_wifi = data2Model_Wifi(cmdValue);
    data = dataList[dataList.length - 1];
    data["wifi"] = ev07b_wifi;
    } else if (cmd.cmdKey === CMD_CONST.CMD_Data_BLE) {
    let ev07b_ble = data2Model_BLE(cmdValue);
    data = dataList[dataList.length - 1];
    data["ble"] = ev07b_ble;
    } else if (cmd.cmdKey === CMD_CONST.CMD_Data_BLE2) {
    let ev07b_ble = data2Model_BLE2(cmdValue);
    data = dataList[dataList.length - 1];
    data["ble"] = ev07b_ble;
    } else if (cmd.cmdKey === CMD_CONST.CMD_Data_Smart) {
    let ev07b_ble = data2Model_Smart(cmdValue);
    data = dataList[dataList.length - 1];
    data["ble"] = ev07b_ble;
    }else  if (cmd.cmdKey === CMD_CONST.CMD_Data_AlarmCode) {
      const mapAlarm = {};
      const alarmFlag = (cmdValue[0] & 0xFF) | (cmdValue[1] & 0xFF) << 8
      | (cmdValue[2] & 0xFF) << 16 | (cmdValue[3] & 0xFF) << 24;
      mapAlarm.alarmFlag = alarmFlag;
      if (cmdValue.length === 8) {
      const dateTime = bytes2DateTime(cmdValue.slice(4, 8));
      mapAlarm.dateTime = dateTime;
      }
      data = dataList[dataList.length - 1];
      data.alarm = mapAlarm;
      } else if (cmd.cmdKey === CMD_CONST.CMD_Data_CallRecords) {
      const ev07bCall = data2Model_Call(cmdValue);
      map_ev07b.call = ev07bCall;
      } else if (cmd.cmdKey === CMD_CONST.CMD_Data_STEP) {
      const ev07bStepList = data2Model_Step(cmdValue);
      map_ev07b.stepList = ev07bStepList;
      } else if (cmd.cmdKey === CMD_CONST.CMD_Data_Active) {
      const ev07bActiveList = data2Model_Active(cmdValue);
      map_ev07b.activeList = ev07bActiveList;
      } else if (cmd.cmdKey === CMD_CONST.CMD_Data_HeartRate) {
      const ev07bHeartList = data2Model_HeartRate(cmdValue);
      map_ev07b.heartList = ev07bHeartList;
      }
   
    }
    return map_ev07b;
  }



  const analysisConfigData = (cmd_Model) => {
    const configData = {};
    const cmdDataList = cmd_Model.bodyData.cmdData;
    for (const cmd of cmdDataList) {
    const cmdLength = cmd.cmdLength;
    const cmdValue = cmd.cmdValue;
    switch (cmd.cmdKey) {
    case "CMD_CONST.CMD_Config_Module":
    let module = cmdValue.toString(16);
    module = module.replace(/ /g, "");
    configData.module = module;
    break;
    case "CMD_CONST.CMD_Config_Version":
    let version = "v" + (cmdValue[3] & 0xff) + "." + (cmdValue[2] & 0xff) + "." + (cmdValue[1] & 0xff) + "." + (cmdValue[0] & 0xff);
    configData.version = version;
    break;
    case "CMD_CONST.CMD_Config_IMEI":
    let IMEI = "";
    for (const val of cmdValue) {
    IMEI += String.fromCharCode(val);
    }
    configData.IMEI = IMEI;
    break;
    case "CMD_CONST.CMD_Config_ICCID":
    let ICCID = "";
    for (const val of cmdValue) {
    ICCID += String.fromCharCode(val);
    }
    configData.ICCID = ICCID;
    break;
    case "CMD_CONST.CMD_Config_MAC":
    let MAC = cmdValue.toString(16);
    MAC = MAC.replace(/ /g, "-");
    configData.MAC = MAC;
    break;
    case "CMD_CONST.CMD_Config_DATATIME":
    let date = new Date((cmdValue[0] & 0xff) | (cmdValue[1] & 0xff) << 8 | (cmdValue[2] & 0xff) << 16 | (cmdValue[3] & 0xff) << 24);
    configData.dateTime = date;
    break;
    case "CMD_CONST.CMD_Config_RUNTIME":
    let runTime = (cmdValue[0] & 0xff) | (cmdValue[1] & 0xff) << 8 | (cmdValue[2] & 0xff) << 16 | (cmdValue[3] & 0x7f) << 31;
    configData.runTime = runTime;
    break;
    case CMD_CONST.CMD_Config_Firmware:
      const firmwareVersion = `v${cmdValue[3] & 0xff}.${cmdValue[2] & 0xff}.${cmdValue[1] & 0xff}.${cmdValue[0] & 0xff}`;
      const firmwareSize = (cmdValue[4] & 0xff) | (cmdValue[5] & 0xff) << 8 | (cmdValue[6] & 0xff) << 16 | (cmdValue[7] & 0x7f) << 24;
      const hardwareVersion = `v${cmdValue[11] & 0xff}.${cmdValue[10] & 0xff}.${cmdValue[9] & 0xff}.${cmdValue[8] & 0xff}`;
      const msdv = (cmdValue[12] & 0xff) | (cmdValue[13] & 0xff) << 8 | (cmdValue[14] & 0xff) << 16 | (cmdValue[15] & 0x7f) << 24;
      const softDeviceVersion = `v${Math.floor(msdv/1000000)}.${Math.floor(msdv%1000000/1000)}.${msdv%1000}`;
      const softDeviceFWID = (cmdValue[16] & 0xff) | (cmdValue[17] & 0xff) << 8 | (cmdValue[18] & 0xff) << 16 | (cmdValue[19] & 0x7f) << 24;
      const complier_dt = cmdValue.slice(20, 40);
      const complierDateTime = String.fromCharCode.apply(null, complier_dt).replace(/\0/g, " ");
      configData.firmware = {
        firmwareVersion,
        firmwareSize,
        hardwareVersion,
        softDeviceVersion,
        softDeviceFWID,
        complierDateTime,
      };
      break;
    case CMD_CONST.CMD_Config_Mileage:
      const mileage = (cmdValue[0] & 0xff) | (cmdValue[1] & 0xff) << 8 | (cmdValue[2] & 0xff) << 16 | (cmdValue[3] & 0xff) << 24;
      configData.mileage = mileage;
      break;
      case CMD_CONST.CMD_Config_WorkMode:
        let time = (cmdValue[0] & 0xFF) | (cmdValue[1] & 0xFF) << 8 | (cmdValue[2] & 0xFF) << 16;
        let mode = (cmdValue[3] & 0xFF);
        let workMode = { time, mode: mode - 1 };
        configData.workMode = workMode;
        break;
      case CMD_CONST.CMD_Config_AlarmClock:
        let index = (cmdValue[0] & 0x7F);
        let status = (cmdValue[0] & 0x80) >> 7;
        let alarmTime = `${String(cmdValue[1] & 0xFF).padStart(2, '0')}:${String(cmdValue[2] & 0xFF).padStart(2, '0')}`;
        let week = (cmdValue[3] & 0xFF);
        let ringTime = (cmdValue[4] & 0xFF);
        let ringType = (cmdValue[5] & 0xFF);
        let week_mon = (week & 0x01);
        let week_tus = (week & 0x02) >> 1;
        let week_wed = (week & 0x04) >> 2;
        let week_thu = (week & 0x08) >> 3;
        let week_fri = (week & 0x10) >> 4;
        let week_sat = (week & 0x20) >> 5;
        let week_sun = (week & 0x40) >> 6;
        let alarmClock = { status, time: alarmTime, ringTime, ringType, mon: week_mon, tus: week_tus, wed: week_wed, thu: week_thu, fri: week_fri, sat: week_sat, sun: week_sun };
        configData[`alarmClock${index}`] = alarmClock;
        break;
        case CMD_CONST.CMD_Config_NoDisturb:
          let noDisturbStatus = (cmdValue[0] & 0x80) >> 7;
          let from = `${("0" + (cmdValue[1] & 0xFF)).slice(-2)}:${("0" + (cmdValue[2] & 0xFF)).slice(-2)}`;
          let to = `${("0" + (cmdValue[3] & 0xFF)).slice(-2)}:${("0" + (cmdValue[4] & 0xFF)).slice(-2)}`;
          let noDisturb = {};
          noDisturb.status = noDisturbStatus;
          noDisturb.from = from;
          noDisturb.to = to;
          configData.noDisturb = noDisturb;
          break;
        case CMD_CONST.CMD_Config_Password:
          let password = (cmdValue[0] & 0xFF) | (cmdValue[1] & 0xFF) << 8 | (cmdValue[2] & 0xFF) << 16 | ((cmdValue[3] & 0x7F) << 23);
          let passwordStatus = (cmdValue[3] & 0x80) >> 7;
          let sim_password = {};
          sim_password.password = password;
          sim_password.status = passwordStatus;
          configData.password = sim_password;
          break;
          case CMD_CONST.CMD_Config_TimeZone:
    let timeZone = (cmdValue[0] & 0xff) * 15 / 60;
    configData.set("timeZone", timeZone);
    break;
  case CMD_CONST.CMD_Config_EnableControl:
    let LED = cmdValue[0] & 0x01;
    let beep = (cmdValue[0] & 0x02) >> 1;
    let motor = (cmdValue[0] & 0x04) >> 2;
    let gsmLoc = (cmdValue[0] & 0x08) >> 3;
    let wifiLoc = (cmdValue[0] & 0x10) >> 4;
    let SosSpeaker = (cmdValue[0] & 0x20) >> 5;
    let XSpeaker = (cmdValue[0] & 0x40) >> 6;
    let bleConnection = (cmdValue[0] & 0x80) >> 7;
    let bleLoc = cmdValue[1] & 0x01;
    let sosCallNumberVoice = (cmdValue[1] & 0x02) >> 1;
    let autoUpdate = (cmdValue[3] & 0x40) >> 6;
    let AGPS = (cmdValue[3] & 0x80) >> 7;
    let enableControl = new Map();
    enableControl.set("led", LED);
    enableControl.set("beep", beep);
    enableControl.set("motor", motor);
    enableControl.set("gsmLoc", gsmLoc);
    enableControl.set("wifiLoc", wifiLoc);
    enableControl.set("sosSpeaker", SosSpeaker);
    enableControl.set("xSpeaker", XSpeaker);
    enableControl.set("bleLongConnect", bleConnection);
    enableControl.set("bleLoc", bleLoc);
    enableControl.set("sosCallNumberVoice", sosCallNumberVoice);
    enableControl.set("autoUpdate", autoUpdate);
    enableControl.set("agps", AGPS);
    configData.set("enableControl", enableControl);
    break;
    case CMD_CONST.CMD_Config_RingtoneVolume:
      let ringToneVolume = cmdValue[0] & 0xff;
      configData.set("ringToneVolume", ringToneVolume);
      break;
    case CMD_CONST.CMD_Config_MicVolume:
      let micVolume = cmdValue[0] & 0xff;
      configData.set("micVolume", micVolume);
      break;
    case CMD_CONST.CMD_Config_SpeakerVolume:
      let speakerVolume = cmdValue[0] & 0xff;
      configData.set("speakerVolume", speakerVolume);
      break;
    case CMD_CONST.CMD_Config_DeviceName:
      let deviceName = bytes2StringByASCII(cmdValue);
      configData.set("deviceName", deviceName);
      break;
    case CMD_CONST.CMD_Config_Battery:
      let battery = cmdValue[0] & 0xff;
      let voltage = (cmdValue[1] & 0xff) | (cmdValue[2] & 0xff) << 8;
      let batteryMap = new Map();
      batteryMap.set("battery", battery);
      batteryMap.set("voltage", voltage);
      configData.set("battery", batteryMap);
      break;
      case CMD_CONST.CMD_Config_BleLoc:
    let ble_lat = (cmdValue[0] & 0xff) | (cmdValue[1] & 0xff) << 8 | (cmdValue[2] & 0xff) << 16 | (cmdValue[3] & 0xff) << 24;
    let ble_lng = (cmdValue[4] & 0xff) | (cmdValue[5] & 0xff) << 8 | (cmdValue[6] & 0xff) << 16 | (cmdValue[7] & 0xff) << 24;
    cmdValue = cmdValue.slice(8, cmdValue.length);
    let describe = bytes2StringByASCII(cmdValue);
    let bleLocMap = {
      lat: (ble_lat / 10000000),
      lng: (ble_lng / 10000000),
      describe: describe
    };
    configData["bleLoc"] = bleLocMap;
    break;
  case CMD_CONST.CMD_Config_BleWhiteList:
    let bwl_flag = (cmdValue[0] & 0xff);
    let bwl_enable = (bwl_flag & 0x80) >> 7;
    let bwl_index = (bwl_flag & 0x7f);
    cmdValue = cmdValue.slice(1, cmdValue.length);
    let bwl_mac = BytesHexStrUtil.bytesToHexString(cmdValue, false).replace(" ", ":");
    let bleWhiteList = {
      enable: bwl_enable,
      mac: bwl_mac
    };
    configData[`bleWhiteList${bwl_index}`] = bleWhiteList;
    break;
    case CMD_CONST.CMD_Config_Music:
  const music_flag = cmdValue[0] + (cmdValue[1] << 8) + (cmdValue[2] << 16) + (cmdValue[3] << 24);
  const mu_beep = music_flag & 0x01;
  const mu_alertTiltCannel = (music_flag & 0x02) >> 1;
  const mu_alertCharging = (music_flag & 0x04) >> 2;
  const mu_alertBatteryLow = (music_flag & 0x08) >> 3;
  const mu_callingcontact1 = (music_flag & 0x10) >> 4;
  const mu_callingcontact2 = (music_flag & 0x20) >> 5;
  const mu_callingcontact3 = (music_flag & 0x40) >> 6;
  const mu_callingcontact4 = (music_flag & 0x80) >> 7;
  const mu_callingcontact5 = (music_flag & 0x100) >> 8;
  const mu_callingcontact6 = (music_flag & 0x20000) >> 17;
  const mu_alertFallDowncannel = (music_flag & 0x200) >> 9;
  const mu_alertSOS = (music_flag & 0x400) >> 10;
  const mu_stopSOS = (music_flag & 0x800) >> 11;
  const mu_alertStatic = (music_flag & 0x1000) >> 12;
  const mu_alertMotion = (music_flag & 0x2000) >> 13;
  const mu_alertTilt = (music_flag & 0x4000) >> 14;
  const mu_reminder = (music_flag & 0x8000) >> 15;
  const mu_findme = (music_flag & 0x10000) >> 16;
  const musicFlag = {
    beep: mu_beep,
    alertTiltCannel: mu_alertTiltCannel,
    alertCharging: mu_alertCharging,
    alertBatteryLow: mu_alertBatteryLow,
    callingcontact1: mu_callingcontact1,
    callingcontact2: mu_callingcontact2,
    callingcontact3: mu_callingcontact3,
    callingcontact4: mu_callingcontact4,
    callingcontact5: mu_callingcontact5,
    callingcontact6: mu_callingcontact6,
    alertFallDowncannel: mu_alertFallDowncannel,
    alertSOS: mu_alertSOS,
    stopSOS: mu_stopSOS,
    alertStatic: mu_alertStatic,
    alertMotion: mu_alertMotion,
    alertTilt: mu_alertTilt,
    reminder: mu_reminder,
    findme: mu_findme,
  };
  configData.music = musicFlag;
  break;
  case CMD_CONST.CMD_Config_Call1Button:
    const call1ButtonData = (cmdValue[0] & 0xff) | (cmdValue[1] & 0xff) << 8;
    const call1ButtonFeedBack = cmdValue[0] & 0x03;
    const call1ButtonTime = (call1ButtonData & 0x1fc) >> 2;
    const call1ButtonTask = (cmdValue[1] & 0x1e) >> 1;
    const call1ButtonMode = (cmdValue[1] & 0x20) >> 5;
    const call1ButtonStatus = (cmdValue[1] & 0x80) >> 7;
    const call1Button = {};
    call1Button["status"] = call1ButtonStatus;
    call1Button["mode"] = call1ButtonMode;
    call1Button["task"] = call1ButtonTask;
    call1Button["time"] = call1ButtonTime;
    call1Button["feedBack"] = call1ButtonFeedBack;
    configData["call1Button"] = call1Button;
    break;
  case CMD_CONST.CMD_Config_Call2Button:
    const call2ButtonData = (cmdValue[0] & 0xff) | (cmdValue[1] & 0xff) << 8;
    const call2ButtonFeedBack = cmdValue[0] & 0x03;
    const call2ButtonTime = (call2ButtonData & 0x1fc) >> 2;
    const call2ButtonTask = (cmdValue[1] & 0x1e) >> 1;
    const call2ButtonMode = (cmdValue[1] & 0x20) >> 5;
    const call2ButtonStatus = (cmdValue[1] & 0x80) >> 7;
    const call2Button = {};
    call2Button["status"] = call2ButtonStatus;
    call2Button["mode"] = call2ButtonMode;
    call2Button["task"] = call2ButtonTask;
    call2Button["time"] = call2ButtonTime;
    call2Button["feedBack"] = call2ButtonFeedBack;
    configData["call2Button"] = call2Button;
    break;
  case CMD_CONST.CMD_Config_Number:
    const nFlag = cmdValue[0] & 0xff;
    const numberEnable = (nFlag & 0x80) >> 7;
    const numberSms = (nFlag & 0x40) >> 6;
    const numberCall = (nFlag & 0x20) >> 5;
    const numberNoCard = (nFlag & 0x10) >> 4;
    const numberIndex = nFlag & 0x0f;
    const numberBytes = cmdValue.slice(1, cmdValue.length);
    const number = String.fromCharCode.apply(null, numberBytes);
    const numberData = {};
    numberData["enable"] = numberEnable;
    numberData["sms"] = numberSms;
    numberData["call"] = numberCall;
    numberData["noCard"] = numberNoCard;
    numberData["number"] = number;
    configData["number"+number_index]= number_data;
    break;
    case CMD_CONST.CMD_Config_SMSOption:
    const SMSPrefixStatus = (cmdValue[0] & 0x80) >> 7;
    cmdValue = cmdValue.slice(1);
    const SMSPrefixText = bytes2StringByASCII(cmdValue);
    const smsOption = {
      status: SMSPrefixStatus,
      prefix: SMSPrefixText,
    };
    configData.smsOption = smsOption;
    break;
  case CMD_CONST.CMD_Config_SOSOption:
    const holdTime = (cmdValue[0] & 0xFF) | (cmdValue[1] & 0xFF) << 8;
    const ringsTime = cmdValue[2] & 0xFF;
    const loops = cmdValue[3] & 0xFF;
    const sosOption = {
      holdTime,
      ringsTime,
      loops,
    };
    configData.sosOption = sosOption;
    break;
  case CMD_CONST.CMD_Config_PhoneOption:
    const ringsText = cmdValue[0] & 0x7F;
    const phone1 = (cmdValue[0] & 0x80) >> 7;
    const phone2 = cmdValue[1] & 0x1;
    const phone3 = (cmdValue[1] & 0x2) >> 1;
    const phone4 = (cmdValue[1] & 0x4) >> 2;
    const phone5 = (cmdValue[1] & 0x8) >> 3;
    const phoneOption = {
      rings: ringsText,
      s1: phone1,
      s2: phone2,
      s3: phone3,
      s4: phone4,
      s5: phone5,
    };
    configData.phoneOption = phoneOption;
    break;
    case CMD_CONST.CMD_Config_APN:
      let apn = bytes2StringByASCII(cmdValue);
      configData.set("apn", apn);
      break;
    case CMD_CONST.CMD_Config_ApnUserName:
      let apnUserName = bytes2StringByASCII(cmdValue);
      configData.set("apnUserName", apnUserName);
      break;
    case CMD_CONST.CMD_Config_ApnPassword:
      let apnPassword = bytes2StringByASCII(cmdValue);
      configData.set("apnPassword", apnPassword);
      break;
    case CMD_CONST.CMD_Config_SeverIPPort:
      let severStatus = (cmdValue[0] & 0xFF) >> 7;
      let severType = (cmdValue[0] & 0x01);
      let severPort = (cmdValue[1] & 0xFF) | (cmdValue[2] & 0xFF) << 8;
      let ipBytes = cmdValue.slice(3, cmdValue.length);
      let severIP = bytes2StringByASCII(ipBytes);
      let sever = new Map();
      sever.set("status", severStatus);
      sever.set("type", severType);
      sever.set("port", severPort);
      sever.set("ip", severIP);
      configData.set("sever", sever);
      break;
    case CMD_CONST.CMD_Config_TimeInterval:
      let heartbeatStatus = (cmdValue[3] & 0x80) >> 7;
      let heartbeat = (cmdValue[0] & 0xFF) | (cmdValue[1] & 0xFF) << 8 | (cmdValue[2] & 0xFF) << 16 | (cmdValue[3] & 0x7F) << 23;
      let upload = (cmdValue[4] & 0xFF) | (cmdValue[5] & 0xFF) << 8 | (cmdValue[6] & 0xFF) << 16 | (cmdValue[7] & 0xFF) << 24;
      let uploadLazy = (cmdValue[8] & 0xFF) | (cmdValue[9] & 0xFF) << 8 | (cmdValue[10] & 0xFF) << 16 | (cmdValue[11] & 0xFF) << 24;
      let timeInterval = new Map();
      timeInterval.set("heartBeatStatus", heartbeatStatus);
      timeInterval.set("heartBeat", heartbeat);
      timeInterval.set("upload", upload);
      timeInterval.set("uploadLazy", uploadLazy);
      configData.set("timeInterval", timeInterval);
      break;
      case CMD_CONST.CMD_Config_ContinueLocate:
    const locateInterval = (cmdValue[0] & 0xff) | ((cmdValue[1] & 0xff) << 8);
    const locateTime = (cmdValue[2] & 0xff) | ((cmdValue[3] & 0xff) << 8);
    const continueLocate = {
      interval: locateInterval,
      time: locateTime,
    };
    configData.continueLocate = continueLocate;
    break;

  case CMD_CONST.CMD_Config_AlertPowerLow:
    const powerOff = (cmdValue[3] & 0x80) >> 7;
    const powerOn = (cmdValue[3] & 0x40) >> 6;
    const powerLowStatus = (cmdValue[3] & 0x20) >> 5;
    const powerLow = cmdValue[0] & 0xff;
    const powerLowAlert = {
      powerOn,
      powerOff,
      status: powerLowStatus,
      power: powerLow,
    };
    configData.powerLowAlert = powerLowAlert;
    break;
    case CMD_CONST.CMD_Config_AlertGEO:
const geoFlag = (cmdValue[0] & 0xFF) | (cmdValue[1] & 0xFF) << 8 | (cmdValue[2] & 0xFF) << 16 | (cmdValue[3] & 0xFF) << 24;
const geoIndex = geoFlag & 0x0F;
const geoPoints = (geoFlag & 0xF0) >> 4;
const geoStatus = (geoFlag & 0x100) === 0x100 ? 1 : 0;
const geoDirection = (geoFlag & 0x200) === 0x200 ? 1 : 0;
const geoType = (geoFlag & 0x400) === 0x400 ? 1 : 0;
const geoRadius = (geoFlag >> 16) & 0xFFFF;
let readData = 4;
let geoLatLng = "";
while (readData + 8 < cmdLength) {
const geoLat = (cmdValue[readData] & 0xFF) | (cmdValue[readData + 1] & 0xFF) << 8 | (cmdValue[readData + 2] & 0xFF) << 16 | (cmdValue[readData + 3] & 0xFF) << 24;
const geoLng = (cmdValue[readData + 4] & 0xFF) | (cmdValue[readData + 5] & 0xFF) << 8 | (cmdValue[readData + 6] & 0xFF) << 16 | (cmdValue[readData + 7] & 0xFF) << 24;
geoLatLng += geoLatLng.length > 0 ? ";" : "";
geoLatLng += (geoLat / 10000000) + "," + (geoLng / 10000000);
readData += 8;
}
const geoAlert = {};
geoAlert.points = geoPoints;
geoAlert.status = geoStatus;
geoAlert.direction = geoDirection;
geoAlert.type = geoType;
geoAlert.radius = geoRadius;
geoAlert.latLng = geoLatLng;
configData[`geo${geoIndex}Alert`] = geoAlert;
break;
case CMD_CONST.CMD_Config_AlertMotion:
    let staticTime = (cmdValue[0] & 0xff) | ((cmdValue[1] & 0xff) << 8);
    let moveTime = (cmdValue[2] & 0xff) | ((cmdValue[3] & 0x3f) << 8);
    let motionStatus = (cmdValue[3] & 0x80) >> 7;
    let motionDial = (cmdValue[3] & 0x40) >> 6;
    let motionAlert = {
      staticTime,
      moveTime,
      status: motionStatus,
      dial: motionDial,
    };
    configData.motionAlert = motionAlert;
    break;
  case CMD_CONST.CMD_Config_AlertNoMotion:
    let noMotionValue = (cmdValue[0] & 0xff) | ((cmdValue[1] & 0xff) << 8) | ((cmdValue[2] & 0xff) << 16) | ((cmdValue[3] & 0x3f) << 24);
    let noMotionStatus = (cmdValue[3] & 0x80) >> 7;
    let noMotionDial = (cmdValue[3] & 0x40) >> 6;
    let noMotionAlert = {
      time: noMotionValue,
      status: noMotionStatus,
      dial: noMotionDial,
    };
    configData.noMotionAlert = noMotionAlert;
    break;
    case CMD_CONST.CMD_Config_AlertOverSpeed:
    let overSpeedValue = (cmdValue[0] & 0xff) | (cmdValue[1] & 0x7f) << 8;
    let overSpeedStatus = (cmdValue[1] & 0x80) >> 7;
    let overSpeedAlert = {};
    overSpeedAlert.speed = overSpeedValue;
    overSpeedAlert.status = overSpeedStatus;
    configData.overSpeedAlert = overSpeedAlert;
    break;
  case CMD_CONST.CMD_Config_AlertTilt:
    let tiltTime = (cmdValue[0] & 0xff) | (cmdValue[1] & 0xff) << 8;
    let tiltAngle = cmdValue[2] & 0xff;
    let tiltStatus = (cmdValue[3] & 0x80) >> 7;
    let tiltDial = (cmdValue[3] & 0x40) >> 6;
    let tiltAlert = {};
    tiltAlert.time = tiltTime;
    tiltAlert.angle = tiltAngle;
    tiltAlert.status = tiltStatus;
    tiltAlert.dial = tiltDial;
    configData.tiltAlert = tiltAlert;
    break;
    case CMD_CONST.CMD_Config_AlertFallDown:
    const fallDownLevel = cmdValue[0] & 0x0F;
    const fallDownDial = (cmdValue[0] & 0x40) >> 6;
    const fallDownStatus = (cmdValue[0] & 0x80) >> 7;
    const fallDownAlert = {};
    fallDownAlert.level = fallDownLevel;
    fallDownAlert.dial = fallDownDial;
    fallDownAlert.status = fallDownStatus;
    configData.fallDownAlert = fallDownAlert;
    break;
  default:
    console.debug(`key: ${cmd.getCmdKey()} Protocol resolution is not supported...`);
    // configData.key = "协议不支持";
    break;
  }
}
return configData;
 }

 function analysisServicesData(cmd_Model) {
  let servicesData = {};
  let cmdDataList = cmd_Model.bodyData.cmdData;
  for (let cmd of cmdDataList) {
    servicesData.cmdKey = cmd.cmdKey;
    let cmdValue = cmd.cmdValue;
    if (cmd.cmdKey === CMD_CONST.CMD_Services_IMEI) {
      let imei = getIMEI(cmdValue);
      servicesData.imei = imei;
    } else if (cmd.cmdKey === CMD_CONST.CMD_Services_HeartBeat) {
      // HeartBeat package does not need to be processed
    } else if (cmd.cmdKey === CMD_CONST.CMD_Services_getAddresses) {
      let lat = (cmdValue[0] & 0xFF) | (cmdValue[1] & 0xFF) << 8 | (cmdValue[2] & 0xFF) << 16 | (cmdValue[3] & 0xFF) << 24;
      let lng = (cmdValue[4] & 0xFF) | (cmdValue[5] & 0xFF) << 8 | (cmdValue[6] & 0xFF) << 16 | (cmdValue[7] & 0xFF) << 24;
      let ev07b_addresses = {};
      ev07b_addresses.lat = lat / 10000000;
      ev07b_addresses.lng = lng / 10000000;
      servicesData.addresses = ev07b_addresses;
    } else if (cmd.cmdKey === CMD_CONST.CMD_Services_getTimestamp) {
      // return system time
    } else if (cmd.cmdKey === CMD_CONST.CMD_Services_getLocationGSM) {
      let ev07b_gsm = data2Model_GSM(cmdValue);
      servicesData.location_gsm = ev07b_gsm;
    } else if (cmd.cmdKey === CMD_CONST.CMD_Services_getLocationWIFI) {
      let ev07b_wifi = data2Model_Wifi(cmdValue);
      servicesData.location_wifi = ev07b_wifi;
    }
  }
  return servicesData;
}

function analysisUpdateData(cmd_Model) {
  let updateData = {};
  let cmdDataList = cmd_Model.bodyData.cmdData;
  let cmdKey = cmdDataList[0].cmdKey;
  let cmdValue = cmdDataList[0].cmdValue;
  if (cmdKey === CMD_CONST.CMD_Update_InitialData) {
      // 7f
  } else if (cmdKey === CMD_CONST.CMD_Update_FirmwareData) {
      updateData.returnStatus = "ok";
      let address = cmdValue[0] + (cmdValue[1] << 8) + (cmdValue[2] << 16) + (cmdValue[3] << 24);
      updateData.updateAddress = address;
  } else if (cmdKey === CMD_CONST.CMD_Update_Validate) {
      // 7f
  } else if (cmdKey === CMD_CONST.CMD_Update_State) {
      updateData.updateStateKey = cmdValue[0];
      if (cmdValue[0] === 0x11) {
          let address = cmdValue[1] + (cmdValue[2] << 8) + (cmdValue[3] << 16) + (cmdValue[4] << 24);
          updateData.updateAddress = address;
      }
  } else if (cmdKey === CMD_CONST.CMD_Update_PackSize) {
      let packSize = cmdValue[0] + (cmdValue[1] << 8);
      updateData.updatePackSize = packSize;
  }
  return updateData;
}


const analysisResponseData = (cmd_Model) => {
  let responseData = {};
  let cmdDataList = cmd_Model.getBodyData().getCmdData();
  let cmdKey = cmdDataList[0].getCmdKey();

  if (cmdKey === CMD_CONST.CMD_Response_Success) {
    responseData.returnStatus = 'ok';
  } else {
    responseData.returnStatus = 'error';
    if (cmdKey === CMD_CONST.CMD_Response_VersionError) {
      responseData.msg = 'Version Invalid';
    } else if (cmdKey === CMD_CONST.CMD_Response_EncryptError) {
      responseData.msg = 'Encryption Invalid';
    } else if (cmdKey === CMD_CONST.CMD_Response_LengthError) {
      responseData.msg = 'Length error';
    } else if (cmdKey === CMD_CONST.CMD_Response_CRCError) {
      responseData.msg = 'Check CRC error';
    } else if (cmdKey === CMD_CONST.CMD_Response_CommandError) {
      responseData.msg = 'Command Invalid';
    } else if (cmdKey === CMD_CONST.CMD_Response_KeyError) {
      responseData.msg = 'Key Invalid';
    } else if (cmdKey === CMD_CONST.CMD_Response_KeyLengthError) {
      responseData.msg = 'Key length error';
    } else if (cmdKey === CMD_CONST.CMD_Response_DataFormatError) {
      responseData.msg = 'Data Format Invalid';
    } else if (cmdKey === CMD_CONST.CMD_Response_DataSizeError) {
      responseData.msg = 'Data Size Error';
    } else if (cmdKey === CMD_CONST.CMD_Response_StateError) {
      responseData.msg = 'Invalid State';
    } else if (cmdKey === CMD_CONST.CMD_Response_ParameterError) {
      responseData.msg = 'Invalid Parameter';
    } else if (cmdKey === CMD_CONST.CMD_Response_NoMemoryError) {
      responseData.msg = 'No Memory';
    } else if (cmdKey === CMD_CONST.CMD_Response_funNoSuported) {
      responseData.msg = 'function not supported';
    } else if (cmdKey === CMD_CONST.CMD_Response_GPSNoLocation) {
      responseData.msg = 'GPS not Location';
    } else if (cmdKey === CMD_CONST.CMD_Response_AddressError) {
      responseData.msg = 'Address resolution Error';
    } else if (cmdKey === CMD_CONST.CMD_Response_LowBattery) {
      responseData.msg = 'Battery Power Low';
    }
  }

  return responseData;
};

function getIMEI(data) {
  return bytes2StringByASCII(data);
}

function bytes2DateTime(data) {
  let dateTime = (data[0] & 0xFF) | (data[1] & 0xFF) << 8 | (data[2] & 0xFF) << 16 | (data[3] & 0xFF) << 24;
  return new Date(dateTime * 1000);
}

function bytes2StringByASCII(data) {
  let sbu = '';
  for (let i = 0; i < data.length; i++) {
      sbu += String.fromCharCode(data[i] & 0xFF);
  }
  return sbu;
}

function string2BytesByASCII(data) {
  try {
      return Buffer.from(data, 'ascii');
  } catch (error) {
      console.error(error);
  }
  return null;
}

function data2Model_Status(data) {
  let dateTime = bytes2DateTime(data.slice(0, 4));
  let status = data.slice(4, 8);
  let deviceStatus = BytesHexStrUtil.bytesToHexString(status);
  let map_status = {};
  map_status.dateTime = new Date(dateTime.getTime());
  map_status.status = deviceStatus;
  map_status.statusCode = getDeviceStatus(status);
  map_status.createTime = new Date(Date.now());
  return map_status;
}

function getDeviceStatus(status) {
  const flag = status[0] & 0xFF;
  const isGPS = (flag & 0x1) > 0;
  const isWIFI = (flag & 0x2) > 0;
  const isGMS = (flag & 0x4) > 0;
  const isBLE = (flag & 0x8) > 0;
  const isCharging = (flag & 0x10) > 0;
  const isChargingComplete = (flag & 0x20) > 0;
  const isReboot = (flag & 0x40) > 0;
  const isHistoricalData = (flag & 0x80) > 0;
  const flag_1 = status[1] & 0xFF;
  const isAGPS = (flag_1 & 0x1) > 0;
  const isMotion = (flag_1 & 0x2) > 0;
  const isSmart = (flag_1 & 0x4) > 0;
  const workMode = status[2] & 0x7;
  const signalSize = (status[2] & 0xF8) >> 3;
  const battery = status[3] & 0xFF;

  const deviceStatus = {};
  if (isGPS) {
    deviceStatus.dataType = "GPS";
  } else if (isWIFI) {
    deviceStatus.dataType = "WIFI";
  } else if (isGMS) {
    deviceStatus.dataType = "GSM";
  } else if (isBLE) {
    deviceStatus.dataType = "BLE";
  } else if (isSmart) {
    deviceStatus.dataType = "Smart Location";
  }
  deviceStatus.isCharging = isCharging;
  deviceStatus.isChargingComplete = isChargingComplete;
  deviceStatus.isReboot = isReboot;
  deviceStatus.isHistoricalData = isHistoricalData;
  deviceStatus.isAGPS = isAGPS;
  deviceStatus.isMotion = isMotion;
  deviceStatus.workMode = workMode;
  deviceStatus.signalSize = signalSize;
  deviceStatus.battery = battery;
  return deviceStatus;
}

function data2Model_GPS(data) {
  let map = {};
  let lat = (data[0] & 0xff) | (data[1] & 0xff) << 8 | (data[2] & 0xff) << 16 | (data[3] & 0xff) << 24;
  let lng = (data[4] & 0xff) | (data[5] & 0xff) << 8 | (data[6] & 0xff) << 16 | (data[7] & 0xff) << 24;
  let speed = (data[8] & 0xff) | (data[9] & 0xff) << 8;
  let direction = (data[10] & 0xff) | (data[11] & 0xff) << 8;
  let altitude = (data[12] & 0xff) | (data[13] & 0xff) << 8;
  let precision = (data[14] & 0xff) | (data[15] & 0xff) << 8;
  let mileage = (data[16] & 0xff) | (data[17] & 0xff) << 8 | (data[18] & 0xff) << 16 | (data[19] & 0xff) << 24;
  let satellites = data[20] & 0xff;
  map.lat = lat / 10000000;
  map.lng = lng / 10000000;
  map.speed = speed;
  map.direction = direction;
  map.altitude = altitude / 10;
  map.precision = precision;
  map.mileage = mileage;
  map.satellites = satellites;
  return map;
}

function data2Model_GSM(data) {
  let map_gsm = {};
  let gsmList = getJson_GSM(data);
  map_gsm.gsmList = gsmList;
  return map_gsm;
}

function data2Model_Wifi(data) {
  let map_wifi = {};
  let wifiList = getJson_Wifi(data);
  map_wifi.wifiList = wifiList;
  return map_wifi;
}
function getJson_Wifi(data) {
  let list = [];
  for (let i = 0; i + 6 < data.length;) {
    let node = {};
    let rssi = data[i] & 0xff;
    let mac = BytesHexStrUtil.bytesToHexString(data.slice(i + 1, i + 7));
    mac = mac.replace(/ /g, ":");
    node["mac"] = mac;
    node["signal"] = rssi;
    list.push(node);
    i += 7;
  }
  return list;
}

function getJson_GSM(data) {
  let list = [];
  let MCC = (data[0] & 0xff) | (data[1] & 0xff) << 8;
  let MNC = data[2] & 0xff;
  for (let i = 3; i + 4 < data.length;) {
    let node = {};
    let RXL = data[i];
    let LAC = (data[i + 1] & 0xff) | (data[i + 2] & 0xff) << 8;
    let CELLID = (data[i + 3] & 0xff) | (data[i + 4] & 0xff) << 8;
    node["mcc"] = MCC;
    node["mnc"] = MNC;
    node["cellId"] = CELLID;
    node["lac"] = LAC;
    node["signal"] = RXL;
    list.push(node);
    i += 5;
  }
  return list;
}
function data2Model_BLE(data) {
  let map_ble = {};
  let mac = bytesToHexString(data.slice(0, 6));
  let lat = data[6] & 0xFF | data[7] & 0xFF << 8 | data[8] & 0xFF << 16 | data[9] & 0xFF << 24;
  let lng = data[10] & 0xFF | data[11] & 0xFF << 8 | data[12] & 0xFF << 16 | data[13] & 0xFF << 24;
  map_ble.mac = mac;
  map_ble.lat = lat / 10000000;
  map_ble.lng = lng / 10000000;
  return map_ble;
}

function data2Model_BLE2(data) {
  let map_ble = {};
  let mac = bytesToHexString(data.slice(0, 6));
  let lat = data[6] & 0xFF | data[7] & 0xFF << 8 | data[8] & 0xFF << 16 | data[9] & 0xFF << 24;
  let lng = data[10] & 0xFF | data[11] & 0xFF << 8 | data[12] & 0xFF << 16 | data[13] & 0xFF << 24;
  let radius = data[14] & 0xFF | data[15] & 0xFF << 8;
  let height = data[16] & 0xFF | data[17] & 0xFF << 8;
  map_ble.mac = mac;
  map_ble.lat = lat / 10000000;
  map_ble.lng = lng / 10000000;
  map_ble.radius = radius / 10; // precision in meters
  map_ble.height = height;
  return map_ble;
}

function data2Model_Smart(data) {
  let map_ble = {};
  let lat = (data[0] & 0xff) | (data[1] & 0xff) << 8 | (data[2] & 0xff) << 16 | (data[3] & 0xff) << 24;
  let lng = (data[4] & 0xff) | (data[5] & 0xff) << 8 | (data[6] & 0xff) << 16 | (data[7] & 0xff) << 24;
  let radius = (data[8] & 0xff) | (data[9] & 0xff) << 8;
  let height = (data[10] & 0xff) | (data[11] & 0xff) << 8;
  map_ble["lat"] = lat / 10000000;
  map_ble["lng"] = lng / 10000000;
  map_ble["radius"] = radius;
  map_ble["height"] = height;
  return map_ble;
}

function data2Model_Call(data) {
  let map_call = {};
  let dateTime = bytes2DateTime(data.slice(0, 4));
  let flag = (data[4] & 0xff);
  let callInOut = (flag & 0x01);
  let callStatus = (flag & 0x0f) >> 1;
  let callType = (flag & 0xf0) >> 4;
  let time = (data[5] & 0xff) | (data[6] & 0xff) << 8;
  let retCode = (data[7] & 0xff);
  let numberBytes = data.slice(8, data.length);
  let number = bytes2StringByASCII(numberBytes);
  map_call["dateTime"] = new Date(dateTime.getTime());
  map_call["number"] = number;
  map_call["time"] = time;
  map_call["retCode"] = retCode;
  map_call["flag"] = flag;
  map_call["callInOut"] = callInOut;
  map_call["callStatus"] = callStatus;
  map_call["callType"] = callType;
  return map_call;
}

function data2Model_Step(data) {
  const ev07b_step_list = [];
  for (let i = 0; i < data.length;) {
      const ev07b_step = {};
      const dateTime = bytes2DateTime(data.slice(i, i + 4));
      const step = (data[i + 4] & 0xFF) | (data[i + 5] & 0xFF) << 8 
                  | (data[i + 6] & 0xFF) << 16 | (data[i + 7] & 0xFF) << 24;
      ev07b_step.dateTime = new Date(dateTime.getTime());
      ev07b_step.step = step;
      ev07b_step_list.push(ev07b_step);
      i += 8;
  }
  return ev07b_step_list;
}

function data2Model_Active(data) {
  const ev07b_active_list = [];
  for (let i = 0; i < data.length;) {
      const ev07b_active = {};
      const dateTime = bytes2DateTime(data.slice(i, i + 4));
      const active = (data[i + 4] & 0xFF) | (data[i + 5] & 0xFF) << 8
                  | (data[i + 6] & 0xFF) << 16 | (data[i + 7] & 0xFF) << 24;
      ev07b_active.dateTime = new Date(dateTime.getTime());
      ev07b_active.active = active;
      ev07b_active_list.push(ev07b_active);
      i += 8;
  }
  return ev07b_active_list;
}

function data2Model_HeartRate(data) {
  const ev07b_heart_list = [];
  for (let i = 0; i < data.length;) {
      const ev07b_heart = {};
      const dateTime = bytes2DateTime(data.slice(i, i + 4));
      const heartRate = data[i + 4] & 0xFF;
      const trustLevel = data[i + 5] & 0xFF;
      ev07b_heart.dateTime = new Date(dateTime.getTime());
      ev07b_heart.heartRate = heartRate;
      ev07b_heart.trustLevel = trustLevel;
      ev07b_heart_list.push(ev07b_heart);
      i += 6;
  }
  return ev07b_heart_list;
}


// ****************************************************************
function getCommand(sequenceId, data) {
  const cmdResponse = Object.create(CMD_Model);
  cmdResponse.bodyData = Object.create(CMD_DataBody);
  let cmdValue = null;
  Object.entries(data).forEach(([key, value]) => {
    if (key.toLowerCase() === "read") {
      const cmdKey = CMD_CONST.CMD_Config_Read;
      if (value != null) {
        cmdValue = new Uint8Array(value);
      }
      const cmdLength = cmdValue != null ? cmdValue.length + 1 : 1;
      cmdResponse.bodyData.addCmdData(cmdLength, cmdKey, cmdValue);
    } else if (key.toLowerCase() === "timezone") {
      const cmdKey = CMD_CONST.CMD_Config_TimeZone;
      const timeZone = Math.round((value + 0) * 60 / 15);
      cmdValue = new Uint8Array([timeZone & 0xFF]);
      const cmdLength = cmdValue != null ? cmdValue.length + 1 : 1;
      cmdResponse.bodyData.addCmdData(cmdLength, cmdKey, cmdValue);
    } else if (key.toLowerCase() === "workmode") {
      const cmdKey = CMD_CONST.CMD_Config_WorkMode;
      const workMode = value;
      const mode = workMode.mode + 1;
      const time = workMode.time;
      cmdValue = new Uint8Array([
        time & 0xFF,
        (time >> 8) & 0xFF,
        (time >> 16) & 0xFF,
        mode & 0xFF
      ]);
      const cmdLength = cmdValue != null ? cmdValue.length + 1 : 1;
      cmdResponse.bodyData.addCmdData(cmdLength, cmdKey, cmdValue);
    }else if (entry.getKey().toLowerCase() === "TimeInterval") {
      let cmdKey = CMD_CONST.CMD_Config_TimeInterval;
      let timeInterval = entry.getValue();
      let heartBeatStatus = timeInterval.get("heartBeatStatus") === "true" ? 1 : 0;
      heartBeatStatus = heartBeatStatus << 7;
      let heartBeat = parseInt(timeInterval.get("heartBeat"));
      let upload = parseInt(timeInterval.get("upload"));
      let uploadLazy = parseInt(timeInterval.get("uploadLazy"));
      let heartByte = new Uint8Array([
        heartBeat & 0xFF,
        (heartBeat >> 8) & 0xFF,
        (heartBeat >> 16) & 0xFF,
        (heartBeat >> 23) & 0xFF | heartBeatStatus,
      ]);
      let uploadByte = new Uint8Array([
        upload & 0xFF,
        (upload >> 8) & 0xFF,
        (upload >> 16) & 0xFF,
        (upload >> 24) & 0xFF,
      ]);
      let uploadLazyByte = new Uint8Array([
        uploadLazy & 0xFF,
        (uploadLazy >> 8) & 0xFF,
        (uploadLazy >> 16) & 0xFF,
        (uploadLazy >> 24) & 0xFF,
      ]);
      cmdValue = concatTypedArrays(heartByte, uploadByte);
      cmdValue = concatTypedArrays(cmdValue, uploadLazyByte);
      let cmdLength = cmdValue ? cmdValue.length + 1 : 1;
      bodyData.addCmdData(cmdLength, cmdKey, cmdValue);
    } else if (entry.getKey().toLowerCase() === "ContinueLocate") {
      let cmdKey = CMD_CONST.CMD_Config_ContinueLocate;
      let continueLocate = entry.getValue();
      let locate_interval = parseInt(continueLocate.get("interval"));
      let locate_time = parseInt(continueLocate.get("time"));
      cmdValue = new Uint8Array([
        locate_interval & 0xFF,
        (locate_interval >> 8) & 0xFF,
        locate_time & 0xFF,
        (locate_time >> 8) & 0xFF,
      ]);
      let cmdLength = cmdValue ? cmdValue.length + 1 : 1;
      bodyData.addCmdData(cmdLength, cmdKey, cmdValue);
    }else if (entry.getKey().toLowerCase() === "NoDisturb") {
      const cmdKey = CMD_CONST.CMD_Config_NoDisturb;
      const noDisturb = entry.getValue();
      const noDisturbStatus = noDisturb.status === "true" ? 1 : 0;
      const from = noDisturb.from.split(":");
      const from1 = parseInt(from[0]);
      const from2 = parseInt(from[1]);
      const to = noDisturb.to.split(":");
      const to1 = parseInt(to[0]);
      const to2 = parseInt(to[1]);
      cmdValue = [noDisturbStatus << 7, from1 & 0xff, from2 & 0xff, to1 & 0xff, to2 & 0xff];
      const cmdLength = cmdValue ? cmdValue.length + 1 : 1;
      bodyData.addCmdData(cmdLength, cmdKey, cmdValue);
    } else if (entry.getKey().toLowerCase() === "Password") {
      const cmdKey = CMD_CONST.CMD_Config_Password;
      const passwordMap = entry.getValue();
      const passwordStatus = passwordMap.status === "true" ? 1 : 0;
      const password = parseInt(passwordMap.password);
      passwordStatus <<= 7;
      cmdValue = [password & 0xff, (password >> 8) & 0xff, (password >> 16) & 0xff, (password >> 23) & 0xff | passwordStatus];
      const cmdLength = cmdValue ? cmdValue.length + 1 : 1;
      bodyData.addCmdData(cmdLength, cmdKey, cmdValue);
    }else if (entry.getKey().toLowerCase() === "Mileage") {
      const cmdKey = CMD_CONST.CMD_Config_Mileage;
      const mileage = parseInt(entry.getValue().toString(), 10);
      const cmdValue = new Uint8Array([
        mileage & 0xff,
        (mileage >> 8) & 0xff,
        (mileage >> 16) & 0xff,
        (mileage >> 24) & 0xff,
      ]);
      const cmdLength = cmdValue ? cmdValue.length + 1 : 1;
      bodyData.addCmdData(cmdLength, cmdKey, cmdValue);
    } else if (entry.getKey().toLowerCase() === "RingtoneVolume") {
      const cmdKey = CMD_CONST.CMD_Config_RingtoneVolume;
      const ringtoneVolume = parseInt(entry.getValue().toString(), 10);
      const cmdValue = new Uint8Array([ringtoneVolume & 0xff]);
      const cmdLength = cmdValue ? cmdValue.length + 1 : 1;
      bodyData.addCmdData(cmdLength, cmdKey, cmdValue);
    } else if (entry.getKey().toLowerCase() === "SpeakerVolume") {
      const cmdKey = CMD_CONST.CMD_Config_SpeakerVolume;
      const speakerVolume = parseInt(entry.getValue().toString(), 10);
      const cmdValue = new Uint8Array([speakerVolume & 0xff]);
      const cmdLength = cmdValue ? cmdValue.length + 1 : 1;
      bodyData.addCmdData(cmdLength, cmdKey, cmdValue);
    }else if (entry.getKey().toLowerCase() === "micvolume") {
      const cmdKey = CMD_CONST.CMD_Config_MicVolume;
      const micVolume = parseInt(entry.getValue(), 10);
      cmdValue = [micVolume & 0xff];
      const cmdLength = cmdValue ? cmdValue.length + 1 : 1;
      bodyData.addCmdData(cmdLength, cmdKey, cmdValue);
    } else if (entry.getKey().replace(/[0-9]/g, "").toLowerCase() === "alarmclock") {
      const cmdKey = CMD_CONST.CMD_Config_AlarmClock;
      const alarmClock = entry.getValue();
      const index = parseInt(entry.getKey().replace(/[a-zA-Z]/g, ""), 10);
      const alarm_status = alarmClock.status ? 1 : 0;
      const alarm_time = alarmClock.time.split(":");
      const hours = parseInt(alarm_time[0], 10);
      const minutes = parseInt(alarm_time[1], 10);
      const alarm_ringTime = parseInt(alarmClock.ringTime, 10);
      const alarm_ringType = parseInt(alarmClock.ringType, 10);
      let week = 0;
      if (alarmClock.mon) week += 1;
      if (alarmClock.tus) week += 2;
      if (alarmClock.wed) week += 4;
      if (alarmClock.thu) week += 8;
      if (alarmClock.fri) week += 16;
      if (alarmClock.sat) week += 32;
      if (alarmClock.sun) week += 64;
      cmdValue = [index | (alarm_status << 7), hours, minutes, week, alarm_ringTime, alarm_ringType];
      const cmdLength = cmdValue ? cmdValue.length + 1 : 1;
      bodyData.addCmdData(cmdLength, cmdKey, cmdValue);
    }else if (entry.getKey().toLowerCase() === "enablecontrol") {
      const cmdKey = CMD_CONST.CMD_Config_EnableControl;
      const enableControl = entry.getValue();
      let enable1 = (enableControl.led === true) ? 1 : 0;
      enable1 += (enableControl.beep === true) ? (1 << 1) : 0;
      enable1 += (enableControl.motor === true) ? (1 << 2) : 0;
      enable1 += (enableControl.gsmLoc === true) ? (1 << 3) : 0;
      enable1 += (enableControl.wifiLoc === true) ? (1 << 4) : 0;
      enable1 += (enableControl.sosSpeaker === true) ? (1 << 5) : 0;
      enable1 += (enableControl.xSpeaker === true) ? (1 << 6) : 0;
      enable1 += (enableControl.bleLongConnect === true) ? (1 << 7) : 0;
      let enable2 = (enableControl.bleLoc === true) ? 1 : 0;
      enable2 += (enableControl.sosCallNumberVoice === true) ? (1 << 1) : 0;
      let enable4 = (enableControl.autoUpdate === true) ? (1 << 6) : 0;
      enable4 += (enableControl.agps === true) ? (1 << 7) : 0;
      const cmdValue = new Uint8Array([enable1 & 0xff, enable2 & 0xff, 0, enable4 & 0xff]);
      const cmdLength = cmdValue.length + 1;
      bodyData.addCmdData(cmdLength, cmdKey, cmdValue);
    }else if (entry.getKey().replace(/[0-9]/g, "").toLowerCase() === "Number") {
      const cmdKey = CMD_CONST.CMD_Config_Number;
      const number = entry.getValue();
      const index = entry.getKey().replace(/[a-zA-Z]/g, "");
      const numberValue = string2BytesByASCII(number.get("number"));
      let flag = parseInt(index) & 0x0F;
      flag += number.get("enable") ? 1 : 0 << 7;
      flag += number.get("sms") ? 1 : 0 << 6;
      flag += number.get("call") ? 1 : 0 << 5;
      flag += number.get("noCard") ? 1 : 0 << 4;
      const cmdValue = new Uint8Array([flag & 0xFF]);
      const cmdValueWithNumber = new Uint8Array(
        [...cmdValue, ...numberValue]
      );
      const cmdLength = cmdValueWithNumber.length + 1;
      bodyData.addCmdData(cmdLength, cmdKey, cmdValueWithNumber);
    } else if (entry.getKey().toLowerCase() === "OverSpeedAlert") {
      const cmdKey = CMD_CONST.CMD_Config_AlertOverSpeed;
      const overSpeedAlert = entry.getValue();
      const overSpeedStatus = overSpeedAlert.get("status") ? 1 : 0;
      const overSpeedSpeed = parseInt(overSpeedAlert.get("speed"));
      const cmdValue = new Uint8Array([
        overSpeedSpeed & 0xFF,
        ((overSpeedSpeed >> 8) & 0xFF) | (overSpeedStatus << 7),
      ]);
      const cmdLength = cmdValue.length + 1;
      bodyData.addCmdData(cmdLength, cmdKey, cmdValue);
    }else if (entry.getKey().equalsIgnoreCase("TiltAlert")) {
      const cmdKey = CMD_CONST.CMD_Config_AlertTilt;
      const tiltAlert = entry.getValue();
      const tiltStatus = tiltAlert.get("status") === "true" ? 1 : 0;
      const tiltDial = tiltAlert.get("dial") === "true" ? 1 : 0;
      const tiltAngle = Number(tiltAlert.get("angle"));
      const tiltTime = Number(tiltAlert.get("time"));
      const cmdValue = [tiltTime & 0xff, (tiltTime >> 8) & 0xff, tiltAngle & 0xff, ((tiltDial << 6) | (tiltStatus << 7))];
      const cmdLength = cmdValue.length + 1;
      bodyData.addCmdData(cmdLength, cmdKey, cmdValue);
    } else if (entry.getKey().equalsIgnoreCase("MotionAlert")) {
      const cmdKey = CMD_CONST.CMD_Config_AlertMotion;
      const motionAlert = entry.getValue();
      const motionStatus = motionAlert.get("status") === "true" ? 1 : 0;
      const motionDial = motionAlert.get("dial") === "true" ? 1 : 0;
      const staticTime = Number(motionAlert.get("staticTime"));
      const moveTime = Number(motionAlert.get("moveTime"));
      const cmdValue = [
        staticTime & 0xff,
        (staticTime >> 8) & 0xff,
        moveTime & 0xff,
        (((moveTime >> 8) & 0x3f) | (motionDial << 6) | (motionStatus << 7))
      ];
      const cmdLength = cmdValue.length + 1;
      bodyData.addCmdData(cmdLength, cmdKey, cmdValue);
    }else if (entry.getKey().toLowerCase() === "NoMotionAlert") {
      let cmdKey = CMD_CONST.CMD_Config_AlertNoMotion;
      let noMotionAlert = entry.getValue();
      let noMotionStatus = noMotionAlert.status ? 1 : 0;
      let noMotionDial = noMotionAlert.dial ? 1 : 0;
      let noMotionTime = parseInt(noMotionAlert.time);
      let cmdValue = new Uint8Array([
        noMotionTime & 0xFF,
        (noMotionTime >> 8) & 0xFF,
        (noMotionTime >> 16) & 0xFF,
        ((noMotionTime >> 24) & 0x3F) | (noMotionDial << 6) | (noMotionStatus << 7)
      ]);
      let cmdLength = cmdValue ? cmdValue.length + 1 : 1;
      bodyData.addCmdData(cmdLength, cmdKey, cmdValue);
    } else if (entry.getKey().toLowerCase() === "FallDownAlert") {
      let cmdKey = CMD_CONST.CMD_Config_AlertFallDown;
      let fallDownAlert = entry.getValue();
      let fallDownStatus = fallDownAlert.status ? 1 : 0;
      let fallDownDial = fallDownAlert.dial ? 1 : 0;
      let fallDownLevel = parseInt(fallDownAlert.level);
      let cmdValue = new Uint8Array([(fallDownLevel & 0x0F) | (fallDownDial << 6) | (fallDownStatus << 7)]);
      let cmdLength = cmdValue ? cmdValue.length + 1 : 1;
      bodyData.addCmdData(cmdLength, cmdKey, cmdValue);
    }else if (entry.getKey().toLowerCase() === "powerlowalert") {
      let cmdKey = CMD_CONST.CMD_Config_AlertPowerLow;
      let powerAlert = entry.getValue();
      let powerLowStatus = powerAlert.status ? 1 : 0;
      let powerON = powerAlert.powerON ? 1 : 0;
      let powerOFF = powerAlert.powerOFF ? 1 : 0;
      let powerLow = parseInt(powerAlert.power);
      cmdValue = new Uint8Array([powerLow & 0xff, 0, 0, (powerLowStatus << 5) | (powerON << 6) | (powerOFF << 7)]);
      let cmdLength = cmdValue ? cmdValue.length + 1 : 1;
      bodyData.addCmdData(cmdLength, cmdKey, cmdValue);
    } else if (entry.getKey().toLowerCase() === "bleloc") {
      let cmdKey = CMD_CONST.CMD_Config_BleLoc;
      let bleLoc = entry.getValue();
      let lat = Math.round(bleLoc.lat * 10000000);
      let lng = Math.round(bleLoc.lng * 10000000);
      let bleLat = new Uint8Array([lat & 0xff, (lat >> 8) & 0xff, (lat >> 16) & 0xff, (lat >> 24) & 0xff]);
      let bleLng = new Uint8Array([lng & 0xff, (lng >> 8) & 0xff, (lng >> 16) & 0xff, (lng >> 24) & 0xff]);
      cmdValue = concatTypedArrays(bleLat, bleLng);
      let describe = bleLoc.describe;
      let bleDescribe = stringToAscii(describe);
      cmdValue = concatTypedArrays(cmdValue, bleDescribe);
      let cmdLength = cmdValue ? cmdValue.length + 1 : 1;
      bodyData.addCmdData(cmdLength, cmdKey, cmdValue);
    }else if (entry.getKey().replace(/[0-9]/g, "").toLowerCase() === "BleWhiteList") {
      const cmdKey = CMD_CONST.CMD_Config_BleWhiteList;
      const bleWhiteList = entry.getValue();
      const bwlIndex = parseInt(entry.getKey().replace(/[a-zA-Z]/g, ""), 10);
      const flag = bleWhiteList.get("enable") ? 1 : 0;
      const bwlMac = BytesHexStrUtil.hexStringToBytes(bleWhiteList.get("mac").replace(":", ""), false);
      let cmdValue = new Uint8Array([(flag << 7) | (bwlIndex & 0x7F)]);
      cmdValue = new Uint8Array([...cmdValue, ...bwlMac]);
      const cmdLength = cmdValue ? cmdValue.length + 1 : 1;
      bodyData.addCmdData(cmdLength, cmdKey, cmdValue);
  }else if (entry.getKey().toLowerCase() === 'Music') {
    const cmdKey = CMD_CONST.CMD_Config_Music;
    const music = entry.getValue();
    let flag1 = (music.beep) ? 1 : 0;
    flag1 += (music.alertTiltCannel) ? (1 << 1) : 0;
    flag1 += (music.alertCharging) ? (1 << 2) : 0;
    flag1 += (music.alertBatteryLow) ? (1 << 3) : 0;
    flag1 += (music.callingcontact1) ? (1 << 4) : 0;
    flag1 += (music.callingcontact2) ? (1 << 5) : 0;
    flag1 += (music.callingcontact3) ? (1 << 6) : 0;
    flag1 += (music.callingcontact4) ? (1 << 7) : 0;
    let flag2 = (music.callingcontact5) ? 1 : 0;
    flag2 += (music.alertFallDowncannel) ? (1 << 1) : 0;
    flag2 += (music.alertSOS) ? (1 << 2) : 0;
    flag2 += (music.stopSOS) ? (1 << 3) : 0;
    flag2 += (music.alertStatic) ? (1 << 4) : 0;
    flag2 += (music.alertMotion) ? (1 << 5) : 0;
    flag2 += (music.alertTilt) ? (1 << 6) : 0;
    flag2 += (music.reminder) ? (1 << 7) : 0;
    let flag3 = (music.findme) ? 1 : 0;
    flag3 += (music.callingcontact6) ? (1 << 1) : 0;
    const cmdValue = new Uint8Array([flag1 & 0xFF, flag2 & 0xFF, flag3 & 0xFF, 0]);
    const cmdLength = cmdValue.length + 1;
    bodyData.addCmdData(cmdLength, cmdKey, cmdValue);
  }else if (entry.getKey().toLowerCase() === "sosbutton") {
    const cmdKey = CMD_CONST.CMD_Config_SOSButton;
    const sosButton = entry.getValue();
    const sosButtonStatus = sosButton.status ? 1 : 0;
    const sosButtonMode = Number(sosButton.mode);
    const sosButtonTask = Number(sosButton.task);
    const sosButtonTime = Number(sosButton.time);
    const sosButtonFeedBack = Number(sosButton.feedBack);
    const sosButtonData = sosButtonFeedBack | (sosButtonTime << 2) | (sosButtonTask << 9) | (sosButtonMode << 13) | (sosButtonStatus << 15);
    const cmdValue = [(sosButtonData & 0xFF), ((sosButtonData & 0xFF00) >> 8)];
    const cmdLength = cmdValue.length + 1 || 1;
    bodyData.addCmdData(cmdLength, cmdKey, cmdValue);
  } else if (entry.getKey().toLowerCase() === "call1button") {
    const cmdKey = CMD_CONST.CMD_Config_Call1Button;
    const call1Button = entry.getValue();
    const call1ButtonStatus = call1Button.status ? 1 : 0;
    const call1ButtonMode = Number(call1Button.mode);
    const call1ButtonTask = Number(call1Button.task);
    const call1ButtonTime = Number(call1Button.time);
    const call1ButtonFeedBack = Number(call1Button.feedBack);
    const call1ButtonData = call1ButtonFeedBack | (call1ButtonTime << 2) | (call1ButtonTask << 9) | (call1ButtonMode << 13) | (call1ButtonStatus << 15);
    const cmdValue = [(call1ButtonData & 0xFF), ((call1ButtonData & 0xFF00) >> 8)];
    const cmdLength = cmdValue.length + 1 || 1;
    bodyData.addCmdData(cmdLength, cmdKey, cmdValue);
  }else if (entry.getKey().toLowerCase() === "call2button") {
    const cmdKey = CMD_CONST.CMD_Config_Call2Button;
    const call2Button = entry.getValue();
    const call2ButtonStatus = call2Button.status ? 1 : 0;
    const call2ButtonMode = parseInt(call2Button.mode, 10);
    const call2ButtonTask = parseInt(call2Button.task, 10);
    const call2ButtonTime = parseInt(call2Button.time, 10);
    const call2ButtonFeedBack = parseInt(call2Button.feedBack, 10);
    const call2ButtonData = call2ButtonFeedBack | (call2ButtonTime << 2) | 
      (call2ButtonTask << 9) | (call2ButtonMode << 13) | (call2ButtonStatus << 15);
    const cmdValue = [call2ButtonData & 0xFF, (call2ButtonData & 0xFF00) >> 8];
    const cmdLength = cmdValue.length + 1;
    bodyData.addCmdData(cmdLength, cmdKey, cmdValue);
  } else if (entry.getKey().toLowerCase() === "smsoption") {
    const cmdKey = CMD_CONST.CMD_Config_SMSOption;
    const smsOption = entry.getValue();
    const smsStatus = smsOption.status ? 1 : 0;
    const smsPrefix = string2BytesByASCII(smsOption.prefix);
    let cmdValue = [(smsStatus << 7) & 0xFF];
    cmdValue = cmdValue.concat(smsPrefix);
    const cmdLength = cmdValue.length + 1;
    bodyData.addCmdData(cmdLength, cmdKey, cmdValue);
  } else if (entry.getKey().toLowerCase() === "sosoption") {
    const cmdKey = CMD_CONST.CMD_Config_SOSOption;
    const sosOption = entry.getValue();
    const holdTime = parseInt(sosOption.holdTime, 10);
    const ringsTime = parseInt(sosOption.ringsTime, 10);
    const loops = parseInt(sosOption.loops, 10);
    const cmdValue = [holdTime & 0xFF, (holdTime >> 8) & 0xFF,    ringsTime & 0xFF, loops & 0xFF];
    const cmdLength = cmdValue.length + 1;
    bodyData.addCmdData(cmdLength, cmdKey, cmdValue);
  }else if (entry.getKey().toLowerCase() === "phoneOption") {
    let cmdKey = CMD_CONST.CMD_Config_PhoneOption;
    let phoneOption = entry.getValue();
    let rings = parseInt(phoneOption.rings);
    let phone1 = phoneOption.s1 ? 1 : 0;
    let phone2 = phoneOption.s2 ? 1 : 0;
    let phone3 = phoneOption.s3 ? 1 : 0;
    let phone4 = phoneOption.s4 ? 1 : 0;
    let phone5 = phoneOption.s5 ? 1 : 0;
    let cmdValue = [(rings & 0x7F) | (phone1 << 7), 
      phone2 | (phone3 << 1) | (phone4 << 2) | (phone5 << 3),0,0];
    let cmdLength = cmdValue.length + 1;
    bodyData.addCmdData(cmdLength, cmdKey, cmdValue);
  } else if (entry.getKey().toLowerCase() === "APN") {
    let cmdKey = CMD_CONST.CMD_Config_APN;
    let cmdValue = string2BytesByASCII(entry.getValue().toString());
    let cmdLength = cmdValue.length + 1;
    bodyData.addCmdData(cmdLength, cmdKey, cmdValue);
  } else if (entry.getKey().toLowerCase() === "ApnUserName") {
    let cmdKey = CMD_CONST.CMD_Config_ApnUserName;
    let cmdValue = string2BytesByASCII(entry.getValue().toString());
    let cmdLength = cmdValue.length + 1;
    bodyData.addCmdData(cmdLength, cmdKey, cmdValue);
  }else if (entry.getKey().toLowerCase() === "ApnPassword") {
    const cmdKey = CMD_CONST.CMD_Config_ApnPassword;
    const cmdValue = string2BytesByASCII(entry.getValue().toString());
    const cmdLength = cmdValue ? cmdValue.length + 1 : 1;
    bodyData.addCmdData(cmdLength, cmdKey, cmdValue);
  } else if (entry.getKey().toLowerCase() === "Sever") {
    const cmdKey = CMD_CONST.CMD_Config_SeverIPPort;
    const sever = entry.getValue();
    const severStatus = sever.status === 'true' ? 1 : 0;
    const severIP = string2BytesByASCII(sever.ip);
    const severType = parseInt(sever.type);
    const severPort = parseInt(sever.port);
    const cmdValue = [    ((severStatus << 7) | (severType & 0x01)),    (severPort & 0xFF),    ((severPort >> 8) & 0xFF)  ];
    cmdValue.push(...severIP);
    const cmdLength = cmdValue.length + 1;
    bodyData.addCmdData(cmdLength, cmdKey, cmdValue);
  }else if (entry.getKey().replace(/[0-9]/g, "").toLowerCase() === "GeoAlert") {
    let cmdKey = CMD_CONST.CMD_Config_AlertGEO;
    let geoAlert = entry.getValue();
    let geoIndex = parseInt(entry.getKey().replace(/[a-zA-Z]/g, ""));
    let geoStatus = geoAlert.status ? 1 : 0;
    let geoDirection = parseInt(geoAlert.direction);
    let geoType = parseInt(geoAlert.type);
    let geoRadius = parseInt(geoAlert.radius);
    let geoLatlng = geoAlert.latlng.split(";");
    let geoPoints = geoLatlng.length;
    cmdValue = new Uint8Array([
      (geoIndex & 0x0F) | ((geoPoints << 4) & 0xF0),
      (geoStatus & 0x01) | ((geoDirection & 0x01) << 1) | ((geoType & 0x01) << 2),
      geoRadius & 0xFF, (geoRadius >> 8) & 0xFF,
    ]);
    for (let i = 0; i < geoPoints; i++) {
      let latlngStr = geoLatlng[i].split(",");
      let lat = Math.round(parseFloat(latlngStr[0]) * 10000000);
      let lng = Math.round(parseFloat(latlngStr[1]) * 10000000);
      let latByte = new Uint8Array([
        lat & 0xFF, (lat >> 8) & 0xFF, (lat >> 16) & 0xFF, (lat >> 24) & 0xFF,
      ]);
      let lngByte = new Uint8Array([
        lng & 0xFF, (lng >> 8) & 0xFF, (lng >> 16) & 0xFF, (lng >> 24) & 0xFF,
      ]);
      cmdValue = new Uint8Array([...cmdValue, ...latByte, ...lngByte]);
    }
    let cmdLength = cmdValue ? cmdValue.length + 1 : 1;
    bodyData.addCmdData(cmdLength, cmdKey, cmdValue);
  }
})
  cmd_Response.headData.sequenceId = sequenceId;
  cmd_Response.headData.propertie.flag_ACK = true;
  cmd_Response.bodyData.cmdType = CMD_CONST.CMD_Type_Config;
  return cmd_Response;
}

function sendCommand(headData, cmdType, cmdKey, cmdValue) {
  let cmd_Response = new CMD_Model(headData, new CMD_DataBody());
  cmd_Response.getBodyData().setCmdType(cmdType);
  let cmdLength = cmdValue ? cmdValue.length + 1 : 1;
  cmd_Response.getBodyData().addCmdData(cmdLength, cmdKey, cmdValue);
  return cmd_Response;
}

function getByteData(sequenceId, bodyData) {
  let cmd_head = new CMD_DataHead();
  cmd_head.getPropertie().setFlag_ACK(true);
  cmd_head.setSequenceId(sequenceId);
  return getByteData(cmd_head, bodyData);
}
function getByteData(cmd_Model) {
  let bodyData = [];
  let cmdType = cmd_Model.bodyData.cmdType;
  bodyData.push(cmdType);
  let cmdList = cmd_Model.bodyData.cmdData;
  for (let cmd of cmdList) {
    let cmdLength = cmd.cmdLength;
    bodyData.push(cmdLength);
    let cmdKey = cmd.cmdKey;
    bodyData.push(cmdKey);
    let cmdValue = cmd.cmdValue;
    bodyData = bodyData.concat(cmdValue);
  }
  return getByteData(cmd_Model.headData, bodyData);
}

function getByteData(cmd_head, bodyData) {
  let headData = new Array(8).fill(0);
  headData[0] = CMD_CONST.CMD_Head;
  let propertie = cmd_head.propertie;
  let version = propertie.version;
  let flag_ACK = propertie.flag_ACK ? 1 : 0;
  let flag_ERR = propertie.flag_ERR ? 1 : 0;
  let encryption = propertie.encryption;
  let properties = (encryption << 6) | (flag_ERR << 5) | (flag_ACK << 4) | version;
  headData[1] = properties & 0xff;
  let length = bodyData.length;
  headData[2] = length & 0xff;
  headData[3] = (length >> 8) & 0xff;
  let checkCRC = CheckCRC.crc16_bit(bodyData);
  headData[4] = checkCRC & 0xff;
  headData[5] = (checkCRC >> 8) & 0xff;
  let sequenceId = cmd_head.sequenceId;
  headData[6] = sequenceId & 0xff;
  headData[7] = (sequenceId >> 8) & 0xff;
  return headData.concat(bodyData);
}

function hexStringToByteArray(hexStrings) {
  let length = 0;
  for (let hex of hexStrings) {
    hex = `0x${hex}`;
    length += hex.length / 2;
  }
  let result = new Uint8Array(length);
  let j = 0;
  for (let hex of hexStrings) {
    let end = hex.length;
    for (let i = 0; i < end; i += 2) {
      result[j++] = (parseInt(hex.substr(i, 2), 16));
    }
  }
  return result;
}
function main (data){
 console.log("🚀 ~ file: protocolAnalysis.js:1523 ~ main ~ data", data)
 return  protocolAnalysis(hexStringToByteArray(data))
}
 module.exports={main}


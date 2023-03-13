

    const CMD_CONST ={
	 CMD_Head : 0xAB,//Command Head
	
	 CMD_Type_Data : 0x01,//Data Command
	 CMD_Type_Config : 0x02,//Configuration
	 CMD_Type_Service : 0x03,//Services
	 CMD_Type_System : 0x04,//System Control
	 CMD_Type_Update : 0x7E,//Firmware Update
	 CMD_Type_Response : 0x7F,//Negative Response
	
	//Data
	 CMD_Data_IMEI : 0x01,//IMEI
	 CMD_Data_AlarmCode : 0x02,//Alarm Code
	 CMD_Data_Historical : 0x11,//Historical data
	 CMD_Data_SingleLocating : 0x12,//Single locating
	 CMD_Data_ContinueLocating : 0x13,//Continue locating
	 CMD_Data_GPS : 0x20,//GPS location
	 CMD_Data_GSM : 0x21,//GSM towers
	 CMD_Data_WIFI : 0x22,//Wifi towers
	 CMD_Data_BLE : 0x23,//BLE
	 CMD_Data_Status : 0x24,//General Status data
	 CMD_Data_CallRecords : 0x25,//Call Records
	 CMD_Data_BLE2 : 0x26,//BLE
	 CMD_Data_Smart : 0x27,//Smart Location
	 CMD_Data_STEP : 0x30,//G-sensor data(Pedometer)
	 CMD_Data_Active : 0x31,//Active
	 CMD_Data_HeartRate : 0x40,//HeartRate
	
	//Config
	 CMD_Config_Module : 0x01,//Module Number
	 CMD_Config_Version : 0x02,//Firmware Version
	 CMD_Config_IMEI : 0x03,//IMEI
	 CMD_Config_ICCID : 0x04,//ICCID
	 CMD_Config_MAC : 0x05,//MAC
	 CMD_Config_DATATIME : 0x06,//Setting Time
	 CMD_Config_RUNTIME : 0x07,//Run Times
	 CMD_Config_Firmware : 0x08,//Firmware Information
	//System Setting
	 CMD_Config_Mileage : 0x09,//Initialize Mileage
	 CMD_Config_WorkMode : 0x0A,//Work Mode
	 CMD_Config_AlarmClock : 0x0B,//Alarm Clock
	 CMD_Config_NoDisturb : 0x0C,//No Disturb
	 CMD_Config_Password : 0x0D,//Password Protect
	 CMD_Config_TimeZone : 0x0E,//Time Zone
	 CMD_Config_EnableControl : 0x0F,//Enable control
	 CMD_Config_RingtoneVolume : 0x10,//Ring-Tone Volume
	 CMD_Config_MicVolume : 0x11,//Mic Volume
	 CMD_Config_SpeakerVolume : 0x12,//Speaker Volume
	 CMD_Config_DeviceName : 0x13,//Device Name
	 CMD_Config_Battery : 0x14,//Battery
	 CMD_Config_BleLoc : 0x15,//BLE loc
	 CMD_Config_BleWhiteList : 0x16,//BLE whitelist
	 CMD_Config_Music : 0x19,//Music
	 CMD_Config_FWVersion : 0x1a,//FW Version
	 CMD_Config_GSMModule : 0x1b,//GSM Module
	//Button Setting
	 CMD_Config_SOSButton : 0x20,//SOS Button
	 CMD_Config_Call1Button : 0x21,//Call 1 Button
	 CMD_Config_Call2Button : 0x22,//Call 2 Button
	//Phone Settings
	 CMD_Config_Number : 0x30,//Set Authorized Number
	 CMD_Config_SMSOption : 0x31,//SMS Reply Prefix Text
	 CMD_Config_SOSOption : 0x32,//SOS Option
	 CMD_Config_PhoneOption : 0x33,//Phone Switches
	//GPRS Setting
	 CMD_Config_APN : 0x40,//APN
	 CMD_Config_ApnUserName : 0x41,//Apn user name
	 CMD_Config_ApnPassword : 0x42,//Apn password
	 CMD_Config_SeverIPPort : 0x43,//Sever IP &Port
	 CMD_Config_TimeInterval : 0x44,//Time interval 
	 CMD_Config_ContinueLocate : 0x45,//Continue Locate
	//Alert Settings
	 CMD_Config_AlertPowerLow : 0x50,//Power Alert 
	 CMD_Config_AlertGEO : 0x51,//GEO Alert 
	 CMD_Config_AlertMotion : 0x52,//Motion Alert 
	 CMD_Config_AlertNoMotion : 0x53,//No-motion Alert 
	 CMD_Config_AlertOverSpeed : 0x54,//Over speed Alert 
	 CMD_Config_AlertTilt : 0x55,//Tilt Alert 
	 CMD_Config_AlertFallDown : 0x56,//Fall Down Alert 
	
	 CMD_Config_Read : 0xF0,//Read
//	 CMD_Config_Save : 0xFE,//(0xFE)
	
	//Services
	 CMD_Services_IMEI : 0x01,//IMEI
	 CMD_Services_HeartBeat : 0x10,//Heart beat
	 CMD_Services_getAddresses : 0x11,//Get Addresses
	 CMD_Services_getTimestamp : 0x12,//Get Timestamp
	 CMD_Services_getLocationGSM : 0x21,//Get GSM Location
	 CMD_Services_getLocationWIFI : 0x22,//Get WIFI Location

	//Firmware Update
	 CMD_Update_InitialData : 0x10,//Initial Data
	 CMD_Update_FirmwareData : 0x11,//Firmware Data
	 CMD_Update_Validate : 0x12,//Validate
	 CMD_Update_State : 0x13,//Update State
	 CMD_Update_PackSize : 0x15,//Update Pack Max len
	
	//Response Data
	 CMD_Response_Success : 0x00,//Success
	 CMD_Response_VersionError : 0x11,//Version Invalid
	 CMD_Response_EncryptError : 0x12,//Encryption Invalid
	 CMD_Response_LengthError : 0x13,//Length error
	 CMD_Response_CRCError : 0x14,//Check CRC error
	 CMD_Response_CommandError : 0x15,//Command Invalid
	 CMD_Response_KeyError : 0x16,//Key Invalid
	 CMD_Response_KeyLengthError : 0x17,//Key length error
	 CMD_Response_DataFormatError : 0x21,//Data Format Invalid
	 CMD_Response_DataSizeError : 0x22,//Data Size Error
	 CMD_Response_StateError : 0x23,//Invalid State
	 CMD_Response_ParameterError : 0x24,//Invalid Parameter
	 CMD_Response_NoMemoryError : 0x25,//No Memory
	 CMD_Response_funNoSuported : 0x26,//functiont not suported
	 CMD_Response_GPSNoLocation : 0x27,//GPS not Location
	 CMD_Response_AddressError : 0x28,//Address resolution Error
	 CMD_Response_ServiceFeeError : 0x30,//Service default fee
	 CMD_Response_LowBattery : 0xF0,//Battery Power Low
}
 
module.exports={CMD_CONST};
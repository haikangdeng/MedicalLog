pragma solidity ^0.5.0;

contract Hospital{
    
    struct PersonalInfo {
        string name;
        uint age;
        string gender;
        string PItype;
    }

    struct Report {
        bool released;
        address[] openTo;
        address doctor;

        string date;
        string symptoms;
        string diagnosis;
        string prescription;
    }

    address[] infoedAddr; //addresses that created account
    address[] regAddr; //addresses that registered for appointment
    
    
    mapping (address => PersonalInfo) addr2PI;
    mapping (address => bytes32[]) addr2pointer;
    mapping (bytes32 => Report) pointer2Report;
    
    constructor() public {
        infoedAddr.push(msg.sender);

        PersonalInfo memory PI;
        addr2PI[msg.sender] = PI;
        addr2PI[msg.sender].name = string("administrator");
        addr2PI[msg.sender].PItype = string("admin");

    }


    function getPI() public view returns(string memory, uint, string memory) {
        if (compareStrings(getType(msg.sender), string("patient")) ||
            compareStrings(getType(msg.sender), string("doctor"))) {
            PersonalInfo memory PI = addr2PI[msg.sender];
            return (addr2PI[msg.sender].name, PI.age, PI.gender);
        } else {
            return ("", 0, "");
        }
    }


    //administrator authorize doctor address
    function authorizeDoctor(address addr, string memory name) public {
        if (!compareStrings(getType(msg.sender), string("admin"))) {
            //emit no permission except administrator
            return;
        }
        if (!compareStrings(getType(addr), string("N/A"))) {
            //emit address already exist
            return;
        }
        infoedAddr.push(addr);
        PersonalInfo memory pI;
        pI.name = name;
        pI.PItype = string("doctor");
        addr2PI[addr] = pI;
    }
    

    //patients create account
    function createAccount(string memory name, uint age, string memory gender) public {
        for (uint i = 0; i < infoedAddr.length; i++) {
            if (infoedAddr[i] == msg.sender) {
                //emit account already exists
                return;
            }
        }
        infoedAddr.push(msg.sender);
        PersonalInfo memory pI;
        pI.name = name;
        pI.age = age;
        pI.gender = gender;
        pI.PItype = string("patient");
        addr2PI[msg.sender] = pI;
    }


    //patients register for appointment and give doctor the right to write the report
    function register(address doctor) public {
        if (compareStrings(getType(msg.sender), string("N/A"))) {
            //create account first then register for appointment
            return;
        }
        if (!compareStrings(getType(doctor), string("doctor"))) {
            //not doctor
            return;
        }
        address addr = msg.sender;
        bool existed = true;
        for (uint i = 0; i < regAddr.length; i++){
            if (regAddr[i] == addr) {
              //not sure whether to use storage or memory;
                break;
            }
            if (i == regAddr.length - 1) {
                existed = false;
                regAddr.push(addr);
                break;
            }
        }
        bytes32 reportHash = sha256(abi.encode(addr, addr2pointer[addr].length + 1));
        if (existed) {
            addr2pointer[addr].push(reportHash);
        } else {
            addr2pointer[addr] = [reportHash];
        }
        Report memory report;
        pointer2Report[reportHash] = report;
        pointer2Report[reportHash].doctor = doctor;
        
        pointer2Report[reportHash].openTo = new address[](0);
        pointer2Report[reportHash].openTo.push(doctor);
    }


    //patients release report
    function releaseRep(uint reportIdx) public {
        if (reportIdx > addr2pointer[msg.sender].length) return;
        //emit
        bytes32 reportHash = addr2pointer[msg.sender][reportIdx-1];
        pointer2Report[reportHash].released = true;
    }


    //patients authorize certain people to view
    function showRepTo(uint reportIdx, address addr) public { //counts from 1
        if (compareStrings(getType(addr), string("N/A"))) {
            //emit create account first
            return;
        }
        if (reportIdx > addr2pointer[msg.sender].length) return;
        //emit index out of bounds
        bytes32 reportHash = addr2pointer[msg.sender][reportIdx-1];
        for (uint i = 0; i < pointer2Report[reportHash].openTo.length; i++){
            if (addr == pointer2Report[reportHash].openTo[i]) return;
        }
        pointer2Report[reportHash].openTo.push(addr);
    }


    //from doctor
    function fillRep(address patAddr, uint repIdx, string memory date,
            string memory symptoms, string memory diagnosis, string memory prescription) public {
        //bool fill = false;
        if (compareStrings(getType(msg.sender), string("N/A"))) {
            //emit create account first
            return;
        } else if (compareStrings(getType(msg.sender), string("patient"))) {
            //emit only for doctor
            return;
        }
        for (uint i = 0; i < regAddr.length; i++) {
            if (regAddr[i] == patAddr) {
                break;
            }
            if (i == regAddr.length - 1){
                //emit patAddr not registered for any appointment
                return;
            }
        }
        if (repIdx > addr2pointer[patAddr].length) {
            //emit report index out of bounds
            return;
        }
        bytes32 repPointer = addr2pointer[patAddr][repIdx-1];
        /*
        if (!compareStrings(string(""), pointer2Report[repPointer].date) ||
            !compareStrings(string(""), pointer2Report[repPointer].symptoms) ||
            !compareStrings(string(""), pointer2Report[repPointer].diagnosis) ||
            !compareStrings(string(""), pointer2Report[repPointer].prescription)) {
            return;
        }
        */
        if (pointer2Report[repPointer].doctor == msg.sender) {
            pointer2Report[repPointer].date = date;
            pointer2Report[repPointer].symptoms = symptoms;
            pointer2Report[repPointer].diagnosis = diagnosis;
            pointer2Report[repPointer].prescription = prescription;
            return;
        }
        //emit not supposed to be filled out by this doctor
    }


    function getRepCount() public view returns(int) {
        if (compareStrings(getType(msg.sender), string("N/A"))) {
            //emit create account first
            return -1;
        } else if (compareStrings(getType(msg.sender), string("doctor"))) {
            //emit only for doctor
            return -1;
        }
        for (uint i = 0; i < regAddr.length; i++) {
            if (regAddr[i] == msg.sender) {
                break;
            }
            if (i == regAddr.length - 1) {
                return 0;
            }
        }
        bytes32[] memory pointerArray = addr2pointer[msg.sender];
        return int(pointerArray.length);
    }

    //only for patient
    //idx from 1 to n
    function getRep(uint idx) public view returns(string memory, string memory, string memory, string memory, bool, address[] memory) {
        address[] memory nullarray = new address[](0);
        if (compareStrings(getType(msg.sender), string("N/A"))) {
            //emit create account first
            return ("","","","",true,nullarray);
        } else if (compareStrings(getType(msg.sender), string("doctor"))) {
            //emit only for doctor
            return ("","","","",true,nullarray);
        } else if (idx > addr2pointer[msg.sender].length) {
            return ("","","","", true, nullarray);
        } else {
            bytes32 repPointer = addr2pointer[msg.sender][idx-1];
            string memory date = pointer2Report[repPointer].date;
            string memory symptoms = pointer2Report[repPointer].symptoms;
            string memory diagnosis = pointer2Report[repPointer].diagnosis;
            string memory prescription = pointer2Report[repPointer].prescription;
            bool released = pointer2Report[repPointer].released;
            address[] memory openTo = pointer2Report[repPointer].openTo;
            return (date, symptoms, diagnosis, prescription, released, openTo);
        }
    }


    //only for doctor
    function viewRep(address patAddr, uint repIdx) public view returns(string memory,
     string memory, string memory, string memory) {
        if (compareStrings(getType(msg.sender), string("N/A"))) {
            //emit create account first
            return ("","","","");
        } 
        for (uint i = 0; i < regAddr.length; i++) {
            if (regAddr[i] == patAddr) {
                break;
            }
            if (i == regAddr.length - 1) {
                //emit patAddr not registered for any appointment
                return ("","","","");
            }
        }
        if (repIdx > addr2pointer[patAddr].length) {
            //emit report index out of bounds
            return ("","","","");
        }
        bytes32 repPointer = addr2pointer[patAddr][repIdx-1];
        if (pointer2Report[repPointer].released) {
            Report memory rep = pointer2Report[repPointer];
            return (rep.date, rep.symptoms, rep.diagnosis, rep.prescription);
        }
        address[] memory openList = pointer2Report[repPointer].openTo;
        for (uint i = 0; i < openList.length; i++) {
            if (openList[i] == msg.sender) {
                Report memory rep = pointer2Report[repPointer];
                return (rep.date, rep.symptoms, rep.diagnosis, rep.prescription);
            }
        }
        return ("","","","");
    }


    function getThisType() public view returns(string memory) {
        for (uint i = 0; i < infoedAddr.length; i++) {
            if (infoedAddr[i] == msg.sender) break;
            if (i == infoedAddr.length - 1) {
                //emit addr not exist
                return string("N/A");
            }
        }
        return addr2PI[msg.sender].PItype;
    }

    //check user type
    function getType(address addr) public view returns(string memory) {
        for (uint i = 0; i < infoedAddr.length; i++) {
            if (infoedAddr[i] == addr) break;
            if (i == infoedAddr.length - 1) {
                //emit addr not exist
                return string("N/A");
            }
        }
        return addr2PI[addr].PItype;
    }


    //string check
    function compareStrings(string memory a, string memory b) public pure returns(bool) {
        return (keccak256(abi.encodePacked((a))) == keccak256(abi.encodePacked((b))));
    }
    
    function getAddress() public view returns(address) {
        return msg.sender;
    }

    /*
    function toBytes(AddrWithIdx memory a) public pure returns (bytes memory) {
        return abi.encode(a.addr, a.index);
    }
    */
}
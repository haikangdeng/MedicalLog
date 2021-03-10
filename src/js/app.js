App = {
  web3Provider: null,
  contracts: {},

  initWeb3: async function() {
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
    // Request account access
        await window.ethereum.enable();
      } catch (error) {
    // User denied account access...
        console.error("User denied account access")
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(App.web3Provider);
    return App.initContract();
  },


  initContract: function() {
    $.getJSON('Hospital.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with @truffle/contract
      App.contracts.Hospital = TruffleContract(data);
      // Set the provider for our contract
      App.contracts.Hospital.setProvider(App.web3Provider);
      return App.init();
    });
    //return App.createAccountButton(), App.registerButton();
    return App.createAccountButton(), App.registerButton(), 
      App.getReportButton(), App.releaseButton(), App.showButton(),
      App.showTriggerButton(), App.fillReportButton(), App.searchReportButton();
  },


  init: async function() {
    // handleCreateAccount?

    $('.row-register').find('button').attr("disabled",true);
    App.contracts.Hospital.deployed().then(function(instance){
      return instance.getThisType();
    }).then(function(ret) {
      //console.log(ret);
      if(ret == "patient" || ret == "N/A"){
        document.getElementById("patientSite").style.display="";
        App.markAccountCreated();
      } if(ret == "doctor"){
        document.getElementById("doctorSite").style.display="";
        App.markDocAcct();
      } 
    });
  },


  markDocAcct: function(){
    App.contracts.Hospital.deployed().then(function(instance) {
      return instance.getPI();
    }).then(function(ret) {
      //console.log(group);
      var DaccountRow = $('#DaccountRow');
      var DaccountTemplate = $('#DaccountTemplate');
      DaccountTemplate.find('.DocName').text(ret[0]);
    });

    App.contracts.Hospital.deployed().then(function(instance) {
      return instance.getAddress();
    }).then(function(addr) {
      var DaccountRow = $('#DaccountRow');
      var DaccountTemplate = $('#DaccountTemplate');
      document.getElementById("DaccountTemplate").style.display="none";
      DaccountTemplate.find('.DocAddr').text(addr);
      DaccountRow.append(DaccountTemplate.html());
    });
  },



  searchReportButton: function() {
    $(document).on('click','.btn-search2', App.handleSearchReport);
  },

  fillReportButton: function() {
    $(document).on('click','.btn-fillReport2', App.handleFillReport);
  },

  createAccountButton: function() {
    $(document).on('click', '.btn-createAccount2', App.handleCreateAccount);
  },

  registerButton: function() {
    $(document).on('click', '.btn-register2', App.handleRegister);
  },

  getReportButton: function() {
    $(document).on('click', '.btn-getReport', App.handleGetReport);
  },

  releaseButton: function() {
    $(document).on('click', '.btn-release', App.handleRelease);
  },

  showTriggerButton: function() {
    $(document).on('click', '.btn-openTo', App.showTrigger);
  },

  showButton: function() {
    $(document).on('click', '.btn-show2', App.handleShow);
  },


  handleSearchReport: function(event) {
    var VRAddr = document.getElementById("VRAddr").value;
    //console.log(VRAddr);
    var VRIdx = document.getElementById("VRIdx").value;
    //console.log(VRIdx);
    App.contracts.Hospital.deployed().then(function(instance){
      return instance.viewRep(VRAddr, VRIdx);
    }).then(function(result) {
      //console.log(result);
      var viewAS = $('#viewAfterSearch');
      viewAS.find('.SRDate').text(result[0]);
      viewAS.find('.SRSymptoms').text(result[1]);
      viewAS.find('.SRDiagnosis').text(result[2]);
      viewAS.find('.SRPrescription').text(result[3]);
    });
  },


  handleFillReport: function(event) {
    var DFAddr = document.getElementById('DFAddr').value;
    var DFIdx = document.getElementById('DFIdx').value;
    var DFSymptoms = document.getElementById("DFSymptoms").value;
    var DFPrescription = document.getElementById("DFPrescription").value;
    var DFDiagnosis = document.getElementById("DFDiagnosis").value;
    var DFDate = document.getElementById('DFDate').value;
    var DFInstance;
    App.contracts.Hospital.deployed().then(function(instance){
      return instance.fillRep(DFAddr,DFIdx,DFDate,DFSymptoms,DFDiagnosis,DFPrescription);
    }).then(function(result) {
      return App.markAccountCreated();
    });
  },


  showTrigger: function(event) {
    event.preventDefault();
    var repId = parseInt($(event.target).data('id'));
    //console.log(repId);
    $('#showModalCenter').find('.btn-show2').attr('data-id', repId);
    var out = $('#showModalCenter').find('.btn-show2').data('id');
    //console.log(out);
  },


  handleShow: function(event) {
    event.preventDefault();
    var repId = parseInt($(event.target).data('id'));
    //console.log(repId);
    var addr = document.getElementById('showDocAddr').value;
    App.contracts.Hospital.deployed().then(function(instance){
      return instance.showRepTo(repId, addr);
    }).then(function(result){
      App.handleGetReport(false);
    });
  },


  handleRelease: function(event) {
    event.preventDefault();
    var repId = parseInt($(event.target).data('id'));
    //console.log(repId);
    App.contracts.Hospital.deployed().then(function(instance){
      return instance.releaseRep(repId);
    }).then(function(result) {
      return App.markRelease(repId);
    });
  },

  markRelease: function(repId) {
    $('.panel-report').eq(repId-1).find('.btn-release').text("Disclosed").attr('disabled', true);
  },

  handleRegister: function(event) {
    var DocAddr = document.getElementById('RegDocAddr').value;
    var RegInstance;
    App.contracts.Hospital.deployed().then(function(instance){
      RegInstance = instance;
      return RegInstance.register(DocAddr);
    }).then(function() {
      return App.handleGetReport(false);
    }).catch(function (err) {
      console.log(err.message);
    });
  },


  handleCreateAccount: function(event) {
    var CAName = document.getElementById('CAName').value;
    var CAAge = document.getElementById('CAAge').value;
    var CAGender = document.getElementById('CAGender').value;
    var CAInstance;
    App.contracts.Hospital.deployed().then(function(instance){
      CAInstance = instance;
      return CAInstance.createAccount(CAName, CAAge, CAGender);
    }).then(function(result) {
      return App.markAccountCreated();
    });
  },


  handleGetReport: function(refresh) {
    //console.log("handlegetReport called");
    //console.log(refresh);
    if (!refresh || document.getElementById('getReportButton').value == "show") {
      //initiate
      document.getElementById('reportRow').innerHTML = "";
      var VRInstance;
      App.contracts.Hospital.deployed().then(function(instance){
        VRInstance = instance;
        return VRInstance.getRepCount();
      }).then(function(value){
        //console.log(value);
        var reportRow = $('#reportRow');
        var reportTemplate = $('#reportTemplate');
        var shownToRow = $('#shownToRow');

        var retValue = value.toNumber();
        if (retValue == -1 || retValue == 0) {
          return;
        }
        for (let i = 1; i <= retValue; i++) {
          App.contracts.Hospital.deployed().then(function(instance){
            //console.log(i);
            return instance.getRep(i);
          }).then(function(ret){
            //console.log(ret);
            if(ret[0] == ""){
              reportTemplate.find('.VRHeading').text("Report " + i.toString() + "  --Pending");
            } else {
              reportTemplate.find('.VRHeading').text("Report " + i.toString());
            }
            reportTemplate.find('.VRDate').text(ret[0]);
            reportTemplate.find('.VRSymptoms').text(ret[1]);
            reportTemplate.find('.VRDiagnosis').text(ret[2]);
            reportTemplate.find('.VRPrescription').text(ret[3]);
            reportTemplate.find('.btn-release').attr('data-id', i);
            reportTemplate.find('.btn-openTo').attr('data-id', i);

            shownToRow.append("<br/> <strong>Report Shown To:</strong> <br/>");
            for(let j = 0; j < ret[5].length; j++){
              shownToRow.append(ret[5][j] + "<br/>");
            }
            reportRow.append(reportTemplate.html());
            shownToRow.empty();

            if(ret[4]){
              App.markRelease(i);
            }
          });
        }

      }).catch(function (err) {
        console.log(err.message);
      });
      $('.row-getReport').find('button').text('Hide Reports');
      document.getElementById('getReportButton').value = "hide";

    } else {
      //var reportRow = $('#reportRow');
      document.getElementById('reportRow').innerHTML = "";
      $('.row-getReport').find('button').text('View Reports');
      document.getElementById('getReportButton').value = "show";
    }
  },


  markAccountCreated: function(event) {
    var accountInstance;
    var retContent;

    App.contracts.Hospital.deployed().then(function(instance) {
      accountInstance = instance;
      var result = accountInstance.getPI();
      return result;
    }).then(function(group) {
      //console.log(group);
      var accountRow = $('#accountRow');
      var accountTemplate = $('#accountTemplate');
      if (group[0] == '' && group[1] == 0 && group[2] == ''){
        $('.row-register').find('button').attr("disabled",true);
        $('.row-getReport').find('button').attr("disabled",true);
      } else {
        accountTemplate.find('.PIName').text(group[0]);
        accountTemplate.find('.PIAge').text(group[1]);
        accountTemplate.find('.PIGender').text(group[2]);
        accountRow.append(accountTemplate.html());
        document.getElementById('createRow').remove();
        //$('.row-register').find('button').click(function);
        $('.row-register').find('button').removeAttr('disabled');
        $('.row-getReport').find('button').removeAttr('disabled');
      }
    });
  },

};



$(function() {
  $(window).load(function() {
    App.initWeb3();
  });
});

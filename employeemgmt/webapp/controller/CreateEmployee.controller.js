sap.ui.define([
    "aapg/employeemgmt/controller/Base.controller",
    "sap/m/MessageBox"
],
    /**
     * @param {typeof aapg.employeemgmt.controller.Base} Base
     * @param {typeof sap.m.MessageBox} MessageBox
     */
    function (Base, MessageBox) {
        "use strict";

        return Base.extend("aapg.employeemgmt.controller.CreateEmployee", {
            onInit: function () {

                this.getView().setBusyIndicatorDelay(200);

                //Para tener acceso en todo el controlador de una forma mas directa
                this._oWizard = this.byId("wizardCreateEmployee");
                this._oNavContainer = this.byId("navContainer");
                this._oCreatePage = this.byId("wizardCreatePage");

                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.getRoute("RouteCreateEmployee").attachPatternMatched(this._onObjectMatched, this);

                this._filesQty;

            },

            _onObjectMatched: function (oEvent) {

                //Temporal
                this.getView().getModel("employeesModel").setUseBatch(true);

                //Cada vez que se navegue a la vista se debe 
                //inicializar los valores por defecto del modelo
                this._initDefaultConfig();

                //Se debe inicializar la configuración de campos
                //dependiendo del tipo de empleado
                this.setEmployeeType();

                //Inicializar items del uploadCollection y el contador de archivos
                this.getView().byId("uploadFile").destroyItems();
                this._filesQty = 0;

                //Navegar a la vista del wizard en caso de que por alguna razón se encuentre
                //la app en la vista revisión
                this._oNavContainer.to(this.byId("wizardCreatePage"));

                //Si el paso en curso no es el inicial, se le indica al 
                //wizard que se inicialice
                if (this._oWizard.getProgressStep() !== this.getView().byId("wizardEmplTypeStep")) {
                    this._oWizard.discardProgress(this.getView().byId("wizardEmplTypeStep"));
                }

            },

            onAfterRendering: function () {
            },

            _initDefaultConfig: function () {
                //Inicializar valores por defecto (no los de configuración)
                var oConfigModel = this.getView().getModel("createEmplConfig");
                var oConfigData = oConfigModel.getData();

                oConfigData.EmplTypeSelectedKey = "internConfig";
                oConfigData.EmployeeId = "";
                oConfigData.Name = "";
                oConfigData.LastName = "";
                oConfigData.DNI = "";
                oConfigData.CIF = "";
                oConfigData.CreationDate = null;
                oConfigData.Commentary = "";
                oConfigData.SalaryMin = 0;
                oConfigData.SalaryMax = 0;
                oConfigData.CurrentSalary = 0
                oConfigData.Files = [];
                oConfigData.FilesCount = 0;

                //Inicializar las variables de control de estados de los campos
                oConfigData.NameState = true;
                oConfigData.LastNameState = true;
                oConfigData.DNIState = true;
                oConfigData.CIFState = true;
                oConfigData.CreationDateState = true;
                oConfigData.CommentaryState = true;

                oConfigData.NameFilled = false;
                oConfigData.LastNameFilled = false;
                oConfigData.DNIFilled = false;
                oConfigData.CIFFilled = false;
                oConfigData.CreationDateFilled = false;
                oConfigData.DNIVisible = null;
                oConfigData.SalaryVisible = null;

                oConfigModel.refresh();

            },

            setEmployeeType: function (oEvent) {
                //Ajustar configuración de campos dependiendo  del tipo de empleado
                //pero basado en configuración establecida en modelo json

                var oConfigModel = this.getView().getModel("createEmplConfig");
                var oConfigData = oConfigModel.getData();

                //Obtener la configuración que corresponde aplicar dependiendo 
                //del tipo de empleado seleccionado
                var oConfig = this.getView().getModel("createEmplConfig").getProperty("/" + oConfigData.EmplTypeSelectedKey);

                //Aplicar configuración, con esto se ajustan automáticamente 
                //los campos en la vista
                //Estas variables particulares controlan si se muestra el DNI/CIF y el
                //Salario/Precio en el wizard y en la vista de review
                oConfigData.DNIVisible = oConfig.DNIVisible;
                oConfigData.DNIObligatory = oConfig.DNIObligatory;
                oConfigData.CIFVisible = oConfig.CIFVisible;
                oConfigData.CIFObligatory = oConfig.CIFObligatory;
                oConfigData.SalaryVisible = oConfig.SalaryVisible;
                //Estas variables establecen la información que debe mostrar el Slide Control
                oConfigData.SalaryMin = oConfig.Salary.SalaryMin;
                oConfigData.SalaryMax = oConfig.Salary.SalaryMax;
                oConfigData.CurrentSalary = oConfig.Salary.DefaultSalary;
                oConfigModel.refresh();

            },

            validateName: function (oEvent) {

                var oConfigModel = this.getView().getModel("createEmplConfig");
                var oConfigData = oConfigModel.getData();

                if (this._validateInputField(oEvent.getSource(), true)) {
                    oConfigData.NameState = true;
                    oConfigData.NameFilled = true;
                } else {
                    oConfigData.NameState = false;
                    oConfigData.NameFilled = false;
                }

                oConfigModel.refresh();
                this._validateStep2(oConfigData);

            },

            validateLastName: function (oEvent) {

                var oConfigModel = this.getView().getModel("createEmplConfig");
                var oConfigData = oConfigModel.getData();

                if (this._validateInputField(oEvent.getSource(), true)) {
                    oConfigData.LastNameState = true;
                    oConfigData.LastNameFilled = true;
                } else {
                    oConfigData.LastNameState = false;
                    oConfigData.LastNameFilled = false;
                }

                oConfigModel.refresh();
                this._validateStep2(oConfigData);

            },

            validateDNI: function (oEvent) {

                var oInput = this.getView().byId("employeeDNI");
                var oConfigModel = this.getView().getModel("createEmplConfig");
                var oConfigData = oConfigModel.getData();
                var bChecked = false;

                //Se valida el formato del DNI solo con el evento change
                if (oEvent.sId === "liveChange" && (this._validateInputField(oInput))) {
                    bChecked = true;
                } else if (oEvent.sId === "change" && this._validateInputField(oInput) && this._checkDNIFormat(oInput.getValue())) {
                    bChecked = true;
                }

                if (bChecked) {
                    oConfigData.DNIState = true;
                    oConfigData.DNIFilled = true;
                } else {
                    oConfigData.DNIState = false;
                    oConfigData.DNIFilled = false;
                }

                oConfigModel.refresh();
                this._validateStep2(oConfigData);

            },

            _checkDNIFormat: function (sDNI) {

                var iNumber;
                var sLetter;
                var sLetterList;
                var regularExp = /^\d{8}[a-zA-Z]$/;

                //Se comprueba que el formato es válido
                if (regularExp.test(sDNI) === true) {
                    //Número
                    iNumber = sDNI.substr(0, sDNI.length - 1);
                    //Letra
                    sLetter = sDNI.substr(sDNI.length - 1, 1);
                    iNumber = iNumber % 23;

                    sLetterList = "TRWAGMYFPDXBNJZSQVHLCKET";
                    sLetterList = sLetterList.substring(iNumber, iNumber + 1);

                    if (sLetterList !== sLetter.toUpperCase()) {
                        //Error
                        return false;
                    } else {
                        //Correcto
                        return true;
                    }
                } else {
                    //Error
                    return false;
                }

            },

            validateCIF: function (oEvent) {

                var oInput = this.getView().byId("employeeCIF");
                var oConfigModel = this.getView().getModel("createEmplConfig");
                var oConfigData = oConfigModel.getData();
                var bChecked = false;

                //Se valida el formato del CIF solo con el evento change
                if (oEvent.sId === "liveChange" && (this._validateInputField(oInput))) {
                    bChecked = true;
                } else if (oEvent.sId === "change" && this._validateInputField(oInput) && this._checkCIFFormat(oInput.getValue())) {
                    bChecked = true;
                }

                if (bChecked) {
                    oConfigData.CIFState = true;
                    oConfigData.CIFFilled = true;
                } else {
                    oConfigData.CIFState = false;
                    oConfigData.CIFFilled = false;
                }

                oConfigModel.refresh();
                this._validateStep2(oConfigData);

            },

            _checkCIFFormat: function (sCIF) {
                //Rutina para validar formato del CIF tomada de fuente https://jsfiddle.net/juglan/rexdzh6v/

                sCIF = sCIF.toUpperCase();

                if (!sCIF || sCIF.length !== 9) {
                    return false;
                }

                var letters = ['J', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
                var digits = sCIF.substr(1, sCIF.length - 2);
                var letter = sCIF.substr(0, 1);
                var control = sCIF.substr(sCIF.length - 1);
                var sum = 0;
                var i;
                var digit;

                if (!letter.match(/[A-Z]/)) {
                    return false;
                }

                for (i = 0; i < digits.length; ++i) {
                    digit = parseInt(digits[i]);

                    if (isNaN(digit)) {
                        return false;
                    }

                    if (i % 2 === 0) {
                        digit *= 2;
                        if (digit > 9) {
                            digit = parseInt(digit / 10) + (digit % 10);
                        }

                        sum += digit;
                    } else {
                        sum += digit;
                    }
                }

                sum %= 10;
                if (sum !== 0) {
                    digit = 10 - sum;
                } else {
                    digit = sum;
                }

                if (letter.match(/[ABEH]/)) {
                    return String(digit) === control;
                }
                if (letter.match(/[NPQRSW]/)) {
                    return letters[digit] === control;
                }

                return String(digit) === control || letters[digit] === control;
            },

            validateDate: function (oEvent) {

                var oConfigModel = this.getView().getModel("createEmplConfig");
                var oConfigData = oConfigModel.getData();

                if (this._validateInputField(oEvent.getSource()) && oEvent.getSource().isValidValue()) {
                    oConfigData.CreationDateState = true;
                    oConfigData.CreationDateFilled = true;
                } else {
                    oConfigData.CreationDateState = false;
                    oConfigData.CreationDateFilled = false;
                }

                oConfigModel.refresh();
                this._validateStep2(oConfigData);

            },

            _validateInputField: function (oInput, bCheckRegExp) {

                //Validar si el campo posee entrada y que no sean solo espacios
                if (oInput.getValue() === "" || (oInput.getValue().length === (oInput.getValue().split(" ").length - 1))) {
                    return false;
                } else if (bCheckRegExp) {
                    //Validar el texto con expresión regular
                    var sExpReg = /^([a-zA-ZÑñÁáÉéÍíÓóÚúÜü\s]{1,40})$/;

                    if (!sExpReg.exec(oInput.getValue())) {
                        return false;
                    }

                }

                return true;

            },

            _validateStep2: function (oData) {
                //Validar si los campos del paso 2 se 
                //encuentran correctos para habilitar el siguiente paso
                if (this._checkAllFlags()) {

                    this._oWizard.validateStep(this.getView().byId("wizardEmplDataStep"));

                } else {

                    this._oWizard.invalidateStep(this.getView().byId("wizardEmplDataStep"));

                }

            },

            onWizardCompleted: function (oEvent) {

                var oi18n = this.getView().getModel("i18n").getResourceBundle();

                if (this._checkAllFlags()) {

                    //Navegar a la vista de revisión al culminar el wizard
                    this._setFileDataToModel();
                    this._oNavContainer.to(this.byId("wizardReviewPage"));

                } else {
                    //Existen campos con errores
                    MessageBox.error(oi18n.getText("fieldsIncomplete"), {
                        title: oi18n.getText("createEmployeeMsgTitle")
                    });
                }

            },

            _checkAllFlags: function () {
                //Validar los flags de control de campos
                var oData = this.getView().getModel("createEmplConfig").getData();

                if (oData.DNIVisible) {
                    var bFilled = oData.DNIFilled;
                    var bState = oData.DNIState;
                } else {
                    bFilled = oData.CIFFilled;
                    bState = oData.CIFState;
                }

                if ((oData.NameFilled && oData.LastNameFilled && oData.CreationDateFilled && bFilled)
                    && (oData.NameState && oData.LastNameState && oData.CreationDateState && bState)
                    && oData.CommentaryState) {
                    //Todo OK
                    return true;
                } else {
                    return false;
                }

            },

            _setFileDataToModel: function () {
                //Preparar listado de archivos
                var oi18n = this.getView().getModel("i18n").getResourceBundle();
                var oUpdCollection = this.getView().byId("uploadFile");
                var aFileItems = [];

                if (oUpdCollection.getItems().length > 0) {

                    var aUpdItems = oUpdCollection.getItems();

                    for (var item in aUpdItems) {
                        aUpdItems[item].getFileName();
                        aFileItems.push({
                            FileName: aUpdItems[item].getFileName(),
                            FileStatus: oi18n.getText("fileReadyUpload")
                        });
                    }

                }

                this.getView().getModel("createEmplConfig").setProperty("/Files", aFileItems);
                this.getView().getModel("createEmplConfig").setProperty("/FilesCount", aFileItems.length);

            },

            onEditStep: function (oEvent) {
                //Gestionar navegación a un paso para ser editado
                //El paso a editar depende del valor recibido como 
                //parámetro editToStep

                var iStep = parseInt(oEvent.getSource().data("editToStep"));

                var fnAfterNavigate = function () {
                    this._oWizard.goToStep(this._oWizard.getSteps()[iStep]);
                    this._oNavContainer.detachAfterNavigate(fnAfterNavigate);
                }.bind(this);

                this._oNavContainer.attachAfterNavigate(fnAfterNavigate);
                this._oNavContainer.backToPage(this._oCreatePage.getId());

            },

            onSaveEmployee: function (oEvent) {

                var oi18n = this.getView().getModel("i18n").getResourceBundle();

                MessageBox.confirm(oi18n.getText("confirmSaveEmployee"), {
                    title: oi18n.getText("createEmployeeMsgTitle"),
                    actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                    emphasizedAction: MessageBox.Action.YES,
                    onClose: this._saveEmployee.bind(this)
                });

            },

            _saveEmployee: function (sAction) {
                //Guardar Empleado en Backend

                if (sAction !== "YES") {
                    return;
                }

                var oConfigData = this.getView().getModel("createEmplConfig").getData();
                var oEmployeesModel = this.getView().getModel("employeesModel");
                var oi18n = this.getView().getModel("i18n").getResourceBundle();

                switch (oConfigData.EmplTypeSelectedKey) {
                    case "internConfig":
                        var sEmployeeType = "0";
                        break;
                    case "SelfConfig":
                        sEmployeeType = "1";
                        break;
                    case "ManagerConfig":
                        sEmployeeType = "2";
                        break;
                }

                if (oConfigData.DNIVisible) {
                    var sDNI = oConfigData.DNI;
                } else {
                    sDNI = oConfigData.CIF;
                }

                var oBody = {
                    SapId: this.getOwnerComponent().SapId,
                    Type: sEmployeeType,
                    FirstName: oConfigData.Name,
                    LastName: oConfigData.LastName,
                    Dni: sDNI,
                    CreationDate: oConfigData.CreationDate,
                    Comments: oConfigData.Commentary,
                    UserToSalary: [
                        {
                            Amount: oConfigData.CurrentSalary.toString(),
                            Comments: oConfigData.Commentary,
                            Waers: oConfigData.DefaultCurrency
                        }]
                };

                this.getView().setBusy(true);
                oEmployeesModel.create("/Users", oBody, {
                    success: function (data) {
                        this.getView().getModel("createEmplConfig").setProperty("/EmployeeId", data.EmployeeId);
                        //Ejecutar Carga de archivos
                        this._uploadFiles();
                    }.bind(this),
                    error: function (error) {
                        this.getView().setBusy(false);
                        MessageBox.error(oi18n.getText("employeeNotSaved"), {
                            title: oi18n.getText("createEmployeeMsgTitle")
                        });
                    }.bind(this)
                });

            },

            _uploadFiles: function (oEvent) {
                //Cargar archivos (solo si existen archivos para enviar al servidor)
                var oUpdCollection = this.getView().byId("uploadFile");

                if (oUpdCollection.getItems().length > 0) {
                    oUpdCollection.upload();
                } else {
                    this._confirmEmployeeSaved();
                }

            },

            onFileBeforeUpload: function (oEvent) {
                //Agregar parámetro slug a la cabecera de la petición

                //Se obtiene el ID del emlpeado y se llama a la función padre en el controlador Base
                var sEmployeeId = this.getView().getModel("createEmplConfig").getProperty("/EmployeeId");
                Base.prototype.onFileBeforeUpload.apply(this, [oEvent, sEmployeeId]);

            },

            onFileUploadComplete: function (oEvent) {
                //Informar al usuario que se ha creado el empleado
                this._filesQty--;
                if (this._filesQty === 0) {
                    this._confirmEmployeeSaved();
                }
            },

            _confirmEmployeeSaved: function () {
                //Informar al usuario que se ha creado el empleado
                var oi18n = this.getView().getModel("i18n").getResourceBundle();
                this.getView().setBusy(false);
                MessageBox.information(oi18n.getText("employeeSaved", [this.getView().getModel("createEmplConfig").getProperty("/EmployeeId")]), {
                    title: oi18n.getText("createEmployeeMsgTitle"),
                    onClose: this._cancelWizard.bind(this)
                });

            },

            onCancelWizard: function (oEvent) {
                //Cancelar Wizard
                var oi18n = this.getView().getModel("i18n").getResourceBundle();
                MessageBox.confirm(oi18n.getText("confirmCancelWizard"), {
                    title: oi18n.getText("cancelMsgTitle"),
                    actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                    emphasizedAction: MessageBox.Action.YES,
                    onClose: this._cancelWizard.bind(this)
                });

            },

            _cancelWizard: function (sAction) {

                if (sAction === "YES" || sAction === "OK") {

                    this._navBack();

                    //Descartar posibles avances del wizard
                    jQuery.sap.delayedCall(1000, this, function () {
                        //Para que no se vea el proceso mientras se navega al launchpad
                        this._oWizard.discardProgress(this.getView().byId("wizardEmplTypeStep"));
                    }.bind(this));

                }
            }

        });
    });
